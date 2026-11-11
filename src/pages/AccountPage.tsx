import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store'
import { API_URL } from '../lib/constants'
import BottomNav from '../components/BottomNav'

const TIER_COLORS = { free: '#71717A', pro: '#3B82F6', team: '#F59E0B' } as const

function Row({ title, subtitle, onClick }: { title: string; subtitle?: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      style={{ display: 'block', width: '100%', background: '#1A1A1E', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '16px 18px', textAlign: 'left', cursor: onClick ? 'pointer' : 'default', marginBottom: 12, fontFamily: 'inherit' }}
    >
      <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: subtitle ? '0 0 4px 0' : 0 }}>{title}</p>
      {subtitle && <p style={{ fontSize: 13, color: '#A1A1AA', margin: 0 }}>{subtitle}</p>}
    </button>
  )
}

export default function AccountPage() {
  const navigate = useNavigate()
  const { email, plan, logout } = useAuthStore()
  const [orgRole, setOrgRole] = useState<string | null>(null)
  const [orgName, setOrgName] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)
  const [coachEmails, setCoachEmails] = useState<boolean | null>(null)
  const [showVideo, setShowVideo] = useState(() => {
    try { return localStorage.getItem('sua_camera_on') !== '0' } catch { return true }
  })

  useEffect(() => {
    if (!email) { navigate('/'); return }
    fetch(`${API_URL}/org/me?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((d) => { setOrgRole(d.org_role || null); setOrgName(d.org_name || null) })
      .catch(() => {})
      .finally(() => setChecked(true))

    // Weekly coaching emails from Mira (moved here from the Results screen)
    fetch(`${API_URL}/auth/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
      .then((r) => r.json())
      .then((d) => setCoachEmails(d.newsletter_consent === true))
      .catch(() => {})
  }, [email])

  const toggleShowVideo = () => {
    const next = !showVideo
    setShowVideo(next)
    try { localStorage.setItem('sua_camera_on', next ? '1' : '0') } catch {}
  }

  const toggleCoachEmails = async () => {
    if (coachEmails === null) return
    const next = !coachEmails
    setCoachEmails(next)
    try {
      await fetch(`${API_URL}/otp/consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newsletterConsent: next }),
      })
      try { localStorage.setItem('consent_answered', 'true') } catch {}
    } catch (e) {
      console.error('Consent update error:', e)
      setCoachEmails(!next)
    }
  }

  const tier: 'free' | 'pro' | 'team' = orgRole ? 'team' : plan === 'pro' ? 'pro' : 'free'
  const tierColor = TIER_COLORS[tier]
  const tierLabel = tier === 'team' ? 'TEAM' : tier === 'pro' ? 'PRO' : 'FREE'

  return (
    <div style={{ minHeight: '100dvh', background: '#09090B', padding: '28px 20px 110px', maxWidth: 480, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', color: '#fff', margin: '0 0 6px 0' }}>Account</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <p style={{ fontSize: 13, color: '#A1A1AA', margin: 0 }}>{email}</p>
        {checked && (
          <span style={{ background: `${tierColor}1F`, border: `1px solid ${tierColor}4D`, borderRadius: 20, padding: '2px 8px', fontSize: 9, fontWeight: 700, color: tierColor }}>
            {tierLabel}
          </span>
        )}
      </div>

      {checked && tier === 'free' && (
        <Row title="Upgrade to Pro" subtitle="Unlimited pitches, better answers, full transcript." onClick={() => navigate('/upgrade')} />
      )}
      {orgRole === 'manager' && (
        <Row title="Team dashboard" subtitle={`See ${orgName || 'your team'}'s performance.`} onClick={() => navigate('/team')} />
      )}
      {orgRole === 'rep' && (
        <Row title="Team" subtitle={`You are on ${orgName || 'a team'}. Your manager can see your progress.`} />
      )}
      <Row title="My coach profile" subtitle="Update what you sell and what you want to improve." onClick={() => navigate('/mira-edit')} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: '#1A1A1E', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '16px 18px', marginBottom: 12 }}>
        <div>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: '0 0 4px 0' }}>Show my video while I pitch</p>
          <p style={{ fontSize: 13, color: '#A1A1AA', margin: 0 }}>Off hides your preview. Your delivery is still analysed.</p>
        </div>
        <button
          onClick={toggleShowVideo} role="switch" aria-checked={showVideo} aria-label="Show my video while I pitch"
          style={{ width: 44, height: 26, borderRadius: 13, background: showVideo ? '#2563EB' : '#3f3f46', border: 'none', position: 'relative', cursor: 'pointer', flexShrink: 0 }}
        >
          <span style={{ position: 'absolute', top: 3, left: showVideo ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.15s' }} />
        </button>
      </div>
      {coachEmails !== null && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: '#1A1A1E', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '16px 18px', marginBottom: 12 }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: '0 0 4px 0' }}>Coaching emails from Mira</p>
            <p style={{ fontSize: 13, color: '#A1A1AA', margin: 0 }}>Tips based on your pitches. Unsubscribe any time.</p>
          </div>
          <button
            onClick={toggleCoachEmails} role="switch" aria-checked={coachEmails} aria-label="Coaching emails from Mira"
            style={{ width: 44, height: 26, borderRadius: 13, background: coachEmails ? '#2563EB' : '#3f3f46', border: 'none', position: 'relative', cursor: 'pointer', flexShrink: 0 }}
          >
            <span style={{ position: 'absolute', top: 3, left: coachEmails ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.15s' }} />
          </button>
        </div>
      )}
      <Row title="Give feedback" subtitle="Tell us what you would improve." onClick={() => navigate('/feedback')} />
      {checked && !orgRole && (
        <Row title="Become an affiliate" subtitle="Earn 50% commission on every referral." onClick={() => navigate('/affiliate')} />
      )}

      <div style={{ textAlign: 'center', marginTop: 28 }}>
        <button
          onClick={() => { logout(); navigate('/') }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8B8B94', fontSize: 14, fontFamily: 'inherit', padding: 12 }}
        >
          Log out
        </button>
      </div>

      <BottomNav active="account" />
    </div>
  )
}
