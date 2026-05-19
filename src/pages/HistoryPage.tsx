import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, useSessionStore } from '../store'
import { API_URL } from '../lib/constants'

interface Session {
  id: string
  created_at: string
  topic: string
  actual_seconds: number
  score_overall: number
  words_per_minute: number
}

function scoreColor(score: number) {
  if (score >= 70) return '#22C55E'
  if (score >= 50) return '#F59E0B'
  return '#EF4444'
}

function fmt(s: number) {
  if (!s) return '0:00'
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0')
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) +
    ', ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function TrendChart({ sessions }: { sessions: Session[] }) {
  const last10 = [...sessions].slice(0, 10).reverse()
  if (last10.length < 2) return null

  const scores = last10.map(s => s.score_overall)
  const min = Math.min(...scores)
  const max = Math.max(...scores)
  const range = max - min || 1

  const w = 320, h = 100, padX = 20, padY = 10
  const plotW = w - padX * 2
  const plotH = h - padY * 2

  const points = scores.map((score, i) => ({
    x: padX + (i / (scores.length - 1)) * plotW,
    y: padY + plotH - ((score - min) / range) * plotH,
    score,
  }))

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      {/* Grid lines */}
      <line x1={padX} y1={padY} x2={padX} y2={h - padY} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      <line x1={padX} y1={h - padY} x2={w - padX} y2={h - padY} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      {/* Y labels */}
      <text x={padX - 4} y={padY + 4} fill="rgba(255,255,255,0.3)" fontSize="9" textAnchor="end">{max}</text>
      <text x={padX - 4} y={h - padY + 4} fill="rgba(255,255,255,0.3)" fontSize="9" textAnchor="end">{min}</text>
      {/* Line */}
      <path d={linePath} fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill={scoreColor(p.score)} />
      ))}
      {/* Bottom label */}
      <text x={w / 2} y={h} fill="rgba(255,255,255,0.2)" fontSize="9" textAnchor="middle">Last {scores.length} sessions</text>
    </svg>
  )
}

export default function HistoryPage() {
  const navigate = useNavigate()
  const { email, plan } = useAuthStore()
  const { results } = useSessionStore()
  const isPro = plan === 'pro'

  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const handleBack = () => {
    if (results) navigate('/results')
    else navigate('/setup')
  }

  useEffect(() => {
    if (!email) { navigate('/'); return }
    if (!isPro) { setLoading(false); return }

    fetch(`${API_URL}/history?email=${encodeURIComponent(email)}`)
      .then(async (r) => {
        if (!r.ok) throw new Error('Failed to load')
        const data = await r.json()
        setSessions(Array.isArray(data.sessions) ? data.sessions : [])
      })
      .catch(() => setError('Could not load sessions.'))
      .finally(() => setLoading(false))
  }, [email, isPro])

  const avgScore = sessions.length > 0
    ? Math.round(sessions.reduce((s, sess) => s + sess.score_overall, 0) / sessions.length)
    : 0

  const avgLabel = avgScore >= 70 ? 'Good progress' : avgScore >= 50 ? 'Needs focus' : 'Keep going'
  const avgLabelColor = avgScore >= 70 ? '#22C55E' : avgScore >= 50 ? '#F59E0B' : '#EF4444'

  return (
    <div style={{ minHeight: '100dvh', background: '#09090B', display: 'flex', flexDirection: 'column', padding: '48px 20px 40px', maxWidth: 480, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <button onClick={handleBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3B82F6', fontSize: 15, fontFamily: 'inherit' }}>
          Back
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#ffffff', flex: 1, textAlign: 'center' }}>History</h1>
        <div style={{ width: 40 }} />
      </div>

      {/* Free gate */}
      {!isPro && (
        <div style={{ position: 'relative' }}>
          <div style={{ filter: 'blur(5px)', userSelect: 'none', pointerEvents: 'none' }}>
            <div style={{ background: '#1A1A1E', borderRadius: 16, padding: 20, marginBottom: 14 }}>
              <p style={{ fontSize: 36, fontWeight: 700, color: '#ffffff' }}>74</p>
              <p style={{ fontSize: 11, color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Average score</p>
            </div>
            {[85, 72, 91].map((score, i) => (
              <div key={i} style={{ background: '#1A1A1E', borderRadius: 12, padding: '14px 16px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: scoreColor(score), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{score}</span>
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>Sample topic</p>
                  <p style={{ color: '#A1A1AA', fontSize: 12 }}>18 May · 3:00 · 140 WPM</p>
                </div>
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

      {/* Pro content */}
      {isPro && loading && (
        <div style={{ textAlign: 'center', marginTop: 60 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid rgba(59,130,246,0.2)', borderTopColor: '#3B82F6', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {isPro && !loading && error && (
        <p style={{ color: '#EF4444', textAlign: 'center', marginTop: 40 }}>{error}</p>
      )}

      {isPro && !loading && !error && sessions.length === 0 && (
        <div style={{ background: '#1A1A1E', borderRadius: 14, padding: 32, textAlign: 'center', marginTop: 20 }}>
          <p style={{ color: '#A1A1AA', marginBottom: 16 }}>No sessions yet. Record your first speech!</p>
          <button onClick={() => navigate('/setup')} style={{ background: '#3B82F6', color: '#fff', fontWeight: 700, fontSize: 14, padding: '12px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            Start recording
          </button>
        </div>
      )}

      {isPro && !loading && sessions.length > 0 && (
        <>
          {/* Average score card */}
          <div style={{ background: '#1A1A1E', borderRadius: 16, padding: '20px 20px 16px', marginBottom: 14, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <p style={{ fontSize: 40, fontWeight: 700, color: '#ffffff', lineHeight: 1 }}>{avgScore}</p>
                <p style={{ fontSize: 10, color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>Average score</p>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 20, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: avgLabelColor }} />
                <span style={{ fontSize: 12, color: avgLabelColor, fontWeight: 600 }}>{avgLabel}</span>
              </div>
            </div>
            <TrendChart sessions={sessions} />
          </div>

          {/* Session list */}
          <p style={{ fontSize: 10, fontWeight: 700, color: '#A1A1AA', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
            All sessions
          </p>

          {sessions.map((s) => (
            <div key={s.id} style={{ background: '#1A1A1E', borderRadius: 12, padding: '14px 16px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14, border: '1px solid rgba(255,255,255,0.04)' }}>
              {/* Score circle */}
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: scoreColor(s.score_overall), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{s.score_overall}</span>
              </div>
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: 14, color: '#ffffff', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.topic || 'Untitled session'}
                </p>
                <p style={{ color: '#A1A1AA', fontSize: 12 }}>
                  {formatDate(s.created_at)} · {fmt(s.actual_seconds)} · {s.words_per_minute} WPM
                </p>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
