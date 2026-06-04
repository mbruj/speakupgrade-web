import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, useSessionStore } from '../store'
import { checkUsage } from '../lib/api'
import { FREE_SESSION_LIMIT, API_URL } from '../lib/constants'

function getTodayKey() {
  const now = new Date()
  return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`
}

const DAILY_CHALLENGES = [
  { topic: 'Why public speaking matters', goal: 'Convince the audience that speaking skills change careers' },
  { topic: 'A product you love', goal: 'Make the audience want to buy it immediately' },
  { topic: 'Your biggest lesson from last year', goal: 'Leave the audience with one actionable takeaway' },
  { topic: 'Why sleep is underrated', goal: 'Change one person\'s bedtime habit' },
  { topic: 'Explain your job to a 10-year-old', goal: 'Make them understand and find it interesting' },
  { topic: 'A mistake you made and what you learned', goal: 'Make the audience trust you more after hearing it' },
  { topic: 'Why reading books is worth it', goal: 'Get someone to start a book this week' },
  { topic: 'The best advice you ever received', goal: 'Make the audience remember it a week from now' },
  { topic: 'Why exercise changes your mindset', goal: 'Motivate someone to move their body today' },
  { topic: 'A city or country you love', goal: 'Make the audience want to visit it' },
  { topic: 'Why saying no is a skill', goal: 'Help the audience feel confident setting boundaries' },
  { topic: 'Your morning routine', goal: 'Inspire at least one person to change theirs' },
  { topic: 'Why AI won\'t replace human connection', goal: 'Reassure a skeptical audience' },
  { topic: 'A book that changed how you think', goal: 'Make someone add it to their reading list' },
  { topic: 'Why learning a second language is worth it', goal: 'Motivate someone who gave up to try again' },
  { topic: 'What makes a great leader', goal: 'Give the audience a framework they can apply tomorrow' },
  { topic: 'Why travel teaches more than school', goal: 'Make a skeptic reconsider their next vacation' },
  { topic: 'The power of asking better questions', goal: 'Change how the audience approaches conversations' },
  { topic: 'Why consistency beats motivation', goal: 'Help someone stop waiting to feel ready' },
  { topic: 'A skill everyone should learn', goal: 'Make the audience genuinely want to start learning it' },
  { topic: 'Why silence is powerful in conversation', goal: 'Make the audience more comfortable with pauses' },
  { topic: 'The difference between busy and productive', goal: 'Make someone reconsider how they spend their day' },
  { topic: 'Why failure is misunderstood', goal: 'Reframe failure as a tool, not a setback' },
  { topic: 'Something you changed your mind about', goal: 'Show intellectual honesty and earn trust' },
  { topic: 'Why small habits compound', goal: 'Get the audience to start one small habit today' },
  { topic: 'Your vision for the next five years', goal: 'Make the audience believe in your direction' },
  { topic: 'Why kindness is underestimated in business', goal: 'Make a cynical audience reconsider' },
  { topic: 'The most important skill for the next decade', goal: 'Make the audience prioritize learning it' },
  { topic: 'Why boredom is good for creativity', goal: 'Convince someone to put their phone down' },
  { topic: 'What you wish you knew at 20', goal: 'Give the audience something they can use today' },
]

function todaysChallenge() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000)
  return DAILY_CHALLENGES[dayOfYear % DAILY_CHALLENGES.length]
}

function FieldLabel({ text }: { text: string }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 700, color: '#A1A1AA', letterSpacing: '0.1em', margin: '0 0 8px 0' }}>
      {text}
    </p>
  )
}

function NavCard({ title, subtitle, onClick }: { title: string; subtitle: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ display: 'block', width: '100%', background: '#1A1A1E', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '16px 18px', textAlign: 'left', cursor: 'pointer', marginBottom: 12, fontFamily: 'inherit' }}>
      <p style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>{title}</p>
      <p style={{ fontSize: 13, color: '#A1A1AA', margin: 0 }}>{subtitle}</p>
    </button>
  )
}

export default function SetupPage() {
  const navigate = useNavigate()
  const { email, plan, sessionsRemaining, logout } = useAuthStore()
  const { setParams } = useSessionStore()

  const [topic, setTopic] = useState('')
  const [goal, setGoal] = useState('')
  const [audience, setAudience] = useState('')
  const [targetMinutes, setTargetMinutes] = useState(5)
  const [usageData, setUsageData] = useState<{ remaining: number } | null>(null)

  const challenge = todaysChallenge()

  const [streak, setStreak] = useState(0)
  // Check localStorage first so it persists across remounts within the same day
  const [challengeDoneToday, setChallengeDoneToday] = useState(() => {
    return localStorage.getItem('challenge_done') === getTodayKey()
  })

  // Mira state
  const [miraMessage, setMiraMessage] = useState<string | null>(null)
  const [miraOnboarded, setMiraOnboarded] = useState(false)

  useEffect(() => {
    if (!email) { navigate('/'); return }
    checkUsage(email).then((u) => {
      setUsageData({ remaining: u.sessions_remaining })
    }).catch(console.error)

    fetch(`${API_URL}/streak?email=${encodeURIComponent(email)}`)
      .then(r => r.json())
      .then(data => {
        setStreak(data.streak || 0)
        // DB is source of truth — also update localStorage if DB says done today
        const todayKey = getTodayKey()
        if (data.streak_last_day === todayKey) {
          localStorage.setItem('challenge_done', todayKey)
          setChallengeDoneToday(true)
        }
      })
      .catch(console.error)

    // Fetch Mira motivational message
    fetch(`${API_URL}/coach/insight`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        currentSession: null,
        contextType: 'motivation',
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.message) setMiraMessage(data.message)
        setMiraOnboarded(data.is_onboarded || false)
      })
      .catch(console.error)
  }, [email])

  const canRecord = plan === 'pro' || (usageData?.remaining ?? sessionsRemaining) > 0

  const handleStart = (isChallenge = false) => {
    const finalTopic = isChallenge ? challenge.topic : topic.trim()
    const finalGoal = isChallenge ? challenge.goal : goal.trim()
    if (!finalTopic || !finalGoal) return

    if (isChallenge && !challengeDoneToday && email) {
      // Lock immediately and synchronously before navigate — persists across remounts
      const todayKey = getTodayKey()
      localStorage.setItem('challenge_done', todayKey)
      setChallengeDoneToday(true)
      // Fire backend update — state already locked, no need to wait
      fetch(`${API_URL}/streak/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      }).then(r => r.json()).then(data => {
        if (data.streak) setStreak(data.streak)
      }).catch(console.error)
    }

    setParams({
      topic: finalTopic,
      goal: finalGoal,
      audience: audience.trim(),
      targetSeconds: isChallenge ? 120 : targetMinutes * 60,
      isChallenge,
    })
    const { hideInstructions } = useSessionStore.getState()
    navigate(hideInstructions ? '/permissions' : '/instructions')
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#09090B', display: 'flex', flexDirection: 'column', padding: '48px 20px 48px', maxWidth: 480, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>
          <span style={{ color: '#3B82F6' }}>SPEAKUP</span>
          <span style={{ color: '#ffffff' }}>GRADE</span>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {streak > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 20, padding: '4px 10px' }}>
              <span style={{ fontSize: 13 }}>🔥</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#F59E0B' }}>{streak}</span>
            </div>
          )}
          <button onClick={() => { logout(); navigate('/') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A1A1AA', fontSize: 14, fontFamily: 'inherit' }}>
            Log out
          </button>
        </div>
      </div>

      {/* Mira — always visible, fixed height warm box */}
      <div style={{
        background: 'rgba(245,158,11,0.07)',
        border: '1px solid rgba(245,158,11,0.25)',
        borderRadius: 14,
        padding: '14px 16px',
        marginBottom: 20,
        minHeight: 96,
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
      }}>
        <img
          src="https://www.speakupgrade.com/wp-content/uploads/2026/05/Mira.png"
          alt="Mira"
          style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid rgba(245,158,11,0.4)', marginTop: 2 }}
        />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#F59E0B', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>Mira — your coach</p>
          {miraMessage ? (
            <p style={{ fontSize: 13, color: '#e4d5b0', lineHeight: 1.65, margin: 0 }}>{miraMessage}</p>
          ) : (
            <p style={{ fontSize: 13, color: 'rgba(228,213,176,0.4)', lineHeight: 1.65, margin: 0, fontStyle: 'italic' }}>
              {miraOnboarded ? 'Thinking about your progress...' : 'Complete your first session so I can start coaching you.'}
            </p>
          )}
        </div>
      </div>

      {/* Form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 24 }}>
        <div>
          <FieldLabel text="PRESENTATION TOPIC" />
          <input type="text" placeholder="What is your speech topic today?" value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={200} />
        </div>
        <div>
          <FieldLabel text="YOUR GOAL" />
          <input type="text" placeholder="e.g. Get the audience to buy the product" value={goal} onChange={(e) => setGoal(e.target.value)} maxLength={200} />
        </div>
        <div>
          <FieldLabel text="AUDIENCE (optional)" />
          <input type="text" placeholder="e.g. 20 investors, technical background" value={audience} onChange={(e) => setAudience(e.target.value)} maxLength={100} />
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <FieldLabel text="TARGET DURATION" />
            <span style={{ background: '#3B82F6', color: '#fff', fontSize: 13, fontWeight: 700, padding: '4px 14px', borderRadius: 20 }}>
              {targetMinutes} min
            </span>
          </div>
          <div style={{ position: 'relative', padding: '8px 0' }}>
            <input
              type="range"
              min={2}
              max={10}
              step={1}
              value={targetMinutes}
              onChange={(e) => setTargetMinutes(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#3B82F6', cursor: 'pointer', display: 'block', height: 4, margin: 0 }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ fontSize: 12, color: '#52525B' }}>2 min</span>
            <span style={{ fontSize: 12, color: '#52525B' }}>10 min</span>
          </div>
        </div>
      </div>

      {!canRecord && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#FCA5A5', marginBottom: 16 }}>
          You've used all {FREE_SESSION_LIMIT} free sessions this month.{' '}
          <button onClick={() => navigate('/upgrade')} style={{ color: '#3B82F6', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
            Upgrade to Pro
          </button>
        </div>
      )}

      <button
        onClick={() => handleStart(false)}
        disabled={!topic.trim() || !goal.trim() || !canRecord}
        style={{ width: '100%', background: '#3B82F6', color: '#ffffff', fontWeight: 700, fontSize: 16, padding: '16px', borderRadius: 12, border: 'none', cursor: (!topic.trim() || !goal.trim() || !canRecord) ? 'not-allowed' : 'pointer', opacity: (!topic.trim() || !goal.trim() || !canRecord) ? 0.4 : 1, fontFamily: 'inherit', marginBottom: 20 }}
      >
        Start Recording
      </button>

      {/* Daily challenge — below Start Recording */}
      {!challengeDoneToday ? (
        <div style={{ background: '#1A1A1E', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 14px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <span style={{ background: '#1E3A5F', color: '#3B82F6', fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20, border: '1px solid rgba(59,130,246,0.3)', letterSpacing: '0.08em', display: 'inline-block', marginBottom: 6 }}>
                DAILY CHALLENGE
              </span>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#ffffff', lineHeight: 1.4, margin: '0 0 4px 0' }}>
                {challenge.topic}
              </p>
              <p style={{ fontSize: 12, color: '#A1A1AA', lineHeight: 1.4, margin: 0 }}>
                {challenge.goal}
              </p>
            </div>
            <button
              onClick={() => {
                setTopic(challenge.topic)
                setGoal(challenge.goal)
              }}
              disabled={!canRecord}
              style={{ background: '#3B82F6', color: '#fff', fontWeight: 700, fontSize: 12, padding: '8px 14px', borderRadius: 8, border: 'none', cursor: canRecord ? 'pointer' : 'not-allowed', opacity: canRecord ? 1 : 0.4, fontFamily: 'inherit', flexShrink: 0, marginTop: 2 }}
            >
              Use this
            </button>
          </div>
        </div>
      ) : (
        <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 12, padding: '10px 14px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16 }}>🔥</span>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#22C55E', margin: 0 }}>Challenge done — come back tomorrow</p>
        </div>
      )}

      <NavCard title="Session History" subtitle="View your past sessions and track your progress." onClick={() => navigate('/history')} />
      <NavCard title="Visit my coach" subtitle="Update your focus and coaching preferences." onClick={() => navigate('/mira-edit')} />
      <NavCard title="Give Feedback" subtitle="Tell us what you would improve." onClick={() => navigate('/feedback')} />
      <NavCard title="Become an Affiliate" subtitle="Earn 50% commission on every referral." onClick={() => navigate('/affiliate')} />
    </div>
  )
}
