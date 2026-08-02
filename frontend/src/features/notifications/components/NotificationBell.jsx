import { NavLink } from "react-router-dom"
import { useNotifications } from "../hooks/useNotifications"

function NotificationBell() {
  const { unreadCount } = useNotifications()

  return (
    <NavLink
      to="/notifications"
      aria-label="Notifications"
      className={({ isActive }) =>
        `relative flex h-9 w-9 items-center justify-center rounded-lg transition hover:bg-surface-2 ${
          isActive ? "text-text" : "text-text-muted"
        }`
      }
    >
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      >
        <path
          d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent ring-2 ring-bg" />
      )}
    </NavLink>
  )
}

export default NotificationBell