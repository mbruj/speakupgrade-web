import { useAuthStore } from '../store'
import { FeatureGate } from './FeatureGate'
interface SpeechTimelineProps { actualSeconds: number; pauses: number[]; wpm: number }
export function SpeechTimeline({ actualSeconds, pauses, wpm }: SpeechTimelineProps) {
  const plan = useAuthStore((s) => s.plan)
  const isPro = plan === 'pro'
  const width = 360; const height = 64
  const barCount = Math.min(actualSeconds, 60)
  const bars = Array.from({ length: barCount }, (_, i) => {
    const t = i / barCount
    const base = 0.3 + 0.5 * Math.sin(t * Math.PI)
    return Math.max(0.05, Math.min(1, base + (Math.random() - 0.5) * 0.3))
  })
  const pausePositions = pauses.map((p) => (p / actualSeconds) * width)
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: '#A1A1AA' }}>Speech timeline</span>
        <span style={{ fontSize: 12, color: '#A1A1AA' }}>{wpm} wpm</span>
      </div>
      <div style={{ background: '#1A1A1E', borderRadius: 12, padding: '12px 16px',
        border: '1px solid rgba(255,255,255,0.06)', position: 'relative' }}>
        <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          {bars.map((h, i) => {
            const x = (i / barCount) * width; const barH = h * (height - 8); const y = (height - barH) / 2
            return <rect key={i} x={x} y={y} width={Math.max(1, width / barCount - 1)} height={barH}
              rx={1} fill="#3B82F6" opacity={0.6 + h * 0.4} />
          })}
          {isPro && pausePositions.map((x, i) => (
            <line key={i} x1={x} y1={0} x2={x} y2={height} stroke="#F59E0B" strokeWidth={1.5} strokeDasharray="3,3" />
          ))}
        </svg>
        {!isPro && <FeatureGate label="Unlock pause markers"><div style={{ height: 20 }} /></FeatureGate>}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        <span style={{ fontSize: 11, color: '#52525B' }}>0:00</span>
        <span style={{ fontSize: 11, color: '#52525B' }}>
          {Math.floor(actualSeconds / 60)}:{String(actualSeconds % 60).padStart(2, '0')}
        </span>
      </div>
    </div>
  )
}