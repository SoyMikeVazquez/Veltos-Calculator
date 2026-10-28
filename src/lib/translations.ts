export type Language = 'en' | 'es'

export interface ModelTextItem {
  label: string
  sublabel: string
  points: string
  desc: string
}

export interface TranslationDictionary {
  header: {
    brand: string
    subbrand: string
    backToSite: string
    title: string
    subtitle: string
    searchPlaceholder: string
    searchLoading: string
  }
  map: {
    zoomOutTitle: string
    zoomInTitle: string
    magnifier: string
    measurementsOn: string
    measurementsOff: string
    measurementsToggleTitle: string
    rotateTitle: string
    resetTitle: string
    clickPromptTitle: string
    clickPromptDesc: string
    roofStructureTitle: string
    ridgePointsBadge: (count: number) => string
    conventionalModelLabel: string
    orientationLabel: string
    horizontal: string
    vertical: string
    customizeToggleShow: string
    customizeToggleHide: string
    customizationTitle: string
    ridgeVerticesLabel: string
    eavesCornersLabel: string
    removeTooltip: string
    add: string
    removeCornerTooltip: string
    addCorner: string
    clickOnMap: string
    clickOnMapRidgeTitle: string
    clickOnMapCornerTitle: string
    dragTip: string
    baseFootprintLabel: string
    ridgeCapsLabel: string
    linearFt: string
    pitchLabel: string
    pointHeightTitle: (idx: number) => string
    pointHeightHint: string
    applyHeightToAll: string
    reducePitchTitle: string
    increasePitchTitle: string
    loadingMap: string
    mapError: string
    clickModeRidgePrompt: string
    clickModeCornerPrompt: string
    cancel: string
    ridgeMarkerTitle: (idx: number) => string
    cornerMarkerTitle: (idx: number) => string
    ridgeBadgePrefix: string
    models: {
      pyramid: ModelTextItem
      hip: ModelTextItem
      frontPeak: ModelTextItem
      cruciform: ModelTextItem
      twinOpposing: ModelTextItem
      hipDormers: ModelTextItem
      tGableHip: ModelTextItem
      compoundHip: ModelTextItem
      crossGable: ModelTextItem
      lShapeWing: ModelTextItem
      multiWing: ModelTextItem
      v2AsymCross: ModelTextItem
      v2TWing: ModelTextItem
      v2OctTurret: ModelTextItem
      v2SteppedHip: ModelTextItem
      v2Hip6Dormers: ModelTextItem
      v2OffsetDormers: ModelTextItem
      v3SteppedT: ModelTextItem
      v3TripleDormer: ModelTextItem
      v3WingTwinGables: ModelTextItem
      v3Wing2Dormers: ModelTextItem
      mnSplitLevel: ModelTextItem
      mnRamblerGarage: ModelTextItem
      mnSuburban3Car: ModelTextItem
      mnTudorSteep: ModelTextItem
      mnCraftsmanBungalow: ModelTextItem
      mnDutchColonial: ModelTextItem
      mnCourtyardU: ModelTextItem
      mnLakeProw: ModelTextItem
      gable: ModelTextItem
      shed: ModelTextItem
      custom: ModelTextItem
    }
  }
  calculator: {
    title: string
    subtitle: string
    badge: string
    baseSatelliteFootprint: string
    linearFtRidgeCaps: (len: string) => string
    slopedFacetsCount: (count: number) => string
    satelliteFootprintBadge: string
    clickToGenerateHint: string
    roofStyleLabel: string
    pitchLabel: string
    pitchAngleLabel: string
    slopeMultiplierLabel: string
    wasteLabel: string
    materialLabel: string
    tearOffLabel: string
    pitchedSurfaceArea: string
    totalAreaWithWaste: (waste: number) => string
    ridgeAndHipCaps: string
    squaresNeeded: string
    squaresUnit: string
    squaresEquivalent: (sqFt: string, sqM: string) => string
    guideTitle: string
    guideSqFt: string
    guideSquare: string
    guideLinearFt: string
    materialsCost: (sq: string) => string
    laborCost: string
    tearOffCost: string
    ridgeCapBundles: (ft: string, bundles: number) => string
    permits: string
    estimatedTotal: string
    saveEstimate: string
    materials: {
      asphalt30: string
      architectural: string
      metal: string
      cedar: string
    }
    pitchOptions: {
      [key: number]: { label: string }
    }
    roofStyles: {
      gable: string
      hip: string
      crossGable: string
      shed: string
      mansard: string
      flat: string
    }
  }
  share: {
    shareButton: string
    shareModalTitle: string
    shareModalSubtitle: string
    copyLinkButton: string
    copied: string
    shareWhatsApp: string
    shareEmail: string
    printProposal: string
    close: string
    previewTitle: string
    estimateIdLabel: string
    dateLabel: string
    propertyLabel: string
    roofModelLabel: string
    totalSquaresLabel: string
    totalEstimateLabel: string
    verifiedBadge: string
    sharedBannerNotice: (id: string) => string
    createNewEstimate: string
  }
}

export const translations: Record<Language, TranslationDictionary> = {
  en: {
    header: {
      brand: "Veltos | ",
      subbrand: "Home Improvement",
      backToSite: "Back to Main Site",
      title: "Roofing Cost Calculator & Visualizer",
      subtitle: "Professional roofing estimator: 3D satellite silhouette, architectural ridge selection & technical specifications (FreeRoofQuote standard).",
      searchPlaceholder: "Enter Minnesota property address to get started...",
      searchLoading: "Loading satellite map services..."
    },
    map: {
      zoomOutTitle: "Zoom out",
      zoomInTitle: "Zoom in closer",
      magnifier: "Magnifier",
      measurementsOn: "Measurements: ON",
      measurementsOff: "Measurements: OFF",
      measurementsToggleTitle: "Toggle measurement labels on/off",
      rotateTitle: "Rotate satellite view 90 degrees",
      resetTitle: "Reset and start over",
      clickPromptTitle: "Click Once on the House",
      clickPromptDesc: "Generates the base satellite footprint and lets you choose the exact geometric roof shape of the house.",
      roofStructureTitle: "Select House Roof Shape",
      ridgePointsBadge: (count: number) => `${count} ${count === 1 ? 'ridge point' : 'height points'}`,
      conventionalModelLabel: "Select Geometric Roof Figure (Triangles = Ridges):",
      orientationLabel: "Rotate Shape:",
      horizontal: "0°",
      vertical: "90°",
      customizeToggleShow: "Customize Points Manually",
      customizeToggleHide: "Hide Point Customization",
      customizationTitle: "Customize Roof Geometry:",
      ridgeVerticesLabel: "Ridge Vertices",
      eavesCornersLabel: "Eaves Corners",
      removeTooltip: "Remove last ridge point",
      add: "Add",
      removeCornerTooltip: "Remove last eaves corner",
      addCorner: "Add",
      clickOnMap: "Click on map",
      clickOnMapRidgeTitle: "Click anywhere on the roof to place a ridge vertex precisely",
      clickOnMapCornerTitle: "Click on the map to add an exterior eaves corner",
      dragTip: "Drag points to align with the roof. Click any point to adjust its roof height.",
      baseFootprintLabel: "Base Footprint:",
      ridgeCapsLabel: "Ridge & Hip Caps:",
      linearFt: "linear ft",
      pitchLabel: "Avg. Roof Height:",
      pointHeightTitle: (idx: number) => `Point #${idx} Roof Height`,
      pointHeightHint: "Click any point on the map to modify its specific roof height",
      applyHeightToAll: "Apply to all points",
      reducePitchTitle: "Decrease height (-1 ft)",
      increasePitchTitle: "Increase height (+1 ft)",
      loadingMap: "Loading satellite map...",
      mapError: "Error loading Google Maps.",
      clickModeRidgePrompt: "Click on the roof to place the new ridge vertex",
      clickModeCornerPrompt: "Click on the map to place the new eaves corner",
      cancel: "Cancel",
      ridgeMarkerTitle: (idx: number) => `Ridge Point ${idx} (Click to adjust height, drag to move)`,
      cornerMarkerTitle: (idx: number) => `Eaves Corner ${idx} (Click to adjust height, drag to move)`,
      ridgeBadgePrefix: "R",
      models: {
        pyramid: {
          label: "Pyramid (4 Triangles)",
          sublabel: "4 symmetrical hip slopes",
          points: "1 peak",
          desc: "Four triangular facets converging at a central peak (Foursquare)."
        },
        hip: {
          label: "Hip (Side Triangles)",
          sublabel: "2 side triangles + ridge",
          points: "2 points",
          desc: "Rectangular hip roof with two triangular ends and central ridge."
        },
        frontPeak: {
          label: "Gable + Front Peak",
          sublabel: "Main ridge + front triangle",
          points: "3 points",
          desc: "Long horizontal gable with a prominent front triangular gable."
        },
        cruciform: {
          label: "4-Way Cross Roof",
          sublabel: "4 intersecting triangles",
          points: "5 points",
          desc: "Symmetrical cross ridge with clipped side triangles and top/bottom gables."
        },
        twinOpposing: {
          label: "Opposing Twin Gables",
          sublabel: "2 opposing triangles + spine",
          points: "4 points",
          desc: "Central spine ridge flanked by two large opposing triangular valleys."
        },
        hipDormers: {
          label: "Half-Hip + Dormers",
          sublabel: "Left triangle + 2 dormers",
          points: "5 points",
          desc: "Hip triangle on one end, gable on the other, plus two opposing dormers."
        },
        tGableHip: {
          label: "T-Shape + Hip Wing",
          sublabel: "Main ridge + hip addition",
          points: "4 points",
          desc: "Main gable roof intersected by a perpendicular wing with a hip triangle."
        },
        compoundHip: {
          label: "Compound Multi-Hip",
          sublabel: "Main hip + side hip wing",
          points: "4 points",
          desc: "Large 4-triangle hip roof connected to a secondary side hip wing."
        },
        crossGable: {
          label: "Cross-Gable T-Plan",
          sublabel: "Perpendicular valley triangle",
          points: "4 points",
          desc: "Intersecting perpendicular gable wings forming a large central triangular valley."
        },
        lShapeWing: {
          label: "L-Shape + Garage Wing",
          sublabel: "Main house + L extension",
          points: "4 points",
          desc: "L-shaped residence with main gable and attached perpendicular garage wing."
        },
        multiWing: {
          label: "Multi-Wing Complex",
          sublabel: "Multiple triangles & wings",
          points: "5 points",
          desc: "Complex multi-facet roof with diagonal central triangle, north dormer, and side hip."
        },
        v2AsymCross: {
          label: "Cross + NW Dormer",
          sublabel: "4-way cross + corner dormer",
          points: "6 points",
          desc: "Asymmetrical 4-way cross gable on the right with a northwest triangular dormer."
        },
        v2TWing: {
          label: "Vertical Gable + Wing",
          sublabel: "2-story main + west wing",
          points: "4 points",
          desc: "Tall vertical gable intersected by a perpendicular west gable wing."
        },
        v2OctTurret: {
          label: "Victorian Cross + Turret",
          sublabel: "Cross gable + corner bay",
          points: "6 points",
          desc: "Intersecting cross gables with a southeast polygonal turret hip roof."
        },
        v2SteppedHip: {
          label: "Stepped Chevron Hip",
          sublabel: "Double diagonal hip bands",
          points: "5 points",
          desc: "Stepped multi-vertex hip roof with parallel diagonal bands and large east triangle."
        },
        v2Hip6Dormers: {
          label: "Hip + 6 Dormers",
          sublabel: "Central hip + 6 side peaks",
          points: "6 points",
          desc: "Symmetrical hip roof with north/south end dormers and 4 lateral dormers."
        },
        v2OffsetDormers: {
          label: "Alternating Dormers",
          sublabel: "Vertical ridge + 2 dormers",
          points: "6 points",
          desc: "Vertical gable roof with offset left and right triangular dormers."
        },
        v3SteppedT: {
          label: "Stepped Wing + Center Peak",
          sublabel: "Main gable + stepped wing",
          points: "6 points",
          desc: "Vertical main gable with a central arrow dormer and stepped west addition."
        },
        v3TripleDormer: {
          label: "3-Dormer Gable (2L + 1R)",
          sublabel: "2 left + 1 right dormer",
          points: "5 points",
          desc: "Vertical gable roof with two dormers on the left slope and one central dormer on the right."
        },
        v3WingTwinGables: {
          label: "NW Wing + Twin Gables",
          sublabel: "West wing + 2 east peaks",
          points: "6 points",
          desc: "Main vertical roof with a northwest wing and two large triangular east gables."
        },
        v3Wing2Dormers: {
          label: "NW Wing + 2 Dormers",
          sublabel: "West wing + 2 east dormers",
          points: "6 points",
          desc: "Main vertical roof with a northwest triangular wing and two diamond dormers on the east slope."
        },
        mnSplitLevel: {
          label: "MN Split-Level + Garage",
          sublabel: "Bi-level step + forward hip",
          points: "4 points",
          desc: "Classic Minnesota split-level home with upper bedroom wing, living step, and protruding garage."
        },
        mnRamblerGarage: {
          label: "MN L-Rambler + Garage",
          sublabel: "4-slope hip + L garage wing",
          points: "3 points",
          desc: "One-story Minnesota Rambler with main hip roof and forward-projecting hip garage."
        },
        mnSuburban3Car: {
          label: "MN Suburban 3-Car Peak",
          sublabel: "Main hip + 3 nested gables",
          points: "5 points",
          desc: "Modern Twin Cities suburban home with 3 stepped front-facing gables over a 3-car garage."
        },
        mnTudorSteep: {
          label: "Minneapolis Tudor",
          sublabel: "Steep cross gable + turret",
          points: "5 points",
          desc: "Classic Minneapolis Lakes & St. Paul Tudor Revival with steep front cross-gable and entry peak."
        },
        mnCraftsmanBungalow: {
          label: "Twin Cities Bungalow",
          sublabel: "Wide gable + center dormer",
          points: "5 points",
          desc: "1.5-story Craftsman Bungalow with wide main gable, central front dormer, and covered porch."
        },
        mnDutchColonial: {
          label: "Gambrel + 3 Dormers",
          sublabel: "Dual-slope deck + 3 peaks",
          points: "7 points",
          desc: "Historic St. Paul & Edina Dutch Colonial gambrel roof with three symmetrical front dormers."
        },
        mnCourtyardU: {
          label: "U-Shape Courtyard",
          sublabel: "Rear spine + 2 front wings",
          points: "4 points",
          desc: "Executive U-shaped layout (Edina/Minnetonka) with two forward-projecting hip wings."
        },
        mnLakeProw: {
          label: "MN Lake Prow Chalet",
          sublabel: "Pointed prow + cross wings",
          points: "4 points",
          desc: "Northwoods & Minnetonka lake home with a pointed triangular prow front and cross wings."
        },
        gable: {
          label: "Simple Gable (2 Slopes)",
          sublabel: "Basic 2-slope rectangle",
          points: "2 points",
          desc: "Traditional straight gable roof with a single central ridge."
        },
        shed: {
          label: "Shed (Single Slope)",
          sublabel: "Porches & additions",
          points: "2 points",
          desc: "Single continuous slope from high ridge to low eaves."
        },
        custom: {
          label: "Custom Multi-Point",
          sublabel: "Freeform structure",
          points: "Custom",
          desc: "Add or remove any number of ridge vertices and eaves corners manually."
        }
      }
    },
    calculator: {
      title: "Roofing Estimate Calculator",
      subtitle: "Professional parametric estimation (Imperial)",
      badge: "Technical Specs",
      baseSatelliteFootprint: "Base Satellite Footprint",
      linearFtRidgeCaps: (len: string) => `${len} linear ft ridge caps`,
      slopedFacetsCount: (count: number) => `${count} 3D sloped facets`,
      satelliteFootprintBadge: "Satellite Footprint",
      clickToGenerateHint: "Click on the house to generate the 3D silhouette and ridge.",
      roofStyleLabel: "Roof Style",
      pitchLabel: "Pitch / Incline (Rise per 12)",
      pitchAngleLabel: "Pitch angle:",
      slopeMultiplierLabel: "Slope multiplier:",
      wasteLabel: "Waste Factor (% Waste):",
      materialLabel: "Roofing Material",
      tearOffLabel: "Include old roof tear-off & debris hauling ($120 / Square)",
      pitchedSurfaceArea: "Pitched Surface Area:",
      totalAreaWithWaste: (waste: number) => `Total Surface (with ${waste}% waste):`,
      ridgeAndHipCaps: "Ridge & Hip Caps (Ridge Caps):",
      squaresNeeded: "Squares Required:",
      squaresUnit: "Squares",
      squaresEquivalent: (sqFt: string, sqM: string) => `(= ${sqFt} sq ft • ${sqM} m²)`,
      guideTitle: "Roofing Measurement Guide (US Standards):",
      guideSqFt: "• sq ft (Square Feet): Standard US unit. Divide by 10.76 to convert to square meters (m²).",
      guideSquare: "• 1 Roofing Square: Exactly 100 sq ft (~9.3 m²). Shingle bundles and roofing accessories are ordered and priced by the Square.",
      guideLinearFt: "• linear ft: Length of ridge caps along the roof apex.",
      materialsCost: (sq: string) => `Materials Cost (${sq} Squares):`,
      laborCost: "Specialized Roofing Labor:",
      tearOffCost: "Old Roof Tear-off & Disposal:",
      ridgeCapBundles: (ft: string, bundles: number) => `Ridge Cap Shingles (${ft} linear ft): ${bundles} bundles`,
      permits: "Local Permits & Building Fees:",
      estimatedTotal: "Estimated Total",
      saveEstimate: "Save Estimate",
      materials: {
        asphalt30: "30-Year Architectural Shingles",
        architectural: "High-Definition (HD) Architectural Shingles",
        metal: "Standing Seam Metal Roof",
        cedar: "Cedar Wood Shakes"
      },
      pitchOptions: {
        2: { label: "2/12 (Low slope)" },
        4: { label: "4/12 (Standard low)" },
        6: { label: "6/12 (Minnesota standard)" },
        8: { label: "8/12 (Steep)" },
        10: { label: "10/12 (Very steep)" },
        12: { label: "12/12 (45° Extreme)" }
      },
      roofStyles: {
        gable: "Gable (Traditional two slopes)",
        hip: "Hip (Four slopes)",
        crossGable: "Cross Gable / Multi-Triangle (Intersecting ridges)",
        shed: "Shed (Single slope / porch)",
        mansard: "Mansard",
        flat: "Flat (Low slope)"
      }
    },
    share: {
      shareButton: "Share Estimate",
      shareModalTitle: "Share & Export Estimate",
      shareModalSubtitle: "Share this validated estimate with exact 3D roof points, measurements, and pricing specifications.",
      copyLinkButton: "Copy Interactive Link",
      copied: "Copied to clipboard!",
      shareWhatsApp: "Share via WhatsApp",
      shareEmail: "Share via Email",
      printProposal: "Print / Save PDF Proposal",
      close: "Close",
      previewTitle: "Estimate Summary",
      estimateIdLabel: "Estimate ID",
      dateLabel: "Date",
      propertyLabel: "Property",
      roofModelLabel: "Roof Style",
      totalSquaresLabel: "Squares Needed",
      totalEstimateLabel: "Estimated Investment",
      verifiedBadge: "Validated 3D Estimate",
      sharedBannerNotice: (id: string) => `Viewing Shared Estimate ${id} with exact satellite points and specifications`,
      createNewEstimate: "Create New Estimate"
    }
  },
  es: {
    header: {
      brand: "Veltos | ",
      subbrand: "Home Improvement",
      backToSite: "Volver a la Web Principal",
      title: "Calculadora y Cotizador de Techos",
      subtitle: "Cotizador profesional de techos: Silueta satelital, Figuras Geométricas de Cumbreras y Especificaciones Técnicas (FreeRoofQuote).",
      searchPlaceholder: "Ingresa la dirección del cliente en Minnesota para comenzar...",
      searchLoading: "Cargando servicios de mapa satelital..."
    },
    map: {
      zoomOutTitle: "Alejar mapa",
      zoomInTitle: "Acercar más",
      magnifier: "Lupa",
      measurementsOn: "Medidas: ON",
      measurementsOff: "Medidas: OFF",
      measurementsToggleTitle: "Ocultar o mostrar medidas de texto",
      rotateTitle: "Rotar vista de satélite 90 grados",
      resetTitle: "Borrar y empezar de nuevo",
      clickPromptTitle: "Haz 1 Clic en la Casa",
      clickPromptDesc: "Generará la silueta base y te permitirá elegir la figura geométrica exacta de las cumbreras de la casa.",
      roofStructureTitle: "Seleccionar Modelo de Casa",
      ridgePointsBadge: (count: number) => `${count} ${count === 1 ? 'cumbrera' : 'puntos'}`,
      conventionalModelLabel: "Elige la Figura Geométrica (Triángulos = Cumbreras):",
      orientationLabel: "Rotar Figura:",
      horizontal: "0°",
      vertical: "90°",
      customizeToggleShow: "Personalizar Puntos Manualmente",
      customizeToggleHide: "Ocultar Personalización de Puntos",
      customizationTitle: "Personalizar Puntos de la Estructura:",
      ridgeVerticesLabel: "Vértices de Cumbrera",
      eavesCornersLabel: "Esquinas del Alero",
      removeTooltip: "Quitar el último punto de cumbrera",
      add: "Añadir",
      removeCornerTooltip: "Quitar última esquina",
      addCorner: "Añadir",
      clickOnMap: "Clic en mapa",
      clickOnMapRidgeTitle: "Haz clic sobre el mapa para ubicar un punto de cumbrera con precisión",
      clickOnMapCornerTitle: "Haz clic sobre el mapa para ubicar una nueva esquina exterior",
      dragTip: "Arrastra los puntos para ajustar la forma. Toca cualquier punto para modificar su altura del techo.",
      baseFootprintLabel: "Área Base:",
      ridgeCapsLabel: "Caballete (Ridge Caps):",
      linearFt: "pies lineales",
      pitchLabel: "Altura Promedio:",
      pointHeightTitle: (idx: number) => `Altura del Techo (Punto #${idx})`,
      pointHeightHint: "Toca cualquier punto en el mapa para ajustar su altura individual",
      applyHeightToAll: "Aplicar a todos los puntos",
      reducePitchTitle: "Reducir altura (-1 pie)",
      increasePitchTitle: "Aumentar altura (+1 pie)",
      loadingMap: "Cargando mapa satelital...",
      mapError: "Error al cargar Google Maps.",
      clickModeRidgePrompt: "Haz clic en el tejado para colocar el nuevo punto de cumbrera",
      clickModeCornerPrompt: "Haz clic en el mapa para colocar la nueva esquina del alero",
      cancel: "Cancelar",
      ridgeMarkerTitle: (idx: number) => `Punto ${idx} de Cumbrera (Toca para cambiar altura, arrastra para mover)`,
      cornerMarkerTitle: (idx: number) => `Esquina ${idx} de la Casa (Toca para cambiar altura, arrastra para mover)`,
      ridgeBadgePrefix: "C",
      models: {
        pyramid: {
          label: "Piramidal (4 Triángulos)",
          sublabel: "4 cumbreras simétricas",
          points: "1 cúspide",
          desc: "Cuatro triángulos que convergen en el centro (típico Foursquare)."
        },
        hip: {
          label: "Hip (Triángulos Laterales)",
          sublabel: "2 triángulos + cumbrera",
          points: "2 puntos",
          desc: "Techo rectangular con dos triángulos en los extremos y cumbrera central."
        },
        frontPeak: {
          label: "2 Aguas + Triángulo Frontal",
          sublabel: "Cumbrera larga + pico frontal",
          points: "3 puntos",
          desc: "Cumbrera horizontal principal con un triángulo frontal saliente."
        },
        cruciform: {
          label: "Cruz de 4 Cumbreras",
          sublabel: "4 triángulos en cruz",
          points: "5 puntos",
          desc: "Cruce simétrico de cumbreras con triángulos laterales, superior e inferior."
        },
        twinOpposing: {
          label: "Doble Triángulo Opuesto",
          sublabel: "2 triángulos encontrados",
          points: "4 puntos",
          desc: "Eje vertical central con dos grandes triángulos opuestos a izquierda y derecha."
        },
        hipDormers: {
          label: "Hip + Doble Buhardilla",
          sublabel: "Triángulo izq. + 2 laterales",
          points: "5 puntos",
          desc: "Gran triángulo hip a la izquierda, 2 aguas a la derecha y 2 triángulos laterales."
        },
        tGableHip: {
          label: "Forma T + Ala Hip",
          sublabel: "Eje vertical + ala triangular",
          points: "4 puntos",
          desc: "Cuerpo principal vertical con extensión lateral terminada en triángulo hip."
        },
        compoundHip: {
          label: "Hip Compuesto con Ala",
          sublabel: "Hip 4 aguas + extensión hip",
          points: "4 puntos",
          desc: "Techo principal de 4 triángulos conectado a una extensión lateral con su propio hip."
        },
        crossGable: {
          label: "Cruce en T (Valle Triangular)",
          sublabel: "Unión transversal en V",
          points: "4 puntos",
          desc: "Dos cuerpos perpendiculares que forman un gran triángulo central en su unión."
        },
        lShapeWing: {
          label: "Casa en L con Garaje",
          sublabel: "Cuerpo principal + ala en L",
          points: "4 puntos",
          desc: "Estructura en forma de L con techo principal y extensión hacia el garaje."
        },
        multiWing: {
          label: "Multicumbrera Compleja",
          sublabel: "Múltiples triángulos y alas",
          points: "5 puntos",
          desc: "Residencia compleja con gran triángulo diagonal, cumbrera norte y ala derecha."
        },
        v2AsymCross: {
          label: "Cruz + Buhardilla Noroeste",
          sublabel: "Cruce de 4 + pico esquina",
          points: "6 puntos",
          desc: "Cruce asimétrico de 4 aguas a la derecha con buhardilla triangular al noroeste."
        },
        v2TWing: {
          label: "2 Aguas Vertical + Ala",
          sublabel: "Cuerpo alto + ala oeste",
          points: "4 puntos",
          desc: "Techo vertical principal conectado a un ala perpendicular al oeste."
        },
        v2OctTurret: {
          label: "Cruce Victoriano + Torreta",
          sublabel: "Cruz + esquina poligonal",
          points: "6 puntos",
          desc: "Cumbreras cruzadas con torreta poligonal en la esquina sureste."
        },
        v2SteppedHip: {
          label: "Hip Doble Banda en V",
          sublabel: "Bandas diagonales + hip",
          points: "5 puntos",
          desc: "Techo hip escalonado con bandas diagonales paralelas y gran triángulo este."
        },
        v2Hip6Dormers: {
          label: "Hip con 6 Buhardillas",
          sublabel: "Hip central + 6 triángulos",
          points: "6 puntos",
          desc: "Techo hip simétrico con buhardillas en los extremos y 4 laterales."
        },
        v2OffsetDormers: {
          label: "Buhardillas Alternadas",
          sublabel: "Eje vertical + 2 picos",
          points: "6 puntos",
          desc: "Techo a dos aguas vertical con dos buhardillas triangulares alternadas."
        },
        v3SteppedT: {
          label: "Ala Escalonada + Pico Central",
          sublabel: "Eje vertical + ala escalonada",
          points: "6 puntos",
          desc: "Cuerpo principal con cumbrera central en flecha y extensión oeste escalonada."
        },
        v3TripleDormer: {
          label: "3 Buhardillas (2 Izq + 1 Der)",
          sublabel: "2 picos izq. + 1 pico der.",
          points: "5 puntos",
          desc: "Techo vertical con dos buhardillas en el faldón izquierdo y una central en el derecho."
        },
        v3WingTwinGables: {
          label: "Ala Noroeste + 2 Picos Este",
          sublabel: "Extensión + 2 grandes triángulos",
          points: "6 puntos",
          desc: "Techo principal con ala superior izquierda y dos grandes triángulos en el borde derecho."
        },
        v3Wing2Dormers: {
          label: "Ala Noroeste + 2 Buhardillas",
          sublabel: "Ala triangular + 2 picos der.",
          points: "6 puntos",
          desc: "Cuerpo vertical con ala triangular superior izquierda y dos buhardillas a la derecha."
        },
        mnSplitLevel: {
          label: "Desnivel MN + Cochera",
          sublabel: "Split-Level + cochera frontal",
          points: "4 puntos",
          desc: "Clásica casa Split-Level de Minnesota con ala superior, nivel medio y cochera saliente."
        },
        mnRamblerGarage: {
          label: "Rambler MN en L",
          sublabel: "Hip 4 aguas + cochera en L",
          points: "3 puntos",
          desc: "Tradicional Rambler de Minnesota de 1 piso con techo hip principal y cochera adelantada."
        },
        mnSuburban3Car: {
          label: "Suburbana 3 Cocheras",
          sublabel: "Hip + 3 picos escalonados",
          points: "5 puntos",
          desc: "Residencia suburbana moderna con 3 triángulos frontales escalonados sobre cochera triple."
        },
        mnTudorSteep: {
          label: "Tudor Minneapolis",
          sublabel: "Cruce empinado + entrada",
          points: "5 puntos",
          desc: "Estilo Tudor clásico de Minneapolis y St. Paul con pico frontal pronunciado y acceso."
        },
        mnCraftsmanBungalow: {
          label: "Bungalow Twin Cities",
          sublabel: "2 aguas + buhardilla central",
          points: "5 puntos",
          desc: "Bungalow Craftsman de 1.5 pisos con buhardilla triangular central y pórtico techado."
        },
        mnDutchColonial: {
          label: "Colonial Gambrel + 3 Picos",
          sublabel: "Doble quiebre + 3 buhardillas",
          points: "7 puntos",
          desc: "Techo estilo Gambrel (St. Paul / Edina) con meseta central y 3 buhardillas simétricas."
        },
        mnCourtyardU: {
          label: "Casa en U con Patio",
          sublabel: "Eje trasero + 2 alas frontales",
          points: "4 puntos",
          desc: "Residencia ejecutiva en forma de U (Edina / Minnetonka) con dos alas hip delanteras."
        },
        mnLakeProw: {
          label: "Chalet Lago (Punta Prow)",
          sublabel: "Frente en diamante + alas",
          points: "4 puntos",
          desc: "Casa de lago en Minnesota con cumbrera frontal en punta de diamante y alas cruzadas."
        },
        gable: {
          label: "Gable Simple (2 Aguas)",
          sublabel: "Rectángulo básico 2 faldones",
          points: "2 puntos",
          desc: "Techo tradicional a dos aguas con una sola línea central."
        },
        shed: {
          label: "Cobertizo (1 Agua)",
          sublabel: "Porches y ampliaciones",
          points: "2 puntos",
          desc: "Monopendiente desde el borde alto al alero bajo."
        },
        custom: {
          label: "Personalizado Libre",
          sublabel: "Ajuste manual de puntos",
          points: "Libre",
          desc: "Añade o quita libremente puntos de cumbrera y esquinas del alero."
        }
      }
    },
    calculator: {
      title: "Calculadora de Cotización",
      subtitle: "Estimación paramétrica profesional (Imperial)",
      badge: "Especificaciones Técnicas",
      baseSatelliteFootprint: "Área Satelital Base",
      linearFtRidgeCaps: (len: string) => `${len} pies de caballete`,
      slopedFacetsCount: (count: number) => `${count} vertientes 3D`,
      satelliteFootprintBadge: "Silueta Satélite",
      clickToGenerateHint: "Haz clic en la casa para generar la silueta y cumbrera 3D.",
      roofStyleLabel: "Estilo de Techo (Roof Style)",
      pitchLabel: "Inclinación / Pitch (Rise per 12)",
      pitchAngleLabel: "Ángulo (Pitch angle):",
      slopeMultiplierLabel: "Multiplicador (Slope):",
      wasteLabel: "Desperdicio (% Waste):",
      materialLabel: "Material de Cubierta",
      tearOffLabel: "Incluir remoción (tear-off) y retiro de escombros ($120 / Square)",
      pitchedSurfaceArea: "Superficie con Inclinación:",
      totalAreaWithWaste: (waste: number) => `Área Total con Desperdicio (${waste}% waste):`,
      ridgeAndHipCaps: "Caballete y Cumbreras (Ridge Caps):",
      squaresNeeded: "Squares Necesarios de Teja:",
      squaresUnit: "Squares",
      squaresEquivalent: (sqFt: string, sqM: string) => `(= ${sqFt} pies² • ${sqM} m²)`,
      guideTitle: "Guía de Medidas (EE.UU. vs Sistema Métrico):",
      guideSqFt: "• pies² (Square Feet / sq ft): Medida estándar en EE.UU. Dividir entre 10.76 para obtener metros cuadrados (m²).",
      guideSquare: "• 1 Square de Techo: Equivale exactamente a 100 pies² (~9.3 m²). Los fardos de tejas y materiales se cotizan por Square.",
      guideLinearFt: "• pies lineales: Medida de longitud para los remates de cumbrera.",
      materialsCost: (sq: string) => `Costo Materiales (${sq} Squares):`,
      laborCost: "Mano de obra especializada:",
      tearOffCost: "Remoción y Desecho (Tear-off):",
      ridgeCapBundles: (ft: string, bundles: number) => `Tejas de Caballete (${ft} pies lineales): ${bundles} fardos (bundles)`,
      permits: "Permisos y Tasas Locales:",
      estimatedTotal: "Total Estimado",
      saveEstimate: "Guardar Cotización",
      materials: {
        asphalt30: "30-Year Architectural Shingles",
        architectural: "Architectural HD Shingles",
        metal: "Standing Seam Metal Roof",
        cedar: "Cedar Wood Shakes"
      },
      pitchOptions: {
        2: { label: "2/12 (Muy bajo)" },
        4: { label: "4/12 (Estándar bajo)" },
        6: { label: "6/12 (Común Minnesota)" },
        8: { label: "8/12 (Inclinado)" },
        10: { label: "10/12 (Muy empinado)" },
        12: { label: "12/12 (45° Extremo)" }
      },
      roofStyles: {
        gable: "Gable (A dos aguas tradicional)",
        hip: "Hip (A cuatro aguas)",
        crossGable: "Cross Gable / Multicumbrera (Triángulos cruzados)",
        shed: "Shed (Un agua / cobertizo)",
        mansard: "Mansard (Mansarda)",
        flat: "Flat (Plano)"
      }
    },
    share: {
      shareButton: "Compartir Estimación",
      shareModalTitle: "Compartir y Exportar Estimación",
      shareModalSubtitle: "Comparte esta estimación validada con los puntos 3D exactos, medidas del satélite y especificaciones de costos.",
      copyLinkButton: "Copiar Enlace Interactivo",
      copied: "Copiado al portapapeles",
      shareWhatsApp: "Compartir por WhatsApp",
      shareEmail: "Compartir por Correo",
      printProposal: "Imprimir / Guardar Propuesta PDF",
      close: "Cerrar",
      previewTitle: "Resumen de la Estimación",
      estimateIdLabel: "Folio de Estimación",
      dateLabel: "Fecha",
      propertyLabel: "Ubicación",
      roofModelLabel: "Estilo de Techo",
      totalSquaresLabel: "Squares Necesarios",
      totalEstimateLabel: "Inversión Estimada",
      verifiedBadge: "Estimación 3D Validada",
      sharedBannerNotice: (id: string) => `Viendo Estimación Compartida ${id} con puntos satelitales y especificaciones exactas`,
      createNewEstimate: "Crear Nueva Estimación"
    }
  }
}
