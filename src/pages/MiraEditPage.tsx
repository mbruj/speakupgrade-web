import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store'
import { API_URL } from '../lib/constants'

export default function MiraEditPage() {
  const navigate = useNavigate()
  const { email } = useAuthStore()

  const [focus, setFocus] = useState('')
  const [motivation, setMotivation] = useState('')
  const [frequency, setFrequency] = useState('A few times a week')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!email) { navigate('/'); return }
    // Load existing coach goal from backend
    fetch(`${API_URL}/coach/profile?email=${encodeURIComponent(email)}`)
      .then(r => r.json())
      .then(data => {
        if (data.focus) {
          // Extract frequency if saved in focus
          const freqMatch = data.focus.match(/Practice frequency: (.+?)\./)
          if (freqMatch) setFrequency(freqMatch[1])
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
        body: JSON.stringify({ email, focus: `${focus.trim()}. Practice frequency: ${frequency}.`, motivation: motivation.trim() }),
      })
      setSaved(true)
      setTimeout(() => navigate('/setup'), 1200)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#09090B', padding: '48px 20px 40px', maxWidth: 480, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <button
          onClick={() => navigate('/setup')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A1A1AA', fontSize: 22, lineHeight: 1, padding: 0, fontFamily: 'inherit' }}
        >
          ←
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#ffffff', margin: 0 }}>My Mira Profile</h1>
      </div>

      {/* Mira intro */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 28 }}>
        <img
          src="https://www.speakupgrade.com/wp-content/uploads/2026/05/Mira.png"
          alt="Mira"
          style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1.5px solid rgba(245,158,11,0.5)' }}
        />
        <div style={{ background: 'rgba(245,158,11,0.07)', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(245,158,11,0.2)', flex: 1 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#F59E0B', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Mira, your coach</p>
          <p style={{ fontSize: 13, color: '#e4d5b0', lineHeight: 1.65, margin: 0 }}>
            Update your answers so I can give you better coaching. The more specific you are, the more useful I become.
          </p>
        </div>
      </div>

      {loading ? (
        <p style={{ fontSize: 14, color: '#52525B', textAlign: 'center' }}>Loading your profile...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#A1A1AA', letterSpacing: '0.1em', marginBottom: 8 }}>
              WHAT DO YOU WANT TO FOCUS ON?
            </p>
            <textarea
              rows={3}
              placeholder="e.g. I say um too much and speak too fast when I'm nervous"
              value={focus}
              onChange={e => setFocus(e.target.value)}
              style={{
                width: '100%', background: '#1A1A1E', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, padding: '12px 14px', color: '#ffffff', fontSize: 14,
                fontFamily: 'inherit', resize: 'none', outline: 'none', lineHeight: 1.6,
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#A1A1AA', letterSpacing: '0.1em', marginBottom: 8 }}>
              WHY DO YOU WANT TO IMPROVE YOUR SPEAKING SKILLS?
            </p>
            <textarea
              rows={3}
              placeholder="e.g. I have an investor pitch in 3 weeks and I need to be ready"
              value={motivation}
              onChange={e => setMotivation(e.target.value)}
              style={{
                width: '100%', background: '#1A1A1E', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, padding: '12px 14px', color: '#ffffff', fontSize: 14,
                fontFamily: 'inherit', resize: 'none', outline: 'none', lineHeight: 1.6,
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#A1A1AA', letterSpacing: '0.1em', marginBottom: 8 }}>
              HOW OFTEN DO YOU WANT TO PRACTICE?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['Every day', 'A few times a week', 'Once a week', 'When I have something coming up'].map(f => (
                <button
                  key={f}
                  onClick={() => setFrequency(f)}
                  style={{
                    background: frequency === f ? 'rgba(59,130,246,0.15)' : '#1A1A1E',
                    border: `1px solid ${frequency === f ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 10, padding: '12px 14px', textAlign: 'left',
                    color: '#e4e4e7', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={!focus.trim() || !motivation.trim() || saving || saved}
            style={{
              width: '100%', background: saved ? '#22C55E' : '#3B82F6',
              color: '#fff', fontWeight: 700, fontSize: 15, padding: '14px',
              borderRadius: 10, border: 'none',
              cursor: (!focus.trim() || !motivation.trim()) ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', transition: 'background 0.2s',
            }}
          >
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save changes'}
          </button>

        </div>
      )}
    </div>
  )
}
