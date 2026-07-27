import { useState } from "react"
import StatusBadge from "./StatusBadge"
import { formatTime, formatDateTime } from "../../../shared/utils/date"

function buildTimeline(swap) {
  const events = []
  const targetName = swap.target?.name || "teammate"

  if (swap.createdAt) {
    events.push({ label: `Requested by ${swap.initiator?.name || "employee"}`, at: swap.createdAt })
  }

  if (swap.respondedAt) {
    events.push({
      label:
        swap.status === "DENIED" && swap.respondedAt === swap.resolvedAt
          ? `Declined by ${targetName}`
          : `Accepted by ${targetName}`,
      at: swap.respondedAt,
    })
  }

  if (swap.resolvedAt) {
    const label =
      swap.status === "APPROVED"
        ? "Approved by manager"
        : swap.status === "CANCELLED"
          ? "Cancelled"
          : swap.respondedAt === swap.resolvedAt
            ? `Declined by ${targetName}`
            : "Denied by manager"
    events.push({ label, at: swap.resolvedAt })
  }

  return events
}

function SwapRequestCard({ swap, currentUserId, actions, meta }) {
  const [showTimeline, setShowTimeline] = useState(false)

  const isInitiator = swap.initiatorUserId === currentUserId
  const isTarget = swap.targetUserId === currentUserId
  const shiftDate = new Date(swap.shift.startTime)

  const description = isInitiator ? (
    <>You asked <span className="text-text">{swap.target.name}</span> to cover</>
  ) : isTarget ? (
    <><span className="text-text">{swap.initiator.name}</span> asked you to cover</>
  ) : (
    <>
      <span className="text-text">{swap.initiator.name}</span> asked{" "}
      <span className="text-text">{swap.target.name}</span> to cover
    </>
  )

  const timeline = buildTimeline(swap)

  return (
    <div className="panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text">
            {shiftDate.toLocaleDateString(undefined, {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </p>
          <p className="data mt-0.5 text-sm text-text-muted">
            {formatTime(swap.shift.startTime)} – {formatTime(swap.shift.endTime)}
          </p>
        </div>
        <StatusBadge status={swap.status} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="rounded-md bg-surface-2 px-2 py-1 text-xs text-text-muted">
            {swap.shift.position?.name || "—"}
          </span>
          <span className="text-text-muted">{description}</span>
        </div>

        <button
          onClick={() => setShowTimeline((v) => !v)}
          aria-label="Show history"
          aria-expanded={showTimeline}
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs transition ${
            showTimeline
              ? "border-accent text-accent"
              : "border-border text-text-muted hover:text-text"
          }`}
        >
          i
        </button>
      </div>

      {meta && <p className="mt-2 text-xs text-text-muted">{meta}</p>}

      {showTimeline && (
        <div className="mt-4 border-t border-border pt-3">
          <ol className="space-y-2.5">
            {timeline.map((event, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span
                  className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
                    i === timeline.length - 1 ? "bg-accent" : "bg-text-muted"
                  }`}
                />
                <div className="flex-1">
                  <p className="text-sm text-text">{event.label}</p>
                  <p className="data text-xs text-text-muted">{formatDateTime(event.at)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {actions && <div className="mt-4 flex gap-2">{actions}</div>}
    </div>
  )
}

export default SwapRequestCard