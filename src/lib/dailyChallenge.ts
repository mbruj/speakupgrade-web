// Daily challenge: one fictional product per day, 5 minutes to convince the buying committee.
// Products are fictional on purpose: the facts below are the only facts the rep may use,
// so the grader can check every claim against them.

export interface Challenge {
  id: number
  name: string
  line: string
  price: string
  facts: string[]
}

export const CHALLENGE_SECONDS = 5 * 60
export const CHALLENGE_BUYER = 'Fortune 500 buying committee: CEO, CFO and CRO'
export const CHALLENGE_GOAL = 'Get the buying committee to agree to buy'

const CHALLENGES: Challenge[] = [
  { id: 0, name: 'CloseLoop', line: 'AI deal-desk software that approves discounts in minutes', price: '$120,000 per year', facts: ['Average discount approval drops from 4 days to 40 minutes in pilots', 'Pilot customers saw 6% higher average deal size', 'Integrates with Salesforce in 2 weeks', 'Cancel at month 12 with no penalty'] },
  { id: 1, name: 'AuditFlow', line: 'Automated invoice matching and month-end close', price: '$90,000 per year', facts: ['Month-end close drops from 9 days to 5 days in pilots', 'Removes about 70% of manual invoice matching', 'Pays back inside 8 months in the pilots', 'SOC 2 Type II certified'] },
  { id: 2, name: 'PipelineIQ', line: 'Forecasting that flags deals likely to slip', price: '$150,000 per year', facts: ['Forecast accuracy improved from 71% to 86% in pilots', 'Flags at-risk deals 3 weeks earlier than managers did', 'Needs 12 months of CRM history to start', 'Rollout takes 6 weeks'] },
  { id: 3, name: 'Shieldline', line: 'Real-time payment fraud detection', price: '$240,000 per year', facts: ['Cut fraud losses by 38% in pilots', 'False declines fell by 22%', 'Decisions in under 80 milliseconds', 'Pricing is flat, not per transaction'] },
  { id: 4, name: 'FleetPulse', line: 'Predictive maintenance for truck fleets', price: '$18 per vehicle per month', facts: ['Unplanned downtime down 27% in pilots', 'Fleet of 5,000 vehicles costs about $1.08M per year', 'Installs in 20 minutes per vehicle', 'Works with all major truck brands'] },
  { id: 5, name: 'TalentScope', line: 'Skills-based hiring platform for large employers', price: '$200,000 per year', facts: ['Time to hire cut from 52 to 34 days in pilots', 'First-year attrition down 11%', 'Replaces two existing vendors for most customers', 'Integrates with Workday and SAP SuccessFactors'] },
  { id: 6, name: 'CarbonLedger', line: 'Emissions reporting that passes audit', price: '$110,000 per year', facts: ['Report preparation falls from 14 weeks to 4 weeks', 'Meets EU CSRD requirements', 'Audit-ready evidence trail for every number', 'Customers include 3 listed manufacturers (fictional)'] },
  { id: 7, name: 'SupportCopilot', line: 'AI agent that resolves customer tickets', price: '$0.90 per resolved ticket', facts: ['Resolves 41% of tickets with no human in pilots', 'Customer satisfaction unchanged at 4.4 out of 5', 'Cost per ticket falls from $6.10 to $3.40', 'Hands off to a person when unsure'] },
  { id: 8, name: 'ContractLens', line: 'Contract review and renewal tracking', price: '$130,000 per year', facts: ['Review time per contract falls from 3 hours to 25 minutes', 'Caught $2.1M of missed auto-renewals in one pilot', 'Legal team signs off on every flagged clause', 'Rollout takes 5 weeks'] },
  { id: 9, name: 'WarehouseOS', line: 'Pick-path optimisation for distribution centers', price: '$300,000 per year per site', facts: ['Orders picked per hour up 19% in pilots', 'No new hardware needed', 'Payback in about 11 months at a 400-person site', 'Go-live in 8 weeks'] },
  { id: 10, name: 'CyberDrill', line: 'Continuous phishing and breach simulation', price: '$75,000 per year', facts: ['Click rate on phishing fell from 14% to 3% in 6 months', 'Reduces cyber-insurance premium at 2 of 3 pilot customers', 'Covers up to 50,000 employees', 'Reports go straight to the board'] },
  { id: 11, name: 'PriceWise', line: 'Dynamic pricing for B2B product catalogs', price: '$260,000 per year', facts: ['Gross margin up 1.8 points in pilots', 'No change in win rate', 'Works on catalogs of 100,000+ SKUs', 'Takes 10 weeks to go live'] },
  { id: 12, name: 'OnboardNow', line: 'Employee onboarding automation', price: '$60,000 per year', facts: ['New-hire time to first productive week cut from 6 weeks to 4', 'HR admin hours down 35%', 'Used for 20,000 hires per year at one pilot', 'Free for the first 90 days'] },
  { id: 13, name: 'LeadForge', line: 'Outbound prospecting engine for enterprise sales teams', price: '$180,000 per year', facts: ['Meetings booked per rep per month up from 9 to 14 in pilots', 'Only contacts with a lawful basis under GDPR', 'Cost per meeting down 31%', 'Reps keep full control of messages sent'] },
  { id: 14, name: 'CashRadar', line: 'Cash-flow forecasting for treasury teams', price: '$100,000 per year', facts: ['Forecast error cut from 12% to 4% in pilots', 'Frees about $18M of trapped working capital at a $5B revenue pilot', 'Connects to 40 bank formats', 'Live in 6 weeks'] },
  { id: 15, name: 'FieldSense', line: 'Mobile app for field service technicians', price: '$25 per technician per month', facts: ['First-time fix rate up from 74% to 83% in pilots', 'Fewer repeat visits saves about $140 per job', 'Works offline', 'Typical customer has 3,000 technicians'] },
  { id: 16, name: 'RenewalRadar', line: 'Churn prediction for subscription businesses', price: '$140,000 per year', facts: ['Predicts churn 90 days ahead with 82% precision', 'Retained about 2.3% more annual revenue in pilots', 'Uses data you already have', 'Customer success team gets a ranked list every Monday'] },
  { id: 17, name: 'ProcureAI', line: 'Spend analysis and supplier negotiation support', price: '$220,000 per year or 10% of savings found', facts: ['Found savings of 4.5% of addressable spend in pilots', 'Pays for itself in about 5 months', 'Reads invoices in 14 languages', 'Savings are verified by your finance team before any fee'] },
  { id: 18, name: 'SafeSite', line: 'Computer-vision safety monitoring for factories', price: '$40,000 per site per year', facts: ['Recordable incidents down 31% in pilots', 'Cameras you already own work', 'No faces stored, privacy reviewed by works councils', 'Insurer gave a premium credit at one pilot'] },
  { id: 19, name: 'LearnLoop', line: 'Sales training with AI role-play for large teams', price: '$95 per rep per year', facts: ['New-rep ramp time cut from 5 months to 3.5 in pilots', 'Quota attainment of new hires up 9 points', 'Reps practice 10 minutes a day on their phones', 'Managers see who is practising and who is not'] },
  { id: 20, name: 'DocuSage', line: 'Document processing for insurance claims', price: '$350,000 per year', facts: ['Claim handling time down from 11 days to 6 in pilots', 'Straight-through processing of 38% of simple claims', 'Every automated decision is auditable', 'Runs inside your own cloud'] },
  { id: 21, name: 'EnergyMind', line: 'Building energy optimisation', price: '$0 upfront, 20% of savings', facts: ['Energy bills down 17% in pilots', 'No fee if there are no savings', 'Covers 1,200 buildings at one pilot customer', 'Savings verified by an independent engineer'] },
  { id: 22, name: 'ChannelPilot', line: 'Partner management platform for indirect sales', price: '$160,000 per year', facts: ['Partner-sourced revenue up 24% in pilots', 'Partner onboarding cut from 60 to 21 days', 'Replaces spreadsheets at 80% of customers', 'Partners log in free'] },
  { id: 23, name: 'RiskRadar', line: 'Third-party and supplier risk monitoring', price: '$185,000 per year', facts: ['Flagged 9 supplier failures an average of 7 weeks early in pilots', 'Monitors 25,000 suppliers', 'Covers sanctions, finances and cyber posture', 'Alerts go to the supplier owner and the CFO'] },
  { id: 24, name: 'MeetingMint', line: 'Meeting notes and action tracking for executives', price: '$30 per user per month', facts: ['Saves each executive about 4 hours per week in pilots', 'Action items completed on time up from 52% to 71%', 'Data stays in your region', 'Works with Teams, Zoom and Meet'] },
  { id: 25, name: 'LoadLogic', line: 'Freight procurement marketplace', price: '1.5% of freight spend', facts: ['Freight cost down 6.2% in pilots', 'Access to 2,400 vetted carriers', 'No minimum volume', 'Carriers paid in 7 days, you pay in 45'] },
  { id: 26, name: 'ClaimGuard', line: 'Warranty claims fraud detection for manufacturers', price: '$125,000 per year', facts: ['Warranty cost down 5.4% in pilots', 'Reviewed claims fall from 100% to 18%', 'Explains every flag in plain language', 'Live in 7 weeks'] },
  { id: 27, name: 'DealRoom360', line: 'Digital sales room for complex B2B deals', price: '$110,000 per year', facts: ['Sales cycle shortened by 18 days in pilots', 'Win rate on deals above $250k up 5 points', 'Buyers do not need an account', 'Shows which stakeholders opened what'] },
  { id: 28, name: 'PayrollPilot', line: 'Global payroll consolidation', price: '$12 per employee per month', facts: ['Replaces 11 local providers with one on average', 'Payroll errors down 62% in pilots', 'Covers 90 countries', 'Saves about $1.4M per year at 20,000 employees'] },
  { id: 29, name: 'ShelfSmart', line: 'Demand forecasting for retail inventory', price: '$280,000 per year', facts: ['Stock-outs down 23% in pilots', 'Excess inventory down 14%', 'Handles promotions and weather', 'Weekly forecasts for 60,000 products'] },
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
