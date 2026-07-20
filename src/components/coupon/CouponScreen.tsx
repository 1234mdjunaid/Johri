import { useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Download } from 'lucide-react'
import { FaWhatsapp } from 'react-icons/fa'
import { CouponCard } from '@/components/coupon/CouponCard'
import { ParticlesField } from '@/components/shared/ParticlesField'
import { downloadCouponPdf } from '@/lib/pdf'
import { buildWhatsAppLink } from '@/lib/whatsapp'
import type { CouponRecord } from '@/types'

interface CouponScreenProps {
  coupon: CouponRecord
  terms: string
  businessName: string
  whatsappNumber: string
  note?: string
}

export function CouponScreen({ coupon, terms, businessName, whatsappNumber, note }: CouponScreenProps) {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    setDownloading(true)
    try {
      await downloadCouponPdf(coupon, terms, businessName)
    } catch {
      toast.error('Could not generate the PDF. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  const handleWhatsApp = () => {
    window.open(buildWhatsAppLink(coupon, whatsappNumber), '_blank', 'noopener,noreferrer')
  }

  return (
    <motion.div
      data-screen="coupon"
      className="relative z-2 flex min-h-screen flex-col items-center justify-center gap-[22px] px-4 py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <ParticlesField />
      <div className="text-gold text-xs tracking-[.4em] uppercase">Your exclusive coupon</div>

      <CouponCard coupon={coupon} terms={terms} businessName={businessName} />

      {note && <div className="text-muted bg-wisteria rounded-full px-[18px] py-2 text-[13px]">{note}</div>}

      <div className="flex w-full max-w-[430px] flex-wrap justify-center gap-3">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex h-[52px] min-w-[170px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-full text-[15px] font-bold text-paper shadow-[0_10px_26px_rgba(95,77,140,.3)] disabled:opacity-70"
          style={{ background: 'linear-gradient(135deg,#8a76b8,#5f4d8c)' }}
        >
          <Download size={18} />
          {downloading ? 'Preparing PDF…' : 'Download coupon'}
        </button>
        <button
          onClick={handleWhatsApp}
          className="border-lavender text-royal hover:bg-wisteria flex h-[52px] min-w-[170px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border-[1.5px] bg-paper/80 text-[15px] font-bold"
        >
          <FaWhatsapp size={18} />
          Send on WhatsApp
        </button>
      </div>
    </motion.div>
  )
}
