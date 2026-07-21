import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { OfferEditorRow } from '@/components/admin/OfferEditorRow'
import { useAllOffers, useOfferMutations, useAdminSettings, useSaveSettings } from '@/hooks/useAdminQueries'
import { buildWheelSegments } from '@/lib/wheelMath'
import { describeError } from '@/lib/errors'
import type { OfferRecord } from '@/types'

const PALETTE = ['#6b5a96', '#8a76b8', '#a992cc', '#cbbce0', '#e6ddf4', '#b99a5f', '#d8c39a', '#f0e7d8']

export function AdminOffersPage() {
  const { data: offers, isLoading } = useAllOffers()
  const { create, update, remove } = useOfferMutations()
  const { data: settings } = useAdminSettings()
  const saveSettings = useSaveSettings()
  const [terms, setTerms] = useState('')

  const activeOffers = useMemo(() => (offers ?? []).filter((o) => o.active), [offers])
  const totalActiveWeight = useMemo(() => activeOffers.reduce((a, o) => a + o.probability, 0), [activeOffers])
  const previewSegments = useMemo(
    () =>
      buildWheelSegments(
        activeOffers.map((o) => ({ id: o.id, title: o.title, probability: o.probability, wheelColor: o.wheelColor, validityDays: o.validityDays })),
      ),
    [activeOffers],
  )

  const termsValue = terms || settings?.terms || ''

  const handleAddOffer = () => {
    const color = PALETTE[(offers?.length ?? 0) % PALETTE.length]
    create.mutate(
      { title: 'New offer', description: '', probability: 2, wheelColor: color, active: true, validityDays: 30 },
      { onError: (err) => toast.error(describeError(err, 'Could not create the offer.')) },
    )
  }

  const handleUpdate = (offer: OfferRecord, patch: Partial<OfferRecord>) => {
    update.mutate(
      { id: offer.id, data: patch },
      { onError: (err) => toast.error(describeError(err, 'Could not save the change.')) },
    )
  }

  const handleDelete = (offer: OfferRecord) => {
    if (!confirm(`Delete "${offer.title}"? This cannot be undone.`)) return
    remove.mutate(offer.id, { onError: (err) => toast.error(describeError(err, 'Could not delete the offer.')) })
  }

  const handleSaveTerms = () => {
    saveSettings.mutate(
      { id: settings?.id ?? null, data: { terms: termsValue, businessName: settings?.businessName || 'Johri Jewellers', whatsappNumber: settings?.whatsappNumber || '' } },
      {
        onSuccess: () => toast.success('Terms updated.'),
        onError: (err) => toast.error(describeError(err, 'Could not save terms.')),
      },
    )
  }

  return (
    <div className="animate-fade-up grid grid-cols-1 gap-[22px]">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-start gap-[22px]">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-deep text-[24px] font-normal">Wheel offers</h2>
            <button
              onClick={handleAddOffer}
              disabled={create.isPending}
              className="h-10 cursor-pointer rounded-full border-none px-[18px] text-[13.5px] font-bold text-paper"
              style={{ background: 'linear-gradient(135deg,#8a76b8,#5f4d8c)' }}
            >
              + New offer
            </button>
          </div>

          {isLoading && <div className="text-muted-2 py-8 text-center text-sm">Loading offers…</div>}
          {!isLoading && (offers?.length ?? 0) === 0 && (
            <div className="text-muted-2 border-mist rounded-2xl border-[1.5px] bg-paper py-10 text-center text-sm">
              No offers yet — add your first one to populate the wheel.
            </div>
          )}

          {offers?.map((offer) => (
            <OfferEditorRow
              key={offer.id}
              offer={offer}
              totalActiveWeight={totalActiveWeight}
              onUpdate={(patch) => handleUpdate(offer, patch)}
              onDelete={() => handleDelete(offer)}
            />
          ))}

          <div className="border-mist rounded-[18px] border-[1.5px] bg-paper p-4">
            <div className="text-muted-3 mb-2 text-[11.5px] tracking-[.16em] uppercase">Coupon terms &amp; conditions</div>
            <textarea
              value={termsValue}
              onChange={(e) => setTerms(e.target.value)}
              rows={3}
              className="border-mist focus:border-lavender w-full resize-y rounded-xl border-[1.5px] bg-cream px-3.5 py-3 text-[13px] leading-[1.5]"
            />
            <button
              onClick={handleSaveTerms}
              disabled={saveSettings.isPending}
              className="mt-3 h-10 cursor-pointer rounded-full border-none px-[18px] text-[13.5px] font-bold text-paper disabled:opacity-70"
              style={{ background: 'linear-gradient(135deg,#8a76b8,#5f4d8c)' }}
            >
              {saveSettings.isPending ? 'Saving…' : 'Save terms'}
            </button>
          </div>
        </div>

        <div className="border-mist sticky top-[86px] flex flex-col items-center gap-3 rounded-[22px] border-[1.5px] bg-paper p-[22px]">
          <div className="text-muted-3 text-[11.5px] tracking-[.2em] uppercase">Live wheel preview</div>
          <svg viewBox="0 0 400 400" className="w-[min(100%,300px)] drop-shadow-[0_10px_26px_rgba(74,58,115,.18)]">
            <circle cx="200" cy="200" r="197" fill="#4a3a73" />
            <circle cx="200" cy="200" r="190" fill="none" stroke="#b99a5f" strokeWidth={3} />
            {previewSegments.map((s) => (
              <path key={s.id} d={s.path} fill={s.fill} stroke="#fffdf9" strokeWidth={2} />
            ))}
            {previewSegments.map((s) => (
              <g key={`${s.id}-label`} transform={s.labelTransform}>
                <text x={200} y={66} textAnchor="middle" fill={s.textColor} style={{ fontWeight: 700, fontSize: 15 }}>
                  {s.line1}
                </text>
                {s.line2 && (
                  <text x={200} y={84} textAnchor="middle" fill={s.textColor} style={{ fontWeight: 700, fontSize: 15 }}>
                    {s.line2}
                  </text>
                )}
              </g>
            ))}
            <circle cx="200" cy="200" r="58" fill="#fffdf9" stroke="#b99a5f" strokeWidth={2.5} />
            <text x="200" y="207" textAnchor="middle" fill="#5f4d8c" className="font-heading" style={{ fontSize: 18 }}>
              SPIN
            </text>
          </svg>
          <div className="text-muted-2 text-center text-[12.5px] text-balance">
            Chance sets how often each offer is won — segments stay equal on the wheel.
          </div>
        </div>
      </div>
    </div>
  )
}
