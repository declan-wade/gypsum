const moneyFormatter = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
})

export function formatMoney(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return "—"
  return moneyFormatter.format(Number(value))
}

const dateFormatter = new Intl.DateTimeFormat("en-AU", { dateStyle: "medium" })

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—"
  return dateFormatter.format(new Date(value))
}

// Produces a yyyy-MM-dd string for <input type="date"> default values.
export function toDateInputValue(value: Date | string | null | undefined): string {
  if (!value) return ""
  const d = new Date(value)
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

const dateTimeFormatter = new Intl.DateTimeFormat("en-AU", {
  dateStyle: "medium",
  timeStyle: "short",
})

export function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "—"
  return dateTimeFormatter.format(new Date(value))
}

// Human-friendly elapsed time, e.g. "1.2s", "3m 4s", "2h 5m", "3d 1h".
export function formatDuration(ms: number | null | undefined) {
  if (ms === null || ms === undefined || ms < 0) return "—"
  if (ms < 1000) return `${ms}ms`
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${(ms / 1000).toFixed(1)}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ${s % 60}s`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ${m % 60}m`
  const d = Math.floor(h / 24)
  return `${d}d ${h % 24}h`
}

// Compact relative time for activity feeds, e.g. "just now", "5m", "3h", "2d".
// Falls back to a formatted date beyond 30 days.
export function formatRelativeTime(value: Date | string | null | undefined) {
  if (!value) return "—"
  const diffMs = Date.now() - new Date(value).getTime()
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days <= 30) return `${days}d`
  return formatDate(value)
}
