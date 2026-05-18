export const API_URL = 'https://speakupgrade-production.up.railway.app'
export const STRIPE_MONTHLY = 'https://buy.stripe.com/28EeVegaAg2741j7Tp7Vm03'
export const STRIPE_ANNUAL = 'https://buy.stripe.com/9B6fZi1fGdTZ0P78Xt7Vm02'
export const STRIPE_PORTAL = 'https://billing.stripe.com/p/login/bpc_1TRb2CJovqs3TTQbKYOPrhPa'
export const FREE_SESSION_LIMIT = 5
export const SPEAKING_TIPS = [
  'Pause before key points — silence commands attention.',
  'Vary your pace. Speed up for excitement, slow down for emphasis.',
  'Look directly into the camera as if making eye contact.',
  'Open with a strong statement, not an apology.',
  'Use concrete numbers instead of vague claims.',
  'Your hands should be visible and gesturing naturally.',
  'Filler words signal thinking out loud — pause instead.',
  'The best speakers sound like they are having a conversation.',
  'End with clarity. Tell them exactly what you want them to do or think.',
  'Posture matters. Sit or stand straight — it changes how your voice sounds.',
]
export const SCORE_LABELS: Record<string, string> = {
  overall: 'Overall', relevance: 'Relevance', pace: 'Pace',
  filler: 'Filler words', structure: 'Structure', confidence: 'Confidence',
  eye_contact: 'Eye contact', posture: 'Posture',
}
