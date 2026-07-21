import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useAdminSettings, useSaveSettings, useCouponsList, useResetCampaignData } from '@/hooks/useAdminQueries'
import { downloadCSV } from '@/lib/adminApi'
import { pb } from '@/lib/pocketbase'
import { describeError } from '@/lib/errors'

export function AdminSettingsPage() {
  const { data: settings, isLoading } = useAdminSettings()
  const saveSettings = useSaveSettings()
  const { data: allCoupons } = useCouponsList('', 'all')
  const resetData = useResetCampaignData()
  const [resetConfirmText, setResetConfirmText] = useState('')
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const [businessName, setBusinessName] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#b99a5f')
  const [secondaryColor, setSecondaryColor] = useState('#101010')
  const [accentColor, setAccentColor] = useState('#f4e6b2')
  const [campaignExpiry, setCampaignExpiry] = useState('')
  const [terms, setTerms] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)

  useEffect(() => {
    if (!settings) return
    setBusinessName(settings.businessName ?? '')
    setWhatsappNumber(settings.whatsappNumber ?? '')
    setPrimaryColor(settings.primaryColor || '#b99a5f')
    setSecondaryColor(settings.secondaryColor || '#101010')
    setAccentColor(settings.accentColor || '#f4e6b2')
    setCampaignExpiry(settings.campaignExpiry ? settings.campaignExpiry.slice(0, 10) : '')
    setTerms(settings.terms ?? '')
  }, [settings])

  const handleSave = () => {
    const form = new FormData()
    form.append('businessName', businessName)
    form.append('whatsappNumber', whatsappNumber)
    form.append('primaryColor', primaryColor)
    form.append('secondaryColor', secondaryColor)
    form.append('accentColor', accentColor)
    if (campaignExpiry) form.append('campaignExpiry', campaignExpiry)
    form.append('terms', terms)
    if (logoFile) form.append('logo', logoFile)

    saveSettings.mutate(
      { id: settings?.id ?? null, data: form },
      {
        onSuccess: () => {
          toast.success('Settings saved.')
          setLogoFile(null)
        },
        onError: (err) => toast.error(describeError(err, 'Could not save settings.')),
      },
    )
  }

  const handleExportCustomers = () => {
    if (!allCoupons || allCoupons.length === 0) {
      toast.error('Nothing to export yet.')
      return
    }
    downloadCSV(
      `johri-customers-${new Date().toISOString().slice(0, 10)}.csv`,
      allCoupons.map((c) => ({ name: c.customerName, mobile: c.mobile, coupon: c.couponNumber, created: c.created })),
    )
  }

  const handleExportCoupons = () => {
    if (!allCoupons || allCoupons.length === 0) {
      toast.error('Nothing to export yet.')
      return
    }
    downloadCSV(
      `johri-coupons-backup-${new Date().toISOString().slice(0, 10)}.csv`,
      allCoupons.map((c) => ({
        couponNumber: c.couponNumber,
        customerName: c.customerName,
        mobile: c.mobile,
        offerTitle: c.offerTitle,
        redeemed: c.redeemed,
        created: c.created,
        expiryDate: c.expiryDate,
      })),
    )
  }

  const handleReset = () => {
    resetData.mutate(undefined, {
      onSuccess: (deleted) => {
        toast.success(
          `Reset complete — removed ${deleted.coupons} coupon(s), ${deleted.customers} customer(s), ${deleted.spins} spin record(s). Coupon numbers restart from JHR-000001.`,
        )
        setShowResetConfirm(false)
        setResetConfirmText('')
      },
      onError: (err) => toast.error(describeError(err, 'Could not reset campaign data.')),
    })
  }

  const logoUrl = settings?.logo ? pb.files.getURL(settings, settings.logo) : '/assets/johri-logo-lavender.png'

  if (isLoading) {
    return <div className="text-muted-2 py-10 text-center text-sm">Loading settings…</div>
  }

  return (
    <div className="animate-fade-up flex flex-col gap-[22px] pb-10">
      <h2 className="font-heading text-deep text-[24px] font-normal">Campaign settings</h2>

      <div className="border-mist grid grid-cols-1 gap-4 rounded-[20px] border-[1.5px] bg-paper p-5 sm:grid-cols-2">
        <Field label="Business name">
          <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="input" />
        </Field>
        <Field label="WhatsApp number (with country code)">
          <input value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} placeholder="919161191676" className="input" />
        </Field>
        <Field label="Campaign expiry date">
          <input type="date" value={campaignExpiry} onChange={(e) => setCampaignExpiry(e.target.value)} className="input" />
        </Field>
        <Field label="Logo">
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="Logo" className="border-mist h-12 w-12 rounded-xl border object-contain bg-cream" />
            <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} className="text-sm" />
          </div>
        </Field>
        <Field label="Primary color">
          <ColorField value={primaryColor} onChange={setPrimaryColor} />
        </Field>
        <Field label="Secondary color">
          <ColorField value={secondaryColor} onChange={setSecondaryColor} />
        </Field>
        <Field label="Accent color">
          <ColorField value={accentColor} onChange={setAccentColor} />
        </Field>
      </div>

      <div className="border-mist rounded-[20px] border-[1.5px] bg-paper p-5">
        <div className="text-muted-3 mb-2 text-[11.5px] tracking-[.16em] uppercase">Terms &amp; conditions</div>
        <textarea
          value={terms}
          onChange={(e) => setTerms(e.target.value)}
          rows={4}
          className="border-mist focus:border-lavender w-full resize-y rounded-xl border-[1.5px] bg-cream px-3.5 py-3 text-[13px] leading-[1.5]"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saveSettings.isPending}
        className="h-[52px] w-full max-w-xs cursor-pointer self-start rounded-full text-[15px] font-bold text-paper shadow-[0_10px_26px_rgba(95,77,140,.3)] disabled:opacity-70"
        style={{ background: 'linear-gradient(135deg,#8a76b8,#5f4d8c)' }}
      >
        {saveSettings.isPending ? 'Saving…' : 'Save settings'}
      </button>

      <div className="border-mist rounded-[20px] border-[1.5px] bg-paper p-5">
        <div className="text-muted-3 mb-3 text-[11.5px] tracking-[.16em] uppercase">Data</div>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleExportCustomers} className="btn-outline">
            Export customers CSV
          </button>
          <button onClick={handleExportCoupons} className="btn-outline">
            Export coupons CSV
          </button>
          <button onClick={handleExportCoupons} className="btn-outline">
            Backup database (CSV)
          </button>
        </div>
        <p className="text-muted-2 mt-3 text-[12.5px]">
          For a full database backup (all collections and files), use PocketBase&apos;s built-in backup from the
          Admin UI under Settings → Backups.
        </p>
      </div>

      <div className="rounded-[20px] border-[1.5px] border-[#efdcd4] bg-[#fdf6f3] p-5">
        <div className="text-error mb-2 text-[11.5px] tracking-[.16em] uppercase">Danger zone</div>
        <p className="text-muted-2 mb-3 text-[13px]">
          Permanently deletes every customer, coupon, and spin record — for starting a fresh campaign. Offers,
          settings, and your admin login are not touched. Coupon numbers restart from JHR-000001. This cannot be
          undone.
        </p>
        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="border-error text-error h-10 cursor-pointer rounded-full border-[1.5px] bg-transparent px-[18px] text-[13.5px] font-bold hover:bg-[#f7e9e3]"
          >
            Reset all campaign data
          </button>
        ) : (
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <input
              value={resetConfirmText}
              onChange={(e) => setResetConfirmText(e.target.value)}
              placeholder='Type "RESET" to confirm'
              className="input sm:max-w-[220px]"
            />
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                disabled={resetConfirmText !== 'RESET' || resetData.isPending}
                className="bg-error h-10 cursor-pointer rounded-full px-[18px] text-[13.5px] font-bold text-paper disabled:cursor-not-allowed disabled:opacity-50"
              >
                {resetData.isPending ? 'Resetting…' : 'Confirm reset'}
              </button>
              <button
                onClick={() => {
                  setShowResetConfirm(false)
                  setResetConfirmText('')
                }}
                className="btn-outline"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-royal mb-1.5 block text-xs tracking-[.1em] uppercase">{label}</span>
      {children}
    </label>
  )
}

function ColorField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2.5">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-10 cursor-pointer rounded-lg border-0 bg-transparent p-0" />
      <input value={value} onChange={(e) => onChange(e.target.value)} className="input" />
    </div>
  )
}
