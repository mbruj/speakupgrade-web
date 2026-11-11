import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '../store'

// Audio-only: sales practice does not use the camera.
// Free/Pro keep the 12-minute cap. Team members (teamSession flag set by SetupPage) get 30 minutes.
const SOLO_MAX_SECONDS = 12 * 60
const TEAM_MAX_SECONDS = 30 * 60

// Module-level storage — survives React unmount
let _audioChunks: Blob[] = []
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
  const { params } = useSessionStore()
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)
  const stoppingRef = useRef(false)

  const [elapsed, setElapsed] = useState(0)
  const [phase, setPhase] = useState<'recording' | 'processing'>('recording')

  const maxSeconds = (params as any)?.teamSession ? TEAM_MAX_SECONDS : SOLO_MAX_SECONDS

  useEffect(() => {
    if (!params) { navigate('/setup'); return }
    _audioChunks = []
    stoppingRef.current = false
    startEverything()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const startEverything = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000 },
      })
      streamRef.current = stream

      if (stream.getAudioTracks().length === 0) {
        console.error('No audio tracks found')
        navigate('/setup')
        return
      }

      // Plain audio/webm: codec specification breaks OpenAI Whisper on the backend
      _mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : 'audio/ogg'

      const recorder = new MediaRecorder(stream, { mimeType: _mimeType })
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
    } catch (err) {
      console.error('Recording init error:', err)
      navigate('/setup')
    }
  }

  const handleStop = async () => {
    if (stoppingRef.current) return
    stoppingRef.current = true
    setPhase('processing')

    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }

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
      navigate('/grading', { state: { audioBase64, audioType: _mimeType, actualSeconds } })
    } catch (err) {
      console.error('Audio processing error:', err)
      navigate('/setup')
    }
  }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#09090B', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', textAlign: 'center' }}>

      <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: '#8B8B94', margin: '0 0 10px 0' }}>YOU ARE PITCHING</p>
      <p style={{ fontSize: 17, fontWeight: 600, color: '#d4d4d8', lineHeight: 1.4, margin: '0 0 4px 0', maxWidth: 360 }}>{params?.topic}</p>
      {(params as any)?.audience && (
        <p style={{ fontSize: 14, color: '#8B8B94', margin: 0 }}>to {(params as any).audience}</p>
      )}

      <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', border: '2px solid rgba(239,68,68,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '40px 0 20px 0' }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#EF4444', animation: phase === 'recording' ? 'blink 1.2s ease-in-out infinite' : 'none' }} />
      </div>

      <p style={{ fontSize: 56, fontWeight: 700, color: '#ffffff', fontFamily: 'ui-monospace, Menlo, monospace', margin: '0 0 6px 0' }}>{fmt(elapsed)}</p>
      <p style={{ fontSize: 14, color: '#A1A1AA', margin: 0 }}>Pitch as if the buyer is in front of you</p>

      {phase === 'recording' && (
        <div style={{ position: 'absolute', bottom: 48, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={handleStop}
            style={{
              background: '#EF4444', color: '#ffffff', fontWeight: 700, fontSize: 16,
              padding: '16px 40px', borderRadius: 50, border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 10, minHeight: 52,
              boxShadow: '0 4px 24px rgba(239,68,68,0.5)',
            }}
          >
            <div style={{ width: 16, height: 16, borderRadius: 3, background: '#ffffff' }} />
            <span>Finish pitch</span>
          </button>
        </div>
      )}

      {phase === 'processing' && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(9,9,11,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.15)', borderTopColor: '#ffffff', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: '#A1A1AA', fontSize: 14, margin: 0 }}>Processing recording...</p>
        </div>
      )}

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  )
}
