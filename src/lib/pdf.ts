import type { jsPDF as JsPDF } from 'jspdf'
import type { CouponRecord } from '@/types'
import { formatDate } from '@/lib/date'

const GOLD = '#b99a5f'
const DEEP = '#4a3a73'
const ROYAL = '#5f4d8c'
const INK = '#2e2838'
const MUTED = '#8d84a3'
const MUTED_2 = '#a99fc0'

async function loadImageDataUrl(src: string): Promise<string | null> {
  try {
    const res = await fetch(src)
    const blob = await res.blob()
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

function wrapText(doc: JsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text, maxWidth)
}

/** Renders the luxury coupon as a PDF matching the on-screen design and triggers a download. */
export async function downloadCouponPdf(coupon: CouponRecord, terms: string, businessName = 'Johri Jewellers') {
  // Loaded on demand so the ~150kB PDF engine never ships in the initial bundle.
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: [720, 446] })
  const W = 720
  const H = 446

  // Base gradient-like wash background (flat fills layered for a soft luxury feel).
  doc.setFillColor('#fffdf9')
  doc.roundedRect(0, 0, W, H, 28, 28, 'F')
  doc.setFillColor('#f7f1e6')
  doc.roundedRect(0, H * 0.45, W, H * 0.55, 0, 0, 'F')

  // Outer gold border with double frame for an embossed look.
  doc.setDrawColor(GOLD)
  doc.setLineWidth(2)
  doc.roundedRect(14, 14, W - 28, H - 28, 20, 20, 'S')
  doc.setDrawColor('#e6ddf4')
  doc.setLineWidth(1)
  doc.roundedRect(20, 20, W - 40, H - 40, 17, 17, 'S')

  // Decorative corner rings.
  doc.setDrawColor(GOLD)
  doc.setLineWidth(0.75)
  doc.circle(W - 10, 10, 70, 'S')
  doc.setDrawColor(ROYAL)
  doc.circle(W + 4, -4, 70, 'S')

  const logo = await loadImageDataUrl('/assets/johri-logo-lavender.png')
  if (logo) {
    const lw = 58
    const lh = lw * (588 / 413)
    doc.addImage(logo, 'PNG', 38, 34, lw, Math.min(lh, 82))
  }

  doc.setTextColor(DEEP)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(26)
  doc.text(businessName, 112, 60)

  doc.setTextColor(GOLD)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('P R I V I L E G E   C O U P O N', 113, 78)

  // Offer panel.
  doc.setFillColor('#f4effa')
  doc.roundedRect(38, 108, W - 76, 96, 16, 16, 'F')
  doc.setDrawColor(GOLD)
  doc.setLineDashPattern([6, 5], 0)
  doc.setLineWidth(1.2)
  doc.roundedRect(38, 108, W - 76, 96, 16, 16, 'S')
  doc.setLineDashPattern([], 0)

  doc.setTextColor(ROYAL)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(24)
  doc.text(coupon.offerTitle, W / 2, 148, { align: 'center', maxWidth: W - 120 })

  doc.setTextColor(GOLD)
  doc.setFontSize(16)
  doc.text(coupon.couponNumber, W / 2, 180, { align: 'center' })

  const cells: [string, string, number][] = [
    ['GUEST', coupon.customerName, 38],
    ['MOBILE', coupon.mobile, 228],
    ['ISSUED', formatDate(coupon.created), 418],
    ['VALID TILL', formatDate(coupon.expiryDate), 560],
  ]
  cells.forEach(([label, value, x]) => {
    doc.setTextColor(MUTED_2)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text(label, x, 240)
    doc.setTextColor(label === 'VALID TILL' ? ROYAL : INK)
    doc.setFontSize(14)
    doc.text(value, x, 258, { maxWidth: 170 })
  })

  doc.setDrawColor('#e6ddf4')
  doc.setLineWidth(1)
  doc.line(38, 288, W - 38, 288)

  doc.setTextColor(MUTED)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  const lines = wrapText(doc, terms, W - 76)
  doc.text(lines, 38, 308)

  doc.save(`${coupon.couponNumber}-johri-coupon.pdf`)
}
