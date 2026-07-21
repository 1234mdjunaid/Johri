import { ClientResponseError } from 'pocketbase'

/**
 * Turns a PocketBase error into something a human can act on instead of a
 * generic "something went wrong" — surfaces the actual failing field/reason
 * when PocketBase's validation response includes one, or distinguishes
 * "server unreachable" from "request rejected".
 */
export function describeError(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (err instanceof ClientResponseError) {
    if (err.status === 0) {
      return "Can't reach the server — check the connection or try again in a moment."
    }
    const data = err.response?.data as Record<string, { message?: string }> | undefined
    if (data && Object.keys(data).length > 0) {
      const [field, info] = Object.entries(data)[0]
      return `${field}: ${info?.message ?? 'invalid value'}`
    }
    return err.message || fallback
  }
  if (err instanceof Error && err.message) {
    return err.message
  }
  return fallback
}
