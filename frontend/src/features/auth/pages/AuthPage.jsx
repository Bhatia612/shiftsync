import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../../shared/context/AuthContext"
import { login, signup, getMe } from "../services/authApi"

const AuthPage = () => {
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
            console.log("1. starting, mode:", mode)

            if (mode === "signup") {
                await signup({ name, email, password })
                console.log("2. signup done")
            }

            await login({ email, password })
            console.log("3. login done")

            const me = await getMe()
            console.log("4. getMe done:", me)

            setAuth(me.user, me.membership)
            console.log("5. setAuth done")

            navigate("/")
            console.log("6. navigate called")
        } catch (err) {
            console.log("CAUGHT:", err)
            const apiMessage = err?.response?.data?.error?.message
            setError(apiMessage || "Something went wrong. Please try again.")
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
            </div>
        </div>
    )
}

export default AuthPage