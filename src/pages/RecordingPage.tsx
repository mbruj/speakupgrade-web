import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSessionStore } from '../store'

// Free/Pro keep the 12-minute cap. Team members (teamSession flag set by SetupPage) get 30 minutes.
const SOLO_MAX_SECONDS = 12 * 60
const TEAM_MAX_SECONDS = 30 * 60

// Roughly constant frame count regardless of duration: spread further apart for longer pitches,
// so delivery is judged across the WHOLE pitch, not just the opening.
const TARGET_FRAME_COUNT = 45

function isMobileDevice() {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
}

// Module-level storage: survives React unmount
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
  const facing: 'user' | 'environment' = (location.state as any)?.facing ?? 'user'
  const hideCameraPreference: boolean = (location.state as any)?.hideCamera ?? false

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

  const isChallenge = !!(params as any)?.isChallenge
  const isQuick = !!(params as any)?.quick
  const maxSeconds = isChallenge ? 5 * 60 : isQuick ? 90 : (params as any)?.teamSession ? TEAM_MAX_SECONDS : SOLO_MAX_SECONDS
  const frameIntervalMs = Math.round((maxSeconds * 1000) / TARGET_FRAME_COUNT)

  useEffect(() => {
    if (!params) { navigate('/setup'); return }
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
      const audioConstraints = { echoCancellation: true, noiseSuppression: true, sampleRate: 16000 }
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: audioConstraints,
          video: isMobile
            ? { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } }
            : { width: { ideal: 1280 }, height: { ideal: 720 } },
        })
      } catch {
        // Camera refused or missing: the pitch still gets graded on audio
        stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints })
      }
      streamRef.current = stream

      videoRef.current.srcObject = stream
      videoRef.current.muted = true
      videoRef.current.play().catch(() => {})

      // Small frames: enough for eye contact, posture and gestures
      canvasRef.current.width = 160
      canvasRef.current.height = 120

      const audioTracks = stream.getAudioTracks()
      if (audioTracks.length === 0) {
        console.error('No audio tracks found')
        navigate('/setup')
        return
      }

      const audioStream = new MediaStream(audioTracks)
      // Plain audio/webm: codec specification breaks OpenAI Whisper on the backend
      _mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : 'audio/ogg'

      const recorder = new MediaRecorder(audioStream, { mimeType: _mimeType })
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) _audioChunks.push(e.data)
      }
      recorder.start(500)
      mediaRecorderRef.current = recorder

      startTimeRef.current = Date.now()

      timerRef.current = setInterval(() => {
        const secs = Math.floor((Date.now() - startTimeRef.current) / 1000)
        setElapsed(secs)
        if (secs >= maxSeconds) handleStop()
      }, 500)

      // First frame after 1.5s (camera needs a moment), then evenly spaced
      if (stream.getVideoTracks().length > 0) {
        setTimeout(captureFrame, 1500)
        frameTimerRef.current = setInterval(() => {
          if (_frames.length < TARGET_FRAME_COUNT + 5) captureFrame()
        }, Math.min(frameIntervalMs, 15000))
      }
    } catch (err) {
      console.error('Recording init error:', err)
      navigate('/setup')
    }
  }

  const captureFrame = () => {
    if (!videoRef.current || _frames.length >= TARGET_FRAME_COUNT + 5) return
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return
    try {
      ctx.drawImage(videoRef.current, 0, 0, 160, 120)
      const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.4)
      const base64 = dataUrl.split(',')[1]
      if (base64 && base64.length > 100) _frames.push(base64)
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
      navigate('/setup')
      return
    }

    if (recorder.state === 'recording') recorder.requestData()
    await new Promise(r => setTimeout(r, 400))

    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve()
      if (recorder.state !== 'inactive') recorder.stop()
      else resolve()
    })

    streamRef.current?.getTracks().forEach((t) => t.stop())

    if (_audioChunks.length === 0) {
      console.error('No audio chunks')
      navigate('/setup')
      return
    }

    try {
      const blob = new Blob(_audioChunks, { type: _mimeType })
      const audioBase64 = await blobToBase64(blob)
      navigate('/grading', {
        state: { audioBase64, audioType: _mimeType, frames: _frames, actualSeconds },
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

      {cameraHidden && (
        <div style={{ position: 'absolute', inset: 0, background: '#09090B', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, textAlign: 'center', padding: '0 24px' }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: '#8B8B94', margin: 0 }}>YOU ARE PITCHING</p>
          <p style={{ fontSize: 17, fontWeight: 600, color: '#d4d4d8', lineHeight: 1.4, margin: 0, maxWidth: 360 }}>{params?.topic}</p>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', border: '2px solid rgba(239,68,68,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 12 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#EF4444', animation: 'blink 1.2s ease-in-out infinite' }} />
          </div>
          <p style={{ color: '#52525B', fontSize: 12, margin: 0 }}>Preview hidden. The camera is still being analysed.</p>
        </div>
      )}

      {/* Timer top-left */}
      <div style={{ position: 'absolute', top: 48, left: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        {phase === 'recording' && (
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', animation: 'blink 1.2s ease-in-out infinite' }} />
        )}
        <span style={{ fontSize: 28, fontWeight: 700, color: '#ffffff', fontFamily: 'monospace', textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}>
          {fmt(elapsed)}{isChallenge ? ' / 5:00' : isQuick ? ' / 1:30' : ''}
        </span>
      </div>

      {phase === 'recording' && (
        <div style={{ position: 'absolute', top: 48, right: 20, background: 'rgba(0,0,0,0.55)', borderRadius: 20, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', letterSpacing: '0.05em' }}>REC</span>
        </div>
      )}

      {phase === 'processing' && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.15)', borderTopColor: '#ffffff', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: '#A1A1AA', fontSize: 14 }}>Processing recording...</p>
        </div>
      )}

      {phase === 'recording' && (
        <div style={{ position: 'absolute', bottom: 48, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
          <button
            onClick={() => setCameraHidden(h => !h)}
            style={{ background: 'rgba(0,0,0,0.55)', color: '#d4d4d8', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 20, padding: '10px 18px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', minHeight: 44 }}
          >
            {cameraHidden ? 'Show my preview' : 'Hide my preview'}
          </button>
          <button
            onClick={handleStop}
            style={{ background: '#EF4444', color: '#fff', fontWeight: 700, fontSize: 16, padding: '16px 44px', borderRadius: 40, border: 'none', cursor: 'pointer', fontFamily: 'inherit', minHeight: 52 }}
          >
            Finish pitch
          </button>
        </div>
      )}
    </div>
  )
}
