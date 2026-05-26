import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessionStore, useAuthStore } from '../store'
import { API_URL } from '../lib/constants'
import LegalFooter from '../components/LegalFooter'
import MiraModal from '../components/MiraModal'

const LANGUAGES = [
  { code: 'en', label: '🇬🇧 English' },
  { code: 'pl', label: '🇵🇱 Polish' },
  { code: 'es', label: '🇪🇸 Spanish' },
  { code: 'de', label: '🇩🇪 German' },
  { code: 'fr', label: '🇫🇷 French' },
  { code: 'pt', label: '🇵🇹 Portuguese' },
  { code: 'it', label: '🇮🇹 Italian' },
  { code: 'nl', label: '🇳🇱 Dutch' },
  { code: 'uk', label: '🇺🇦 Ukrainian' },
  { code: 'ru', label: '🇷🇺 Russian' },
]

function scoreColor(v: number) {
  return v >= 70 ? '#22C55E' : v >= 50 ? '#F59E0B' : '#EF4444'
}
function fmt(s: number) {
  if (!s) return '0:00'
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0')
}
function getVerdict(score: number) {
  if (score >= 80) return { label: 'Outstanding session', emoji: '🌟' }
  if (score >= 65) return { label: 'Strong performance', emoji: '💪' }
  if (score >= 50) return { label: 'Good progress', emoji: '📈' }
  if (score >= 35) return { label: 'Getting there', emoji: '🎯' }
  return { label: 'Keep going', emoji: '🔥' }
}

function Section({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: '#1A1A1E', borderRadius: 12, padding: 16, border: '1px solid rgba(255,255,255,0.05)', marginBottom: 14, ...style }}>
      {children}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 10, fontWeight: 600, color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>{children}</p>
}

function BulletItem({ text, color = '#22C55E' }: { text: string; color?: string }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, marginTop: 7, flexShrink: 0 }} />
      <p style={{ fontSize: 14, color: '#d4d4d8', lineHeight: 1.65, margin: 0 }}>{text}</p>
    </div>
  )
}

function FeedbackRow({ label, text, last = false }: { label: string; text: string; last?: boolean }) {
  if (!text) return null
  return (
    <div style={{ paddingBottom: last ? 0 : 12, marginBottom: last ? 0 : 12, borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
      <p style={{ fontSize: 10, fontWeight: 600, color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 14, color: '#d4d4d8', lineHeight: 1.65, margin: 0 }}>{text}</p>
    </div>
  )
}

function ProGate({ text, onUnlock }: { text: string; onUnlock: () => void }) {
  return (
    <div style={{ background: 'rgba(59,130,246,0.06)', borderRadius: 10, padding: 14, border: '1px solid rgba(59,130,246,0.2)', textAlign: 'center', marginTop: 8 }}>
      <p style={{ fontSize: 13, color: '#A1A1AA', marginBottom: 10 }}>{text}</p>
      <button onClick={onUnlock} style={{ background: '#3B82F6', color: '#fff', fontWeight: 700, fontSize: 12, padding: '8px 20px', borderRadius: 20, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
        Unlock with Pro
      </button>
    </div>
  )
}

function BlurredRows({ onUnlock }: { onUnlock: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
      {[85, 70, 80].map((w, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', flexShrink: 0 }} />
          <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, width: `${w}%` }} />
        </div>
      ))}
      <button onClick={onUnlock} style={{ background: '#3B82F6', color: '#fff', fontWeight: 700, fontSize: 11, padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontFamily: 'inherit', alignSelf: 'flex-start', marginTop: 4 }}>
        Unlock with Pro
      </button>
    </div>
  )
}

function FillerChip({ word, count }: { word: string; count: number }) {
  const isHigh = count >= 5
  return (
    <span style={{ display: 'inline-block', padding: '5px 10px', borderRadius: 6, fontSize: 13, marginRight: 6, marginBottom: 6, background: isHigh ? 'rgba(239,68,68,0.12)' : '#222228', color: isHigh ? '#EF4444' : '#A1A1AA', border: isHigh ? '1px solid rgba(239,68,68,0.3)' : 'none' }}>
      {word} x{count}
    </span>
  )
}

function HighlightedTranscript({ transcript, fillerWords }: { transcript: string; fillerWords: Record<string, number> }) {
  const fillers = Object.keys(fillerWords).filter(w => fillerWords[w] > 0)
  if (fillers.length === 0) return <p style={{ fontSize: 14, color: '#A1A1AA', lineHeight: 1.7 }}>{transcript}</p>
  const pattern = new RegExp('\\b(' + fillers.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\b', 'gi')
  const parts: { text: string; isFiller: boolean }[] = []
  let lastIndex = 0; let match
  while ((match = pattern.exec(transcript)) !== null) {
    if (match.index > lastIndex) parts.push({ text: transcript.slice(lastIndex, match.index), isFiller: false })
    parts.push({ text: match[0], isFiller: true })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < transcript.length) parts.push({ text: transcript.slice(lastIndex), isFiller: false })
  return (
    <p style={{ fontSize: 14, color: '#A1A1AA', lineHeight: 1.7 }}>
      {parts.map((part, i) =>
        part.isFiller
          ? <span key={i} style={{ color: '#EF4444', fontWeight: 700 }}>{part.text}</span>
          : <span key={i}>{part.text}</span>
      )}
    </p>
  )
}

function SpeechTimeline({ wordTimestamps, actualSeconds, isPro, onUpgrade }: { wordTimestamps: any[]; actualSeconds: number; isPro: boolean; onUpgrade: () => void }) {
  const [scrubPos, setScrubPos] = useState<number | null>(null)
  const [scrubInfo, setScrubInfo] = useState<any>(null)

  const duration = actualSeconds || wordTimestamps[wordTimestamps.length - 1]?.end || 60
  const chunkSize = 5
  const numChunks = Math.ceil(duration / chunkSize)
  const minWpm = 60, maxWpm = 200
  const graphH = 120, padTop = 10, padBot = 20
  const plotH = graphH - padTop - padBot
  const width = 320

  const segments = Array.from({ length: numChunks }, (_, i) => {
    const start = i * chunkSize; const end = start + chunkSize
    const words = wordTimestamps.filter(w => w.start >= start && w.start < end)
    const wpm = words.length > 0 ? Math.round((words.length / chunkSize) * 60) : 0
    return { start, end, wpm, text: words.map(w => w.word).join(' ') }
  })

  const pauses: any[] = []
  for (let i = 1; i < wordTimestamps.length; i++) {
    const gap = wordTimestamps[i].start - wordTimestamps[i - 1].end
    if (gap >= 0.8) pauses.push({ start: wordTimestamps[i - 1].end, end: wordTimestamps[i].start, duration: gap, type: gap >= 2 ? 'strategic' : 'hesitation' })
  }

  const xFor = (t: number) => (t / duration) * width
  const yFor = (wpm: number) => padTop + plotH - ((Math.min(wpm, maxWpm) - minWpm) / (maxWpm - minWpm)) * plotH
  const points = segments.map(s => ({ x: xFor((s.start + s.end) / 2), y: s.wpm > 0 ? yFor(s.wpm) : null })).filter(p => p.y !== null)

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isPro) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const t = (x / rect.width) * duration
    setScrubPos(x / rect.width * width)
    const onPause = pauses.find(p => t >= p.start && t <= p.end)
    if (onPause) { setScrubInfo({ isPause: true, duration: onPause.duration.toFixed(1), type: onPause.type }); return }
    const seg = segments.find(s => t >= s.start && t < s.end) || segments[segments.length - 1]
    setScrubInfo({ isPause: false, wpm: seg.wpm, text: seg.text, wpmLabel: seg.wpm > 160 ? 'Too fast' : seg.wpm < 110 ? 'Too slow' : 'Good pace', time: fmt(Math.round(t)) })
  }

  if (!segments || segments.length < 2) return null

  return (
    <Section>
      <SectionTitle>Speech timeline</SectionTitle>
      <div style={{ display: 'flex', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 16, height: 8, borderRadius: 2, background: 'rgba(34,197,94,0.3)' }} />
          <span style={{ fontSize: 11, color: '#A1A1AA' }}>Ideal pace zone</span>
        </div>
        {isPro && <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, background: 'rgba(34,197,94,0.6)' }} />
            <span style={{ fontSize: 11, color: '#A1A1AA' }}>Strategic pause</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, background: 'rgba(245,158,11,0.6)' }} />
            <span style={{ fontSize: 11, color: '#A1A1AA' }}>Unplanned pause</span>
          </div>
        </>}
      </div>
      <svg width="100%" viewBox={`0 0 ${width} ${graphH}`} preserveAspectRatio="none" style={{ display: 'block', cursor: isPro ? 'crosshair' : 'default' }}
        onMouseMove={handleMouseMove} onMouseLeave={() => { setScrubPos(null); setScrubInfo(null) }}>
        <rect x={0} y={yFor(150)} width={width} height={yFor(110) - yFor(150)} fill="rgba(34,197,94,0.08)" />
        {isPro && pauses.map((p, i) => (
          <rect key={i} x={xFor(p.start)} y={padTop} width={Math.max(3, xFor(p.end) - xFor(p.start))} height={plotH}
            fill={p.type === 'strategic' ? 'rgba(34,197,94,0.25)' : 'rgba(245,158,11,0.25)'} />
        ))}
        {points.slice(1).map((p, i) => (
          <line key={i} x1={points[i].x} y1={points[i].y!} x2={p.x} y2={p.y!} stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />
        ))}
        {isPro && scrubPos !== null && <line x1={scrubPos} y1={padTop} x2={scrubPos} y2={graphH - padBot} stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />}
        <text x={4} y={padTop + 10} fill="rgba(255,255,255,0.3)" fontSize="9">200</text>
        <text x={4} y={yFor(150) + 4} fill="rgba(34,197,94,0.6)" fontSize="9">150</text>
        <text x={4} y={yFor(110) + 4} fill="rgba(34,197,94,0.6)" fontSize="9">110</text>
      </svg>
      {isPro ? (
        <>
          <p style={{ fontSize: 11, color: '#52525B', textAlign: 'center', margin: '4px 0' }}>Drag to explore your speech</p>
          <div style={{ background: '#111316', borderRadius: 8, padding: 12, minHeight: 60, marginTop: 4 }}>
            {!scrubInfo && <p style={{ fontSize: 13, color: '#52525B', fontStyle: 'italic' }}>{segments[Math.floor(segments.length / 2)]?.text || ''}</p>}
            {scrubInfo?.isPause && (
              <>
                <p style={{ fontSize: 11, color: '#A1A1AA', marginBottom: 4 }}>{scrubInfo.type === 'strategic' ? 'Strategic pause' : 'Unplanned pause'} — {scrubInfo.duration}s</p>
                <p style={{ fontSize: 13, color: '#d4d4d8', lineHeight: 1.5 }}>{scrubInfo.type === 'strategic' ? 'Good — a deliberate pause for effect' : 'Watch out — unplanned mid-speech pause'}</p>
              </>
            )}
            {scrubInfo && !scrubInfo.isPause && (
              <>
                <p style={{ fontSize: 11, color: '#A1A1AA', marginBottom: 4 }}>{scrubInfo.time} — {scrubInfo.wpm} WPM — {scrubInfo.wpmLabel}</p>
                <p style={{ fontSize: 13, color: '#d4d4d8', lineHeight: 1.5 }}>{scrubInfo.text}</p>
              </>
            )}
          </div>
        </>
      ) : (
        <div style={{ background: 'rgba(59,130,246,0.06)', borderRadius: 10, padding: 14, border: '1px solid rgba(59,130,246,0.2)', textAlign: 'center', marginTop: 8 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>Interactive timeline is Pro</p>
          <p style={{ fontSize: 13, color: '#A1A1AA', marginBottom: 10 }}>Drag to explore your speech moment by moment.</p>
          <button onClick={onUpgrade} style={{ background: '#3B82F6', color: '#fff', fontWeight: 700, fontSize: 12, padding: '8px 20px', borderRadius: 20, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            Unlock with Pro
          </button>
        </div>
      )}
    </Section>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ResultsPage() {
  const navigate = useNavigate()
  const { results: raw, params, clearSession } = useSessionStore()
  const { email, plan } = useAuthStore()
  const isPro = plan === 'pro'

  const [emailSending, setEmailSending] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)

  // Translation state
  const [selectedLang, setSelectedLang] = useState('en')
  const [translating, setTranslating] = useState(false)
  const [translated, setTranslated] = useState<any>(null)

  // Mira state
  const [showMiraModal, setShowMiraModal] = useState(false)
  const [miraInsight, setMiraInsight] = useState<{ message: string; next_session: string } | null>(null)
  const [miraLoading, setMiraLoading] = useState(false)
  const [isOnboarded, setIsOnboarded] = useState(false)

  const data = raw as any
  const bl = data?.body_language || {}
  const blFeedback = bl.feedback || {}
  const feedback = data?.feedback || {}
  const strengths = data?.strengths || []
  const improvements = data?.improvements || []
  const overall = data?.scores?.overall || 0
  const color = scoreColor(overall)
  const verdict = getVerdict(overall)
  const wpm = data?.words_per_minute || 0
  const wpmColor = wpm === 0 ? '#A1A1AA' : wpm < 110 ? '#F59E0B' : wpm > 160 ? '#F59E0B' : '#22C55E'
  const wpmLabel = wpm === 0 ? 'WPM' : wpm < 110 ? 'Too slow' : wpm > 160 ? 'Too fast' : 'Good pace'
  const conviction = data?.conviction || null
  const confidenceLanguage = data?.confidence_language || null
  const fillerWords: Record<string, number> = data?.filler_words || {}
  const fillerEntries = Object.entries(fillerWords).filter(([, c]) => (c as number) > 0).sort((a, b) => (b[1] as number) - (a[1] as number))
  const hasBodyLanguage = blFeedback && Object.values(blFeedback).some((v: any) => v && v !== 'No video data available.')

  // Use translated content if available, fallback to original
  const t = translated || {}
  const coachSummary = t.coach_summary ?? data?.coach_summary
  const convictionReasoning = t.conviction_reasoning ?? conviction?.reasoning
  const convictionConvinced = conviction?.convinced
  const displayStrengths: string[] = t.strengths ?? strengths
  const displayImprovements: string[] = t.improvements ?? improvements
  const feedbackPace = t.feedback_pace ?? feedback.pace
  const feedbackFiller = t.feedback_filler ?? feedback.filler
  const feedbackStructure = t.feedback_structure ?? feedback.structure
  const feedbackConfidence = t.feedback_confidence ?? feedback.confidence
  const blEye = t.bl_eye_contact ?? blFeedback.eye_contact
  const blPosture = t.bl_posture ?? blFeedback.posture
  const blMovement = t.bl_movement ?? blFeedback.movement
  const blGestures = t.bl_gestures ?? blFeedback.gestures

  const handleLanguageChange = async (lang: string) => {
    setSelectedLang(lang)
    if (lang === 'en') { setTranslated(null); return }

    setTranslating(true)
    try {
      const langLabel = LANGUAGES.find(l => l.code === lang)?.label.replace(/^.{2,3}\s/, '') || lang
      const fields: Record<string, any> = {}
      if (data?.coach_summary) fields.coach_summary = data.coach_summary
      if (conviction?.reasoning) fields.conviction_reasoning = conviction.reasoning
      if (strengths?.length) fields.strengths = strengths
      if (improvements?.length) fields.improvements = improvements
      if (feedback.pace) fields.feedback_pace = feedback.pace
      if (feedback.filler) fields.feedback_filler = feedback.filler
      if (feedback.structure) fields.feedback_structure = feedback.structure
      if (feedback.confidence) fields.feedback_confidence = feedback.confidence
      if (blFeedback.eye_contact && blFeedback.eye_contact !== 'No video data available.') fields.bl_eye_contact = blFeedback.eye_contact
      if (blFeedback.posture && blFeedback.posture !== 'No video data available.') fields.bl_posture = blFeedback.posture
      if (blFeedback.movement && blFeedback.movement !== 'No video data available.') fields.bl_movement = blFeedback.movement
      if (blFeedback.gestures && blFeedback.gestures !== 'No video data available.') fields.bl_gestures = blFeedback.gestures

      const res = await fetch(`${API_URL}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields, language: langLabel }),
      })
      const result = await res.json()
      setTranslated(result)
    } catch (e) {
      console.error('Translation error:', e)
      setTranslated(null)
    } finally {
      setTranslating(false)
    }
  }

  const speakResults = () => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const parts = [
      verdict.label + '.',
      coachSummary || '',
      displayImprovements[0] ? 'The one thing to focus on next: ' + displayImprovements[0] : '',
    ].filter(Boolean).join(' ')
    const utterance = new SpeechSynthesisUtterance(parts)
    utterance.rate = 0.9; utterance.lang = 'en-US'
    window.speechSynthesis.speak(utterance)
  }

  const toggleVoice = (enabled: boolean) => {
    setVoiceEnabled(enabled)
    if (!enabled) window.speechSynthesis?.cancel()
    else speakResults()
  }

  useEffect(() => {
    if (!raw) { navigate('/setup'); return }
    setTimeout(() => { if (voiceEnabled) speakResults() }, 800)

    // Fetch Mira insight and check if modal should show
    const fetchMiraInsight = async () => {
      if (!email) return
      setMiraLoading(true)
      try {
        const res = await fetch(`${API_URL}/coach/insight`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            currentSession: {
              overall, pace: data?.scores?.pace || 0,
              fillerTotal: data?.filler_total || 0,
              wpm, topic: params!.topic,
            },
          }),
        })
        const result = await res.json()
        setIsOnboarded(result.is_onboarded)
        if (result.message) setMiraInsight({ message: result.message, next_session: result.next_session })
        // Show modal only if not onboarded yet
        if (!result.is_onboarded) setShowMiraModal(true)
      } catch (e) {
        console.error('Mira error:', e)
      } finally {
        setMiraLoading(false)
      }
    }

    fetchMiraInsight()
    return () => { window.speechSynthesis?.cancel() }
  }, [])

  const handleEmailResults = async () => {
    if (emailSending || emailSent || !email) return
    setEmailSending(true)
    try {
      await fetch(`${API_URL}/email-results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email, topic: params!.topic, goal: params!.goal || '', overall,
          duration: fmt(data.actual_seconds || 0), wpm, wpmLabel,
          fillerTotal: data.filler_total || 0,
          strengths: displayStrengths, improvements: displayImprovements,
          feedbackPace, feedbackFiller: isPro ? feedbackFiller : '',
          feedbackStructure: isPro ? feedbackStructure : '',
          feedbackConfidence: isPro ? feedbackConfidence : '',
          fillerWords, transcript: data.transcript || '',
          isPro, conviction, coachSummary,
          confidenceLanguage, blScores: bl.scores || null, blFeedback: bl.feedback || null,
          scores: { relevance: data.scores?.relevance || 0, pace: data.scores?.pace || 0, filler: data.scores?.filler || 0, structure: data.scores?.structure || 0, confidence: data.scores?.confidence || 0 },
        }),
      })
      setEmailSent(true)
      setTimeout(() => setEmailSent(false), 3000)
    } catch (err) { console.error(err) }
    finally { setEmailSending(false) }
  }

  if (!raw || !params) return null

  return (
    <div style={{ minHeight: '100dvh', background: '#09090B', padding: '48px 20px 40px', maxWidth: 480, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <p style={{ fontSize: 16, fontWeight: 700, color: '#ffffff', flex: 1, marginRight: 12, lineHeight: 1.4 }}>{params.topic}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {voiceEnabled && (
            <button onClick={speakResults} style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', color: '#3B82F6', fontSize: 11, fontWeight: 600, fontFamily: 'inherit' }}>
              ▶ Replay
            </button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: '#52525B' }}>Voice</span>
            <div onClick={() => toggleVoice(!voiceEnabled)} style={{ width: 44, height: 24, borderRadius: 12, background: voiceEnabled ? 'rgba(59,130,246,0.5)' : '#27272A', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
              <div style={{ position: 'absolute', top: 2, left: voiceEnabled ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: voiceEnabled ? '#3B82F6' : '#52525B', transition: 'left 0.2s' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Language selector */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
        <select
          value={selectedLang}
          onChange={e => handleLanguageChange(e.target.value)}
          disabled={translating}
          style={{
            background: '#1A1A1E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
            color: '#d4d4d8', fontSize: 13, padding: '7px 12px', fontFamily: 'inherit',
            cursor: 'pointer', flex: 1, appearance: 'none', outline: 'none',
          }}
        >
          {LANGUAGES.map(l => (
            <option key={l.code} value={l.code}>{l.label}</option>
          ))}
        </select>
        {translating && (
          <span style={{ fontSize: 12, color: '#A1A1AA' }}>Translating...</span>
        )}
        {translated && !translating && (
          <span style={{ fontSize: 12, color: '#22C55E' }}>✓ Translated</span>
        )}
      </div>

      {/* 1. Overall score */}
      <div style={{ background: '#1A1A1E', borderRadius: 16, padding: 24, border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 36, marginBottom: 4 }}>{verdict.emoji}</div>
        <p style={{ fontSize: 24, fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>{verdict.label}</p>
        <p style={{ fontSize: 56, fontWeight: 700, color, lineHeight: 1.1, marginBottom: 4 }}>
          {overall}<span style={{ fontSize: 20, color: '#52525B', fontWeight: 400 }}>/100</span>
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#ffffff' }}>{fmt(data.actual_seconds || 0)}</p>
            <p style={{ fontSize: 10, color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>Duration</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: wpmColor }}>{wpm}</p>
            <p style={{ fontSize: 10, color: wpmColor, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{wpmLabel}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#ffffff' }}>{data.filler_total || 0}</p>
            <p style={{ fontSize: 10, color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>Fillers</p>
          </div>
        </div>
      </div>

      {/* Mira modal */}
      {showMiraModal && (
        <MiraModal
          onComplete={() => { setShowMiraModal(false); setIsOnboarded(true) }}
          onSkip={() => setShowMiraModal(false)}
        />
      )}

      {/* 2. Mira / Coach summary */}
      {miraLoading ? (
        <div style={{ background: '#1A1A1E', borderRadius: 12, padding: 18, border: '1px solid rgba(59,130,246,0.2)', marginBottom: 14, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: '#52525B' }}>Mira is reviewing your session...</p>
        </div>
      ) : miraInsight && isOnboarded ? (
        <div style={{ background: '#1A1A1E', borderRadius: 12, padding: 18, border: '1px solid rgba(59,130,246,0.2)', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #3B82F6, #6366F1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🎤</div>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#3B82F6', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Mira says</p>
          </div>
          <p style={{ fontSize: 15, color: '#d4d4d8', lineHeight: 1.7, marginBottom: miraInsight.next_session ? 14 : 0 }}>{miraInsight.message}</p>
          {miraInsight.next_session && (
            <div style={{ background: 'rgba(59,130,246,0.08)', borderRadius: 8, padding: '10px 14px', border: '1px solid rgba(59,130,246,0.15)' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Next session suggestion</p>
              <p style={{ fontSize: 14, color: '#d4d4d8', lineHeight: 1.6, margin: 0 }}>{miraInsight.next_session}</p>
            </div>
          )}
        </div>
      ) : coachSummary ? (
        <div style={{ background: '#1A1A1E', borderRadius: 12, padding: 18, border: '1px solid rgba(59,130,246,0.2)', marginBottom: 14 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Your coach says</p>
          <p style={{ fontSize: 15, color: '#d4d4d8', lineHeight: 1.7, margin: 0 }}>{coachSummary}</p>
        </div>
      ) : null}

      {/* 3. Goal */}
      {params.goal && (
        <Section>
          <SectionTitle>Your goal</SectionTitle>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#ffffff', marginBottom: 10 }}>{params.goal}</p>
          <div style={{ display: 'inline-block', padding: '6px 12px', borderRadius: 8, background: convictionConvinced ? 'rgba(34,197,94,0.1)' : 'rgba(161,161,170,0.1)', marginBottom: convictionReasoning ? 10 : 0 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: convictionConvinced ? '#22C55E' : '#A1A1AA' }}>
              {convictionConvinced ? 'You made a strong case' : 'Room to grow here'}
            </span>
          </div>
          {convictionReasoning && <p style={{ fontSize: 14, color: '#d4d4d8', lineHeight: 1.65, margin: 0 }}>{convictionReasoning}</p>}
        </Section>
      )}

      {/* 4. What you did well */}
      {displayStrengths.length > 0 && (
        <Section>
          <SectionTitle>What you did well</SectionTitle>
          {displayStrengths.map((s: string, i: number) => <BulletItem key={i} text={s} color="#22C55E" />)}
        </Section>
      )}

      {/* 5. Focus on this next */}
      {displayImprovements.length > 0 && (
        <div style={{ background: 'rgba(245,158,11,0.08)', borderRadius: 12, padding: 18, border: '1px solid rgba(245,158,11,0.3)', marginBottom: 14 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Focus on this next</p>
          <p style={{ fontSize: 15, color: '#ffffff', fontWeight: 500, lineHeight: 1.6, margin: 0 }}>{displayImprovements[0]}</p>
        </div>
      )}

      {/* 6. Speech timeline */}
      {data.word_timestamps && data.word_timestamps.length > 2 && (
        <SpeechTimeline
          wordTimestamps={data.word_timestamps}
          actualSeconds={data.actual_seconds || params.targetSeconds}
          isPro={isPro}
          onUpgrade={() => navigate('/upgrade')}
        />
      )}

      {/* 7. Body language */}
      {hasBodyLanguage && (
        isPro ? (
          <Section>
            <SectionTitle>Body language</SectionTitle>
            {[
              { label: 'Eye contact', text: blEye },
              { label: 'Posture', text: blPosture },
              { label: 'Movement', text: blMovement },
              { label: 'Gestures', text: blGestures },
            ].filter(f => f.text && f.text !== 'No video data available.').map(({ label, text }, i, arr) => (
              <FeedbackRow key={label} label={label} text={text} last={i === arr.length - 1} />
            ))}
          </Section>
        ) : (
          <Section>
            <SectionTitle>Body language</SectionTitle>
            <BlurredRows onUnlock={() => navigate('/upgrade')} />
          </Section>
        )
      )}

      {/* 8. All improvements */}
      {displayImprovements.length > 1 && (
        <Section>
          <SectionTitle>All improvements</SectionTitle>
          {(isPro ? displayImprovements : displayImprovements.slice(0, 1)).map((s: string, i: number) => (
            <BulletItem key={i} text={s} color="#F59E0B" />
          ))}
          {!isPro && displayImprovements.length > 1 && (
            <ProGate text={`${displayImprovements.length - 1} more improvements unlocked with Pro`} onUnlock={() => navigate('/upgrade')} />
          )}
        </Section>
      )}

      {/* 9. Feedback */}
      <Section>
        <SectionTitle>Feedback</SectionTitle>
        {feedbackPace && <FeedbackRow label="Pace" text={feedbackPace} last={!isPro} />}
        {isPro ? (
          <>
            {feedbackFiller && <FeedbackRow label="Filler Words" text={feedbackFiller} />}
            {feedbackStructure && <FeedbackRow label="Structure" text={feedbackStructure} />}
            {feedbackConfidence && <FeedbackRow label="Confidence" text={feedbackConfidence} />}
            {blEye && blEye !== 'No video data available.' && (
              <FeedbackRow label="Eye Contact" text={blEye} last />
            )}
          </>
        ) : (
          <ProGate text="Full feedback unlocked with Pro" onUnlock={() => navigate('/upgrade')} />
        )}
      </Section>

      {/* 10. Weak language */}
      {confidenceLanguage && confidenceLanguage.total > 0 && (
        isPro ? (
          <Section>
            <SectionTitle>Weak language detected</SectionTitle>
            <p style={{ fontSize: 24, fontWeight: 700, color: confidenceLanguage.total >= 5 ? '#EF4444' : '#F59E0B', marginBottom: 10 }}>
              {confidenceLanguage.total} instances
            </p>
            <div style={{ marginBottom: 10 }}>
              {(confidenceLanguage.phrases || []).map((p: string, i: number) => (
                <span key={i} style={{ display: 'inline-block', background: '#222228', color: '#A1A1AA', fontSize: 12, padding: '5px 10px', borderRadius: 6, margin: '2px' }}>"{p}"</span>
              ))}
            </div>
            {confidenceLanguage.examples && confidenceLanguage.examples.slice(0, 2).map((ex: string, i: number) => (
              <p key={i} style={{ fontSize: 14, color: '#d4d4d8', fontStyle: 'italic', marginTop: 6 }}>"{ex}"</p>
            ))}
          </Section>
        ) : (
          <Section>
            <SectionTitle>Weak language detected</SectionTitle>
            <BlurredRows onUnlock={() => navigate('/upgrade')} />
          </Section>
        )
      )}

      {/* 11. Filler words */}
      {fillerEntries.length > 0 && (
        <Section>
          <SectionTitle>Filler words</SectionTitle>
          <div>
            {fillerEntries.map(([word, count]) => (
              <FillerChip key={word} word={word} count={count as number} />
            ))}
          </div>
        </Section>
      )}

      {/* 12. Transcript */}
      {data.transcript && (
        <Section>
          <SectionTitle>Transcript</SectionTitle>
          <HighlightedTranscript transcript={data.transcript} fillerWords={fillerWords} />
        </Section>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
        <button
          onClick={() => { clearSession(); navigate('/setup') }}
          style={{ width: '100%', background: '#3B82F6', color: '#fff', fontWeight: 700, fontSize: 15, padding: '14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Practice Again
        </button>
        <button
          onClick={handleEmailResults}
          disabled={emailSending || emailSent}
          style={{ width: '100%', background: 'transparent', color: emailSent ? '#22C55E' : '#A1A1AA', fontWeight: 400, fontSize: 14, padding: '14px', borderRadius: 10, border: `1px solid ${emailSent ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.1)'}`, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          {emailSending ? 'Sending...' : emailSent ? 'Sent!' : 'Email Results'}
        </button>
        <button
          onClick={() => navigate('/history')}
          style={{ width: '100%', background: 'transparent', color: '#A1A1AA', fontWeight: 400, fontSize: 14, padding: '14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          History
        </button>
      </div>

      <LegalFooter />
    </div>
  )
}
