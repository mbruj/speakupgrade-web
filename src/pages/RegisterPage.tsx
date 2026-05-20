import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { checkAuth, checkUsage } from '../lib/api'
import { useAuthStore } from '../store'
import LegalFooter from '../components/LegalFooter'

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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    setLoading(true)
    setError('')

    try {
      // Check if already exists
      const auth = await checkAuth(email.trim().toLowerCase())
      if (auth.exists) {
        setError('An account with this email already exists. Please log in.')
        setLoading(false)
        return
      }

      // Subscribe to MailerLite
      const form = new FormData()
      form.append('fields[name]', name.trim())
      form.append('fields[email]', email.trim().toLowerCase())
      if (referral.trim()) {
        form.append('fields[referral_code]', referral.trim().toUpperCase())
      }

      await fetch(MAILERLITE_FORM, { method: 'POST', body: form, mode: 'no-cors' })

      // Re-check auth after signup, get plan from usage
      const usage = await checkUsage(email.trim().toLowerCase())
      setAuth(
        email.trim().toLowerCase(),
        usage.plan ?? 'free',
        usage.sessions_remaining ?? 5,
        usage.sessions_reset_date ?? ''
      )
      navigate('/setup')
    } catch (err) {
      setError('Something went wrong. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Create Account</h1>
          <p style={{ color: '#A1A1AA', fontSize: 15, lineHeight: 1.6 }}>
            Sign up to get access. You will receive a confirmation email.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
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

          {error && (
            <p style={{ color: '#EF4444', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary" disabled={loading || !name.trim() || !email.trim()}>
            {loading ? 'Creating account...' : 'Subscribe and Get Access'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 28 }}>
          <button
            onClick={() => navigate('/')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3B82F6', fontSize: 14 }}
          >
            Already subscribed? Log in
          </button>
        </p>

        <p style={{ color: '#52525B', fontSize: 11, textAlign: 'center', marginTop: 20, lineHeight: 1.6 }}>
          By continuing you agree to our{' '}
          <a
            href="https://www.speakupgrade.com/privacy-policy/"
            target="_blank"
            rel="noreferrer"
            style={{ color: '#A1A1AA', textDecoration: 'underline' }}
          >
            Privacy Policy
          </a>
        </p>
      </div>
      <LegalFooter />
    </div>
  )
}
