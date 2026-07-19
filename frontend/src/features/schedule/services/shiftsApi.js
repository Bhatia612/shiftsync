import apiClient from "../../../shared/services/apiClient"

export const getShifts = async ({ teamId, from, to }) => {
  const { data } = await apiClient.get(`/teams/${teamId}/shifts`, {
    params: { from, to },
  })
  return data.shifts
}

export const createShift = async ({ teamId, positionId, startTime, endTime, assignedUserId }) => {
  const { data } = await apiClient.post(`/teams/${teamId}/shifts`, {
    positionId,
    startTime,
    endTime,
    assignedUserId,
  })
  return data.shift
}

export const updateShift = async ({ shiftId, positionId, startTime, endTime, assignedUserId }) => {
  const { data } = await apiClient.patch(`/shifts/${shiftId}`, {
    positionId,
    startTime,
    endTime,
    assignedUserId,
  })
  return data.shift
}

export const deleteShift = async (shiftId) => {
  await apiClient.delete(`/shifts/${shiftId}`)
}