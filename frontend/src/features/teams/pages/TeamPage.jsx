import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "../../../shared/context/AuthContext"
import {
    getTeam,
    getTeamMembers,
    addTeamMember,
    updateMemberRole,
    removeMember,
    getPositions,
    createPosition,
    deletePosition,
} from "../services/teamsApi"

function TeamPage() {
    const { user, membership } = useAuth()
    const teamId = membership.teamId
    const queryClient = useQueryClient()

    const [newPosition, setNewPosition] = useState("")
    const [newMemberEmail, setNewMemberEmail] = useState("")
    const [newMemberRole, setNewMemberRole] = useState("EMPLOYEE")
    const [positionError, setPositionError] = useState(null)
    const [memberError, setMemberError] = useState(null)

    const { data: team } = useQuery({
        queryKey: ["team", teamId],
        queryFn: () => getTeam(teamId),
    })

    const { data: members = [], isLoading: membersLoading } = useQuery({
        queryKey: ["members", teamId],
        queryFn: () => getTeamMembers(teamId),
    })

    const { data: positions = [], isLoading: positionsLoading } = useQuery({
        queryKey: ["positions", teamId],
        queryFn: () => getPositions(teamId),
    })

    const apiError = (err, fallback) =>
        err?.response?.data?.error?.message || fallback

    const addPositionMutation = useMutation({
        mutationFn: createPosition,
        onSuccess: () => {
            setNewPosition("")
            setPositionError(null)
            queryClient.invalidateQueries({ queryKey: ["positions", teamId] })
        },
        onError: (err) => setPositionError(apiError(err, "Could not add the role.")),
    })

    const deletePositionMutation = useMutation({
        mutationFn: deletePosition,
        onSuccess: () => {
            setPositionError(null)
            queryClient.invalidateQueries({ queryKey: ["positions", teamId] })
        },
        onError: (err) => setPositionError(apiError(err, "Could not remove the role.")),
    })

    const addMemberMutation = useMutation({
        mutationFn: addTeamMember,
        onSuccess: () => {
            setNewMemberEmail("")
            setMemberError(null)
            queryClient.invalidateQueries({ queryKey: ["members", teamId] })
        },
        onError: (err) => setMemberError(apiError(err, "Could not add that person.")),
    })

    const roleMutation = useMutation({
        mutationFn: updateMemberRole,
        onSuccess: () => {
            setMemberError(null)
            queryClient.invalidateQueries({ queryKey: ["members", teamId] })
        },
        onError: (err) => setMemberError(apiError(err, "Could not change the role.")),
    })

    const removeMemberMutation = useMutation({
        mutationFn: removeMember,
        onSuccess: () => {
            setMemberError(null)
            queryClient.invalidateQueries({ queryKey: ["members", teamId] })
        },
        onError: (err) => setMemberError(apiError(err, "Could not remove that person.")),
    })

    const handleAddPosition = () => {
        const name = newPosition.trim()
        if (!name) return
        setPositionError(null)
        addPositionMutation.mutate({ teamId, name })
    }

    const handleAddMember = () => {
        const email = newMemberEmail.trim()
        if (!email) return
        setMemberError(null)
        addMemberMutation.mutate({ teamId, email, role: newMemberRole })
    }

    return (
        <div className="mx-auto max-w-3xl px-4 py-6">
            <h1 className="text-2xl font-bold text-text">{team?.name || "Team"}</h1>
            <p className="mt-1 text-sm text-text-muted">
                Manage the people on your team and the roles they can be scheduled for.
            </p>

            <section className="panel mt-5 p-5">
                <h2 className="text-base font-semibold text-text">People</h2>


                {memberError && (
                    <div className="mt-3 rounded-lg border border-border bg-danger-soft px-3 py-2">
                        <p className="text-sm text-danger">{memberError}</p>
                    </div>
                )}

                <div className="mt-5 space-y-2">
                    {membersLoading ? (
                        <p className="text-sm text-text-muted">Loading people...</p>
                    ) : (
                        members.map((member) => {
                            const isSelf = member.userId === user.id

                            return (
                                <div
                                    key={member.userId}
                                    className="flex items-center justify-between gap-3 rounded-lg bg-surface-2 px-3 py-2.5"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-text">
                                            {member.name}
                                            {isSelf && (
                                                <span className="ml-2 text-xs text-text-muted">you</span>
                                            )}
                                        </p>
                                        <p className="truncate text-xs text-text-muted">{member.email}</p>
                                    </div>

                                    <div className="flex shrink-0 items-center gap-2">
                                        <select
                                            value={member.role}
                                            disabled={isSelf}
                                            onChange={(e) =>
                                                roleMutation.mutate({
                                                    teamId,
                                                    userId: member.userId,
                                                    role: e.target.value,
                                                })
                                            }
                                            className="input !w-auto !py-1 text-xs disabled:opacity-50"
                                        >
                                            <option value="EMPLOYEE">Employee</option>
                                            <option value="MANAGER">Manager</option>
                                        </select>

                                        {!isSelf && (
                                            <button
                                                onClick={() =>
                                                    removeMemberMutation.mutate({ teamId, userId: member.userId })
                                                }
                                                className="text-text-muted transition hover:text-danger"
                                                aria-label={`Remove ${member.name}`}
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>

                <p className="mt-5 text-sm text-text-muted">
                    Add someone by the email they signed up with.
                </p>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <input
                        type="email"
                        placeholder="person@example.com"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddMember()}
                        className="input"
                    />
                    <select
                        value={newMemberRole}
                        onChange={(e) => setNewMemberRole(e.target.value)}
                        className="input sm:w-40"
                    >
                        <option value="EMPLOYEE">Employee</option>
                        <option value="MANAGER">Manager</option>
                    </select>
                    <button
                        onClick={handleAddMember}
                        disabled={addMemberMutation.isPending || !newMemberEmail.trim()}
                        className="btn btn-primary shrink-0"
                    >
                        Add
                    </button>
                </div>
            </section>

            <section className="panel mt-6 p-5">
                <h2 className="text-base font-semibold text-text">Roles</h2>

                {positionError && (
                    <div className="mt-3 rounded-lg border border-border bg-danger-soft px-3 py-2">
                        <p className="text-sm text-danger">{positionError}</p>
                    </div>
                )}

                <div className="mt-4">
                    {positionsLoading ? (
                        <p className="text-sm text-text-muted">Loading roles...</p>
                    ) : positions.length === 0 ? (
                        <p className="text-sm text-text-muted">
                            No roles yet. Add one to start building schedules.
                        </p>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {positions.map((position) => (
                                <div
                                    key={position.id}
                                    className="flex items-center gap-2 rounded-lg bg-surface-2 py-1.5 pl-3 pr-2"
                                >
                                    <span className="text-sm text-text">{position.name}</span>
                                    <button
                                        onClick={() =>
                                            deletePositionMutation.mutate({ teamId, positionId: position.id })
                                        }
                                        className="text-text-muted transition hover:text-danger"
                                        aria-label={`Remove ${position.name}`}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <p className="mt-5 text-sm text-text-muted">
                    The jobs people work — Baker, Production, Breakout, and so on.
                </p>

                <div className="mt-4 flex gap-2">
                    <input
                        type="text"
                        placeholder="Add a role"
                        value={newPosition}
                        onChange={(e) => setNewPosition(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddPosition()}
                        className="input"
                    />
                    <button
                        onClick={handleAddPosition}
                        disabled={addPositionMutation.isPending || !newPosition.trim()}
                        className="btn btn-primary shrink-0"
                    >
                        Add
                    </button>
                </div>
            </section>
        </div>
    )
}

export default TeamPage