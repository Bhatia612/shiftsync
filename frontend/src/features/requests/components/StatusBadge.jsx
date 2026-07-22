const STATUS_CONFIG = {
  PENDING_EMPLOYEE: { label: "Awaiting teammate", className: "bg-warning-soft text-warning" },
  PENDING_MANAGER: { label: "Awaiting manager", className: "bg-warning-soft text-warning" },
  APPROVED: { label: "Approved", className: "bg-accent-soft text-accent" },
  DENIED: { label: "Denied", className: "bg-danger-soft text-danger" },
  CANCELLED: { label: "Cancelled", className: "bg-surface-2 text-text-muted" },
}

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    className: "bg-surface-2 text-text-muted",
  }

  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-[0.6875rem] font-medium ${config.className}`}
    >
      {config.label}
    </span>
  )
}

export default StatusBadge