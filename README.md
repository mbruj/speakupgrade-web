# SpeakUPgrade Web PWA

Target: app.speakupgrade.com
Stack: React + Vite + TypeScript + Zustand + Tailwind CSS
Hosting: Vercel (free plan)
Backend: https://speakupgrade-production.up.railway.app (shared with Android app)

---

## Setup

```bash
# 1. Create the Vite project scaffold
npm create vite@latest speakupgrade-web -- --template react-ts
cd speakupgrade-web

# 2. Install dependencies
npm install react-router-dom zustand
npm install -D tailwindcss postcss autoprefixer

# 3. Copy all files from this scaffold into the project directory
#    Replace: src/, index.html, vite.config.ts, tsconfig.json,
#             tailwind.config.js, postcss.config.js, vercel.json, package.json

# 4. Start dev server
npm run dev
# Opens at http://localhost:3000
```

---

## File structure

```
speakupgrade-web/
├── index.html                  # PWA meta tags, font preloads
├── public/
│   └── manifest.json           # PWA manifest
├── src/
│   ├── main.tsx               # Entry point
│   ├── App.tsx                # Router + all routes
│   ├── index.css              # Global styles, design tokens
│   ├── lib/
│   │   ├── api.ts             # All backend API calls
│   │   ├── recorder.ts        # MediaRecorder + frame capture
│   │   └── constants.ts       # URLs, Stripe links, tips, labels
│   ├── store/
│   │   └── index.ts           # Zustand: useAuthStore, useSessionStore
│   ├── components/
│   │   ├── Logo.tsx
│   │   ├── ProgressRing.tsx
│   │   ├── FeatureGate.tsx
│   │   └── SpeechTimeline.tsx
│   └── pages/
│       ├── LoginPage.tsx
│       ├── SetupPage.tsx
│       ├── InstructionsPage.tsx
│       ├── PermissionsPage.tsx
│       ├── PositionPage.tsx
│       ├── RecordingPage.tsx
│       ├── GradingPage.tsx
│       ├── ResultsPage.tsx
│       ├── UpgradePage.tsx
│       ├── HistoryPage.tsx
│       └── AffiliateFeedbackPages.tsx
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
└── vercel.json                 # SPA routing for Vercel
```

---

## Deploy to Vercel

```bash
# Option A — Vercel CLI
npm install -g vercel
vercel

# Option B — GitHub
# Push to GitHub → connect repo in vercel.com → auto-deploys on push

# Build settings (auto-detected):
# Framework: Vite
# Build command: npm run build
# Output dir: dist
```

Set custom domain: app.speakupgrade.com in Vercel dashboard → Domains.

---

## Backend endpoints used

POST /auth/check          — Supabase-first login check
POST /grade-base64        — Main grading (audio + frames)
GET  /usage/plan?email=   — Session count + plan
POST /usage/increment     — Increment after session
POST /email-results       — Send results email via Resend
POST /feedback            — Store feedback
POST /affiliates/apply    — Affiliate application
GET  /sessions?email=     — Session history (Pro only — add this endpoint if missing)

---

## Known todos after scaffold

- [ ] Add icon-192.png and icon-512.png to /public for PWA icons
- [ ] Add favicon.ico to /public
- [ ] Test MediaRecorder compatibility on Safari (use audio/mp4 fallback if needed)
- [ ] Add /sessions?email= GET endpoint to backend for history page
- [ ] Voice coach (TTS) — use Web Speech API: window.speechSynthesis
- [ ] Fix Railway purple env vars (ANTHROPIC_API_KEY, RESEND_API_KEY) — delete and re-add as white
