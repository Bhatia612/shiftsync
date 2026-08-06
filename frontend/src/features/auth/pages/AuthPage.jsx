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

  const toggle = (
    <button
      onClick={() => {
        setMode(mode === "login" ? "signup" : "login")
        setError(null)
      }}
      className="text-xs transition hover:text-text cursor-pointer text-text-muted md:text-sm"
    >
      {mode === "login" ? (
        <>
          Don't have an account? <span className="text-accent font-bold">Sign up</span>
        </>
      ) : (
        <>
          Already have an account? <span className="text-accent font-bold">Sign in</span>
        </>
      )}
    </button>
  )

  return (
    <div className="flex min-h-screen flex-col justify-between px-4 py-6 md:items-center md:justify-center md:py-8">
      <div
        className={`flex w-full max-w-4xl flex-1 flex-col overflow-hidden rounded-2xl md:flex-row ${mode === "signup" ? "md:flex-row-reverse" : ""
          }`}
      >

        <div className="flex flex-col justify-center gap-2 px-2 py-6 text-left md:w-1/2 md:px-10 md:py-14">
          <p className="data text-xs uppercase tracking-[0.2em] text-accent">
            ShiftSync
          </p>
          {mode === "login" ? (
            <>
              <h2 className="text-xl font-bold text-text md:text-3xl">
                Welcome back.
              </h2>
              <p className="text-sm text-text-muted md:text-base">
                Your team's schedule is right where you left it.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-text md:text-3xl">
                Get in sync.
              </h2>
              <p className="text-sm text-text-muted md:text-base">
                Set up your account and bring your team's shifts together.
              </p>
            </>
          )}
          <div className="mt-4 hidden border-t border-border pt-3 text-left md:block">
            {toggle}
          </div>
        </div>


        <div className="panel w-full rounded-2xl p-6 md:w-1/2 md:rounded-none md:p-10">
          <h1 className="text-2xl font-bold text-text">
            {mode === "login" ? "Sign in" : "Create account"}
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {mode === "login"
              ? "Sign in to see your schedule."
              : "Create an account to get started."}
          </p>

          <div className="mt-6 space-y-4 md:mt-7">
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

          {import.meta.env.DEV && mode === "login" && (
            <div className="mt-4 border-t border-border pt-4">
              <p className="mb-2 text-xs text-text-muted">Dev shortcuts</p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => quickLogin("diyarayat5@gmail.com", "diyaDiBakery")}
                  disabled={submitting}
                  className="btn btn-secondary flex-1 !py-3 text-[.9rem]"
                >
                  Manager: DIYA
                </button>
                <button
                  onClick={() => quickLogin("mohitbhatia612@gmail.com", "mohit001password")}
                  disabled={submitting}
                  className="btn btn-secondary flex-1 !py-3 text-[.9rem]"
                >
                  Employee 1: MOHIT
                </button>
                <button
                  onClick={() => quickLogin("ramanbhatia00@gmail.com", "raman001password")}
                  disabled={submitting}
                  className="btn btn-secondary flex-1 !py-3 text-[.9rem]"
                >
                  Employee 2: RAMAN
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 border-t border-border pt-4 text-left md:hidden">
            {toggle}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthPage