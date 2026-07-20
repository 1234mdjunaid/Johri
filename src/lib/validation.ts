import { z } from 'zod'

export const claimFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Please enter your full name.')
    .max(80, 'Name is too long.'),
  mobile: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number.'),
})

export type ClaimFormValues = z.infer<typeof claimFormSchema>
