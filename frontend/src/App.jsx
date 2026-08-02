import { Routes, Route, Navigate } from "react-router-dom"
import ProtectedRoute from "./shared/components/ProtectedRoute"
import Navbar from "./shared/components/Navbar"
import BottomNav from "./shared/components/BottomNav"
import LandingPage from "./features/landing/pages/LandingPage"
import AuthPage from "./features/auth/pages/AuthPage"
import CreateTeamPage from "./features/teams/pages/CreateTeamPage"
import TeamPage from "./features/teams/pages/TeamPage"
import ManagerSchedulePage from "./features/schedule/pages/ManagerSchedulePage"
import EmployeeSchedulePage from "./features/schedule/pages/EmployeeSchedulePage"
import RequestsPage from "./features/requests/pages/RequestsPage"
import { useAuth } from "./shared/context/AuthContext"
import { useMode } from "./shared/context/ModeContext"
import NotificationsPage from "./features/notifications/pages/NotificationsPage"

function Home() {
  const { membership } = useAuth()
  const { mode } = useMode()

  if (!membership) {
    return <CreateTeamPage />
  }

  return mode === "manager" ? <ManagerSchedulePage /> : <EmployeeSchedulePage />
}

function RootRoute() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-text-muted">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return <LandingPage />
  }

  return (
    <Layout>
      <Home />
    </Layout>
  )
}

function ManagerModeOnly({ children }) {
  const { membership } = useAuth()
  const { mode } = useMode()

  if (!membership || membership.role !== "MANAGER" || mode !== "manager") {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

function Layout({ children }) {
  return (
    <div className="min-h-screen pb-16 md:pb-0">
      <Navbar />
      {children}
      <BottomNav />
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route path="/" element={<RootRoute />} />
      <Route
        path="/schedules"
        element={
          <ProtectedRoute>
            <ManagerModeOnly>
              <Layout>
                <ManagerSchedulePage />
              </Layout>
            </ManagerModeOnly>
          </ProtectedRoute>
        }
      />
      <Route
        path="/swap-requests"
        element={
          <ProtectedRoute>
            <Layout>
              <RequestsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/team"
        element={
          <ProtectedRoute>
            <ManagerModeOnly>
              <Layout>
                <TeamPage />
              </Layout>
            </ManagerModeOnly>
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Layout>
              <NotificationsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App