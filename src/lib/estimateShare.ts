import type { RoofType, RidgeOrientation } from '@/components/Map'

export interface RoofEstimateState {
  id: string
  createdAt: string
  addressText?: string
  lat: number
  lng: number
  basePolygon: google.maps.LatLngLiteral[]
  ridgePoints: google.maps.LatLngLiteral[]
  roofType: RoofType
  orientation: RidgeOrientation
  roofHeightFt: number
  pitchRise: number
  wastePercent: number
  materialId: string
  includeTearOff: boolean
  baseAreaSqFt: number
  pitchedAreaSqFt: number
  totalRidgeLengthFt: number
  squaresNeeded: number
  materialCost: number
  laborCost: number
  tearOffCost: number
  permitsCost: number
  totalEstimate: number
}

// Compact wire format for URL serialization
interface CompactEstimatePayload {
  id: string
  ts: number
  addr?: string
  lat: number
  lng: number
  base: [number, number][]
  ridge: [number, number][]
  type: RoofType
  ori: 'h' | 'v' | 'hf' | 'vf'
  h: number
  pitch: number
  w: number
  mat: string
  to: number
  sq: number
  tot: number
}

export function generateEstimateId(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `VLT-${code}`
}

export function serializeEstimateToUrl(state: RoofEstimateState): string {
  const oriCode: 'h' | 'v' | 'hf' | 'vf' =
    state.orientation === 'vertical'
      ? 'v'
      : state.orientation === 'horizontal-flip'
      ? 'hf'
      : state.orientation === 'vertical-flip'
      ? 'vf'
      : 'h'

  const payload: CompactEstimatePayload = {
    id: state.id,
    ts: Math.floor(new Date(state.createdAt).getTime() / 1000),
    addr: state.addressText || undefined,
    lat: Number(state.lat.toFixed(6)),
    lng: Number(state.lng.toFixed(6)),
    base: state.basePolygon.map(p => [Number(p.lat.toFixed(6)), Number(p.lng.toFixed(6))]),
    ridge: state.ridgePoints.map(p => [Number(p.lat.toFixed(6)), Number(p.lng.toFixed(6))]),
    type: state.roofType,
    ori: oriCode,
    h: Number(state.roofHeightFt.toFixed(1)),
    pitch: state.pitchRise,
    w: state.wastePercent,
    mat: state.materialId,
    to: state.includeTearOff ? 1 : 0,
    sq: Number(state.squaresNeeded.toFixed(1)),
    tot: Math.round(state.totalEstimate)
  }

  try {
    const jsonStr = JSON.stringify(payload)
    if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
      const base64 = window.btoa(encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (_, p1) => {
        return String.fromCharCode(parseInt(p1, 16))
      }))
      const urlSafe = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
      return urlSafe
    }
  } catch (err) {
    console.error('Error serializing estimate:', err)
  }
  return ''
}

export function deserializeEstimateFromUrl(urlHashOrQuery: string): Partial<RoofEstimateState> | null {
  if (!urlHashOrQuery) return null

  // Extract token from either #est=TOKEN, ?est=TOKEN, #data=TOKEN, or raw TOKEN
  let token = urlHashOrQuery.trim()
  if (token.startsWith('#')) token = token.substring(1)
  if (token.startsWith('?')) token = token.substring(1)

  const match = token.match(/(?:est|data|share)=([^&]+)/)
  if (match) {
    token = match[1]
  }

  // Restore standard base64 from url-safe
  let base64 = token.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4 !== 0) {
    base64 += '='
  }

  try {
    const binaryStr = window.atob(base64)
    const jsonStr = decodeURIComponent(
      Array.from(binaryStr)
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    const p: CompactEstimatePayload = JSON.parse(jsonStr)

    return {
      id: p.id || 'VLT-EST',
      createdAt: p.ts ? new Date(p.ts * 1000).toISOString() : new Date().toISOString(),
      addressText: p.addr,
      lat: p.lat,
      lng: p.lng,
      basePolygon: (p.base || []).map(([lat, lng]) => ({ lat, lng })),
      ridgePoints: (p.ridge || []).map(([lat, lng]) => ({ lat, lng })),
      roofType: p.type || 'hip',
      orientation:
        p.ori === 'v'
          ? 'vertical'
          : p.ori === 'hf'
          ? 'horizontal-flip'
          : p.ori === 'vf'
          ? 'vertical-flip'
          : 'horizontal',
      roofHeightFt: p.h || 8.0,
      pitchRise: p.pitch || 6,
      wastePercent: p.w || 15,
      materialId: p.mat || 'asphalt-30',
      includeTearOff: p.to === 1,
      squaresNeeded: p.sq || 0,
      totalEstimate: p.tot || 0
    }
  } catch (err) {
    console.warn('Could not deserialize estimate from URL:', err)
    return null
  }
}

