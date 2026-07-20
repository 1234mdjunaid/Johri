export function formatDate(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
