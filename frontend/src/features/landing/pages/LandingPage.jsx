import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

const FLOW_STEPS = [
  {
    n: "01",
    actor: "Alice",
    line: "can't make Saturday, so she asks Bob to cover 9–5.",
    woven: "Everyone sees only their own shifts and requests.",
    status: "Requested",
  },
  {
    n: "02",
    actor: "Bob",
    line: "is free, and says yes — pending the manager's call.",
    woven: "Checked for clashes before it's even sent. No double-booking.",
    status: "Accepted",
  },
  {
    n: "03",
    actor: "The manager",
    line: "approves. Only now does the schedule actually change.",
    woven: "Every step is logged — who asked, who agreed, when.",
    status: "Approved",
    final: true,
  },
]

function SwapFlow() {
  const [active, setActive] = useState(-1)

  useEffect(() => {
    const step = () =>
      setActive((prev) => (prev >= FLOW_STEPS.length ? -1 : prev + 1))

    const first = setTimeout(step, 400)
    const timer = setInterval(step, 1900)
    return () => {
      clearTimeout(first)
      clearInterval(timer)
    }
  }, [])

  return (
    <ol className="mt-14 space-y-0">
      {FLOW_STEPS.map((step, i) => {
        const revealed = active >= i
        const isFinalLit = step.final && revealed

        return (
          <li
            key={step.n}
            className={`grid grid-cols-[auto_1fr] gap-x-5 border-t border-border py-7 transition-all duration-700 sm:gap-x-8 ${
              revealed ? "opacity-100" : "opacity-25"
            } ${i === FLOW_STEPS.length - 1 ? "border-b" : ""}`}
          >
            <span
              className={`data text-sm tabular-nums transition-colors duration-700 ${
                isFinalLit ? "text-accent" : "text-text-muted"
              }`}
            >
              {step.n}
            </span>

            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="text-lg leading-snug text-text sm:text-xl">
                  <span className="font-semibold">{step.actor}</span>{" "}
                  <span className="text-text-muted">{step.line}</span>
                </p>
                <span
                  className={`data shrink-0 text-xs uppercase tracking-wider transition-colors duration-700 ${
                    isFinalLit
                      ? "text-accent"
                      : revealed
                        ? "text-text"
                        : "text-text-muted"
                  }`}
                >
                  {step.status}
                </span>
              </div>

              <p
                className={`mt-2 max-w-md text-sm transition-all duration-700 ${
                  revealed ? "text-text-muted opacity-100" : "opacity-0"
                }`}
              >
                {step.woven}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-4xl items-center justify-between px-6 py-6">
        <span className="text-base font-bold tracking-tight text-text">ShiftSync</span>
        <button
          onClick={() => navigate("/login")}
          className="text-sm text-text-muted transition hover:text-text"
        >
          Sign in
        </button>
      </header>

      <main className="mx-auto max-w-4xl px-6">
        <section className="pt-16 sm:pt-28">
          <p className="data text-xs uppercase tracking-[0.2em] font-bold text-accent">
            shift swaps · Shift scheduling
          </p>
          <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight text-text sm:text-6xl">
            Nothing changes until{" "}
            <span className="text-text-muted">everyone agrees.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-text-muted">
            A swap moves through the right people in the right order — the employee finds
            cover, the teammate agrees, the manager decides. Watch one go through.
          </p>

          <SwapFlow />

          <div className="mt-14 flex flex-wrap items-center gap-x-6 gap-y-3 pb-24">
            <button
              onClick={() => navigate("/login")}
              className="btn btn-primary px-7 text-base"
            >
              Get started
            </button>
            <span className="text-sm text-text-muted">
              Free to try — no setup, no card.
            </span>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-4xl flex-col items-start justify-between gap-1 px-6 py-7 text-sm text-text-muted sm:flex-row sm:items-center">
          <span className="font-medium text-text">ShiftSync</span>
          <span>Scheduling that keeps managers in control and employees in the loop.</span>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage