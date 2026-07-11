import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { checkUsage } from '../lib/api'
import { useAuthStore } from '../store'
import LegalFooter from '../components/LegalFooter'
import { API_URL } from '../lib/constants'

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [email, setEmail] = useState('')
  const ROTATING_WORDS = ['interview.', 'presentation.', 'pitch.', 'negotiation.', 'promotion.', 'meeting.', 'clients.']
  const [wordIndex, setWordIndex] = useState(0)
  const [wordFade, setWordFade] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setWordFade(false)
      setTimeout(() => {
        setWordIndex(prev => (prev + 1) % ROTATING_WORDS.length)
        setWordFade(true)
      }, 300)
    }, 1000)
    return () => clearInterval(interval)
  }, [])
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')
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

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`${API_URL}/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong.')
        return
      }
      setStep('code')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`${API_URL}/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: code.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Invalid code.')
        return
      }
      const usage = await checkUsage(email.trim().toLowerCase())
      setAuth(email.trim().toLowerCase(), usage.plan, usage.sessions_remaining, usage.sessions_reset_date)

      // Check onboarding status — redirect to onboarding if not completed
      const cleanEmail = email.trim().toLowerCase()
      try {
        const profileRes = await fetch(`${API_URL}/coach/profile?email=${encodeURIComponent(cleanEmail)}`)
        const profileData = await profileRes.json()
        const isOnboarded = profileData.focus && profileData.focus.length > 0
        if (!isOnboarded || cleanEmail === 'm@bruj.com') {
          navigate('/onboarding')
          return
        }
      } catch {
        // on error just go to setup
      }
      navigate('/setup')
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
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ marginBottom: 14 }}>
            <span style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-0.03em', color: '#3B82F6' }}>SPEAKUP</span>
            <span style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-0.03em', color: '#ffffff' }}>GRADE</span>
          </div>
          <p style={{ color: '#A1A1AA', fontSize: 15, lineHeight: 1.6 }}>
            {step === 'email'
              ? <>
                  <div style={{ marginBottom: 16 }}>
                    <span style={{ color: '#ffffff', fontSize: 22, fontWeight: 700 }}>Win your </span>
                    <span style={{ color: '#3B82F6', fontSize: 22, fontWeight: 700, opacity: wordFade ? 1 : 0, transition: 'opacity 0.3s ease', display: 'inline-block' }}>
                      {ROTATING_WORDS[wordIndex]}
                    </span>
                  </div>
                  Enter your email to get access.
                </>
              : <>Check your email.<br />Enter the 6-digit code we sent to <strong style={{ color: '#ffffff' }}>{email}</strong></>
            }
          </p>
        </div>

        {step === 'email' ? (
          <form onSubmit={handleSendCode}>
            <div style={{ marginBottom: 16 }}>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
            </div>
            {error && (
              <p style={{ color: '#EF4444', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>{error}</p>
            )}
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Sending code...' : 'Send login code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode}>
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
              {loading ? 'Verifying...' : 'Log in'}
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
                onClick={() => { setStep('email'); setError(''); setCode('') }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A1A1AA', fontSize: 13, fontFamily: 'inherit' }}
              >
                ← Change email
              </button>
            </div>
          </form>
        )}

        <p style={{ textAlign: 'center', marginTop: 28 }}>
          <button onClick={() => navigate('/register')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3B82F6', fontSize: 14, fontFamily: 'inherit' }}>
            New here? Create an account
          </button>
        </p>

        <p style={{ color: '#52525B', fontSize: 12, textAlign: 'center', marginTop: 20, lineHeight: 1.6 }}>
          By continuing you agree to our{' '}
          <a href="https://www.speakupgrade.com/terms-of-use/" target="_blank" rel="noreferrer" style={{ color: '#A1A1AA', textDecoration: 'underline' }}>
            Terms of Service
          </a>
          {' '}and{' '}
          <a href="https://www.speakupgrade.com/privacy-policy/" target="_blank" rel="noreferrer" style={{ color: '#A1A1AA', textDecoration: 'underline' }}>
            Privacy Policy
          </a>
        </p>
      </div>
      <LegalFooter />
    </div>
  )
}
