import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store'
import { API_URL } from '../lib/constants'

const MIRA_IMG = 'https://www.speakupgrade.com/wp-content/uploads/2026/05/Mira.png'

const REASONS = [
  'Presentation or pitch',
  'Job interview',
  'Career growth',
  'Client or stakeholder meetings',
  'Build speaking confidence',
]

const GOALS = [
  'Get promoted or land a senior role',
  'Win more clients or close more deals',
  'Nail my next job interview',
  'Speak with authority in meetings',
  'Build a consistent speaking habit',
]

const FREQUENCY = [
  { label: 'Every day', note: 'Recommended' },
  { label: 'A few times a week', note: '' },
  { label: 'Once a week', note: '' },
  { label: 'When I have something coming up', note: '' },
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
  const [mira3Message, setMira3Message] = useState<string>('Thinking about your goals...')
  const [mira3Loading, setMira3Loading] = useState(false)

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
      generateMira3Message(reason, val)
    }
  }

  const PREDEFINED_REASONS = [
    'Presentation or pitch',
    'Job interview',
    'Career growth',
    'Client or stakeholder meetings',
    'Build speaking confidence',
  ]

  const PREDEFINED_GOALS = [
    'Get promoted or land a senior role',
    'Win more clients or close more deals',
    'Nail my next job interview',
    'Speak with authority in meetings',
    'Build a consistent speaking habit',
  ]

  const getStaticMessage = (userReason: string, userGoal: string): string | null => {
    const r = userReason.toLowerCase()
    const g = userGoal.toLowerCase()

    if (r.includes('presentation') || r.includes('pitch') || r === 'presentation or pitch') {
      if (g.includes('client') || g.includes('deal')) return "Clients decide in the first 60 seconds. Daily practice builds the delivery habits that make those seconds count every time."
      if (g.includes('promoted') || g.includes('senior')) return "Executives who present with clarity get noticed faster. Daily sessions train that composure before it matters."
      return "The best presenters practice daily, not just before the big moment. Build the habit now and your next pitch will feel natural."
    }
    if (r.includes('interview')) {
      if (g.includes('interview')) return "Interviewers decide within minutes. Daily practice builds the confidence and structure that makes you memorable, not just prepared."
      return "The candidate who sounds certain gets the offer. Daily practice is how you build that certainty before you walk into the room."
    }
    if (r.includes('career') || r.includes('promoted')) {
      if (g.includes('promoted') || g.includes('senior')) return "The people who get promoted speak up clearly and concisely in meetings. Daily practice makes that effortless, not an effort."
      if (g.includes('authority')) return "Authority in speech is built through repetition. Daily short sessions compound into a presence that people notice and remember."
      return "Your career growth is directly tied to how well you communicate. Daily practice closes that gap faster than anything else."
    }
    if (r.includes('client') || r.includes('negotiat')) {
      if (g.includes('client') || g.includes('deal')) return "Clients buy from people who sound certain. Daily practice trains you to stay composed under pressure, which is what closes deals."
      return "Every negotiation is a performance. Daily practice builds the muscle memory that keeps you calm and persuasive when stakes are high."
    }
    if (r.includes('confidence')) {
      if (g.includes('authority')) return "Authority is not a personality trait, it is a skill. Daily short sessions rewire how you sound until confidence becomes your default."
      if (g.includes('habit')) return "Confidence compounds. Each daily session adds a layer that does not disappear. In 30 days you will sound like a different speaker."
      return "Confidence in speaking is built through repetition, not inspiration. Daily practice is the only shortcut that actually works."
    }
    return null
  }

  const generateMira3Message = async (userReason: string, userGoal: string) => {
    // Use if/else for predefined answers
    const isCustomReason = !PREDEFINED_REASONS.includes(userReason)
    const isCustomGoal = !PREDEFINED_GOALS.includes(userGoal)

    if (!isCustomReason && !isCustomGoal) {
      const staticMsg = getStaticMessage(userReason, userGoal)
      if (staticMsg) {
        setMira3Message(staticMsg)
        return
      }
    }

    // Use AI only if user typed custom "Other" response
    setMira3Loading(true)
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `You are Mira, a personal speaking coach for SpeakUPgrade app.
A new user told you:
- Why they joined: "${userReason}"
- Their main goal: "${userGoal}"

Write exactly 2 sentences explaining why practicing speaking DAILY will help them achieve their specific goal.
Be direct and specific to their answers. Reference their goal directly.
Do not use em dashes. Do not use generic phrases. Sound like a real coach, not a marketing email.
Return only the 2 sentences, nothing else.`
          }]
        })
      })
      const data = await res.json()
      const msg = data.content?.[0]?.text?.trim()
      if (msg) setMira3Message(msg)
      else setMira3Message("Daily practice is the fastest path to your goal. Speakers who show up consistently improve twice as fast as those who practice once a week.")
    } catch {
      setMira3Message("Daily practice is the fastest path to your goal. Speakers who show up consistently improve twice as fast as those who practice once a week.")
    }
    setMira3Loading(false)
  }

  const handleGoalOtherSubmit = () => {
    if (!goalOther.trim()) return
    setGoal(goalOther.trim())
    setScreen(3)
    generateMira3Message(reason, goalOther.trim())
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

      <div style={{ marginBottom: 32 }}>
        <span style={{ fontSize: 12, color: '#52525B', fontWeight: 600 }}>Step {screen} of 3</span>
      </div>

      <div style={{ width: '100%', maxWidth: 440 }}>

        {screen === 1 && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <MiraBox text="Hi, I am Mira, your personal speaking coach. Tell me what you are working toward and I will build a practice plan for you." />

            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 20px 0', lineHeight: 1.3 }}>
              What are you preparing for?
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {REASONS.map(r => (
                <button key={r} onClick={() => handleReason(r)} style={btnStyle(reason === r)}>
                  {r}
                </button>
              ))}
              {!showReasonInput ? (
                <button onClick={() => handleReason('Other')} style={{ ...btnStyle(false), color: '#71717a' }}>
                  Something else
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
            <MiraBox text={mira3Loading ? "Thinking about your goals..." : mira3Message} />

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
                    <span style={{ fontWeight: f.note ? 600 : 400, color: '#e4e4e7' }}>{f.label}</span>
                  </div>
                  {f.note && (
                    <span style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: '#F59E0B',
                      background: 'rgba(245,158,11,0.1)',
                      border: '1px solid rgba(245,158,11,0.25)',
                      borderRadius: 20,
                      padding: '2px 7px',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase' as const,
                      flexShrink: 0,
                      marginLeft: 8,
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
