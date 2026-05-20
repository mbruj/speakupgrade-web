import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { checkAuth, checkUsage } from '../lib/api'
import { useAuthStore } from '../store'
import LegalFooter from '../components/LegalFooter'

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')

    try {
      const cleanEmail = email.trim().toLowerCase()
      const auth = await checkAuth(cleanEmail)

      if (auth.exists || auth.status === 'active') {
        // Get real plan + session data from usage endpoint
        const usage = await checkUsage(cleanEmail)
        setAuth(cleanEmail, usage.plan, usage.sessions_remaining, usage.sessions_reset_date)
        navigate('/setup')
      } else {
        setError('No account found. Please create an account first.')
      }
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
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ marginBottom: 14 }}>
            <span style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-0.03em', color: '#3B82F6' }}>SPEAKUP</span>
            <span style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-0.03em', color: '#ffffff' }}>GRADE</span>
          </div>
          <p style={{ color: '#A1A1AA', fontSize: 15, lineHeight: 1.6 }}>
            Better speaking. More impact.<br />Enter your email to get access.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
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
            {loading ? 'Checking...' : 'Get Access'}
          </button>
        </form>

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
