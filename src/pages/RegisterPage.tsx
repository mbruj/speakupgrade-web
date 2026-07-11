import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { checkAuth, checkUsage } from '../lib/api'
import { useAuthStore } from '../store'
import LegalFooter from '../components/LegalFooter'
import { API_URL } from '../lib/constants'

const MAILERLITE_FORM =
  'https://assets.mailerlite.com/jsonp/2217559/forms/184376458520561428/subscribe'

export default function RegisterPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [referral, setReferral] = useState(
    new URLSearchParams(window.location.search).get('ref') ?? ''
  )
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'register' | 'code'>('register')
  const [newsletterConsent, setNewsletterConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendCountdown, setResendCountdown] = useState(0)
  const codeRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (step === 'code') {
      setTimeout(() => codeRef.current?.focus(), 100)
      setResendCountdown(60)
    }
  }, [step])

  useEffect(() => {
    if (resendCountdown <= 0) return
    const t = setTimeout(() => setResendCountdown(r => r - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCountdown])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    setLoading(true)
    setError('')

    try {
      const cleanEmail = email.trim().toLowerCase()

      // Check if already exists
      const auth = await checkAuth(cleanEmail)
      if (auth.exists || auth.status === 'active') {
        setError('An account with this email already exists. Please log in.')
        setLoading(false)
        return
      }

      // Subscribe to MailerLite only if user gave consent
      if (newsletterConsent) {
        const form = new FormData()
        form.append('fields[name]', name.trim())
        form.append('fields[email]', cleanEmail)
        if (referral.trim()) {
          form.append('fields[referral_code]', referral.trim().toUpperCase())
        }
        await fetch(MAILERLITE_FORM, { method: 'POST', body: form, mode: 'no-cors' })
      }

      // Send OTP
      const res = await fetch(`${API_URL}/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, isNewUser: true, newsletterConsent, referralCode: referral.trim().toUpperCase() || null }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to send verification code.')
        return
      }

      setStep('code')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return
    setLoading(true)
    setError('')

    try {
      const cleanEmail = email.trim().toLowerCase()
      const res = await fetch(`${API_URL}/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, code: code.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Invalid code.')
        return
      }

      const usage = await checkUsage(cleanEmail)
      setAuth(cleanEmail, usage.plan ?? 'free', usage.sessions_remaining ?? 3, usage.sessions_reset_date ?? '')
      navigate('/onboarding')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCountdown > 0) return
    setError('')
    setCode('')
    setLoading(true)
    try {
      await fetch(`${API_URL}/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      setResendCountdown(60)
    } catch {
      setError('Failed to resend. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="container">

        {step === 'register' ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Create Account</h1>
              <p style={{ color: '#A1A1AA', fontSize: 15, lineHeight: 1.6 }}>
                Sign up to get access. We will send a verification code to your email.
              </p>
            </div>

            <form onSubmit={handleRegister}>
              <div style={{ marginBottom: 14 }}>
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div style={{ marginBottom: 14 }}>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div style={{ marginBottom: 24 }}>
                <input
                  type="text"
                  placeholder="Referral code (optional)"
                  value={referral}
                  onChange={(e) => setReferral(e.target.value)}
                  style={{ textTransform: 'uppercase' }}
                />
              </div>

              <div style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 10, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, padding: '12px 14px' }}>
                <input
                  type="checkbox"
                  id="newsletter"
                  checked={newsletterConsent}
                  onChange={(e) => setNewsletterConsent(e.target.checked)}
                  style={{ marginTop: 3, flexShrink: 0, accentColor: '#3B82F6', width: 16, height: 16, cursor: 'pointer' }}
                />
                <label htmlFor="newsletter" style={{ fontSize: 13, color: '#d4d4d8', lineHeight: 1.5, cursor: 'pointer' }}>
                  <span style={{ fontWeight: 700, color: '#3B82F6' }}>Get exclusive discounts</span> — join the newsletter for member-only deals, weekly speaking tips, and early access to new features. Unsubscribe anytime.
                </label>
              </div>

              {error && (
                <p style={{ color: '#EF4444', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>{error}</p>
              )}

              <button type="submit" className="btn-primary" disabled={loading || !name.trim() || !email.trim()}>
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Check your email</h1>
              <p style={{ color: '#A1A1AA', fontSize: 15, lineHeight: 1.6 }}>
                We sent a 6-digit code to <strong style={{ color: '#ffffff' }}>{email}</strong>
              </p>
            </div>

            <form onSubmit={handleVerify}>
              <div style={{ marginBottom: 16 }}>
                <input
                  ref={codeRef}
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  autoComplete="one-time-code"
                  style={{ textAlign: 'center', fontSize: 28, fontWeight: 700, letterSpacing: '0.2em' }}
                />
              </div>

              {error && (
                <p style={{ color: '#EF4444', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>{error}</p>
              )}

              <button type="submit" className="btn-primary" disabled={loading || code.length !== 6}>
                {loading ? 'Verifying...' : 'Verify and get access'}
              </button>

              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCountdown > 0}
                  style={{ background: 'none', border: 'none', cursor: resendCountdown > 0 ? 'default' : 'pointer', color: resendCountdown > 0 ? '#52525B' : '#3B82F6', fontSize: 13, fontFamily: 'inherit' }}
                >
                  {resendCountdown > 0 ? `Resend code in ${resendCountdown}s` : 'Resend code'}
                </button>
              </div>

              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => { setStep('register'); setError(''); setCode('') }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A1A1AA', fontSize: 13, fontFamily: 'inherit' }}
                >
                  ← Change details
                </button>
              </div>
            </form>
          </>
        )}

        <p style={{ textAlign: 'center', marginTop: 28 }}>
          <button
            onClick={() => navigate('/')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3B82F6', fontSize: 14, fontFamily: 'inherit' }}
          >
            Already have an account? Log in
          </button>
        </p>

        <p style={{ color: '#52525B', fontSize: 11, textAlign: 'center', marginTop: 20, lineHeight: 1.6 }}>
          By continuing you agree to our{' '}
          <a href="https://www.speakupgrade.com/terms-of-use/" target="_blank" rel="noreferrer" style={{ color: '#A1A1AA', textDecoration: 'underline' }}>
            Terms of Service
          </a>
          {' '}and{' '}
          <a href="https://www.speakupgrade.com/privacy-policy/" target="_blank" rel="noreferrer" style={{ color: '#A1A1AA', textDecoration: 'underline' }}>
            Privacy Policy
          </a>
        </p>
        <LegalFooter />
      </div>
    </div>
  )
}
