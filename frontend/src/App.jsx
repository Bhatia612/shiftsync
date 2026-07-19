import { Routes, Route, Navigate } from "react-router-dom"
import ProtectedRoute from "./shared/components/ProtectedRoute"
import Navbar from "./shared/components/Navbar"
import AuthPage from "./features/auth/pages/AuthPage"
import CreateTeamPage from "./features/teams/pages/CreateTeamPage"
import TeamPage from "./features/teams/pages/TeamPage"
import ManagerSchedulePage from "./features/schedule/pages/ManagerSchedulePage"
import EmployeeSchedulePage from "./features/schedule/pages/EmployeeSchedulePage"
import { useAuth } from "./shared/context/AuthContext"

function Home() {
  const { membership } = useAuth()

  if (!membership) {
    return <CreateTeamPage />
  }

  return membership.role === "MANAGER" ? (
    <ManagerSchedulePage />
  ) : (
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
    <div className="min-h-screen">
      <Navbar />
      {children}
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