import { useEffect, useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { gradeSession, incrementUsage } from '../lib/api'
import { useAuthStore, useSessionStore } from '../store'
import ProgressSteps from '../components/ProgressSteps'

export default function GradingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { audioBase64, audioType, frames } = (location.state ?? {}) as any

  const { email, plan, decrementSessions } = useAuthStore()
  const { params, setResults } = useSessionStore()

  const [error, setError] = useState<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!params || !email || !audioBase64) {
      navigate('/setup')
      return
    }

    timeoutRef.current = setTimeout(() => {
      setError('Analysis is taking longer than expected. Please try again.')
    }, 90_000)

    analyse()

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const analyse = async () => {
    try {
      const raw = await gradeSession({
        audio: audioBase64,
        audioType: audioType || 'audio/webm',
        frames: JSON.stringify(Array.isArray(frames) ? frames : []),
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
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#ffffff', marginBottom: 6 }}>
              Reviewing your pitch
            </h2>
            <p style={{ fontSize: 13, color: '#8B8B94', marginBottom: 32 }}>
              Usually 30 to 60 seconds. Keep this screen open.
            </p>
            <ProgressSteps
              steps={[
                'Transcribing your pitch',
                'Reading it the way a buyer would',
                ...(Array.isArray(frames) && frames.length > 0 ? ['Checking how you came across on camera'] : []),
                'Preparing the CFO, CRO and CEO questions',
              ]}
              stepMs={9000}
            />
          </>
        )}

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </div>
  )
}
