import { useNavigate } from 'react-router-dom'
import { useAuthStore, useSessionStore } from '../store'

export default function HistoryPage() {
  const navigate = useNavigate()
  const { plan } = useAuthStore()
  const { results } = useSessionStore()
  const isPro = plan === 'pro'

  // If we came from results page, go back there. Otherwise go to setup.
  const handleBack = () => {
    if (results) navigate('/results')
    else navigate('/setup')
  }

  function scoreColor(score: number) {
    if (score >= 80) return '#22C55E'
    if (score >= 60) return '#3B82F6'
    if (score >= 40) return '#F59E0B'
    return '#EF4444'
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#09090B', display: 'flex', flexDirection: 'column', padding: '48px 20px', maxWidth: 480, margin: '0 auto' }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <button onClick={handleBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A1A1AA', fontSize: 22, lineHeight: 1, fontFamily: 'inherit' }}>←</button>
        <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>
          <span style={{ color: '#3B82F6' }}>SPEAKUP</span>
          <span style={{ color: '#ffffff' }}>GRADE</span>
        </span>
      </div>

      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>Session History</h1>
      <p style={{ color: '#A1A1AA', fontSize: 14, marginBottom: 28 }}>
        {isPro ? 'Your past sessions' : 'Track your progress over time'}
      </p>

      {!isPro && (
        <div style={{ position: 'relative', marginBottom: 24 }}>
          <div style={{ filter: 'blur(5px)', userSelect: 'none', pointerEvents: 'none' }}>
            {[85, 72, 91].map((score, i) => (
              <div key={i} style={{ background: '#1A1A1E', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 16px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Sample session</p>
                  <p style={{ color: '#A1A1AA', fontSize: 12 }}>3 min · 2 days ago</p>
                </div>
                <span style={{ fontWeight: 700, fontSize: 22, color: scoreColor(score) }}>{score}</span>
              </div>
            ))}
          </div>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <button onClick={() => navigate('/upgrade')} style={{ background: '#3B82F6', color: '#fff', fontWeight: 700, fontSize: 14, padding: '12px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              Unlock with Pro
            </button>
          </div>
        </div>
      )}

      {isPro && (
        <div style={{ background: '#1A1A1E', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '24px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#ffffff', marginBottom: 8 }}>Coming soon</p>
          <p style={{ fontSize: 13, color: '#A1A1AA', lineHeight: 1.7 }}>
            Session history sync between web and Android is being built. Your sessions recorded on mobile will appear here once the backend endpoint is live.
          </p>
          <button
            onClick={() => navigate('/setup')}
            style={{ marginTop: 20, background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#A1A1AA', fontSize: 14, fontWeight: 600, padding: '10px 20px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Back
          </button>
        </div>
      )}
    </div>
  )
}
