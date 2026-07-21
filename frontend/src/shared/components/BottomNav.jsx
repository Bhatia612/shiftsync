import { NavLink } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

function BottomNav() {
  const { membership } = useAuth()

  if (membership?.role !== "MANAGER") return null

  const linkClass = ({ isActive }) =>
    `flex flex-1 flex-col items-center gap-1 py-2.5 text-[0.6875rem] transition ${
      isActive ? "text-accent" : "text-text-muted"
    }`

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 border-t border-border bg-bg/95 backdrop-blur md:hidden">
      <div className="flex items-stretch">
        <NavLink to="/" className={linkClass} end>
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
          >
            <rect x="3" y="4" width="18" height="17" rx="2" />
            <path d="M3 9h18M8 2v4M16 2v4" strokeLinecap="round" />
          </svg>
          Schedule
        </NavLink>

        <NavLink to="/my-shifts" className={linkClass}>
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          My shifts
        </NavLink>

        <NavLink to="/team" className={linkClass}>
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
          >
            <circle cx="9" cy="8" r="3.25" />
            <path
              d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5"
              strokeLinecap="round"
            />
            <path
              d="M16 11a3 3 0 100-6M17 19c0-2-.7-3.6-1.8-4.6"
              strokeLinecap="round"
            />
          </svg>
          Team
        </NavLink>
      </div>
    </nav>
  )
}

export default BottomNav