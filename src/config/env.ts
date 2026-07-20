function required(name: string, value: string | undefined): string {
  if (!value) {
    // Fail loudly in dev so misconfiguration never reaches production silently.
    console.warn(`[config] Missing environment variable: ${name}`)
  }
  return value ?? ''
}

export const env = {
  pocketbaseUrl: required('VITE_POCKETBASE_URL', import.meta.env.VITE_POCKETBASE_URL),
  adminEmail: import.meta.env.VITE_ADMIN_EMAIL ?? '',
  whatsappNumber: import.meta.env.VITE_WHATSAPP_NUMBER ?? '',
  businessName: import.meta.env.VITE_BUSINESS_NAME ?? 'Johri Jewellers',
  appUrl: import.meta.env.VITE_APP_URL ?? '',
}
