import { useNavigate } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { STRIPE_ANNUAL, STRIPE_MONTHLY, STRIPE_PORTAL } from '../lib/constants'
import { useAuthStore } from '../store'
const PRO_FEATURES = ['Unlimited sessions','Full written feedback on every score','All improvement bullets','Weak language detection','Interactive speech timeline with pause markers','Session history and trends']
export default function UpgradePage() {
  const navigate = useNavigate()
  const plan = useAuthStore((s) => s.plan)
  if (plan === 'pro') {
    return (
      <div className="page"><div className="container" style={{ textAlign: 'center' }}>
        <Logo size="sm" />
        <div style={{ marginTop: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>You're on Pro</h2>
          <p style={{ color: '#A1A1AA', fontSize: 14, marginBottom: 28 }}>All features unlocked.</p>
          <a href={STRIPE_PORTAL} target="_blank" rel="noreferrer" style={{ display: 'block', textAlign: 'center', color: '#A1A1AA', fontSize: 13, marginBottom: 24 }}>Manage subscription</a>
          <button className="btn-ghost" onClick={() => navigate('/setup')}>Back</button>
        </div>
      </div></div>
    )
  }
  return (
    <div className="page-top"><div className="container" style={{ paddingBottom: 48 }}>
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A1A1AA', fontSize: 13, marginBottom: 32 }}>← Back</button>
      <div style={{ textAlign: 'center', marginBottom: 32 }}><Logo size="md" /><p style={{ color: '#A1A1AA', marginTop: 8, fontSize: 15 }}>Unlock everything</p></div>
      <a href={STRIPE_ANNUAL} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
        <div className="card" style={{ marginBottom: 14, borderColor: '#F59E0B', borderWidth: 1.5, cursor: 'pointer', position: 'relative' }}>
          <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#F59E0B', color: '#1a1a1a', fontSize: 11, fontWeight: 600, padding: '3px 14px', borderRadius: 20, whiteSpace: 'nowrap' }}>2 MONTHS FREE</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <div><p style={{ fontWeight: 700, fontSize: 16, color: '#F59E0B' }}>Annual</p><p style={{ color: '#A1A1AA', fontSize: 12, marginTop: 2 }}>€8.33 / month, billed yearly</p></div>
            <div style={{ textAlign: 'right' }}><p style={{ fontWeight: 700, fontSize: 20, color: '#F59E0B' }}>€99.99</p><p style={{ color: '#52525B', fontSize: 11, textDecoration: 'line-through' }}>€119.88</p></div>
          </div>
        </div>
      </a>
      <a href={STRIPE_MONTHLY} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
        <div className="card" style={{ marginBottom: 28, cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><p style={{ fontWeight: 700, fontSize: 16, color: '#3B82F6' }}>Monthly</p><p style={{ color: '#A1A1AA', fontSize: 12, marginTop: 2 }}>Cancel anytime</p></div>
            <p style={{ fontWeight: 700, fontSize: 20, color: '#3B82F6' }}>€9.99<span style={{ fontSize: 12, fontWeight: 400, color: '#A1A1AA' }}>/mo</span></p>
          </div>
        </div>
      </a>
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#A1A1AA', letterSpacing: '0.08em', marginBottom: 14 }}>EVERYTHING IN PRO</div>
        {PRO_FEATURES.map((f) => (<div key={f} style={{ display: 'flex', gap: 10, marginBottom: 10 }}><span style={{ color: '#22C55E' }}>✓</span><span style={{ fontSize: 14, color: '#ffffff' }}>{f}</span></div>))}
      </div>
      <p style={{ fontSize: 11, color: '#52525B', textAlign: 'center', lineHeight: 1.6 }}>Secure payment via Stripe. Cancel anytime.</p>
    </div></div>
  )
}