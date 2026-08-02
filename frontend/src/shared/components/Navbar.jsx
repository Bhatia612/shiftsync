import { NavLink, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useMode } from "../context/ModeContext"
import { usePendingCount } from "../../features/requests/hooks/usePendingSwaps"
import NotificationBell from "../../features/notifications/components/NotificationBell"
import UserMenu from "./UserMenu"

function Navbar() {
  const { membership } = useAuth()
  const { mode, isManager, toggleMode } = useMode()
  const pendingCount = usePendingCount()
  const navigate = useNavigate()

  const inManagerMode = mode === "manager"

  const linkClass = ({ isActive }) =>
    `text-sm transition ${isActive ? "text-text" : "text-text-muted hover:text-text"}`

  const handleModeToggle = () => {
    toggleMode()
    navigate("/")
  }

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-bg/90 backdrop-blur md:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="text-lg font-bold text-text">ShiftSync</span>

          {membership && (
            <nav className="hidden items-center gap-4 md:flex">
              {inManagerMode ? (
                <>
                  <NavLink to="/" className={linkClass} end>
                    Schedule
                  </NavLink>
                  <NavLink to="/swap-requests" className={linkClass}>
                    <span className="relative">
                      Proposals
                      {pendingCount > 0 && (
                        <span className="absolute -right-2.5 -top-0.5 h-2 w-2 rounded-full bg-accent" />
                      )}
                    </span>
                  </NavLink>
                  <NavLink to="/team" className={linkClass}>
                    Team
                  </NavLink>
                </>
              ) : (
                <>
                  <NavLink to="/" className={linkClass} end>
                    My shifts
                  </NavLink>
                  <NavLink to="/swap-requests" className={linkClass}>
                    <span className="relative">
                      Requests
                      {pendingCount > 0 && (
                        <span className="absolute -right-2.5 -top-0.5 h-2 w-2 rounded-full bg-accent" />
                      )}
                    </span>
                  </NavLink>
                </>
              )}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          {membership && <NotificationBell />}

          {isManager && (
            <button
              onClick={handleModeToggle}
              className="flex items-center gap-2 rounded-lg border border-border px-2 py-1.5 text-xs text-text-muted transition hover:text-text"
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${inManagerMode ? "bg-accent" : "bg-text-muted"
                  }`}
              />
              {inManagerMode ? "Manager" : "Employee"}
            </button>
          )}

          <UserMenu />
        </div>
      </div>
    </header>
  )
}

export default Navbar