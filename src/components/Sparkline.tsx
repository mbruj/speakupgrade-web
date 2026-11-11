// Tiny trend line. No dependencies.
export default function Sparkline({ values, width = 120, height = 36 }: { values: number[]; width?: number; height?: number }) {
  if (values.length < 2) return null
  const min = Math.min(...values, 0)
  const max = Math.max(...values, 100)
  const span = Math.max(1, max - min)
  const pad = 3
  const pts = values.map((v, i) => {
    const x = pad + (i * (width - pad * 2)) / (values.length - 1)
    const y = height - pad - ((v - min) / span) * (height - pad * 2)
    return x.toFixed(1) + ',' + y.toFixed(1)
  })
  const last = pts[pts.length - 1].split(',')
  const up = values[values.length - 1] >= values[0]
  const color = up ? '#22C55E' : '#F59E0B'
  return (
    <svg width={width} height={height} viewBox={'0 0 ' + width + ' ' + height} aria-hidden="true">
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="3" fill={color} />
    </svg>
  )
}
