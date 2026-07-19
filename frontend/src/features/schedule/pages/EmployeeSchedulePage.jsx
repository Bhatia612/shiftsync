import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "../../../shared/context/AuthContext"
import { getPositions } from "../../teams/services/teamsApi"
import { getShifts } from "../services/shiftsApi"
import {
    startOfWeek,
    addDays,
    getWeekDays,
    formatDayName,
    formatShortDate,
    formatRangeLabel,
    formatTime,
    hoursBetween,
    sameDay,
    getRelativeDayTag,
} from "../../../shared/utils/date"

function EmployeeSchedulePage() {
    const { user, membership } = useAuth()
    const teamId = membership.teamId

    const [weekOffset, setWeekOffset] = useState(0)

    const currentWeekStart = startOfWeek(new Date())
    const weekStart = addDays(currentWeekStart, weekOffset * 7)
    const weekEnd = addDays(weekStart, 6)
    const days = getWeekDays(weekStart)

    const periodStart = currentWeekStart
    const periodEnd = addDays(periodStart, 13)

    const { data: positions = [] } = useQuery({
        queryKey: ["positions", teamId],
        queryFn: () => getPositions(teamId),
    })

    const { data: shifts = [], isLoading } = useQuery({
        queryKey: ["shifts", teamId, periodStart.toISOString(), "biweekly"],
        queryFn: () =>
            getShifts({
                teamId,
                from: periodStart.toISOString(),
                to: addDays(periodEnd, 1).toISOString(),
            }),
    })

    const positionName = (positionId) =>
        positions.find((p) => p.id === positionId)?.name || "—"

    const myShifts = shifts
        .filter((s) => s.assignedUserId === user.id)
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))

    const totalHours = myShifts.reduce(
        (sum, s) => sum + hoursBetween(s.startTime, s.endTime),
        0
    )

    const nextShift = myShifts.find((s) => new Date(s.startTime) > new Date())

    const shiftsForDay = (day) =>
        myShifts.filter((s) => sameDay(new Date(s.startTime), day))

    const tabClass = (offset) =>
        `btn !py-1.5 text-sm ${
            weekOffset === offset ? "btn-primary" : "btn-secondary"
        }`

    return (
        <div className="mx-auto max-w-2xl px-4 py-6">
            <h1 className="text-2xl font-bold text-text">My schedule</h1>
            <p className="data mt-1 text-sm text-text-muted">
                {formatRangeLabel(periodStart, periodEnd)}
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="panel p-5">
                    <p className="text-sm text-text-muted">Total hours this period</p>
                    <p className="data mt-1 text-3xl font-bold text-accent">
                        {totalHours.toFixed(1)}
                    </p>
                    <p className="mt-1 text-xs text-text-muted">
                        {myShifts.length} {myShifts.length === 1 ? "shift" : "shifts"} over two weeks
                    </p>
                </div>

                <div className="panel p-5">
                    <p className="text-sm text-text-muted">Upcoming shift . . .</p>
                    {nextShift ? (
                        <>
                            <p className="mt-1 text-lg font-semibold text-text">
                                {new Date(nextShift.startTime).toLocaleDateString(undefined, {
                                    weekday: "long",
                                    month: "short",
                                    day: "numeric",
                                })}
                            </p>
                            <p className="data mt-0.5 text-sm text-text-muted">
                                {formatTime(nextShift.startTime)} – {formatTime(nextShift.endTime)}
                            </p>
                            <p className="mt-1 text-xs text-accent">
                                {positionName(nextShift.positionId)}
                            </p>
                        </>
                    ) : (
                        <p className="mt-2 text-sm text-text-muted">
                            Nothing scheduled ahead.
                        </p>
                    )}
                </div>
            </div>

            <div className="mt-6 flex items-center gap-2">
                <button onClick={() => setWeekOffset(0)} className={tabClass(0)}>
                    This week
                </button>
                <button onClick={() => setWeekOffset(1)} className={tabClass(1)}>
                    Next week
                </button>
            </div>

            <div className="mt-4 space-y-3">
                {isLoading ? (
                    <div className="animate-pulse space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="panel">
                                <div className="flex items-baseline justify-between border-b border-border px-4 py-3">
                                    <div className="h-4 w-24 rounded bg-surface-2" />
                                    <div className="h-3 w-10 rounded bg-surface-2" />
                                </div>
                                <div className="flex items-center justify-between px-4 py-3">
                                    <div className="h-3.5 w-20 rounded bg-surface-2" />
                                    <div className="h-3.5 w-28 rounded bg-surface-2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    days.map((day) => {
                        const dayShifts = shiftsForDay(day)
                        const isToday = sameDay(day, new Date())
                        const relativeTag = getRelativeDayTag(day)

                        return (
                            <div key={day.toISOString()} className="panel">
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
                                    <p className="px-4 py-4 text-sm text-text-muted">No shift</p>
                                ) : (
                                    <div className="divide-y divide-border">
                                        {dayShifts.map((shift) => (
                                            <div
                                                key={shift.id}
                                                className="flex items-baseline justify-between gap-3 px-4 py-3"
                                            >
                                                <p className="truncate text-sm text-text">
                                                    {positionName(shift.positionId)}
                                                </p>
                                                <div className="shrink-0 text-right">
                                                    <p className="data text-sm text-text">
                                                        {formatTime(shift.startTime)} – {formatTime(shift.endTime)}
                                                    </p>
                                                    <p className="data mt-0.5 text-xs text-text-muted">
                                                        {hoursBetween(shift.startTime, shift.endTime).toFixed(1)} h
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}

export default EmployeeSchedulePage