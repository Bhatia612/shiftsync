import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../../shared/context/AuthContext"
import { login, signup, getMe } from "../services/authApi"

function AuthPage() {
  const [mode, setMode] = useState("login")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const { setAuth } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async () => {
    setError(null)
    setSubmitting(true)

    try {
      if (mode === "signup") {
        await signup({ name, email, password })
      }
      await login({ email, password })

      const me = await getMe()
      setAuth(me.user, me.membership)

      navigate("/")
    } catch (err) {
      const apiMessage = err?.response?.data?.error?.message
      setError(apiMessage || "Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const quickLogin = async (devEmail, devPass) => {
    setError(null)
    setSubmitting(true)

    try {
      await login({ email: devEmail, password: devPass })
      const me = await getMe()
      setAuth(me.user, me.membership)
      navigate("/")
    } catch (err) {
      const apiMessage = err?.response?.data?.error?.message
      setError(apiMessage || "Dev login failed. Does this user exist?")
    } finally {
      setSubmitting(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !submitting) {
      handleSubmit()
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="panel w-full max-w-sm p-7">
        <h1 className="text-2xl font-bold text-text">ShiftSync</h1>
        <p className="mt-1 text-sm text-text-muted">
          {mode === "login"
            ? "Sign in to see your schedule."
            : "Create an account to get started."}
        </p>

        <div className="mt-7 space-y-4">
          {mode === "signup" && (
            <div>
              <label className="label">Name</label>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="input"
              />
            </div>
          )}

          <div>
            <label className="label">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              className="input"
            />
          </div>

          <div>
            <label className="label">Password</label>
            <input
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              className="input"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-border bg-danger-soft px-3 py-2">
              <p className="text-sm text-danger">{error}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn btn-primary w-full"
          >
            {submitting
              ? "Please wait..."
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </button>
        </div>

        <div className="mt-6 border-t border-border pt-5 text-center">
          <button
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login")
              setError(null)
            }}
            className="text-sm text-text-muted transition hover:text-text"
          >
            {mode === "login"
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </div>

        {import.meta.env.DEV && (
          <div className="mt-4 border-t border-border pt-4">
            <p className="mb-2 text-xs text-text-muted">Dev shortcuts</p>
            <div className="flex gap-2">
              <button
                onClick={() => quickLogin("diyarayat5@gmail.com", "diyaDiBakery")}
                disabled={submitting}
                className="btn btn-secondary flex-1 !py-1.5 text-xs"
              >
                Manager
              </button>
              <button
                onClick={() => quickLogin("mohitbhatia612@gmail.com", "mohit001password")}
                disabled={submitting}
                className="btn btn-secondary flex-1 !py-1.5 text-xs"
              >
                Employee
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AuthPage