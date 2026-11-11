// Ready-made practice scenarios for the first run: tap one and you are recording in seconds.
// Products are fictional on purpose. The facts are the only facts the rep may use,
// so the grader can check every claim against them.

export interface Scenario {
  id: string
  title: string
  sub: string
  product: string
  buyer: string
  goal: string
  facts: string[]
  seconds: number
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'cfo-price',
    title: 'The CFO says your price is too high',
    sub: 'AuditFlow, $90,000 per year. 3 minutes.',
    product: 'AuditFlow: automated invoice matching and month-end close ($90,000 per year)',
    buyer: 'Fortune 500 CFO',
    goal: 'Get the CFO to agree to a paid pilot',
    facts: ['Month-end close drops from 9 days to 5 days in pilots', 'Removes about 70% of manual invoice matching', 'Pays back inside 8 months in the pilots', 'SOC 2 Type II certified'],
    seconds: 180,
  },
  {
    id: 'cro-adoption',
    title: 'The CRO doubts your reps will use it',
    sub: 'PipelineIQ, $150,000 per year. 3 minutes.',
    product: 'PipelineIQ: forecasting that flags deals likely to slip ($150,000 per year)',
    buyer: 'Fortune 500 Chief Revenue Officer',
    goal: 'Get the CRO to agree to a 6-week rollout',
    facts: ['Forecast accuracy improved from 71% to 86% in pilots', 'Flags at-risk deals 3 weeks earlier than managers did', 'Needs 12 months of CRM history to start', 'Rollout takes 6 weeks'],
    seconds: 180,
  },
  {
    id: 'ceo-why-now',
    title: 'Win a CEO in 90 seconds: why now?',
    sub: 'Shieldline, $240,000 per year. Quick round.',
    product: 'Shieldline: real-time payment fraud detection ($240,000 per year)',
    buyer: 'Fortune 500 CEO',
    goal: 'Get the CEO to sponsor a pilot',
    facts: ['Cut fraud losses by 38% in pilots', 'False declines fell by 22%', 'Decisions in under 80 milliseconds', 'Pricing is flat, not per transaction'],
    seconds: 90,
  },
]
