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

const GOALS_BY_REASON: Record<string, string[]> = {
  'Presentation or pitch': ['Get client to say yes', 'Deliver with confidence', 'Handle tough questions', 'Make it memorable', 'Land the key message'],
  'Job interview': ['Get an offer', 'Answer confidently', 'Reduce nerves', 'Stand out from other candidates', 'Change career field'],
  'Career growth': ['Get promoted', 'Be taken seriously in meetings', 'Lead with more authority', 'Increase my visibility at work'],
  'Client or stakeholder meetings': ['Close the deal', 'Get buy-in from the room', 'Negotiate a better outcome', 'Present results clearly'],
  'Build speaking confidence': ['Stop using filler words', 'Speak without anxiety', 'Hold attention in a room', 'Sound more authoritative'],
}

const SCREEN2_HEADLINE: Record<string, string> = {
  'Presentation or pitch': 'What does success look like?',
  'Job interview': 'What does success look like?',
  'Career growth': 'What does success look like?',
  'Client or stakeholder meetings': 'What does success look like?',
  'Build speaking confidence': 'What does success look like?',
}

const SCREEN2_MIRA: Record<string, string> = {
  'Presentation or pitch': 'Since you are preparing a presentation, let me understand what success looks like for you.',
  'Job interview': 'Since you are preparing for a job interview, let me understand what you are aiming for.',
  'Career growth': 'Since you want to grow in your career, let me understand what you are working toward.',
  'Client or stakeholder meetings': 'Since you meet with clients or stakeholders, let me understand what outcome matters most.',
  'Build speaking confidence': 'Since you want to build confidence, let me understand what that means for you.',
}

const FREQUENCY = [
  { label: 'Daily', note: 'Recommended' },
  { label: 'A few times a week', note: '' },
  { label: 'Once a week', note: '' },
  { label: 'Only before important events', note: '' },
]

const SCREEN3_MIRA: Record<string, Record<string, string>> = {
  'Presentation or pitch': {
    'Get client to buy': 'Clients decide in the first 60 seconds. Daily practice builds the delivery habits that make those seconds count every time.',
    'Impress investors': 'Investors fund founders who command the room. Daily practice trains you to sound certain even under tough questions.',
    default: 'The best presenters practice daily, not just before the big moment. Build the habit now and your next presentation will feel natural.',
  },
  'Job interview': {
    'Get the job offer': 'Interviewers decide within minutes. Daily practice builds the confidence and structure that makes you memorable, not just prepared.',
    'Stand out from candidates': 'The candidate who sounds certain gets the offer. Daily practice is how you build that certainty before you walk in.',
    default: 'Daily practice before an interview compounds faster than cramming. Each session builds the composure you need on the day.',
  },
  'Career growth': {
    'Get promoted': 'The people who get promoted speak up clearly in meetings. Daily practice makes that effortless, not an effort.',
    'Be taken seriously in meetings': 'Authority in speech is built through repetition. Daily short sessions compound into a presence people notice.',
    default: 'Your career growth is directly tied to how well you communicate. Daily practice closes that gap faster than anything else.',
  },
  'Client or stakeholder meetings': {
    'Close the deal': 'Clients buy from people who sound certain. Daily practice trains you to stay composed under pressure, which closes deals.',
    'Get stakeholder buy-in': 'Stakeholders follow the person who sounds most prepared. Daily practice makes that person you.',
    default: 'Every meeting is a performance. Daily practice builds the muscle memory that keeps you calm and persuasive when stakes are high.',
  },
  'Build speaking confidence': {
    'Stop using filler words': 'Filler words disappear through repetition. Daily short sessions rewire your speech patterns faster than any other approach.',
    'Speak without anxiety': 'Confidence in speaking is a skill, not a personality trait. Daily practice rewires how you sound until it becomes your default.',
    default: 'Confidence compounds. Each daily session adds a layer that does not disappear. In 30 days you will sound like a different speaker.',
  },
}

function getScreen3Message(reason: string, goal: string): string {
  const g = goal.toLowerCase()
  if (g.includes('offer') || g.includes('interview') || g.includes('nerves')) {
    return `Based on your goal, 5 minutes a day is the fastest way to prepare. Interviewers notice the candidates who sound practiced, not just prepared.`
  }
  if (g.includes('promoted') || g.includes('visibility') || g.includes('taken seriously')) {
    return `Based on your goal, 5 minutes a day is the fastest way to improve. The people who get promoted are the ones who speak up consistently, not just once.`
  }
  if (g.includes('deal') || g.includes('buy-in') || g.includes('negotiate') || g.includes('client')) {
    return `Based on your goal, 5 minutes a day is the fastest way to improve. Clients buy from people who sound certain, and that certainty is built through repetition.`
  }
  if (g.includes('filler') || g.includes('anxiety') || g.includes('confident') || g.includes('authoritative') || g.includes('attention')) {
    return `Based on your goal, 5 minutes a day is the fastest way to improve. Confidence is built through repetition, not willpower. Small daily sessions compound fast.`
  }
  if (g.includes('memorable') || g.includes('key message') || g.includes('tough questions') || g.includes('say yes')) {
    return `Based on your goal, 5 minutes a day is the fastest way to improve. Great presenters practice daily, not just before the big moment.`
  }
  return `Based on your goal, 5 minutes a day is the fastest way to improve. Speakers who practice consistently improve twice as fast as those who practice once a week.`
}

function MiraBox({ text }: { text: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)',
      borderRadius: 12, padding: '12px 14px', marginBottom: 24,
    }}>
      <img src={MIRA_IMG} alt="Mira" style={{ width: 36, height: 36, borderRadius: '50%', border: '1.5px solid rgba(245,158,11,0.5)', flexShrink: 0 }} />
      <div>
        <p style={{ margin: '0 0 3px 0', fontSize: 10, fontWeight: 700, color: '#F59E0B', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Mira, your coach</p>
        <p style={{ margin: 0, fontSize: 13, color: '#e4d5b0', lineHeight: 1.6 }}>{text}</p>
      </div>
    </div>
  )
}

function BulletPoint({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3B82F6', flexShrink: 0, marginTop: 6 }} />
      <p style={{ margin: 0, fontSize: 14, color: '#d4d4d8', lineHeight: 1.6 }}>{text}</p>
    </div>
  )
}

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { email } = useAuthStore()
  const [screen, setScreen] = useState(1)
  const [reason, setReason] = useState('')
  const [goal, setGoal] = useState('')
  const [saving, setSaving] = useState(false)

  const totalScreens = 4
  const progressWidth = `${(screen / totalScreens) * 100}%`

  const handleReason = (val: string) => {
    setReason(val)
    setScreen(2)
  }

  const handleGoal = (val: string) => {
    setGoal(val)
    setScreen(3)
  }

  const handleFrequency = async (freq: string) => {
    if (!email || saving) return
    setSaving(true)
    try {
      await fetch(`${API_URL}/coach/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          focus: `${goal}. Practice frequency: ${freq}.`,
          motivation: reason,
        }),
      })
    } catch (e) {
      console.error('Onboarding save error:', e)
    }
    setSaving(false)
    setScreen(4)
  }

  const handleStart = () => {
    localStorage.setItem('prefill_topic', 'Introduce yourself')
    localStorage.setItem('prefill_goal', 'Explain who you are')
    localStorage.setItem('prefill_audience', 'Mira, personal coach')
    navigate('/setup')
  }



  const btnStyle = (selected: boolean) => ({
    background: selected ? '#3B82F6' : '#1A1A1E',
    border: `1px solid ${selected ? '#3B82F6' : 'rgba(255,255,255,0.08)'}`,
    borderRadius: 10, padding: '14px 16px', textAlign: 'left' as const,
    color: selected ? '#ffffff' : '#e4e4e7', fontSize: 14,
    cursor: 'pointer', fontFamily: 'inherit',
    transition: 'all 0.15s ease', width: '100%',
    fontWeight: selected ? 600 : 400,
  })

  return (
    <div style={{
      minHeight: '100vh', background: '#09090B', display: 'flex',
      flexDirection: 'column', alignItems: 'center',
      padding: '0 0 60px', fontFamily: 'inherit',
    }}>

      {/* Progress bar */}
      <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.06)', marginBottom: 8 }}>
        <div style={{ height: 3, background: '#3B82F6', width: progressWidth, transition: 'width 0.4s ease', borderRadius: '0 2px 2px 0' }} />
      </div>

      <div style={{ width: '100%', maxWidth: 440, padding: '28px 20px 0' }}>



        {/* SCREEN 1 */}
        {screen === 1 && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <MiraBox text="Hi, I am Mira, your personal speaking coach. Tell me what you are working toward and I will build a practice plan for you." />
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 4px 0', lineHeight: 1.3 }}>
              What are you preparing for?
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {REASONS.map(r => (
                <button key={r} onClick={() => handleReason(r)} style={btnStyle(reason === r)}>{r}</button>
              ))}
            </div>
          </div>
        )}

        {/* SCREEN 2 */}
        {screen === 2 && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <MiraBox text={SCREEN2_MIRA[reason] || 'Please tell me more about yourself so I can advise you better.'} />
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 20px 0', lineHeight: 1.3 }}>
              {SCREEN2_HEADLINE[reason] || 'What is your main goal?'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(GOALS_BY_REASON[reason] || []).map(g => (
                <button key={g} onClick={() => handleGoal(g)} style={btnStyle(goal === g)}>{g}</button>
              ))}
            </div>
          </div>
        )}

        {/* SCREEN 3 */}
        {screen === 3 && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <MiraBox text={getScreen3Message(reason, goal)} />
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 20px 0', lineHeight: 1.3 }}>
              How often can you practice?
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {FREQUENCY.map(f => (
                <button
                  key={f.label}
                  onClick={() => handleFrequency(f.label)}
                  disabled={saving}
                  style={{ background: '#1A1A1E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '14px 16px', textAlign: 'left', color: '#e4e4e7', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <span>{f.label}</span>
                  {f.note && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, color: '#F59E0B',
                      background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
                      borderRadius: 20, padding: '2px 7px', letterSpacing: '0.06em',
                      textTransform: 'uppercase' as const, flexShrink: 0, marginLeft: 8,
                    }}>{f.note}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SCREEN 4 — Your plan is ready */}
        {screen === 4 && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 20px 0', lineHeight: 1.3 }}>
              Your plan is ready.
            </h2>
            <div style={{
              background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: 12, padding: '16px', marginBottom: 24,
              display: 'flex', alignItems: 'flex-start', gap: 12,
            }}>
              <img src={MIRA_IMG} alt="Mira" style={{ width: 36, height: 36, borderRadius: '50%', border: '1.5px solid rgba(245,158,11,0.5)', flexShrink: 0 }} />
              <div>
                <p style={{ margin: '0 0 3px 0', fontSize: 10, fontWeight: 700, color: '#F59E0B', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Mira, your coach</p>
                <p style={{ margin: '0 0 12px 0', fontSize: 13, color: '#e4d5b0', lineHeight: 1.7 }}>
                  We will focus on helping you {goal.toLowerCase()}. I have set up your first session so you can start right away.
                </p>
                <p style={{ margin: '0 0 8px 0', fontSize: 13, color: '#e4d5b0', lineHeight: 1.7 }}>Here is how each session works:</p>
                <p style={{ margin: '0 0 6px 0', fontSize: 13, color: '#a1a1aa', lineHeight: 1.6, paddingLeft: 12, borderLeft: '2px solid rgba(245,158,11,0.3)' }}>
                  Write your topic and goal. Then speak naturally for 2 to 10 minutes.
                </p>
                <p style={{ margin: '0 0 6px 0', fontSize: 13, color: '#a1a1aa', lineHeight: 1.6, paddingLeft: 12, borderLeft: '2px solid rgba(245,158,11,0.3)' }}>
                  I will analyze your speech and body language.
                </p>
                <p style={{ margin: 0, fontSize: 13, color: '#a1a1aa', lineHeight: 1.6, paddingLeft: 12, borderLeft: '2px solid rgba(245,158,11,0.3)' }}>
                  You will get scores, full transcript and my personal coaching note after every session.
                </p>
              </div>
            </div>
            <button
              onClick={handleStart}
              style={{
                width: '100%', background: '#3B82F6', border: 'none',
                borderRadius: 12, padding: '15px', color: '#fff',
                fontSize: 15, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(59,130,246,0.35)',
              }}
            >
              Start my first session
            </button>
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
