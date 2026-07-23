import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "../../../shared/context/AuthContext"
import {
  getSwapRequests,
  respondToSwapRequest,
  cancelSwapRequest,
  approveSwapRequest,
  denySwapRequest,
} from "../services/swapsApi"
import SwapRequestCard from "../components/SwapRequestCard"
import NewSwapModal from "../components/NewSwapModal"
import { timeAgo } from "../../../shared/utils/date"

const RESOLVED = ["APPROVED", "DENIED", "CANCELLED"]

function RequestsPage() {
  const { user, membership } = useAuth()
  const isManager = membership.role === "MANAGER"

  return isManager ? (
    <ManagerRequests userId={user.id} />
  ) : (
    <EmployeeRequests userId={user.id} />
  )
}

function useApiError() {
  const [error, setError] = useState(null)
  const apiError = (err, fallback) =>
    err?.response?.data?.error?.message || fallback
  return { error, setError, apiError }
}

function ManagerRequests({ userId }) {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState("queue")
  const { error, setError, apiError } = useApiError()

  const { data: all = [], isLoading } = useQuery({
    queryKey: ["swaps", "manager", userId],
    queryFn: () => getSwapRequests({ role: "manager" }),
  })

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["swaps"] })
    queryClient.invalidateQueries({ queryKey: ["shifts"] })
    setError(null)
  }

  const approveMutation = useMutation({
    mutationFn: approveSwapRequest,
    onSuccess: refresh,
    onError: (err) => setError(apiError(err, "Could not approve the request.")),
  })

  const denyMutation = useMutation({
    mutationFn: denySwapRequest,
    onSuccess: refresh,
    onError: (err) => setError(apiError(err, "Could not deny the request.")),
  })

  const cancelMutation = useMutation({
    mutationFn: cancelSwapRequest,
    onSuccess: refresh,
    onError: (err) => setError(apiError(err, "Could not cancel the request.")),
  })

  const busy =
    approveMutation.isPending || denyMutation.isPending || cancelMutation.isPending

  const queue = all.filter((s) => s.status === "PENDING_MANAGER")
  const awaiting = all.filter((s) => s.status === "PENDING_EMPLOYEE")
  const history = all.filter((s) => RESOLVED.includes(s.status))

  const tabs = [
    { id: "queue", label: "To approve", count: queue.length },
    { id: "awaiting", label: "Awaiting teammate", count: awaiting.length },
    { id: "history", label: "History", count: null },
  ]

  return (
    <RequestsLayout
      title="Proposals"
      subtitle="Review swaps your team has agreed on."
      tabs={tabs}
      tab={tab}
      setTab={setTab}
      error={error}
      isLoading={isLoading}
    >
      {tab === "queue" ? (
        <SwapList
          items={queue}
          userId={userId}
          emptyMessage="Nothing waiting for your approval."
          actionsFor={(swap) => (
            <>
              <button
                onClick={() => approveMutation.mutate(swap.id)}
                disabled={busy}
                className="btn btn-primary flex-1 !py-1.5 text-sm"
              >
                Approve
              </button>
              <button
                onClick={() => denyMutation.mutate(swap.id)}
                disabled={busy}
                className="btn btn-secondary flex-1 !py-1.5 text-sm"
              >
                Deny
              </button>
            </>
          )}
        />
      ) : tab === "awaiting" ? (
        <SwapList
          items={awaiting}
          userId={userId}
          emptyMessage="No swaps are waiting on a teammate right now."
          metaFor={(swap) => `Requested ${timeAgo(swap.createdAt)} · waiting on the teammate`}
          actionsFor={(swap) => (
            <button
              onClick={() => cancelMutation.mutate(swap.id)}
              disabled={busy}
              className="btn btn-secondary !py-1.5 text-sm"
            >
              Cancel request
            </button>
          )}
        />
      ) : (
        <SwapList items={history} userId={userId} emptyMessage="No resolved requests yet." />
      )}
    </RequestsLayout>
  )
}

function EmployeeRequests({ userId }) {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState("received")
  const [modalOpen, setModalOpen] = useState(false)
  const { error, setError, apiError } = useApiError()

  const { data: mine = [], isLoading } = useQuery({
    queryKey: ["swaps", "employee", userId],
    queryFn: () => getSwapRequests(),
  })

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["swaps"] })
    queryClient.invalidateQueries({ queryKey: ["shifts"] })
    setError(null)
  }

  const respondMutation = useMutation({
    mutationFn: respondToSwapRequest,
    onSuccess: refresh,
    onError: (err) => setError(apiError(err, "Could not respond to the request.")),
  })

  const cancelMutation = useMutation({
    mutationFn: cancelSwapRequest,
    onSuccess: refresh,
    onError: (err) => setError(apiError(err, "Could not cancel the request.")),
  })

  const busy = respondMutation.isPending || cancelMutation.isPending

const received = mine.filter(
    (s) => s.targetUserId === userId && !RESOLVED.includes(s.status)
  )
  const sent = mine.filter(
    (s) => s.initiatorUserId === userId && !RESOLVED.includes(s.status)
  )
  const history = mine.filter((s) => RESOLVED.includes(s.status))

  const tabs = [
    { id: "received", label: "Received", count: received.length },
    { id: "sent", label: "Sent", count: sent.length },
    { id: "history", label: "History", count: null },
  ]

  return (
    <>
      <RequestsLayout
        title="Requests"
        subtitle="Ask a teammate to cover a shift you can't work."
        tabs={tabs}
        tab={tab}
        setTab={setTab}
        error={error}
        isLoading={isLoading}
        action={
          <button onClick={() => setModalOpen(true)} className="btn btn-primary">
            Request swap
          </button>
        }
      >
{tab === "received" ? (
          <SwapList
            items={received}
            userId={userId}
            emptyMessage="No one has asked you to cover a shift."
            actionsFor={(swap) =>
              swap.status === "PENDING_EMPLOYEE" ? (
                <>
                  <button
                    onClick={() => respondMutation.mutate({ id: swap.id, decision: "accept" })}
                    disabled={busy}
                    className="btn btn-primary flex-1 !py-1.5 text-sm"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => respondMutation.mutate({ id: swap.id, decision: "decline" })}
                    disabled={busy}
                    className="btn btn-secondary flex-1 !py-1.5 text-sm"
                  >
                    Decline
                  </button>
                </>
              ) : null
            }
          />
        ) : tab === "sent" ? (
          <SwapList
            items={sent}
            userId={userId}
            emptyMessage="You haven't asked anyone to cover a shift."
            actionsFor={(swap) => (
              <button
                onClick={() => cancelMutation.mutate(swap.id)}
                disabled={busy}
                className="btn btn-secondary !py-1.5 text-sm"
              >
                Cancel request
              </button>
            )}
          />
        ) : (
          <SwapList items={history} userId={userId} emptyMessage="Nothing here yet." />
        )}
      </RequestsLayout>

      {modalOpen && <NewSwapModal onClose={() => setModalOpen(false)} />}
    </>
  )
}

function RequestsLayout({ title, subtitle, tabs, tab, setTab, error, isLoading, action, children }) {
  const tabClass = (id) =>
    `relative whitespace-nowrap border-b-2 px-3 py-2.5 text-sm transition ${
      tab === id
        ? "border-accent text-text"
        : "border-transparent text-text-muted hover:text-text"
    }`

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text">{title}</h1>
          <p className="mt-1 text-sm text-text-muted">{subtitle}</p>
        </div>
        {action}
      </div>

      <div className="mt-5 flex gap-1 overflow-x-auto border-b border-border">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={tabClass(t.id)}>
            {t.label}
            {t.count > 0 && (
              <span className="ml-1.5 rounded-full bg-accent px-1.5 py-0.5 text-[0.625rem] font-semibold text-white">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-border bg-danger-soft px-3 py-2">
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      <div className="mt-5">
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="panel h-28" />
            ))}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  )
}

function SwapList({ items, userId, emptyMessage, actionsFor, metaFor }) {
  if (items.length === 0) {
    return (
      <div className="panel p-8 text-center">
        <p className="text-sm text-text-muted">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((swap) => (
        <SwapRequestCard
          key={swap.id}
          swap={swap}
          currentUserId={userId}
          meta={metaFor ? metaFor(swap) : null}
          actions={actionsFor ? actionsFor(swap) : null}
        />
      ))}
    </div>
  )
}

export default RequestsPage