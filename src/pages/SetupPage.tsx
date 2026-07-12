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
  { topic: 'Why public speaking matters', goal: 'Convince the audience that speaking skills change careers', audience: 'Professionals looking to grow their career' },
  { topic: 'A product you love', goal: 'Make the audience want to buy it immediately', audience: 'Potential customers unfamiliar with the product' },
  { topic: 'Your biggest lesson from last year', goal: 'Leave the audience with one actionable takeaway', audience: 'Peers at a team meeting' },
  { topic: 'Why sleep is underrated', goal: 'Change one person\'s bedtime habit' },
  { topic: 'Explain your job to a 10-year-old', goal: 'Make them understand and find it interesting', audience: 'A curious child with no industry knowledge' },
  { topic: 'A mistake you made and what you learned', goal: 'Make the audience trust you more after hearing it', audience: 'A team you lead or work closely with' },
  { topic: 'Why reading books is worth it', goal: 'Get someone to start a book this week', audience: 'People who say they have no time to read' },
  { topic: 'The best advice you ever received', goal: 'Make the audience remember it a week from now', audience: 'Young professionals early in their career' },
  { topic: 'Why exercise changes your mindset', goal: 'Motivate someone to move their body today', audience: 'People who struggle with consistency' },
  { topic: 'A city or country you love', goal: 'Make the audience want to visit it', audience: 'Friends or colleagues planning a trip' },
  { topic: 'Why saying no is a skill', goal: 'Help the audience feel confident setting boundaries', audience: 'People pleasers who struggle to set limits' },
  { topic: 'Your morning routine', goal: 'Inspire at least one person to change theirs', audience: 'People looking to improve their daily habits' },
  { topic: 'Why AI won\'t replace human connection', goal: 'Reassure a skeptical audience' },
  { topic: 'A book that changed how you think', goal: 'Make someone add it to their reading list', audience: 'Curious people open to new ideas' },
  { topic: 'Why learning a second language is worth it', goal: 'Motivate someone who gave up to try again', audience: 'Adults who tried and quit language learning' },
  { topic: 'What makes a great leader', goal: 'Give the audience a framework they can apply tomorrow', audience: 'Managers and team leads' },
  { topic: 'Why travel teaches more than school', goal: 'Make a skeptic reconsider their next vacation', audience: 'People who prioritize work over travel' },
  { topic: 'The power of asking better questions', goal: 'Change how the audience approaches conversations', audience: 'Sales professionals and team managers' },
  { topic: 'Why consistency beats motivation', goal: 'Help someone stop waiting to feel ready', audience: 'People who start things but rarely finish them' },
  { topic: 'A skill everyone should learn', goal: 'Make the audience genuinely want to start learning it', audience: 'General audience open to self-improvement' },
  { topic: 'Why silence is powerful in conversation', goal: 'Make the audience more comfortable with pauses', audience: 'People who fill silence with filler words' },
  { topic: 'The difference between busy and productive', goal: 'Make someone reconsider how they spend their day', audience: 'Overworked professionals feeling stuck' },
  { topic: 'Why failure is misunderstood', goal: 'Reframe failure as a tool, not a setback', audience: 'Entrepreneurs and ambitious professionals' },
  { topic: 'Something you changed your mind about', goal: 'Show intellectual honesty and earn trust', audience: 'A sceptical but open-minded audience' },
  { topic: 'Why small habits compound', goal: 'Get the audience to start one small habit today', audience: 'People who want to change but feel overwhelmed' },
  { topic: 'Your vision for the next five years', goal: 'Make the audience believe in your direction', audience: 'Potential investors or senior stakeholders' },
  { topic: 'Why kindness is underestimated in business', goal: 'Make a cynical audience reconsider', audience: 'Competitive professionals in fast-paced environments' },
  { topic: 'The most important skill for the next decade', goal: 'Make the audience prioritize learning it', audience: 'Students and early-career professionals' },
  { topic: 'Why boredom is good for creativity', goal: 'Convince someone to put their phone down', audience: 'People constantly attached to their devices' },
  { topic: 'What you wish you knew at 20', goal: 'Give the audience something they can use today', audience: 'Young adults at the start of their journey' },
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

  const [isPrefilled] = useState(() => !!localStorage.getItem('prefill_topic'))
  const [showConsentModal, setShowConsentModal] = useState(false)
  const [topic, setTopic] = useState(() => {
    const v = localStorage.getItem('prefill_topic')
    if (v) { localStorage.removeItem('prefill_topic'); return v }
    return ''
  })
  const [goal, setGoal] = useState(() => {
    const v = localStorage.getItem('prefill_goal')
    if (v) { localStorage.removeItem('prefill_goal'); return v }
    return ''
  })
  const [audience, setAudience] = useState(() => {
    const v = localStorage.getItem('prefill_audience')
    if (v) { localStorage.removeItem('prefill_audience'); return v }
    return ''
  })
  const [targetMinutes, setTargetMinutes] = useState(5)
  const [usageData, setUsageData] = useState<{ remaining: number } | null>(null)

  const challenge = todaysChallenge()

  const [streak, setStreak] = useState(0)
  const [challengeActive, setChallengeActive] = useState(false)
  const [trialExpiry, setTrialExpiry] = useState<string | null>(null)
  // Check localStorage first so it persists across remounts within the same day
  const [challengeDoneToday, setChallengeDoneToday] = useState(() => {
    return localStorage.getItem('challenge_done') === getTodayKey()
  })

  // Mira state
  const [miraMessage, setMiraMessage] = useState<string | null>(null)
  const [miraOnboarded, setMiraOnboarded] = useState(false)
  const [slideIndex, setSlideIndex] = useState(0)
  const [miraFade, setMiraFade] = useState(true)
  const [tickerIndex, setTickerIndex] = useState(0)
  const [tickerMessages, setTickerMessages] = useState<string[]>([])

  useEffect(() => {
    if (!email) { navigate('/'); return }
    checkUsage(email).then((u) => {
      setUsageData({ remaining: u.sessions_remaining })
    }).catch(console.error)

    // Check if user has an active promo trial
    fetch(`${API_URL}/trial/status?email=${encodeURIComponent(email)}`)
      .then(r => r.json())
      .then(data => {
        if (data.trial_active && data.trial_expires_at) {
          const expiry = new Date(data.trial_expires_at)
          setTrialExpiry(expiry.toLocaleString('en-GB', {
            weekday: 'short', day: 'numeric', month: 'short',
            hour: '2-digit', minute: '2-digit'
          }))
        }
      }).catch(() => {})

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

  // Streak message personalized
  const streakMessage = streak === 0
    ? "No active streak yet. Record today and start building your habit. Speakers who improve fastest show up consistently, not just once."
    : streak === 1
    ? "Streak started. Come back tomorrow to keep it going. One session is a start, two in a row is a habit forming."
    : streak < 5
    ? `${streak}-day streak. Keep going, you are building a real habit. Consistency separates speakers who improve from those who stay the same.`
    : streak < 10
    ? `${streak} days in a row. Impressive. Most people quit before this point. You are proving you are serious about becoming a better speaker.`
    : `${streak}-day streak. Top 1% of speakers who actually practice consistently. This discipline is what transforms how people perceive you.`

  // Show consent modal for users with null newsletter_consent
  useEffect(() => {
    if (!email) return
    // Check localStorage first to avoid showing modal again
    if (localStorage.getItem('consent_answered') === 'true') return
    fetch(`${API_URL}/auth/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })
      .then(r => r.json())
      .then(data => {
        if (data.newsletter_consent === null || data.newsletter_consent === undefined) {
          setShowConsentModal(true)
        } else {
          localStorage.setItem('consent_answered', 'true')
        }
      })
      .catch(() => {})
  }, [email])

  const handleConsent = async (consent: boolean) => {
    try {
      await fetch(`${API_URL}/otp/consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newsletterConsent: consent })
      })
    } catch (e) {
      console.error('Consent update error:', e)
    }
    localStorage.setItem('consent_answered', 'true')
    setShowConsentModal(false)
  }

  // Generate ticker messages — real data where available, synthetic fallback
  useEffect(() => {
    fetch(`${API_URL}/stats/community?email=${encodeURIComponent(email || '')}`)
      .then(r => r.json())
      .then(data => {
        const messages: string[] = []
        if (data.users_this_week) messages.push(`${data.users_this_week} speakers practiced this week.`)
        if (data.sessions_this_week) messages.push(`${data.sessions_this_week} sessions recorded this week.`)
        if (data.score_percentile) messages.push(`Higher score than ${data.score_percentile}% of speakers.`)
        messages.push("Practice 3x a week and improve twice as fast.")
        messages.push("Top 10% of speakers practice every day.")
        messages.push("A 5-day streak means 40% faster improvement.")
        setTickerMessages(messages)
      })
      .catch(() => {
        setTickerMessages([
          "Practice 3x a week and improve twice as fast.",
          "Top 10% of speakers practice every day.",
          "A 5-day streak means 40% faster improvement.",
        ])
      })
  }, [email])

  // Rotate ticker every 4 seconds
  useEffect(() => {
    if (tickerMessages.length === 0) return
    const interval = setInterval(() => {
      setTickerIndex(prev => (prev + 1) % tickerMessages.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [tickerMessages])

  // Rotate Mira message every 6 seconds
  useEffect(() => {
    if (!miraMessage) return
    const interval = setInterval(() => {
      setMiraFade(false)
      setTimeout(() => {
        setSlideIndex(prev => (prev + 1) % 3)
        setMiraFade(true)
      }, 400)
    }, 6000)
    return () => clearInterval(interval)
  }, [miraMessage])

  const canRecord = plan === 'pro' || (usageData?.remaining ?? sessionsRemaining) > 0
  const canRecordChallenge = !challengeDoneToday // challenges always available, 1 per day

  const handleStart = (isChallenge = false) => {
    const finalTopic = isChallenge ? challenge.topic : topic.trim()
    const finalGoal = isChallenge ? challenge.goal : goal.trim()
    const finalAudience = isChallenge ? (challenge.audience || '') : audience.trim()
    if (!finalTopic || !finalGoal) return

    if (isChallenge && !challengeDoneToday && email) {
      const todayKey = getTodayKey()
      localStorage.setItem('challenge_done', todayKey)
      setChallengeDoneToday(true)
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
      audience: finalAudience,
      targetSeconds: challengeActive ? 120 : targetMinutes * 60,
      isChallenge,
    })
    const { hideInstructions } = useSessionStore.getState()
    navigate(hideInstructions ? '/permissions' : '/instructions')
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#09090B', display: 'flex', flexDirection: 'column', padding: '20px 20px 48px', maxWidth: 480, margin: '0 auto' }}>

      {/* Header — no logo, just spacing */}
      <div style={{ marginBottom: 8 }} />

      {/* Trial active banner */}
      {trialExpiry && plan !== 'pro' && (
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>⏱</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#F59E0B', marginBottom: 2 }}>Record your first session to unlock 7 days Pro free</p>
            <p style={{ fontSize: 12, color: '#92400E' }}>Trial window closes {trialExpiry}</p>
          </div>
        </div>
      )}

      {/* Mira — always visible, fixed height warm box */}
      <div style={{
        background: 'rgba(245,158,11,0.07)',
        border: '1px solid rgba(245,158,11,0.25)',
        borderRadius: 14,
        padding: '14px 16px',
        marginBottom: 20,
        height: 155,
        overflow: 'hidden',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#F59E0B', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0, lineHeight: 1 }}>Mira — your coach</p>
            <div style={{ background: plan === 'pro' ? 'rgba(245,158,11,0.12)' : 'rgba(59,130,246,0.12)', border: `1px solid ${plan === 'pro' ? 'rgba(245,158,11,0.3)' : 'rgba(59,130,246,0.3)'}`, borderRadius: 20, padding: '2px 7px', display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: plan === 'pro' ? '#F59E0B' : '#3B82F6', lineHeight: 1 }}>{plan === 'pro' ? 'PRO' : 'FREE'}</span>
            </div>
            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 20, padding: '2px 7px', display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: '#F59E0B', lineHeight: 1 }}>{streak} DAY STREAK</span>
            </div>
          </div>
          <div style={{ opacity: miraFade ? 1 : 0, transition: 'opacity 0.4s ease' }}>
            {miraMessage ? (
              slideIndex === 0 ? (
                <p style={{ fontSize: 13, color: '#e4d5b0', lineHeight: 1.65, margin: 0 }}>
                  I understand Polish, Spanish, French, Portuguese, German, Italian and more. Fill in your topic, goal and audience in your language, speak naturally, and your entire report will be in your language.
                </p>
              ) : slideIndex === 1 ? (
                <p style={{ fontSize: 13, color: '#e4d5b0', lineHeight: 1.65, margin: 0 }}>{miraMessage}</p>
              ) : (
                <p style={{ fontSize: 13, color: '#e4d5b0', lineHeight: 1.65, margin: 0 }}>{streakMessage}</p>
              )
            ) : (
              <p style={{ fontSize: 13, color: 'rgba(228,213,176,0.4)', lineHeight: 1.65, margin: 0, fontStyle: 'italic' }}>
                {miraOnboarded ? 'Thinking about your progress...' : 'Complete your first session so I can start coaching you.'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Community ticker */}
      {tickerMessages.length > 0 && (
        <div style={{ overflow: 'hidden', marginBottom: 16, marginTop: -8 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(245,158,11,0.06)',
            border: '1px solid rgba(245,158,11,0.15)',
            borderRadius: 8, padding: '8px 12px',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#F59E0B', flexShrink: 0, animation: 'pulse 2s infinite' }} />
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <p
                key={tickerIndex}
                style={{
                  margin: 0, fontSize: 12, color: '#F59E0B', whiteSpace: 'nowrap',
                  overflow: 'hidden', textOverflow: 'ellipsis',
                  animation: 'slideIn 0.4s ease',
                }}
              >
                {tickerMessages[tickerIndex]}
              </p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>

      {/* Form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 24 }}>
        <div>
          <FieldLabel text="PRESENTATION TOPIC" />
          <input type="text" placeholder="What is your speech topic today?" value={topic} onChange={(e) => { if (!challengeActive) setTopic(e.target.value) }} maxLength={200} readOnly={challengeActive} style={challengeActive ? { opacity: 0.6, cursor: "not-allowed" } : {}} />
        </div>
        <div>
          <FieldLabel text="YOUR GOAL" />
          <input type="text" placeholder="e.g. Get the audience to buy the product" value={goal} onChange={(e) => { if (!challengeActive) setGoal(e.target.value) }} maxLength={200} readOnly={challengeActive} style={challengeActive ? { opacity: 0.6, cursor: "not-allowed" } : {}} />
        </div>
        <div>
          <FieldLabel text="AUDIENCE (optional)" />
          <input type="text" placeholder="e.g. 20 investors, technical background" value={challengeActive ? (challenge.audience || '') : audience} onChange={(e) => { if (!challengeActive) setAudience(e.target.value) }} maxLength={100} readOnly={challengeActive} style={challengeActive ? { opacity: 0.6, cursor: "not-allowed" } : {}} />
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <FieldLabel text="TARGET DURATION" />
            <span style={{ background: challengeActive ? '#F59E0B' : '#3B82F6', color: '#fff', fontSize: 13, fontWeight: 700, padding: '4px 14px', borderRadius: 20 }}>
              {challengeActive ? '2 min' : `${targetMinutes} min`}
            </span>
          </div>
          <div style={{ position: 'relative', padding: '8px 0' }}>
            <input
              type="range"
              min={2}
              max={10}
              step={1}
              value={challengeActive ? 2 : targetMinutes}
              onChange={(e) => { if (!challengeActive) setTargetMinutes(Number(e.target.value)) }}
              disabled={challengeActive}
              style={{ width: '100%', accentColor: challengeActive ? '#F59E0B' : '#3B82F6', cursor: challengeActive ? 'not-allowed' : 'pointer', display: 'block', height: 4, margin: 0, opacity: challengeActive ? 0.5 : 1 }}
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
        onClick={() => handleStart(challengeActive)}
        disabled={challengeActive ? !canRecordChallenge : (!topic.trim() || !goal.trim() || !canRecord)}
        className={isPrefilled && !challengeActive ? 'pulse-btn' : ''}
        style={{ width: '100%', background: challengeActive ? '#F59E0B' : isPrefilled ? '#F59E0B' : '#3B82F6', color: (challengeActive || isPrefilled) ? '#1a1a1a' : '#ffffff', fontWeight: 700, fontSize: 16, padding: '16px', borderRadius: 12, border: 'none', cursor: (challengeActive ? !canRecordChallenge : (!topic.trim() || !goal.trim() || !canRecord)) ? 'not-allowed' : 'pointer', opacity: (challengeActive ? !canRecordChallenge : (!topic.trim() || !goal.trim() || !canRecord)) ? 0.4 : 1, fontFamily: 'inherit', marginBottom: challengeActive ? 8 : 20 }}
      >
        {challengeActive ? 'Start Challenge' : isPrefilled ? 'Start my first session' : 'Start Recording'}
      </button>

      {!challengeActive && (
        <p style={{ textAlign: 'center', fontSize: 11, color: '#52525B', margin: '-12px 0 20px 0' }}>
          Audio and video are never stored — deleted after analysis
        </p>
      )}

      {/* Newsletter consent modal */}
      {showConsentModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24,
        }}>
          <div style={{
            background: '#0c1117', borderRadius: 16,
            border: '1px solid rgba(245,158,11,0.2)',
            padding: 28, maxWidth: 400, width: '100%',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <img
                src="https://www.speakupgrade.com/wp-content/uploads/2026/05/Mira.png"
                alt="Mira"
                style={{ width: 44, height: 44, borderRadius: '50%', border: '1.5px solid rgba(245,158,11,0.5)', flexShrink: 0 }}
              />
              <div>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: '#F59E0B', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Mira, your coach</p>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#ffffff' }}>Stay on track with Mira</p>
              </div>
            </div>
            <p style={{ fontSize: 14, color: '#d4d4d8', lineHeight: 1.7, marginBottom: 24 }}>
              Mira sends you a personal coaching message 3 times a week based on your actual session data. No generic tips. Specific feedback on your pace, confidence and filler words. You can unsubscribe anytime.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={() => handleConsent(true)}
                style={{
                  background: '#F59E0B', color: '#1a1a1a', fontWeight: 700,
                  fontSize: 14, padding: '13px', borderRadius: 10, border: 'none',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Yes, send me coaching tips
              </button>
              <button
                onClick={() => handleConsent(false)}
                style={{
                  background: 'transparent', color: '#52525B', fontWeight: 600,
                  fontSize: 13, padding: '13px', borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.08)',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                No thanks
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
          @keyframes pulseBtn {
            0% { box-shadow: 0 0 0 0 rgba(245,158,11,0.8); transform: scale(1); }
            50% { box-shadow: 0 0 0 16px rgba(245,158,11,0); transform: scale(1.02); }
            100% { box-shadow: 0 0 0 0 rgba(245,158,11,0); transform: scale(1); }
          }
          .pulse-btn { animation: pulseBtn 1.2s ease-in-out infinite; }
        `}} />

      {challengeActive && (
        <button
          onClick={() => {
            setChallengeActive(false)
            setTopic('')
            setGoal('')
          }}
          style={{ width: '100%', background: 'transparent', color: '#A1A1AA', fontWeight: 400, fontSize: 13, padding: '10px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', fontFamily: 'inherit', marginBottom: 20 }}
        >
          Cancel challenge
        </button>
      )}

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
                setChallengeActive(true)
              }}
              disabled={!canRecordChallenge}
              style={{ background: '#3B82F6', color: '#fff', fontWeight: 700, fontSize: 12, padding: '8px 14px', borderRadius: 8, border: 'none', cursor: canRecordChallenge ? 'pointer' : 'not-allowed', opacity: canRecordChallenge ? 1 : 0.4, fontFamily: 'inherit', flexShrink: 0, marginTop: 2 }}
            >
              Accept challenge
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

      <div style={{ textAlign: 'center', marginTop: 32, marginBottom: 16 }}>
        <button
          onClick={() => { logout(); navigate('/') }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#52525B', fontSize: 13, fontFamily: 'inherit' }}
        >
          Log out
        </button>
      </div>
    </div>
  )
}