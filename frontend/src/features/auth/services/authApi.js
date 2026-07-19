import apiClient from "../../../shared/services/apiClient";

export const signup = async ({ name, email, password }) => {
    const { data } = await apiClient.post("/auth/signup", { name, email, password })
    return data

}

export const login = async ({ email, password }) => {
    const { data } = await apiClient.post("/auth/login", { email, password })
    return data

}

export const logout = async () => {
    await apiClient.post("/auth/logout")
}

export const getMe = async () => {
    const { data } = await apiClient.get("/auth/me")
    return data
}
