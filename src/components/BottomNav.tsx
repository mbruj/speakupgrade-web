import { useNavigate } from 'react-router-dom'

type Tab = 'practice' | 'history' | 'account'

const ICONS: Record<Tab, React.ReactElement> = {
  practice: (
    <>
      <rect x="9" y="3" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <line x1="12" y1="18" x2="12" y2="21" />
    </>
  ),
  history: (
    <>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 14" />
    </>
  ),
  account: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
}

const TABS: { key: Tab; label: string; path: string }[] = [
  { key: 'practice', label: 'Practice', path: '/setup' },
  { key: 'history', label: 'History', path: '/history' },
  { key: 'account', label: 'Account', path: '/account' },
]

export default function BottomNav({ active }: { active: Tab }) {
  const navigate = useNavigate()
  return (
    <nav
      style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 50,
        background: '#0c0c0f', borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', justifyContent: 'center',
      }}
    >
      <div style={{ display: 'flex', width: '100%', maxWidth: 480, padding: '8px 8px calc(14px + env(safe-area-inset-bottom))' }}>
        {TABS.map((t) => {
          const on = t.key === active
          const c = on ? '#3B82F6' : '#8B8B94'
          return (
            <button
              key={t.key}
              onClick={() => { if (!on) navigate(t.path) }}
              aria-current={on ? 'page' : undefined}
              style={{
                flex: 1, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 0', minHeight: 44,
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {ICONS[t.key]}
              </svg>
              <span style={{ fontSize: 11, fontWeight: on ? 600 : 500, color: c }}>{t.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
