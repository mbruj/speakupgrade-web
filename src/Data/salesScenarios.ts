// src/data/salesScenarios.ts
// Shown on Setup page in place of the daily challenge for team users.
// Selecting one prefills topic/goal/audience exactly like a daily challenge does today.

export interface SalesScenario {
  topic: string
  goal: string
  audience: string
}

export interface SalesCategory {
  key: string
  label: string
  description: string
  scenarios: SalesScenario[]
}

export const SALES_CATEGORIES: SalesCategory[] = [
  {
    key: 'cold_call',
    label: 'Cold Call Opener',
    description: 'Open a cold call and earn 30 seconds of attention.',
    scenarios: [
      { topic: 'Cold call opener for a CFO who has never heard of your company', goal: 'Get them to agree to a 15-minute follow-up call', audience: 'A busy, skeptical CFO who screens most cold calls' },
      { topic: 'Cold call to a marketing director interrupted mid-meeting', goal: "Earn permission to explain why you called in under 20 seconds", audience: 'A marketing director who answered by mistake and is already annoyed' },
    ],
  },
  {
    key: 'discovery',
    label: 'Discovery Call',
    description: 'Ask questions that uncover real pain, not surface-level answers.',
    scenarios: [
      { topic: "Discovery call to understand a prospect's current workflow problems", goal: 'Identify the specific bottleneck costing them the most time or money', audience: 'An operations manager who says things are "fine" but keeps hinting at frustration' },
    ],
  },
  {
    key: 'objection_handling',
    label: 'Objection Handling',
    description: 'Respond to a real objection without caving on price.',
    scenarios: [
      { topic: 'Responding to "Your price is too high compared to Competitor X"', goal: 'Reframe the conversation around value without immediately discounting', audience: 'A procurement lead comparing three vendors on price alone' },
      { topic: 'Responding to "We already tried something like this and it didn\'t work"', goal: 'Address the past failure directly and rebuild confidence', audience: 'A VP burned by a failed tool rollout last year' },
    ],
  },
  {
    key: 'closing',
    label: 'Closing the Deal',
    description: 'Ask for the business clearly and handle last-minute hesitation.',
    scenarios: [
      { topic: 'Closing call after a successful demo and positive verbal feedback', goal: 'Get a verbal commitment and agree on a signature date', audience: 'An enthusiastic buyer who keeps saying "this looks great" but hasn\'t committed' },
    ],
  },
  {
    key: 'negotiation',
    label: 'Negotiation',
    description: 'Hold your ground on terms while keeping the relationship warm.',
    scenarios: [
      { topic: 'Negotiating contract length when the prospect only wants a 1-month trial', goal: 'Land on a 6-month minimum by tying it to onboarding value', audience: 'A budget-conscious founder wary of long commitments' },
    ],
  },
  {
    key: 'elevator_pitch',
    label: 'Elevator Pitch',
    description: 'Explain what you sell and why it matters in under 60 seconds.',
    scenarios: [
      { topic: 'Elevator pitch to a stranger at an industry conference', goal: 'Make them curious enough to ask a follow-up question', audience: 'A mid-level manager at a conference networking event, half-listening' },
    ],
  },
]

export function randomScenario(categoryKey: string): SalesScenario | null {
  const cat = SALES_CATEGORIES.find((c) => c.key === categoryKey)
  if (!cat || cat.scenarios.length === 0) return null
  return cat.scenarios[Math.floor(Math.random() * cat.scenarios.length)]
}
