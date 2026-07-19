import { NavLink, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { logout as logoutApi } from "../../features/auth/services/authApi"

function Navbar() {
  const { user, membership, setAuth } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logoutApi()
    } finally {
      setAuth(null, null)
      navigate("/login")
    }
  }

  const linkClass = ({ isActive }) =>
    `text-sm transition ${isActive ? "text-text" : "text-text-muted hover:text-text"}`

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="text-lg font-bold text-text">ShiftSync</span>

          {membership?.role === "MANAGER" && (
            <nav className="flex items-center gap-4">
              <NavLink to="/" className={linkClass} end>
                Schedule
              </NavLink>
              <NavLink to="/team" className={linkClass}>
                Team
              </NavLink>
            </nav>
          )}
        </div>

        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm text-text">{user.name}</p>
              {membership && (
                <p className="text-xs text-text-muted">
                  {membership.role === "MANAGER" ? "Manager" : "Employee"}
                </p>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="btn btn-secondary !py-1.5 !px-3 text-sm"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

export default Navbar