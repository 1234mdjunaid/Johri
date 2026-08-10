import { useEffect, useState } from 'react'
import type { OfferRecord } from '@/types'

const PALETTE = ['#6b5a96', '#8a76b8', '#a992cc', '#cbbce0', '#e6ddf4', '#b99a5f', '#d8c39a', '#f0e7d8']

// The backend only stores a day-count (validityDays), computed fresh into an
// expiryDate at the moment each coupon is claimed — so the calendar picker
// here just converts a chosen date to/from "days from today" for display.
function addDaysToToday(days: number): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function daysFromToday(dateStr: string): number {
  const target = new Date(`${dateStr}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((target.getTime() - today.getTime()) / 86_400_000)
  return Math.max(1, diff)
}

interface OfferEditorRowProps {
  offer: OfferRecord
  totalActiveWeight: number
  onUpdate: (patch: Partial<OfferRecord>) => void
  onDelete: () => void
}

export function OfferEditorRow({ offer, totalActiveWeight, onUpdate, onDelete }: OfferEditorRowProps) {
  const [title, setTitle] = useState(offer.title)
  const [validUntil, setValidUntil] = useState(() => addDaysToToday(offer.validityDays))

  useEffect(() => setTitle(offer.title), [offer.title])
  useEffect(() => setValidUntil(addDaysToToday(offer.validityDays)), [offer.validityDays])

  const pct = offer.active && totalActiveWeight ? `${Math.round((offer.probability / totalActiveWeight) * 100)}%` : '—'

  return (
    <div
      className="border-mist flex flex-col gap-2.5 rounded-[18px] border-[1.5px] bg-paper p-4"
      style={{ opacity: offer.active ? 1 : 0.55 }}
    >
      <div className="flex items-center gap-2.5">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => title !== offer.title && onUpdate({ title })}
          placeholder="Offer name"
          className="border-mist focus:border-lavender h-10 min-w-0 flex-1 rounded-xl border-[1.5px] bg-cream px-3.5 text-sm font-semibold"
        />
        <button
          onClick={() => onUpdate({ active: !offer.active })}
          title="Enable / disable"
          className={`h-[34px] cursor-pointer rounded-full border-[1.5px] px-3 text-xs font-bold whitespace-nowrap ${
            offer.active ? 'border-success-border bg-success-bg text-success' : 'border-mist bg-wash text-muted-2'
          }`}
        >
          {offer.active ? 'Live' : 'Off'}
        </button>
        <button
          onClick={onDelete}
          title="Delete offer"
          className="text-error hover:bg-[#f7e9e3] flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-full border-[1.5px] border-[#efdcd4] bg-transparent text-[15px] leading-none"
        >
          ×
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-3.5">
        <label className="text-muted flex items-center gap-2 text-[12.5px]">
          Chance
          <input
            type="range"
            min={1}
            max={10}
            value={offer.probability}
            onChange={(e) => onUpdate({ probability: Number(e.target.value) })}
            className="accent-lavender w-[110px]"
          />
          <b className="text-royal whitespace-nowrap">{pct}</b>
        </label>
        <label className="text-muted flex items-center gap-2 text-[12.5px]">
          Valid until
          <input
            type="date"
            min={addDaysToToday(1)}
            value={validUntil}
            onChange={(e) => {
              const next = e.target.value
              setValidUntil(next)
              if (next) onUpdate({ validityDays: daysFromToday(next) })
            }}
            className="border-mist focus:border-lavender h-8 rounded-[10px] border-[1.5px] bg-cream px-2 text-[13px]"
          />
        </label>
        <div className="flex items-center gap-1.5">
          {PALETTE.map((c) => (
            <button
              key={c}
              onClick={() => onUpdate({ wheelColor: c })}
              title="Segment color"
              className="h-6 w-6 cursor-pointer rounded-full border-2 p-0"
              style={{ background: c, borderColor: offer.wheelColor === c ? '#4a3a73' : '#fffdf9' }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
