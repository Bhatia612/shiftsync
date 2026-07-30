import { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "./AuthContext"

const ModeContext = createContext(undefined)

const STORAGE_KEY = "shiftsync-mode"

export const ModeProvider = ({ children }) => {
  const { membership } = useAuth()
  const isManager = membership?.role === "MANAGER"

  const [mode, setMode] = useState("employee")

  useEffect(() => {
    if (!isManager) {
      setMode("employee")
      return
    }
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === "manager" || saved === "employee") {
      setMode(saved)
    }
  }, [isManager])

  const setModeAndPersist = (next) => {
    setMode(next)
    localStorage.setItem(STORAGE_KEY, next)
  }

  const toggleMode = () => {
    setModeAndPersist(mode === "manager" ? "employee" : "manager")
  }

  const effectiveMode = isManager ? mode : "employee"

  return (
    <ModeContext.Provider
      value={{ mode: effectiveMode, isManager, toggleMode, setMode: setModeAndPersist }}
    >
      {children}
    </ModeContext.Provider>
  )
}

export const useMode = () => {
  const context = useContext(ModeContext)
  if (context === undefined) {
    throw new Error("useMode must be used within a ModeProvider")
  }
  return context
}