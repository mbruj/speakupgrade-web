import { useState } from 'react'

const MIRA_IMG = 'https://www.speakupgrade.com/wp-content/uploads/2026/05/Mira.png'

export default function MiraAvatar({ size }: { size: number }) {
  const [failed, setFailed] = useState(false)
  const ring = { width: size, height: size, borderRadius: '50%', border: '2px solid rgba(245,158,11,0.5)', flexShrink: 0 as const }
  if (failed) {
    return (
      <div style={{ ...ring, background: '#3a2c10', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.42, fontWeight: 700, color: '#F59E0B' }}>
        M
      </div>
    )
  }
  return <img src={MIRA_IMG} alt="Mira" onError={() => setFailed(true)} style={{ ...ring, objectFit: 'cover' }} />
}
