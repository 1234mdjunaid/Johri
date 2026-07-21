import type { CouponRecord } from '@/types'
import { formatDate } from '@/lib/date'

const GOLD = '#b99a5f'
const DEEP = '#4a3a73'
const ROYAL = '#5f4d8c'
const INK = '#2e2838'
const MUTED = '#8d84a3'
const MUTED_2 = '#a99fc0'

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

/**
 * Renders the luxury coupon to a PNG and triggers a download. Deliberately a
 * plain image rather than a PDF — on mobile, an <a download> pointing at an
 * image data URL saves straight to Photos/gallery, whereas a PDF lands in
 * Files, which is what this replaced (see the jsPDF-based version this
 * superseded — jsPDF + its optional html2canvas dependency also added
 * ~530kB to the bundle for a document type nobody wanted here).
 */
export async function downloadCouponImage(coupon: CouponRecord, terms: string, businessName = 'Johri Jewellers') {
  const SCALE = 2
  const W = 720
  const H = 446

  const canvas = document.createElement('canvas')
  canvas.width = W * SCALE
  canvas.height = H * SCALE
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported on this device.')
  ctx.scale(SCALE, SCALE)

  // Base wash background.
  ctx.fillStyle = '#fffdf9'
  ctx.beginPath()
  ctx.roundRect(0, 0, W, H, 28)
  ctx.fill()
  ctx.fillStyle = '#f7f1e6'
  ctx.beginPath()
  ctx.roundRect(0, H * 0.45, W, H * 0.55, [0, 0, 28, 28])
  ctx.fill()

  // Outer gold border with a double frame for an embossed look.
  ctx.strokeStyle = GOLD
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(14, 14, W - 28, H - 28, 20)
  ctx.stroke()
  ctx.strokeStyle = '#e6ddf4'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.roundRect(20, 20, W - 40, H - 40, 17)
  ctx.stroke()

  // Decorative corner rings.
  ctx.strokeStyle = GOLD
  ctx.lineWidth = 0.75
  ctx.beginPath()
  ctx.arc(W - 10, 10, 70, 0, Math.PI * 2)
  ctx.stroke()
  ctx.strokeStyle = ROYAL
  ctx.beginPath()
  ctx.arc(W + 4, -4, 70, 0, Math.PI * 2)
  ctx.stroke()

  const logo = await loadImage('/assets/johri-logo-lavender.png')
  if (logo) {
    const lw = 58
    const lh = Math.min(lw * (logo.height / logo.width), 82)
    ctx.drawImage(logo, 38, 34, lw, lh)
  }

  ctx.fillStyle = DEEP
  ctx.font = 'bold 26px Georgia, serif'
  ctx.textAlign = 'left'
  ctx.fillText(businessName, 112, 60)

  ctx.fillStyle = GOLD
  ctx.font = 'bold 11px Arial, sans-serif'
  ctx.fillText('P R I V I L E G E   C O U P O N', 113, 78)

  // Offer panel.
  ctx.fillStyle = '#f4effa'
  ctx.beginPath()
  ctx.roundRect(38, 108, W - 76, 96, 16)
  ctx.fill()
  ctx.strokeStyle = GOLD
  ctx.lineWidth = 1.2
  ctx.setLineDash([6, 5])
  ctx.beginPath()
  ctx.roundRect(38, 108, W - 76, 96, 16)
  ctx.stroke()
  ctx.setLineDash([])

  ctx.fillStyle = ROYAL
  ctx.font = 'bold 24px Georgia, serif'
  ctx.textAlign = 'center'
  ctx.fillText(coupon.offerTitle, W / 2, 148, W - 120)

  ctx.fillStyle = GOLD
  ctx.font = 'bold 16px Arial, sans-serif'
  ctx.fillText(coupon.couponNumber, W / 2, 180)

  ctx.textAlign = 'left'
  const cells: [string, string, number][] = [
    ['GUEST', coupon.customerName, 38],
    ['MOBILE', coupon.mobile, 228],
    ['ISSUED', formatDate(coupon.created), 418],
    ['VALID TILL', formatDate(coupon.expiryDate), 560],
  ]
  cells.forEach(([label, value, x]) => {
    ctx.fillStyle = MUTED_2
    ctx.font = 'bold 9px Arial, sans-serif'
    ctx.fillText(label, x, 240)
    ctx.fillStyle = label === 'VALID TILL' ? ROYAL : INK
    ctx.font = 'bold 14px Arial, sans-serif'
    ctx.fillText(value, x, 258)
  })

  ctx.strokeStyle = '#e6ddf4'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(38, 288)
  ctx.lineTo(W - 38, 288)
  ctx.stroke()

  ctx.fillStyle = MUTED
  ctx.font = '9.5px Arial, sans-serif'
  const lines = wrapText(ctx, terms, W - 76)
  lines.forEach((line, i) => ctx.fillText(line, 38, 308 + i * 15))

  const dataUrl = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = `${coupon.couponNumber}-johri-coupon.png`
  a.click()
}
