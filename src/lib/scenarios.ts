// Ready-made practice scenarios for the first run: tap one and you are recording in seconds.
// No made-up companies. You sell what you really sell, or play along.

export interface Scenario {
  id: string
  title: string
  sub: string
  product: string
  buyer: string
  goal: string
  seconds: number
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'pen',
    title: 'Sell me this pen',
    sub: 'The classic. Your buyers are a CEO, a CFO and a CRO. 3 minutes.',
    product: 'This pen',
    buyer: 'A CEO, a CFO and a CRO who are not easily impressed',
    goal: 'Make them want it, and ask for the sale',
    seconds: 180,
  },
  {
    id: 'meeting',
    title: 'Win 20 minutes with a CEO',
    sub: 'Pitch what you really sell, or invent something. 3 minutes.',
    product: 'A cold approach: get a Fortune 500 CEO to give you 20 minutes next week',
    buyer: 'A Fortune 500 CEO who gets 200 pitches a week',
    goal: 'Get them to agree to a 20-minute meeting next week',
    seconds: 180,
  },
  {
    id: 'price',
    title: 'Defend your price',
    sub: 'The buyer says you are 20% too expensive. 3 minutes.',
    product: 'Whatever you sell, at a price the buyer says is 20% too high',
    buyer: 'A Fortune 500 CFO who says you are 20% too expensive',
    goal: 'Keep your price and still get the deal',
    seconds: 180,
  },
]
