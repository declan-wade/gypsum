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
