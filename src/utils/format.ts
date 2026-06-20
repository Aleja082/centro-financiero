export function formatCOP(value: number, opts: { decimals?: number } = {}) {
  const { decimals = 0 } = opts
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(value)
}

export function formatUSD(value: number, opts: { decimals?: number } = {}) {
  const { decimals = 0 } = opts
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(value)
}

export function formatNumber(value: number, decimals = 0) {
  return new Intl.NumberFormat('es-CO', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(value)
}

export function formatPercent(value: number, decimals = 1) {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(decimals)}%`
}

export function plPercent(invertido: number, actual: number): number {
  if (invertido === 0) return 0
  return ((actual - invertido) / invertido) * 100
}

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}
