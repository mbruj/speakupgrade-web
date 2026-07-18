// src/hooks/useEffectiveAccess.ts
//
// The `plan` value in useAuthStore reflects personal subscription status only,
// set once at login, and never refreshed when org membership is added later
// (e.g. you manually assigning someone org_role in Supabase after they'd
// already logged in). Team members should get full access because their
// company pays for it — this hook checks that directly instead of trusting
// the possibly-stale `plan` in the store.
//
// Use this anywhere a page currently does `const isPro = plan === 'pro'`.

import { useEffect, useState } from 'react'
import { useAuthStore } from '../store'
import { API_URL } from '../lib/constants'

export function useEffectiveAccess() {
  const { email, plan } = useAuthStore()
  const [orgRole, setOrgRole] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (!email) { setChecked(true); return }
    fetch(`${API_URL}/org/me?email=${encodeURIComponent(email)}`)
      .then(r => r.json())
      .then(data => setOrgRole(data.org_role || null))
      .catch(() => {})
      .finally(() => setChecked(true))
  }, [email])

  const isPro = plan === 'pro' || !!orgRole
  return { isPro, orgRole, checked }
}
