import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GradingResult } from '../lib/api'

// ─── Auth Store ───────────────────────────────────────────────────────────────

interface AuthState {
  email: string | null
  plan: 'free' | 'pro'
  sessionsRemaining: number
  sessionsResetDate: string | null
  setAuth: (email: string, plan: 'free' | 'pro', sessionsRemaining: number, resetDate: string) => void
  setPlan: (plan: 'free' | 'pro') => void
  decrementSessions: () => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      email: null,
      plan: 'free',
      sessionsRemaining: 5,
      sessionsResetDate: null,

      setAuth: (email, plan, sessionsRemaining, resetDate) =>
        set({ email, plan, sessionsRemaining, sessionsResetDate: resetDate }),

      setPlan: (plan) => set({ plan }),

      decrementSessions: () =>
        set((s) => ({ sessionsRemaining: Math.max(0, s.sessionsRemaining - 1) })),

      logout: () =>
        set({ email: null, plan: 'free', sessionsRemaining: 5, sessionsResetDate: null }),
    }),
    { name: 'speakupgrade-auth' }
  )
)

// ─── Session Store ────────────────────────────────────────────────────────────

interface SessionParams {
  topic: string
  goal: string
  audience: string
  targetSeconds: number
  isChallenge: boolean
}

interface SessionState {
  params: SessionParams | null
  results: GradingResult | null
  hideInstructions: boolean

  setParams: (params: SessionParams) => void
  setResults: (results: GradingResult) => void
  setHideInstructions: (hide: boolean) => void
  clearSession: () => void
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      params: null,
      results: null,
      hideInstructions: false,

      setParams: (params) => set({ params }),
      setResults: (results) => set({ results }),
      setHideInstructions: (hide) => set({ hideInstructions: hide }),
      clearSession: () => set({ params: null, results: null }),
    }),
    { name: 'speakupgrade-session', partialize: (s) => ({ hideInstructions: s.hideInstructions }) }
  )
)
