import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSessionStore, useAuthStore } from '../store'
import { API_URL } from '../lib/constants'

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

type Phase = 'loading_questions' | 'show_question' | 'recording' | 'transcribing' | 'grading' | 'error'

export default function NegotiationPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { email } = useAuthStore()
  const { params, setResults } = useSessionStore()

  // Passed from GradingPage after the pitch itself was graded normally
  const { sessionId, pitchTranscript, pitchResult, category } = location.state ?? {}

  const [phase, setPhase] = useState<Phase>('loading_questions')
  const [questions, setQuestions] = useState<string[]>([])
  const [qIndex, setQIndex] = useState(0)
  const [qa, setQa] = useState<{ question: string; answer: string }[]>([])
  const [error, setError] = useState('')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const mimeTypeRef = useRef('audio/webm')

  useEffect(() => {
    if (!params || !sessionId || !pitchTranscript) {
      navigate('/setup')
      return
    }
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    setPhase('loading_questions')
    try {
      let companyContext = null
      try {
        const orgRes = await fetch(`${API_URL}/org/me?email=${encodeURIComponent(email || '')}`)
        const orgData = await orgRes.json()
        companyContext = orgData.company_context || null
      } catch (_) {}

      const res = await fetch(`${API_URL}/negotiate/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: pitchTranscript,
          topic: params!.topic,
          goal: params!.goal,
          category,
          companyContext,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setQuestions(data.questions || [])
      setQIndex(0)
      setPhase('show_question')
    } catch (err) {
      console.error(err)
      setError('Could not generate follow-up questions. Please try again.')
      setPhase('error')
    }
  }

  const startRecordingAnswer = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000 },
      })
      streamRef.current = stream
      mimeTypeRef.current = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      chunksRef.current = []

      const recorder = new MediaRecorder(stream, { mimeType: mimeTypeRef.current })
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.start(500)
      mediaRecorderRef.current = recorder
      setPhase('recording')
    } catch (err) {
      console.error('Mic error:', err)
      setError('Could not access your microphone. Please allow microphone access and try again.')
      setPhase('error')
    }
  }

  const stopRecordingAnswer = async () => {
    const recorder = mediaRecorderRef.current
    if (!recorder) return
    setPhase('transcribing')

    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve()
      recorder.stop()
    })
    streamRef.current?.getTracks().forEach((t) => t.stop())

    try {
      const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current })
      const base64 = await blobToBase64(blob)

      const res = await fetch(`${API_URL}/negotiate/transcribe-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: base64, audioType: mimeTypeRef.current }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      const newQa = [...qa, { question: questions[qIndex], answer: data.transcript }]
      setQa(newQa)

      if (qIndex + 1 < questions.length) {
        setQIndex(qIndex + 1)
        setPhase('show_question')
      } else {
        finishNegotiation(newQa)
      }
    } catch (err) {
      console.error(err)
      setError('Could not process your answer. Please try again.')
      setPhase('error')
    }
  }

  const finishNegotiation = async (finalQa: { question: string; answer: string }[]) => {
    setPhase('grading')
    try {
      const res = await fetch(`${API_URL}/negotiate/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          topic: params!.topic,
          goal: params!.goal,
          category,
          qa: finalQa,
          email,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      // Merge negotiation result into the pitch's grading result, then proceed
      // to Results exactly like a normal session would.
      setResults({ ...pitchResult, negotiation: { qa: finalQa, ...data } } as any)
      navigate('/results')
    } catch (err) {
      console.error(err)
      setError('Could not finish grading. Please try again.')
      setPhase('error')
    }
  }

  const currentQuestion = questions[qIndex]

  return (
    <div style={{ minHeight: '100dvh', background: '#09090B', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}>
      <div style={{ width: '100%', maxWidth: 480, textAlign: 'center' }}>

        {phase === 'error' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 20 }}>⚠️</div>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: '#fff' }}>Something went wrong</h2>
            <p style={{ color: '#A1A1AA', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>{error}</p>
            <button
              onClick={() => navigate('/setup')}
              style={{ width: '100%', background: '#3B82F6', color: '#fff', fontWeight: 700, fontSize: 15, padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Back to setup
            </button>
          </>
        )}

        {(phase === 'loading_questions' || phase === 'grading') && (
          <>
            <div style={{ width: 56, height: 56, borderRadius: '50%', border: '3px solid rgba(245,158,11,0.15)', borderTopColor: '#F59E0B', animation: 'spin 1s linear infinite', margin: '0 auto 28px' }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#ffffff', marginBottom: 6 }}>
              {phase === 'loading_questions' ? 'The buyer is thinking of a question...' : 'Grading how you handled it...'}
            </h2>
            <p style={{ fontSize: 13, color: '#52525B' }}>This usually takes a few seconds</p>
          </>
        )}

        {(phase === 'show_question' || phase === 'recording' || phase === 'transcribing') && currentQuestion && (
          <>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
              Buyer question {qIndex + 1} of {questions.length}
            </p>
            <div style={{
              background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)',
              borderRadius: 16, padding: '22px 20px', marginBottom: 28,
            }}>
              <p style={{ fontSize: 17, fontWeight: 600, color: '#e4d5b0', lineHeight: 1.5, margin: 0 }}>
                "{currentQuestion}"
              </p>
            </div>

            {phase === 'show_question' && (
              <button
                onClick={startRecordingAnswer}
                style={{ width: '100%', background: '#3B82F6', color: '#fff', fontWeight: 700, fontSize: 16, padding: '16px', borderRadius: 12, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Record your answer
              </button>
            )}

            {phase === 'recording' && (
              <button
                onClick={stopRecordingAnswer}
                style={{
                  width: '100%', background: '#EF4444', color: '#fff', fontWeight: 700, fontSize: 16,
                  padding: '16px', borderRadius: 12, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                }}
              >
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fff', animation: 'blink 1.2s ease-in-out infinite' }} />
                Stop — I'm done answering
              </button>
            )}

            {phase === 'transcribing' && (
              <p style={{ color: '#A1A1AA', fontSize: 14 }}>Processing your answer...</p>
            )}

            {qa.length > 0 && (
              <p style={{ marginTop: 20, fontSize: 12, color: '#52525B' }}>
                {qa.length} of {questions.length} answered
              </p>
            )}
          </>
        )}

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        `}</style>
      </div>
    </div>
  )
}
