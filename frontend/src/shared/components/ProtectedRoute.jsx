import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useAuth()

  console.log("ProtectedRoute — isLoading:", isLoading, "user:", user)

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-text-muted">Loading...</p>
      </div>
    )
  }

  if (!user) {
    console.log("ProtectedRoute — no user, redirecting to /login")
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
