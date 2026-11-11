// Rank ladder and "last time" verdicts. Stored on this device only.
// Ranks replace scores: you level up by winning executives ("I'm in"), not by a number.

const WINS_KEY = 'sua_wins'

export const RANKS = [
  { name: 'Rookie', at: 0 },
  { name: 'Rep', at: 5 },
  { name: 'Closer', at: 15 },
  { name: 'Rainmaker', at: 30 },
]

interface WinsState { total: number; ids: string[] }

function read(): WinsState {
  try {
    const raw = localStorage.getItem(WINS_KEY)
    if (raw) {
      const v = JSON.parse(raw)
      if (v && typeof v.total === 'number' && Array.isArray(v.ids)) return v as WinsState
    }
  } catch {}
  return { total: 0, ids: [] }
}

// Safe to call twice for the same result id
export function addWins(id: string, count: number) {
  const st = read()
  if (st.ids.includes(id)) return
  const next = { total: st.total + Math.max(0, count), ids: [...st.ids, id].slice(-50) }
  try { localStorage.setItem(WINS_KEY, JSON.stringify(next)) } catch {}
}

export function getRank(): { name: string; next: string | null; toNext: number; pct: number } {
  const total = read().total
  let idx = 0
  for (let i = 0; i < RANKS.length; i++) if (total >= RANKS[i].at) idx = i
  const cur = RANKS[idx]
  const nxt = RANKS[idx + 1] || null
  if (!nxt) return { name: cur.name, next: null, toNext: 0, pct: 100 }
  const pct = Math.round(((total - cur.at) / (nxt.at - cur.at)) * 100)
  return { name: cur.name, next: nxt.name, toNext: nxt.at - total, pct: Math.max(4, Math.min(100, pct)) }
}

// Time until the next daily challenge (local midnight)
export function timeUntilDrop(): string {
  const now = new Date()
  const mid = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  const mins = Math.max(1, Math.round((mid.getTime() - now.getTime()) / 60000))
  return mins >= 60 ? Math.floor(mins / 60) + 'h' : mins + 'm'
}

// 0 Rookie, 1 Rep, 2 Closer, 3 Rainmaker. Sent to the server to set buyer difficulty.
export function getRankIndex(): number {
  const total = read().total
  let idx = 0
  for (let i = 0; i < RANKS.length; i++) if (total >= RANKS[i].at) idx = i
  return idx
}
