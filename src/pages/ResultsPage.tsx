import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessionStore, useAuthStore } from '../store'
import { API_URL } from '../lib/constants'
import LegalFooter from '../components/LegalFooter'

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

function SectionCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: '#1A1A1E',
      borderRadius: 14,
      padding: '18px 16px',
      border: '1px solid rgba(255,255,255,0.05)',
      marginBottom: 14,
      ...style,
    }}>
      {children}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 10, fontWeight: 700, color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
      {children}
    </p>
  )
}

function BulletItem({ text, color = '#22C55E' }: { text: string; color?: string }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, marginTop: 7, flexShrink: 0 }} />
      <p style={{ fontSize: 14, color: '#d4d4d8', lineHeight: 1.7, margin: 0 }}>{text}</p>
    </div>
  )
}

function FillerChip({ word, count }: { word: string; count: number }) {
  const isHigh = count >= 5
  return (
    <span style={{
      display: 'inline-block',
      padding: '5px 10px',
      borderRadius: 6,
      fontSize: 13,
      marginRight: 6,
      marginBottom: 6,
      background: isHigh ? 'rgba(239,68,68,0.12)' : '#222228',
      color: isHigh ? '#EF4444' : '#A1A1AA',
      border: isHigh ? '1px solid rgba(239,68,68,0.3)' : 'none',
    }}>
      {word} x{count}
    </span>
  )
}

function HighlightedTranscript({ transcript, fillerWords }: { transcript: string; fillerWords: Record<string, number> }) {
  const fillers = Object.keys(fillerWords).filter(w => fillerWords[w] > 0)
  if (fillers.length === 0) {
    return <p style={{ fontSize: 14, color: '#A1A1AA', lineHeight: 1.7 }}>{transcript}</p>
  }
  const pattern = new RegExp('\\b(' + fillers.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\b', 'gi')
  const parts: { text: string; isFiller: boolean }[] = []
  let lastIndex = 0
  let match
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

function SpeechTimeline({ wordTimestamps, actualSeconds, isPro }: { wordTimestamps: any[]; actualSeconds: number; isPro: boolean }) {
  const [scrubPos, setScrubPos] = useState<number | null>(null)
  const [scrubInfo, setScrubInfo] = useState<any>(null)

  const duration = actualSeconds || wordTimestamps[wordTimestamps.length - 1]?.end || 60
  const chunkSize = 5
  const numChunks = Math.ceil(duration / chunkSize)
  const minWpm = 60, maxWpm = 200
  const graphH = 120, padTop = 10, padBot = 20
  const plotH = graphH - padTop - padBot

  const segments = Array.from({ length: numChunks }, (_, i) => {
    const start = i * chunkSize
    const end = start + chunkSize
    const words = wordTimestamps.filter(w => w.start >= start && w.start < end)
    const wpm = words.length > 0 ? Math.round((words.length / chunkSize) * 60) : 0
    return { start, end, wpm, text: words.map(w => w.word).join(' ') }
  })

  const pauses: any[] = []
  for (let i = 1; i < wordTimestamps.length; i++) {
    const gap = wordTimestamps[i].start - wordTimestamps[i - 1].end
    if (gap >= 0.8) pauses.push({ start: wordTimestamps[i - 1].end, end: wordTimestamps[i].start, duration: gap, type: gap >= 2 ? 'strategic' : 'hesitation' })
  }

  const width = 320
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
    if (onPause) { setScrubInfo({ isPause: true, ...onPause }); return }
    const seg = segments.find(s => t >= s.start && t < s.end) || segments[segments.length - 1]
    setScrubInfo({ isPause: false, ...seg })
  }

  return (
    <SectionCard>
      <SectionLabel>Speech timeline</SectionLabel>
      <div style={{ display: 'flex', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
        {[
          { color: 'rgba(34,197,94,0.3)', label: 'Ideal pace zone' },
          isPro ? { color: 'rgba(34,197,94,0.6)', label: 'Strategic pause' } : null,
          isPro ? { color: 'rgba(245,158,11,0.6)', label: 'Unplanned pause' } : null,
        ].filter(Boolean).map((item: any) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 14, height: 8, borderRadius: 2, background: item.color }} />
            <span style={{ fontSize: 11, color: '#A1A1AA' }}>{item.label}</span>
          </div>
        ))}
      </div>
      <svg
        width="100%"
        viewBox={`0 0 ${width} ${graphH}`}
        preserveAspectRatio="none"
        style={{ display: 'block', cursor: isPro ? 'crosshair' : 'default' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { setScrubPos(null); setScrubInfo(null) }}
      >
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
          <div style={{ background: '#111316', borderRadius: 8, padding: 12, minHeight: 48, marginTop: 4 }}>
            {!scrubInfo && <p style={{ fontSize: 13, color: '#52525B', fontStyle: 'italic' }}>{segments[Math.floor(segments.length / 2)]?.text || ''}</p>}
            {scrubInfo?.isPause && <p style={{ fontSize: 13, color: '#A1A1AA' }}>{scrubInfo.type === 'strategic' ? 'Strategic pause' : 'Unplanned pause'} — {scrubInfo.duration?.toFixed(1)}s</p>}
            {scrubInfo && !scrubInfo.isPause && (
              <>
                <p style={{ fontSize: 11, color: '#A1A1AA', marginBottom: 4 }}>{scrubInfo.wpm} WPM — {scrubInfo.wpm > 160 ? 'Too fast' : scrubInfo.wpm < 110 ? 'Too slow' : 'Good pace'}</p>
                <p style={{ fontSize: 13, color: '#d4d4d8', lineHeight: 1.5 }}>{scrubInfo.text}</p>
              </>
            )}
          </div>
        </>
      ) : (
        <div style={{ background: 'rgba(59,130,246,0.06)', borderRadius: 10, padding: 14, border: '1px solid rgba(59,130,246,0.2)', textAlign: 'center', marginTop: 8 }}>
          <p style={{ fontSize: 13, color: '#A1A1AA', marginBottom: 10 }}>Drag to explore your speech moment by moment — Pro feature</p>
          <button onClick={() => {}} style={{ background: '#3B82F6', color: '#fff', fontWeight: 700, fontSize: 12, padding: '8px 20px', borderRadius: 20, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            Unlock with Pro
          </button>
        </div>
      )}
    </SectionCard>
  )
}

export default function ResultsPage() {
  const navigate = useNavigate()
  const { results: raw, params, clearSession } = useSessionStore()
  const { email, plan } = useAuthStore()
  const isPro = plan === 'pro'

  const [emailSending, setEmailSending] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)

  const data = raw as any
  const scores = data?.scores || {}
  const bl = data?.body_language || {}
  const blScores = bl.scores || {}
  const blFeedback = bl.feedback || {}
  const feedback = data?.feedback || {}
  const strengths = data?.strengths || []
  const improvements = data?.improvements || []
  const overall = scores.overall || 0
  const color = scoreColor(overall)
  const verdict = getVerdict(overall)
  const wpm = data?.words_per_minute || 0
  const wpmColor = wpm === 0 ? '#A1A1AA' : wpm < 110 ? '#F59E0B' : wpm > 160 ? '#F59E0B' : '#22C55E'
  const wpmLabel = wpm === 0 ? 'WPM' : wpm < 110 ? 'Too slow' : wpm > 160 ? 'Too fast' : 'Good pace'
  const fillerWords: Record<string, number> = data?.filler_words || {}
  const fillerEntries = Object.entries(fillerWords).filter(([, c]) => (c as number) > 0).sort((a, b) => (b[1] as number) - (a[1] as number))
  const conviction = data?.conviction || null
  const hasBodyLanguage = blScores.eye_contact > 0 || blScores.posture > 0

  const speakResults = () => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const parts = [
      verdict.label + '.',
      data?.coach_summary || '',
      improvements[0] ? 'The one thing to focus on next: ' + improvements[0] : '',
    ].filter(Boolean).join(' ')
    const utterance = new SpeechSynthesisUtterance(parts)
    utterance.rate = 0.9
    utterance.lang = 'en-US'
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
          strengths, improvements,
          feedbackPace: feedback.pace || '',
          feedbackFiller: isPro ? (feedback.filler || '') : '',
          feedbackStructure: isPro ? (feedback.structure || '') : '',
          feedbackConfidence: isPro ? (feedback.confidence || '') : '',
          fillerWords: data.filler_words || {},
          transcript: data.transcript || '',
          isPro, conviction: data.conviction || null,
          coachSummary: data.coach_summary || '',
          confidenceLanguage: data.confidence_language || null,
          blScores: bl.scores || null, blFeedback: bl.feedback || null,
          scores: {
            relevance: scores.relevance || 0,
            pace: scores.pace || 0,
            filler: scores.filler || 0,
            structure: scores.structure || 0,
            confidence: scores.confidence || 0,
          },
        }),
      })
      setEmailSent(true)
      setTimeout(() => setEmailSent(false), 3000)
    } catch (err) {
      console.error(err)
    } finally {
      setEmailSending(false)
    }
  }

  if (!raw || !params) return null

  return (
    <div style={{ minHeight: '100dvh', background: '#09090B', padding: '48px 20px 40px', maxWidth: 480, margin: '0 auto' }}>

      {/* Header — topic + voice toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
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

      {/* 1. Overall score */}
      <SectionCard style={{ textAlign: 'center', padding: 24, border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize: 36, marginBottom: 4 }}>{verdict.emoji}</div>
        <p style={{ fontSize: 22, fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>{verdict.label}</p>
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
      </SectionCard>

      {/* 2. Coach summary */}
      {data.coach_summary && (
        <SectionCard style={{ border: '1px solid rgba(59,130,246,0.2)' }}>
          <SectionLabel>Your coach says</SectionLabel>
          <p style={{ fontSize: 15, color: '#d4d4d8', lineHeight: 1.7, margin: 0 }}>{data.coach_summary}</p>
        </SectionCard>
      )}

      {/* 3. Goal */}
      {params.goal && (
        <SectionCard>
          <SectionLabel>Your goal</SectionLabel>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#ffffff', marginBottom: 10 }}>{params.goal}</p>
          <div style={{ display: 'inline-block', padding: '6px 14px', borderRadius: 8, background: conviction?.convinced ? 'rgba(34,197,94,0.1)' : 'rgba(161,161,170,0.1)', marginBottom: conviction?.reasoning ? 10 : 0 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: conviction?.convinced ? '#22C55E' : '#A1A1AA' }}>
              {conviction?.convinced ? 'You made a strong case' : 'Room to grow here'}
            </span>
          </div>
          {conviction?.reasoning && <p style={{ fontSize: 14, color: '#d4d4d8', lineHeight: 1.65, margin: 0 }}>{conviction.reasoning}</p>}
        </SectionCard>
      )}

      {/* 4. What you did well */}
      {strengths.length > 0 && (
        <SectionCard>
          <SectionLabel>What you did well</SectionLabel>
          {strengths.map((s: string, i: number) => <BulletItem key={i} text={s} color="#22C55E" />)}
        </SectionCard>
      )}

      {/* 5. Focus on this next */}
      {improvements.length > 0 && (
        <div style={{ background: 'rgba(245,158,11,0.08)', borderRadius: 14, padding: 18, border: '1px solid rgba(245,158,11,0.3)', marginBottom: 14 }}>
          <SectionLabel>Focus on this next</SectionLabel>
          <p style={{ fontSize: 15, color: '#ffffff', fontWeight: 500, lineHeight: 1.6, margin: 0 }}>{improvements[0]}</p>
        </div>
      )}

      {/* 6. Speech timeline */}
      {data.word_timestamps && data.word_timestamps.length > 2 && (
        <SpeechTimeline
          wordTimestamps={data.word_timestamps}
          actualSeconds={data.actual_seconds || params.targetSeconds}
          isPro={isPro}
        />
      )}

      {/* 7. Body language — written comments only */}
      {hasBodyLanguage && (
        <SectionCard>
          <SectionLabel>Body language</SectionLabel>
          {[
            { label: 'Eye contact', text: blFeedback.eye_contact },
            { label: 'Posture', text: blFeedback.posture },
            { label: 'Movement', text: blFeedback.movement },
            { label: 'Gestures', text: blFeedback.gestures },
          ].filter(f => f.text && f.text !== 'No video data available.').map(({ label, text }, i, arr) => (
            <div key={label} style={{ paddingBottom: i < arr.length - 1 ? 12 : 0, marginBottom: i < arr.length - 1 ? 12 : 0, borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>{label}</p>
              <p style={{ fontSize: 14, color: '#d4d4d8', lineHeight: 1.65, margin: 0 }}>{text}</p>
            </div>
          ))}
        </SectionCard>
      )}

      {/* 8. All improvements */}
      {improvements.length > 1 && (
        <SectionCard>
          <SectionLabel>All improvements</SectionLabel>
          {(isPro ? improvements : improvements.slice(0, 1)).map((s: string, i: number) => (
            <BulletItem key={i} text={s} color="#F59E0B" />
          ))}
          {!isPro && improvements.length > 1 && (
            <div style={{ background: 'rgba(59,130,246,0.06)', borderRadius: 10, padding: 14, border: '1px solid rgba(59,130,246,0.2)', textAlign: 'center', marginTop: 8 }}>
              <p style={{ fontSize: 13, color: '#A1A1AA', marginBottom: 10 }}>{improvements.length - 1} more improvements unlocked with Pro</p>
              <button onClick={() => navigate('/upgrade')} style={{ background: '#3B82F6', color: '#fff', fontWeight: 700, fontSize: 12, padding: '8px 20px', borderRadius: 20, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                Unlock with Pro
              </button>
            </div>
          )}
        </SectionCard>
      )}

      {/* 9. Filler words */}
      {fillerEntries.length > 0 && (
        <SectionCard>
          <SectionLabel>Filler words</SectionLabel>
          <div>
            {fillerEntries.map(([word, count]) => (
              <FillerChip key={word} word={word} count={count as number} />
            ))}
          </div>
        </SectionCard>
      )}

      {/* 10. Transcript */}
      {data.transcript && (
        <SectionCard>
          <SectionLabel>Transcript</SectionLabel>
          <HighlightedTranscript transcript={data.transcript} fillerWords={fillerWords} />
        </SectionCard>
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
