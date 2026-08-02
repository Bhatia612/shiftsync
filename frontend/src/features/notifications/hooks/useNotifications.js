import { useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "../../../shared/context/AuthContext"
import { getNotifications } from "../services/notificationsApi"

const API_BASE = import.meta.env.VITE_API_URL || ""

const SWAP_EVENTS = [
  "SWAP_REQUESTED",
  "SWAP_INITIATED",
  "SWAP_ACCEPTED",
  "SWAP_DENIED",
  "SWAP_APPROVED",
  "SWAP_CANCELLED",
]

export function useNotifications() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => getNotifications(),
    enabled: Boolean(user),
  })

  useEffect(() => {
    if (!user) return

    const es = new EventSource(`${API_BASE}/api/v1/notifications/stream`, {
      withCredentials: true,
    })

    es.onmessage = (event) => {
      let incoming
      try {
        incoming = JSON.parse(event.data)
      } catch {
        return
      }

      queryClient.setQueryData(["notifications", user.id], (old = []) => {
        if (old.some((n) => n.id === incoming.id)) return old
        return [incoming, ...old]
      })

      // A swap-related notification means a swap (and possibly a shift
      // assignment) changed on the server. Refetch those so any open
      // swap or schedule page updates without a manual refresh.
      if (SWAP_EVENTS.includes(incoming.type)) {
        queryClient.invalidateQueries({ queryKey: ["swaps"] })
        queryClient.invalidateQueries({ queryKey: ["shifts"] })
      }
    }

    es.onerror = () => {
      // EventSource auto-reconnects on transient errors.
    }

    return () => es.close()
  }, [user, queryClient])

  const notifications = query.data || []
  const unreadCount = notifications.filter((n) => !n.read).length

  return { notifications, unreadCount, isLoading: query.isLoading }
}