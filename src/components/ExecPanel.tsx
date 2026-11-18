import ExecFace from './ExecFace'

export type ExecRole = 'CEO' | 'CFO' | 'CRO'

const COLOR: Record<ExecRole, string> = { CEO: '#F59E0B', CFO: '#3B82F6', CRO: '#22C55E' }
const ORDER: ExecRole[] = ['CFO', 'CRO', 'CEO']

// Role asking question number i (the server writes them CFO, CRO, CEO)
export function roleForQuestion(i: number): ExecRole {
  return ORDER[((i % 3) + 3) % 3]
}

// The three buyers as a row of faces.
// state: 'listening' = all three attentive during your pitch
//        'asking'    = the active one is talking, the others wait
//        'answering' = the active one listens to you, the others wait
// The motion is decoration: it does not react to what you say.
export default function ExecPanel({ active = null, state = 'listening', size = 76 }: {
  active?: ExecRole | null
  state?: 'listening' | 'asking' | 'answering'
  size?: number
}) {
  const roles: ExecRole[] = ['CEO', 'CFO', 'CRO']
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 16, alignItems: 'flex-end' }}>
      <style>{`
        @keyframes suaBob { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-4px) } }
        @keyframes suaTalk { 0%,100% { transform: scale(1.12) } 50% { transform: scale(1.2) } }
        @keyframes suaLean { 0%,100% { transform: scale(1.12) rotate(-3deg) } 50% { transform: scale(1.12) rotate(3deg) } }
      `}</style>
      {roles.map((r, i) => {
        const isActive = active === r
        const dim = active && !isActive
        let animation = `suaBob ${3 + i * 0.4}s ease-in-out ${i * 0.5}s infinite`
        let transform = 'none'
        if (isActive && state === 'asking') { animation = 'suaTalk 0.35s ease-in-out infinite' }
        else if (isActive && state === 'answering') { animation = 'suaLean 2.4s ease-in-out infinite' }
        else if (dim) { animation = 'none' }
        return (
          <div key={r} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, opacity: dim ? 0.4 : 1, transition: 'opacity 0.25s' }}>
            <div style={{
              width: size, height: size, borderRadius: '50%', animation, transform,
              boxShadow: isActive ? `0 0 0 3px #09090B, 0 0 0 6px ${COLOR[r]}` : 'none',
              transition: 'box-shadow 0.25s',
            }}>
              <ExecFace role={r} size={size} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: isActive ? COLOR[r] : '#A1A1AA', letterSpacing: '0.06em' }}>{r}</span>
          </div>
        )
      })}
    </div>
  )
}
