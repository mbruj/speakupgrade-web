import { API_URL } from './constants'

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || `Request failed: ${res.status}`)
  }
  return res.json()
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`)
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}

// Auth
export interface AuthResponse {
  exists: boolean
  plan: 'free' | 'pro'
  sessions_count: number
  sessions_reset_date: string
}

export function checkAuth(email: string) {
  return post<AuthResponse>('/auth/check', { email })
}

// Usage
export interface UsageResponse {
  plan: 'free' | 'pro'
  sessions_remaining: number
  sessions_reset_date: string
  limit: number
}

export function checkUsage(email: string) {
  return get<UsageResponse>(`/usage/plan?email=${encodeURIComponent(email)}`)
}

export function incrementUsage(email: string) {
  return post<{ success: boolean }>('/usage/increment', { email })
}

// Grading
export interface GradingResult {
  verdict: string
  score_overall: number
  score_relevance: number
  score_pace: number
  score_filler: number
  score_structure: number
  score_confidence: number
  score_eye_contact: number
  score_posture: number
  words_per_minute: number
  filler_count: number
  filler_words: string[]
  transcript: string
  coach_summary: string
  conviction: string
  pauses: number[]
  confidence_language: string[]
  weak_language: string[]
  what_went_well: string[]
  improvements: string[]
  pace_feedback: string
  filler_feedback: string
  structure_feedback: string
  confidence_feedback: string
}

export interface GradePayload {
  audioBase64: string
  frames: string[]  // base64 JPEG strings
  topic: string
  goal: string
  audience: string
  targetSeconds: number
  email: string
}

export function gradeSession(payload: GradePayload) {
  return post<GradingResult>('/grade-base64', payload)
}

// Email results
export function emailResults(payload: {
  email: string
  coachSummary: string
  confidenceLanguage: string[]
  blScores: Record<string, number>
  blFeedback: Record<string, string>
}) {
  return post('/email-results', payload)
}

// Feedback
export function submitFeedback(email: string, message: string) {
  return post('/feedback', { email, message })
}

// Affiliates
export function validateAffiliate(code: string) {
  return post<{ valid: boolean; affiliate?: string }>('/affiliates/validate', { code })
}

export function applyAffiliate(name: string, email: string) {
  return post('/affiliates/apply', { name, email })
}
