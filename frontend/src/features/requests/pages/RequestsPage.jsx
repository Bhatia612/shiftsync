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

function RequestsPage() {
  const { user, membership } = useAuth()
  const queryClient = useQueryClient()
  const isManager = membership.role === "MANAGER"

  const [tab, setTab] = useState("received")
  const [modalOpen, setModalOpen] = useState(false)
  const [error, setError] = useState(null)

  const { data: myRequests = [], isLoading } = useQuery({
    queryKey: ["swaps", "mine"],
    queryFn: () => getSwapRequests(),
  })

  const { data: queue = [], isLoading: queueLoading } = useQuery({
    queryKey: ["swaps", "queue"],
    queryFn: () => getSwapRequests({ role: "manager" }),
    enabled: isManager,
  })

  const apiError = (err, fallback) =>
    err?.response?.data?.error?.message || fallback

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

  const busy =
    respondMutation.isPending ||
    cancelMutation.isPending ||
    approveMutation.isPending ||
    denyMutation.isPending

  const received = myRequests.filter(
    (s) => s.targetUserId === user.id && s.status === "PENDING_EMPLOYEE"
  )
  const sent = myRequests.filter((s) => s.initiatorUserId === user.id)
  const history = myRequests.filter(
    (s) => s.targetUserId === user.id && s.status !== "PENDING_EMPLOYEE"
  )

  const tabs = [
    { id: "received", label: "Received", count: received.length },
    { id: "sent", label: "Sent", count: sent.length },
    ...(isManager ? [{ id: "queue", label: "To approve", count: queue.length }] : []),
    { id: "history", label: "History", count: null },
  ]

  const tabClass = (id) =>
    `relative whitespace-nowrap border-b-2 px-3 py-2.5 text-sm transition ${
      tab === id
        ? "border-accent text-text"
        : "border-transparent text-text-muted hover:text-text"
    }`

  const renderList = (items, emptyMessage, actionsFor) => {
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
            currentUserId={user.id}
            actions={actionsFor ? actionsFor(swap) : null}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text">Requests</h1>
          <p className="mt-1 text-sm text-text-muted">
            Ask a teammate to cover a shift you can't work.
          </p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn btn-primary">
          Request swap
        </button>
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
        {isLoading || (tab === "queue" && queueLoading) ? (
          <div className="animate-pulse space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="panel h-28" />
            ))}
          </div>
        ) : tab === "received" ? (
          renderList(received, "No one has asked you to cover a shift.", (swap) => (
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
          ))
        ) : tab === "sent" ? (
          renderList(sent, "You haven't asked anyone to cover a shift.", (swap) =>
            swap.status === "PENDING_EMPLOYEE" ? (
              <button
                onClick={() => cancelMutation.mutate(swap.id)}
                disabled={busy}
                className="btn btn-secondary !py-1.5 text-sm"
              >
                Cancel request
              </button>
            ) : null
          )
        ) : tab === "queue" ? (
          renderList(queue, "Nothing waiting for your approval.", (swap) => (
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
          ))
        ) : (
          renderList(history, "Nothing here yet.")
        )}
      </div>

      {modalOpen && <NewSwapModal onClose={() => setModalOpen(false)} />}
    </div>
  )
}

export default RequestsPage