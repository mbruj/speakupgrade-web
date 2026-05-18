import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store'
interface FeatureGateProps { children: React.ReactNode; label?: string }
export function FeatureGate({ children, label = 'Unlock with Pro' }: FeatureGateProps) {
  const plan = useAuthStore((s) => s.plan)
  const navigate = useNavigate()
  if (plan === 'pro') return <>{children}</>
  return (
    <div className="relative">
      <div style={{ filter: 'blur(5px)', userSelect: 'none', pointerEvents: 'none' }}>{children}</div>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <button onClick={() => navigate('/upgrade')}
          style={{ background: '#3B82F6', color: '#fff', fontWeight: 600, fontSize: 13,
            padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer' }}>
          {label}
        </button>
      </div>
    </div>
  )
}