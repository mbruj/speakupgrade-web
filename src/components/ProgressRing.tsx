interface ProgressRingProps { score: number; size?: number; strokeWidth?: number; label?: string }
function scoreColor(score: number): string {
  if (score >= 80) return '#22C55E'
  if (score >= 60) return '#3B82F6'
  if (score >= 40) return '#F59E0B'
  return '#EF4444'
}
export function ProgressRing({ score, size = 80, strokeWidth = 6, label }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = scoreColor(score)
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth} />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
          style={{ transform: 'rotate(90deg)', transformOrigin: 'center', fill: color,
            fontSize: size * 0.22, fontWeight: 600, fontFamily: 'Inter' }}>
          {score}
        </text>
      </svg>
      {label && <span style={{ fontSize: 11, color: '#A1A1AA', textAlign: 'center', lineHeight: 1.3 }}>{label}</span>}
    </div>
  )
}