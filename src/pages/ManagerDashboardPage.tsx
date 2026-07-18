import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store'
import { API_URL } from '../lib/constants'

interface RepSummary {
  email: string
  name: string
  plan: string
  streak: number
  sessions_count: number
  avg_score: number | null
  last_practiced: string | null
  weakest_dimension: string | null
  trend: number | null
}

function daysAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

function scoreColor(score: number | null) {
  if (score === null) return '#52525B'
  return score >= 75 ? '#22C55E' : score >= 55 ? '#F59E0B' : '#EF4444'
}

export default function ManagerDashboardPage() {
  const navigate = useNavigate()
  const { email } = useAuthStore()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [orgName, setOrgName] = useState<string | null>(null)
  const [orgAvg, setOrgAvg] = useState<number | null>(null)
  const [repCount, setRepCount] = useState(0)
  const [activeThisWeek, setActiveThisWeek] = useState(0)
  const [reps, setReps] = useState<RepSummary[]>([])
  const [expandedRep, setExpandedRep] = useState<string | null>(null)
  const [repSessions, setRepSessions] = useState<any[]>([])
  const [repLoading, setRepLoading] = useState(false)

  useEffect(() => {
    if (!email) { navigate('/'); return }

    fetch(`${API_URL}/org/me?email=${encodeURIComponent(email)}`)
      .then(r => r.json())
      .then(meData => {
        if (!meData.org_id || meData.org_role !== 'manager') {
          // Not a manager — nothing to show here
          navigate('/setup')
          return
        }
        setOrgId(meData.org_id)
        setOrgName(meData.org_name)

        return fetch(`${API_URL}/org/${meData.org_id}/team?managerEmail=${encodeURIComponent(email)}`)
          .then(r => r.json())
          .then(data => {
            if (data.error) throw new Error(data.error)
            setOrgAvg(data.org_avg_score)
            setRepCount(data.rep_count)
            setActiveThisWeek(data.active_this_week)
            setReps(data.reps || [])
          })
      })
      .catch(err => setError(err.message || 'Failed to load team data'))
      .finally(() => setLoading(false))
  }, [email])

  const toggleRep = (repEmail: string) => {
    if (expandedRep === repEmail) {
      setExpandedRep(null)
      return
    }
    setExpandedRep(repEmail)
    setRepLoading(true)
    fetch(`${API_URL}/org/${orgId}/rep/${encodeURIComponent(repEmail)}?managerEmail=${encodeURIComponent(email || '')}`)
      .then(r => r.json())
      .then(data => setRepSessions(data.sessions || []))
      .catch(() => setRepSessions([]))
      .finally(() => setRepLoading(false))
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', background: '#09090B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#A1A1AA', fontSize: 14 }}>Loading team dashboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight: '100dvh', background: '#09090B', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
        <p style={{ color: '#EF4444', fontSize: 14, textAlign: 'center' }}>{error}</p>
        <button
          onClick={() => navigate('/setup')}
          style={{ background: '#3B82F6', color: '#fff', fontWeight: 700, fontSize: 14, padding: '12px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Back to setup
        </button>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#09090B', padding: '20px 20px 48px', maxWidth: 640, margin: '0 auto' }}>
      <button
        onClick={() => navigate('/setup')}
        style={{ background: 'none', border: 'none', color: '#3B82F6', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 16, padding: 0 }}
      >
        ← Back
      </button>

      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>Team Dashboard</h1>
      <p style={{ fontSize: 13, color: '#A1A1AA', marginBottom: 24 }}>{orgName || 'Your team'} — sales practice performance</p>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
        <div style={{ background: '#1A1A1E', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '14px 16px' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Team avg</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: '#3B82F6', margin: 0 }}>{orgAvg ?? '—'}</p>
        </div>
        <div style={{ background: '#1A1A1E', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '14px 16px' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Reps</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: '#ffffff', margin: 0 }}>{repCount}</p>
        </div>
        <div style={{ background: '#1A1A1E', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '14px 16px' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Active/week</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: '#22C55E', margin: 0 }}>{activeThisWeek}/{repCount}</p>
        </div>
      </div>

      {/* Rep list */}
      {reps.length === 0 ? (
        <div style={{ background: '#1A1A1E', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 24, textAlign: 'center' }}>
          <p style={{ color: '#52525B', fontSize: 13 }}>No reps assigned to this team yet.</p>
        </div>
      ) : (
        reps.map((rep) => (
          <div key={rep.email} style={{ background: '#1A1A1E', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, marginBottom: 10, overflow: 'hidden' }}>
            <button
              onClick={() => toggleRep(rep.email)}
              style={{ width: '100%', background: 'none', border: 'none', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
            >
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#ffffff', margin: '0 0 2px 0' }}>{rep.name}</p>
                <p style={{ fontSize: 11, color: '#52525B', margin: 0 }}>
                  {rep.sessions_count} sessions · {rep.weakest_dimension ? `Weakest: ${rep.weakest_dimension}` : 'No data yet'} · {daysAgo(rep.last_practiced)}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                {rep.trend !== null && rep.trend !== 0 && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: rep.trend > 0 ? '#22C55E' : '#EF4444' }}>
                    {rep.trend > 0 ? '↑' : '↓'} {Math.abs(rep.trend)}
                  </span>
                )}
                <span style={{ fontSize: 17, fontWeight: 700, color: scoreColor(rep.avg_score) }}>{rep.avg_score ?? '—'}</span>
              </div>
            </button>

            {expandedRep === rep.email && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '12px 16px' }}>
                {repLoading ? (
                  <p style={{ color: '#52525B', fontSize: 12 }}>Loading sessions...</p>
                ) : repSessions.length === 0 ? (
                  <p style={{ color: '#52525B', fontSize: 12 }}>No sessions recorded yet.</p>
                ) : (
                  repSessions.map((s: any) => (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <div>
                        <p style={{ fontSize: 12.5, color: '#d4d4d8', margin: '0 0 2px 0' }}>{s.topic}</p>
                        <p style={{ fontSize: 10.5, color: '#52525B', margin: 0 }}>
                          {s.category ? `${s.category.replace(/_/g, ' ')} · ` : ''}{new Date(s.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: scoreColor(s.score_overall) }}>{s.score_overall}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}
