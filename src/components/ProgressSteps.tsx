import { useEffect, useState } from 'react'

// Shows what is happening while the server works. Steps advance on a timer, so the order is
// honest but the timing is an estimate: the last step stays active until the result arrives.
export default function ProgressSteps({ steps, stepMs = 7000, accent = '#3B82F6' }: { steps: string[]; stepMs?: number; accent?: string }) {
  const [active, setActive] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setActive(a => Math.min(a + 1, steps.length - 1)), stepMs)
    return () => clearInterval(t)
  }, [steps.length, stepMs])
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left', maxWidth: 320, margin: '0 auto' }}>
      {steps.map((s, i) => {
        const done = i < active
        const current = i === active
        return (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: done || current ? 1 : 0.35, transition: 'opacity 0.3s' }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: done ? '#22C55E' : 'transparent', border: done ? 'none' : `2px solid ${current ? accent : '#3f3f46'}`, borderTopColor: current ? 'transparent' : undefined, animation: current ? 'spin 0.9s linear infinite' : 'none' }}>
              {done && <span style={{ color: '#09090B', fontSize: 13, fontWeight: 700, lineHeight: 1 }}>✓</span>}
            </div>
            <span style={{ fontSize: 15, color: current ? '#fff' : '#A1A1AA', fontWeight: current ? 600 : 400 }}>{s}</span>
          </div>
        )
      })}
    </div>
  )
}
