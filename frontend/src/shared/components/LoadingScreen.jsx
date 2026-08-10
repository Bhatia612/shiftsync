import { useState, useEffect } from "react"

function LoadingScreen() {
  const [showWakingMessage, setShowWakingMessage] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowWakingMessage(true), 3500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6">
      <div className="flex flex-col items-center gap-4">
        <span className="text-2xl font-bold text-text">ShiftSync</span>
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" />
      </div>

      <p
        className={`max-w-xs text-center text-sm text-text-muted transition-opacity duration-700 ${
          showWakingMessage ? "opacity-100" : "opacity-0"
        }`}
      >
        Waking up the server — the first visit can take a moment.
      </p>
    </div>
  )
}

export default LoadingScreen