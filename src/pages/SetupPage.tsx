import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, useSessionStore } from '../store'
import { checkUsage } from '../lib/api'
import { API_URL } from '../lib/constants'
import BottomNav from '../components/BottomNav'

const PITCH_KEY = 'sua_pitch'
const LAST_KEY = 'sua_last'
const CAMERA_KEY = 'sua_camera_on'
const DEFAULT_GOAL = 'Get the buyer to agree to a next step'

interface Parsed { product: string; buyer: string; goal: string }
interface SavedPitch { text: string; parsed: Parsed }
interface LastResult { label: string; score: number | null; fix: string }

function readJSON<T>(key: string): T | null {
  try {
    const v = localStorage.getItem(key)
    return v ? (JSON.parse(v) as T) : null
  } catch { return null }
}

function MiraAvatar({ size }: { size: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#3a2c10', border: '2px solid rgba(245,158,11,0.5)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.42, fontWeight: 700, color: '#F59E0B' }}>
      M
    </div>
  )
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
  const [text, setText] = useState('')
  const [parsed, setParsed] = useState<Parsed | null>(null)
  const [parsedFor, setParsedFor] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')

  const [cameraOn, setCameraOn] = useState(() => {
    try { return localStorage.getItem(CAMERA_KEY) !== '0' } catch { return true }
  })

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

  const toggleCamera = () => {
    const next = !cameraOn
    setCameraOn(next)
    try { localStorage.setItem(CAMERA_KEY, next ? '1' : '0') } catch {}
  }

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

  const canStart = isRepeat ? canRecord : (text.trim().length > 3 && canRecord)

  return (
    <div style={{ minHeight: '100dvh', background: '#09090B', display: 'flex', flexDirection: 'column', padding: '28px 20px 110px', maxWidth: 480, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.3px', color: '#fff' }}>
          <span style={{ color: '#3B82F6' }}>SPEAKUP</span>GRADE
        </div>
        {oneLeft && (
          <div style={{ fontSize: 11, fontWeight: 600, color: '#F59E0B', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 20, padding: '5px 11px' }}>
            1 free pitch left
          </div>
        )}
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
        /* ---------- From pitch 2: no typing ---------- */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, flexGrow: 1 }}>
          <div style={{ background: '#1A1A1E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 18, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#A1A1AA', margin: '0 0 6px 0' }}>YOU ARE PITCHING</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#fff', lineHeight: 1.3, margin: '0 0 6px 0' }}>{saved.parsed.product}</p>
              {saved.parsed.buyer && <p style={{ fontSize: 14, color: '#A1A1AA', margin: '0 0 4px 0' }}>to {saved.parsed.buyer}</p>}
              {saved.parsed.goal && <p style={{ fontSize: 13, color: '#8B8B94', margin: 0 }}>Goal: {saved.parsed.goal}</p>}
            </div>
            <button onClick={startEdit} style={{ background: 'none', border: 'none', color: '#3B82F6', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', padding: '12px 4px' }}>
              Edit
            </button>
          </div>

          <div style={{ flexGrow: 1 }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1A1A1E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '10px 14px', minHeight: 44 }}>
            <span style={{ fontSize: 13, color: '#d4d4d8' }}>Camera on while I pitch</span>
            <button
              onClick={toggleCamera} role="switch" aria-checked={cameraOn} aria-label="Camera on while I pitch"
              style={{ width: 44, height: 26, borderRadius: 13, background: cameraOn ? '#2563EB' : '#3f3f46', border: 'none', position: 'relative', cursor: 'pointer' }}
            >
              <span style={{ position: 'absolute', top: 3, left: cameraOn ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.15s' }} />
            </button>
          </div>

          {outOfSessions && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#FCA5A5' }}>
              You have used all your free pitches this month.{' '}
              <button onClick={() => navigate('/upgrade')} style={{ color: '#3B82F6', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Upgrade to Pro</button>
            </div>
          )}

          <button
            onClick={handleStart}
            disabled={!canStart}
            style={{ width: '100%', background: '#2563EB', color: '#fff', fontWeight: 700, fontSize: 16, padding: 17, borderRadius: 12, border: 'none', cursor: canStart ? 'pointer' : 'not-allowed', opacity: canStart ? 1 : 0.45, fontFamily: 'inherit' }}
          >
            Start pitch
          </button>

          {last && (
            <p style={{ fontSize: 12.5, color: '#A1A1AA', textAlign: 'center', lineHeight: 1.5, margin: 0 }}>
              Last: {last.label}{last.score !== null ? `, ${last.score}` : ''}.{last.fix ? ` Fix next: ${last.fix}` : ''}
            </p>
          )}
        </div>
      ) : (
        /* ---------- First run / editing: one box, type or speak ---------- */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, flexGrow: 1 }}>
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
