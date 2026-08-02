import apiClient from "../../../shared/services/apiClient"

export const getNotifications = async ({ unread } = {}) => {
  const { data } = await apiClient.get("/notifications", {
    params: unread ? { unread: "true" } : {},
  })
  return data.notifications
}

export const markNotificationRead = async (id) => {
  const { data } = await apiClient.patch(`/notifications/${id}/read`)
  return data.notification
}

export const markAllNotificationsRead = async () => {
  const { data } = await apiClient.patch("/notifications/read-all")
  return data
}