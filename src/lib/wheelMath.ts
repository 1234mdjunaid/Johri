import type { WheelOffer } from '@/types'

export interface WheelSegment {
  id: string
  path: string
  fill: string
  labelTransform: string
  textColor: string
  line1: string
  line2: string
}

const CENTER = 200
const RADIUS = 186

function point(deg: number, r: number): [number, number] {
  const a = ((deg - 90) * Math.PI) / 180
  return [CENTER + r * Math.cos(a), CENTER + r * Math.sin(a)]
}

function splitLabel(label: string): [string, string] {
  const words = label.split(' ')
  let line1 = ''
  let line2 = ''
  let best: number | null = null
  for (let k = 0; k <= words.length; k++) {
    const l1 = words.slice(0, k).join(' ')
    const l2 = words.slice(k).join(' ')
    const cost = Math.max(l1.length, l2.length)
    if (best === null || cost < best) {
      best = cost
      line1 = l1
      line2 = l2
    }
  }
  if (line1.length > 15) line1 = line1.slice(0, 14) + '…'
  if (line2.length > 15) line2 = line2.slice(0, 14) + '…'
  return [line1, line2]
}

function luminance(hex: string): number {
  const c = hex.replace('#', '')
  if (c.length !== 6) return 128
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  return r * 0.35 + g * 0.5 + b * 0.15
}

export function buildWheelSegments(offers: WheelOffer[]): WheelSegment[] {
  const n = Math.max(offers.length, 1)
  const seg = 360 / n
  return offers.map((offer, i) => {
    const a0 = i * seg
    const a1 = (i + 1) * seg
    const mid = a0 + seg / 2
    const [x0, y0] = point(a0, RADIUS)
    const [x1, y1] = point(a1, RADIUS)
    const large = seg > 180 ? 1 : 0
    const color = offer.wheelColor || '#8a76b8'
    const [line1, line2] = splitLabel(offer.title)
    const path =
      n === 1
        ? `M200 200 m-${RADIUS} 0 a${RADIUS} ${RADIUS} 0 1 0 ${RADIUS * 2} 0 a${RADIUS} ${RADIUS} 0 1 0 -${RADIUS * 2} 0`
        : `M${CENTER} ${CENTER} L${x0.toFixed(1)} ${y0.toFixed(1)} A${RADIUS} ${RADIUS} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z`
    return {
      id: offer.id,
      path,
      fill: color,
      labelTransform: `rotate(${mid} 200 200)`,
      textColor: luminance(color) > 165 ? '#4a3a73' : '#fffdf9',
      line1,
      line2,
    }
  })
}

export function studPositions(count: number): { x: number; y: number }[] {
  const n = Math.max(count, 1)
  const seg = 360 / n
  return Array.from({ length: n }, (_, i) => {
    const a = ((i * seg - 90) * Math.PI) / 180
    return { x: CENTER + RADIUS * Math.cos(a), y: CENTER + RADIUS * Math.sin(a) }
  })
}

/**
 * Weighted-random pick plus the wheel rotation (in degrees) needed to land the
 * pointer on that segment, including several full spins for the physics feel.
 */
export function pickWinnerAndRotation(offers: WheelOffer[], currentRotation: number) {
  const totalWeight = offers.reduce((a, o) => a + o.probability, 0)
  let r = Math.random() * totalWeight
  let index = 0
  for (let i = 0; i < offers.length; i++) {
    r -= offers[i].probability
    if (r <= 0) {
      index = i
      break
    }
  }
  const seg = 360 / offers.length
  const targetMod = (360 - (index * seg + seg / 2) + (Math.random() * seg * 0.5 - seg * 0.25) + 360) % 360
  const delta = 5 * 360 + ((targetMod - (currentRotation % 360) + 360) % 360)
  return { winner: offers[index], rotation: currentRotation + delta }
}
