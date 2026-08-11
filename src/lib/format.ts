const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
})

export function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—"
  return currencyFormatter.format(value)
}

export function formatValueRange(
  min: number | null | undefined,
  max: number | null | undefined
): string {
  if ((min === null || min === undefined) && (max === null || max === undefined)) return "—"
  if (min === max || min === undefined || min === null) return formatMoney(max)
  if (max === undefined || max === null) return formatMoney(min)
  return `${formatMoney(min)} – ${formatMoney(max)}`
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return dateFormatter.format(d)
}

export function todayISODate(): string {
  return new Date().toISOString().slice(0, 10)
}
