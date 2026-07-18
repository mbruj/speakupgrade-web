import { useEffect, useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { gradeSession, incrementUsage } from '../lib/api'
import { useAuthStore, useSessionStore } from '../store'

const TIPS = [
  { title: 'Pause before key points', body: 'Silence commands more attention than words.' },
  { title: 'Vary your pace', body: 'Speed up for excitement. Slow down for emphasis.' },
  { title: 'Look at the camera', body: 'Eye contact builds trust with your audience.' },
  { title: 'Open with strength', body: 'Your first sentence sets the tone for everything.' },
  { title: 'Use concrete numbers', body: 'Specific facts are more persuasive than vague claims.' },
  { title: 'Avoid filler words', body: 'Pause instead of saying "um", "like", or "you know".' },
  { title: 'Speak conversationally', body: 'The best speakers sound like they\'re having a chat.' },
  { title: 'End with clarity', body: 'Tell them exactly what you want them to do or think.' },
]

export default function GradingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { audioBase64, audioType, frames } = location.state ?? {}

  const { email, plan, decrementSessions } = useAuthStore()
  const { params, setResults } = useSessionStore()

  const [tipIndex, setTipIndex] = useState(0)
  const [tipVisible, setTipVisible] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tipTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!params || !email || !audioBase64) {
      navigate('/setup')
      return
    }

    // Rotate tips every 6s with fade
    tipTimerRef.current = setInterval(() => {
      setTipVisible(false)
      setTimeout(() => {
        setTipIndex((i) => (i + 1) % TIPS.length)
        setTipVisible(true)
      }, 400)
    }, 6000)

    timeoutRef.current = setTimeout(() => {
      setError('Analysis is taking longer than expected. Please try again.')
    }, 90_000)

    analyse()

    return () => {
      if (tipTimerRef.current) clearInterval(tipTimerRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const analyse = async () => {
    try {
      const raw = await gradeSession({
        audio: audioBase64,
        audioType: audioType || 'audio/webm',
        frames: JSON.stringify(frames ?? []),
        topic: params!.topic,
        goal: params!.goal,
        audience: params!.audience,
        targetSeconds: params!.targetSeconds,
        email: email!,
      })

      if (!params!.isChallenge && plan === 'free') {
        await incrementUsage(email!)
        decrementSessions()
      }

      if (timeoutRef.current) clearTimeout(timeoutRef.current)

      // Team sessions (sales scenario category set) get a follow-up Q&A phase
      // before Results. The pitch itself is already fully graded at this point —
      // this only changes where we navigate to next.
      const category = (params as any)?.category
      if (category) {
        navigate('/negotiate', {
          state: {
            sessionId: (raw as any).session_id,
            pitchTranscript: (raw as any).transcript,
            pitchResult: raw,
            category,
          },
        })
        return
      }

      setResults(raw as any)
      navigate('/results')
    } catch (err) {
      console.error(err)
      setError('Something went wrong during analysis. Please try again.')
    }
  }

  const retry = () => {
    setError(null)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      setError('Analysis is taking longer than expected. Please try again.')
    }, 90_000)
    analyse()
  }

  const tip = TIPS[tipIndex]

  return (
    <div style={{ minHeight: '100dvh', background: '#09090B', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}>
      <div style={{ width: '100%', maxWidth: 480, textAlign: 'center' }}>

        {error ? (
          <>
            <div style={{ fontSize: 48, marginBottom: 20 }}>⚠️</div>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Analysis failed</h2>
            <p style={{ color: '#A1A1AA', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>{error}</p>
            <button
              onClick={retry}
              style={{ width: '100%', background: '#3B82F6', color: '#fff', fontWeight: 700, fontSize: 15, padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer', fontFamily: 'inherit', marginBottom: 12 }}
            >
              Try again
            </button>
            <button
              onClick={() => navigate('/setup')}
              style={{ width: '100%', background: 'transparent', color: '#A1A1AA', fontSize: 14, padding: '14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Back to setup
            </button>
          </>
        ) : (
          <>
            {/* Spinner */}
            <div style={{ width: 56, height: 56, borderRadius: '50%', border: '3px solid rgba(59,130,246,0.15)', borderTopColor: '#3B82F6', animation: 'spin 1s linear infinite', margin: '0 auto 32px' }} />

            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#ffffff', marginBottom: 6 }}>
              Analysing your speech
            </h2>
            <p style={{ fontSize: 13, color: '#52525B', marginBottom: 40 }}>
              This usually takes under a minute
            </p>

            {/* Tip card — fades in/out */}
            <div style={{
              background: '#1A1A1E',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16,
              padding: '24px 20px',
              opacity: tipVisible ? 1 : 0,
              transform: tipVisible ? 'translateY(0)' : 'translateY(8px)',
              transition: 'opacity 0.4s ease, transform 0.4s ease',
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#3B82F6', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
                Speaking tip
              </p>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#ffffff', marginBottom: 8 }}>
                {tip.title}
              </p>
              <p style={{ fontSize: 14, color: '#A1A1AA', lineHeight: 1.65 }}>
                {tip.body}
              </p>
            </div>

            {/* Tip dots */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 20 }}>
              {TIPS.map((_, i) => (
                <div key={i} style={{ width: i === tipIndex ? 20 : 6, height: 6, borderRadius: 3, background: i === tipIndex ? '#3B82F6' : '#374151', transition: 'all 0.3s ease' }} />
              ))}
            </div>
          </>
        )}

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </div>
  )
}
