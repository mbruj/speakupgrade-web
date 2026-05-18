import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store'
import { API_URL } from '../lib/constants'

// ─── Affiliate Page ───────────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  'Apply below. We will send your unique referral code within 48 hours.',
  'Share your code on social media, in your newsletter, or at events.',
  'When someone subscribes using your code, you earn 50% of their payment.',
  'Monthly plan: 5 EUR per referral. Annual plan: 50 EUR per referral.',
  'Commissions are held for 30 days then paid via bank transfer or PayPal.',
]

export function AffiliatePage() {
  const navigate = useNavigate()
  const { email } = useAuthStore()
  const [audienceText, setAudienceText] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!audienceText.trim() || !email) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/affiliates/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: email,
          email: email,
          audience: audienceText.trim(),
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      setSent(true)
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#09090B', display: 'flex', flexDirection: 'column', padding: '48px 20px 48px', maxWidth: 480, margin: '0 auto' }}>

      <button onClick={() => navigate('/setup')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A1A1AA', fontSize: 14, textAlign: 'left', marginBottom: 20, fontFamily: 'inherit' }}>
        Back
      </button>

      <div style={{ marginBottom: 14 }}>
        <span style={{ background: '#1E3A5F', color: '#3B82F6', fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 20, border: '1px solid rgba(59,130,246,0.3)', letterSpacing: '0.08em' }}>
          AFFILIATE PROGRAM
        </span>
      </div>

      <h1 style={{ fontSize: 28, fontWeight: 800, color: '#ffffff', marginBottom: 12, lineHeight: 1.2 }}>
        Earn with SpeakUPgrade
      </h1>
      <p style={{ fontSize: 15, color: '#A1A1AA', lineHeight: 1.65, marginBottom: 28 }}>
        Share SpeakUPgrade with your audience and earn 50% commission on every paid subscription you refer.
      </p>

      {!sent ? (
        <>
          {/* How it works */}
          <div style={{ background: '#1A1A1E', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '18px 16px', marginBottom: 28 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#A1A1AA', letterSpacing: '0.1em', marginBottom: 16 }}>HOW IT WORKS</p>
            {HOW_IT_WORKS.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, marginBottom: i < HOW_IT_WORKS.length - 1 ? 16 : 0, alignItems: 'flex-start' }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#1E3A5F', border: '1px solid rgba(59,130,246,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#3B82F6' }}>{i + 1}</span>
                </div>
                <p style={{ fontSize: 14, color: '#ffffff', lineHeight: 1.6, margin: 0 }}>{item}</p>
              </div>
            ))}
          </div>

          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#ffffff', marginBottom: 14 }}>Tell us about your audience</h2>

          <form onSubmit={handleSubmit}>
            <textarea
              rows={4}
              placeholder="Who do you reach? E.g. Toastmasters community, LinkedIn followers, podcast listeners..."
              value={audienceText}
              onChange={(e) => setAudienceText(e.target.value)}
              style={{ marginBottom: 16, resize: 'vertical', lineHeight: 1.6 }}
              required
            />

            {error && <p style={{ color: '#EF4444', fontSize: 13, marginBottom: 14, textAlign: 'center' }}>{error}</p>}

            <button
              type="submit"
              disabled={loading || !audienceText.trim()}
              style={{ width: '100%', background: '#3B82F6', color: '#fff', fontWeight: 700, fontSize: 16, padding: '16px', borderRadius: 12, border: 'none', cursor: loading || !audienceText.trim() ? 'not-allowed' : 'pointer', opacity: loading || !audienceText.trim() ? 0.5 : 1, fontFamily: 'inherit', marginBottom: 12 }}
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>

            <p style={{ fontSize: 12, color: '#52525B', textAlign: 'center' }}>
              We will reply to your registered account email within 48 hours.
            </p>
          </form>
        </>
      ) : (
        <div style={{ background: '#1A1A1E', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '40px 24px', textAlign: 'center', marginTop: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#ffffff', marginBottom: 10 }}>Application received</h2>
          <p style={{ fontSize: 14, color: '#A1A1AA', lineHeight: 1.7 }}>
            We'll review your application and reply to {email} within 48 hours.
          </p>
          <button onClick={() => navigate('/setup')} style={{ marginTop: 24, background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#A1A1AA', fontSize: 14, fontWeight: 600, padding: '12px 24px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit' }}>
            Back to app
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Feedback Page ────────────────────────────────────────────────────────────

export function FeedbackPage() {
  const navigate = useNavigate()
  const { email } = useAuthStore()
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !email) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, message: message.trim() }),
      })
      if (!res.ok) throw new Error(await res.text())
      setSent(true)
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#09090B', display: 'flex', flexDirection: 'column', padding: '48px 20px', maxWidth: 480, margin: '0 auto' }}>

      <button onClick={() => navigate('/setup')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A1A1AA', fontSize: 14, textAlign: 'left', marginBottom: 28, fontFamily: 'inherit' }}>
        Back
      </button>

      {sent ? (
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#ffffff', marginBottom: 10 }}>Thanks for the feedback</h2>
          <p style={{ color: '#A1A1AA', fontSize: 14 }}>This genuinely helps us improve.</p>
          <button onClick={() => navigate('/setup')} style={{ marginTop: 24, background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#A1A1AA', fontSize: 14, fontWeight: 600, padding: '12px 24px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit' }}>
            Back to app
          </button>
        </div>
      ) : (
        <>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#ffffff', marginBottom: 8 }}>Give Feedback</h1>
          <p style={{ color: '#A1A1AA', fontSize: 15, marginBottom: 24 }}>What's working. What's broken. What you want.</p>

          {error && <p style={{ color: '#EF4444', fontSize: 13, marginBottom: 14 }}>{error}</p>}

          <form onSubmit={handleSubmit}>
            <textarea
              rows={7}
              placeholder="Your feedback..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{ marginBottom: 20, resize: 'vertical' }}
              required
            />
            <button
              type="submit"
              disabled={loading || !message.trim()}
              style={{ width: '100%', background: '#3B82F6', color: '#fff', fontWeight: 700, fontSize: 16, padding: '16px', borderRadius: 12, border: 'none', cursor: loading || !message.trim() ? 'not-allowed' : 'pointer', opacity: loading || !message.trim() ? 0.5 : 1, fontFamily: 'inherit' }}
            >
              {loading ? 'Sending...' : 'Send Feedback'}
            </button>
          </form>
        </>
      )}
    </div>
  )
}
