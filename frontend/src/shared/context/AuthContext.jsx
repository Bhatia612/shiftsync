import { createContext, useState, useContext, useEffect } from "react";
import { getMe } from "../../features/auth/services/authApi";

const AuthContext = createContext(undefined)

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [membership, setMembership] = useState(null)
    const [isLoading, setIsLoading] = useState(true)


    useEffect(() => {
        getMe()
            .then((data) => {
                setUser(data.user)
                setMembership(data.membership)
            })
            .catch(() => {
                setUser(null)
                setMembership(null)
            })
            .finally(() => {
                setIsLoading(false)
            })
    }, [])

    const setAuth = (nextUser, nextMembership) => {
        setUser(nextUser)
        setMembership(nextMembership)
    }

    return (
        <AuthContext.Provider value={{ user, membership, isLoading, setAuth }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}