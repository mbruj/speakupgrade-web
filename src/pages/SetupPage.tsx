import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, useSessionStore } from '../store'
import { checkUsage } from '../lib/api'
import { API_URL } from '../lib/constants'
import BottomNav from '../components/BottomNav'
import { getTodayChallenge, isChallengeDoneToday, getChallengeStreak, CHALLENGE_SECONDS, CHALLENGE_BUYER, CHALLENGE_GOAL } from '../lib/dailyChallenge'
import MiraAvatar from '../components/MiraAvatar'
import ExecFace from '../components/ExecFace'
import { getRank, timeUntilDrop } from '../lib/progress'
import { SCENARIOS, type Scenario } from '../lib/scenarios'

const PITCH_KEY = 'sua_pitch'
const LAST_KEY = 'sua_last'
const DEFAULT_GOAL = 'Get the buyer to agree to a next step'

interface Parsed { product: string; buyer: string; goal: string }
interface SavedPitch { text: string; parsed: Parsed }
interface LastResult { label: string; score: number | null; fix: string; exec?: Record<string, string> | null }

function readJSON<T>(key: string): T | null {
  try {
    const v = localStorage.getItem(key)
    return v ? (JSON.parse(v) as T) : null
  } catch { return null }
}

const MIC_PATH = (
  <>
    <rect x="9" y="3" width="6" height="12" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0" />
    <line x1="12" y1="18" x2="12" y2="21" />
  </>
)

export default function SetupPage() {
  const navigate = useNavigate()
  const { email, plan } = useAuthStore()
  const { setParams } = useSessionStore()

  const [saved] = useState<SavedPitch | null>(() => readJSON<SavedPitch>(PITCH_KEY))
  const [last] = useState<LastResult | null>(() => readJSON<LastResult>(LAST_KEY))
  const [editing, setEditing] = useState(false)
  const [custom, setCustom] = useState(false)
  const [text, setText] = useState('')
  const [parsed, setParsed] = useState<Parsed | null>(null)
  const [parsedFor, setParsedFor] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [miraMessage, setMiraMessage] = useState<string | null>(null)

  const [orgRole, setOrgRole] = useState<string | null>(null)
  const [orgChecked, setOrgChecked] = useState(false)
  const [usageRemaining, setUsageRemaining] = useState<number | null>(null)
  const [usageChecked, setUsageChecked] = useState(false)
  const [trialExpiry, setTrialExpiry] = useState<string | null>(null)

  // Voice dictation (browser speech recognition; hidden where unsupported)
  const SR: any = typeof window !== 'undefined' ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) : null
  const [listening, setListening] = useState(false)
  const recogRef = useRef<any>(null)
  const baseTextRef = useRef('')
  const textRef = useRef('')
  textRef.current = text

  const isRepeat = !!saved && !editing
  const pageReady = orgChecked && usageChecked

  useEffect(() => {
    if (!email) { navigate('/'); return }

    checkUsage(email)
      .then((u) => setUsageRemaining(u.sessions_remaining))
      .catch(console.error)
      .finally(() => setUsageChecked(true))

    fetch(`${API_URL}/org/me?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((data) => {
        setOrgRole(data.org_role || null)
        // Team members with no saved pitch start from their company context
        const ctx = data.company_context
        if (!saved && ctx && ctx.product_description) {
          const buyer = ctx.typical_buyer ? `, pitching to ${ctx.typical_buyer}` : ''
          setText((prev) => prev || `${ctx.product_description}${buyer}.`)
        }
      })
      .catch(() => {})
      .finally(() => setOrgChecked(true))

    // Mira's live message (same source the old Home used)
    fetch(`${API_URL}/coach/insight`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, currentSession: null, contextType: 'motivation' }),
    })
      .then((r) => r.json())
      .then((data) => { if (data.message) setMiraMessage(data.message) })
      .catch(() => {})

    fetch(`${API_URL}/trial/status?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.trial_active && data.trial_expires_at) {
          setTrialExpiry(new Date(data.trial_expires_at).toLocaleString('en-GB', {
            weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
          }))
        }
      })
      .catch(() => {})

    return () => { try { recogRef.current?.stop() } catch {} }
  }, [email])

  const canRecord = usageChecked && (plan === 'pro' || !!orgRole || (usageRemaining ?? 0) > 0)
  const oneLeft = usageChecked && plan !== 'pro' && !orgRole && usageRemaining === 1
  const outOfSessions = usageChecked && !canRecord

  // ---- Backend: turn free text into product / buyer / goal ----
  const parsePitch = async (raw: string): Promise<Parsed> => {
    try {
      const res = await fetch(`${API_URL}/negotiate/parse-pitch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: raw }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      return { product: data.product, buyer: data.buyer || '', goal: data.goal || '' }
    } catch (err) {
      console.error('parse-pitch failed, using raw text:', err)
      return { product: raw.slice(0, 200), buyer: '', goal: '' }
    }
  }

  // ---- Voice ----
  const startListening = () => {
    if (!SR || listening) return
    setNotice('')
    setParsed(null)
    baseTextRef.current = textRef.current ? textRef.current.trim() + ' ' : ''
    const rec = new SR()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = navigator.language || 'en-US'
    rec.onresult = (e: any) => {
      let spoken = ''
      for (let i = 0; i < e.results.length; i++) spoken += e.results[i][0].transcript
      setText(baseTextRef.current + spoken)
    }
    rec.onerror = (e: any) => {
      console.error('Speech error:', e.error)
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        setNotice('Microphone is blocked. Allow it in your browser settings, or type instead.')
      }
      setListening(false)
    }
    rec.onend = () => { setListening(false) }
    recogRef.current = rec
    try { rec.start(); setListening(true) } catch { setListening(false) }
  }

  const stopListening = async () => {
    try { recogRef.current?.stop() } catch {}
    setListening(false)
    // give the last interim result a moment to land, then let Mira read it
    setTimeout(async () => {
      const finalText = textRef.current.trim()
      if (!finalText) return
      setBusy(true)
      const p = await parsePitch(finalText)
      setParsed(p)
      setParsedFor(finalText)
      setBusy(false)
    }, 600)
  }

  // ---- Start ----
  const handleStart = async () => {
    if (busy || !canRecord) return
    let p: Parsed | null = null

    if (isRepeat && saved) {
      p = saved.parsed
    } else {
      const raw = text.trim()
      if (!raw) return
      if (listening) { try { recogRef.current?.stop() } catch {} setListening(false) }
      if (parsed && parsedFor === raw) {
        p = parsed
      } else {
        setBusy(true)
        p = await parsePitch(raw)
        setBusy(false)
      }
      try { localStorage.setItem(PITCH_KEY, JSON.stringify({ text: raw, parsed: p })) } catch {}
    }

    setParams({
      topic: p.product,
      goal: p.goal || DEFAULT_GOAL,
      audience: p.buyer,
      targetSeconds: 180,
      isChallenge: false,
      // category set => GradingPage runs the buyer Q&A after the pitch
      category: 'sales',
      // 30-minute recording cap only for team members
      teamSession: !!orgRole,
    } as any)
    navigate('/get-ready')
  }

  const startEdit = () => {
    setText(saved?.text || '')
    setParsed(null)
    setEditing(true)
  }

  // ---- Daily challenge: 5 minutes to convince the buying committee ----
  const challenge = getTodayChallenge()
  const challengeDone = isChallengeDoneToday()
  const challengeStreak = getChallengeStreak()

  const startChallenge = () => {
    setParams({
      topic: challenge.title + (challenge.twist ? ' Twist: ' + challenge.twist : ''),
      goal: CHALLENGE_GOAL,
      audience: CHALLENGE_BUYER,
      targetSeconds: CHALLENGE_SECONDS,
      isChallenge: true,
      category: 'sales',
      teamSession: false,
    } as any)
    navigate('/get-ready')
  }

  const startScenario = (sc: Scenario) => {
    if (!canRecord) return
    setParams({
      topic: sc.product,
      goal: sc.goal,
      audience: sc.buyer,
      targetSeconds: sc.seconds,
      isChallenge: false,
      category: 'sales',
      teamSession: !!orgRole,
    } as any)
    navigate('/get-ready')
  }

  const rank = getRank()
  const dropIn = timeUntilDrop()

  // Hero title: last word in blue, size follows length so long titles still fit
  const heroTitle = challenge.title + '.'
  const lastSpace = heroTitle.lastIndexOf(' ')
  const heroHead = lastSpace > 0 ? heroTitle.slice(0, lastSpace + 1) : ''
  const heroTail = lastSpace > 0 ? heroTitle.slice(lastSpace + 1) : heroTitle
  const heroSize = challenge.title.length <= 18 ? 48 : challenge.title.length <= 30 ? 38 : 30

  const EXEC_LINES: { role: 'CEO' | 'CFO' | 'CRO'; line: string }[] = [
    { role: 'CEO', line: 'Decides in ten seconds.' },
    { role: 'CFO', line: 'Wants the number.' },
    { role: 'CRO', line: 'Wants the close.' },
  ]

  const VERDICT_CHIP: Record<string, { text: string; color: string; bg: string }> = {
    yes: { text: 'in', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
    maybe: { text: 'maybe', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
    no: { text: 'out', color: '#F87171', bg: 'rgba(239,68,68,0.12)' },
  }

  const outOfNotice = outOfSessions && (
    <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#FCA5A5' }}>
      You have used all your free pitches this month.{' '}
      <button onClick={() => navigate('/upgrade')} style={{ color: '#3B82F6', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Upgrade to Pro</button>
    </div>
  )

  const canStart = isRepeat ? canRecord : (text.trim().length > 3 && canRecord)

  return (
    <div style={{ minHeight: '100dvh', background: '#09090B', display: 'flex', flexDirection: 'column', padding: '28px 20px 110px', maxWidth: 480, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.3px', color: '#fff' }}>
          <span style={{ color: '#3B82F6' }}>SPEAKUP</span>GRADE
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {oneLeft && (
            <div style={{ fontSize: 11, fontWeight: 600, color: '#F59E0B', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 20, padding: '5px 11px' }}>
              1 free pitch left
            </div>
          )}
          {challengeStreak.streak > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, height: 34, padding: '0 12px 0 9px', borderRadius: 17, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#F59E0B" aria-hidden="true"><path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-10z" /></svg>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#F59E0B' }}>{challengeStreak.streak}</span>
            </div>
          )}
          {(isRepeat && saved) && (
            <div style={{ height: 34, display: 'flex', alignItems: 'center', padding: '0 13px', borderRadius: 17, background: '#1A1A1E', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13, fontWeight: 600, color: '#E4E4E7' }}>
              {rank.name}
            </div>
          )}
        </div>
      </div>

      {trialExpiry && plan !== 'pro' && (
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#F59E0B', margin: '0 0 2px 0' }}>Record your first session to unlock 7 days Pro free</p>
          <p style={{ fontSize: 12, color: '#92400E', margin: 0 }}>Trial window closes {trialExpiry}</p>
        </div>
      )}

      {!pageReady ? (
        <div style={{ background: '#1A1A1E', borderRadius: 16, height: 120, marginBottom: 20 }} />
      ) : isRepeat && saved ? (
        /* ---------- Returning user ---------- */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flexGrow: 1 }}>
          {(miraMessage || last) && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 16, padding: '14px' }}>
              <MiraAvatar size={36} />
              <p style={{ fontSize: 14, lineHeight: 1.5, color: '#e4d5b0', margin: 0 }}>
                {miraMessage || ('Last pitch: ' + (last as LastResult).label + '.' + ((last as LastResult).fix ? ' Fix next: ' + (last as LastResult).fix : ''))}
              </p>
            </div>
          )}

          {outOfNotice}

          {challengeDone ? (
            <div style={{ background: '#1A1A1E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '16px 18px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: '#60A5FA', margin: '0 0 4px 0' }}>TODAY'S DROP</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>Done. New one in {dropIn}.</p>
            </div>
          ) : (
            <div style={{ background: '#2563EB', borderRadius: 28, padding: '22px 20px 20px 20px', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.14em' }}>TODAY'S DROP</span>
                <span style={{ fontSize: 12, fontWeight: 600 }}>New one in {dropIn}</span>
              </div>
              <p style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.08, letterSpacing: '-0.02em', margin: '10px 0 0 0' }}>{challenge.title}.</p>
              <p style={{ fontSize: 15, lineHeight: 1.4, margin: '8px 0 0 0' }}>{challenge.setup}</p>
              <button
                onClick={startChallenge}
                style={{ marginTop: 18, width: '100%', height: 56, border: 'none', borderRadius: 18, background: '#09090B', color: '#fff', fontWeight: 700, fontSize: 19, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Play now
              </button>
            </div>
          )}

          <div style={{ background: '#1A1A1E', borderRadius: 20, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: '#A1A1AA', margin: '0 0 4px 0' }}>YOUR PITCH</p>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#fff', lineHeight: 1.3, margin: 0 }}>
                {saved.parsed.product}{saved.parsed.buyer ? ', to ' + saved.parsed.buyer : ''}
              </p>
              <button onClick={startEdit} style={{ background: 'none', border: 'none', color: '#60A5FA', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', padding: '8px 0 0 0', minHeight: 36 }}>
                Edit
              </button>
            </div>
            <button
              onClick={handleStart}
              disabled={!canStart}
              style={{ flexShrink: 0, minHeight: 48, padding: '0 20px', borderRadius: 24, border: challengeDone ? 'none' : '1px solid #3F3F46', background: challengeDone ? '#2563EB' : 'transparent', color: '#fff', fontSize: 15, fontWeight: 700, cursor: canStart ? 'pointer' : 'not-allowed', opacity: canStart ? 1 : 0.45, fontFamily: 'inherit' }}
            >
              Pitch it
            </button>
          </div>

          {last && last.exec && (
            <div style={{ background: '#1A1A1E', borderRadius: 20, padding: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: '#A1A1AA', margin: '0 0 12px 0' }}>LAST TIME THEY SAID</p>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['CEO', 'CFO', 'CRO'] as const).map(r => {
                  const chip = VERDICT_CHIP[(last.exec as Record<string, string>)[r]] || VERDICT_CHIP.no
                  return (
                    <div key={r} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <ExecFace role={r} size={44} />
                      <div style={{ padding: '4px 12px', borderRadius: 12, background: chip.bg, color: chip.color, fontSize: 12, fontWeight: 700 }}>{r} {chip.text}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: '#A1A1AA' }}>
              <span>{rank.name}</span><span>{rank.next || ''}</span>
            </div>
            <div style={{ marginTop: 8, height: 10, borderRadius: 5, background: '#27272A' }}>
              <div style={{ width: rank.pct + '%', height: 10, borderRadius: 5, background: '#2563EB' }} />
            </div>
            <p style={{ fontSize: 12, color: '#A1A1AA', margin: '8px 0 0 0' }}>
              {rank.next ? 'Win over ' + rank.toNext + ' more executive' + (rank.toNext === 1 ? '' : 's') + ' to become a ' + rank.next + '.' : 'You are a ' + rank.name + '.'}
            </p>
          </div>
        </div>
      ) : (!editing && !custom) ? (
        /* ---------- New user: today's challenge is the whole screen ---------- */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, flexGrow: 1 }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', color: '#60A5FA', margin: 0 }}>
            {challengeDone ? 'DONE FOR TODAY' : "TODAY'S CHALLENGE"}
          </p>
          <h1 style={{ fontSize: challengeDone ? 38 : heroSize, fontWeight: 700, lineHeight: 1.04, letterSpacing: '-0.02em', color: '#fff', margin: '10px 0 0 0' }}>
            {challengeDone ? 'New one tomorrow.' : <>{heroHead}<span style={{ color: '#60A5FA' }}>{heroTail}</span></>}
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.4, color: '#D4D4D8', margin: '14px 0 0 0' }}>Three executives. No mercy.</p>
          {!challengeDone && <p style={{ fontSize: 14, lineHeight: 1.45, color: '#A1A1AA', margin: '6px 0 0 0' }}>{challenge.setup}</p>}

          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            {EXEC_LINES.map(e => (
              <div key={e.role} style={{ flex: 1, background: '#1A1A1E', borderRadius: 20, padding: '16px 6px 14px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <ExecFace role={e.role} size={56} />
                <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{e.role}</div>
                <div style={{ fontSize: 12, lineHeight: 1.35, color: '#A1A1AA', textAlign: 'center' }}>{e.line}</div>
              </div>
            ))}
          </div>

          <div style={{ flexGrow: 1, minHeight: 20 }} />

          {outOfNotice && <div style={{ marginBottom: 12 }}>{outOfNotice}</div>}

          <button
            onClick={() => (challengeDone ? startScenario(SCENARIOS[0]) : startChallenge())}
            disabled={challengeDone && !canRecord}
            style={{ width: '100%', height: 64, border: 'none', borderRadius: 20, background: '#2563EB', color: '#fff', fontWeight: 700, fontSize: 22, cursor: 'pointer', fontFamily: 'inherit', opacity: challengeDone && !canRecord ? 0.45 : 1 }}
          >
            {challengeDone ? 'Pitch the pen' : 'Pitch now'}
          </button>
          <p style={{ textAlign: 'center', fontSize: 13, color: '#A1A1AA', margin: '10px 0 0 0' }}>Mic and camera on. Up to 5 minutes. Most people need two.</p>

          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', color: '#A1A1AA', margin: '22px 0 0 0' }}>MORE WAYS TO PLAY</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {SCENARIOS.filter(sc => sc.id !== 'pen').map(sc => (
              <button
                key={sc.id}
                onClick={() => startScenario(sc)}
                disabled={!canRecord}
                style={{ minHeight: 44, padding: '0 16px', borderRadius: 22, border: '1px solid #27272A', background: '#1A1A1E', color: '#fff', fontSize: 14, fontWeight: 600, cursor: canRecord ? 'pointer' : 'not-allowed', opacity: canRecord ? 1 : 0.5, fontFamily: 'inherit' }}
              >
                {sc.title}
              </button>
            ))}
            <button
              onClick={() => setCustom(true)}
              style={{ minHeight: 44, padding: '0 16px', borderRadius: 22, border: '1px solid #27272A', background: '#1A1A1E', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Use my own pitch
            </button>
          </div>
        </div>
      ) : (
        /* ---------- First run / editing: one box, type or speak ---------- */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, flexGrow: 1 }}>
          {custom && !editing && (
            <button onClick={() => setCustom(false)} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: '#A1A1AA', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', padding: '4px 0', minHeight: 36 }}>
              Back
            </button>
          )}
          {!editing && (
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 16, padding: 16 }}>
              <MiraAvatar size={48} />
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#F59E0B', margin: '0 0 6px 0' }}>
                  {listening ? 'MIRA IS LISTENING' : 'MIRA, YOUR PERSONAL COACH'}
                </p>
                <p style={{ fontSize: 14, lineHeight: 1.55, color: '#e4d5b0', margin: 0 }}>
                  {listening
                    ? 'What do you sell, who do you pitch to, and what do you want from the call?'
                    : 'Tell me what you sell, who you pitch to and what you want from the call. I will play the buyer.'}
                </p>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="pitch-box" style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: listening ? '#3B82F6' : '#A1A1AA', marginBottom: 8 }}>
              {listening ? 'LISTENING...' : 'DESCRIBE YOUR PITCH'}
            </label>
            <div style={{ position: 'relative', background: '#1A1A1E', border: listening ? '2px solid #3B82F6' : '1px solid rgba(255,255,255,0.12)', borderRadius: 14 }}>
              <textarea
                id="pitch-box"
                value={text}
                onChange={(e) => { setText(e.target.value); setParsed(null) }}
                placeholder="e.g. CRM software for dental clinics, pitching to clinic owners. I want them to book a demo."
                maxLength={600}
                rows={5}
                style={{ width: '100%', boxSizing: 'border-box', background: 'transparent', border: 'none', outline: 'none', resize: 'none', color: '#fff', fontSize: 15, lineHeight: 1.5, fontFamily: 'inherit', padding: '16px 16px 72px 16px' }}
              />
              {SR && (
                <button
                  onClick={listening ? stopListening : startListening}
                  aria-label={listening ? 'Stop listening' : 'Speak your pitch description'}
                  style={{ position: 'absolute', right: 12, bottom: 12, width: 52, height: 52, borderRadius: '50%', border: 'none', cursor: 'pointer', background: listening ? '#DC2626' : '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {listening ? (
                    <span style={{ width: 16, height: 16, borderRadius: 3, background: '#fff', display: 'block' }} />
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{MIC_PATH}</svg>
                  )}
                </button>
              )}
            </div>
            <p style={{ fontSize: 12, color: '#A1A1AA', margin: '8px 0 0 0' }}>
              {listening ? 'Tap the red button when you are done.' : SR ? 'Type it, or tap the mic and say it.' : 'Type it in your own words.'}
            </p>
            {notice && <p style={{ fontSize: 12, color: '#FCA5A5', margin: '6px 0 0 0' }}>{notice}</p>}
          </div>

          {parsed && parsedFor === text.trim() && !listening && (
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 16, padding: 16 }}>
              <MiraAvatar size={44} />
              <div style={{ flexGrow: 1 }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#F59E0B', margin: '0 0 8px 0' }}>MIRA UNDERSTOOD</p>
                <div style={{ fontSize: 14, lineHeight: 1.5, color: '#e4d5b0', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div><span style={{ color: '#A1A1AA' }}>You sell</span> {parsed.product}</div>
                  <div><span style={{ color: '#A1A1AA' }}>To</span> {parsed.buyer || 'not said'}</div>
                  <div><span style={{ color: '#A1A1AA' }}>Goal</span> {parsed.goal || 'get the buyer to agree to a next step'}</div>
                </div>
                <p style={{ fontSize: 12, color: '#A1A1AA', margin: '8px 0 0 0' }}>Wrong? Edit the text or tap the mic again.</p>
              </div>
            </div>
          )}
          {busy && <p style={{ fontSize: 13, color: '#F59E0B', margin: 0 }}>Mira is reading it...</p>}

          <div style={{ flexGrow: 1 }} />

          {outOfSessions && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#FCA5A5' }}>
              You have used all your free pitches this month.{' '}
              <button onClick={() => navigate('/upgrade')} style={{ color: '#3B82F6', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Upgrade to Pro</button>
            </div>
          )}

          <button
            onClick={handleStart}
            disabled={!canStart || busy}
            style={{ width: '100%', background: '#2563EB', color: '#fff', fontWeight: 700, fontSize: 16, padding: 17, borderRadius: 12, border: 'none', cursor: canStart && !busy ? 'pointer' : 'not-allowed', opacity: canStart && !busy ? 1 : 0.45, fontFamily: 'inherit' }}
          >
            Start pitch
          </button>
          {editing && (
            <button onClick={() => { setEditing(false); setText(''); setParsed(null) }} style={{ background: 'none', border: 'none', color: '#A1A1AA', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', padding: 8 }}>
              Cancel
            </button>
          )}
        </div>
      )}

      <BottomNav active="practice" />
    </div>
  )
}
