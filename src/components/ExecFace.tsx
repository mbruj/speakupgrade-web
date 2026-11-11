// The three buyers as characters. Simple shapes on purpose: they can be replaced by real art later.
const FACE: Record<string, { fill: string }> = {
  CEO: { fill: '#F59E0B' },
  CFO: { fill: '#3B82F6' },
  CRO: { fill: '#22C55E' },
}

export default function ExecFace({ role, size = 56 }: { role: 'CEO' | 'CFO' | 'CRO' | string; size?: number }) {
  const ink = '#09090B'
  const fill = (FACE[role] || FACE.CEO).fill
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill={fill} />
      {role === 'CFO' ? (
        <>
          <circle cx="22" cy="30" r="3.2" fill={ink} />
          <circle cx="42" cy="30" r="3.2" fill={ink} />
          <circle cx="22" cy="30" r="8" fill="none" stroke={ink} strokeWidth="2" />
          <circle cx="42" cy="30" r="8" fill="none" stroke={ink} strokeWidth="2" />
          <path d="M30 30 H34" stroke={ink} strokeWidth="2" />
          <path d="M15 18 H28 M37 14 L49 11" stroke={ink} strokeWidth="3" strokeLinecap="round" />
          <path d="M26 46 Q32 44 38 45" stroke={ink} strokeWidth="3" strokeLinecap="round" fill="none" />
        </>
      ) : role === 'CRO' ? (
        <>
          <circle cx="22" cy="29" r="3.5" fill={ink} />
          <circle cx="42" cy="29" r="3.5" fill={ink} />
          <path d="M15 22 L28 19 M36 19 L49 22" stroke={ink} strokeWidth="3" strokeLinecap="round" />
          <path d="M20 40 Q32 53 44 40" stroke={ink} strokeWidth="3" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          <circle cx="22" cy="29" r="3.5" fill={ink} />
          <circle cx="42" cy="29" r="3.5" fill={ink} />
          <path d="M15 21 L28 23 M36 23 L49 21" stroke={ink} strokeWidth="3" strokeLinecap="round" />
          <path d="M24 45 H40" stroke={ink} strokeWidth="3" strokeLinecap="round" />
        </>
      )}
    </svg>
  )
}
