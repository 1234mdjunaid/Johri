import PocketBase from 'pocketbase'
import { env } from '@/config/env'

export const pb = new PocketBase(env.pocketbaseUrl)

// Guests never authenticate; only the admin console does. Do not persist
// guest state, and never auto-cancel admin requests from unrelated screens.
pb.autoCancellation(false)

export function isAdminAuthed(): boolean {
  return pb.authStore.isValid
}

export function adminLogout(): void {
  pb.authStore.clear()
}
