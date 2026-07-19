import { useState, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createShift, updateShift, deleteShift } from "../services/shiftsApi"
import {
  toDateInputValue,
  toTimeInputValue,
  combineDateAndTime,
} from "../../../shared/utils/date"

function ShiftModal({ shift, defaultDate, teamId, members, positions, onClose }) {
  const isEditing = Boolean(shift)
  const queryClient = useQueryClient()

  const [date, setDate] = useState("")
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("17:00")
  const [positionId, setPositionId] = useState("")
  const [assignedUserId, setAssignedUserId] = useState("")
  const [error, setError] = useState(null)

  useEffect(() => {
    if (shift) {
      setDate(toDateInputValue(shift.startTime))
      setStartTime(toTimeInputValue(shift.startTime))
      setEndTime(toTimeInputValue(shift.endTime))
      setPositionId(shift.positionId)
      setAssignedUserId(shift.assignedUserId || "")
    } else {
      setDate(toDateInputValue(defaultDate || new Date()))
      setStartTime("09:00")
      setEndTime("17:00")
      setPositionId(positions[0]?.id || "")
      setAssignedUserId("")
    }
    setError(null)
  }, [shift, defaultDate, positions])

  const apiError = (err, fallback) =>
    err?.response?.data?.error?.message || fallback

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["shifts", teamId] })
    onClose()
  }

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      isEditing
        ? updateShift({ shiftId: shift.id, ...payload })
        : createShift({ teamId, ...payload }),
    onSuccess: refresh,
    onError: (err) => setError(apiError(err, "Could not save the shift.")),
  })

  const removeMutation = useMutation({
    mutationFn: () => deleteShift(shift.id),
    onSuccess: refresh,
    onError: (err) => setError(apiError(err, "Could not delete the shift.")),
  })

  const handleSave = () => {
    if (!date || !startTime || !endTime || !positionId) {
      setError("Please fill in the date, times, and role.")
      return
    }

    setError(null)
    saveMutation.mutate({
      positionId,
      startTime: combineDateAndTime(date, startTime),
      endTime: combineDateAndTime(date, endTime),
      assignedUserId: assignedUserId || null,
    })
  }

  const busy = saveMutation.isPending || removeMutation.isPending

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="panel max-h-[90vh] w-full max-w-md overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-text">
          {isEditing ? "Edit shift" : "Add shift"}
        </h2>

        <div className="mt-5 space-y-4">
          <div>
            <label className="label">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label">End</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">Role</label>
            <select
              value={positionId}
              onChange={(e) => setPositionId(e.target.value)}
              className="input"
            >
              {positions.length === 0 && <option value="">No roles yet</option>}
              {positions.map((position) => (
                <option key={position.id} value={position.id}>
                  {position.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Assigned to</label>
            <select
              value={assignedUserId}
              onChange={(e) => setAssignedUserId(e.target.value)}
              className="input"
            >
              <option value="">Open shift (unassigned)</option>
              {members.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.name}
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

        <div className="mt-6 flex items-center justify-between gap-2">
          {isEditing ? (
            <button
              onClick={() => removeMutation.mutate()}
              disabled={busy}
              className="btn btn-ghost text-sm !text-danger"
            >
              Delete
            </button>
          ) : (
            <span />
          )}

          <div className="flex gap-2">
            <button onClick={onClose} disabled={busy} className="btn btn-secondary">
              Cancel
            </button>
            <button onClick={handleSave} disabled={busy} className="btn btn-primary">
              {saveMutation.isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ShiftModal