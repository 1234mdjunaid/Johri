import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Confetti } from '@/components/shared/Confetti'
import { Sparkles } from '@/components/shared/Sparkles'
import { claimFormSchema, type ClaimFormValues } from '@/lib/validation'
import type { WheelOffer } from '@/types'

interface WinScreenProps {
  offer: WheelOffer
  onSubmit: (values: ClaimFormValues) => Promise<void>
  submitting: boolean
}

export function WinScreen({ offer, onSubmit, submitting }: WinScreenProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClaimFormValues>({
    resolver: zodResolver(claimFormSchema),
    defaultValues: { name: '', mobile: '' },
  })

  const firstError = errors.name?.message ?? errors.mobile?.message

  return (
    <motion.div
      data-screen="win"
      className="relative z-2 flex min-h-screen items-center justify-center px-4 py-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Confetti />
      <div className="animate-pop border-mist relative z-4 w-full max-w-[420px] rounded-[28px] border-[1.5px] bg-paper/82 px-[26px] pt-[34px] pb-[30px] text-center shadow-[0_24px_60px_rgba(74,58,115,.22)] backdrop-blur-xl">
        <Sparkles />
        <div className="text-gold mt-2.5 text-xs tracking-[.4em] uppercase">Congratulations</div>
        <h2 className="font-heading text-deep mt-2.5 mb-1 text-[clamp(26px,7vw,36px)] font-normal text-balance">
          {offer.title}
        </h2>
        <p className="text-muted mb-[22px] text-[14.5px]">is yours. Enter your details to claim your coupon.</p>

        <form
          className="flex flex-col gap-3.5 text-left"
          onSubmit={handleSubmit(async (values) => {
            await onSubmit(values)
          })}
          noValidate
        >
          <label className="block">
            <span className="text-royal mb-1.5 ml-1 block text-xs tracking-[.14em] uppercase">Full name</span>
            <input
              {...register('name')}
              placeholder="Your name"
              autoComplete="name"
              className="border-pale focus:border-lavender focus:ring-lavender/20 h-[52px] w-full rounded-full border-[1.5px] bg-white/75 px-[18px] text-base text-ink transition-[border-color,box-shadow] focus:ring-4 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-royal mb-1.5 ml-1 block text-xs tracking-[.14em] uppercase">Mobile number</span>
            <input
              {...register('mobile')}
              placeholder="10-digit mobile"
              inputMode="numeric"
              maxLength={10}
              autoComplete="tel"
              className="border-pale focus:border-lavender focus:ring-lavender/20 h-[52px] w-full rounded-full border-[1.5px] bg-white/75 px-[18px] text-base text-ink transition-[border-color,box-shadow] focus:ring-4 focus:outline-none"
            />
          </label>

          {firstError && <div className="text-error px-1 text-sm">{firstError}</div>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-1.5 h-[54px] cursor-pointer rounded-full text-base font-bold tracking-[.04em] text-paper shadow-[0_10px_26px_rgba(95,77,140,.35)] transition-opacity disabled:cursor-not-allowed disabled:opacity-70"
            style={{ background: 'linear-gradient(135deg,#8a76b8,#5f4d8c)' }}
          >
            {submitting ? 'Claiming your coupon…' : 'Claim my coupon'}
          </button>
        </form>
      </div>
    </motion.div>
  )
}
