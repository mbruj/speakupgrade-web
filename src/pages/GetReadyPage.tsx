import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '../store'

// Audio-only. First run: one screen (microphone permission, one sentence, Start).
// After that: straight to an inline 3-2-1 countdown, then recording.

const READY_KEY = 'sua_ready_done'

export default function GetReadyPage() {
  const navigate = useNavigate()
  const { params } = useSessionStore()
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const cancelledRef = useRef(false)

  // Decided once on mount. Re-reading it every render would flip it right after the first permission grant.
  const [quick] = useState(() => { try { return localStorage.getItem(READY_KEY) === '1' } catch { return false } })
  const [slow, setSlow] = useState(false)
  const [micOk, setMicOk] = useState(false)
  const [error, setError] = useState('')
  const [count, setCount] = useState<number | null>(null)

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  const getMic = async (): Promise<boolean> => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (cancelledRef.current) { stream.getTracks().forEach((t) => t.stop()); return false }
      streamRef.current = stream
      setMicOk(true)
      try { localStorage.setItem(READY_KEY, '1') } catch {}
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
    // Short pause so the browser releases the microphone before RecordingPage asks for it
    setTimeout(() => { navigate('/recording') }, 200)
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
    getMic().then((ok) => { if (ok && quick) startCountdown() })
    return () => {
      clearTimeout(slowTimer)
      cancelledRef.current = true
      if (timerRef.current) clearInterval(timerRef.current)
      stopStream()
    }
  }, [])

  if (!params) return null

  if (count !== null) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#09090B', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, textAlign: 'center', padding: '0 32px' }}>
        <p style={{ fontSize: 15, color: '#d4d4d8', margin: 0 }}>Starting your pitch</p>
        <p style={{ fontSize: 140, fontWeight: 700, lineHeight: 1, margin: 0, color: '#fff', fontFamily: 'ui-monospace, Menlo, monospace' }}>{count}</p>
        <p style={{ fontSize: 14, color: '#A1A1AA', lineHeight: 1.5, margin: '6px 0 0 0' }}>
          {params.topic}{(params as any).audience ? <><br />to {(params as any).audience}</> : null}
        </p>
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

      <div style={{ background: '#1A1A1E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '16px 18px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#A1A1AA', margin: '0 0 6px 0' }}>YOU ARE PITCHING</p>
        <p style={{ fontSize: 17, fontWeight: 600, color: '#fff', lineHeight: 1.4, margin: 0 }}>{params.topic}</p>
        {(params as any).audience && <p style={{ fontSize: 14, color: '#A1A1AA', margin: '4px 0 0 0' }}>to {(params as any).audience}</p>}
      </div>

      {micOk ? (
        <p style={{ fontSize: 13, color: '#22C55E', margin: 0 }}>Microphone allowed</p>
      ) : error ? (
        <div>
          <p style={{ fontSize: 13, color: '#FCA5A5', margin: '0 0 10px 0', lineHeight: 1.5 }}>{error}</p>
          <button onClick={() => { getMic() }} style={{ background: 'transparent', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.5)', borderRadius: 10, padding: '10px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            Try again
          </button>
        </div>
      ) : (
        <p style={{ fontSize: 13, color: '#A1A1AA', margin: 0 }}>Waiting for microphone permission...</p>
      )}

      <div style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 14, padding: '14px 16px', fontSize: 14, lineHeight: 1.55, color: '#e4d5b0' }}>
        Pitch as if the buyer is in front of you. When you finish, they ask 3 questions out loud. You get 30 seconds for each.
      </div>

      <div style={{ flexGrow: 1 }} />

      <button
        onClick={startCountdown}
        disabled={!micOk}
        style={{ width: '100%', background: '#2563EB', color: '#fff', fontWeight: 700, fontSize: 16, padding: 17, borderRadius: 12, border: 'none', cursor: micOk ? 'pointer' : 'not-allowed', opacity: micOk ? 1 : 0.45, fontFamily: 'inherit', minHeight: 52 }}
      >
        Start in 3 seconds
      </button>
    </div>
  )
}
