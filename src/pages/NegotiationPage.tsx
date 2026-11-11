import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSessionStore, useAuthStore } from '../store'
import { API_URL } from '../lib/constants'

const ANSWER_SECONDS = 30

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// Reads text aloud. Always resolves (on end, on error, or after a safety timeout)
// so a browser that refuses to speak can never freeze the session.
function speak(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) { resolve(); return }
    let done = false
    const finish = () => { if (!done) { done = true; clearTimeout(safety); resolve() } }
    const safety = setTimeout(finish, Math.max(7000, text.length * 110))
    try {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.rate = 0.95
      u.lang = 'en-US'
      const voices = window.speechSynthesis.getVoices()
      const preferred = voices.find(v => v.lang === 'en-US' && /natural|google|samantha|aria|jenny/i.test(v.name))
        || voices.find(v => v.lang.startsWith('en'))
      if (preferred) u.voice = preferred
      u.onend = finish
      u.onerror = finish
      window.speechSynthesis.speak(u)
    } catch {
      finish()
    }
  })
}

type Phase = 'loading_questions' | 'ready' | 'asking' | 'recording' | 'grading' | 'error'

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
  const [secondsLeft, setSecondsLeft] = useState(ANSWER_SECONDS)
  const [error, setError] = useState('')

  const streamRef = useRef<MediaStream | null>(null)
  const mimeTypeRef = useRef('audio/webm')
  const stopEarlyRef = useRef<(() => void) | null>(null)
  const cancelledRef = useRef(false)

  useEffect(() => {
    if (!params || !sessionId || !pitchTranscript) {
      navigate('/setup')
      return
    }
    cancelledRef.current = false
    fetchQuestions()
    return () => {
      cancelledRef.current = true
      window.speechSynthesis?.cancel()
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
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
      setPhase('ready')
    } catch (err) {
      console.error(err)
      setError('Could not generate follow-up questions. Please try again.')
      setPhase('error')
    }
  }

  // Records one answer for up to ANSWER_SECONDS. Resolves with the audio when the
  // timer hits zero or the user taps "Done".
  const recordAnswer = (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const stream = streamRef.current
      if (!stream) { reject(new Error('No microphone stream')); return }
      const chunks: Blob[] = []
      const recorder = new MediaRecorder(stream, { mimeType: mimeTypeRef.current })
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
      recorder.onstop = () => resolve(new Blob(chunks, { type: mimeTypeRef.current }))
      recorder.start(500)

      const startedAt = Date.now()
      setSecondsLeft(ANSWER_SECONDS)
      setPhase('recording')

      let stopped = false
      const stop = () => {
        if (stopped) return
        stopped = true
        clearInterval(timer)
        stopEarlyRef.current = null
        if (recorder.state !== 'inactive') recorder.stop()
      }
      const timer = setInterval(() => {
        const left = Math.max(0, ANSWER_SECONDS - (Date.now() - startedAt) / 1000)
        setSecondsLeft(Math.ceil(left))
        if (left <= 0 || cancelledRef.current) stop()
      }, 250)
      stopEarlyRef.current = stop
    })
  }

  // Sent in the background so the next question starts immediately.
  const transcribe = async (blob: Blob): Promise<string> => {
    if (blob.size < 2000) return '(no answer given)'
    try {
      const base64 = await blobToBase64(blob)
      const res = await fetch(`${API_URL}/negotiate/transcribe-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: base64, audioType: mimeTypeRef.current }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      return data.transcript || '(no answer given)'
    } catch (err) {
      console.error('Transcribe error:', err)
      return '(answer could not be transcribed)'
    }
  }

  // Tapped once ("I'm ready") — that tap also unlocks speech and the mic for the
  // rest of the session, so questions play and recording starts with no more taps.
  const startSession = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000 },
      })
      streamRef.current = stream
      mimeTypeRef.current = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
    } catch (err) {
      console.error('Mic error:', err)
      setError('Could not access your microphone. Please allow microphone access and try again.')
      setPhase('error')
      return
    }

    try {
      const pending: Promise<string>[] = []
      for (let i = 0; i < questions.length; i++) {
        if (cancelledRef.current) return
        setQIndex(i)
        setPhase('asking')
        await speak(questions[i])
        if (cancelledRef.current) return
        await new Promise(r => setTimeout(r, 400))
        const blob = await recordAnswer()
        pending.push(transcribe(blob))
      }
      streamRef.current?.getTracks().forEach((t) => t.stop())
      if (cancelledRef.current) return
      setPhase('grading')
      const answers = await Promise.all(pending)
      const finalQa = questions.map((q, i) => ({ question: q, answer: answers[i] }))
      await finishNegotiation(finalQa)
    } catch (err) {
      console.error(err)
      setError('Could not process your answers. Please try again.')
      setPhase('error')
    }
  }

  const finishNegotiation = async (finalQa: { question: string; answer: string }[]) => {
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

      setResults({ ...pitchResult, negotiation: { qa: finalQa, ...data } } as any)
      navigate('/results')
    } catch (err) {
      console.error(err)
      setError('Could not finish grading. Please try again.')
      setPhase('error')
    }
  }

  const currentQuestion = questions[qIndex]
  const isLast = qIndex + 1 >= questions.length
  const lowTime = secondsLeft <= 5

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
              {phase === 'loading_questions' ? 'The buyer is thinking of questions...' : 'Grading how you handled it...'}
            </h2>
            <p style={{ fontSize: 13, color: '#52525B' }}>This usually takes a few seconds</p>
          </>
        )}

        {phase === 'ready' && (
          <>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
              Buyer Q&amp;A
            </p>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#ffffff', marginBottom: 12 }}>
              The buyer has {questions.length} questions
            </h2>
            <p style={{ fontSize: 14, color: '#A1A1AA', lineHeight: 1.6, marginBottom: 28 }}>
              Each question is read out loud. You get {ANSWER_SECONDS} seconds to answer, then it moves to the next one automatically. Turn your sound on.
            </p>
            <button
              onClick={startSession}
              style={{ width: '100%', background: '#3B82F6', color: '#fff', fontWeight: 700, fontSize: 16, padding: '16px', borderRadius: 12, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              I'm ready
            </button>
          </>
        )}

        {(phase === 'asking' || phase === 'recording') && currentQuestion && (
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

            {phase === 'asking' && (
              <p style={{ color: '#A1A1AA', fontSize: 14, animation: 'blink 1.4s ease-in-out infinite' }}>
                The buyer is asking...
              </p>
            )}

            {phase === 'recording' && (
              <>
                <p style={{ fontSize: 13, color: '#A1A1AA', margin: '0 0 6px 0' }}>
                  You have {ANSWER_SECONDS} seconds to answer
                </p>
                <p style={{ fontSize: 64, fontWeight: 700, fontFamily: 'monospace', margin: '0 0 12px 0', color: lowTime ? '#EF4444' : '#ffffff', lineHeight: 1 }}>
                  {secondsLeft}
                </p>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden', marginBottom: 24 }}>
                  <div style={{ height: '100%', width: `${(secondsLeft / ANSWER_SECONDS) * 100}%`, background: lowTime ? '#EF4444' : '#3B82F6', transition: 'width 0.25s linear, background 0.2s' }} />
                </div>
                <button
                  onClick={() => stopEarlyRef.current?.()}
                  style={{
                    width: '100%', background: '#EF4444', color: '#fff', fontWeight: 700, fontSize: 16,
                    padding: '16px', borderRadius: 12, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  }}
                >
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fff', animation: 'blink 1.2s ease-in-out infinite' }} />
                  {isLast ? "Done — finish" : "Done — next question"}
                </button>
              </>
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
