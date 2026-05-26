import { useState } from 'react'
import { API_URL } from '../lib/constants'
import { useAuthStore } from '../store'

interface Props {
  onComplete: () => void
  onSkip: () => void
}

export default function MiraModal({ onComplete, onSkip }: Props) {
  const { email } = useAuthStore()
  const [step, setStep] = useState<'intro' | 'focus' | 'motivation'>('intro')
  const [focus, setFocus] = useState('')
  const [motivation, setMotivation] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!focus.trim() || !motivation.trim() || !email) return
    setSaving(true)
    try {
      await fetch(`${API_URL}/coach/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, focus: focus.trim(), motivation: motivation.trim() }),
      })
      onComplete()
    } catch (e) {
      console.error(e)
      onComplete()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 24,
    }}>
      <div style={{
        background: '#1A1A1E', borderRadius: 20, padding: 28,
        maxWidth: 400, width: '100%',
        border: '1px solid rgba(59,130,246,0.3)',
        boxShadow: '0 0 60px rgba(59,130,246,0.15)',
      }}>

        {/* Mira avatar */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px', fontSize: 28,
          }}>
            🎤
          </div>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#3B82F6', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Meet Mira
          </p>
        </div>

        {step === 'intro' && (
          <>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#ffffff', marginBottom: 12, lineHeight: 1.4, textAlign: 'center' }}>
              Your personal speaking coach
            </p>
            <p style={{ fontSize: 15, color: '#d4d4d8', lineHeight: 1.7, marginBottom: 24, textAlign: 'center' }}>
              Hi, I'm Mira. I've been training speakers for years and I'm genuinely excited to work with you. Let me learn about you a bit so I can make every session count.
            </p>
            <button
              onClick={() => setStep('focus')}
              style={{ width: '100%', background: '#3B82F6', color: '#fff', fontWeight: 700, fontSize: 15, padding: '14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10 }}
            >
              Let's do it
            </button>
            <button
              onClick={onSkip}
              style={{ width: '100%', background: 'transparent', color: '#52525B', fontWeight: 400, fontSize: 13, padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Not yet
            </button>
          </>
        )}

        {step === 'focus' && (
          <>
            <p style={{ fontSize: 11, color: '#52525B', textAlign: 'center', marginBottom: 6 }}>1 of 2</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#ffffff', marginBottom: 8, lineHeight: 1.4 }}>
              What do you want to focus on?
            </p>
            <p style={{ fontSize: 13, color: '#A1A1AA', marginBottom: 16, lineHeight: 1.6 }}>
              Be specific — this helps me tailor your feedback.
            </p>
            <textarea
              rows={3}
              placeholder="e.g. I say um too much and speak too fast when I'm nervous"
              value={focus}
              onChange={e => setFocus(e.target.value)}
              style={{
                width: '100%', background: '#09090B', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, padding: '12px 14px', color: '#ffffff', fontSize: 14,
                fontFamily: 'inherit', resize: 'none', outline: 'none', lineHeight: 1.6,
                boxSizing: 'border-box', marginBottom: 16,
              }}
              autoFocus
            />
            <button
              onClick={() => setStep('motivation')}
              disabled={!focus.trim()}
              style={{ width: '100%', background: focus.trim() ? '#3B82F6' : '#27272A', color: '#fff', fontWeight: 700, fontSize: 15, padding: '14px', borderRadius: 10, border: 'none', cursor: focus.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}
            >
              Next
            </button>
          </>
        )}

        {step === 'motivation' && (
          <>
            <p style={{ fontSize: 11, color: '#52525B', textAlign: 'center', marginBottom: 6 }}>2 of 2</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#ffffff', marginBottom: 8, lineHeight: 1.4 }}>
              Why do you want to improve your speaking skills?
            </p>
            <p style={{ fontSize: 13, color: '#A1A1AA', marginBottom: 16, lineHeight: 1.6 }}>
              Your reason drives your progress.
            </p>
            <textarea
              rows={3}
              placeholder="e.g. I have an investor pitch in 3 weeks and I need to be ready"
              value={motivation}
              onChange={e => setMotivation(e.target.value)}
              style={{
                width: '100%', background: '#09090B', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, padding: '12px 14px', color: '#ffffff', fontSize: 14,
                fontFamily: 'inherit', resize: 'none', outline: 'none', lineHeight: 1.6,
                boxSizing: 'border-box', marginBottom: 16,
              }}
              autoFocus
            />
            <button
              onClick={handleSave}
              disabled={!motivation.trim() || saving}
              style={{ width: '100%', background: motivation.trim() ? '#3B82F6' : '#27272A', color: '#fff', fontWeight: 700, fontSize: 15, padding: '14px', borderRadius: 10, border: 'none', cursor: motivation.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit', marginBottom: 10 }}
            >
              {saving ? 'Saving...' : 'Start with Mira'}
            </button>
            <button
              onClick={() => setStep('focus')}
              style={{ width: '100%', background: 'transparent', color: '#52525B', fontWeight: 400, fontSize: 13, padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Back
            </button>
          </>
        )}

      </div>
    </div>
  )
}
