"use client"

import { useState, useEffect } from 'react'
import type { FacetItem } from '@/components/Map'
import { Sliders, HelpCircle, Share2 } from 'lucide-react'
import { translations, Language } from '@/lib/translations'

interface CalculatorProps {
  areaSqFt: number
  facets?: FacetItem[]
  currentPhase?: 'base' | 'facets' | 'specs'
  baseAreaSqFt?: number
  onGoToPhase?: (phase: 'base' | 'facets' | 'specs') => void
  totalRidgeLengthFt?: number
  ridgesCount?: number
  roofType?: string
  lang?: Language
  initialSpecs?: {
    pitchRise?: number
    wastePercent?: number
    materialId?: string
    includeTearOff?: boolean
  } | null
  onSpecsChange?: (specs: {
    pitchRise: number
    wastePercent: number
    materialId: string
    includeTearOff: boolean
    squaresNeeded: number
    materialCost: number
    laborCost: number
    tearOffCost: number
    permitsCost: number
    totalEstimate: number
  }) => void
  onShareClick?: () => void
}

// Common pitch configurations with exact geometric angles & multipliers
const PITCH_OPTIONS = [
  { rise: 2, angle: 9.46, multiplier: 1.014 },
  { rise: 4, angle: 18.43, multiplier: 1.054 },
  { rise: 6, angle: 26.57, multiplier: 1.118 },
  { rise: 8, angle: 33.69, multiplier: 1.202 },
  { rise: 10, angle: 39.81, multiplier: 1.302 },
  { rise: 12, angle: 45.00, multiplier: 1.414 },
]

// Materials with price per Square (1 Square = 100 sq ft, standard US roofing unit)
const MATERIALS = [
  { id: 'asphalt-30', pricePerSquare: 440, laborPerSquare: 250 },
  { id: 'architectural', pricePerSquare: 520, laborPerSquare: 270 },
  { id: 'metal', pricePerSquare: 920, laborPerSquare: 450 },
  { id: 'cedar', pricePerSquare: 780, laborPerSquare: 380 },
]

const ROOF_STYLE_KEYS = [
  { id: 'gable', key: 'gable' as const },
  { id: 'hip', key: 'hip' as const },
  { id: 'cross-gable', key: 'crossGable' as const },
  { id: 'shed', key: 'shed' as const },
  { id: 'mansard', key: 'mansard' as const },
  { id: 'flat', key: 'flat' as const },
]

export default function Calculator({
  areaSqFt,
  facets = [],
  currentPhase = 'specs',
  baseAreaSqFt = 0,
  onGoToPhase,
  totalRidgeLengthFt = 0,
  ridgesCount = 0,
  roofType,
  lang = 'en',
  initialSpecs,
  onSpecsChange,
  onShareClick
}: CalculatorProps) {
  const t = translations[lang].calculator
  const [selectedPitchRise, setSelectedPitchRise] = useState<number>(initialSpecs?.pitchRise || 6)
  const [roofStyle, setRoofStyle] = useState<string>('hip')
  const [wastePercent, setWastePercent] = useState<number>(initialSpecs?.wastePercent || 15)
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(initialSpecs?.materialId || 'asphalt-30')
  const [includeTearOff, setIncludeTearOff] = useState<boolean>(initialSpecs?.includeTearOff !== undefined ? initialSpecs.includeTearOff : true)

  // Sync initialSpecs if loaded from URL share
  useEffect(() => {
    if (initialSpecs) {
      if (initialSpecs.pitchRise !== undefined) setSelectedPitchRise(initialSpecs.pitchRise)
      if (initialSpecs.wastePercent !== undefined) setWastePercent(initialSpecs.wastePercent)
      if (initialSpecs.materialId !== undefined) setSelectedMaterialId(initialSpecs.materialId)
      if (initialSpecs.includeTearOff !== undefined) setIncludeTearOff(initialSpecs.includeTearOff)
    }
  }, [initialSpecs])

  // Sync roofStyle with roofType selected in the 3D map
  useEffect(() => {
    if (roofType) {
      if (
        roofType === 'pyramid' ||
        roofType === 'hip' ||
        roofType === 'compound-hip' ||
        roofType === 'v2-stepped-hip' ||
        roofType === 'v2-hip-6-dormers'
      ) {
        setRoofStyle('hip')
      } else if (roofType === 'gable') {
        setRoofStyle('gable')
      } else if (roofType === 'shed') {
        setRoofStyle('shed')
      } else {
        setRoofStyle('cross-gable')
      }
    }
  }, [roofType])

  // Find pitch details
  const currentPitch = PITCH_OPTIONS.find(p => p.rise === selectedPitchRise) || PITCH_OPTIONS[2]
  const currentMaterial = MATERIALS.find(m => m.id === selectedMaterialId) || MATERIALS[0]

  // Calculations
  const slopeMultiplier = currentPitch.multiplier
  const pitchedSurfaceArea = areaSqFt * slopeMultiplier
  const totalAreaWithWaste = pitchedSurfaceArea * (1 + wastePercent / 100)
  
  // Squares needed (1 square = 100 sq ft)
  const squaresNeeded = Math.max(0, totalAreaWithWaste / 100)
  
  // Costs
  const materialCost = squaresNeeded * currentMaterial.pricePerSquare
  const laborCost = squaresNeeded * currentMaterial.laborPerSquare
  const tearOffCost = includeTearOff ? squaresNeeded * 120 : 0
  const permits = areaSqFt > 0 ? 250 : 0
  const totalEstimate = areaSqFt > 0 ? materialCost + laborCost + tearOffCost + permits : 0

  // Emit specs to parent for live sharing
  useEffect(() => {
    onSpecsChange?.({
      pitchRise: selectedPitchRise,
      wastePercent,
      materialId: selectedMaterialId,
      includeTearOff,
      squaresNeeded,
      materialCost,
      laborCost,
      tearOffCost,
      permitsCost: permits,
      totalEstimate
    })
  }, [selectedPitchRise, wastePercent, selectedMaterialId, includeTearOff, squaresNeeded, materialCost, laborCost, tearOffCost, permits, totalEstimate, onSpecsChange])

  const unitArea = lang === 'en' ? 'sq ft' : 'pies²'
  const unitLinear = lang === 'en' ? 'linear ft' : 'pies lineales'

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-800">{t.title}</h2>
          <p className="text-[11px] text-slate-500">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg text-xs font-semibold border border-blue-100">
          <Sliders size={13} />
          <span>{t.badge}</span>
        </div>
      </div>

      <div className="space-y-4 flex-1">
        {/* Measured Map Area */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {t.baseSatelliteFootprint}
            </span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white border border-blue-200 text-blue-700">
              {totalRidgeLengthFt > 0
                ? t.linearFtRidgeCaps(totalRidgeLengthFt.toFixed(1))
                : facets.length > 0
                ? t.slopedFacetsCount(facets.length)
                : t.satelliteFootprintBadge}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-black text-blue-600">
              {Math.round(areaSqFt).toLocaleString('en-US')} <span className="text-sm font-bold text-slate-700">{unitArea}</span>
            </div>
            <div className="text-xs font-semibold text-slate-500">
              ({(areaSqFt / 10.7639).toFixed(1)} m²)
            </div>
          </div>
          {areaSqFt === 0 && (
            <p className="text-[11px] text-blue-600 mt-1">
              {t.clickToGenerateHint}
            </p>
          )}
        </div>

        {/* Roof Style */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {t.roofStyleLabel}
          </label>
          <select
            value={roofStyle}
            onChange={(e) => setRoofStyle(e.target.value)}
            className="w-full border border-slate-300 rounded-lg p-2 text-xs text-slate-800 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {ROOF_STYLE_KEYS.map(style => (
              <option key={style.id} value={style.id}>
                {t.roofStyles[style.key]}
              </option>
            ))}
          </select>
        </div>

        {/* Pitch / Incline */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <span>{t.pitchLabel}</span>
            </label>
            <span className="text-xs font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded">
              {selectedPitchRise}/12
            </span>
          </div>
          <select
            value={selectedPitchRise}
            onChange={(e) => setSelectedPitchRise(Number(e.target.value))}
            className="w-full border border-slate-300 rounded-lg p-2 text-xs text-slate-800 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {PITCH_OPTIONS.map(p => (
              <option key={p.rise} value={p.rise}>
                {t.pitchOptions[p.rise]?.label || `${p.rise}/12`} ({p.angle}°)
              </option>
            ))}
          </select>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
            <div className="bg-white p-2 rounded-lg border border-slate-200/60">
              <span className="text-slate-400 block text-[10px]">{t.pitchAngleLabel}</span>
              <span className="font-bold text-slate-700">{currentPitch.angle}°</span>
            </div>
            <div className="bg-white p-2 rounded-lg border border-slate-200/60">
              <span className="text-slate-400 block text-[10px]">{t.slopeMultiplierLabel}</span>
              <span className="font-bold text-slate-700">{currentPitch.multiplier}</span>
            </div>
          </div>
        </div>

        {/* Waste Percentage */}
        <div className="flex items-center justify-between gap-2">
          <label className="text-xs font-semibold text-slate-700">{t.wasteLabel}</label>
          <div className="flex items-center gap-1">
            {[10, 15, 20].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => setWastePercent(pct)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  wastePercent === pct
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>

        {/* Material Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {t.materialLabel}
          </label>
          <select
            value={selectedMaterialId}
            onChange={(e) => setSelectedMaterialId(e.target.value)}
            className="w-full border border-slate-300 rounded-lg p-2 text-xs text-slate-800 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {MATERIALS.map(m => {
              const matName = m.id === 'asphalt-30'
                ? t.materials.asphalt30
                : m.id === 'architectural'
                ? t.materials.architectural
                : m.id === 'metal'
                ? t.materials.metal
                : t.materials.cedar
              return (
                <option key={m.id} value={m.id}>
                  {matName} (${m.pricePerSquare} USD / Square [100 {unitArea}])
                </option>
              )
            })}
          </select>
        </div>

        {/* Tear-Off Checkbox */}
        <div className="flex items-center gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
          <input
            type="checkbox"
            id="tearoff"
            checked={includeTearOff}
            onChange={(e) => setIncludeTearOff(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
          />
          <label htmlFor="tearoff" className="text-xs text-slate-700 cursor-pointer select-none font-medium">
            {t.tearOffLabel}
          </label>
        </div>

        {/* FreeRoofQuote Style Technical Summary Box - Pure Black as requested */}
        <div className="bg-black text-white p-4 rounded-xl space-y-2.5 text-xs border border-neutral-800 shadow-md">
          <div className="flex justify-between items-center text-neutral-300 border-b border-neutral-800 pb-2">
            <span>{t.pitchedSurfaceArea}</span>
            <span className="font-semibold text-white">
              {Math.round(pitchedSurfaceArea).toLocaleString('en-US')} {unitArea}{' '}
              <span className="text-neutral-400 font-normal">({(pitchedSurfaceArea / 10.7639).toFixed(1)} m²)</span>
            </span>
          </div>
          <div className="flex justify-between items-center text-neutral-300 border-b border-neutral-800 pb-2">
            <span>{t.totalAreaWithWaste(wastePercent)}</span>
            <span className="font-semibold text-white">
              {Math.round(totalAreaWithWaste).toLocaleString('en-US')} {unitArea}{' '}
              <span className="text-neutral-400 font-normal">({(totalAreaWithWaste / 10.7639).toFixed(1)} m²)</span>
            </span>
          </div>
          {totalRidgeLengthFt > 0 && (
            <div className="flex justify-between items-center text-neutral-300 border-b border-neutral-800 pb-2">
              <span>{t.ridgeAndHipCaps}</span>
              <span className="font-semibold text-blue-400">{totalRidgeLengthFt.toFixed(1)} {unitLinear}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-1">
            <span className="text-blue-400 font-bold uppercase text-[11px] tracking-wide flex items-center gap-1">
              <span>{t.squaresNeeded}</span>
            </span>
            <div className="text-right">
              <span className="text-xl font-black text-white">
                {squaresNeeded.toFixed(1)} <span className="text-xs font-bold text-blue-400">{t.squaresUnit}</span>
              </span>
              <span className="block text-[10px] text-neutral-400">
                {t.squaresEquivalent(
                  Math.round(squaresNeeded * 100).toLocaleString('en-US'),
                  (squaresNeeded * 9.29).toFixed(1)
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Measurement Guide */}
        <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3 text-xs text-slate-700">
          <div className="flex items-start gap-2">
            <HelpCircle size={16} className="text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-blue-900 block text-[11px]">
                {t.guideTitle}
              </span>
              <p className="text-[10px] text-slate-600 leading-tight">
                {t.guideSqFt}
              </p>
              <p className="text-[10px] text-slate-600 leading-tight">
                {t.guideSquare}
              </p>
              <p className="text-[10px] text-slate-600 leading-tight">
                {t.guideLinearFt}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown and Final Estimate */}
      <div className="mt-5 pt-4 border-t border-slate-200">
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>{t.materialsCost(squaresNeeded.toFixed(1))}</span>
            <span className="font-medium">${Math.round(materialCost).toLocaleString('en-US')} USD</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>{t.laborCost}</span>
            <span className="font-medium">${Math.round(laborCost).toLocaleString('en-US')} USD</span>
          </div>
          {includeTearOff && (
            <div className="flex justify-between text-slate-600">
              <span>{t.tearOffCost}</span>
              <span className="font-medium">${Math.round(tearOffCost).toLocaleString('en-US')} USD</span>
            </div>
          )}
          {totalRidgeLengthFt > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>{t.ridgeCapBundles(totalRidgeLengthFt.toFixed(1), Math.ceil(totalRidgeLengthFt / 30))}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-600">
            <span>{t.permits}</span>
            <span className="font-medium">${permits} USD</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-end">
          <div>
            <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">{t.estimatedTotal}</div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              ${Math.round(totalEstimate).toLocaleString('en-US')} USD
            </div>
          </div>
          <button
            type="button"
            disabled={areaSqFt === 0}
            onClick={onShareClick}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold transition-all text-xs shadow-md ${
              areaSqFt > 0
                ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer hover:shadow-lg active:scale-95'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
            title={lang === 'en' ? "Share interactive 3D estimate" : "Compartir estimación interactiva 3D"}
          >
            <Share2 size={15} />
            <span>{translations[lang].share.shareButton}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
