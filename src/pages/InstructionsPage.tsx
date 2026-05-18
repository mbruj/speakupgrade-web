import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '../store'

const SVG_PROPS = {
  width: '100%' as const,
  viewBox: '0 0 320 195',
  fill: 'none' as const,
  xmlns: 'http://www.w3.org/2000/svg',
  style: { display: 'block' as const },
}

const GROUND_Y = 185

// Ground line
const Ground = () => (
  <line x1="10" y1={GROUND_Y} x2="310" y2={GROUND_Y} stroke="#374151" strokeWidth="1.5" strokeLinecap="round" />
)

// Full robot person — feet (bottom of shins) at y=GROUND_Y
// Layout from bottom up: shins 32px, thighs 20px, torso 30px, gap 2px, head r=13
// head center = GROUND_Y - 32 - 20 - 30 - 2 - 13 = GROUND_Y - 97
function Person({ cx }: { cx: number }) {
  const base = GROUND_Y // 185
  return (
    <g transform={`translate(${cx}, 0)`}>
      {/* Head */}
      <circle cx="0" cy={base - 97} r="13" stroke="#3B82F6" strokeWidth="2.5" fill="none" />
      {/* Torso: top = base-97+13+2 = base-82, bottom = base-52 */}
      <rect x="-10" y={base - 82} width="20" height="30" rx="3" stroke="#3B82F6" strokeWidth="2.5" fill="none" />
      {/* Left arm */}
      <rect x="-22" y={base - 80} width="12" height="22" rx="3" stroke="#3B82F6" strokeWidth="2.5" fill="none" />
      {/* Right arm */}
      <rect x="10" y={base - 80} width="12" height="22" rx="3" stroke="#3B82F6" strokeWidth="2.5" fill="none" />
      {/* Left thigh: top=base-52, bottom=base-32 */}
      <rect x="-10" y={base - 52} width="8" height="20" rx="3" stroke="#3B82F6" strokeWidth="2.5" fill="none" />
      {/* Right thigh */}
      <rect x="2" y={base - 52} width="8" height="20" rx="3" stroke="#3B82F6" strokeWidth="2.5" fill="none" />
      {/* Left shin: top=base-32, bottom=base */}
      <rect x="-10" y={base - 32} width="8" height="32" rx="3" stroke="#3B82F6" strokeWidth="2.5" fill="none" />
      {/* Right shin */}
      <rect x="2" y={base - 32} width="8" height="32" rx="3" stroke="#3B82F6" strokeWidth="2.5" fill="none" />
    </g>
  )
}

// Phone on tripod — all child content is in local coords where (0,0) = phone horizontal center
// Phone: top=0, bottom=105, screen inside: top=7, bottom=90
// Tripod feet land at GROUND_Y
// We position the group so tripod feet = GROUND_Y
// stem starts at phone bottom (local y=105), goes to y=130, legs go to y=155 (local)
// group translateY = GROUND_Y - 155 = 30
const PHONE_GROUP_Y = 30

function PhoneTripod({ cx, children }: { cx: number; children?: React.ReactNode }) {
  return (
    <g transform={`translate(${cx}, ${PHONE_GROUP_Y})`}>
      {/* Phone body */}
      <rect x="-28" y="0" width="56" height="105" rx="8" stroke="#3B82F6" strokeWidth="3" fill="#111113" />
      {/* Screen area: x=-22..22, y=7..90 */}
      <rect x="-22" y="7" width="44" height="83" rx="4" fill="#1A1A1E" />
      {/* Camera dot */}
      <circle cx="0" cy="-4" r="3" fill="#3B82F6" />
      {/* Home bar */}
      <rect x="-8" y="98" width="16" height="4" rx="2" fill="#3B82F6" opacity="0.4" />
      {/* Children rendered inside screen coordinates */}
      {children}
      {/* Tripod stem: phone bottom=105, stem end=130 */}
      <line x1="0" y1="105" x2="0" y2="130" stroke="#6B7280" strokeWidth="3" strokeLinecap="round" />
      {/* Tripod legs: from y=130 to y=155 (which = GROUND_Y in SVG coords) */}
      <line x1="0" y1="130" x2="-38" y2="155" stroke="#6B7280" strokeWidth="3" strokeLinecap="round" />
      <line x1="0" y1="130" x2="0" y2="155" stroke="#6B7280" strokeWidth="3" strokeLinecap="round" />
      <line x1="0" y1="130" x2="38" y2="155" stroke="#6B7280" strokeWidth="3" strokeLinecap="round" />
    </g>
  )
}

// Mini person inside phone screen — local coords relative to phone center (0,0)
// Screen goes from y=7 to y=90. Mini person feet at y=88.
// Mini person height: shins 12px, thighs 10px, torso 14px, gap 1px, head r=6
// head center = 88 - 12 - 10 - 14 - 1 - 6 = 45
function MiniPerson() {
  const feet = 88
  return (
    <g>
      {/* Head */}
      <circle cx="0" cy={feet - 43} r="6" stroke="#3B82F6" strokeWidth="1.5" fill="none" />
      {/* Torso: top=feet-36, bottom=feet-22 */}
      <rect x="-5" y={feet - 36} width="10" height="14" rx="2" stroke="#3B82F6" strokeWidth="1.5" fill="none" />
      {/* Arms */}
      <rect x="-10" y={feet - 35} width="5" height="10" rx="1.5" stroke="#3B82F6" strokeWidth="1.5" fill="none" />
      <rect x="5" y={feet - 35} width="5" height="10" rx="1.5" stroke="#3B82F6" strokeWidth="1.5" fill="none" />
      {/* Thighs: top=feet-22, bottom=feet-12 */}
      <rect x="-5" y={feet - 22} width="4" height="10" rx="1.5" stroke="#3B82F6" strokeWidth="1.5" fill="none" />
      <rect x="1" y={feet - 22} width="4" height="10" rx="1.5" stroke="#3B82F6" strokeWidth="1.5" fill="none" />
      {/* Shins: top=feet-12, bottom=feet */}
      <rect x="-5" y={feet - 12} width="4" height="12" rx="1.5" stroke="#3B82F6" strokeWidth="1.5" fill="none" />
      <rect x="1" y={feet - 12} width="4" height="12" rx="1.5" stroke="#3B82F6" strokeWidth="1.5" fill="none" />
    </g>
  )
}

// ─── Step illustrations ───────────────────────────────────────────────────────

function Step1SVG() {
  return (
    <svg {...SVG_PROPS}>
      <PhoneTripod cx={160} />
      <Ground />
    </svg>
  )
}

function Step2SVG() {
  return (
    <svg {...SVG_PROPS}>
      <Person cx={82} />
      <PhoneTripod cx={228}>
        <MiniPerson />
      </PhoneTripod>
      <Ground />
    </svg>
  )
}

function Step3SVG() {
  // Countdown circle centered in screen area (screen y=7..90, center y=48)
  return (
    <svg {...SVG_PROPS}>
      <Person cx={82} />
      <PhoneTripod cx={228}>
        {/* Circle centered at phone-local (0, 48), radius 22 */}
        <circle cx="0" cy="48" r="22" stroke="#3B82F6" strokeWidth="2" fill="none" />
        <text x="0" y="55" textAnchor="middle" fill="#ffffff" fontSize={18} fontWeight={700} fontFamily="Inter, sans-serif">10</text>
      </PhoneTripod>
      <Ground />
    </svg>
  )
}

function Step4SVG() {
  // Mini person + stop button inside screen
  // Screen y=7..90. Stop button at y=78..92 (below feet of mini person at y=88... adjust mini up)
  // Move mini person up: feet at y=72 instead of 88
  const feet = 72
  return (
    <svg {...SVG_PROPS}>
      <Person cx={82} />
      <PhoneTripod cx={228}>
        {/* Mini person with feet at y=72 */}
        <g>
          <circle cx="0" cy={feet - 43} r="6" stroke="#3B82F6" strokeWidth="1.5" fill="none" />
          <rect x="-5" y={feet - 36} width="10" height="14" rx="2" stroke="#3B82F6" strokeWidth="1.5" fill="none" />
          <rect x="-10" y={feet - 35} width="5" height="10" rx="1.5" stroke="#3B82F6" strokeWidth="1.5" fill="none" />
          <rect x="5" y={feet - 35} width="5" height="10" rx="1.5" stroke="#3B82F6" strokeWidth="1.5" fill="none" />
          <rect x="-5" y={feet - 22} width="4" height="10" rx="1.5" stroke="#3B82F6" strokeWidth="1.5" fill="none" />
          <rect x="1" y={feet - 22} width="4" height="10" rx="1.5" stroke="#3B82F6" strokeWidth="1.5" fill="none" />
          <rect x="-5" y={feet - 12} width="4" height="12" rx="1.5" stroke="#3B82F6" strokeWidth="1.5" fill="none" />
          <rect x="1" y={feet - 12} width="4" height="12" rx="1.5" stroke="#3B82F6" strokeWidth="1.5" fill="none" />
        </g>
        {/* Stop button: centered horizontally, y=76..88 */}
        <rect x="-18" y="76" width="36" height="12" rx="3" fill="#EF4444" />
        <rect x="-14" y="79" width="6" height="6" rx="1" fill="#ffffff" />
        <text x="4" y="86" textAnchor="middle" fill="#ffffff" fontSize={7} fontFamily="Inter, sans-serif" fontWeight={600}>Stop</text>
      </PhoneTripod>
      <Ground />
    </svg>
  )
}

// ─── Steps data ───────────────────────────────────────────────────────────────

const STEPS = [
  {
    label: 'STEP 1 OF 4',
    title: 'Set up your device',
    body: 'Place your device on a tripod or stable surface. Hold it in any orientation. Make sure your full body will be visible in the frame.',
    illustration: <Step1SVG />,
  },
  {
    label: 'STEP 2 OF 4',
    title: 'Position yourself',
    body: 'Stand about 1.5–2 meters from the camera. You should be visible from head to toe.',
    illustration: <Step2SVG />,
  },
  {
    label: 'STEP 3 OF 4',
    title: '10-second countdown',
    body: 'After pressing Ready a countdown begins. Use that time to get into position.',
    illustration: <Step3SVG />,
  },
  {
    label: 'STEP 4 OF 4',
    title: 'Stop when done',
    body: 'Press the red Stop button on screen when you finish speaking. Analysis starts immediately.',
    illustration: <Step4SVG />,
  },
]

// ─── Page ────────────────────────────────────────────────────────────────────

export default function InstructionsPage() {
  const navigate = useNavigate()
  const { setHideInstructions } = useSessionStore()
  const [step, setStep] = useState(0)
  const [dontShow, setDontShow] = useState(false)

  const isLast = step === STEPS.length - 1
  const current = STEPS[step]

  const proceed = () => {
    if (dontShow) setHideInstructions(true)
    navigate('/permissions')
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#09090B', display: 'flex', flexDirection: 'column', padding: '20px 20px 36px', maxWidth: 480, margin: '0 auto' }}>

      {/* Illustration card */}
      <div style={{ background: '#1A1A1E', borderRadius: 16, padding: '20px 16px 12px', marginBottom: 24, border: '1px solid rgba(255,255,255,0.06)' }}>
        {current.illustration}
      </div>

      {/* Progress dots */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
        {STEPS.map((_, i) => (
          <div key={i} style={{ height: 8, width: i === step ? 28 : 8, borderRadius: 4, background: i === step ? '#3B82F6' : '#374151', transition: 'all 0.2s ease' }} />
        ))}
      </div>

      {/* Step label */}
      <p style={{ fontSize: 12, fontWeight: 700, color: '#3B82F6', letterSpacing: '0.1em', marginBottom: 8 }}>
        {current.label}
      </p>

      {/* Title */}
      <h2 style={{ fontSize: 26, fontWeight: 700, color: '#ffffff', marginBottom: 10, lineHeight: 1.25 }}>
        {current.title}
      </h2>

      {/* Body */}
      <p style={{ fontSize: 15, color: '#A1A1AA', lineHeight: 1.7, marginBottom: 24, flex: 1 }}>
        {current.body}
      </p>

      {/* Don't show again */}
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={dontShow}
          onChange={(e) => setDontShow(e.target.checked)}
          style={{ width: 18, height: 18, accentColor: '#3B82F6', cursor: 'pointer', flexShrink: 0 }}
        />
        <span style={{ fontSize: 14, color: '#A1A1AA' }}>Don't show this again</span>
      </label>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={() => step === 0 ? navigate('/setup') : setStep((s) => s - 1)}
          style={{ flex: 1, padding: '14px 8px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#A1A1AA', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Back
        </button>
        <button
          onClick={() => isLast ? proceed() : setStep((s) => s + 1)}
          style={{ flex: 2, padding: '14px 8px', borderRadius: 12, border: 'none', background: '#3B82F6', color: '#ffffff', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          {isLast ? 'Got it!' : 'Next'}
        </button>
        <button
          onClick={proceed}
          style={{ flex: 1, padding: '14px 8px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#52525B', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Skip
        </button>
      </div>
    </div>
  )
}
