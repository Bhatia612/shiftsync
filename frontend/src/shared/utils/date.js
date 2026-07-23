const WEEK_START_DAY = 6 // 0=Sun, 6=Sat

export const startOfWeek = (date) => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const diff = (d.getDay() - WEEK_START_DAY + 7) % 7
  d.setDate(d.getDate() - diff)
  return d
}

export const addDays = (date, days) => {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export const getWeekDays = (weekStart) =>
  Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

export const formatDayName = (date) =>
  date.toLocaleDateString(undefined, { weekday: "long" })

export const formatShortDate = (date) =>
  date.toLocaleDateString(undefined, { month: "short", day: "numeric" })

export const formatRangeLabel = (start, end) =>
  `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`

export const formatTime = (isoString) =>
  new Date(isoString).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  })

export const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

export const getRelativeDayTag = (date) => {
  const today = new Date()

  if (sameDay(date, today)) return "Today"
  if (sameDay(date, addDays(today, -1))) return "Yesterday"
  if (sameDay(date, addDays(today, 1))) return "Tomorrow"

  return null
}

export const hoursBetween = (startIso, endIso) =>
  (new Date(endIso) - new Date(startIso)) / (1000 * 60 * 60)



export const toDateInputValue = (isoString) => {
  const d = new Date(isoString)
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${month}-${day}`
}

export const toTimeInputValue = (isoString) => {
  const d = new Date(isoString)
  const hours = String(d.getHours()).padStart(2, "0")
  const minutes = String(d.getMinutes()).padStart(2, "0")
  return `${hours}:${minutes}`
}

export const combineDateAndTime = (dateValue, timeValue) => {
  const [year, month, day] = dateValue.split("-").map(Number)
  const [hours, minutes] = timeValue.split(":").map(Number)
  return new Date(year, month - 1, day, hours, minutes).toISOString()
}

export const isFutureDay = (date) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const d = new Date(date)
  d.setHours(0, 0, 0, 0)

  return d > today
}

export const timeAgo = (isoString) => {
  const then = new Date(isoString)
  const seconds = Math.floor((Date.now() - then.getTime()) / 1000)

  if (seconds < 60) return "just now"

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`

  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? "" : "s"} ago`
}