import { useNavigate } from "react-router-dom"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "../../../shared/context/AuthContext"
import { useMode } from "../../../shared/context/ModeContext"
import { useNotifications } from "../hooks/useNotifications"
import {
    markNotificationRead,
    markAllNotificationsRead,
} from "../services/notificationsApi"
import { formatDateTime, timeAgo } from "../../../shared/utils/date"

const LABELS = {
    SWAP_REQUESTED: (n) => `${n.payload?.fromName || "Someone"} asked you to cover a shift`,
    SWAP_INITIATED: (n) =>
        `${n.payload?.fromName || "Someone"} asked ${n.payload?.toName || "a teammate"} to cover a shift`,
    SWAP_ACCEPTED: (n) =>
        n.payload?.forManager
            ? `${n.payload?.byName || "A teammate"} accepted ${n.payload?.fromName || "a"}'s swap — ready for approval`
            : `${n.payload?.byName || "Your teammate"} accepted your swap request`,
    SWAP_DENIED: (n) => `${n.payload?.byName || "Your swap"} declined the swap`,
    SWAP_APPROVED: (n) => `${n.payload?.byName || "A manager"} approved your swap`,
    SWAP_CANCELLED: (n) =>
        n.payload?.byManager
            ? `${n.payload?.byName || "A manager"} cancelled the swap`
            : `${n.payload?.byName || "Someone"} cancelled the swap`,
}

const ACTIONABLE = [
    "SWAP_REQUESTED",
    "SWAP_INITIATED",
    "SWAP_ACCEPTED",
    "SWAP_DENIED",
    "SWAP_APPROVED",
    "SWAP_CANCELLED",
]

// A notification belongs to the mode the user was acting in when it's relevant.
const isManagerNotification = (n) =>
    n.type === "SWAP_INITIATED" ||
    (n.type === "SWAP_ACCEPTED" && n.payload?.forManager)

function NotificationsPage() {
    const { user } = useAuth()
    const { setMode } = useMode()
    const { notifications, unreadCount, isLoading } = useNotifications()
    const queryClient = useQueryClient()
    const navigate = useNavigate()

    const readMutation = useMutation({
        mutationFn: markNotificationRead,
        onSuccess: (updated) => {
            queryClient.setQueryData(["notifications", user.id], (old = []) =>
                old.map((n) => (n.id === updated.id ? { ...n, read: true } : n))
            )
        },
    })

    const readAllMutation = useMutation({
        mutationFn: markAllNotificationsRead,
        onSuccess: () => {
            queryClient.setQueryData(["notifications", user.id], (old = []) =>
                old.map((n) => ({ ...n, read: true }))
            )
        },
    })

    // Compute the destination tab based on the TARGET mode, not the current one.
    const tabForNotification = (n, forManager) => {
        if (forManager) {
            if (n.type === "SWAP_INITIATED") return "awaiting"
            if (n.type === "SWAP_ACCEPTED") return "queue"
            return "history"
        }
        if (n.type === "SWAP_REQUESTED") return "received"
        if (n.type === "SWAP_ACCEPTED") return "sent"
        return "history"
    }

    const handleClick = (n) => {
        if (!n.read) readMutation.mutate(n.id)
        if (!ACTIONABLE.includes(n.type)) return

        const forManager = isManagerNotification(n)

        // Switch to the mode this notification belongs to, so the swap is
        // actually visible where we send them.
        setMode(forManager ? "manager" : "employee")

        navigate(`/swap-requests?tab=${tabForNotification(n, forManager)}`)
    }

    return (
        <div className="mx-auto max-w-2xl px-4 py-6">
            <div className="flex items-center justify-between gap-3">
                <h1 className="text-2xl font-bold text-text">Notifications</h1>
                {unreadCount > 0 && (
                    <button
                        onClick={() => readAllMutation.mutate()}
                        disabled={readAllMutation.isPending}
                        className="text-sm text-text-muted transition hover:text-text"
                    >
                        Mark all read
                    </button>
                )}
            </div>

            <div className="mt-5">
                {isLoading ? (
                    <div className="animate-pulse space-y-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="panel h-16" />
                        ))}
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="panel p-8 text-center">
                        <p className="text-sm text-text-muted">Nothing yet.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {notifications.map((n) => {
                            const actionable = ACTIONABLE.includes(n.type)

                            return (
                                <button
                                    key={n.id}
                                    onClick={() => handleClick(n)}
                                    className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition hover:bg-surface-2 ${n.read ? "border-border bg-transparent" : "border-accent/40 bg-accent-soft"
                                        }`}
                                >
                                    {!n.read && (
                                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
                                    )}
                                    <div className={`min-w-0 flex-1 ${n.read ? "pl-5" : ""}`}>
                                        <p className="text-sm text-text">
                                            {LABELS[n.type] ? LABELS[n.type](n) : "Notification"}
                                        </p>
                                        <p className="data mt-0.5 text-xs text-text-muted" title={formatDateTime(n.createdAt)}>
                                            {timeAgo(n.createdAt)}
                                        </p>
                                    </div>
                                    {actionable && (
                                        <span className="data shrink-0 self-center text-xs text-accent">
                                            View →
                                        </span>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

export default NotificationsPage