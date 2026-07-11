import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import SetupPage from './pages/SetupPage'
import InstructionsPage from './pages/InstructionsPage'
import PermissionsPage from './pages/PermissionsPage'
import PositionPage from './pages/PositionPage'
import RecordingPage from './pages/RecordingPage'
import GradingPage from './pages/GradingPage'
import ResultsPage from './pages/ResultsPage'
import UpgradePage from './pages/UpgradePage'
import HistoryPage from './pages/HistoryPage'
import { AffiliatePage, FeedbackPage } from './pages/AffiliateFeedbackPages'
import MiraEditPage from './pages/MiraEditPage'
import OnboardingPage from './pages/OnboardingPage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const email = useAuthStore((s) => s.email)
  return email ? <>{children}</> : <Navigate to="/" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/setup" element={<RequireAuth><SetupPage /></RequireAuth>} />
        <Route path="/instructions" element={<RequireAuth><InstructionsPage /></RequireAuth>} />
        <Route path="/permissions" element={<RequireAuth><PermissionsPage /></RequireAuth>} />
        <Route path="/position" element={<RequireAuth><PositionPage /></RequireAuth>} />
        <Route path="/recording" element={<RequireAuth><RecordingPage /></RequireAuth>} />
        <Route path="/grading" element={<RequireAuth><GradingPage /></RequireAuth>} />
        <Route path="/results" element={<RequireAuth><ResultsPage /></RequireAuth>} />
        <Route path="/upgrade" element={<RequireAuth><UpgradePage /></RequireAuth>} />
        <Route path="/history" element={<RequireAuth><HistoryPage /></RequireAuth>} />
        <Route path="/affiliate" element={<RequireAuth><AffiliatePage /></RequireAuth>} />
        <Route path="/feedback" element={<RequireAuth><FeedbackPage /></RequireAuth>} />
        <Route path="/mira-edit" element={<RequireAuth><MiraEditPage /></RequireAuth>} />
        <Route path="/onboarding" element={<RequireAuth><OnboardingPage /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
