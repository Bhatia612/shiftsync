import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { useAuth } from "../../../shared/context/AuthContext"
import { getMe } from "../../auth/services/authApi"
import { createTeam } from "../services/teamsApi"

function CreateTeamPage() {
  const [name, setName] = useState("")
  const [error, setError] = useState(null)
  const { setAuth } = useAuth()

  const mutation = useMutation({
    mutationFn: createTeam,
    onSuccess: async () => {
      const me = await getMe()
      setAuth(me.user, me.membership)
    },
    onError: (err) => {
      const apiMessage = err?.response?.data?.error?.message
      setError(apiMessage || "Could not create the team. Please try again.")
    },
  })

  const handleCreate = () => {
    if (name.trim().length === 0) return
    setError(null)
    mutation.mutate({ name: name.trim() })
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <div className="panel p-7">
        <h1 className="text-xl font-bold text-text">Create your team</h1>
        <p className="mt-1 text-sm text-text-muted">
          You'll be the manager. You can add people afterward.
        </p>

        <div className="mt-7 space-y-4">
          <div>
            <label className="label">Team name</label>
            <input
              type="text"
              placeholder="e.g. Downtown Store"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="input"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-border bg-danger-soft px-3 py-2">
              <p className="text-sm text-danger">{error}</p>
            </div>
          )}

          <button
            onClick={handleCreate}
            disabled={mutation.isPending || name.trim().length === 0}
            className="btn btn-primary w-full"
          >
            {mutation.isPending ? "Creating..." : "Create team"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CreateTeamPage