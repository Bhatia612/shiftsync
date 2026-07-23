import { NavLink } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { usePendingCount } from "../../features/requests/hooks/usePendingSwaps"
import UserMenu from "./UserMenu"

function Navbar() {
  const { membership } = useAuth()
  const isManager = membership?.role === "MANAGER"
  const pendingCount = usePendingCount()

  const linkClass = ({ isActive }) =>
    `text-sm transition ${isActive ? "text-text" : "text-text-muted hover:text-text"}`

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="text-lg font-bold text-text">ShiftSync</span>

          {membership && (
            <nav className="hidden items-center gap-4 md:flex">
              {isManager && (
                <NavLink to="/schedules" className={linkClass} end>
                  Schedule
                </NavLink>
              )}
              <NavLink to="/" className={linkClass} end>
                My shifts
              </NavLink>
              <NavLink to="/swap-requests" className={linkClass}>
                <span className="relative">
                  {isManager ? "Proposals" : "Requests"}
                  {pendingCount > 0 && (
                    <span className="absolute -right-2.5 -top-0.5 h-2 w-2 rounded-full bg-accent" />
                  )}
                </span>
              </NavLink>
              {isManager && (
                <NavLink to="/team" className={linkClass}>
                  Team
                </NavLink>
              )}
            </nav>
          )}
        </div>

        <UserMenu />
      </div>
    </header>
  )
}

export default Navbar