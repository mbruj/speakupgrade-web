// Last 10 pitch scores on this device. Drives "beat your last score" and the trend line.
// Per device on purpose: no backend change needed. Clearing site data resets it.

const KEY = 'sua_scores'

export interface ScorePoint { id: string; score: number; t: number }

export function getScores(): ScorePoint[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const arr = JSON.parse(raw)
      if (Array.isArray(arr)) return arr as ScorePoint[]
    }
  } catch {}
  return []
}

// Returns the score BEFORE this one (null if none). Safe to call twice for the same id.
export function pushScore(id: string, score: number): number | null {
  const all = getScores()
  const existing = all.findIndex(p => p.id === id)
  if (existing >= 0) return existing > 0 ? all[existing - 1].score : null
  const prev = all.length > 0 ? all[all.length - 1].score : null
  const next = [...all, { id, score, t: Date.now() }].slice(-10)
  try { localStorage.setItem(KEY, JSON.stringify(next)) } catch {}
  return prev
}
