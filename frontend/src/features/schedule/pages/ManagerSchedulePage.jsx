import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "../../../shared/context/AuthContext"
import { getPositions, getTeamMembers } from "../../teams/services/teamsApi"
import { getShifts } from "../services/shiftsApi"
import ScheduleSkeleton from "../components/ScheduleSkeleton"
import ShiftModal from "../components/ShiftModal"
import {
    startOfWeek,
    addDays,
    getWeekDays,
    formatDayName,
    formatShortDate,
    formatRangeLabel,
    formatTime,
    sameDay,
    getRelativeDayTag,
    isFutureDay,
} from "../../../shared/utils/date"

function ManagerSchedulePage() {
    const { membership } = useAuth()
    const teamId = membership.teamId

    const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
    const [modalState, setModalState] = useState(null)

    const weekEnd = addDays(weekStart, 6)
    const days = getWeekDays(weekStart)

    const { data: positions = [] } = useQuery({
        queryKey: ["positions", teamId],
        queryFn: () => getPositions(teamId),
    })

    const { data: members = [] } = useQuery({
        queryKey: ["members", teamId],
        queryFn: () => getTeamMembers(teamId),
    })

    const { data: shifts = [], isLoading } = useQuery({
        queryKey: ["shifts", teamId, weekStart.toISOString()],
        queryFn: () =>
            getShifts({
                teamId,
                from: weekStart.toISOString(),
                to: addDays(weekEnd, 1).toISOString(),
            }),
    })

    const positionName = (positionId) =>
        positions.find((p) => p.id === positionId)?.name || "-"

    const shiftsForDay = (day) =>
        shifts
            .filter((s) => sameDay(new Date(s.startTime), day))
            .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))

    return (
        <div className="mx-auto max-w-7xl px-4 py-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-text">Schedule</h1>
                    <p className="data mt-1 text-sm text-text-muted">
                        {formatRangeLabel(weekStart, weekEnd)}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setWeekStart(addDays(weekStart, -7))}
                        className="btn btn-secondary !py-1.5 text-sm"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => setWeekStart(startOfWeek(new Date()))}
                        className="btn btn-ghost !py-1.5 text-sm"
                    >
                        This week
                    </button>
                    <button
                        onClick={() => setWeekStart(addDays(weekStart, 7))}
                        className="btn btn-secondary !py-1.5 text-sm"
                    >
                        Next
                    </button>
                </div>
            </div>

            {isLoading ? (
                <ScheduleSkeleton />
            ) : (
                <div className="mt-6 md:overflow-x-auto md:pb-2">
                    <div className="flex flex-col gap-3 md:min-w-max md:flex-row">
                        {days.map((day) => {
                            const dayShifts = shiftsForDay(day)
                            const isToday = sameDay(day, new Date())
                            const relativeTag = getRelativeDayTag(day)
                            const editable = isFutureDay(day)

                            return (
                                <div
                                    key={day.toISOString()}
                                    className="panel w-full shrink-0 overflow-hidden md:w-80"
                                >
                                    <div
                                        className={`flex items-baseline justify-between border-b border-border px-4 py-3 ${
                                            isToday ? "bg-accent-soft" : ""
                                        }`}
                                    >
                                        <div className="flex items-baseline gap-2">
                                            <p className="text-sm font-semibold text-text">
                                                {formatDayName(day)}
                                            </p>
                                            {relativeTag && (
                                                <span
                                                    className={`rounded-full px-2 py-0.5 text-[0.6875rem] font-medium ${
                                                        isToday
                                                            ? "bg-accent text-white"
                                                            : "bg-surface-2 text-text-muted"
                                                    }`}
                                                >
                                                    {relativeTag}
                                                </span>
                                            )}
                                        </div>
                                        <p className="data text-xs text-text-muted">
                                            {formatShortDate(day)}
                                        </p>
                                    </div>

                                    {dayShifts.length === 0 ? (
                                        <p className="px-4 py-5 text-sm text-text-muted">No shifts</p>
                                    ) : (
                                        <div className="divide-y divide-border bg-surface-2">
                                            {dayShifts.map((shift) =>
                                                editable ? (
                                                    <button
                                                        key={shift.id}
                                                        onClick={() => setModalState({ shift })}
                                                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-surface"
                                                    >
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-sm font-semibold text-text">
                                                                {shift.assignedUser?.name || "Open shift"}
                                                            </p>
                                                            <p className="data mt-0.5 text-xs text-text-muted">
                                                                {formatTime(shift.startTime)} – {formatTime(shift.endTime)}
                                                            </p>
                                                        </div>
                                                        <span className="shrink-0 rounded-md bg-surface px-2 py-1 text-[0.6875rem] text-text-muted">
                                                            {positionName(shift.positionId)}
                                                        </span>
                                                    </button>
                                                ) : (
                                                    <div
                                                        key={shift.id}
                                                        className="flex items-center gap-3 px-4 py-3"
                                                    >
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-sm font-semibold text-text">
                                                                {shift.assignedUser?.name || "Open shift"}
                                                            </p>
                                                            <p className="data mt-0.5 text-xs text-text-muted">
                                                                {formatTime(shift.startTime)} – {formatTime(shift.endTime)}
                                                            </p>
                                                        </div>
                                                        <span className="shrink-0 rounded-md bg-surface px-2 py-1 text-[0.6875rem] text-text-muted">
                                                            {positionName(shift.positionId)}
                                                        </span>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    )}

                                    {editable && (
                                        <div className="border-t border-border p-2">
                                            <button
                                                onClick={() => setModalState({ defaultDate: day })}
                                                className="btn btn-ghost w-full !py-1.5 text-sm"
                                            >
                                                + Add shift
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {modalState && (
                <ShiftModal
                    shift={modalState.shift}
                    defaultDate={modalState.defaultDate}
                    teamId={teamId}
                    members={members}
                    positions={positions}
                    onClose={() => setModalState(null)}
                />
            )}
        </div>
    )
}

export default ManagerSchedulePage