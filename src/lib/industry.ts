// The industry the three executives work in. Stored on this device and sent with every pitch.
const KEY = 'sua_industry'

export const INDUSTRIES = [
  'Software / SaaS',
  'Financial services',
  'Healthcare',
  'Retail / e-commerce',
  'Manufacturing',
  'Professional services',
  'Real estate',
  'Logistics',
  'Energy',
  'Education',
]

export function getIndustry(): string {
  try { return localStorage.getItem(KEY) || '' } catch { return '' }
}

export function setIndustry(v: string) {
  try { if (v) localStorage.setItem(KEY, v); else localStorage.removeItem(KEY) } catch {}
}
