import apiClient from "../../../shared/services/apiClient"

export const getSwapRequests = async ({ role, status } = {}) => {
  const { data } = await apiClient.get("/swap-requests", {
    params: { role, status },
  })
  return data.swapRequests
}

export const getSwapRequest = async (id) => {
  const { data } = await apiClient.get(`/swap-requests/${id}`)
  return data.swapRequest
}

export const createSwapRequest = async ({ shiftId, targetUserId }) => {
  const { data } = await apiClient.post("/swap-requests", {
    shiftId,
    targetUserId,
    counterShiftId: null,
  })
  return data.swapRequest
}

export const respondToSwapRequest = async ({ id, decision }) => {
  const { data } = await apiClient.patch(`/swap-requests/${id}/respond`, { decision })
  return data.swapRequest
}

export const approveSwapRequest = async (id) => {
  const { data } = await apiClient.patch(`/swap-requests/${id}/approve`)
  return data.swapRequest
}

export const denySwapRequest = async (id) => {
  const { data } = await apiClient.patch(`/swap-requests/${id}/deny`)
  return data.swapRequest
}

export const cancelSwapRequest = async (id) => {
  const { data } = await apiClient.patch(`/swap-requests/${id}/cancel`)
  return data.swapRequest
}