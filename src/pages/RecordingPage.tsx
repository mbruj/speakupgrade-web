import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSessionStore } from '../store'

const MAX_SECONDS = 12 * 60

function isMobileDevice() {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
}

// Module-level storage — survives React unmount
let _audioChunks: Blob[] = []
let _frames: string[] = []
let _mimeType = 'audio/webm'

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export default function RecordingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const facing: 'user' | 'environment' = location.state?.facing ?? 'user'
  const hideCameraPreference: boolean = location.state?.hideCamera ?? false

  const { params } = useSessionStore()
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'))
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const frameTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)
  const stoppingRef = useRef(false)

  const [elapsed, setElapsed] = useState(0)
  const [phase, setPhase] = useState<'recording' | 'processing'>('recording')
  const [cameraHidden, setCameraHidden] = useState(hideCameraPreference)
  const isMobile = isMobileDevice()

  useEffect(() => {
    if (!params) { navigate('/setup'); return }
    // Reset module-level storage
    _audioChunks = []
    _frames = []
    stoppingRef.current = false
    startEverything()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (frameTimerRef.current) clearInterval(frameTimerRef.current)
    }
  }, [])

  const startEverything = async () => {
    if (!videoRef.current) return

    try {
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
        video: isMobile
          ? { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { width: { ideal: 1280 }, height: { ideal: 720 } },
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      // Video preview
      videoRef.current.srcObject = stream
      videoRef.current.muted = true
      videoRef.current.play().catch(() => {})

      // Canvas for frames — 160x120 minimum quality Claude needs for body language + position
      canvasRef.current.width = 160
      canvasRef.current.height = 120

      // Audio-only MediaRecorder
      const audioTracks = stream.getAudioTracks()
      if (audioTracks.length === 0) {
        console.error('No audio tracks found')
        navigate('/setup')
        return
      }

      const audioStream = new MediaStream(audioTracks)
      // Use plain audio/webm — codec specification breaks OpenAI Whisper on the backend
      _mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : 'audio/ogg'

      console.log('Recording with mimeType:', _mimeType)

      const recorder = new MediaRecorder(audioStream, { mimeType: _mimeType })

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          _audioChunks.push(e.data)
          console.log('Chunk received, size:', e.data.size, 'total chunks:', _audioChunks.length)
        }
      }

      recorder.start(500) // collect every 500ms
      mediaRecorderRef.current = recorder

      startTimeRef.current = Date.now()

      // Elapsed timer
      timerRef.current = setInterval(() => {
        const secs = Math.floor((Date.now() - startTimeRef.current) / 1000)
        setElapsed(secs)
        if (secs >= MAX_SECONDS) handleStop()
      }, 500)

      // Frame capture: first frame immediately, then every 15s, max 40 frames
      captureFrame()
      frameTimerRef.current = setInterval(() => {
        if (_frames.length < 40) captureFrame()
      }, 15_000)

    } catch (err) {
      console.error('Recording init error:', err)
      navigate('/setup')
    }
  }

  const captureFrame = () => {
    if (!videoRef.current || _frames.length >= 40) return
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return
    try {
      ctx.drawImage(videoRef.current, 0, 0, 160, 120)
      const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.4)
      const base64 = dataUrl.split(',')[1]
      if (base64 && base64.length > 100) {
        _frames.push(base64)
        console.log('Frame captured, total:', _frames.length)
      }
    } catch (err) {
      console.error('Frame capture error:', err)
    }
  }

  const handleStop = async () => {
    if (stoppingRef.current) return
    stoppingRef.current = true
    setPhase('processing')

    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    if (frameTimerRef.current) { clearInterval(frameTimerRef.current); frameTimerRef.current = null }

    const actualSeconds = Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 1000))
    const recorder = mediaRecorderRef.current

    if (!recorder) {
      console.error('No recorder found')
      navigate('/setup')
      return
    }

    // Request final chunk and wait for it
    if (recorder.state === 'recording') {
      recorder.requestData()
    }
    await new Promise(r => setTimeout(r, 400))

    // Stop recorder and wait for onstop
    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve()
      if (recorder.state !== 'inactive') {
        recorder.stop()
      } else {
        resolve()
      }
    })

    // Stop all media tracks
    streamRef.current?.getTracks().forEach((t) => t.stop())

    console.log('Total chunks after stop:', _audioChunks.length)

    if (_audioChunks.length === 0) {
      console.error('No audio chunks')
      navigate('/setup')
      return
    }

    try {
      const blob = new Blob(_audioChunks, { type: _mimeType })
      console.log('Blob size:', blob.size)

      const audioBase64 = await blobToBase64(blob)
      console.log('Base64 length:', audioBase64.length)

      navigate('/grading', {
        state: { audioBase64: audioBase64, audioType: _mimeType, frames: _frames, actualSeconds },
      })
    } catch (err) {
      console.error('Audio processing error:', err)
      navigate('/setup')
    }
  }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>

      <video
        ref={videoRef}
        playsInline
        muted
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover',
          transform: facing === 'user' ? 'scaleX(-1)' : 'none',
          opacity: cameraHidden ? 0 : 1,
        }}
      />

      {/* Black screen when camera hidden */}
      {cameraHidden && (
        <div style={{ position: 'absolute', inset: 0, background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', border: '2px solid rgba(239,68,68,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#EF4444', animation: 'blink 1.2s ease-in-out infinite' }} />
          </div>
          <p style={{ color: '#A1A1AA', fontSize: 14, fontFamily: 'inherit' }}>Recording in progress</p>
          <p style={{ color: '#52525B', fontSize: 12, fontFamily: 'inherit' }}>Camera is off — audio and analysis still active</p>
        </div>
      )}

      {/* Timer top-left */}
      <div style={{ position: 'absolute', top: 48, left: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        {phase === 'recording' && (
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', animation: 'blink 1.2s ease-in-out infinite' }} />
        )}
        <span style={{ fontSize: 28, fontWeight: 700, color: '#ffffff', fontFamily: 'monospace', textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}>
          {fmt(elapsed)}
        </span>
      </div>

      {/* REC badge top-right */}
      {phase === 'recording' && (
        <div style={{ position: 'absolute', top: 48, right: 20, background: 'rgba(0,0,0,0.55)', borderRadius: 20, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', letterSpacing: '0.05em' }}>REC</span>
        </div>
      )}

      {/* Processing overlay */}
      {phase === 'processing' && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.15)', borderTopColor: '#ffffff', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: '#A1A1AA', fontSize: 14 }}>Processing recording...</p>
        </div>
      )}

      {/* Stop button + camera toggle */}
      {phase === 'recording' && (
        <div style={{ position: 'absolute', bottom: 48, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => setCameraHidden(h => !h)}
            style={{
              background: 'rgba(0,0,0,0.55)', color: '#ffffff', fontWeight: 500, fontSize: 13,
              padding: '10px 20px', borderRadius: 50, border: '1px solid rgba(255,255,255,0.2)',
              cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            <span>{cameraHidden ? 'Show camera' : 'Hide camera'}</span>
          </button>
          <button
            onClick={handleStop}
            style={{
              background: '#EF4444', color: '#ffffff', fontWeight: 700, fontSize: 16,
              padding: '16px 40px', borderRadius: 50, border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              boxShadow: '0 4px 24px rgba(239,68,68,0.5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 16, height: 16, borderRadius: 3, background: '#ffffff' }} />
              <span>Stop Recording</span>
            </div>
            <span style={{ fontSize: 11, fontWeight: 400, opacity: 0.8 }}>Tap when done</span>
          </button>
        </div>
      )}

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  )
}
