import apiClient from "../../../shared/services/apiClient"

export const createTeam = async ({ name }) => {
  const { data } = await apiClient.post("/teams", { name })
  return data.team
}

export const getTeam = async (teamId) => {
  const { data } = await apiClient.get(`/teams/${teamId}`)
  return data.team
}

export const getTeamMembers = async (teamId) => {
  const { data } = await apiClient.get(`/teams/${teamId}/members`)
  return data.members
}

export const addTeamMember = async ({ teamId, email, role }) => {
  const { data } = await apiClient.post(`/teams/${teamId}/members`, { email, role })
  return data.membership
}

export const updateMemberRole = async ({ teamId, userId, role }) => {
  const { data } = await apiClient.patch(`/teams/${teamId}/members/${userId}`, { role })
  return data.membership
}

export const removeMember = async ({ teamId, userId }) => {
  await apiClient.delete(`/teams/${teamId}/members/${userId}`)
}

export const getPositions = async (teamId) => {
  const { data } = await apiClient.get(`/teams/${teamId}/positions`)
  return data.positions
}

export const createPosition = async ({ teamId, name }) => {
  const { data } = await apiClient.post(`/teams/${teamId}/positions`, { name })
  return data.position
}

export const deletePosition = async ({ teamId, positionId }) => {
  await apiClient.delete(`/teams/${teamId}/positions/${positionId}`)
}