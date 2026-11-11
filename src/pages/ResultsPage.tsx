import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessionStore, useAuthStore } from '../store'
import { API_URL } from '../lib/constants'
import { checkUsage } from '../lib/api'
import { useEffectiveAccess } from '../hooks/useEffectiveAccess'
import LegalFooter from '../components/LegalFooter'
import BottomNav from '../components/BottomNav'
import MiraAvatar from '../components/MiraAvatar'

function scoreColor(v: number) {
  return v >= 70 ? '#22C55E' : v >= 50 ? '#F59E0B' : '#EF4444'
}
// #1 — no emoji in verdict
function getVerdict(score: number) {
  if (score >= 80) return { label: 'Outstanding session' }
  if (score >= 65) return { label: 'Strong performance' }
  if (score >= 50) return { label: 'Good progress' }
  if (score >= 35) return { label: 'Getting there' }
  return { label: 'Keep going' }
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

function HighlightedTranscript({ transcript, fillerWords, weakPhrases = [] }: { transcript: string; fillerWords: Record<string, number>; weakPhrases?: string[] }) {
  const fillers = Object.keys(fillerWords).filter(w => fillerWords[w] > 0)

  // Build parts with two pass: weak language (amber) first, then fillers (red)
  // We tag each character position to avoid double-highlighting
  type Part = { text: string; type: 'normal' | 'filler' | 'weak' }
  // Start with the full transcript as one normal part
  let segments: Part[] = [{ text: transcript, type: 'normal' }]

  // First pass: highlight weak language phrases (amber)
  if (weakPhrases.length > 0) {
    const sortedPhrases = [...weakPhrases].sort((a, b) => b.length - a.length)
    for (const phrase of sortedPhrases) {
      const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const re = new RegExp('\\b' + escaped + '\\b', 'gi')
      const newSegments: Part[] = []
      for (const seg of segments) {
        if (seg.type !== 'normal') { newSegments.push(seg); continue }
        let last = 0; let m
        re.lastIndex = 0
        while ((m = re.exec(seg.text)) !== null) {
          if (m.index > last) newSegments.push({ text: seg.text.slice(last, m.index), type: 'normal' })
          newSegments.push({ text: m[0], type: 'weak' })
          last = m.index + m[0].length
        }
        if (last < seg.text.length) newSegments.push({ text: seg.text.slice(last), type: 'normal' })
      }
      segments = newSegments
    }
  }

  // Second pass: highlight filler words (red) — only in normal segments
  if (fillers.length > 0) {
    const pattern = new RegExp('\\b(' + fillers.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\b', 'gi')
    const newSegments: Part[] = []
    for (const seg of segments) {
      if (seg.type !== 'normal') { newSegments.push(seg); continue }
      let last = 0; let m
      pattern.lastIndex = 0
      while ((m = pattern.exec(seg.text)) !== null) {
        if (m.index > last) newSegments.push({ text: seg.text.slice(last, m.index), type: 'normal' })
        newSegments.push({ text: m[0], type: 'filler' })
        last = m.index + m[0].length
      }
      if (last < seg.text.length) newSegments.push({ text: seg.text.slice(last), type: 'normal' })
    }
    segments = newSegments
  }

  const hasHighlights = fillers.length > 0 || weakPhrases.length > 0

  return (
    <div>
      {hasHighlights && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 10, flexWrap: 'wrap' }}>
          {fillers.length > 0 && <span style={{ fontSize: 11, color: '#A1A1AA' }}><span style={{ color: '#EF4444', fontWeight: 700 }}>Red</span> = filler words</span>}
          {weakPhrases.length > 0 && <span style={{ fontSize: 11, color: '#A1A1AA' }}><span style={{ color: '#F59E0B', fontWeight: 700 }}>Amber</span> = weak language</span>}
        </div>
      )}
      <p style={{ fontSize: 14, color: '#A1A1AA', lineHeight: 1.7, margin: 0 }}>
        {segments.map((part, i) => {
          if (part.type === 'filler') return <span key={i} style={{ color: '#EF4444', fontWeight: 700 }}>{part.text}</span>
          if (part.type === 'weak') return <span key={i} style={{ color: '#F59E0B', fontWeight: 700, background: 'rgba(245,158,11,0.1)', borderRadius: 3, padding: '0 2px' }}>{part.text}</span>
          return <span key={i}>{part.text}</span>
        })}
      </p>
    </div>
  )
}


// ─── Sales-mode pieces ────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, { label: string; color: string; border: string }> = {
  handled: { label: 'HANDLED', color: '#22C55E', border: 'rgba(34,197,94,0.4)' },
  weak: { label: 'WEAK', color: '#F59E0B', border: 'rgba(245,158,11,0.4)' },
  missed: { label: 'MISSED', color: '#EF4444', border: 'rgba(239,68,68,0.4)' },
}

const GOAL_STYLE: Record<string, { label: string; color: string; bg: string; border: string; text: string }> = {
  achieved: { label: 'Win', color: '#22C55E', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.3)', text: '#c9e8d2' },
  partially_achieved: { label: 'Partial win', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.3)', text: '#e4d5b0' },
  not_achieved: { label: 'Not yet', color: '#EF4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.3)', text: '#f0c9c9' },
}

function Chevron({ up }: { up?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A1A1AA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points={up ? '18 15 12 9 6 15' : '6 9 12 15 18 9'} />
    </svg>
  )
}

function QuestionRow({ qf, isPro, defaultOpen, onUnlock }: { qf: any; isPro: boolean; defaultOpen: boolean; onUnlock: () => void }) {
  const [open, setOpen] = useState(defaultOpen)
  const st = STATUS_STYLE[qf.status] || STATUS_STYLE.weak
  return (
    <div style={{ background: '#1A1A1E', border: `1px solid ${qf.status === 'missed' ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 12, padding: '0 14px' }}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        style={{ width: '100%', minHeight: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', color: '#fff' }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>{qf.question}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: st.color, border: `1px solid ${st.border}`, borderRadius: 20, padding: '3px 9px' }}>{st.label}</span>
          <Chevron up={open} />
        </span>
      </button>
      {open && (
        <div style={{ paddingBottom: 14 }}>
          {qf.feedback && <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: '#d4d4d8' }}>{qf.feedback}</p>}
          {qf.better_answer && (
            isPro ? (
              <div style={{ marginTop: 10, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, padding: '10px 12px' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#22C55E' }}>A STRONGER ANSWER</p>
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: '#d4d4d8' }}>{qf.better_answer}</p>
              </div>
            ) : (
              <ProGate text="See a stronger answer to this question with Pro" onUnlock={onUnlock} />
            )
          )}
        </div>
      )}
    </div>
  )
}

function DetailsWrap({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        style={{ width: '100%', minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', padding: '0 4px', cursor: 'pointer', fontFamily: 'inherit' }}
      >
        <span style={{ fontSize: 14, color: '#d4d4d8' }}>{title}</span>
        <Chevron up={open} />
      </button>
      {open && <div style={{ paddingTop: 6, paddingBottom: 6 }}>{children}</div>}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ResultsPage() {
  const navigate = useNavigate()
  const { results: raw, params } = useSessionStore()
  const { email, setAuth } = useAuthStore()
  // Reads org membership directly so team members are not treated as Free by a stale cached plan
  const { isPro } = useEffectiveAccess()

  // Refresh plan from backend when trial just unlocked
  useEffect(() => {
    if (raw?.trial_unlocked && email) {
      checkUsage(email).then(u => {
        setAuth(email, u.plan ?? 'free', u.sessions_remaining ?? 5, u.sessions_reset_date ?? '')
      }).catch(console.error)
    }
  }, [raw?.trial_unlocked])

  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [tryingAgain, setTryingAgain] = useState(false)
  const [showConsent, setShowConsent] = useState(false)
  const [miraInsight, setMiraInsight] = useState<{ message: string; next_session: string } | null>(null)
  const [miraLoading, setMiraLoading] = useState(false)

  const data = raw as any
  const neg = data?.negotiation || null
  const feedback = data?.feedback || {}
  const bl = data?.body_language || {}
  const blFeedback = bl.feedback || {}
  const blScore: number = (bl.scores && bl.scores.overall_body_language) || 0
  const hasDelivery = blScore > 0 && Object.values(blFeedback).some((v: any) => v && v !== 'No video data available.')
  const strengths: string[] = data?.strengths || []
  const improvements: string[] = data?.improvements || []
  const pitchOverall = data?.scores?.overall || 0
  // Sales score: average of pitch, objection handling, clarity, confidence (calculated on the server)
  const overall: number = neg && typeof neg.overall_score === 'number' ? neg.overall_score : pitchOverall
  const verdict = getVerdict(overall)
  const coachSummary: string = data?.coach_summary || ''
  const rawCL = data?.confidence_language
  const hedging = rawCL
    ? Array.isArray(rawCL)
      ? { total: rawCL.length, phrases: rawCL as string[] }
      : (rawCL as { total: number; phrases: string[] })
    : null
  const fillerWords: Record<string, number> = data?.filler_words || {}
  const fillerEntries = Object.entries(fillerWords).filter(([, c]) => (c as number) > 0).sort((a, b) => (b[1] as number) - (a[1] as number))

  // Headline: did the buyer agree to what the rep wanted?
  const gs = neg ? GOAL_STYLE[neg.goal_status] || null : null
  const headLabel: string = gs ? gs.label : verdict.label
  const headColor: string = gs ? gs.color : scoreColor(overall)
  const headBg: string = gs ? gs.bg : 'rgba(255,255,255,0.04)'
  const headBorder: string = gs ? gs.border : 'rgba(255,255,255,0.1)'
  const headText: string = gs ? gs.text : '#d4d4d8'
  const headReason: string = (neg && neg.goal_reasoning) || coachSummary || ''
  const fixText: string = (neg && neg.fix_next) || improvements[0] || ''
  const questions: any[] = (neg && neg.per_question_feedback) || []
  const firstOpenIdx = questions.findIndex(q => q.status !== 'handled')

  const tiles: { label: string; value: number }[] = neg
    ? [
        { label: 'Pitch', value: typeof neg.pitch_score === 'number' ? neg.pitch_score : pitchOverall },
        { label: 'Objections', value: neg.objection_handling_score || 0 },
        { label: 'Clarity', value: neg.clarity_score || 0 },
        { label: 'Confidence', value: neg.confidence_score || 0 },
      ]
    : []
  // Delivery on camera: shown as its own tile whenever the camera was on
  if (hasDelivery) tiles.push({ label: 'Delivery', value: blScore })

  const speakResults = () => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const text = [
      headLabel + '.',
      headReason,
      fixText ? 'Fix this next: ' + fixText : '',
    ].filter(Boolean).join(' ')
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.95; utterance.lang = 'en-US'
    window.speechSynthesis.speak(utterance)
  }

  const toggleVoice = (enabled: boolean) => {
    setVoiceEnabled(enabled)
    if (!enabled) window.speechSynthesis?.cancel()
    else speakResults()
  }

  useEffect(() => {
    if (!raw || !params) { navigate('/setup'); return }

    // Remembered on this device so Home can show "Last: ..." on the next visit
    try {
      localStorage.setItem('sua_last', JSON.stringify({ label: headLabel, score: overall || null, fix: fixText }))
    } catch {}

    const speakTimer = setTimeout(() => { if (voiceEnabled) speakResults() }, 800)

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
              overall,
              goalStatus: neg ? neg.goal_status : null,
              fixNext: fixText,
              topic: params.topic,
            },
          }),
        })
        const result = await res.json()
        if (result.message) setMiraInsight({ message: result.message, next_session: result.next_session })
      } catch (e) {
        console.error('Mira error:', e)
      } finally {
        setMiraLoading(false)
      }
    }
    fetchMiraInsight()

    // Weekly-email consent: asked once, here, after the first real result
    if (email) {
      let answered = false
      try { answered = localStorage.getItem('consent_answered') === 'true' } catch {}
      if (!answered) {
        fetch(`${API_URL}/auth/check`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })
          .then(r => r.json())
          .then(d => {
            if (d.newsletter_consent === null || d.newsletter_consent === undefined) {
              setShowConsent(true)
            } else {
              try { localStorage.setItem('consent_answered', 'true') } catch {}
            }
          })
          .catch(() => {})
      }
    }

    return () => { clearTimeout(speakTimer); window.speechSynthesis?.cancel() }
  }, [])

  const handleConsent = async (consent: boolean) => {
    try {
      await fetch(`${API_URL}/otp/consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newsletterConsent: consent }),
      })
    } catch (e) {
      console.error('Consent update error:', e)
    }
    try { localStorage.setItem('consent_answered', 'true') } catch {}
    setShowConsent(false)
  }

  const handleTryAgain = async () => {
    if (tryingAgain) return
    setTryingAgain(true)
    let blocked = false
    // Free users out of pitches go to upgrade instead of bypassing the cap.
    // Asks the backend (not the cached store) so a team member is never blocked by a stale plan.
    if (!isPro && email) {
      try {
        const u = await checkUsage(email)
        if (u.plan !== 'pro' && (u.sessions_remaining ?? 0) <= 0) blocked = true
      } catch (e) {
        console.error('Usage check failed:', e)
      }
    }
    setTryingAgain(false)
    window.speechSynthesis?.cancel()
    // Same pitch, goal and buyer stay in the session store: no retyping
    navigate(blocked ? '/upgrade' : '/get-ready')
  }

  if (!raw || !params) return null

  const weakMap: Record<string, string> = {
    'i think': 'I know',
    'i believe': 'I am confident',
    'i feel like': 'The evidence shows',
    'kind of': 'precisely',
    'sort of': 'specifically',
    'maybe': 'This will',
    'perhaps': 'The result is',
    'probably': 'This will',
    'i just': 'I',
    'just': '',
    'i guess': 'I know',
    'i suppose': 'I know',
    'a little bit': '',
    'a bit': '',
    'try to': 'will',
    'trying to': 'working to',
    'hopefully': 'We will',
    'i wish': 'My goal is',
    'it seems': 'The data shows',
    'it looks like': 'The evidence shows',
    'not sure': 'clear on the direction',
    'i was wondering': 'I want to know',
    'i was wondering if': 'Can we',
    'to be honest': '',
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#09090B', padding: '28px 20px 110px', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Top line: what was pitched + voice switch */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <p style={{ margin: 0, fontSize: 12, color: '#A1A1AA', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{params.topic}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: '#8B8B94' }}>Read aloud</span>
          <button
            onClick={() => toggleVoice(!voiceEnabled)} role="switch" aria-checked={voiceEnabled} aria-label="Read results aloud"
            style={{ width: 40, height: 24, borderRadius: 12, background: voiceEnabled ? '#2563EB' : '#3f3f46', border: 'none', position: 'relative', cursor: 'pointer', padding: 0 }}
          >
            <span style={{ position: 'absolute', top: 3, left: voiceEnabled ? 19 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.15s' }} />
          </button>
        </div>
      </div>

      {/* Trial unlocked banner */}
      {raw?.trial_unlocked && (
        <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 14, padding: '16px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#22C55E', margin: '0 0 4px 0' }}>You unlocked 7 days Pro</p>
          <p style={{ fontSize: 13, color: '#A1A1AA', margin: 0 }}>Check your email for confirmation. Enjoy full Pro access for the next 7 days.</p>
        </div>
      )}

      {/* Headline: outcome + the one thing to fix */}
      <div style={{ background: headBg, border: `1px solid ${headBorder}`, borderRadius: 18, padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.5px', color: headColor }}>{headLabel}</div>
          <div style={{ fontSize: 30, fontWeight: 700, fontFamily: 'ui-monospace, Menlo, monospace', color: '#fff' }}>
            {overall}<span style={{ fontSize: 14, color: '#8B8B94' }}>/100</span>
          </div>
        </div>
        {headReason && <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: headText }}>{headReason}</p>}
        {fixText && (
          <>
            <div style={{ height: 1, background: headBorder }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: headColor }}>FIX THIS NEXT</div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: '#fff' }}>{fixText}</p>
            </div>
          </>
        )}
      </div>

      {/* The numbers behind the score */}
      {tiles.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${tiles.length}, 1fr)`, gap: 8 }}>
          {tiles.map(t => (
            <div key={t.label} style={{ background: '#1A1A1E', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 4px', textAlign: 'center' }}>
              <p style={{ fontSize: 20, fontWeight: 700, color: scoreColor(t.value), margin: '0 0 2px 0', fontFamily: 'ui-monospace, Menlo, monospace' }}>{t.value}</p>
              <p style={{ fontSize: 10, color: '#A1A1AA', margin: 0, letterSpacing: '0.02em' }}>{t.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* The buyer's questions */}
      {questions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#A1A1AA', margin: '6px 0 2px 0' }}>THE BUYER'S {questions.length} QUESTIONS</div>
          {questions.map((qf, i) => (
            <QuestionRow key={i} qf={qf} isPro={isPro} defaultOpen={i === firstOpenIdx} onUnlock={() => navigate('/upgrade')} />
          ))}
        </div>
      )}

      {/* Mira: personal coach note */}
      {miraLoading ? (
        <div style={{ background: 'rgba(245,158,11,0.06)', borderRadius: 12, padding: 18, border: '1px solid rgba(245,158,11,0.2)', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: '#F59E0B', opacity: 0.6, margin: 0 }}>Mira is reviewing your pitch...</p>
        </div>
      ) : miraInsight ? (
        <div style={{ background: 'rgba(245,158,11,0.06)', borderRadius: 12, padding: 18, border: '1px solid rgba(245,158,11,0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <MiraAvatar size={32} />
            <p style={{ fontSize: 12, fontWeight: 700, color: '#F59E0B', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>Mira</p>
          </div>
          <p style={{ fontSize: 15, color: '#e4d5b0', lineHeight: 1.7, margin: miraInsight.next_session ? '0 0 14px 0' : 0 }}>{miraInsight.message}</p>
          {miraInsight.next_session && (
            <div style={{ background: 'rgba(245,158,11,0.08)', borderRadius: 8, padding: '10px 14px', border: '1px solid rgba(245,158,11,0.2)' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px 0' }}>Try this next</p>
              <p style={{ fontSize: 14, color: '#e4d5b0', lineHeight: 1.6, margin: 0 }}>{miraInsight.next_session}</p>
            </div>
          )}
        </div>
      ) : null}

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6 }}>
        <button
          onClick={handleTryAgain}
          disabled={tryingAgain}
          style={{ width: '100%', background: '#2563EB', color: '#fff', fontWeight: 700, fontSize: 16, padding: 16, borderRadius: 12, border: 'none', cursor: 'pointer', fontFamily: 'inherit', minHeight: 52, opacity: tryingAgain ? 0.6 : 1 }}
        >
          Try again
        </button>
        <button
          onClick={() => { window.speechSynthesis?.cancel(); navigate('/setup') }}
          style={{ width: '100%', background: 'transparent', color: '#d4d4d8', fontWeight: 600, fontSize: 15, padding: 15, borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', fontFamily: 'inherit', minHeight: 52 }}
        >
          New pitch
        </button>
      </div>

      {/* Details, collapsed by default */}
      <div style={{ marginTop: 4 }}>
        <DetailsWrap title="Pitch feedback">
          {strengths.length > 0 && (
            <Section>
              <SectionTitle>What worked</SectionTitle>
              {strengths.map((s: string, i: number) => <BulletItem key={i} text={s} color="#22C55E" />)}
            </Section>
          )}

          {improvements.length > 0 && (
            <Section>
              <SectionTitle>What to improve</SectionTitle>
              {(isPro ? improvements : improvements.slice(0, 1)).map((s: string, i: number) => (
                <BulletItem key={i} text={s} color="#F59E0B" />
              ))}
              {!isPro && improvements.length > 1 && (
                <ProGate text={`${improvements.length - 1} more improvements unlocked with Pro`} onUnlock={() => navigate('/upgrade')} />
              )}
            </Section>
          )}

          <Section>
            <SectionTitle>How the pitch landed</SectionTitle>
            {feedback.relevance && <FeedbackRow label="Buyer focus" text={feedback.relevance} last={!isPro} />}
            {isPro ? (
              <>
                {feedback.structure && <FeedbackRow label="Pitch structure" text={feedback.structure} />}
                {feedback.confidence && <FeedbackRow label="Confidence" text={feedback.confidence} />}
                {feedback.filler && <FeedbackRow label="Filler words" text={feedback.filler} last />}
              </>
            ) : (
              <ProGate text="Full pitch feedback unlocked with Pro" onUnlock={() => navigate('/upgrade')} />
            )}
          </Section>

          {hasDelivery && (
            <div style={{ background: 'rgba(245,158,11,0.06)', borderRadius: 12, padding: 16, border: '1px solid rgba(245,158,11,0.25)', marginBottom: 14 }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 10px 0' }}>How you came across on camera</p>
              {isPro ? (
                [
                  { label: 'Eye contact', text: blFeedback.eye_contact },
                  { label: 'Posture', text: blFeedback.posture },
                  { label: 'Presence', text: blFeedback.movement },
                  { label: 'Gestures', text: blFeedback.gestures },
                ].filter(f => f.text && f.text !== 'No video data available.').map(({ label, text }, i, arr) => (
                  <FeedbackRow key={label} label={label} text={text} last={i === arr.length - 1} />
                ))
              ) : (
                <>
                  {blFeedback.eye_contact && <FeedbackRow label="Eye contact" text={blFeedback.eye_contact} last />}
                  <ProGate text="Posture, presence and gestures unlocked with Pro" onUnlock={() => navigate('/upgrade')} />
                </>
              )}
            </div>
          )}

          {hedging && hedging.total > 0 && (
            isPro ? (
              <Section>
                <SectionTitle>Hedging words</SectionTitle>
                <p style={{ fontSize: 24, fontWeight: 700, color: hedging.total >= 5 ? '#EF4444' : '#F59E0B', margin: '0 0 12px 0' }}>
                  {hedging.total} instances
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(hedging.phrases || []).map((p: string, i: number) => {
                    const strong = weakMap[p.toLowerCase()]
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B', fontSize: 12, padding: '5px 10px', borderRadius: 6, border: '1px solid rgba(245,158,11,0.25)' }}>"{p}"</span>
                        {strong !== undefined && (
                          <>
                            <span style={{ fontSize: 11, color: '#52525B' }}>→</span>
                            <span style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E', fontSize: 12, padding: '5px 10px', borderRadius: 6, border: '1px solid rgba(34,197,94,0.25)' }}>"{strong || 'remove it'}"</span>
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              </Section>
            ) : (
              <Section>
                <SectionTitle>Hedging words</SectionTitle>
                <BlurredRows onUnlock={() => navigate('/upgrade')} />
              </Section>
            )
          )}

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
        </DetailsWrap>

        {data.transcript && (
          isPro ? (
            <DetailsWrap title="Full transcript">
              <Section>
                <HighlightedTranscript
                  transcript={data.transcript}
                  fillerWords={fillerWords}
                  weakPhrases={hedging?.phrases || []}
                />
              </Section>
            </DetailsWrap>
          ) : (
            <button
              onClick={() => navigate('/upgrade')}
              style={{ width: '100%', minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 4px', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <span style={{ fontSize: 14, color: '#d4d4d8' }}>Full transcript and better answers</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#3B82F6' }}>PRO</span>
            </button>
          )
        )}
      </div>

      {/* Mira: weekly email consent, asked once after the first result */}
      {showConsent && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 14, padding: '14px 16px', marginTop: 6 }}>
          <MiraAvatar size={36} />
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#e4d5b0' }}>Coaching emails from Mira?</span>
            <span style={{ fontSize: 12, color: '#A1A1AA' }}>Based on your pitches. Unsubscribe any time.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <button onClick={() => handleConsent(true)} style={{ background: 'none', border: 'none', color: '#F59E0B', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', padding: '14px 8px' }}>Yes</button>
            <button onClick={() => handleConsent(false)} style={{ background: 'none', border: 'none', color: '#8B8B94', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', padding: '14px 6px' }}>No</button>
          </div>
        </div>
      )}

      <LegalFooter />
      <BottomNav active="practice" />
    </div>
  )
}
