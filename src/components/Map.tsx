"use client"

import { useState, useCallback, useRef, useEffect } from 'react'
import { GoogleMap, Polygon, Marker } from '@react-google-maps/api'
import {
  MapPin,
  RotateCcw,
  Box,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Plus,
  Minus,
  Sliders,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  X,
  ArrowUpDown
} from 'lucide-react'
import { translations, Language } from '@/lib/translations'
import {
  RoofType,
  RidgeOrientation,
  ROOF_SHAPE_TEMPLATES,
  VELTOS_FACET_COLORS,
  generateTemplateLatLngs,
  resolveVertexToken
} from '@/lib/roofShapes'
import RoofShapeIcon from '@/components/RoofShapeIcon'
import RoofSemi3DViewer from '@/components/RoofSemi3DViewer'

export type { RoofType, RidgeOrientation }

const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '0.75rem'
}

const initialCenter = {
  lat: 44.9778,
  lng: -93.2650
}

export interface FacetItem {
  id: string
  name: string
  path: google.maps.LatLngLiteral[]
  areaSqFt: number
  color: { fill: string; stroke: string }
  segments: { mid: google.maps.LatLngLiteral; length: string }[]
}

export interface RidgeLine {
  id: string
  path: google.maps.LatLngLiteral[]
  lengthFt: string
  lengthValue: number
  isMainRidge?: boolean
}

export type PhaseType = 'base' | 'facets' | 'specs'

interface MapProps {
  onAreaChange: (areaSqFt: number) => void
  onFacetsChange?: (
    facets: FacetItem[],
    currentPhase: PhaseType,
    baseAreaSqFt: number,
    totalRidgeLengthFt?: number,
    roofType?: RoofType,
    effectivePitchedArea?: number
  ) => void
  addressCoordinates?: { lat: number; lng: number } | null
  isLoaded: boolean
  loadError?: Error | undefined
  currentPhase?: PhaseType
  onPhaseChange?: (phase: PhaseType) => void
  lang?: Language
  initialEstimate?: {
    basePolygon: google.maps.LatLngLiteral[]
    ridgePoints: google.maps.LatLngLiteral[]
    roofType: RoofType
    orientation: RidgeOrientation
    roofHeightFt: number
  } | null
  onStateExport?: (state: {
    basePolygon: google.maps.LatLngLiteral[]
    ridgePoints: google.maps.LatLngLiteral[]
    roofType: RoofType
    orientation: RidgeOrientation
    roofHeightFt: number
  }) => void
}

function computeEquivalentPitch(heightFt: number, runFt: number): number {
  if (runFt <= 0) return 6
  const rise = Math.round((heightFt / runFt) * 12)
  return Math.min(24, Math.max(1, rise))
}

export default function Map({
  onAreaChange,
  onFacetsChange,
  addressCoordinates,
  isLoaded,
  loadError,
  lang = 'en',
  initialEstimate,
  onStateExport
}: MapProps) {
  const t = translations[lang].map
  const unitDist = lang === 'en' ? 'ft' : 'pies'
  const unitArea = lang === 'en' ? 'sq ft' : 'pies²'
  const unitLinear = lang === 'en' ? 'linear ft' : 'pies lineales'

  const [map, setMap] = useState<google.maps.Map | null>(null)

  // Camera Settings: Pure 3D Satellite View
  const [heading, setHeading] = useState(0)
  const [showMeasurements, setShowMeasurements] = useState(true)

  // Base footprint (Foundation / Eaves)
  const [basePolygon, setBasePolygon] = useState<google.maps.LatLngLiteral[]>([])
  const [baseAreaSqFt, setBaseAreaSqFt] = useState(0)
  const [baseSegments, setBaseSegments] = useState<{ mid: google.maps.LatLngLiteral; length: string; distFeet: number }[]>([])

  // Roof Configuration (Geometric Figures from Satellite Analysis + Optional Customization)
  const [roofType, setRoofType] = useState<RoofType>('hip')
  const [orientation, setOrientation] = useState<RidgeOrientation>('horizontal')
  const [has3DStructure, setHas3DStructure] = useState(false)
  const [roofHeightFt, setRoofHeightFt] = useState<number>(8.0)

  // Per-Point Roof Height State (when touching any point on the map)
  const [pointHeights, setPointHeights] = useState<number[]>([])
  const [selectedPointIdx, setSelectedPointIdx] = useState<number | null>(null)

  // Interactive Semi-3D Wireframe Viewer State
  const [showSemi3D, setShowSemi3D] = useState(true)
  const [isSemi3DExpanded, setIsSemi3DExpanded] = useState(false)

  // Collapsible manual point customization (hidden by default so geometric figure selection comes first)
  const [showCustomizePoints, setShowCustomizePoints] = useState(false)

  // Draggable Depth Points (Cumbreras / Ridges)
  const [ridgePoints, setRidgePoints] = useState<google.maps.LatLngLiteral[]>([])
  // Interactive Click-to-add mode
  const [clickMode, setClickMode] = useState<'none' | 'ridge' | 'corner'>('none')

  // Generated Sloped 3D Faces
  const [slopeFaces, setSlopeFaces] = useState<{
    id: string
    name: string
    path: google.maps.LatLngLiteral[]
    areaSqFt: number
    color: { fill: string; stroke: string }
    ridgeIndices: number[]
  }[]>([])

  // Computed Ridge Lines & Total Linear Feet (Ridge Caps)
  const [ridgeLines, setRidgeLines] = useState<RidgeLine[]>([])
  const [totalRidgeCapLength, setTotalRidgeCapLength] = useState<number>(0)

  // Imperative reference to all active Google Maps overlays to guarantee ZERO ghost lines
  const overlaysRef = useRef<{
    polygons: google.maps.Polygon[]
    polylines: google.maps.Polyline[]
  }>({
    polygons: [],
    polylines: []
  })

  // Callback refs to prevent re-render loops
  const onAreaChangeRef = useRef(onAreaChange)
  onAreaChangeRef.current = onAreaChange
  const onFacetsChangeRef = useRef(onFacetsChange)
  onFacetsChangeRef.current = onFacetsChange
  const prevReportRef = useRef({ total: -1, facetsCount: -1, baseArea: -1, totalRidge: -1, type: '' })

  // Zoom & Magnifier Controls
  const [currentZoom, setCurrentZoom] = useState(21)
  const [zoomMagnify, setZoomMagnify] = useState<number>(1)
  const lastCenteredAddressRef = useRef<string | null>(null)

  // Center & zoom ONLY when a new address is searched
  useEffect(() => {
    if (addressCoordinates && map) {
      const addressKey = `${addressCoordinates.lat.toFixed(6)},${addressCoordinates.lng.toFixed(6)}`
      if (addressKey !== lastCenteredAddressRef.current) {
        lastCenteredAddressRef.current = addressKey
        map.setCenter(addressCoordinates)
        map.setMapTypeId('satellite')
        map.setTilt(45)

        if (typeof window !== 'undefined' && window.google?.maps?.MaxZoomService) {
          const maxZoomService = new window.google.maps.MaxZoomService()
          maxZoomService.getMaxZoomAtLatLng(addressCoordinates, (result) => {
            if (result && result.status === 'OK' && result.zoom) {
              const target = Math.min(result.zoom, 22)
              map.setZoom(target)
              setCurrentZoom(target)
            } else {
              map.setZoom(21)
              setCurrentZoom(21)
            }
          })
        } else {
          map.setZoom(21)
          setCurrentZoom(21)
        }
      }
    }
  }, [addressCoordinates, map])

  // Helper: compute area and OUTWARD-OFFSET segment labels so text never overlaps points
  const computePolygonMetrics = useCallback((path: google.maps.LatLngLiteral[]) => {
    if (!window.google?.maps?.geometry || path.length < 3) {
      return { area: 0, segments: [] }
    }

    const areaSqMeters = window.google.maps.geometry.spherical.computeArea(
      path.map(p => new window.google.maps.LatLng(p.lat, p.lng))
    )
    const area = areaSqMeters * 10.7639

    const centerLat = path.reduce((sum, p) => sum + p.lat, 0) / path.length
    const centerLng = path.reduce((sum, p) => sum + p.lng, 0) / path.length
    const cosLat = Math.cos((centerLat * Math.PI) / 180) || 1

    const segments: { mid: google.maps.LatLngLiteral; length: string; distFeet: number }[] = []
    for (let i = 0; i < path.length; i++) {
      const p1 = path[i]
      const p2 = path[(i + 1) % path.length]
      const l1 = new window.google.maps.LatLng(p1.lat, p1.lng)
      const l2 = new window.google.maps.LatLng(p2.lat, p2.lng)
      const distFeet = window.google.maps.geometry.spherical.computeDistanceBetween(l1, l2) * 3.28084

      const midLat = (p1.lat + p2.lat) / 2
      const midLng = (p1.lng + p2.lng) / 2

      // Compute outward normal vector from polygon edge so labels sit cleanly outside the roof perimeter
      const dx = (p2.lng - p1.lng) * cosLat
      const dy = p2.lat - p1.lat
      const len = Math.sqrt(dx * dx + dy * dy) || 1
      let nx = -dy / len
      let ny = dx / len

      // Ensure normal points away from polygon centroid
      const toMidX = (midLng - centerLng) * cosLat
      const toMidY = midLat - centerLat
      if (nx * toMidX + ny * toMidY < 0) {
        nx = -nx
        ny = -ny
      }

      // Push label ~8.5 ft outward from the edge
      const offsetDeg = 0.000024
      const labelLat = midLat + ny * offsetDeg
      const labelLng = midLng + (nx * offsetDeg) / cosLat

      segments.push({
        mid: { lat: labelLat, lng: labelLng },
        length: `${distFeet.toFixed(1)} ${unitDist}`,
        distFeet
      })
    }

    return { area, segments }
  }, [unitDist])

  // Compute current bounding box center & half-extents of existing basePolygon
  const getCurrentFootprintBounds = useCallback((poly: google.maps.LatLngLiteral[]) => {
    if (poly.length === 0) {
      return { centerLat: initialCenter.lat, centerLng: initialCenter.lng, halfLat: 0.000084, halfLng: 0.000108 }
    }
    let minLat = Infinity
    let maxLat = -Infinity
    let minLng = Infinity
    let maxLng = -Infinity
    for (const p of poly) {
      if (p.lat < minLat) minLat = p.lat
      if (p.lat > maxLat) maxLat = p.lat
      if (p.lng < minLng) minLng = p.lng
      if (p.lng > maxLng) maxLng = p.lng
    }
    const centerLat = (minLat + maxLat) / 2
    const centerLng = (minLng + maxLng) / 2
    const halfLat = Math.max(0.000055, (maxLat - minLat) / 2)
    const halfLng = Math.max(0.000068, (maxLng - minLng) / 2)
    return { centerLat, centerLng, halfLat, halfLng }
  }, [])

  // Sync initialEstimate when loaded from URL
  const initialLoadedRef = useRef(false)
  useEffect(() => {
    if (initialEstimate && !initialLoadedRef.current) {
      initialLoadedRef.current = true
      if (initialEstimate.basePolygon && initialEstimate.basePolygon.length >= 3) {
        setBasePolygon(initialEstimate.basePolygon)
        const { area, segments } = computePolygonMetrics(initialEstimate.basePolygon)
        setBaseAreaSqFt(area)
        setBaseSegments(segments)
      }
      const initH = initialEstimate.roofHeightFt || 8.0
      if (initialEstimate.ridgePoints && initialEstimate.ridgePoints.length > 0) {
        setRidgePoints(initialEstimate.ridgePoints)
        setPointHeights(initialEstimate.ridgePoints.map(() => initH))
      }
      if (initialEstimate.roofType) setRoofType(initialEstimate.roofType)
      if (initialEstimate.orientation) setOrientation(initialEstimate.orientation)
      setRoofHeightFt(initH)
      setHas3DStructure(true)
    }
  }, [initialEstimate, computePolygonMetrics])

  // Keep pointHeights array length synced with ridgePoints
  useEffect(() => {
    setPointHeights(prev => {
      if (prev.length === ridgePoints.length) return prev
      return ridgePoints.map((_, idx) => (prev[idx] !== undefined ? prev[idx] : roofHeightFt))
    })
    if (selectedPointIdx !== null && selectedPointIdx >= ridgePoints.length) {
      setSelectedPointIdx(ridgePoints.length > 0 ? 0 : null)
    }
  }, [ridgePoints.length, roofHeightFt, selectedPointIdx])

  // Emit roof geometry state to parent for live shareable link
  useEffect(() => {
    if (basePolygon.length >= 3) {
      onStateExport?.({
        basePolygon,
        ridgePoints,
        roofType,
        orientation,
        roofHeightFt
      })
    }
  }, [basePolygon, ridgePoints, roofType, orientation, roofHeightFt, onStateExport])

  // Build Clean Architectural Geometry using Topological Shape Templates or Custom Multi-Point
  const buildRoofGeometry = useCallback((
    base: google.maps.LatLngLiteral[],
    type: RoofType,
    pts: google.maps.LatLngLiteral[]
  ) => {
    if (base.length < 3 || pts.length === 0 || !window.google?.maps?.geometry) {
      return { faces: [], lines: [], totalRidgeCap: 0 }
    }

    const faces: {
      id: string
      name: string
      path: google.maps.LatLngLiteral[]
      areaSqFt: number
      color: { fill: string; stroke: string }
      ridgeIndices: number[]
    }[] = []
    const lines: RidgeLine[] = []
    let totalCap = 0

    const calcDistFt = (ptA: google.maps.LatLngLiteral, ptB: google.maps.LatLngLiteral) => {
      const lA = new window.google.maps.LatLng(ptA.lat, ptA.lng)
      const lB = new window.google.maps.LatLng(ptB.lat, ptB.lng)
      return window.google.maps.geometry.spherical.computeDistanceBetween(lA, lB) * 3.28084
    }

    const calcAreaSqFt = (path: google.maps.LatLngLiteral[]) => {
      return window.google.maps.geometry.spherical.computeArea(
        path.map(p => new window.google.maps.LatLng(p.lat, p.lng))
      ) * 10.7639
    }

    const tpl = ROOF_SHAPE_TEMPLATES[type]

    // 1. EXACT TOPOLOGICAL GEOMETRIC TEMPLATE (Preserves triangles/cumbreras when dragging!)
    if (
      tpl &&
      type !== 'custom' &&
      base.length === tpl.baseCoords.length &&
      pts.length === tpl.ridgeCoords.length
    ) {
      for (const faceDef of tpl.faces) {
        const fPath: google.maps.LatLngLiteral[] = []
        const rIndices: number[] = []
        for (const token of faceDef.vertices) {
          const resolved = resolveVertexToken(token, base, pts)
          if (resolved) fPath.push(resolved)
          if (token.startsWith('r')) {
            const rIdx = parseInt(token.slice(1), 10)
            if (!isNaN(rIdx)) rIndices.push(rIdx)
          }
        }
        if (fPath.length >= 3) {
          faces.push({
            id: faceDef.id,
            name: lang === 'en' ? faceDef.nameEn : faceDef.nameEs,
            path: fPath,
            areaSqFt: calcAreaSqFt(fPath),
            color: VELTOS_FACET_COLORS[faceDef.colorIndex % VELTOS_FACET_COLORS.length],
            ridgeIndices: rIndices
          })
        }
      }

      for (const lineDef of tpl.lines) {
        const pFrom = resolveVertexToken(lineDef.from, base, pts)
        const pTo = resolveVertexToken(lineDef.to, base, pts)
        if (pFrom && pTo) {
          const d = calcDistFt(pFrom, pTo)
          totalCap += d
          lines.push({
            id: lineDef.id,
            path: [pFrom, pTo],
            lengthFt: `${d.toFixed(1)} ${unitDist}`,
            lengthValue: d,
            isMainRidge: lineDef.isMainRidge
          })
        }
      }

      return { faces, lines, totalRidgeCap: totalCap }
    }

    // 2. FALLBACK / FREEFORM CUSTOM MULTI-POINT BUILDER
    if (pts.length === 1) {
      const apex = pts[0]
      for (let i = 0; i < base.length; i++) {
        const pA = base[i]
        const pB = base[(i + 1) % base.length]
        const fPath = [pA, pB, apex]
        faces.push({
          id: `pyr-slope-${i}`,
          name: `Slope ${i + 1}`,
          path: fPath,
          areaSqFt: calcAreaSqFt(fPath),
          color: VELTOS_FACET_COLORS[i % VELTOS_FACET_COLORS.length],
          ridgeIndices: [0]
        })

        const d = calcDistFt(pA, apex)
        totalCap += d
        lines.push({
          id: `pyr-hip-${i}`,
          path: [pA, apex],
          lengthFt: `${d.toFixed(1)} ${unitDist}`,
          lengthValue: d
        })
      }
    } else {
      // Connect ridge network
      for (let i = 0; i < pts.length - 1; i++) {
        const pA = pts[i]
        const pB = pts[i + 1]
        const d = calcDistFt(pA, pB)
        totalCap += d
        lines.push({
          id: `custom-ridge-${i}`,
          path: [pA, pB],
          lengthFt: `${d.toFixed(1)} ${unitDist}`,
          lengthValue: d,
          isMainRidge: true
        })
      }

      // Connect eaves to nearest ridge vertices
      for (let i = 0; i < base.length; i++) {
        const bA = base[i]
        const bB = base[(i + 1) % base.length]

        let idxA = 0
        let minDA = Infinity
        let idxB = 0
        let minDB = Infinity

        for (let j = 0; j < pts.length; j++) {
          const dA = calcDistFt(bA, pts[j])
          if (dA < minDA) {
            minDA = dA
            idxA = j
          }
          const dB = calcDistFt(bB, pts[j])
          if (dB < minDB) {
            minDB = dB
            idxB = j
          }
        }

        const fPath = idxA === idxB ? [bA, bB, pts[idxA]] : [bA, bB, pts[idxB], pts[idxA]]

        faces.push({
          id: `custom-face-${i}`,
          name: `Slope Facet ${i + 1}`,
          path: fPath,
          areaSqFt: calcAreaSqFt(fPath),
          color: VELTOS_FACET_COLORS[i % VELTOS_FACET_COLORS.length],
          ridgeIndices: idxA === idxB ? [idxA] : [idxA, idxB]
        })

        const dHip = calcDistFt(bA, pts[idxA])
        lines.push({
          id: `custom-hip-${i}`,
          path: [bA, pts[idxA]],
          lengthFt: `${dHip.toFixed(1)} ${unitDist}`,
          lengthValue: dHip
        })
      }
    }

    return { faces, lines, totalRidgeCap: totalCap }
  }, [lang, unitDist])

  // Imperative Overlay Synchronizer: CLEAR PREVIOUS OVERLAYS BEFORE DRAWING NEW ONES!
  useEffect(() => {
    if (!map || !window.google?.maps) return

    overlaysRef.current.polygons.forEach(p => p.setMap(null))
    overlaysRef.current.polygons = []
    overlaysRef.current.polylines.forEach(l => l.setMap(null))
    overlaysRef.current.polylines = []

    if (basePolygon.length < 3 || ridgePoints.length === 0) return

    const { faces, lines, totalRidgeCap } = buildRoofGeometry(basePolygon, roofType, ridgePoints)

    const newPolygons = faces.map(face => {
      return new window.google.maps.Polygon({
        paths: face.path,
        map: map,
        fillColor: face.color.fill,
        fillOpacity: 0.35,
        strokeColor: face.color.stroke,
        strokeOpacity: 0.85,
        strokeWeight: 1.75,
        clickable: false,
        zIndex: 10
      })
    })

    const newPolylines = lines.map(line => {
      return new window.google.maps.Polyline({
        path: line.path,
        map: map,
        strokeColor: line.isMainRidge ? '#1d4ed8' : '#2563eb',
        strokeOpacity: 0.95,
        strokeWeight: line.isMainRidge ? 3 : 2,
        clickable: false,
        zIndex: 20
      })
    })

    overlaysRef.current.polygons = newPolygons
    overlaysRef.current.polylines = newPolylines

    setSlopeFaces(faces)
    setRidgeLines(lines)
    setTotalRidgeCapLength(totalRidgeCap)

    return () => {
      newPolygons.forEach(p => p.setMap(null))
      newPolylines.forEach(l => l.setMap(null))
    }
  }, [map, basePolygon, ridgePoints, roofType, buildRoofGeometry])

  // Switch Geometric House Figure seamlessly
  const handleSelectRoofType = (newType: RoofType) => {
    setRoofType(newType)
    if (newType === 'custom') {
      setShowCustomizePoints(true)
      return
    }
    if (basePolygon.length >= 3) {
      const { centerLat, centerLng, halfLat, halfLng } = getCurrentFootprintBounds(basePolygon)
      const { basePolygon: nextBase, ridgePoints: nextRidge } = generateTemplateLatLngs(
        newType,
        orientation,
        centerLat,
        centerLng,
        halfLat,
        halfLng
      )
      setBasePolygon(nextBase)
      setRidgePoints(nextRidge)
      setPointHeights(nextRidge.map(() => roofHeightFt))
      setSelectedPointIdx(null)
      const { area, segments } = computePolygonMetrics(nextBase)
      setBaseAreaSqFt(area)
      setBaseSegments(segments)
    }
  }

  // Rotate Geometric Figure (0°, 90°, 180°, 270°)
  const handleToggleOrientation = (newOrient: RidgeOrientation) => {
    setOrientation(newOrient)
    if (basePolygon.length >= 3 && roofType !== 'custom') {
      const { centerLat, centerLng, halfLat, halfLng } = getCurrentFootprintBounds(basePolygon)
      const { basePolygon: nextBase, ridgePoints: nextRidge } = generateTemplateLatLngs(
        roofType,
        newOrient,
        centerLat,
        centerLng,
        halfLat,
        halfLng
      )
      setBasePolygon(nextBase)
      setRidgePoints(nextRidge)
      const { area, segments } = computePolygonMetrics(nextBase)
      setBaseAreaSqFt(area)
      setBaseSegments(segments)
    }
  }

  // Add an Extra Depth Point to the Ridge
  const handleAddRidgePoint = () => {
    if (ridgePoints.length === 0) return
    const lastPt = ridgePoints[ridgePoints.length - 1]
    const centerLat = basePolygon.reduce((s, p) => s + p.lat, 0) / basePolygon.length
    const centerLng = basePolygon.reduce((s, p) => s + p.lng, 0) / basePolygon.length

    const newPt: google.maps.LatLngLiteral = {
      lat: lastPt.lat + (lastPt.lat - centerLat) * 0.4 + 0.000018,
      lng: lastPt.lng + (lastPt.lng - centerLng) * 0.4 + 0.000018
    }

    setRoofType('custom')
    setRidgePoints(prev => [...prev, newPt])
    setPointHeights(prev => [...prev, roofHeightFt])
    setSelectedPointIdx(ridgePoints.length)
  }

  // Remove the Last Ridge Point
  const handleRemoveRidgePoint = () => {
    if (ridgePoints.length <= 1) return
    setRoofType('custom')
    setRidgePoints(prev => prev.slice(0, prev.length - 1))
    setPointHeights(prev => prev.slice(0, prev.length - 1))
  }

  // Add an Extra Corner to the Eaves
  const handleAddCorner = () => {
    if (basePolygon.length < 3) return
    let maxDist = 0
    let insertIdx = 0
    let midInsert = basePolygon[0]

    for (let i = 0; i < basePolygon.length; i++) {
      const pA = basePolygon[i]
      const pB = basePolygon[(i + 1) % basePolygon.length]
      const lA = new window.google.maps.LatLng(pA.lat, pA.lng)
      const lB = new window.google.maps.LatLng(pB.lat, pB.lng)
      const d = window.google.maps.geometry.spherical.computeDistanceBetween(lA, lB)
      if (d > maxDist) {
        maxDist = d
        insertIdx = i + 1
        const mid = window.google.maps.geometry.spherical.interpolate(lA, lB, 0.5)
        midInsert = { lat: mid.lat(), lng: mid.lng() }
      }
    }

    const updated = [...basePolygon]
    updated.splice(insertIdx, 0, midInsert)
    setRoofType('custom')
    setBasePolygon(updated)
    const { area, segments } = computePolygonMetrics(updated)
    setBaseAreaSqFt(area)
    setBaseSegments(segments)
  }

  // Remove Last Corner
  const handleRemoveCorner = () => {
    if (basePolygon.length <= 3) return
    const updated = basePolygon.slice(0, basePolygon.length - 1)
    setRoofType('custom')
    setBasePolygon(updated)
    const { area, segments } = computePolygonMetrics(updated)
    setBaseAreaSqFt(area)
    setBaseSegments(segments)
  }

  // Adjust Height of Selected Point (or All Points if none selected)
  const handleUpdatePointHeight = (ptIdx: number, nextHeight: number) => {
    const clamped = Math.max(2, Math.min(28, Number(nextHeight.toFixed(1))))
    setPointHeights(prev => {
      const next = [...prev]
      next[ptIdx] = clamped
      const avg = next.reduce((s, h) => s + h, 0) / (next.length || 1)
      setRoofHeightFt(Number(avg.toFixed(1)))
      return next
    })
  }

  // Adjust Height of Multiple Points Simultaneously (when a Vector is selected in the 3D Isometric view)
  const handleUpdateMultiplePointsHeight = (ptIndices: number[], nextHeight: number) => {
    const clamped = Math.max(2, Math.min(28, Number(nextHeight.toFixed(1))))
    setPointHeights(prev => {
      const next = [...prev]
      ptIndices.forEach(idx => {
        if (idx >= 0 && idx < next.length) next[idx] = clamped
      })
      const avg = next.reduce((s, h) => s + h, 0) / (next.length || 1)
      setRoofHeightFt(Number(avg.toFixed(1)))
      return next
    })
  }

  // Shift Height of Multiple Points by Delta (when dragging a Vector vertically in 3D)
  const handleDeltaMultiplePointsHeight = (ptIndices: number[], deltaFt: number) => {
    setPointHeights(prev => {
      const next = [...prev]
      ptIndices.forEach(idx => {
        if (idx >= 0 && idx < next.length) {
          const cur = next[idx] ?? roofHeightFt
          next[idx] = Math.max(2, Math.min(28, Number((cur + deltaFt).toFixed(1))))
        }
      })
      const avg = next.reduce((s, h) => s + h, 0) / (next.length || 1)
      setRoofHeightFt(Number(avg.toFixed(1)))
      return next
    })
  }

  // Apply Selected Point's Height to All Points
  const handleApplyHeightToAll = (heightVal: number) => {
    const clamped = Math.max(2, Math.min(28, Number(heightVal.toFixed(1))))
    setPointHeights(ridgePoints.map(() => clamped))
    setRoofHeightFt(clamped)
  }

  // Adjust Global Height (Pitch)
  const handleAdjustHeight = (deltaFt: number) => {
    if (selectedPointIdx !== null && pointHeights[selectedPointIdx] !== undefined) {
      handleUpdatePointHeight(selectedPointIdx, pointHeights[selectedPointIdx] + deltaFt)
    } else {
      const nextH = Math.max(2, Math.min(28, Number((roofHeightFt + deltaFt).toFixed(1))))
      handleApplyHeightToAll(nextH)
    }
  }

  // Real-time Pitched Area Calculation Incorporating Individual Point Heights
  useEffect(() => {
    let effectivePitchedTotal = 0
    let allFacets: FacetItem[] = []

    if (has3DStructure && baseAreaSqFt > 0) {
      const halfSpan = Math.max(5, Math.sqrt(baseAreaSqFt) / 2)
      let rawFacesSum = 0
      let pitchedFacesSum = 0

      allFacets = slopeFaces.map(s => {
        const facetHeights = s.ridgeIndices
          .map(idx => pointHeights[idx])
          .filter(h => h !== undefined)
        const facetH =
          facetHeights.length > 0
            ? facetHeights.reduce((sum, h) => sum + h, 0) / facetHeights.length
            : roofHeightFt
        const facetMult = Math.sqrt(1 + Math.pow(facetH / halfSpan, 2))
        const pitchedFacetArea = s.areaSqFt * facetMult
        rawFacesSum += s.areaSqFt
        pitchedFacesSum += pitchedFacetArea

        return {
          id: s.id,
          name: s.name,
          path: s.path,
          areaSqFt: pitchedFacetArea,
          color: s.color,
          segments: []
        }
      })

      if (rawFacesSum > 0) {
        const weightedMult = pitchedFacesSum / rawFacesSum
        effectivePitchedTotal = baseAreaSqFt * weightedMult
      } else {
        const multiplier = Math.sqrt(1 + Math.pow(roofHeightFt / halfSpan, 2))
        effectivePitchedTotal = baseAreaSqFt * multiplier
      }
    } else {
      effectivePitchedTotal = baseAreaSqFt
    }

    const roundedTotal = Math.round(effectivePitchedTotal)
    const roundedBase = Math.round(baseAreaSqFt)
    const roundedRidge = Math.round(totalRidgeCapLength * 10) / 10

    if (
      roundedTotal !== prevReportRef.current.total ||
      allFacets.length !== prevReportRef.current.facetsCount ||
      roundedBase !== prevReportRef.current.baseArea ||
      roundedRidge !== prevReportRef.current.totalRidge ||
      roofType !== prevReportRef.current.type
    ) {
      prevReportRef.current = {
        total: roundedTotal,
        facetsCount: allFacets.length,
        baseArea: roundedBase,
        totalRidge: roundedRidge,
        type: roofType
      }
      onAreaChangeRef.current(effectivePitchedTotal)
      onFacetsChangeRef.current?.(allFacets, 'specs', baseAreaSqFt, totalRidgeCapLength, roofType, effectivePitchedTotal)
    }
  }, [has3DStructure, slopeFaces, baseAreaSqFt, totalRidgeCapLength, roofType, roofHeightFt, pointHeights])

  // Camera Rotate
  const handleRotate90 = () => {
    if (!map) return
    const nextHeading = (heading + 90) % 360
    setHeading(nextHeading)
    map.setHeading(nextHeading)
  }

  // Precision Zoom Controls
  const handleZoomIn = () => {
    if (!map) return
    const current = map.getZoom() || 20
    const next = Math.min(current + 0.5, 22)
    map.setZoom(next)
    setCurrentZoom(next)
  }

  const handleZoomOut = () => {
    if (!map) return
    const current = map.getZoom() || 20
    const next = Math.max(current - 0.5, 12)
    map.setZoom(next)
    setCurrentZoom(next)
  }

  // Handle map click
  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (!e.latLng || !window.google?.maps?.geometry) return
    const lat = e.latLng.lat()
    const lng = e.latLng.lng()

    // 1. Initial click creates the selected geometric roof figure centered at click point (Realistic house scale ~1,450 sq ft)
    if (basePolygon.length === 0) {
      const halfLat = 0.000084
      const halfLng = 0.000105 / Math.cos(lat * Math.PI / 180)
      const { basePolygon: initialBase, ridgePoints: initialRidges } = generateTemplateLatLngs(
        roofType === 'custom' ? 'hip' : roofType,
        orientation,
        lat,
        lng,
        halfLat,
        halfLng
      )
      const { area, segments } = computePolygonMetrics(initialBase)
      setBasePolygon(initialBase)
      setBaseAreaSqFt(area)
      setBaseSegments(segments)
      setRidgePoints(initialRidges)
      setPointHeights(initialRidges.map(() => roofHeightFt))
      setHas3DStructure(true)
      return
    }

    // 2. Click-to-add Ridge Point mode
    if (clickMode === 'ridge') {
      const nextIdx = ridgePoints.length
      setRidgePoints(prev => [...prev, { lat, lng }])
      setPointHeights(prev => [...prev, roofHeightFt])
      setSelectedPointIdx(nextIdx)
      setRoofType('custom')
      setClickMode('none')
      return
    }

    // 3. Click-to-add Eaves Corner mode
    if (clickMode === 'corner') {
      let minD = Infinity
      let insertIdx = 0
      for (let i = 0; i < basePolygon.length; i++) {
        const pA = basePolygon[i]
        const pB = basePolygon[(i + 1) % basePolygon.length]
        const mid = { lat: (pA.lat + pB.lat) / 2, lng: (pA.lng + pB.lng) / 2 }
        const d = (mid.lat - lat) ** 2 + (mid.lng - lng) ** 2
        if (d < minD) {
          minD = d
          insertIdx = i + 1
        }
      }
      const updated = [...basePolygon]
      updated.splice(insertIdx, 0, { lat, lng })
      setBasePolygon(updated)
      const { area, segments } = computePolygonMetrics(updated)
      setBaseAreaSqFt(area)
      setBaseSegments(segments)
      setRoofType('custom')
      setClickMode('none')
      return
    }
  }

  // Drag any corner of the eaves
  const handleCornerDrag = (index: number, e: google.maps.MapMouseEvent) => {
    if (!e.latLng || basePolygon.length < 3) return
    const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() }
    const updatedBase = [...basePolygon]
    updatedBase[index] = newPos
    setBasePolygon(updatedBase)

    const { area, segments } = computePolygonMetrics(updatedBase)
    setBaseAreaSqFt(area)
    setBaseSegments(segments)
  }

  // Drag any depth point
  const handleRidgePointDrag = (pointIndex: number, e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return
    const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() }

    setRidgePoints(prev => {
      const updated = [...prev]
      updated[pointIndex] = newPos
      return updated
    })
  }

  // Touching/Clicking a corner selects the nearest ridge point so its height can be modified immediately
  const handleCornerClick = (cornerIdx: number) => {
    if (ridgePoints.length === 0) return
    const corner = basePolygon[cornerIdx]
    if (!corner) {
      setSelectedPointIdx(0)
      return
    }
    let nearestIdx = 0
    let minD = Infinity
    ridgePoints.forEach((rp, idx) => {
      const d = (rp.lat - corner.lat) ** 2 + (rp.lng - corner.lng) ** 2
      if (d < minD) {
        minD = d
        nearestIdx = idx
      }
    })
    setSelectedPointIdx(nearestIdx)
  }

  const handleResetAll = () => {
    overlaysRef.current.polygons.forEach(p => p.setMap(null))
    overlaysRef.current.polygons = []
    overlaysRef.current.polylines.forEach(l => l.setMap(null))
    overlaysRef.current.polylines = []

    setBasePolygon([])
    setBaseAreaSqFt(0)
    setBaseSegments([])
    setHas3DStructure(false)
    setRidgePoints([])
    setPointHeights([])
    setSelectedPointIdx(null)
    setSlopeFaces([])
    setRidgeLines([])
    setTotalRidgeCapLength(0)
    setClickMode('none')
  }

  // Complete Catalog of 30 Geometric House Figures (Original 12 + 6 V2 + 4 V3 + 8 Minnesota Classics)
  const roofModels: {
    id: RoofType
    label: string
    sublabel: string
    description: string
  }[] = [
    { id: 'hip', label: t.models.hip.label, sublabel: t.models.hip.sublabel, description: t.models.hip.desc },
    { id: 'pyramid', label: t.models.pyramid.label, sublabel: t.models.pyramid.sublabel, description: t.models.pyramid.desc },
    { id: 'mn-split-level', label: t.models.mnSplitLevel.label, sublabel: t.models.mnSplitLevel.sublabel, description: t.models.mnSplitLevel.desc },
    { id: 'mn-rambler-garage', label: t.models.mnRamblerGarage.label, sublabel: t.models.mnRamblerGarage.sublabel, description: t.models.mnRamblerGarage.desc },
    { id: 'mn-suburban-3car', label: t.models.mnSuburban3Car.label, sublabel: t.models.mnSuburban3Car.sublabel, description: t.models.mnSuburban3Car.desc },
    { id: 'mn-tudor-steep', label: t.models.mnTudorSteep.label, sublabel: t.models.mnTudorSteep.sublabel, description: t.models.mnTudorSteep.desc },
    { id: 'mn-craftsman-bungalow', label: t.models.mnCraftsmanBungalow.label, sublabel: t.models.mnCraftsmanBungalow.sublabel, description: t.models.mnCraftsmanBungalow.desc },
    { id: 'mn-dutch-colonial', label: t.models.mnDutchColonial.label, sublabel: t.models.mnDutchColonial.sublabel, description: t.models.mnDutchColonial.desc },
    { id: 'mn-courtyard-u', label: t.models.mnCourtyardU.label, sublabel: t.models.mnCourtyardU.sublabel, description: t.models.mnCourtyardU.desc },
    { id: 'mn-lake-prow', label: t.models.mnLakeProw.label, sublabel: t.models.mnLakeProw.sublabel, description: t.models.mnLakeProw.desc },
    { id: 'front-peak', label: t.models.frontPeak.label, sublabel: t.models.frontPeak.sublabel, description: t.models.frontPeak.desc },
    { id: 'cruciform', label: t.models.cruciform.label, sublabel: t.models.cruciform.sublabel, description: t.models.cruciform.desc },
    { id: 'twin-opposing', label: t.models.twinOpposing.label, sublabel: t.models.twinOpposing.sublabel, description: t.models.twinOpposing.desc },
    { id: 'hip-dormers', label: t.models.hipDormers.label, sublabel: t.models.hipDormers.sublabel, description: t.models.hipDormers.desc },
    { id: 't-gable-hip', label: t.models.tGableHip.label, sublabel: t.models.tGableHip.sublabel, description: t.models.tGableHip.desc },
    { id: 'compound-hip', label: t.models.compoundHip.label, sublabel: t.models.compoundHip.sublabel, description: t.models.compoundHip.desc },
    { id: 'cross-gable', label: t.models.crossGable.label, sublabel: t.models.crossGable.sublabel, description: t.models.crossGable.desc },
    { id: 'l-shape-wing', label: t.models.lShapeWing.label, sublabel: t.models.lShapeWing.sublabel, description: t.models.lShapeWing.desc },
    { id: 'multi-wing', label: t.models.multiWing.label, sublabel: t.models.multiWing.sublabel, description: t.models.multiWing.desc },
    { id: 'v2-asym-cross', label: t.models.v2AsymCross.label, sublabel: t.models.v2AsymCross.sublabel, description: t.models.v2AsymCross.desc },
    { id: 'v2-t-wing', label: t.models.v2TWing.label, sublabel: t.models.v2TWing.sublabel, description: t.models.v2TWing.desc },
    { id: 'v2-oct-turret', label: t.models.v2OctTurret.label, sublabel: t.models.v2OctTurret.sublabel, description: t.models.v2OctTurret.desc },
    { id: 'v2-stepped-hip', label: t.models.v2SteppedHip.label, sublabel: t.models.v2SteppedHip.sublabel, description: t.models.v2SteppedHip.desc },
    { id: 'v2-hip-6-dormers', label: t.models.v2Hip6Dormers.label, sublabel: t.models.v2Hip6Dormers.sublabel, description: t.models.v2Hip6Dormers.desc },
    { id: 'v2-offset-dormers', label: t.models.v2OffsetDormers.label, sublabel: t.models.v2OffsetDormers.sublabel, description: t.models.v2OffsetDormers.desc },
    { id: 'v3-stepped-t', label: t.models.v3SteppedT.label, sublabel: t.models.v3SteppedT.sublabel, description: t.models.v3SteppedT.desc },
    { id: 'v3-triple-dormer', label: t.models.v3TripleDormer.label, sublabel: t.models.v3TripleDormer.sublabel, description: t.models.v3TripleDormer.desc },
    { id: 'v3-wing-twin-gables', label: t.models.v3WingTwinGables.label, sublabel: t.models.v3WingTwinGables.sublabel, description: t.models.v3WingTwinGables.desc },
    { id: 'v3-wing-2-dormers', label: t.models.v3Wing2Dormers.label, sublabel: t.models.v3Wing2Dormers.sublabel, description: t.models.v3Wing2Dormers.desc },
    { id: 'gable', label: t.models.gable.label, sublabel: t.models.gable.sublabel, description: t.models.gable.desc },
  ]

  const orientationOptions: { id: RidgeOrientation; label: string }[] = [
    { id: 'horizontal', label: '0°' },
    { id: 'vertical', label: '90°' },
    { id: 'horizontal-flip', label: '180°' },
    { id: 'vertical-flip', label: '270°' },
  ]

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-100 text-red-500 rounded-xl p-4 text-center">
        {t.mapError}
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-100 rounded-xl animate-pulse">
        {t.loadingMap}
      </div>
    )
  }

  const areaMetersSq = (baseAreaSqFt / 10.7639).toFixed(1)
  const activePointHeight =
    selectedPointIdx !== null && pointHeights[selectedPointIdx] !== undefined
      ? pointHeights[selectedPointIdx]
      : roofHeightFt

  return (
    <div className="relative w-full h-[540px] md:h-full min-h-[480px]">
      {/* Top Floating Action Bar: Clean White & Blue Controls */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
        {/* Precision Zoom Controls (+ / -) */}
        <div className="flex items-center bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl overflow-hidden shadow-md">
          <button
            onClick={handleZoomOut}
            className="px-2 py-1.5 hover:bg-blue-50 text-slate-700 hover:text-blue-600 transition-colors cursor-pointer"
            title={t.zoomOutTitle}
          >
            <ZoomOut size={13} />
          </button>
          <span className="text-[10px] font-bold text-slate-700 px-1 select-none">
            {currentZoom.toFixed(1)}x
          </span>
          <button
            onClick={handleZoomIn}
            className="px-2 py-1.5 hover:bg-blue-50 text-slate-700 hover:text-blue-600 transition-colors cursor-pointer"
            title={t.zoomInTitle}
          >
            <ZoomIn size={13} />
          </button>
        </div>

        {/* Magnifier (White & Blue) */}
        <button
          onClick={() => setZoomMagnify(prev => (prev === 1 ? 1.5 : prev === 1.5 ? 2 : 1))}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold shadow-md transition-all border cursor-pointer ${
            zoomMagnify > 1
              ? 'bg-blue-600 text-white border-blue-700 shadow-blue-200'
              : 'bg-white/95 backdrop-blur-md hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200'
          }`}
          title="Digital magnifier (1x, 1.5x, 2x)"
        >
          <span>{t.magnifier}: {zoomMagnify}x</span>
        </button>

        {/* Toggle Measurements */}
        <button
          onClick={() => setShowMeasurements(!showMeasurements)}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold shadow-md transition-all border cursor-pointer ${
            showMeasurements
              ? 'bg-blue-600 text-white border-blue-700'
              : 'bg-white/95 text-slate-500 border-slate-200 hover:bg-slate-50'
          }`}
          title={t.measurementsToggleTitle}
        >
          <span>{showMeasurements ? t.measurementsOn : t.measurementsOff}</span>
        </button>

        {/* Toggle Semi-3D Wireframe Viewer */}
        {basePolygon.length > 0 && (
          <button
            onClick={() => setShowSemi3D(prev => !prev)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold shadow-md transition-all border cursor-pointer ${
              showSemi3D
                ? 'bg-black text-white border-neutral-800'
                : 'bg-white/95 text-slate-700 border-slate-200 hover:bg-blue-50 hover:text-blue-600'
            }`}
            title={lang === 'en' ? 'Toggle interactive Semi-3D wireframe roof view' : 'Mostrar/Ocultar vista Semi-3D interactiva del techo'}
          >
            <Box size={13} className={showSemi3D ? 'text-blue-400' : 'text-blue-600'} />
            <span>{lang === 'en' ? 'Semi-3D' : 'Vista Semi-3D'}</span>
          </button>
        )}

        {/* Rotate 90 deg */}
        <button
          onClick={handleRotate90}
          className="flex items-center gap-1 bg-white/95 backdrop-blur-md hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200 px-2 py-1.5 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
          title={t.rotateTitle}
        >
          <RotateCw size={13} />
        </button>

        {/* Reset */}
        {basePolygon.length > 0 && (
          <button
            onClick={handleResetAll}
            className="flex items-center gap-1 bg-white/95 backdrop-blur-md hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 px-2 py-1.5 rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer"
            title={t.resetTitle}
          >
            <RotateCcw size={13} />
          </button>
        )}
      </div>

      {/* Floating Guidance Panel: Primary = Visual Geometric Figures, Secondary = Optional Point Customization */}
      <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-xl border border-slate-200/90 w-[340px] sm:w-[375px] text-xs pointer-events-auto max-h-[92vh] overflow-y-auto">
        {basePolygon.length === 0 ? (
          <div>
            <h4 className="font-semibold text-slate-800 flex items-center gap-1.5 mb-1 text-xs">
              <MapPin size={14} className="text-blue-600" />
              {t.clickPromptTitle}
            </h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              {t.clickPromptDesc}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <Box size={14} className="text-blue-600" />
                {t.roofStructureTitle}
              </h4>
              <button
                type="button"
                onClick={() => setShowSemi3D(prev => !prev)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                  showSemi3D
                    ? 'bg-black text-white border-neutral-800'
                    : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                }`}
              >
                <Box size={11} className={showSemi3D ? 'text-blue-400' : 'text-blue-600'} />
                <span>{lang === 'en' ? '3D Angles' : 'Ver 3D'}</span>
              </button>
            </div>

            {/* 1. Primary Option: Visual Catalog of Geometric House Figures (Triangles = Cumbreras) */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                {t.conventionalModelLabel}
              </label>
              <div className="grid grid-cols-2 gap-1.5 max-h-[260px] overflow-y-auto pr-0.5">
                {roofModels.map(item => {
                  const isSelected = roofType === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectRoofType(item.id)}
                      className={`flex items-center gap-2 p-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-blue-50/70 hover:border-blue-300'
                      }`}
                      title={item.description}
                    >
                      <RoofShapeIcon
                        shapeId={item.id}
                        selected={isSelected}
                        className="w-10 h-8 rounded bg-slate-50/40 p-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-bold leading-tight truncate">{item.label}</div>
                        <div className={`text-[8.5px] leading-tight truncate mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                          {item.sublabel}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 2. Rotate Geometric Figure (0°, 90°, 180°, 270°) */}
            {roofType !== 'custom' && (
              <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200/80 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-600">{t.orientationLabel}</span>
                <div className="flex items-center gap-1">
                  {orientationOptions.map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleToggleOrientation(opt.id)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                        orientation === opt.id
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Point Height Editor inside panel (or prompt to touch a point) */}
            {selectedPointIdx !== null ? (
              <div className="bg-black text-white p-2.5 rounded-xl border border-neutral-800 space-y-2 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1">
                    <ArrowUpDown size={12} />
                    {t.pointHeightTitle(selectedPointIdx + 1)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedPointIdx(null)}
                    className="text-neutral-400 hover:text-white cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-black text-white">
                    {activePointHeight.toFixed(1)} {unitDist}{' '}
                    <span className="text-[10px] font-bold text-blue-400">
                      ({computeEquivalentPitch(activePointHeight, Math.sqrt(baseAreaSqFt) / 2)}/12)
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleUpdatePointHeight(selectedPointIdx, activePointHeight - 1)}
                      className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 rounded text-white font-bold text-xs cursor-pointer"
                    >
                      -1
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdatePointHeight(selectedPointIdx, activePointHeight + 1)}
                      className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 rounded text-white font-bold text-xs cursor-pointer"
                    >
                      +1
                    </button>
                  </div>
                </div>
                <input
                  type="range"
                  min={2}
                  max={25}
                  step={0.5}
                  value={activePointHeight}
                  onChange={(e) => handleUpdatePointHeight(selectedPointIdx, parseFloat(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
                />
                <div className="flex items-center justify-between pt-0.5">
                  <div className="flex items-center gap-1">
                    {[5, 8, 12, 16].map(hPreset => (
                      <button
                        key={hPreset}
                        type="button"
                        onClick={() => handleUpdatePointHeight(selectedPointIdx, hPreset)}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold cursor-pointer ${
                          Math.abs(activePointHeight - hPreset) < 0.3
                            ? 'bg-blue-600 text-white'
                            : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                        }`}
                      >
                        {hPreset}{unitDist}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplyHeightToAll(activePointHeight)}
                    className="text-[9.5px] font-semibold text-blue-400 hover:text-blue-300 underline cursor-pointer"
                  >
                    {t.applyHeightToAll}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-[9.5px] text-slate-600 leading-tight bg-blue-50/60 p-2 rounded-lg border border-blue-100 flex items-start gap-1.5">
                <HelpCircle size={13} className="text-blue-600 shrink-0 mt-0.5" />
                <span>{t.dragTip}</span>
              </div>
            )}

            {/* 3. Secondary Collapsible Option: Customize Points Manually */}
            <div>
              <button
                type="button"
                onClick={() => setShowCustomizePoints(prev => !prev)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50/60 hover:bg-blue-100/60 text-blue-800 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Sliders size={12} className="text-blue-600" />
                  {showCustomizePoints ? t.customizeToggleHide : t.customizeToggleShow}
                </span>
                {showCustomizePoints ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>

              {showCustomizePoints && (
                <div className="mt-1.5 bg-blue-50/70 p-2.5 rounded-xl border border-blue-200/80 space-y-2">
                  {/* Ridge Vertices */}
                  <div className="bg-white p-2 rounded-lg border border-blue-200/60 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-800 font-semibold flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
                        {t.ridgeVerticesLabel} ({ridgePoints.length}):
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={handleRemoveRidgePoint}
                          disabled={ridgePoints.length <= 1}
                          className={`px-1.5 py-0.5 rounded font-bold text-xs ${
                            ridgePoints.length > 1
                              ? 'bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 cursor-pointer'
                              : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                          }`}
                          title={t.removeTooltip}
                        >
                          <Minus size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={handleAddRidgePoint}
                          className="flex items-center gap-0.5 px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-[10px] transition-colors cursor-pointer shadow-2xs"
                          title={t.add}
                        >
                          <Plus size={12} />
                          <span>{t.add}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setClickMode(prev => prev === 'ridge' ? 'none' : 'ridge')}
                          className={`flex items-center gap-0.5 px-2 py-0.5 rounded font-bold text-[10px] transition-colors cursor-pointer border ${
                            clickMode === 'ridge'
                              ? 'bg-blue-700 text-white border-blue-800 animate-pulse'
                              : 'bg-white hover:bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                          title={t.clickOnMapRidgeTitle}
                        >
                          <span>{t.clickOnMap}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Eaves Corners */}
                  <div className="bg-white p-2 rounded-lg border border-blue-200/60 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-800 font-semibold flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-white border-2 border-blue-600 inline-block"></span>
                        {t.eavesCornersLabel} ({basePolygon.length}):
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={handleRemoveCorner}
                          disabled={basePolygon.length <= 3}
                          className={`px-1.5 py-0.5 rounded font-bold text-xs ${
                            basePolygon.length > 3
                              ? 'bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 cursor-pointer'
                              : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                          }`}
                          title={t.removeCornerTooltip}
                        >
                          <Minus size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={handleAddCorner}
                          className="flex items-center gap-0.5 px-2 py-0.5 bg-slate-800 hover:bg-slate-900 text-white rounded font-bold text-[10px] transition-colors cursor-pointer shadow-2xs"
                          title={t.addCorner}
                        >
                          <Plus size={12} />
                          <span>{t.addCorner}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setClickMode(prev => prev === 'corner' ? 'none' : 'corner')}
                          className={`flex items-center gap-0.5 px-2 py-0.5 rounded font-bold text-[10px] transition-colors cursor-pointer border ${
                            clickMode === 'corner'
                              ? 'bg-slate-800 text-white border-slate-900 animate-pulse'
                              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                          title={t.clickOnMapCornerTitle}
                        >
                          <span>{t.clickOnMap}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Metrics summary */}
            <div className="bg-slate-50 border border-slate-200/80 p-2 rounded-lg text-[11px] space-y-1">
              <div className="flex justify-between text-slate-700 items-center">
                <span className="font-medium">{t.baseFootprintLabel}</span>
                <span className="font-bold text-slate-900">
                  {Math.round(baseAreaSqFt).toLocaleString('en-US')} {unitArea}{' '}
                  <span className="text-[10px] font-normal text-slate-500">({areaMetersSq} m²)</span>
                </span>
              </div>
              <div className="flex justify-between text-slate-700 items-center">
                <span className="font-medium">{t.ridgeCapsLabel}</span>
                <span className="font-bold text-blue-700 bg-white px-1.5 py-0.2 rounded border border-blue-200 shadow-2xs">
                  {totalRidgeCapLength.toFixed(1)} {unitLinear}
                </span>
              </div>
            </div>

            {/* Pitch / Height Summary Bar */}
            <div className="flex items-center justify-between text-[10px] text-slate-600 bg-white p-1.5 rounded-xl border border-blue-200/70 shadow-2xs">
              <span className="font-medium">
                {t.pitchLabel} <strong className="text-slate-900">{roofHeightFt.toFixed(1)} {unitDist}</strong>
                <span className="text-blue-700 font-bold ml-1">
                  ({computeEquivalentPitch(roofHeightFt, Math.sqrt(baseAreaSqFt) / 2)}/12)
                </span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleAdjustHeight(-1)}
                  className="w-5 h-5 flex items-center justify-center bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:text-blue-600 rounded text-slate-700 font-bold cursor-pointer"
                  title={t.reducePitchTitle}
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => handleAdjustHeight(1)}
                  className="w-5 h-5 flex items-center justify-center bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:text-blue-600 rounded text-slate-700 font-bold cursor-pointer"
                  title={t.increasePitchTitle}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Bottom Bar when a Point is Touched on the Map */}
      {selectedPointIdx !== null && basePolygon.length > 0 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 bg-black/95 text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-neutral-800 flex items-center gap-3 text-xs pointer-events-auto">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
            <span className="font-bold text-blue-400">
              {t.pointHeightTitle(selectedPointIdx + 1)}:
            </span>
            <span className="font-black text-white">
              {activePointHeight.toFixed(1)} {unitDist}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleUpdatePointHeight(selectedPointIdx, activePointHeight - 1)}
              className="w-6 h-6 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center justify-center cursor-pointer"
            >
              -
            </button>
            <input
              type="range"
              min={2}
              max={25}
              step={0.5}
              value={activePointHeight}
              onChange={(e) => handleUpdatePointHeight(selectedPointIdx, parseFloat(e.target.value))}
              className="w-24 sm:w-32 accent-blue-500 cursor-pointer h-1.5 bg-neutral-700 rounded-lg"
            />
            <button
              type="button"
              onClick={() => handleUpdatePointHeight(selectedPointIdx, activePointHeight + 1)}
              className="w-6 h-6 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center cursor-pointer"
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={() => setSelectedPointIdx(null)}
            className="text-neutral-400 hover:text-white ml-1 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Floating click mode banner */}
      {clickMode !== 'none' && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-30 bg-blue-600 text-white px-4 py-2 rounded-xl shadow-xl flex items-center gap-3 text-xs font-semibold animate-pulse border border-blue-400 pointer-events-auto">
          <span>
            {clickMode === 'ridge' ? t.clickModeRidgePrompt : t.clickModeCornerPrompt}
          </span>
          <button
            type="button"
            onClick={() => setClickMode('none')}
            className="bg-white/20 hover:bg-white/30 text-white px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer"
          >
            {t.cancel}
          </button>
        </div>
      )}

      {/* Interactive Semi-3D Wireframe Viewer (Blue architectural lines, rotatable 360°, slope angles & heights) */}
      {basePolygon.length > 0 && showSemi3D && (
        <RoofSemi3DViewer
          basePolygon={basePolygon}
          ridgePoints={ridgePoints}
          pointHeights={pointHeights}
          roofHeightFt={roofHeightFt}
          roofType={roofType}
          selectedPointIdx={selectedPointIdx}
          onSelectPoint={setSelectedPointIdx}
          onUpdatePointHeight={handleUpdatePointHeight}
          onUpdateMultiplePointsHeight={handleUpdateMultiplePointsHeight}
          onDeltaMultiplePointsHeight={handleDeltaMultiplePointsHeight}
          onApplyHeightToAll={handleApplyHeightToAll}
          lang={lang}
          isExpanded={isSemi3DExpanded}
          onToggleExpand={() => setIsSemi3DExpanded(prev => !prev)}
          onClose={() => setShowSemi3D(false)}
        />
      )}

      {/* Google Map in Pure 3D Satellite View */}
      <GoogleMap
        mapContainerStyle={{
          ...containerStyle,
          transform: zoomMagnify > 1 ? `scale(${zoomMagnify})` : undefined,
          transformOrigin: 'center center',
          transition: 'transform 0.2s ease-in-out'
        }}
        onLoad={mapInstance => {
          setMap(mapInstance)
          mapInstance.setMapTypeId('satellite')
          mapInstance.setTilt(45)
          if (addressCoordinates) {
            mapInstance.setCenter(addressCoordinates)
            mapInstance.setZoom(21)
          } else {
            mapInstance.setCenter(initialCenter)
            mapInstance.setZoom(19)
          }
        }}
        onUnmount={() => {
          overlaysRef.current.polygons.forEach(p => p.setMap(null))
          overlaysRef.current.polylines.forEach(l => l.setMap(null))
          setMap(null)
        }}
        mapTypeId="satellite"
        onClick={handleMapClick}
        options={{
          mapTypeId: 'satellite',
          disableDefaultUI: false,
          streetViewControl: false,
          mapTypeControl: false,
          tilt: 45,
          heading: heading,
          maxZoom: 22,
          isFractionalZoomEnabled: true,
          rotateControl: true,
          draggableCursor: clickMode !== 'none' ? 'crosshair' : undefined
        }}
      >
        {/* 1. Base Perimeter */}
        {basePolygon.length > 0 && (
          <Polygon
            key={`base-poly-${basePolygon.map(p => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`).join('-')}`}
            paths={basePolygon}
            options={{
              fillColor: '#3b82f6',
              fillOpacity: 0.10,
              strokeColor: '#2563eb',
              strokeOpacity: 0.9,
              strokeWeight: 2,
              editable: false,
              draggable: false,
              clickable: false,
            }}
          />
        )}

        {/* 2. Sleek Compact Corner Handles (scale: 5 so they never obscure measurements) */}
        {basePolygon.map((corner, idx) => (
          <Marker
            key={`corner-handle-${idx}`}
            position={corner}
            draggable={true}
            zIndex={999990}
            clickable={true}
            onClick={() => handleCornerClick(idx)}
            onDragEnd={(e) => handleCornerDrag(idx, e)}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 5,
              fillColor: '#ffffff',
              fillOpacity: 1,
              strokeColor: '#2563eb',
              strokeWeight: 2,
            }}
            title={t.cornerMarkerTitle(idx + 1)}
          />
        ))}

        {/* 3. Sleek Compact Depth Vertices (Click to adjust height, Drag to move) */}
        {has3DStructure && ridgePoints.map((pt, ptIdx) => {
          const isSelected = selectedPointIdx === ptIdx
          const ptH = pointHeights[ptIdx] ?? roofHeightFt
          return (
            <Marker
              key={`ridge-pt-${ptIdx}-${ridgePoints.length}`}
              position={pt}
              draggable={true}
              zIndex={isSelected ? 1000005 : 999999}
              clickable={true}
              onClick={() => setSelectedPointIdx(ptIdx)}
              onDragEnd={(e) => handleRidgePointDrag(ptIdx, e)}
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: isSelected ? 7.5 : 5.5,
                fillColor: isSelected ? '#1d4ed8' : '#2563eb',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: isSelected ? 3 : 2,
              }}
              title={`${t.ridgeMarkerTitle(ptIdx + 1)} • ${ptH.toFixed(1)} ${unitDist}`}
            />
          )
        })}

        {/* 4. Separated Measurement Badges for Main Ridge Lines (Offset perpendicular to ridge) */}
        {showMeasurements && has3DStructure && ridgeLines.filter(l => l.isMainRidge && l.lengthValue >= 5).map((line) => {
          if (line.path.length < 2) return null
          const pA = line.path[0]
          const pB = line.path[1]
          const midLat = (pA.lat + pB.lat) / 2
          const midLng = (pA.lng + pB.lng) / 2
          const cosLat = Math.cos((midLat * Math.PI) / 180) || 1
          const dx = (pB.lng - pA.lng) * cosLat
          const dy = pB.lat - pA.lat
          const len = Math.sqrt(dx * dx + dy * dy) || 1
          const nx = -dy / len
          const ny = dx / len
          const offset = 0.000014

          return (
            <Marker
              key={`line-label-${line.id}-${midLat.toFixed(5)}`}
              position={{
                lat: midLat + ny * offset,
                lng: midLng + (nx * offset) / cosLat
              }}
              clickable={false}
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 0,
              }}
              label={{
                text: line.lengthFt,
                color: '#1e40af',
                fontSize: '9.5px',
                fontWeight: 'bold',
                className: 'pointer-events-none select-none bg-white/90 px-1.5 py-0.2 rounded border border-blue-200 shadow-2xs'
              }}
            />
          )
        })}

        {/* 5. Outward-Offset Wall Lengths around the base (Separated cleanly from corners) */}
        {showMeasurements && baseSegments.filter(seg => seg.distFeet >= 4.5).map((segment, index) => (
          <Marker
            key={`base-seg-${index}-${segment.length}`}
            position={segment.mid}
            clickable={false}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 0,
            }}
            label={{
              text: segment.length,
              color: '#0f172a',
              fontSize: '9.5px',
              fontWeight: 'bold',
              className: 'pointer-events-none select-none bg-white/90 px-1.5 py-0.2 rounded shadow-2xs border border-slate-200'
            }}
          />
        ))}
      </GoogleMap>
    </div>
  )
}
