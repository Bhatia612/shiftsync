import { useQuery } from "@tanstack/react-query"
import { useAuth } from "../../../shared/context/AuthContext"
import { getSwapRequests } from "../services/swapsApi"

export function usePendingCount() {
  const { user, membership } = useAuth()
  const isManager = membership?.role === "MANAGER"

  const { data = [] } = useQuery({
    queryKey: isManager
      ? ["swaps", "manager", user?.id]
      : ["swaps", "employee", user?.id],
    queryFn: () => getSwapRequests(isManager ? { role: "manager" } : undefined),
    enabled: Boolean(user && membership),
  })

  if (isManager) {
    return data.filter(
      (s) => s.status === "PENDING_MANAGER" || s.status === "PENDING_EMPLOYEE"
    ).length
  }

  return data.filter(
    (s) => s.targetUserId === user?.id && s.status === "PENDING_EMPLOYEE"
  ).length
}