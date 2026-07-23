import StatusBadge from "./StatusBadge"
import { formatTime } from "../../../shared/utils/date"

function SwapRequestCard({ swap, currentUserId, actions, meta }) {
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

      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <span className="rounded-md bg-surface-2 px-2 py-1 text-xs text-text-muted">
          {swap.shift.position?.name || "-"}
        </span>
        <span className="text-text-muted">{description}</span>
      </div>

      {meta && <p className="mt-2 text-xs text-text-muted">{meta}</p>}

      {actions && <div className="mt-4 flex gap-2">{actions}</div>}
    </div>
  )
}

export default SwapRequestCard