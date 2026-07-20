export interface OfferRecord {
  id: string
  title: string
  description: string
  probability: number
  wheelColor: string
  active: boolean
  validityDays: number
  created: string
  updated: string
}

export interface CustomerRecord {
  id: string
  name: string
  mobile: string
  fingerprint: string
  couponId: string
  created: string
}

export interface CouponRecord {
  id: string
  couponNumber: string
  offer: string
  offerTitle: string
  customer: string
  customerName: string
  mobile: string
  redeemed: boolean
  expiryDate: string
  created: string
}

export interface SettingsRecord {
  id: string
  businessName: string
  whatsappNumber: string
  logo: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  campaignExpiry: string
  terms: string
  introSeconds: number
}

export interface SpinRecord {
  id: string
  offer: string
  fingerprint: string
  created: string
}

export interface WheelOffer {
  id: string
  title: string
  probability: number
  wheelColor: string
  validityDays: number
}

export interface ClaimResponse {
  coupon: CouponRecord
  alreadyExists: boolean
}

export type CampaignScreen = 'intro' | 'wheel' | 'win' | 'coupon'
