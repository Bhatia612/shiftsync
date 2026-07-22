import { Routes, Route, Navigate } from "react-router-dom"
import ProtectedRoute from "./shared/components/ProtectedRoute"
import Navbar from "./shared/components/Navbar"
import BottomNav from "./shared/components/BottomNav"
import AuthPage from "./features/auth/pages/AuthPage"
import CreateTeamPage from "./features/teams/pages/CreateTeamPage"
import TeamPage from "./features/teams/pages/TeamPage"
import ManagerSchedulePage from "./features/schedule/pages/ManagerSchedulePage"
import EmployeeSchedulePage from "./features/schedule/pages/EmployeeSchedulePage"
import RequestsPage from "./features/requests/pages/RequestsPage"
import { useAuth } from "./shared/context/AuthContext"

function Home() {
  const { membership } = useAuth()

  if (!membership) {
    return <CreateTeamPage />
  }

  return (
    <EmployeeSchedulePage />
  )
}

function ManagerOnly({ children }) {
  const { membership } = useAuth()

  if (!membership || membership.role !== "MANAGER") {
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
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Home />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/schedules"
        element={
          <ProtectedRoute>
            <ManagerOnly>
              <Layout>
                <ManagerSchedulePage />
              </Layout>
            </ManagerOnly>
          </ProtectedRoute>
        }
      />
      <Route
        path="/requests"
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
            <ManagerOnly>
              <Layout>
                <TeamPage />
              </Layout>
            </ManagerOnly>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App