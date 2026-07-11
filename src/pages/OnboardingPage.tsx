import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store'
import { API_URL } from '../lib/constants'

const MIRA_IMG = 'https://www.speakupgrade.com/wp-content/uploads/2026/05/Mira.png'

const REASONS = [
  'I have a presentation or pitch coming up',
  'I am preparing for job interviews',
  'I want to grow in my career and get promoted',
  'I negotiate with clients or stakeholders',
  'I want to build confidence when speaking',
]

const GOALS = [
  'Get promoted or land a senior role',
  'Win more clients or close more deals',
  'Nail my next job interview',
  'Speak with authority in meetings',
  'Build a consistent speaking habit',
]

const FREQUENCY = [
  {
    label: 'Every day',
    note: 'Recommended',
    reason: 'Daily practice compounds faster than any other schedule. Daily challenges are free and unlimited.',
  },
  { label: 'A few times a week', note: '', reason: '' },
  { label: 'Once a week', note: '', reason: '' },
  { label: 'When I have something coming up', note: '', reason: '' },
]

function MiraBox({ text }: { text: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
      background: 'rgba(245,158,11,0.07)',
      border: '1px solid rgba(245,158,11,0.2)',
      borderRadius: 12,
      padding: '12px 14px',
      marginBottom: 24,
    }}>
      <img
        src={MIRA_IMG}
        alt="Mira"
        style={{ width: 36, height: 36, borderRadius: '50%', border: '1.5px solid rgba(245,158,11,0.5)', flexShrink: 0 }}
      />
      <div>
        <p style={{ margin: '0 0 3px 0', fontSize: 10, fontWeight: 700, color: '#F59E0B', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Mira, your coach</p>
        <p style={{ margin: 0, fontSize: 13, color: '#e4d5b0', lineHeight: 1.6 }}>{text}</p>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { email } = useAuthStore()

  const [screen, setScreen] = useState(1)
  const [reason, setReason] = useState('')
  const [reasonOther, setReasonOther] = useState('')
  const [showReasonInput, setShowReasonInput] = useState(false)
  const [goal, setGoal] = useState('')
  const [goalOther, setGoalOther] = useState('')
  const [showGoalInput, setShowGoalInput] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleReason = (val: string) => {
    if (val === 'Other') {
      setShowReasonInput(true)
      setReason('Other')
    } else {
      setReason(val)
      setShowReasonInput(false)
      setScreen(2)
    }
  }

  const handleReasonOtherSubmit = () => {
    if (!reasonOther.trim()) return
    setReason(reasonOther.trim())
    setScreen(2)
  }

  const handleGoal = (val: string) => {
    if (val === 'Other') {
      setShowGoalInput(true)
      setGoal('Other')
    } else {
      setGoal(val)
      setShowGoalInput(false)
      setScreen(3)
    }
  }

  const handleGoalOtherSubmit = () => {
    if (!goalOther.trim()) return
    setGoal(goalOther.trim())
    setScreen(3)
  }

  const handleFrequency = async (freq: string) => {
    if (!email || saving) return
    setSaving(true)

    const finalReason = reason === 'Other' ? reasonOther : reason
    const finalGoal = goal === 'Other' ? goalOther : goal

    try {
      await fetch(`${API_URL}/coach/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          focus: `${finalGoal}. Practice frequency: ${freq}.`,
          motivation: finalReason,
        }),
      })
    } catch (e) {
      console.error('Onboarding save error:', e)
    }

    navigate('/setup')
  }

  const dot = (n: number) => (
    <div style={{
      width: n === screen ? 20 : 8,
      height: 8,
      borderRadius: 4,
      background: n === screen ? '#3B82F6' : 'rgba(255,255,255,0.15)',
      transition: 'all 0.3s ease',
    }} />
  )

  const btnStyle = (selected: boolean) => ({
    background: selected ? 'rgba(59,130,246,0.15)' : '#1A1A1E',
    border: `1px solid ${selected ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.08)'}`,
    borderRadius: 10,
    padding: '14px 16px',
    textAlign: 'left' as const,
    color: '#e4e4e7',
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s ease',
    width: '100%',
  })

  return (
    <div style={{
      minHeight: '100vh',
      background: '#09090B',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '40px 20px 60px',
      fontFamily: 'inherit',
    }}>

      <div style={{ display: 'flex', gap: 6, marginBottom: 36 }}>
        {dot(1)}{dot(2)}{dot(3)}
      </div>

      <div style={{ width: '100%', maxWidth: 440 }}>

        {screen === 1 && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <MiraBox text="Tell me what brings you here so I can coach you properly." />

            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 20px 0', lineHeight: 1.3 }}>
              What brings you to SpeakUPgrade?
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {REASONS.map(r => (
                <button key={r} onClick={() => handleReason(r)} style={btnStyle(reason === r)}>
                  {r}
                </button>
              ))}
              {!showReasonInput ? (
                <button onClick={() => handleReason('Other')} style={{ ...btnStyle(false), color: '#71717a' }}>
                  Other
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input
                    autoFocus
                    type="text"
                    placeholder="Tell me what brings you here..."
                    value={reasonOther}
                    onChange={e => setReasonOther(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleReasonOtherSubmit()}
                    style={{
                      background: '#1A1A1E',
                      border: '1px solid rgba(59,130,246,0.4)',
                      borderRadius: 10,
                      padding: '14px 16px',
                      color: '#fff',
                      fontSize: 14,
                      fontFamily: 'inherit',
                      outline: 'none',
                      width: '100%',
                      boxSizing: 'border-box' as const,
                    }}
                  />
                  <button
                    onClick={handleReasonOtherSubmit}
                    disabled={!reasonOther.trim()}
                    style={{
                      background: '#3B82F6',
                      border: 'none',
                      borderRadius: 10,
                      padding: '13px',
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      opacity: reasonOther.trim() ? 1 : 0.5,
                    }}
                  >
                    Continue
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {screen === 2 && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <MiraBox text="Please tell me more about yourself so I can advise you better." />

            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 20px 0', lineHeight: 1.3 }}>
              What is your main goal?
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {GOALS.map(g => (
                <button key={g} onClick={() => handleGoal(g)} style={btnStyle(goal === g)}>
                  {g}
                </button>
              ))}
              {!showGoalInput ? (
                <button onClick={() => handleGoal('Other')} style={{ ...btnStyle(false), color: '#71717a' }}>
                  Other
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input
                    autoFocus
                    type="text"
                    placeholder="Describe your goal..."
                    value={goalOther}
                    onChange={e => setGoalOther(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleGoalOtherSubmit()}
                    style={{
                      background: '#1A1A1E',
                      border: '1px solid rgba(59,130,246,0.4)',
                      borderRadius: 10,
                      padding: '14px 16px',
                      color: '#fff',
                      fontSize: 14,
                      fontFamily: 'inherit',
                      outline: 'none',
                      width: '100%',
                      boxSizing: 'border-box' as const,
                    }}
                  />
                  <button
                    onClick={handleGoalOtherSubmit}
                    disabled={!goalOther.trim()}
                    style={{
                      background: '#3B82F6',
                      border: 'none',
                      borderRadius: 10,
                      padding: '13px',
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      opacity: goalOther.trim() ? 1 : 0.5,
                    }}
                  >
                    Continue
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {screen === 3 && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <MiraBox text={
      reason.includes('job') || reason.includes('interview')
        ? "People who practice speaking daily are 3 times more likely to get the job. Recruiters remember candidates who sound confident and prepared. Daily sessions build that habit fast."
        : reason.includes('career') || reason.includes('promoted')
        ? "The people who get promoted are the ones who speak up clearly in meetings. Daily practice builds the confidence to do that consistently, not just when it matters."
        : reason.includes('client') || reason.includes('negotiat') || reason.includes('pitch')
        ? "Clients buy from people who sound certain. Daily practice trains you to stay composed and persuasive under pressure, which is exactly what closes deals."
        : reason.includes('confidence')
        ? "Confidence in speaking is a skill, not a personality trait. Daily short sessions rewire how you sound, faster than any other approach."
        : "Daily practice compounds. Ten minutes a day beats one hour a week. The speakers who improve fastest are the ones who show up consistently."
    } />

            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 20px 0', lineHeight: 1.3 }}>
              How often can you practice?
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {FREQUENCY.map(f => (
                <button
                  key={f.label}
                  onClick={() => handleFrequency(f.label)}
                  disabled={saving}
                  style={{
                    ...btnStyle(false),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, textAlign: 'left' }}>
                    <span style={{ fontWeight: f.note ? 700 : 400, color: f.note ? '#fff' : '#e4e4e7' }}>{f.label}</span>
                    {f.reason && (
                      <span style={{ fontSize: 11, color: '#71717a', lineHeight: 1.4 }}>{f.reason}</span>
                    )}
                  </div>
                  {f.note && (
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#22C55E',
                      background: 'rgba(34,197,94,0.1)',
                      border: '1px solid rgba(34,197,94,0.25)',
                      borderRadius: 20,
                      padding: '2px 8px',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase' as const,
                      flexShrink: 0,
                      marginLeft: 10,
                    }}>
                      {f.note}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
