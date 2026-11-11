import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store'
import { API_URL } from '../lib/constants'
import MiraAvatar from '../components/MiraAvatar'

const fieldStyle = {
  width: '100%', background: '#1A1A1E', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10, padding: '12px 14px', color: '#ffffff', fontSize: 14,
  fontFamily: 'inherit', resize: 'none' as const, outline: 'none', lineHeight: 1.6,
  boxSizing: 'border-box' as const,
}

export default function MiraEditPage() {
  const navigate = useNavigate()
  const { email } = useAuthStore()

  const [focus, setFocus] = useState('')
  const [motivation, setMotivation] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!email) { navigate('/'); return }
    fetch(`${API_URL}/coach/profile?email=${encodeURIComponent(email)}`)
      .then(r => r.json())
      .then(data => {
        if (data.focus) {
          // Older profiles stored a practice-frequency sentence inside the focus text: drop it
          setFocus(data.focus.replace(/\. Practice frequency: .+?\./, '').replace(/Goal: .+?\. /, ''))
        }
        if (data.motivation) setMotivation(data.motivation)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [email])

  const handleSave = async () => {
    if (!focus.trim() || !motivation.trim() || !email) return
    setSaving(true)
    try {
      await fetch(`${API_URL}/coach/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, focus: focus.trim(), motivation: motivation.trim() }),
      })
      setSaved(true)
      setTimeout(() => navigate('/account'), 1200)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#09090B', padding: '48px 20px 40px', maxWidth: 480, margin: '0 auto' }}>

      <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px', color: '#ffffff', margin: '0 0 24px 0' }}>My Mira profile</h1>

      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 28 }}>
        <MiraAvatar size={44} />
        <div style={{ background: 'rgba(245,158,11,0.07)', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(245,158,11,0.2)', flex: 1 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#F59E0B', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Mira, your sales coach</p>
          <p style={{ fontSize: 13, color: '#e4d5b0', lineHeight: 1.65, margin: 0 }}>
            The more you tell me about your selling, the sharper my coaching gets after every pitch.
          </p>
        </div>
      </div>

      {loading ? (
        <p style={{ fontSize: 14, color: '#8B8B94', textAlign: 'center' }}>Loading your profile...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#A1A1AA', letterSpacing: '0.1em', marginBottom: 8 }}>
              WHAT DO YOU WANT TO GET BETTER AT?
            </p>
            <textarea
              rows={3}
              placeholder="e.g. Handling price objections without dropping the price"
              value={focus}
              onChange={e => setFocus(e.target.value)}
              style={fieldStyle}
            />
          </div>

          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#A1A1AA', letterSpacing: '0.1em', marginBottom: 8 }}>
              WHAT IS YOUR SALES GOAL RIGHT NOW?
            </p>
            <textarea
              rows={3}
              placeholder="e.g. Close 3 new clinics this quarter"
              value={motivation}
              onChange={e => setMotivation(e.target.value)}
              style={fieldStyle}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={!focus.trim() || !motivation.trim() || saving || saved}
            style={{
              width: '100%', background: saved ? '#22C55E' : '#2563EB',
              color: '#fff', fontWeight: 700, fontSize: 15, padding: '14px',
              borderRadius: 10, border: 'none', minHeight: 48,
              cursor: (!focus.trim() || !motivation.trim()) ? 'not-allowed' : 'pointer',
              opacity: (!focus.trim() || !motivation.trim()) ? 0.5 : 1,
              fontFamily: 'inherit', transition: 'background 0.2s',
            }}
          >
            {saving ? 'Saving...' : saved ? 'Saved' : 'Save changes'}
          </button>

        </div>
      )}
    </div>
  )
}
