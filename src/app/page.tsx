"use client"

import { useState, useCallback, useEffect, useRef } from 'react'
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api'
import { Search, Share2, ShieldCheck, PlusCircle } from 'lucide-react'
import Map, { FacetItem, PhaseType, RoofType, RidgeOrientation } from '@/components/Map'
import Calculator from '@/components/Calculator'
import ShareModal from '@/components/ShareModal'
import { translations, Language } from '@/lib/translations'
import {
  RoofEstimateState,
  generateEstimateId,
  serializeEstimateToUrl,
  deserializeEstimateFromUrl
} from '@/lib/estimateShare'

const libraries: ("places" | "geometry")[] = ["places", "geometry"]

export default function Home() {
  const [lang, setLang] = useState<Language>('en')
  const tHeader = translations[lang].header
  const tShare = translations[lang].share

  const [areaSqFt, setAreaSqFt] = useState(0)
  const [facets, setFacets] = useState<FacetItem[]>([])
  const [baseAreaSqFt, setBaseAreaSqFt] = useState(0)
  const [totalRidgeFt, setTotalRidgeFt] = useState(0)
  const [selectedRoofType, setSelectedRoofType] = useState<RoofType>('hip')
  const [addressCoords, setAddressCoords] = useState<{lat: number, lng: number} | null>(null)
  const [searchAddress, setSearchAddress] = useState<string>('')
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null)

  // Live exported state from Map and Calculator
  const [mapExportState, setMapExportState] = useState<{
    basePolygon: google.maps.LatLngLiteral[]
    ridgePoints: google.maps.LatLngLiteral[]
    roofType: RoofType
    orientation: RidgeOrientation
    roofHeightFt: number
  } | null>(null)

  const [calculatorSpecs, setCalculatorSpecs] = useState<{
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
  } | null>(null)

  // Share Modal & URL Restoration State
  const [estimateId, setEstimateId] = useState<string>('')
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState<string>('')
  const [liveEstimate, setLiveEstimate] = useState<RoofEstimateState | null>(null)
  const [isViewingShared, setIsViewingShared] = useState(false)

  // Initial props restored from URL if loaded via share
  const [initialMapEstimate, setInitialMapEstimate] = useState<{
    basePolygon: google.maps.LatLngLiteral[]
    ridgePoints: google.maps.LatLngLiteral[]
    roofType: RoofType
    orientation: RidgeOrientation
    roofHeightFt: number
  } | null>(null)

  const [initialSpecs, setInitialSpecs] = useState<{
    pitchRise: number
    wastePercent: number
    materialId: string
    includeTearOff: boolean
  } | null>(null)

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  })

  // Detect and restore shared estimate from URL hash or query string
  useEffect(() => {
    if (typeof window === 'undefined') return

    const hashOrQuery = window.location.hash || window.location.search
    if (hashOrQuery && (hashOrQuery.includes('est=') || hashOrQuery.includes('data='))) {
      const restored = deserializeEstimateFromUrl(hashOrQuery)
      if (restored && restored.basePolygon && restored.basePolygon.length >= 3) {
        setIsViewingShared(true)
        setEstimateId(restored.id || generateEstimateId())
        if (restored.addressText) setSearchAddress(restored.addressText)
        if (restored.lat && restored.lng) {
          setAddressCoords({ lat: restored.lat, lng: restored.lng })
        }
        setInitialMapEstimate({
          basePolygon: restored.basePolygon,
          ridgePoints: restored.ridgePoints || [],
          roofType: restored.roofType || 'hip',
          orientation: restored.orientation || 'horizontal',
          roofHeightFt: restored.roofHeightFt || 8.0
        })
        setInitialSpecs({
          pitchRise: restored.pitchRise || 6,
          wastePercent: restored.wastePercent || 15,
          materialId: restored.materialId || 'asphalt-30',
          includeTearOff: restored.includeTearOff ?? true
        })
      }
    }
  }, [])

  const onLoad = (autoC: google.maps.places.Autocomplete) => {
    setAutocomplete(autoC)
  }

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace()
      if (place.formatted_address) {
        setSearchAddress(place.formatted_address)
      }
      if (place.geometry?.location) {
        setAddressCoords({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        })
      }
    }
  }

  const handleFacetsChange = useCallback((
    newFacets: FacetItem[],
    phase: PhaseType,
    baseArea: number,
    totalRidgeLength?: number,
    roofType?: RoofType
  ) => {
    setFacets(newFacets)
    setBaseAreaSqFt(baseArea)
    if (totalRidgeLength !== undefined) {
      setTotalRidgeFt(totalRidgeLength)
    }
    if (roofType !== undefined) {
      setSelectedRoofType(roofType)
    }
  }, [])

  const handleAreaChange = useCallback((newArea: number) => {
    setAreaSqFt(newArea)
  }, [])

  const handleMapStateExport = useCallback((state: {
    basePolygon: google.maps.LatLngLiteral[]
    ridgePoints: google.maps.LatLngLiteral[]
    roofType: RoofType
    orientation: RidgeOrientation
    roofHeightFt: number
  }) => {
    setMapExportState(state)
  }, [])

  const handleSpecsChange = useCallback((specs: {
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
  }) => {
    setCalculatorSpecs(specs)
  }, [])

  // Open Share Dialog and build shareable link
  const handleOpenShareModal = () => {
    if (areaSqFt === 0 || !mapExportState) return

    const activeId = estimateId || generateEstimateId()
    if (!estimateId) setEstimateId(activeId)

    const fullEstimate: RoofEstimateState = {
      id: activeId,
      createdAt: new Date().toISOString(),
      addressText: searchAddress || (addressCoords ? `${addressCoords.lat.toFixed(5)}, ${addressCoords.lng.toFixed(5)}` : 'Minnesota Residential Property'),
      lat: addressCoords?.lat || (mapExportState.basePolygon[0]?.lat || 44.9778),
      lng: addressCoords?.lng || (mapExportState.basePolygon[0]?.lng || -93.2650),
      basePolygon: mapExportState.basePolygon,
      ridgePoints: mapExportState.ridgePoints,
      roofType: mapExportState.roofType,
      orientation: mapExportState.orientation,
      roofHeightFt: mapExportState.roofHeightFt,
      pitchRise: calculatorSpecs?.pitchRise || 6,
      wastePercent: calculatorSpecs?.wastePercent || 15,
      materialId: calculatorSpecs?.materialId || 'asphalt-30',
      includeTearOff: calculatorSpecs?.includeTearOff ?? true,
      baseAreaSqFt: baseAreaSqFt,
      pitchedAreaSqFt: areaSqFt,
      totalRidgeLengthFt: totalRidgeFt,
      squaresNeeded: calculatorSpecs?.squaresNeeded || (areaSqFt * 1.15 / 100),
      materialCost: calculatorSpecs?.materialCost || 0,
      laborCost: calculatorSpecs?.laborCost || 0,
      tearOffCost: calculatorSpecs?.tearOffCost || 0,
      permitsCost: calculatorSpecs?.permitsCost || 250,
      totalEstimate: calculatorSpecs?.totalEstimate || 0
    }

    const token = serializeEstimateToUrl(fullEstimate)
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://calculator.veltoshi.com'
    const path = typeof window !== 'undefined' ? window.location.pathname : '/'
    const url = `${origin}${path}#est=${token}`

    // Update browser URL hash without full reload so user can also copy from address bar
    if (typeof window !== 'undefined' && window.history?.replaceState) {
      window.history.replaceState(null, '', `#est=${token}`)
    }

    setLiveEstimate(fullEstimate)
    setShareUrl(url)
    setIsShareModalOpen(true)
  }

  // Clear shared state and start fresh
  const handleCreateNew = () => {
    setIsViewingShared(false)
    setEstimateId('')
    setSearchAddress('')
    setInitialMapEstimate(null)
    setInitialSpecs(null)
    if (typeof window !== 'undefined' && window.history?.replaceState) {
      window.history.replaceState(null, '', window.location.pathname)
    }
    window.location.reload()
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-blue-900">
              {tHeader.brand}<span className="text-blue-600">{tHeader.subbrand}</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Share Button in Header */}
            {areaSqFt > 0 && (
              <button
                type="button"
                onClick={handleOpenShareModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                title={tShare.shareButton}
              >
                <Share2 size={14} />
                <span className="hidden sm:inline">{tShare.shareButton}</span>
              </button>
            )}

            {/* Language Switcher (Defaults to EN) - Clean typography, no emojis */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  lang === 'en'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang('es')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  lang === 'es'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ES
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-4 text-sm font-medium text-slate-600">
              <a
                href="https://veltoshi.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-blue-600 transition-colors"
              >
                {tHeader.backToSite}
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Banner when viewing a shared estimate */}
        {isViewingShared && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-900 shadow-2xs animate-fade-in">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-blue-600 shrink-0" />
              <div>
                <span className="font-bold block sm:inline">
                  {tShare.sharedBannerNotice(estimateId)}
                </span>
                <span className="text-[11px] text-blue-700 sm:ml-2 block sm:inline">
                  {searchAddress || 'Minnesota Property'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleOpenShareModal}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all cursor-pointer shadow-2xs"
              >
                <Share2 size={13} />
                <span>{tShare.shareButton}</span>
              </button>
              <button
                type="button"
                onClick={handleCreateNew}
                className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-bold transition-all cursor-pointer"
              >
                <PlusCircle size={13} />
                <span>{tShare.createNewEstimate}</span>
              </button>
            </div>
          </div>
        )}

        <div className="mb-6 max-w-3xl">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
            {tHeader.title}
          </h1>
          <p className="text-slate-600 text-sm sm:text-base">
            {tHeader.subtitle}
          </p>
        </div>

        {/* Address Search Bar */}
        <div className="mb-6 relative max-w-2xl">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
            <Search size={18} className="text-slate-400" />
          </div>
          {isLoaded ? (
            <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
              <input
                type="text"
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                placeholder={tHeader.searchPlaceholder}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm sm:text-base transition-shadow bg-white text-slate-900"
              />
            </Autocomplete>
          ) : (
            <input
              type="text"
              disabled
              placeholder={tHeader.searchLoading}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 shadow-sm bg-slate-100 text-slate-500 outline-none text-sm sm:text-base"
            />
          )}
        </div>

        {/* Main Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[700px]">
          {/* Map Section */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative min-h-[520px]">
            <Map 
              onAreaChange={handleAreaChange} 
              onFacetsChange={handleFacetsChange}
              addressCoordinates={addressCoords}
              isLoaded={isLoaded}
              loadError={undefined}
              lang={lang}
              initialEstimate={initialMapEstimate}
              onStateExport={handleMapStateExport}
            />
          </div>

          {/* Calculator Section */}
          <div className="lg:col-span-1 h-full min-h-[520px]">
            <Calculator 
              areaSqFt={areaSqFt} 
              facets={facets}
              baseAreaSqFt={baseAreaSqFt}
              totalRidgeLengthFt={totalRidgeFt}
              roofType={selectedRoofType}
              lang={lang}
              initialSpecs={initialSpecs}
              onSpecsChange={handleSpecsChange}
              onShareClick={handleOpenShareModal}
            />
          </div>
        </div>
      </div>

      {/* Share Estimate Modal */}
      {liveEstimate && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          estimate={liveEstimate}
          shareUrl={shareUrl}
          lang={lang}
        />
      )}
    </main>
  )
}
