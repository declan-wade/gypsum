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
