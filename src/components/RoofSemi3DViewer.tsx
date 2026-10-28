"use client"

import React, { useState, useRef, useEffect, useMemo } from 'react'
import {
  RotateCw,
  Maximize2,
  Minimize2,
  X,
  Box,
  Compass,
  ArrowUpDown,
  MoveVertical
} from 'lucide-react'
import { RoofType, ROOF_SHAPE_TEMPLATES } from '@/lib/roofShapes'
import { Language } from '@/lib/translations'

interface RoofSemi3DViewerProps {
  basePolygon: google.maps.LatLngLiteral[]
  ridgePoints: google.maps.LatLngLiteral[]
  pointHeights: number[]
  roofHeightFt: number
  roofType: RoofType
  selectedPointIdx: number | null
  onSelectPoint: (idx: number | null) => void
  onUpdatePointHeight: (idx: number, heightFt: number) => void
  onUpdateMultiplePointsHeight?: (indices: number[], heightFt: number) => void
  onDeltaMultiplePointsHeight?: (indices: number[], deltaFt: number) => void
  onApplyHeightToAll: (heightFt: number) => void
  lang: Language
  isExpanded: boolean
  onToggleExpand: () => void
  onClose: () => void
}

interface Vec3 {
  x: number
  y: number
  z: number
}

interface ProjectedPt {
  sx: number
  sy: number
  depth: number
}

export interface Vector3DItem {
  id: string
  shortLabel: string
  fullLabel: string
  fromToken: string
  toToken: string
  a: Vec3
  b: Vec3
  ridgeIndices: number[]
  isMainRidge: boolean
  length3DFt: number
  slopeAngleDeg: number
  pitchRise: number
  avgHeightFt: number
}

function formatTokenName(token: string): string {
  if (token.startsWith('r')) {
    const idx = parseInt(token.slice(1), 10)
    return `P${idx + 1}`
  }
  if (token.startsWith('b')) {
    const idx = parseInt(token.slice(1), 10)
    return `B${idx + 1}`
  }
  return token.toUpperCase()
}

export default function RoofSemi3DViewer({
  basePolygon,
  ridgePoints,
  pointHeights,
  roofHeightFt,
  roofType,
  selectedPointIdx,
  onSelectPoint,
  onUpdatePointHeight,
  onUpdateMultiplePointsHeight,
  onDeltaMultiplePointsHeight,
  onApplyHeightToAll,
  lang,
  isExpanded,
  onToggleExpand,
  onClose
}: RoofSemi3DViewerProps) {
  // Camera orbit angles (degrees)
  const [yawDeg, setYawDeg] = useState<number>(-36)
  const [tiltDeg, setTiltDeg] = useState<number>(28)
  const [zoomScale, setZoomScale] = useState<number>(1.0)
  const [autoRotate, setAutoRotate] = useState<boolean>(false)
  const [showAngles, setShowAngles] = useState<boolean>(true)
  const [showWalls, setShowWalls] = useState<boolean>(true)

  // Selection mode inside Isometric Viewer: 'point' | 'vector' | 'all'
  const [selectorTab, setSelectorTab] = useState<'points' | 'vectors'>('points')
  const [selectedVectorId, setSelectedVectorId] = useState<string | null>(null)
  const [hoveredVectorId, setHoveredVectorId] = useState<string | null>(null)
  const [hoveredPointIdx, setHoveredPointIdx] = useState<number | null>(null)

  // Dragging state: either orbiting the 3D camera OR dragging a Point/Vector vertically to change height
  const dragStateRef = useRef<{
    mode: 'none' | 'orbit' | 'point-height' | 'vector-height'
    startX: number
    startY: number
    lastX: number
    lastY: number
    pointIdx: number | null
    ridgeIndices: number[]
    startHeight: number
  }>({
    mode: 'none',
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    pointIdx: null,
    ridgeIndices: [],
    startHeight: 8
  })

  const unitDist = lang === 'en' ? 'ft' : 'pies'

  // Optional continuous 360 auto-rotation
  useEffect(() => {
    if (!autoRotate) return
    const timer = setInterval(() => {
      setYawDeg(prev => (prev + 0.8) % 360)
    }, 30)
    return () => clearInterval(timer)
  }, [autoRotate])

  // If external selectedPointIdx changes (e.g. user clicked a point on the 2D Google Map), sync to point mode
  useEffect(() => {
    if (selectedPointIdx !== null) {
      setSelectedVectorId(null)
    }
  }, [selectedPointIdx])

  // Convert LatLng points into local 3D feet coordinates centered at (0, 0, 0)
  const geometry3D = useMemo(() => {
    if (basePolygon.length < 3 || ridgePoints.length === 0) {
      return null
    }

    const allPts = [...basePolygon, ...ridgePoints]
    const centerLat = allPts.reduce((s, p) => s + p.lat, 0) / allPts.length
    const centerLng = allPts.reduce((s, p) => s + p.lng, 0) / allPts.length
    const cosLat = Math.cos((centerLat * Math.PI) / 180) || 1
    const FT_PER_DEG = 364000

    const toLocalXY = (p: google.maps.LatLngLiteral) => ({
      x: (p.lng - centerLng) * cosLat * FT_PER_DEG,
      y: (p.lat - centerLat) * FT_PER_DEG
    })

    const base3D: Vec3[] = basePolygon.map(p => {
      const { x, y } = toLocalXY(p)
      return { x, y, z: 0 }
    })

    const ridge3D: Vec3[] = ridgePoints.map((p, idx) => {
      const { x, y } = toLocalXY(p)
      const h = pointHeights[idx] !== undefined ? pointHeights[idx] : roofHeightFt
      return { x, y, z: h }
    })

    // Compute horizontal bounding radius for auto-fitting camera scale
    let maxRadius = 15
    for (const v of [...base3D, ...ridge3D]) {
      const r = Math.sqrt(v.x * v.x + v.y * v.y)
      if (r > maxRadius) maxRadius = r
    }

    const resolve3D = (token: string): Vec3 | null => {
      if (token.startsWith('b')) {
        const idx = parseInt(token.slice(1), 10)
        return base3D[idx] || null
      }
      if (token.startsWith('r')) {
        const idx = parseInt(token.slice(1), 10)
        return ridge3D[idx] || null
      }
      return null
    }

    // Build 3D faces and deduplicated 3D interactive vectors
    const tpl = ROOF_SHAPE_TEMPLATES[roofType]
    const faces3D: {
      id: string
      vertices: Vec3[]
      angleDeg: number
      pitchRise: number
    }[] = []

    const rawVectors: {
      fromToken: string
      toToken: string
      isMainRidge: boolean
    }[] = []
    const seenPairs = new Set<string>()

    const addUniqueVector = (fromToken: string, toToken: string, isMainRidge: boolean) => {
      if (fromToken === toToken) return
      if (fromToken.startsWith('b') && toToken.startsWith('b')) return // base perimeter drawn separately
      const key = [fromToken, toToken].sort().join('--')
      if (seenPairs.has(key)) return
      seenPairs.add(key)
      rawVectors.push({ fromToken, toToken, isMainRidge })
    }

    const computeFaceAngle = (verts: Vec3[]): { angleDeg: number; pitchRise: number } => {
      if (verts.length < 3) return { angleDeg: 0, pitchRise: 0 }
      let nx = 0
      let ny = 0
      let nz = 0
      for (let i = 0; i < verts.length; i++) {
        const curr = verts[i]
        const next = verts[(i + 1) % verts.length]
        nx += (curr.y - next.y) * (curr.z + next.z)
        ny += (curr.z - next.z) * (curr.x + next.x)
        nz += (curr.x - next.x) * (curr.y + next.y)
      }
      const normLen = Math.sqrt(nx * nx + ny * ny + nz * nz)
      if (normLen < 1e-5) return { angleDeg: 0, pitchRise: 0 }
      const cosTheta = Math.min(1, Math.abs(nz) / normLen)
      const angleRad = Math.acos(cosTheta)
      const angleDeg = (angleRad * 180) / Math.PI
      const pitchRise = Math.round(Math.tan(angleRad) * 12 * 10) / 10
      return { angleDeg, pitchRise }
    }

    if (
      tpl &&
      roofType !== 'custom' &&
      base3D.length === tpl.baseCoords.length &&
      ridge3D.length === tpl.ridgeCoords.length
    ) {
      for (const f of tpl.faces) {
        const verts = f.vertices.map(resolve3D).filter((v): v is Vec3 => v !== null)
        if (verts.length >= 3) {
          const { angleDeg, pitchRise } = computeFaceAngle(verts)
          faces3D.push({ id: f.id, vertices: verts, angleDeg, pitchRise })
        }
      }
      // First add primary lines (ridges & hips)
      for (const l of tpl.lines) {
        const isRidgeVec = Boolean(l.isMainRidge || (l.from.startsWith('r') && l.to.startsWith('r')))
        addUniqueVector(l.from, l.to, isRidgeVec)
      }
      // Also add any remaining sloped face edges
      for (const f of tpl.faces) {
        for (let i = 0; i < f.vertices.length; i++) {
          const tA = f.vertices[i]
          const tB = f.vertices[(i + 1) % f.vertices.length]
          const isRidgeVec = tA.startsWith('r') && tB.startsWith('r')
          addUniqueVector(tA, tB, isRidgeVec)
        }
      }
    } else {
      // Custom multi-point 3D builder
      for (let i = 0; i < ridge3D.length - 1; i++) {
        addUniqueVector(`r${i}`, `r${i + 1}`, true)
      }
      for (let i = 0; i < base3D.length; i++) {
        const bA = base3D[i]
        const bB = base3D[(i + 1) % base3D.length]
        let idxA = 0
        let minDA = Infinity
        let idxB = 0
        let minDB = Infinity
        ridge3D.forEach((rPt, rIdx) => {
          const dA = (bA.x - rPt.x) ** 2 + (bA.y - rPt.y) ** 2
          if (dA < minDA) {
            minDA = dA
            idxA = rIdx
          }
          const dB = (bB.x - rPt.x) ** 2 + (bB.y - rPt.y) ** 2
          if (dB < minDB) {
            minDB = dB
            idxB = rIdx
          }
        })
        const verts = idxA === idxB ? [bA, bB, ridge3D[idxA]] : [bA, bB, ridge3D[idxB], ridge3D[idxA]]
        const { angleDeg, pitchRise } = computeFaceAngle(verts)
        faces3D.push({ id: `c-face-${i}`, vertices: verts, angleDeg, pitchRise })
        addUniqueVector(`b${i}`, `r${idxA}`, false)
      }
    }

    // Sort vectors so main ridge vectors (P-to-P) come first (V1, V2...), followed by hip/slope vectors (B-to-P)
    rawVectors.sort((x, y) => (y.isMainRidge ? 1 : 0) - (x.isMainRidge ? 1 : 0))

    const vectors3D: Vector3DItem[] = []
    rawVectors.forEach((rv, idx) => {
      const a = resolve3D(rv.fromToken)
      const b = resolve3D(rv.toToken)
      if (!a || !b) return

      const ridgeIndices: number[] = []
      if (rv.fromToken.startsWith('r')) {
        ridgeIndices.push(parseInt(rv.fromToken.slice(1), 10))
      }
      if (rv.toToken.startsWith('r')) {
        const rIdx = parseInt(rv.toToken.slice(1), 10)
        if (!ridgeIndices.includes(rIdx)) ridgeIndices.push(rIdx)
      }

      const dx = b.x - a.x
      const dy = b.y - a.y
      const dz = b.z - a.z
      const run2D = Math.sqrt(dx * dx + dy * dy)
      const length3DFt = Math.sqrt(dx * dx + dy * dy + dz * dz)
      const slopeRad = run2D > 1e-4 ? Math.atan2(Math.abs(dz), run2D) : 0
      const slopeAngleDeg = (slopeRad * 180) / Math.PI
      const pitchRise = Math.round(Math.tan(slopeRad) * 12 * 10) / 10

      const avgHeightFt =
        ridgeIndices.length > 0
          ? ridgeIndices.reduce((s, rIdx) => s + (ridge3D[rIdx]?.z ?? roofHeightFt), 0) /
            ridgeIndices.length
          : roofHeightFt

      const shortLabel = `V${idx + 1}`
      const fullLabel = `${shortLabel} (${formatTokenName(rv.fromToken)}–${formatTokenName(rv.toToken)})`

      vectors3D.push({
        id: `vec-${rv.fromToken}-${rv.toToken}`,
        shortLabel,
        fullLabel,
        fromToken: rv.fromToken,
        toToken: rv.toToken,
        a,
        b,
        ridgeIndices,
        isMainRidge: rv.isMainRidge,
        length3DFt,
        slopeAngleDeg,
        pitchRise,
        avgHeightFt
      })
    })

    return {
      base3D,
      ridge3D,
      faces3D,
      vectors3D,
      maxRadius
    }
  }, [basePolygon, ridgePoints, pointHeights, roofHeightFt, roofType])

  if (!geometry3D) return null

  const { base3D, ridge3D, faces3D, vectors3D, maxRadius } = geometry3D

  // Currently selected vector object (if any)
  const selectedVector = vectors3D.find(v => v.id === selectedVectorId) || null

  // SVG viewport dimensions
  const viewW = 500
  const viewH = 340
  const cx = viewW / 2
  const cy = viewH * 0.58

  // 3D rotation & perspective projection
  const yawRad = (yawDeg * Math.PI) / 180
  const tiltRad = (tiltDeg * Math.PI) / 180
  const cosYaw = Math.cos(yawRad)
  const sinYaw = Math.sin(yawRad)
  const cosTilt = Math.cos(tiltRad)
  const sinTilt = Math.sin(tiltRad)

  const baseScale = (Math.min(viewW, viewH) * 0.37 * zoomScale) / Math.max(maxRadius, 12)

  const project3D = (v: Vec3): ProjectedPt => {
    const rx = v.x * cosYaw - v.y * sinYaw
    const ry = v.x * sinYaw + v.y * cosYaw
    const camY = ry * cosTilt - v.z * sinTilt
    const camZ = ry * sinTilt + v.z * cosTilt
    const fov = 260
    const persp = fov / Math.max(80, fov + ry * cosTilt * 0.35)
    return {
      sx: cx + rx * baseScale * persp,
      sy: cy - camZ * baseScale * persp,
      depth: camY
    }
  }

  // Sort faces back-to-front (Painter's algorithm)
  const sortedFaces = [...faces3D]
    .map(f => {
      const projVerts = f.vertices.map(project3D)
      const avgDepth = projVerts.reduce((s, p) => s + p.depth, 0) / projVerts.length
      const center3D: Vec3 = {
        x: f.vertices.reduce((s, v) => s + v.x, 0) / f.vertices.length,
        y: f.vertices.reduce((s, v) => s + v.y, 0) / f.vertices.length,
        z: f.vertices.reduce((s, v) => s + v.z, 0) / f.vertices.length
      }
      const centerProj = project3D(center3D)
      return {
        ...f,
        projVerts,
        avgDepth,
        centerProj
      }
    })
    .sort((a, b) => b.avgDepth - a.avgDepth)

  // Helper to update multiple points' height cleanly
  const applyHeightToIndices = (indices: number[], nextH: number) => {
    const clamped = Math.max(2, Math.min(28, Number(nextH.toFixed(1))))
    if (onUpdateMultiplePointsHeight) {
      onUpdateMultiplePointsHeight(indices, clamped)
    } else {
      indices.forEach(idx => onUpdatePointHeight(idx, clamped))
    }
  }

  const applyDeltaToIndices = (indices: number[], deltaFt: number) => {
    if (onDeltaMultiplePointsHeight) {
      onDeltaMultiplePointsHeight(indices, deltaFt)
    } else {
      indices.forEach(idx => {
        const cur = pointHeights[idx] ?? roofHeightFt
        onUpdatePointHeight(idx, cur + deltaFt)
      })
    }
  }

  // 1. Background pointer down -> Orbit 3D Camera
  const handleSvgPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    setAutoRotate(false)
    dragStateRef.current = {
      mode: 'orbit',
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
      pointIdx: null,
      ridgeIndices: [],
      startHeight: roofHeightFt
    }
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // ignore
    }
  }

  // 2. Point pointer down -> Select Point & allow direct vertical drag to change height!
  const handlePointPointerDown = (idx: number, e: React.PointerEvent<SVGGElement>) => {
    e.stopPropagation()
    setAutoRotate(false)
    setSelectedVectorId(null)
    setSelectorTab('points')
    onSelectPoint(idx)

    const curH = pointHeights[idx] ?? roofHeightFt
    dragStateRef.current = {
      mode: 'point-height',
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
      pointIdx: idx,
      ridgeIndices: [idx],
      startHeight: curH
    }
    const svgEl = e.currentTarget.ownerSVGElement
    if (svgEl) {
      try {
        svgEl.setPointerCapture(e.pointerId)
      } catch {
        // ignore
      }
    }
  }

  // 3. Vector pointer down -> Select Vector & allow direct vertical drag to change vector height!
  const handleVectorPointerDown = (vec: Vector3DItem, e: React.PointerEvent<SVGGElement>) => {
    e.stopPropagation()
    setAutoRotate(false)
    setSelectedVectorId(vec.id)
    setSelectorTab('vectors')
    if (vec.ridgeIndices.length === 1) {
      onSelectPoint(vec.ridgeIndices[0])
    } else {
      onSelectPoint(null)
    }

    dragStateRef.current = {
      mode: 'vector-height',
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
      pointIdx: null,
      ridgeIndices: vec.ridgeIndices,
      startHeight: vec.avgHeightFt
    }
    const svgEl = e.currentTarget.ownerSVGElement
    if (svgEl) {
      try {
        svgEl.setPointerCapture(e.pointerId)
      } catch {
        // ignore
      }
    }
  }

  // Unified SVG Pointer Move: handles 3D Camera Orbit OR Live Vertical Height Dragging!
  const handleSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const st = dragStateRef.current
    if (st.mode === 'none') return

    const dx = e.clientX - st.lastX
    const dy = e.clientY - st.lastY
    st.lastX = e.clientX
    st.lastY = e.clientY

    if (st.mode === 'orbit') {
      setYawDeg(prev => (prev + dx * 0.65) % 360)
      setTiltDeg(prev => Math.max(6, Math.min(82, prev + dy * 0.45)))
      return
    }

    if (st.mode === 'point-height' && st.pointIdx !== null) {
      // Dragging UP (negative dy) increases roof height in feet
      const totalDy = st.startY - e.clientY
      const nextH = Math.max(2, Math.min(28, Number((st.startHeight + totalDy * 0.12).toFixed(1))))
      onUpdatePointHeight(st.pointIdx, nextH)
      return
    }

    if (st.mode === 'vector-height' && st.ridgeIndices.length > 0) {
      // Dragging UP (negative dy) raises the entire selected vector
      const deltaFt = -dy * 0.12
      if (Math.abs(deltaFt) >= 0.05) {
        applyDeltaToIndices(st.ridgeIndices, deltaFt)
      }
    }
  }

  const handleSvgPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    dragStateRef.current.mode = 'none'
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      // ignore
    }
  }

  const wallDepthFt = -9

  // Determine active height & label for the bottom height editor
  const activeHeight = selectedVector
    ? selectedVector.avgHeightFt
    : selectedPointIdx !== null
      ? (pointHeights[selectedPointIdx] ?? roofHeightFt)
      : roofHeightFt

  const handleSetActiveHeight = (nextVal: number) => {
    const clamped = Math.max(2, Math.min(28, Number(nextVal.toFixed(1))))
    if (selectedVector && selectedVector.ridgeIndices.length > 0) {
      applyHeightToIndices(selectedVector.ridgeIndices, clamped)
    } else if (selectedPointIdx !== null) {
      onUpdatePointHeight(selectedPointIdx, clamped)
    } else {
      onApplyHeightToAll(clamped)
    }
  }

  const handleStepActiveHeight = (delta: number) => {
    if (selectedVector && selectedVector.ridgeIndices.length > 0) {
      applyDeltaToIndices(selectedVector.ridgeIndices, delta)
    } else if (selectedPointIdx !== null) {
      const cur = pointHeights[selectedPointIdx] ?? roofHeightFt
      onUpdatePointHeight(selectedPointIdx, cur + delta)
    } else {
      onApplyHeightToAll(roofHeightFt + delta)
    }
  }

  // Compute average roof angle across sloped facets
  const validAngles = faces3D.filter(f => f.angleDeg > 1)
  const avgAngleDeg =
    validAngles.length > 0
      ? validAngles.reduce((s, f) => s + f.angleDeg, 0) / validAngles.length
      : 26.6

  return (
    <div
      className={
        isExpanded
          ? 'absolute inset-3 z-30 bg-white/98 backdrop-blur-md rounded-2xl shadow-2xl border border-blue-200 flex flex-col overflow-hidden pointer-events-auto'
          : 'absolute bottom-3 right-3 z-20 w-[350px] sm:w-[400px] bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-blue-200 flex flex-col overflow-hidden pointer-events-auto'
      }
    >
      {/* Top Header Bar (Pure Black & Veltos Blue) */}
      <div className="px-3 py-2 bg-black text-white flex items-center justify-between border-b border-neutral-800">
        <div className="flex items-center gap-1.5">
          <Box size={14} className="text-blue-400" />
          <span className="text-xs font-bold tracking-tight">
            {lang === 'en' ? 'Semi-3D Isometric Editor' : 'Editor Isométrico Semi-3D'}
          </span>
          <span className="text-[10px] bg-blue-600/30 text-blue-300 border border-blue-500/40 px-1.5 py-0.2 rounded font-bold ml-1">
            {avgAngleDeg.toFixed(1)}°
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setAutoRotate(prev => !prev)}
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1 ${
              autoRotate
                ? 'bg-blue-600 text-white'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
            title={lang === 'en' ? 'Auto-rotate 360°' : 'Girar 360° automáticamente'}
          >
            <RotateCw size={11} className={autoRotate ? 'animate-spin' : ''} />
            <span>360°</span>
          </button>

          <button
            type="button"
            onClick={onToggleExpand}
            className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title={isExpanded ? (lang === 'en' ? 'Minimize' : 'Reducir') : (lang === 'en' ? 'Expand 3D View' : 'Ampliar Vista 3D')}
          >
            {isExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded bg-neutral-800 hover:bg-red-600 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title={lang === 'en' ? 'Close 3D View' : 'Cerrar Vista 3D'}
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Row 1: Camera Presets + Angles/Base Toggles */}
      <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[10px] flex-wrap gap-1">
        <div className="flex items-center gap-1">
          <Compass size={12} className="text-blue-600 mr-0.5" />
          <button
            type="button"
            onClick={() => { setYawDeg(-36); setTiltDeg(28); setAutoRotate(false) }}
            className="px-2 py-0.5 rounded bg-white hover:bg-blue-50 text-slate-700 border border-slate-200 font-semibold cursor-pointer"
          >
            {lang === 'en' ? '3D Isometric' : '3D Isométrica'}
          </button>
          <button
            type="button"
            onClick={() => { setYawDeg(0); setTiltDeg(10); setAutoRotate(false) }}
            className="px-2 py-0.5 rounded bg-white hover:bg-blue-50 text-slate-700 border border-slate-200 font-semibold cursor-pointer"
          >
            {lang === 'en' ? 'Front' : 'Frente'}
          </button>
          <button
            type="button"
            onClick={() => { setYawDeg(90); setTiltDeg(10); setAutoRotate(false) }}
            className="px-2 py-0.5 rounded bg-white hover:bg-blue-50 text-slate-700 border border-slate-200 font-semibold cursor-pointer"
          >
            {lang === 'en' ? 'Side' : 'Lateral'}
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowAngles(prev => !prev)}
            className={`px-2 py-0.5 rounded font-bold cursor-pointer border ${
              showAngles
                ? 'bg-blue-600 text-white border-blue-700'
                : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            {lang === 'en' ? 'Angles' : 'Ángulos'}
          </button>
          <button
            type="button"
            onClick={() => setShowWalls(prev => !prev)}
            className={`px-2 py-0.5 rounded font-bold cursor-pointer border ${
              showWalls
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-white text-slate-500 border-slate-200'
            }`}
          >
            {lang === 'en' ? 'Base' : 'Base'}
          </button>
        </div>
      </div>

      {/* Row 2: Quick Point & Vector Selector Bar */}
      <div className="px-2.5 py-1.5 bg-white border-b border-slate-200 flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSelectorTab('points')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                selectorTab === 'points'
                  ? 'bg-black text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {lang === 'en' ? `Points (${ridge3D.length})` : `Puntos (${ridge3D.length})`}
            </button>
            <button
              type="button"
              onClick={() => setSelectorTab('vectors')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                selectorTab === 'vectors'
                  ? 'bg-black text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {lang === 'en' ? `Vectors (${vectors3D.length})` : `Vectores (${vectors3D.length})`}
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedVectorId(null)
              onSelectPoint(null)
            }}
            className={`px-2 py-0.5 rounded text-[9.5px] font-bold border cursor-pointer ${
              selectedPointIdx === null && selectedVectorId === null
                ? 'bg-blue-600 text-white border-blue-700'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {lang === 'en' ? 'All Roof' : 'Todo el Techo'}
          </button>
        </div>

        {/* Scrollable Pills for Choosing any Point (P1, P2...) or Vector (V1, V2...) */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
          {selectorTab === 'points' ? (
            ridge3D.map((rPt, idx) => {
              const isSel = selectedVectorId === null && selectedPointIdx === idx
              return (
                <button
                  key={`pill-pt-${idx}`}
                  type="button"
                  onClick={() => {
                    setSelectedVectorId(null)
                    onSelectPoint(idx)
                  }}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
                    isSel
                      ? 'bg-blue-600 text-white border-blue-700 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/60'
                  }`}
                >
                  <span>P{idx + 1}</span>
                  <span className={`text-[9px] ${isSel ? 'text-blue-100' : 'text-blue-600'}`}>
                    {rPt.z.toFixed(1)}{unitDist}
                  </span>
                </button>
              )
            })
          ) : (
            vectors3D.map((vec) => {
              const isSel = selectedVectorId === vec.id
              return (
                <button
                  key={`pill-vec-${vec.id}`}
                  type="button"
                  onClick={() => {
                    setSelectedVectorId(vec.id)
                    if (vec.ridgeIndices.length === 1) {
                      onSelectPoint(vec.ridgeIndices[0])
                    } else {
                      onSelectPoint(null)
                    }
                  }}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
                    isSel
                      ? 'bg-blue-600 text-white border-blue-700 shadow-2xs'
                      : vec.isMainRidge
                        ? 'bg-blue-50/70 text-blue-900 border-blue-200 hover:bg-blue-100/70'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <span>{vec.fullLabel}</span>
                  <span className={`text-[9px] ${isSel ? 'text-blue-100' : 'text-blue-600'}`}>
                    {vec.avgHeightFt.toFixed(1)}{unitDist}
                  </span>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Interactive 3D Wireframe Canvas (Click/Drag Point or Vector to Change Height, Drag Background to Rotate) */}
      <div className={`relative select-none bg-slate-50 ${isExpanded ? 'flex-1 min-h-[340px]' : 'h-[220px]'}`}>
        <svg
          viewBox={`0 0 ${viewW} ${viewH}`}
          className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
          onPointerDown={handleSvgPointerDown}
          onPointerMove={handleSvgPointerMove}
          onPointerUp={handleSvgPointerUp}
        >
          {/* 1. 3D Reference Ground Grid */}
          {[-1, -0.5, 0, 0.5, 1].map((step) => {
            const g = maxRadius * 1.25
            const p1 = project3D({ x: -g, y: step * g, z: showWalls ? wallDepthFt : 0 })
            const p2 = project3D({ x: g, y: step * g, z: showWalls ? wallDepthFt : 0 })
            const p3 = project3D({ x: step * g, y: -g, z: showWalls ? wallDepthFt : 0 })
            const p4 = project3D({ x: step * g, y: g, z: showWalls ? wallDepthFt : 0 })
            return (
              <g key={`grid-${step}`}>
                <line x1={p1.sx} y1={p1.sy} x2={p2.sx} y2={p2.sy} stroke="#e2e8f0" strokeWidth="1" />
                <line x1={p3.sx} y1={p3.sy} x2={p4.sx} y2={p4.sy} stroke="#e2e8f0" strokeWidth="1" />
              </g>
            )
          })}

          {/* 2. Subtle House Base Walls (z = -9 ft to z = 0 ft) */}
          {showWalls && base3D.map((bPt, idx) => {
            const nextPt = base3D[(idx + 1) % base3D.length]
            const topA = project3D(bPt)
            const topB = project3D(nextPt)
            const botA = project3D({ x: bPt.x, y: bPt.y, z: wallDepthFt })
            const botB = project3D({ x: nextPt.x, y: nextPt.y, z: wallDepthFt })
            return (
              <g key={`wall-${idx}`}>
                <polygon
                  points={`${topA.sx},${topA.sy} ${topB.sx},${topB.sy} ${botB.sx},${botB.sy} ${botA.sx},${botA.sy}`}
                  fill="rgba(148, 163, 184, 0.08)"
                  stroke="#94a3b8"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
              </g>
            )
          })}

          {/* 3. Base Eaves Footprint Plane at z = 0 */}
          <polygon
            points={base3D.map(v => {
              const p = project3D(v)
              return `${p.sx.toFixed(1)},${p.sy.toFixed(1)}`
            }).join(' ')}
            fill="rgba(37, 99, 235, 0.05)"
            stroke="#60a5fa"
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />

          {/* 4. Vertical Height Drop-Lines from each Ridge Point (z = H) down to Base Plane (z = 0) */}
          {ridge3D.map((rPt, idx) => {
            const topP = project3D(rPt)
            const botP = project3D({ x: rPt.x, y: rPt.y, z: 0 })
            const midX = (topP.sx + botP.sx) / 2
            const midY = (topP.sy + botP.sy) / 2
            const isSelected =
              (selectedVectorId === null && selectedPointIdx === idx) ||
              (selectedVector?.ridgeIndices.includes(idx) ?? false)
            return (
              <g key={`drop-${idx}`}>
                <line
                  x1={botP.sx}
                  y1={botP.sy}
                  x2={topP.sx}
                  y2={topP.sy}
                  stroke={isSelected ? '#0284c7' : '#3b82f6'}
                  strokeWidth={isSelected ? '2.2' : '1.3'}
                  strokeDasharray="3 2"
                />
                <circle cx={botP.sx} cy={botP.sy} r="2.5" fill="#93c5fd" />
                {showAngles && (
                  <text
                    x={midX + 6}
                    y={midY}
                    fill={isSelected ? '#0369a1' : '#1e40af'}
                    fontSize="9.5"
                    fontWeight="bold"
                  >
                    {rPt.z.toFixed(1)} {unitDist}
                  </text>
                )}
              </g>
            )
          })}

          {/* 5. Translucent Blue 3D Roof Facets (Sorted by depth) */}
          {sortedFaces.map((face, idx) => {
            const ptsStr = face.projVerts.map(p => `${p.sx.toFixed(1)},${p.sy.toFixed(1)}`).join(' ')
            const fillOpacities = [0.16, 0.22, 0.14, 0.26, 0.19]
            const op = fillOpacities[idx % fillOpacities.length]
            return (
              <g key={`f3d-${face.id}`}>
                <polygon
                  points={ptsStr}
                  fill={`rgba(37, 99, 235, ${op})`}
                  stroke="#2563eb"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </g>
            )
          })}

          {/* 6. Base Eaves Perimeter Lines */}
          {base3D.map((bPt, idx) => {
            const nextPt = base3D[(idx + 1) % base3D.length]
            const pA = project3D(bPt)
            const pB = project3D(nextPt)
            return (
              <line
                key={`eave-3d-${idx}`}
                x1={pA.sx}
                y1={pA.sy}
                x2={pB.sx}
                y2={pB.sy}
                stroke="#2563eb"
                strokeWidth="2"
                strokeLinecap="round"
              />
            )
          })}

          {/* 7. Interactive 3D Vectors (Ridges, Hips, Valleys) — Click or Drag Vertically to Adjust Height! */}
          {vectors3D.map((vec) => {
            const pA = project3D(vec.a)
            const pB = project3D(vec.b)
            const midX = (pA.sx + pB.sx) / 2
            const midY = (pA.sy + pB.sy) / 2
            const isSelected = selectedVectorId === vec.id
            const isHovered = hoveredVectorId === vec.id

            return (
              <g
                key={`vec3d-${vec.id}`}
                onPointerDown={(e) => handleVectorPointerDown(vec, e)}
                onPointerEnter={() => setHoveredVectorId(vec.id)}
                onPointerLeave={() => setHoveredVectorId(prev => (prev === vec.id ? null : prev))}
                className="cursor-ns-resize"
              >
                {/* Wide transparent hit target so clicking/grabbing any vector line is effortless */}
                <line
                  x1={pA.sx}
                  y1={pA.sy}
                  x2={pB.sx}
                  y2={pB.sy}
                  stroke="transparent"
                  strokeWidth="14"
                  strokeLinecap="round"
                />

                {/* Highlight halo when Vector is selected or hovered */}
                {(isSelected || isHovered) && (
                  <line
                    x1={pA.sx}
                    y1={pA.sy}
                    x2={pB.sx}
                    y2={pB.sy}
                    stroke={isSelected ? 'rgba(14, 165, 233, 0.45)' : 'rgba(59, 130, 246, 0.3)'}
                    strokeWidth={isSelected ? '9' : '7'}
                    strokeLinecap="round"
                  />
                )}

                {/* Visible Blue Vector Line */}
                <line
                  x1={pA.sx}
                  y1={pA.sy}
                  x2={pB.sx}
                  y2={pB.sy}
                  stroke={
                    isSelected
                      ? '#0284c7'
                      : isHovered
                        ? '#1d4ed8'
                        : vec.isMainRidge
                          ? '#1d4ed8'
                          : '#2563eb'
                  }
                  strokeWidth={isSelected ? '4.2' : vec.isMainRidge ? '3.2' : '2.2'}
                  strokeLinecap="round"
                />

                {/* Vector Midpoint Badge (Always shown on Main Ridge Vectors, or when Vector mode / hovered / selected) */}
                {(isSelected || isHovered || selectorTab === 'vectors' || vec.isMainRidge) && (
                  <g transform={`translate(${midX}, ${midY})`}>
                    {/* Vertical Drag Arrow Gizmo when selected */}
                    {isSelected && (
                      <g>
                        <line x1="0" y1="-22" x2="0" y2="22" stroke="#0284c7" strokeWidth="1.8" />
                        <polygon points="0,-26 -4,-19 4,-19" fill="#0284c7" />
                        <polygon points="0,26 -4,19 4,19" fill="#0284c7" />
                      </g>
                    )}
                    <rect
                      x={isSelected ? '-28' : '-11'}
                      y="-7.5"
                      width={isSelected ? '56' : '22'}
                      height="15"
                      rx="4"
                      fill={isSelected ? '#000000' : '#ffffff'}
                      stroke={isSelected ? '#0284c7' : '#2563eb'}
                      strokeWidth="1.4"
                    />
                    <text
                      x="0"
                      y="3"
                      textAnchor="middle"
                      fill={isSelected ? '#ffffff' : '#1e40af'}
                      fontSize="8.5"
                      fontWeight="bold"
                    >
                      {isSelected
                        ? `${vec.shortLabel}: ${vec.avgHeightFt.toFixed(1)}${unitDist}`
                        : vec.shortLabel}
                    </text>
                  </g>
                )}
              </g>
            )
          })}

          {/* 8. Slope Angle Badges on 3D Facets */}
          {showAngles && selectorTab !== 'vectors' && sortedFaces.map((face) => {
            if (face.angleDeg < 1) return null
            return (
              <g
                key={`angle-badge-${face.id}`}
                transform={`translate(${face.centerProj.sx}, ${face.centerProj.sy})`}
                className="pointer-events-none"
              >
                <rect
                  x="-26"
                  y="-8"
                  width="52"
                  height="15"
                  rx="4"
                  fill="rgba(255, 255, 255, 0.90)"
                  stroke="#3b82f6"
                  strokeWidth="1"
                />
                <text
                  x="0"
                  y="2.5"
                  textAnchor="middle"
                  fill="#1e3a8a"
                  fontSize="8.5"
                  fontWeight="bold"
                >
                  {face.angleDeg.toFixed(1)}° ({Math.round(face.pitchRise)}/12)
                </text>
              </g>
            )
          })}

          {/* 9. Interactive 3D Eaves Corner Nodes (Clicking selects nearest connected vector/point) */}
          {base3D.map((bPt, idx) => {
            const p = project3D(bPt)
            return (
              <circle
                key={`bnode-${idx}`}
                cx={p.sx}
                cy={p.sy}
                r="4"
                fill="#ffffff"
                stroke="#2563eb"
                strokeWidth="2"
                className="cursor-pointer"
                onPointerDown={(e) => {
                  e.stopPropagation()
                  const connVec = vectors3D.find(
                    v => v.fromToken === `b${idx}` || v.toToken === `b${idx}`
                  )
                  if (connVec) {
                    setSelectedVectorId(connVec.id)
                    setSelectorTab('vectors')
                  }
                }}
              />
            )
          })}

          {/* 10. Interactive 3D Ridge / Cumbrera Nodes (Click or Drag Vertically to Change Point Height!) */}
          {ridge3D.map((rPt, idx) => {
            const p = project3D(rPt)
            const isSelected =
              (selectedVectorId === null && selectedPointIdx === idx) ||
              (selectedVector?.ridgeIndices.includes(idx) ?? false)
            const isPrimaryPoint = selectedVectorId === null && selectedPointIdx === idx
            const isHovered = hoveredPointIdx === idx

            return (
              <g
                key={`rnode-${idx}`}
                onPointerDown={(e) => handlePointPointerDown(idx, e)}
                onPointerEnter={() => setHoveredPointIdx(idx)}
                onPointerLeave={() => setHoveredPointIdx(prev => (prev === idx ? null : prev))}
                className="cursor-ns-resize"
              >
                {/* Generous invisible hit circle for easy clicking & vertical dragging */}
                <circle cx={p.sx} cy={p.sy} r="14" fill="transparent" />

                {/* Vertical Elevation Arrow Gizmo when this specific Point is selected */}
                {isPrimaryPoint && (
                  <g>
                    <line
                      x1={p.sx}
                      y1={p.sy - 24}
                      x2={p.sx}
                      y2={p.sy + 24}
                      stroke="#0284c7"
                      strokeWidth="1.8"
                    />
                    <polygon
                      points={`${p.sx},${p.sy - 28} ${p.sx - 4},${p.sy - 21} ${p.sx + 4},${p.sy - 21}`}
                      fill="#0284c7"
                    />
                    <polygon
                      points={`${p.sx},${p.sy + 28} ${p.sx - 4},${p.sy + 21} ${p.sx + 4},${p.sy + 21}`}
                      fill="#0284c7"
                    />
                  </g>
                )}

                {(isSelected || isHovered) && (
                  <circle
                    cx={p.sx}
                    cy={p.sy}
                    r="11"
                    fill="rgba(37, 99, 235, 0.25)"
                  />
                )}

                <circle
                  cx={p.sx}
                  cy={p.sy}
                  r={isSelected ? '6.5' : '5.2'}
                  fill={isSelected ? '#000000' : '#2563eb'}
                  stroke="#ffffff"
                  strokeWidth="2"
                />

                <text
                  x={p.sx}
                  y={p.sy - (isPrimaryPoint ? 30 : 9)}
                  textAnchor="middle"
                  fill="#0f172a"
                  fontSize="9.5"
                  fontWeight="bold"
                >
                  P{idx + 1}
                </text>
              </g>
            )
          })}
        </svg>

        {/* Bottom-left instruction badge inside 3D canvas */}
        <div className="absolute bottom-1.5 left-2.5 pointer-events-none text-[9px] font-semibold text-slate-600 bg-white/90 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1">
          <MoveVertical size={10} className="text-blue-600" />
          <span>
            {lang === 'en'
              ? 'Click/drag any Point (P) or Vector (V) to change height • Drag space to rotate'
              : 'Toca/arrastra un Punto (P) o Vector (V) para su altura • Fondo para girar'}
          </span>
        </div>

        {/* Zoom + / - inside 3D canvas */}
        <div className="absolute bottom-1.5 right-2.5 flex items-center gap-1">
          <button
            type="button"
            onClick={() => setZoomScale(z => Math.max(0.6, Number((z - 0.15).toFixed(2))))}
            className="w-5 h-5 rounded bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 font-bold text-xs flex items-center justify-center cursor-pointer shadow-2xs"
          >
            -
          </button>
          <button
            type="button"
            onClick={() => setZoomScale(z => Math.min(1.8, Number((z + 0.15).toFixed(2))))}
            className="w-5 h-5 rounded bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 font-bold text-xs flex items-center justify-center cursor-pointer shadow-2xs"
          >
            +
          </button>
        </div>
      </div>

      {/* Footer Live Height & Angle Editor for Selected Point, Selected Vector, or Entire Roof */}
      <div className="px-3 py-2 bg-black text-white border-t border-neutral-800 space-y-1.5 text-[11px]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <ArrowUpDown size={13} className="text-blue-400 shrink-0" />
            <span className="font-bold text-white truncate">
              {selectedVector
                ? `${lang === 'en' ? 'Vector' : 'Vector'} ${selectedVector.fullLabel}:`
                : selectedPointIdx !== null
                  ? `${lang === 'en' ? 'Point' : 'Punto'} P${selectedPointIdx + 1}:`
                  : `${lang === 'en' ? 'All Roof:' : 'Todo el Techo:'}`}
            </span>
            <span className="font-black text-blue-400 shrink-0">
              {activeHeight.toFixed(1)} {unitDist}
            </span>
            {selectedVector && (
              <span className="text-[9.5px] text-neutral-400 shrink-0">
                • {selectedVector.length3DFt.toFixed(1)} {unitDist} • {selectedVector.slopeAngleDeg.toFixed(1)}°
              </span>
            )}
          </div>

          {/* Step -1 / +1 & Reset/Apply All */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => handleStepActiveHeight(-1)}
              className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-[10px] cursor-pointer"
              title="-1 ft"
            >
              -1
            </button>
            <button
              type="button"
              onClick={() => handleStepActiveHeight(1)}
              className="px-1.5 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] cursor-pointer"
              title="+1 ft"
            >
              +1
            </button>
            {(selectedPointIdx !== null || selectedVector !== null) && (
              <button
                type="button"
                onClick={() => onApplyHeightToAll(activeHeight)}
                className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-blue-400 font-bold text-[9.5px] border border-neutral-700 cursor-pointer"
                title={lang === 'en' ? 'Apply this height to all roof points' : 'Aplicar esta altura a todo el techo'}
              >
                {lang === 'en' ? 'All' : 'Todos'}
              </button>
            )}
          </div>
        </div>

        {/* Slider + Quick Height Presets */}
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={2}
            max={26}
            step={0.5}
            value={activeHeight}
            onChange={(e) => handleSetActiveHeight(parseFloat(e.target.value))}
            className="flex-1 accent-blue-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
          />
          <div className="flex items-center gap-1 shrink-0">
            {[6, 10, 14, 18].map(hPreset => (
              <button
                key={hPreset}
                type="button"
                onClick={() => handleSetActiveHeight(hPreset)}
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold cursor-pointer ${
                  Math.abs(activeHeight - hPreset) < 0.3
                    ? 'bg-blue-600 text-white'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                {hPreset}{unitDist}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
