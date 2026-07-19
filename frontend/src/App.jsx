import { Routes, Route, Navigate } from "react-router-dom"
import ProtectedRoute from "./shared/components/ProtectedRoute"
import AuthPage from "./features/auth/pages/AuthPage"

function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <div className="p-8">
              <h1 className="text-2xl font-bold text-text">Dashboard</h1>
              <p className="mt-2 text-sm text-text-muted">You are logged in.</p>
            </div>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App