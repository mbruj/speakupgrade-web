// Daily challenge: a short, playful persuasion game. No made-up companies, no homework.
// Five minutes is the ceiling. Most people need two.

export interface Challenge {
  id: number
  title: string
  setup: string
  twist?: string
}

export const CHALLENGE_SECONDS = 5 * 60
export const CHALLENGE_BUYER = 'A CEO, a CFO and a CRO who are not easily impressed'
export const CHALLENGE_GOAL = 'Make them want it, and ask for the sale'

const CHALLENGES: Challenge[] = [
  { id: 0, title: 'Sell me this pen', setup: 'The classic. I am a CEO who has never owned a pen.' },
  { id: 1, title: 'Sell me a glass of tap water', setup: 'Luxury price. Make me feel clever for paying it.' },
  { id: 2, title: 'Convince me to let your dog come to work', setup: 'I am the CEO. Your dog is called Biscuit. He has opinions.' },
  { id: 3, title: 'Sell a snow shovel in Dubai', setup: 'It is 38 degrees. I am the buyer for a big hardware chain.' },
  { id: 4, title: 'Convince me to pay €100 for this paperclip', setup: 'It is a normal paperclip. I know it is a normal paperclip.' },
  { id: 5, title: 'Sell me an umbrella', setup: 'It is sunny and I am in a great mood. Ruin it, politely.' },
  { id: 6, title: 'Convince me to give you Friday off', setup: 'I am your boss. It is month-end and I am stressed.' },
  { id: 7, title: 'Sell me the chair I am sitting on', setup: 'I did not know it was for sale. I like it, though.' },
  { id: 8, title: 'Convince me Monday is the best day of the week', setup: 'I am a CFO. I hate Mondays and I have receipts.' },
  { id: 9, title: 'Sell me my own phone back', setup: 'It is in my hand. I just paid for it. Make me pay again.' },
  { id: 10, title: 'Convince me to skip this meeting', setup: 'It is the weekly status meeting. Nobody has ever left it happy.' },
  { id: 11, title: 'Sell me a pair of socks', setup: 'I only wear sandals and I will never change.' },
  { id: 12, title: 'Convince me to move the team offsite to a campsite', setup: 'I am the CFO and I have seen the five-star quote. Make the tent win.' },
  { id: 13, title: 'Sell me ice cream in winter', setup: 'It is minus 5 outside and my office has no freezer.' },
  { id: 14, title: 'Sell me this pen', setup: 'You cannot say the word "pen".', twist: 'You cannot say the word "pen".' },
  { id: 15, title: 'Convince me to lend you my car for the weekend', setup: 'It is my car. I named it Gerald. I do not lend Gerald.' },
  { id: 16, title: 'Sell me a ticket to a boring conference', setup: 'The keynote is about spreadsheets. The coffee is lukewarm.' },
  { id: 17, title: 'Convince me to adopt a pet rock', setup: 'I am allergic to everything else. The rock has a good personality.' },
  { id: 18, title: 'Sell me a stapler', setup: 'I have three. I have never used any of them.' },
  { id: 19, title: 'Convince me to take the stairs', setup: 'I am the CEO, my office is on the 14th floor and I love the lift.' },
  { id: 20, title: 'Sell me a mirror', setup: 'I already know I look great. Give me a reason to check.' },
  { id: 21, title: 'Convince me to pay for parking at a place I never go', setup: 'I am the CFO. I will only say yes to an airtight reason.' },
  { id: 22, title: 'Sell me a calendar for next year', setup: 'It is November. I have a phone. I am not impressed.' },
  { id: 23, title: 'Convince me pineapple belongs on pizza', setup: 'I am Italian. I am the CEO. I have strong feelings.' },
  { id: 24, title: 'Sell me a coffee mug', setup: 'Close in under two minutes.', twist: 'Close in under two minutes.' },
  { id: 25, title: 'Convince me to adopt a four-day week', setup: 'I am the CEO. Clients call on Fridays. Make it work.' },
  { id: 26, title: 'Sell me a haunted house', setup: 'The ghost pays rent on time. That is the whole pitch.' },
  { id: 27, title: 'Convince me to switch from coffee to tea', setup: 'I am the CRO. Coffee is my personality.' },
  { id: 28, title: 'Sell me this pen', setup: 'You cannot mention the price.', twist: 'You cannot mention the price.' },
  { id: 29, title: 'Convince me to buy a lottery ticket for the whole team', setup: 'I am the CFO. I do not believe in luck.' },
  { id: 30, title: 'Sell me an alarm clock', setup: 'I wake up at 5 a.m. without one and I am smug about it.' },
  { id: 31, title: 'Convince me to give you a 20% raise', setup: 'I am your boss. I have the budget. I will not volunteer it.' },
  { id: 32, title: 'Sell me a notebook', setup: 'I only use my phone. Make paper feel like a power move.' },
  { id: 33, title: 'Convince me to try the office microwave', setup: 'Last time someone heated fish. I remember.' },
  { id: 34, title: 'Sell me a bottle of air', setup: 'It is from a mountain. I am sceptical. I am also curious.' },
  { id: 35, title: 'Convince me to give you my seat at the window', setup: 'I am the CEO. I have had this seat for 11 years.' },
]

function pad(n: number) { return n < 10 ? '0' + n : String(n) }
export function dayKey(d: Date = new Date()): string {
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
}

export function getTodayChallenge(): Challenge {
  const now = new Date()
  const dayNumber = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000)
  return CHALLENGES[dayNumber % CHALLENGES.length]
}

interface ChallengeState { last: string; streak: number; best: number; score: number | null }

function read(): ChallengeState {
  try {
    const raw = localStorage.getItem('sua_challenge')
    if (raw) return JSON.parse(raw) as ChallengeState
  } catch {}
  return { last: '', streak: 0, best: 0, score: null }
}

export function isChallengeDoneToday(): boolean {
  return read().last === dayKey()
}

export function getChallengeStreak(): { streak: number; best: number; todayScore: number | null } {
  const st = read()
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
  const alive = st.last === dayKey() || st.last === dayKey(yesterday)
  return { streak: alive ? st.streak : 0, best: st.best, todayScore: st.last === dayKey() ? st.score : null }
}

// Called once when the Results screen shows a finished challenge
export function markChallengeDone(score: number): { streak: number; best: number } {
  const st = read()
  const today = dayKey()
  if (st.last === today) return { streak: st.streak, best: st.best }
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
  const streak = st.last === dayKey(yesterday) ? st.streak + 1 : 1
  const next: ChallengeState = { last: today, streak, best: Math.max(st.best, streak), score }
  try { localStorage.setItem('sua_challenge', JSON.stringify(next)) } catch {}
  return { streak: next.streak, best: next.best }
}
