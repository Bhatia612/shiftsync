import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useTheme } from "../context/ThemeContext"
import { logout as logoutApi } from "../../features/auth/services/authApi"

function UserMenu() {
  const { user, membership, setAuth } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false)
      }
    }

    const handleEscape = (e) => {
      if (e.key === "Escape") setOpen(false)
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [open])

  const handleLogout = async () => {
    try {
      await logoutApi()
    } finally {
      setAuth(null, null)
      navigate("/login")
    }
  }

  if (!user) return null

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-surface-2"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-sm font-semibold text-text">
          {user.name.charAt(0).toUpperCase()}
        </span>
        <div className="hidden text-left sm:block">
          <p className="text-sm text-text">{user.name}</p>
          {membership && (
            <p className="text-xs text-text-muted">
              {membership.role === "MANAGER" ? "Manager" : "Employee"}
            </p>
          )}
        </div>
      </button>

      {open && (
        <div className="panel absolute right-0 top-full z-20 mt-2 w-56 overflow-hidden p-0">
          <div className="border-b border-border px-4 py-3 sm:hidden">
            <p className="text-sm font-medium text-text">{user.name}</p>
            {membership && (
              <p className="text-xs text-text-muted">
                {membership.role === "MANAGER" ? "Manager" : "Employee"}
              </p>
            )}
          </div>

          <button
            onClick={toggleTheme}
            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-text transition hover:bg-surface-2"
          >
            <span>Appearance</span>
            <span className="text-xs text-text-muted">
              {theme === "dark" ? "Dark" : "Light"}
            </span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full border-t border-border px-4 py-3 text-left text-sm text-danger transition hover:bg-surface-2"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  )
}

export default UserMenu