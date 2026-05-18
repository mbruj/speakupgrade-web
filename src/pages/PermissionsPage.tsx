import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function PermissionsPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'checking' | 'idle' | 'requesting' | 'denied'>('checking')

  useEffect(() => {
    // Try to get the stream silently — if it works, permissions are already granted
    navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      .then((stream) => {
        stream.getTracks().forEach((t) => t.stop())
        navigate('/position', { replace: true })
      })
      .catch(() => {
        // Permissions not granted — show the page
        setStatus('idle')
      })
  }, [])

  const requestPermissions = async () => {
    setStatus('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      stream.getTracks().forEach((t) => t.stop())
      navigate('/position', { replace: true })
    } catch {
      setStatus('denied')
    }
  }

  if (status === 'checking') {
    return (
      <div style={{ minHeight: '100dvh', background: '#09090B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#3B82F6', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#09090B', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>
            <span style={{ color: '#3B82F6' }}>SPEAKUP</span>
            <span style={{ color: '#ffffff' }}>GRADE</span>
          </span>
        </div>

        <div style={{ background: '#1A1A1E', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '40px 28px', textAlign: 'center', marginBottom: 20 }}>
          {status === 'denied' ? (
            <>
              <div style={{ fontSize: 40, marginBottom: 16, color: '#EF4444', fontWeight: 700 }}>✕</div>
              <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Access blocked</h2>
              <p style={{ color: '#A1A1AA', fontSize: 14, lineHeight: 1.7 }}>
                Click the lock icon in your browser's address bar, set Camera and Microphone to <strong>Allow</strong>, then refresh.
              </p>
            </>
          ) : (
            <>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 24 }}>
                🎙
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Camera & microphone</h2>
              <p style={{ color: '#A1A1AA', fontSize: 14, lineHeight: 1.7 }}>
                SpeakUPgrade needs camera and microphone access to analyse your speech and body language. Your recordings are never stored or shared.
              </p>
            </>
          )}
        </div>

        {status !== 'denied' ? (
          <button
            onClick={requestPermissions}
            disabled={status === 'requesting'}
            style={{ width: '100%', background: '#3B82F6', color: '#fff', fontWeight: 700, fontSize: 15, padding: '15px', borderRadius: 12, border: 'none', cursor: status === 'requesting' ? 'not-allowed' : 'pointer', opacity: status === 'requesting' ? 0.6 : 1, fontFamily: 'inherit' }}
          >
            {status === 'requesting' ? 'Requesting...' : 'Allow camera & mic'}
          </button>
        ) : (
          <button
            onClick={() => window.location.reload()}
            style={{ width: '100%', background: 'transparent', color: '#A1A1AA', fontWeight: 600, fontSize: 15, padding: '15px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Refresh page
          </button>
        )}
      </div>
    </div>
  )
}
