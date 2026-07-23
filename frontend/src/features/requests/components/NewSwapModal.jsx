import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "../../../shared/context/AuthContext"
import { getTeamMembers } from "../../teams/services/teamsApi"
import { getShifts } from "../../schedule/services/shiftsApi"
import { createSwapRequest } from "../services/swapsApi"
import { startOfWeek, addDays, formatTime } from "../../../shared/utils/date"

function NewSwapModal({ onClose }) {
  const { user, membership } = useAuth()
  const teamId = membership.teamId
  const queryClient = useQueryClient()

  const [shiftId, setShiftId] = useState("")
  const [targetUserId, setTargetUserId] = useState("")
  const [error, setError] = useState(null)

  const rangeStart = startOfWeek(new Date())
  const rangeEnd = addDays(rangeStart, 27)

  const { data: shifts = [] } = useQuery({
    queryKey: ["shifts", teamId, rangeStart.toISOString(), "swap-range"],
    queryFn: () =>
      getShifts({
        teamId,
        from: rangeStart.toISOString(),
        to: addDays(rangeEnd, 1).toISOString(),
      }),
  })

  const { data: members = [] } = useQuery({
    queryKey: ["members", teamId],
    queryFn: () => getTeamMembers(teamId),
  })

  const myUpcomingShifts = useMemo(() => {
    const now = new Date()
    return shifts
      .filter((s) => s.assignedUserId === user.id && new Date(s.startTime) > now)
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
  }, [shifts, user.id])

  const selectedShift = useMemo(
    () => shifts.find((s) => s.id === shiftId) || null,
    [shifts, shiftId]
  )

  // For the selected shift, work out which teammates already have an overlapping
  // shift. This mirrors the backend's overlap rule (start < otherEnd && end > otherStart)
  // purely as UX — the backend is still the real guard when the request is sent.
  const teammates = useMemo(() => {
    const others = members.filter((m) => m.userId !== user.id)

    if (!selectedShift) {
      return others.map((m) => ({ ...m, conflict: false }))
    }

    const start = new Date(selectedShift.startTime)
    const end = new Date(selectedShift.endTime)

    return others.map((m) => {
      const conflict = shifts.some(
        (s) =>
          s.assignedUserId === m.userId &&
          new Date(s.startTime) < end &&
          new Date(s.endTime) > start
      )
      return { ...m, conflict }
    })
  }, [members, shifts, selectedShift, user.id])

  const mutation = useMutation({
    mutationFn: createSwapRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["swaps"] })
      onClose()
    },
    onError: (err) => {
      const apiMessage = err?.response?.data?.error?.message
      setError(apiMessage || "Could not send the request.")
    },
  })

  const handleSubmit = () => {
    if (!shiftId || !targetUserId) {
      setError("Pick a shift and a teammate.")
      return
    }
    setError(null)
    mutation.mutate({ shiftId, targetUserId })
  }

  // If the picked teammate becomes conflicting after a shift change, clear them.
  const handleShiftChange = (nextShiftId) => {
    setShiftId(nextShiftId)
    setError(null)
    if (targetUserId) {
      const next = shifts.find((s) => s.id === nextShiftId)
      if (next) {
        const start = new Date(next.startTime)
        const end = new Date(next.endTime)
        const stillConflicts = shifts.some(
          (s) =>
            s.assignedUserId === targetUserId &&
            new Date(s.startTime) < end &&
            new Date(s.endTime) > start
        )
        if (stillConflicts) setTargetUserId("")
      }
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="panel max-h-[90vh] w-full max-w-md overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-text">Request a swap</h2>
        <p className="mt-1 text-sm text-text-muted">
          Ask a teammate to cover one of your shifts. A manager approves it before anything changes.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="label">Which shift?</label>
            {myUpcomingShifts.length === 0 ? (
              <p className="rounded-lg bg-surface-2 px-3 py-2.5 text-sm text-text-muted">
                You have no upcoming shifts to give away.
              </p>
            ) : (
              <select
                value={shiftId}
                onChange={(e) => handleShiftChange(e.target.value)}
                className="input"
              >
                <option value="">Select a shift</option>
                {myUpcomingShifts.map((s) => {
                  const d = new Date(s.startTime)
                  const label = `${d.toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })} · ${formatTime(s.startTime)} – ${formatTime(s.endTime)}`
                  return (
                    <option key={s.id} value={s.id}>
                      {label}
                    </option>
                  )
                })}
              </select>
            )}
          </div>

          <div>
            <label className="label">Ask who?</label>
            <select
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              className="input"
              disabled={teammates.length === 0 || !shiftId}
            >
              <option value="">
                {shiftId ? "Select a teammate" : "Pick a shift first"}
              </option>
              {teammates.map((m) => (
                <option key={m.userId} value={m.userId} disabled={m.conflict}>
                  {m.name}
                  {m.conflict ? " — already scheduled" : ""}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="rounded-lg border border-border bg-danger-soft px-3 py-2">
              <p className="text-sm text-danger">{error}</p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} disabled={mutation.isPending} className="btn btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={mutation.isPending || myUpcomingShifts.length === 0}
            className="btn btn-primary"
          >
            {mutation.isPending ? "Sending..." : "Send request"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default NewSwapModal