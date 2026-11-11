import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '../store'

// Replaces Instructions + Permissions + Position.
// First run: one screen (permission, camera toggle, one sentence, Start).
// After that: straight to an inline 3-2-1, then recording.

const READY_KEY = 'sua_ready_done'
const CAMERA_KEY = 'sua_camera_on'

export default function GetReadyPage() {
  const navigate = useNavigate()
  const { params } = useSessionStore()
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const cancelledRef = useRef(false)

  // Decided once on mount. Re-reading it every render flipped it to true right after the
  // first permission grant and left the first-run screen black.
  const [quick] = useState(() => { try { return localStorage.getItem(READY_KEY) === '1' } catch { return false } })
  const [slow, setSlow] = useState(false)

  const [cameraOn, setCameraOn] = useState(() => {
    try { return localStorage.getItem(CAMERA_KEY) !== '0' } catch { return true }
  })
  const [micOk, setMicOk] = useState(false)
  const [error, setError] = useState('')
  const [count, setCount] = useState<number | null>(null)

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  const attachPreview = () => {
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.muted = true
      videoRef.current.play().catch(() => {})
    }
  }

  const getStream = async (): Promise<boolean> => {
    setError('')
    try {
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        })
      } catch {
        // Camera refused or missing: microphone alone is enough to pitch
        stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      }
      if (cancelledRef.current) { stream.getTracks().forEach((t) => t.stop()); return false }
      streamRef.current = stream
      setMicOk(true)
      try { localStorage.setItem(READY_KEY, '1') } catch {}
      attachPreview()
      return true
    } catch (err) {
      console.error('Permission error:', err)
      setMicOk(false)
      setError('We need your microphone to hear your pitch. Allow it in your browser settings, then try again.')
      return false
    }
  }

  const startCountdown = () => {
    if (timerRef.current) return
    setCount(3)
    let n = 3
    timerRef.current = setInterval(() => {
      n -= 1
      if (n <= 0) {
        if (timerRef.current) clearInterval(timerRef.current)
        timerRef.current = null
        go()
      } else {
        setCount(n)
      }
    }, 1000)
  }

  const go = () => {
    if (cancelledRef.current) return
    stopStream()
    // Short pause so the browser releases the devices before RecordingPage asks for them
    setTimeout(() => {
      navigate('/recording', { state: { facing: 'user', hideCamera: !cameraOn } })
    }, 200)
  }

  const cancel = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    stopStream()
    navigate('/setup')
  }

  useEffect(() => {
    if (!params) { navigate('/setup'); return }
    cancelledRef.current = false
    // If the quick path has not started within 5s, show the full screen instead of a blank one
    const slowTimer = setTimeout(() => setSlow(true), 5000)
    getStream().then((ok) => { if (ok && quick) startCountdown() })
    return () => {
      clearTimeout(slowTimer)
      cancelledRef.current = true
      if (timerRef.current) clearInterval(timerRef.current)
      stopStream()
    }
  }, [])

  const toggleCamera = () => {
    const next = !cameraOn
    setCameraOn(next)
    try { localStorage.setItem(CAMERA_KEY, next ? '1' : '0') } catch {}
  }

  if (!params) return null

  // Inline countdown overlay (used by both first run and quick mode)
  if (count !== null) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#101014', overflow: 'hidden' }}>
        <video
          ref={(el) => { (videoRef as any).current = el; attachPreview() }}
          playsInline muted
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', opacity: cameraOn ? 1 : 0 }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, textAlign: 'center', padding: '0 32px' }}>
          <p style={{ fontSize: 15, color: '#d4d4d8', margin: 0 }}>Starting your pitch</p>
          <p style={{ fontSize: 140, fontWeight: 700, lineHeight: 1, margin: 0, color: '#fff', fontFamily: 'ui-monospace, Menlo, monospace' }}>{count}</p>
          <p style={{ fontSize: 14, color: '#A1A1AA', lineHeight: 1.5, margin: '6px 0 0 0' }}>
            {params.topic}{params.audience ? <><br />to {params.audience}</> : null}
          </p>
        </div>
        <div style={{ position: 'absolute', bottom: 48, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
          <button onClick={cancel} style={{ fontSize: 14, fontWeight: 600, color: '#d4d4d8', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 50, padding: '13px 30px', cursor: 'pointer', fontFamily: 'inherit' }}>
            Cancel
          </button>
        </div>
      </div>
    )
  }

  // Quick mode while permission resolves: neutral screen, no flash of the full form
  if (quick && !error && !slow) {
    return <div style={{ position: 'fixed', inset: 0, background: '#09090B' }} />
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#09090B', padding: '28px 20px 32px', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <button onClick={cancel} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: '#A1A1AA', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', padding: '8px 0' }}>
        ← Back
      </button>

      <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', margin: 0, color: '#fff' }}>Get ready</h1>

      <div style={{ position: 'relative', background: '#16161a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, height: 300, overflow: 'hidden' }}>
        <video
          ref={(el) => { (videoRef as any).current = el; attachPreview() }}
          playsInline muted
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', opacity: cameraOn ? 1 : 0 }}
        />
        {!cameraOn && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B8B94', fontSize: 14 }}>
            Camera preview off
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1A1A1E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 16px' }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: '0 0 2px 0' }}>Show camera while I pitch</p>
          <p style={{ fontSize: 12, color: '#A1A1AA', margin: 0 }}>Your body language is analysed either way.</p>
        </div>
        <button
          onClick={toggleCamera}
          role="switch"
          aria-checked={cameraOn}
          aria-label="Show camera while I pitch"
          style={{ width: 44, height: 26, borderRadius: 13, background: cameraOn ? '#2563EB' : '#3f3f46', border: 'none', position: 'relative', cursor: 'pointer', flexShrink: 0 }}
        >
          <span style={{ position: 'absolute', top: 3, left: cameraOn ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.15s' }} />
        </button>
      </div>

      {micOk ? (
        <p style={{ fontSize: 13, color: '#22C55E', margin: 0 }}>Microphone allowed</p>
      ) : error ? (
        <div>
          <p style={{ fontSize: 13, color: '#FCA5A5', margin: '0 0 10px 0', lineHeight: 1.5 }}>{error}</p>
          <button onClick={() => { getStream() }} style={{ background: 'transparent', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.5)', borderRadius: 10, padding: '10px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            Try again
          </button>
        </div>
      ) : (
        <p style={{ fontSize: 13, color: '#A1A1AA', margin: 0 }}>Waiting for microphone permission...</p>
      )}

      <div style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 14, padding: '14px 16px', fontSize: 14, lineHeight: 1.55, color: '#e4d5b0' }}>
        Pitch as if the buyer is in front of you. When you stop, they ask 3 questions out loud. You get 30 seconds for each.
      </div>

      <div style={{ flexGrow: 1 }} />

      <button
        onClick={startCountdown}
        disabled={!micOk}
        style={{ width: '100%', background: '#2563EB', color: '#fff', fontWeight: 700, fontSize: 16, padding: 17, borderRadius: 12, border: 'none', cursor: micOk ? 'pointer' : 'not-allowed', opacity: micOk ? 1 : 0.45, fontFamily: 'inherit' }}
      >
        Start in 3 seconds
      </button>
    </div>
  )
}
