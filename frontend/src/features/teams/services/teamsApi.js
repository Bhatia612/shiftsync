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

export const getPositions = async (teamId) => {
  const { data } = await apiClient.get(`/teams/${teamId}/positions`)
  return data.positions
}