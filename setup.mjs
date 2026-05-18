import { writeFileSync, mkdirSync } from 'fs'
import { dirname } from 'path'

const files = {}

files['src/components/Logo.tsx'] = `
interface LogoProps { size?: 'sm' | 'md' | 'lg' }
const sizes = { sm: 'text-lg', md: 'text-2xl', lg: 'text-3xl' }
export function Logo({ size = 'md' }: LogoProps) {
  return (
    <span className={\`font-bold tracking-tight \${sizes[size]}\`}>
      <span style={{ color: '#3B82F6' }}>SPEAKUP</span>
      <span style={{ color: '#ffffff' }}>GRADE</span>
    </span>
  )
}
`.trim()

files['src/components/ProgressRing.tsx'] = `
interface ProgressRingProps { score: number; size?: number; strokeWidth?: number; label?: string }
function scoreColor(score: number): string {
  if (score >= 80) return '#22C55E'
  if (score >= 60) return '#3B82F6'
  if (score >= 40) return '#F59E0B'
  return '#EF4444'
}
export function ProgressRing({ score, size = 80, strokeWidth = 6, label }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = scoreColor(score)
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth} />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
          style={{ transform: 'rotate(90deg)', transformOrigin: 'center', fill: color,
            fontSize: size * 0.22, fontWeight: 600, fontFamily: 'Inter' }}>
          {score}
        </text>
      </svg>
      {label && <span style={{ fontSize: 11, color: '#A1A1AA', textAlign: 'center', lineHeight: 1.3 }}>{label}</span>}
    </div>
  )
}
`.trim()

files['src/components/FeatureGate.tsx'] = `
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store'
interface FeatureGateProps { children: React.ReactNode; label?: string }
export function FeatureGate({ children, label = 'Unlock with Pro' }: FeatureGateProps) {
  const plan = useAuthStore((s) => s.plan)
  const navigate = useNavigate()
  if (plan === 'pro') return <>{children}</>
  return (
    <div className="relative">
      <div style={{ filter: 'blur(5px)', userSelect: 'none', pointerEvents: 'none' }}>{children}</div>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <button onClick={() => navigate('/upgrade')}
          style={{ background: '#3B82F6', color: '#fff', fontWeight: 600, fontSize: 13,
            padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer' }}>
          {label}
        </button>
      </div>
    </div>
  )
}
`.trim()

files['src/components/SpeechTimeline.tsx'] = `
import { useAuthStore } from '../store'
import { FeatureGate } from './FeatureGate'
interface SpeechTimelineProps { actualSeconds: number; pauses: number[]; wpm: number }
export function SpeechTimeline({ actualSeconds, pauses, wpm }: SpeechTimelineProps) {
  const plan = useAuthStore((s) => s.plan)
  const isPro = plan === 'pro'
  const width = 360; const height = 64
  const barCount = Math.min(actualSeconds, 60)
  const bars = Array.from({ length: barCount }, (_, i) => {
    const t = i / barCount
    const base = 0.3 + 0.5 * Math.sin(t * Math.PI)
    return Math.max(0.05, Math.min(1, base + (Math.random() - 0.5) * 0.3))
  })
  const pausePositions = pauses.map((p) => (p / actualSeconds) * width)
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: '#A1A1AA' }}>Speech timeline</span>
        <span style={{ fontSize: 12, color: '#A1A1AA' }}>{wpm} wpm</span>
      </div>
      <div style={{ background: '#1A1A1E', borderRadius: 12, padding: '12px 16px',
        border: '1px solid rgba(255,255,255,0.06)', position: 'relative' }}>
        <svg width="100%" viewBox={\`0 0 \${width} \${height}\`} preserveAspectRatio="none">
          {bars.map((h, i) => {
            const x = (i / barCount) * width; const barH = h * (height - 8); const y = (height - barH) / 2
            return <rect key={i} x={x} y={y} width={Math.max(1, width / barCount - 1)} height={barH}
              rx={1} fill="#3B82F6" opacity={0.6 + h * 0.4} />
          })}
          {isPro && pausePositions.map((x, i) => (
            <line key={i} x1={x} y1={0} x2={x} y2={height} stroke="#F59E0B" strokeWidth={1.5} strokeDasharray="3,3" />
          ))}
        </svg>
        {!isPro && <FeatureGate label="Unlock pause markers"><div style={{ height: 20 }} /></FeatureGate>}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        <span style={{ fontSize: 11, color: '#52525B' }}>0:00</span>
        <span style={{ fontSize: 11, color: '#52525B' }}>
          {Math.floor(actualSeconds / 60)}:{String(actualSeconds % 60).padStart(2, '0')}
        </span>
      </div>
    </div>
  )
}
`.trim()

files['src/pages/InstructionsPage.tsx'] = `
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { useSessionStore } from '../store'
const STEPS = [
  { icon: '📍', title: 'Set up your space', body: 'Find a quiet spot with good lighting. Place your device so your face and upper body are visible.' },
  { icon: '🎤', title: 'Speak naturally', body: 'Talk as if you are presenting for real. Pausing is fine — it is better than filler words.' },
  { icon: '👀', title: 'Look at the camera', body: 'Eye contact matters. Look into the lens, not at your own face on screen.' },
  { icon: '✅', title: 'Stop when done', body: 'Hit stop whenever you finish. The app will analyse your audio and video automatically.' },
]
export default function InstructionsPage() {
  const navigate = useNavigate()
  const { setHideInstructions } = useSessionStore()
  const [step, setStep] = useState(0)
  const [dontShow, setDontShow] = useState(false)
  const isLast = step === STEPS.length - 1
  const handleNext = () => {
    if (isLast) { if (dontShow) setHideInstructions(true); navigate('/permissions') }
    else setStep((s) => s + 1)
  }
  const current = STEPS[step]
  return (
    <div className="page">
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 48 }}><Logo size="sm" /></div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 40 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ width: i === step ? 20 : 6, height: 6, borderRadius: 3,
              background: i === step ? '#3B82F6' : 'rgba(255,255,255,0.15)', transition: 'all 0.25s ease' }} />
          ))}
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '40px 28px', marginBottom: 24 }} key={step}>
          <div style={{ fontSize: 52, marginBottom: 20 }}>{current.icon}</div>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>{current.title}</h2>
          <p style={{ fontSize: 15, color: '#A1A1AA', lineHeight: 1.7 }}>{current.body}</p>
        </div>
        {isLast && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, cursor: 'pointer', justifyContent: 'center' }}>
            <input type="checkbox" checked={dontShow} onChange={(e) => setDontShow(e.target.checked)} style={{ width: 'auto', accentColor: '#3B82F6' }} />
            <span style={{ fontSize: 13, color: '#A1A1AA' }}>Don't show again</span>
          </label>
        )}
        <button className="btn-primary" onClick={handleNext}>{isLast ? 'Got it' : 'Next'}</button>
        {step > 0 && <button className="btn-ghost" style={{ marginTop: 10 }} onClick={() => setStep((s) => s - 1)}>Back</button>}
      </div>
    </div>
  )
}
`.trim()

files['src/pages/PermissionsPage.tsx'] = `
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo } from '../components/Logo'
export default function PermissionsPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'idle' | 'requesting' | 'denied' | 'granted'>('idle')
  const requestPermissions = async () => {
    setStatus('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      stream.getTracks().forEach((t) => t.stop())
      setStatus('granted')
      setTimeout(() => navigate('/position'), 600)
    } catch { setStatus('denied') }
  }
  return (
    <div className="page">
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 48 }}><Logo size="sm" /></div>
        <div className="card" style={{ textAlign: 'center', padding: '40px 28px', marginBottom: 24 }}>
          {status === 'granted' ? (
            <><div style={{ fontSize: 52, marginBottom: 16 }}>✅</div><h2 style={{ fontSize: 20, fontWeight: 600 }}>Permissions granted</h2><p style={{ color: '#A1A1AA', marginTop: 10, fontSize: 14 }}>Setting up camera...</p></>
          ) : status === 'denied' ? (
            <><div style={{ fontSize: 52, marginBottom: 16 }}>🔒</div><h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Access blocked</h2><p style={{ color: '#A1A1AA', fontSize: 14, lineHeight: 1.7 }}>Camera and microphone access was denied. Please enable them in your browser settings and refresh the page.</p></>
          ) : (
            <><div style={{ fontSize: 52, marginBottom: 16 }}>🎙️</div><h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Camera & microphone</h2><p style={{ color: '#A1A1AA', fontSize: 14, lineHeight: 1.7 }}>SpeakUPgrade needs access to your camera and microphone to analyse your speech and body language. Your recordings are never stored or shared.</p></>
          )}
        </div>
        {status !== 'granted' && status !== 'denied' && (
          <button className="btn-primary" onClick={requestPermissions} disabled={status === 'requesting'}>
            {status === 'requesting' ? 'Requesting...' : 'Allow camera & mic'}
          </button>
        )}
        {status === 'denied' && <button className="btn-ghost" onClick={() => window.location.reload()}>Refresh page</button>}
      </div>
    </div>
  )
}
`.trim()

files['src/pages/PositionPage.tsx'] = `
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
export default function PositionPage() {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [facing, setFacing] = useState<'user' | 'environment'>('user')
  const [countdown, setCountdown] = useState<number | null>(null)
  const [ready, setReady] = useState(false)
  useEffect(() => { startCamera(facing); return () => { streamRef.current?.getTracks().forEach((t) => t.stop()) } }, [])
  const startCamera = async (facingMode: 'user' | 'environment') => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode, width: { ideal: 640 }, height: { ideal: 480 } }, audio: false })
    streamRef.current = stream
    if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.muted = true; videoRef.current.play() }
    setReady(true)
  }
  const switchCamera = async () => { const next = facing === 'user' ? 'environment' : 'user'; setFacing(next); await startCamera(next) }
  const startCountdown = () => {
    setCountdown(10)
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) { clearInterval(timer); streamRef.current?.getTracks().forEach((t) => t.stop()); navigate('/recording', { state: { facing } }); return null }
        return prev - 1
      })
    }, 1000)
  }
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <video ref={videoRef} playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: facing === 'user' ? 'scaleX(-1)' : 'none' }} />
      {countdown !== null && <div style={{ position: 'absolute', fontSize: 80, fontWeight: 700, color: '#fff', textShadow: '0 2px 20px rgba(0,0,0,0.8)' }}>{countdown}</div>}
      {countdown === null && (
        <div style={{ position: 'absolute', bottom: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%', padding: '0 24px' }}>
          <button onClick={startCountdown} disabled={!ready} style={{ background: '#3B82F6', color: '#fff', fontWeight: 700, fontSize: 16, padding: '16px 40px', borderRadius: 50, border: 'none', cursor: 'pointer', opacity: ready ? 1 : 0.5 }}>I'm ready</button>
          <button onClick={switchCamera} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 13, padding: '10px 20px', borderRadius: 50, border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' }}>Switch camera</button>
        </div>
      )}
    </div>
  )
}
`.trim()

files['src/pages/UpgradePage.tsx'] = `
import { useNavigate } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { STRIPE_ANNUAL, STRIPE_MONTHLY, STRIPE_PORTAL } from '../lib/constants'
import { useAuthStore } from '../store'
const PRO_FEATURES = ['Unlimited sessions','Full written feedback on every score','All improvement bullets','Weak language detection','Interactive speech timeline with pause markers','Session history and trends']
export default function UpgradePage() {
  const navigate = useNavigate()
  const plan = useAuthStore((s) => s.plan)
  if (plan === 'pro') {
    return (
      <div className="page"><div className="container" style={{ textAlign: 'center' }}>
        <Logo size="sm" />
        <div style={{ marginTop: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>You're on Pro</h2>
          <p style={{ color: '#A1A1AA', fontSize: 14, marginBottom: 28 }}>All features unlocked.</p>
          <a href={STRIPE_PORTAL} target="_blank" rel="noreferrer" style={{ display: 'block', textAlign: 'center', color: '#A1A1AA', fontSize: 13, marginBottom: 24 }}>Manage subscription</a>
          <button className="btn-ghost" onClick={() => navigate('/setup')}>Back</button>
        </div>
      </div></div>
    )
  }
  return (
    <div className="page-top"><div className="container" style={{ paddingBottom: 48 }}>
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A1A1AA', fontSize: 13, marginBottom: 32 }}>← Back</button>
      <div style={{ textAlign: 'center', marginBottom: 32 }}><Logo size="md" /><p style={{ color: '#A1A1AA', marginTop: 8, fontSize: 15 }}>Unlock everything</p></div>
      <a href={STRIPE_ANNUAL} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
        <div className="card" style={{ marginBottom: 14, borderColor: '#3B82F6', borderWidth: 1.5, cursor: 'pointer', position: 'relative' }}>
          <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#3B82F6', color: '#fff', fontSize: 11, fontWeight: 600, padding: '3px 14px', borderRadius: 20, whiteSpace: 'nowrap' }}>2 MONTHS FREE</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <div><p style={{ fontWeight: 700, fontSize: 16 }}>Annual</p><p style={{ color: '#A1A1AA', fontSize: 12, marginTop: 2 }}>€8.33 / month, billed yearly</p></div>
            <div style={{ textAlign: 'right' }}><p style={{ fontWeight: 700, fontSize: 20, color: '#3B82F6' }}>€99.99</p><p style={{ color: '#52525B', fontSize: 11, textDecoration: 'line-through' }}>€119.88</p></div>
          </div>
        </div>
      </a>
      <a href={STRIPE_MONTHLY} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
        <div className="card" style={{ marginBottom: 28, cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><p style={{ fontWeight: 700, fontSize: 16 }}>Monthly</p><p style={{ color: '#A1A1AA', fontSize: 12, marginTop: 2 }}>Cancel anytime</p></div>
            <p style={{ fontWeight: 700, fontSize: 20 }}>€9.99<span style={{ fontSize: 12, fontWeight: 400, color: '#A1A1AA' }}>/mo</span></p>
          </div>
        </div>
      </a>
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#A1A1AA', letterSpacing: '0.08em', marginBottom: 14 }}>EVERYTHING IN PRO</div>
        {PRO_FEATURES.map((f) => (<div key={f} style={{ display: 'flex', gap: 10, marginBottom: 10 }}><span style={{ color: '#22C55E' }}>✓</span><span style={{ fontSize: 14, color: '#ffffff' }}>{f}</span></div>))}
      </div>
      <p style={{ fontSize: 11, color: '#52525B', textAlign: 'center', lineHeight: 1.6 }}>Secure payment via Stripe. Cancel anytime.</p>
    </div></div>
  )
}
`.trim()

files['src/pages/HistoryPage.tsx'] = `
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { useAuthStore } from '../store'
import { API_URL } from '../lib/constants'
interface Session { id: string; created_at: string; topic: string; score_overall: number; actual_seconds: number }
export default function HistoryPage() {
  const navigate = useNavigate()
  const { email, plan } = useAuthStore()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!email) { navigate('/'); return }
    if (plan !== 'pro') { setLoading(false); return }
    fetch(\`\${API_URL}/sessions?email=\${encodeURIComponent(email)}\`)
      .then((r) => r.json()).then((data) => setSessions(data.sessions ?? [])).catch(console.error).finally(() => setLoading(false))
  }, [email, plan])
  const isPro = plan === 'pro'
  return (
    <div className="page-top"><div className="container" style={{ paddingBottom: 48 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <button onClick={() => navigate('/setup')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A1A1AA', fontSize: 22 }}>←</button>
        <Logo size="sm" />
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Session history</h1>
      <p style={{ color: '#A1A1AA', fontSize: 14, marginBottom: 24 }}>{isPro ? 'All your past sessions' : 'Track your progress over time'}</p>
      {!isPro && (
        <>
          <div style={{ filter: 'blur(4px)', userSelect: 'none', pointerEvents: 'none', marginBottom: 24 }}>
            {[85,72,91,68,78].map((score, i) => (
              <div key={i} className="card" style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
                <div><p style={{ fontWeight: 500 }}>Investor pitch deck</p><p style={{ color: '#A1A1AA', fontSize: 12, marginTop: 4 }}>3 min · 2 days ago</p></div>
                <span style={{ fontWeight: 700, fontSize: 20, color: '#22C55E' }}>{score}</span>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#A1A1AA', fontSize: 14, marginBottom: 20 }}>Session history is a Pro feature.</p>
            <button className="btn-primary" onClick={() => navigate('/upgrade')}>Upgrade to Pro</button>
          </div>
        </>
      )}
      {isPro && loading && <p style={{ color: '#A1A1AA', textAlign: 'center' }}>Loading...</p>}
      {isPro && !loading && sessions.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 32 }}>
          <p style={{ color: '#A1A1AA' }}>No sessions yet. Record your first speech!</p>
          <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/setup')}>Start recording</button>
        </div>
      )}
      {isPro && !loading && sessions.map((s) => (
        <div key={s.id} className="card" style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><p style={{ fontWeight: 500, fontSize: 14 }}>{s.topic}</p><p style={{ color: '#A1A1AA', fontSize: 12, marginTop: 4 }}>{Math.round(s.actual_seconds/60)} min · {new Date(s.created_at).toLocaleDateString('en-GB')}</p></div>
          <span style={{ fontWeight: 700, fontSize: 22, color: s.score_overall >= 80 ? '#22C55E' : s.score_overall >= 60 ? '#3B82F6' : '#F59E0B' }}>{s.score_overall}</span>
        </div>
      ))}
    </div></div>
  )
}
`.trim()

files['src/pages/AffiliateFeedbackPages.tsx'] = `
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { applyAffiliate, submitFeedback } from '../lib/api'
import { useAuthStore } from '../store'

export function AffiliatePage() {
  const navigate = useNavigate()
  const { email } = useAuthStore()
  const [name, setName] = useState('')
  const [appEmail, setAppEmail] = useState(email ?? '')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !appEmail.trim()) return
    setLoading(true)
    try { await applyAffiliate(name.trim(), appEmail.trim().toLowerCase()); setSent(true) }
    catch (err) { console.error(err) } finally { setLoading(false) }
  }
  return (
    <div className="page"><div className="container">
      <div style={{ textAlign: 'center', marginBottom: 36 }}><Logo size="sm" /></div>
      {sent ? (
        <div className="card" style={{ textAlign: 'center', padding: 36 }}>
          <div style={{ fontSize: 44, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 10 }}>Application received</h2>
          <p style={{ color: '#A1A1AA', fontSize: 14, lineHeight: 1.7 }}>We'll review and send your affiliate code to {appEmail} within 24 hours.</p>
          <button className="btn-ghost" style={{ marginTop: 20 }} onClick={() => navigate('/setup')}>Back to app</button>
        </div>
      ) : (
        <>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Become an affiliate</h1>
          <p style={{ color: '#A1A1AA', fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>Earn 50% recurring commission for every paying user you refer.</p>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}><label style={{ fontSize: 12, color: '#A1A1AA', display: 'block', marginBottom: 6 }}>Your name</label><input type="text" placeholder="First and last name" value={name} onChange={(e) => setName(e.target.value)} required /></div>
            <div style={{ marginBottom: 24 }}><label style={{ fontSize: 12, color: '#A1A1AA', display: 'block', marginBottom: 6 }}>Email</label><input type="email" placeholder="your@email.com" value={appEmail} onChange={(e) => setAppEmail(e.target.value)} required /></div>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Submitting...' : 'Apply'}</button>
          </form>
          <button className="btn-ghost" style={{ marginTop: 12 }} onClick={() => navigate('/setup')}>Cancel</button>
        </>
      )}
    </div></div>
  )
}

export function FeedbackPage() {
  const navigate = useNavigate()
  const { email } = useAuthStore()
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !email) return
    setLoading(true)
    try { await submitFeedback(email, message.trim()); setSent(true) }
    catch (err) { console.error(err) } finally { setLoading(false) }
  }
  return (
    <div className="page"><div className="container">
      <div style={{ textAlign: 'center', marginBottom: 36 }}><Logo size="sm" /></div>
      {sent ? (
        <div className="card" style={{ textAlign: 'center', padding: 36 }}>
          <div style={{ fontSize: 44, marginBottom: 16 }}>🙏</div>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 10 }}>Thanks for the feedback</h2>
          <p style={{ color: '#A1A1AA', fontSize: 14 }}>This genuinely helps.</p>
          <button className="btn-ghost" style={{ marginTop: 20 }} onClick={() => navigate('/setup')}>Back</button>
        </div>
      ) : (
        <>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Send feedback</h1>
          <p style={{ color: '#A1A1AA', fontSize: 14, marginBottom: 24 }}>What's working. What's broken. What you want.</p>
          <form onSubmit={handleSubmit}>
            <textarea rows={6} placeholder="Your feedback..." value={message} onChange={(e) => setMessage(e.target.value)} style={{ marginBottom: 16, resize: 'vertical' }} required />
            <button type="submit" className="btn-primary" disabled={loading || !message.trim()}>{loading ? 'Sending...' : 'Send feedback'}</button>
          </form>
          <button className="btn-ghost" style={{ marginTop: 12 }} onClick={() => navigate('/setup')}>Cancel</button>
        </>
      )}
    </div></div>
  )
}
`.trim()

// Write all files
for (const [filePath, content] of Object.entries(files)) {
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, content, 'utf8')
  console.log('✓', filePath)
}

console.log('\nAll files written. Run: npm run dev')
