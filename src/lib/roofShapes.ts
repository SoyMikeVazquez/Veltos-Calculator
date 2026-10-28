export type RoofType =
  | 'pyramid'
  | 'hip'
  | 'front-peak'
  | 'cruciform'
  | 'twin-opposing'
  | 'hip-dormers'
  | 't-gable-hip'
  | 'compound-hip'
  | 'cross-gable'
  | 'l-shape-wing'
  | 'multi-wing'
  | 'v2-asym-cross'
  | 'v2-t-wing'
  | 'v2-oct-turret'
  | 'v2-stepped-hip'
  | 'v2-hip-6-dormers'
  | 'v2-offset-dormers'
  | 'v3-stepped-t'
  | 'v3-triple-dormer'
  | 'v3-wing-twin-gables'
  | 'v3-wing-2-dormers'
  | 'mn-split-level'
  | 'mn-rambler-garage'
  | 'mn-suburban-3car'
  | 'mn-tudor-steep'
  | 'mn-craftsman-bungalow'
  | 'mn-dutch-colonial'
  | 'mn-courtyard-u'
  | 'mn-lake-prow'
  | 'gable'
  | 'shed'
  | 'custom'

export type RidgeOrientation =
  | 'horizontal'
  | 'vertical'
  | 'horizontal-flip'
  | 'vertical-flip'

export interface RoofShapeFaceDef {
  id: string
  nameEn: string
  nameEs: string
  /** Vertex references: 'b0', 'b1', ... for basePolygon; 'r0', 'r1', ... for ridgePoints */
  vertices: string[]
  /** Index into Veltos blue palette (0..4) */
  colorIndex: number
}

export interface RoofShapeLineDef {
  id: string
  from: string
  to: string
  isMainRidge?: boolean
}

export interface RoofShapeTemplate {
  id: RoofType
  /** Normalized coordinates [nx, ny] in [-1, 1] where +ny is North (up) and +nx is East (right) */
  baseCoords: [number, number][]
  /** Normalized interior/ridge coordinates [nx, ny] in [-1, 1] */
  ridgeCoords: [number, number][]
  /** Explicit topological facets (triangles/cumbreras & slopes) */
  faces: RoofShapeFaceDef[]
  /** Explicit topological ridge, hip, and valley segments */
  lines: RoofShapeLineDef[]
}

export const VELTOS_FACET_COLORS: { fill: string; stroke: string }[] = [
  { fill: '#2563eb', stroke: '#1d4ed8' }, // Primary Veltos Blue
  { fill: '#1d4ed8', stroke: '#1e40af' }, // Deep Blue
  { fill: '#1e40af', stroke: '#1e3a8a' }, // Navy Blue
  { fill: '#3b82f6', stroke: '#2563eb' }, // Bright Blue (highlight triangles/cumbreras)
  { fill: '#0284c7', stroke: '#0369a1' }, // Sky-Slate Blue
]

/**
 * Complete catalog of Minnesota residential roof geometric shapes
 * derived from real satellite roof structures (triangles = cumbreras / hips / dormers).
 */
export const ROOF_SHAPE_TEMPLATES: Record<string, RoofShapeTemplate> = {
  // 1. Pyramid Hip (4 Symmetrical Triangles meeting at center - Ref: 10.04.27)
  'pyramid': {
    id: 'pyramid',
    baseCoords: [
      [-0.88, 0.84],  // b0: TL
      [0.88, 0.84],   // b1: TR
      [0.88, -0.84],  // b2: BR
      [-0.88, -0.84], // b3: BL
    ],
    ridgeCoords: [
      [0, 0], // r0: Central Peak
    ],
    faces: [
      { id: 'pyr-n', nameEn: 'North Triangle', nameEs: 'Triángulo Norte', vertices: ['b0', 'b1', 'r0'], colorIndex: 0 },
      { id: 'pyr-e', nameEn: 'East Triangle', nameEs: 'Triángulo Este', vertices: ['b1', 'b2', 'r0'], colorIndex: 3 },
      { id: 'pyr-s', nameEn: 'South Triangle', nameEs: 'Triángulo Sur', vertices: ['b2', 'b3', 'r0'], colorIndex: 2 },
      { id: 'pyr-w', nameEn: 'West Triangle', nameEs: 'Triángulo Oeste', vertices: ['b3', 'b0', 'r0'], colorIndex: 1 },
    ],
    lines: [
      { id: 'pyr-h0', from: 'b0', to: 'r0', isMainRidge: true },
      { id: 'pyr-h1', from: 'b1', to: 'r0', isMainRidge: true },
      { id: 'pyr-h2', from: 'b2', to: 'r0', isMainRidge: true },
      { id: 'pyr-h3', from: 'b3', to: 'r0', isMainRidge: true },
    ]
  },

  // 2. Standard Hip (2 Side Triangles + Central Ridge)
  'hip': {
    id: 'hip',
    baseCoords: [
      [-0.96, 0.74],  // b0: TL
      [0.96, 0.74],   // b1: TR
      [0.96, -0.74],  // b2: BR
      [-0.96, -0.74], // b3: BL
    ],
    ridgeCoords: [
      [-0.42, 0], // r0: West Ridge Vertex
      [0.42, 0],  // r1: East Ridge Vertex
    ],
    faces: [
      { id: 'hip-n', nameEn: 'North Slope', nameEs: 'Faldón Norte', vertices: ['b0', 'b1', 'r1', 'r0'], colorIndex: 0 },
      { id: 'hip-s', nameEn: 'South Slope', nameEs: 'Faldón Sur', vertices: ['r0', 'r1', 'b2', 'b3'], colorIndex: 2 },
      { id: 'hip-w', nameEn: 'West Hip Triangle', nameEs: 'Cumbrera Triangular Oeste', vertices: ['b0', 'r0', 'b3'], colorIndex: 3 },
      { id: 'hip-e', nameEn: 'East Hip Triangle', nameEs: 'Cumbrera Triangular Este', vertices: ['b1', 'b2', 'r1'], colorIndex: 3 },
    ],
    lines: [
      { id: 'hip-main', from: 'r0', to: 'r1', isMainRidge: true },
      { id: 'hip-l0', from: 'b0', to: 'r0' },
      { id: 'hip-l3', from: 'b3', to: 'r0' },
      { id: 'hip-l1', from: 'b1', to: 'r1' },
      { id: 'hip-l2', from: 'b2', to: 'r1' },
    ]
  },

  // 3. Long Gable with Front Peak Triangle (Ref: 10.12.59)
  'front-peak': {
    id: 'front-peak',
    baseCoords: [
      [-0.96, 0.74],  // b0: TL
      [0.96, 0.74],   // b1: TR
      [0.96, -0.58],  // b2: BR
      [0.16, -0.58],  // b3: Front Gable Right Eave
      [-0.68, -0.58], // b4: Front Gable Left Eave
      [-0.96, -0.58], // b5: BL
    ],
    ridgeCoords: [
      [-0.96, 0.08],  // r0: Left Main Ridge
      [-0.26, 0.08],  // r1: Central Ridge Junction (where front triangle meets main ridge)
      [0.96, 0.08],   // r2: Right Main Ridge
      [-0.26, -0.78], // r3: Front Gable Outer Peak
    ],
    faces: [
      { id: 'fp-n', nameEn: 'North Main Slope', nameEs: 'Faldón Principal Norte', vertices: ['b0', 'b1', 'r2', 'r1', 'r0'], colorIndex: 0 },
      { id: 'fp-sw', nameEn: 'South-West Slope', nameEs: 'Faldón Suroeste', vertices: ['b5', 'r0', 'r1', 'b4'], colorIndex: 2 },
      { id: 'fp-se', nameEn: 'South-East Slope', nameEs: 'Faldón Sureste', vertices: ['r1', 'r2', 'b2', 'b3'], colorIndex: 2 },
      { id: 'fp-tri-l', nameEn: 'Front Peak Left Slope', nameEs: 'Cumbrera Frontal Izquierda', vertices: ['b4', 'r1', 'r3'], colorIndex: 3 },
      { id: 'fp-tri-r', nameEn: 'Front Peak Right Slope', nameEs: 'Cumbrera Frontal Derecha', vertices: ['r1', 'b3', 'r3'], colorIndex: 1 },
    ],
    lines: [
      { id: 'fp-m1', from: 'r0', to: 'r1', isMainRidge: true },
      { id: 'fp-m2', from: 'r1', to: 'r2', isMainRidge: true },
      { id: 'fp-m3', from: 'r1', to: 'r3', isMainRidge: true },
      { id: 'fp-v1', from: 'b4', to: 'r1' },
      { id: 'fp-v2', from: 'b3', to: 'r1' },
      { id: 'fp-v3', from: 'b4', to: 'r3' },
      { id: 'fp-v4', from: 'b3', to: 'r3' },
    ]
  },

  // 4. 4-Way Cross / Cruciform Hip-Gable (Ref: 10.12.44)
  'cruciform': {
    id: 'cruciform',
    baseCoords: [
      [-0.96, 0.78],  // b0: TL
      [0.96, 0.78],   // b1: TR
      [0.96, -0.78],  // b2: BR
      [-0.96, -0.78], // b3: BL
    ],
    ridgeCoords: [
      [0, 0],       // r0: Central 4-Way Intersection
      [-0.66, 0],   // r1: West Clipped Hip Vertex
      [0.66, 0],    // r2: East Clipped Hip Vertex
      [0, 0.78],    // r3: North Cross-Gable Peak
      [0, -0.78],   // r4: South Cross-Gable Peak
    ],
    faces: [
      { id: 'cr-w', nameEn: 'West Hip Triangle', nameEs: 'Triángulo Oeste', vertices: ['b0', 'r1', 'b3'], colorIndex: 3 },
      { id: 'cr-e', nameEn: 'East Hip Triangle', nameEs: 'Triángulo Este', vertices: ['b1', 'b2', 'r2'], colorIndex: 3 },
      { id: 'cr-nw', nameEn: 'North-West Slope', nameEs: 'Faldón Noroeste', vertices: ['b0', 'r0', 'r1'], colorIndex: 0 },
      { id: 'cr-nl', nameEn: 'North Gable Left', nameEs: 'Cumbrera Norte Izq.', vertices: ['b0', 'r3', 'r0'], colorIndex: 3 },
      { id: 'cr-nr', nameEn: 'North Gable Right', nameEs: 'Cumbrera Norte Der.', vertices: ['r3', 'b1', 'r0'], colorIndex: 1 },
      { id: 'cr-ne', nameEn: 'North-East Slope', nameEs: 'Faldón Noreste', vertices: ['b1', 'r2', 'r0'], colorIndex: 0 },
      { id: 'cr-sw', nameEn: 'South-West Slope', nameEs: 'Faldón Suroeste', vertices: ['b3', 'r1', 'r0'], colorIndex: 2 },
      { id: 'cr-sl', nameEn: 'South Gable Left', nameEs: 'Cumbrera Sur Izq.', vertices: ['b3', 'r0', 'r4'], colorIndex: 1 },
      { id: 'cr-sr', nameEn: 'South Gable Right', nameEs: 'Cumbrera Sur Der.', vertices: ['r0', 'b2', 'r4'], colorIndex: 3 },
      { id: 'cr-se', nameEn: 'South-East Slope', nameEs: 'Faldón Sureste', vertices: ['r0', 'r2', 'b2'], colorIndex: 2 },
    ],
    lines: [
      { id: 'cr-m1', from: 'r1', to: 'r0', isMainRidge: true },
      { id: 'cr-m2', from: 'r0', to: 'r2', isMainRidge: true },
      { id: 'cr-m3', from: 'r3', to: 'r0', isMainRidge: true },
      { id: 'cr-m4', from: 'r4', to: 'r0', isMainRidge: true },
      { id: 'cr-h1', from: 'b0', to: 'r1' },
      { id: 'cr-h2', from: 'b3', to: 'r1' },
      { id: 'cr-h3', from: 'b1', to: 'r2' },
      { id: 'cr-h4', from: 'b2', to: 'r2' },
      { id: 'cr-v1', from: 'b0', to: 'r0' },
      { id: 'cr-v2', from: 'b1', to: 'r0' },
      { id: 'cr-v3', from: 'b2', to: 'r0' },
      { id: 'cr-v4', from: 'b3', to: 'r0' },
    ]
  },

  // 5. Twin Opposing Triangles / H-Spine (Ref: 10.12.37)
  'twin-opposing': {
    id: 'twin-opposing',
    baseCoords: [
      [-0.95, 0.80],  // b0: TL
      [0.95, 0.80],   // b1: TR
      [0.95, -0.80],  // b2: BR
      [-0.95, -0.80], // b3: BL
    ],
    ridgeCoords: [
      [0.02, 0.80],   // r0: North Spine End
      [0.02, -0.80],  // r1: South Spine End
      [-0.12, 0.12],  // r2: West Triangle Apex
      [0.18, -0.08],  // r3: East Triangle Apex
    ],
    faces: [
      { id: 'tw-w', nameEn: 'West Large Triangle', nameEs: 'Triángulo Principal Oeste', vertices: ['b0', 'r2', 'b3'], colorIndex: 3 },
      { id: 'tw-nw', nameEn: 'North-West Facet', nameEs: 'Faldón Noroeste', vertices: ['b0', 'r0', 'r2'], colorIndex: 0 },
      { id: 'tw-sw', nameEn: 'South-West Facet', nameEs: 'Faldón Suroeste', vertices: ['b3', 'r2', 'r1'], colorIndex: 2 },
      { id: 'tw-mid', nameEn: 'Central Spine Facet', nameEs: 'Cumbrera Central', vertices: ['r0', 'r3', 'r1', 'r2'], colorIndex: 1 },
      { id: 'tw-ne', nameEn: 'North-East Facet', nameEs: 'Faldón Noreste', vertices: ['r0', 'b1', 'r3'], colorIndex: 0 },
      { id: 'tw-se', nameEn: 'South-East Facet', nameEs: 'Faldón Sureste', vertices: ['r3', 'b2', 'r1'], colorIndex: 2 },
      { id: 'tw-e', nameEn: 'East Large Triangle', nameEs: 'Triángulo Principal Este', vertices: ['b1', 'b2', 'r3'], colorIndex: 3 },
    ],
    lines: [
      { id: 'tw-spine', from: 'r0', to: 'r1', isMainRidge: true },
      { id: 'tw-wl1', from: 'b0', to: 'r2', isMainRidge: true },
      { id: 'tw-wl2', from: 'b3', to: 'r2', isMainRidge: true },
      { id: 'tw-el1', from: 'b1', to: 'r3', isMainRidge: true },
      { id: 'tw-el2', from: 'b2', to: 'r3', isMainRidge: true },
      { id: 'tw-c1', from: 'r0', to: 'r3' },
      { id: 'tw-c2', from: 'r1', to: 'r3' },
    ]
  },

  // 6. Half-Hip + Twin Dormers (Ref: 10.03.53)
  'hip-dormers': {
    id: 'hip-dormers',
    baseCoords: [
      [-0.96, 0.76],  // b0: TL
      [0.96, 0.76],   // b1: TR
      [0.96, -0.76],  // b2: BR
      [-0.96, -0.76], // b3: BL
    ],
    ridgeCoords: [
      [-0.36, 0],     // r0: West Hip Apex
      [0.24, 0],      // r1: Center Dormer Junction
      [0.96, 0],      // r2: East Gable Ridge End
      [-0.04, 0.76],  // r3: North Dormer Peak
      [-0.04, -0.76], // r4: South Dormer Peak
    ],
    faces: [
      { id: 'hd-w', nameEn: 'West Hip Triangle', nameEs: 'Triángulo Hip Oeste', vertices: ['b0', 'r0', 'b3'], colorIndex: 2 },
      { id: 'hd-nw', nameEn: 'North-West Slope', nameEs: 'Faldón Noroeste', vertices: ['b0', 'r3', 'r0'], colorIndex: 0 },
      { id: 'hd-nd', nameEn: 'North Dormer Triangle', nameEs: 'Triángulo Buhardilla Norte', vertices: ['r0', 'r3', 'r1'], colorIndex: 3 },
      { id: 'hd-ne', nameEn: 'North-East Main Slope', nameEs: 'Faldón Principal Noreste', vertices: ['r3', 'b1', 'r2', 'r1'], colorIndex: 0 },
      { id: 'hd-sw', nameEn: 'South-West Slope', nameEs: 'Faldón Suroeste', vertices: ['b3', 'r0', 'r4'], colorIndex: 2 },
      { id: 'hd-sd', nameEn: 'South Dormer Triangle', nameEs: 'Triángulo Buhardilla Sur', vertices: ['r0', 'r1', 'r4'], colorIndex: 3 },
      { id: 'hd-se', nameEn: 'South-East Main Slope', nameEs: 'Faldón Principal Sureste', vertices: ['r4', 'r1', 'r2', 'b2'], colorIndex: 1 },
    ],
    lines: [
      { id: 'hd-m1', from: 'r0', to: 'r1', isMainRidge: true },
      { id: 'hd-m2', from: 'r1', to: 'r2', isMainRidge: true },
      { id: 'hd-h1', from: 'b0', to: 'r0', isMainRidge: true },
      { id: 'hd-h2', from: 'b3', to: 'r0', isMainRidge: true },
      { id: 'hd-d1', from: 'r0', to: 'r3' },
      { id: 'hd-d2', from: 'r1', to: 'r3' },
      { id: 'hd-d3', from: 'r0', to: 'r4' },
      { id: 'hd-d4', from: 'r1', to: 'r4' },
    ]
  },

  // 7. T-Shape Gable + Hip Wing (Ref: 10.04.40)
  't-gable-hip': {
    id: 't-gable-hip',
    baseCoords: [
      [-0.32, 0.84],  // b0: Main TL
      [0.96, 0.84],   // b1: Main TR
      [0.96, -0.84],  // b2: Main BR
      [-0.96, -0.84], // b3: Wing BL
      [-0.96, 0.24],  // b4: Wing TL
      [-0.32, 0.24],  // b5: Inner L-Corner
    ],
    ridgeCoords: [
      [0.32, 0.84],   // r0: Main Ridge Top
      [0.32, -0.30],  // r1: Main Ridge Junction
      [0.32, -0.84],  // r2: Main Ridge Bottom
      [-0.54, -0.30], // r3: West Wing Hip Apex
    ],
    faces: [
      { id: 'tg-e', nameEn: 'East Main Slope', nameEs: 'Faldón Principal Este', vertices: ['r0', 'b1', 'b2', 'r2', 'r1'], colorIndex: 1 },
      { id: 'tg-nw', nameEn: 'West Upper Slope', nameEs: 'Faldón Noroeste', vertices: ['b0', 'r0', 'r1', 'b5'], colorIndex: 0 },
      { id: 'tg-wh', nameEn: 'Wing Hip Triangle', nameEs: 'Triángulo Hip del Ala', vertices: ['b4', 'r3', 'b3'], colorIndex: 3 },
      { id: 'tg-wn', nameEn: 'Wing North Slope', nameEs: 'Faldón Norte del Ala', vertices: ['b4', 'b5', 'r1', 'r3'], colorIndex: 2 },
      { id: 'tg-ws', nameEn: 'Wing South Slope', nameEs: 'Faldón Sur del Ala', vertices: ['r3', 'r1', 'r2', 'b3'], colorIndex: 0 },
    ],
    lines: [
      { id: 'tg-m1', from: 'r0', to: 'r1', isMainRidge: true },
      { id: 'tg-m2', from: 'r1', to: 'r2', isMainRidge: true },
      { id: 'tg-m3', from: 'r3', to: 'r1', isMainRidge: true },
      { id: 'tg-h1', from: 'b4', to: 'r3' },
      { id: 'tg-h2', from: 'b3', to: 'r3' },
      { id: 'tg-v1', from: 'b5', to: 'r1' },
      { id: 'tg-v2', from: 'b3', to: 'r1' },
    ]
  },

  // 8. Compound Multi-Hip with Wing (Ref: 10.05.14)
  'compound-hip': {
    id: 'compound-hip',
    baseCoords: [
      [-0.36, 0.82],  // b0: Main TL
      [0.96, 0.82],   // b1: Main TR
      [0.96, -0.82],  // b2: Main BR
      [-0.36, -0.82], // b3: Main BL
      [-0.36, -0.18], // b4: Wing Inner Bottom
      [-0.96, -0.18], // b5: Wing Outer BL
      [-0.96, 0.62],  // b6: Wing Outer TL
      [-0.36, 0.62],  // b7: Wing Inner Top
    ],
    ridgeCoords: [
      [0.16, 0],      // r0: Main Left Hip Peak
      [0.46, 0],      // r1: Main Right Hip Peak
      [-0.64, 0.22],  // r2: Wing Hip Peak
      [-0.12, 0.22],  // r3: Wing Valley Junction
    ],
    faces: [
      { id: 'ch-mn', nameEn: 'Main North Triangle', nameEs: 'Triángulo Norte Principal', vertices: ['b0', 'b1', 'r1', 'r0'], colorIndex: 0 },
      { id: 'ch-me', nameEn: 'Main East Triangle', nameEs: 'Triángulo Este Principal', vertices: ['b1', 'b2', 'r1'], colorIndex: 3 },
      { id: 'ch-ms', nameEn: 'Main South Triangle', nameEs: 'Triángulo Sur Principal', vertices: ['r0', 'r1', 'b2', 'b3'], colorIndex: 2 },
      { id: 'ch-mwu', nameEn: 'Main West Upper Hip', nameEs: 'Hip Oeste Superior', vertices: ['b0', 'r0', 'r3', 'b7'], colorIndex: 1 },
      { id: 'ch-mwl', nameEn: 'Main West Lower Hip', nameEs: 'Hip Oeste Inferior', vertices: ['b4', 'r3', 'r0', 'b3'], colorIndex: 1 },
      { id: 'ch-ww', nameEn: 'Wing Hip Triangle', nameEs: 'Triángulo del Ala', vertices: ['b6', 'r2', 'b5'], colorIndex: 3 },
      { id: 'ch-wn', nameEn: 'Wing North Slope', nameEs: 'Faldón Norte del Ala', vertices: ['b6', 'b7', 'r3', 'r2'], colorIndex: 0 },
      { id: 'ch-ws', nameEn: 'Wing South Slope', nameEs: 'Faldón Sur del Ala', vertices: ['r2', 'r3', 'b4', 'b5'], colorIndex: 2 },
    ],
    lines: [
      { id: 'ch-m1', from: 'r0', to: 'r1', isMainRidge: true },
      { id: 'ch-m2', from: 'r2', to: 'r3', isMainRidge: true },
      { id: 'ch-h1', from: 'b0', to: 'r0' },
      { id: 'ch-h2', from: 'b3', to: 'r0' },
      { id: 'ch-h3', from: 'b1', to: 'r1' },
      { id: 'ch-h4', from: 'b2', to: 'r1' },
      { id: 'ch-wh1', from: 'b6', to: 'r2' },
      { id: 'ch-wh2', from: 'b5', to: 'r2' },
      { id: 'ch-wv1', from: 'b7', to: 'r3' },
      { id: 'ch-wv2', from: 'b4', to: 'r3' },
    ]
  },

  // 9. Cross-Gable T-Plan with Valley Triangle (Ref: 10.05.44)
  'cross-gable': {
    id: 'cross-gable',
    baseCoords: [
      [-0.96, 0.82],  // b0: Left Block TL
      [-0.08, 0.82],  // b1: Top Junction
      [0.96, 0.68],   // b2: Right Wing TR
      [0.96, -0.72],  // b3: Right Wing BR
      [-0.08, -0.82], // b4: Bottom Junction
      [-0.96, -0.82], // b5: Left Block BL
    ],
    ridgeCoords: [
      [-0.52, 0.82],  // r0: Left Vertical Ridge Top
      [-0.52, -0.02], // r1: Central Valley Apex
      [-0.52, -0.82], // r2: Left Vertical Ridge Bottom
      [0.96, -0.02],  // r3: Right Horizontal Ridge End
    ],
    faces: [
      { id: 'cg-w', nameEn: 'West Main Slope', nameEs: 'Faldón Principal Oeste', vertices: ['b0', 'r0', 'r1', 'r2', 'b5'], colorIndex: 0 },
      { id: 'cg-nu', nameEn: 'North-East Triangle', nameEs: 'Triángulo Noreste', vertices: ['r0', 'b1', 'r1'], colorIndex: 3 },
      { id: 'cg-sl', nameEn: 'South-East Triangle', nameEs: 'Triángulo Sureste', vertices: ['r1', 'b4', 'r2'], colorIndex: 3 },
      { id: 'cg-wn', nameEn: 'East Wing North Slope', nameEs: 'Faldón Norte Extensión', vertices: ['b1', 'b2', 'r3', 'r1'], colorIndex: 1 },
      { id: 'cg-ws', nameEn: 'East Wing South Slope', nameEs: 'Faldón Sur Extensión', vertices: ['r1', 'r3', 'b3', 'b4'], colorIndex: 2 },
    ],
    lines: [
      { id: 'cg-m1', from: 'r0', to: 'r1', isMainRidge: true },
      { id: 'cg-m2', from: 'r1', to: 'r2', isMainRidge: true },
      { id: 'cg-m3', from: 'r1', to: 'r3', isMainRidge: true },
      { id: 'cg-v1', from: 'b1', to: 'r1' },
      { id: 'cg-v2', from: 'b4', to: 'r1' },
    ]
  },

  // 10. L-Shape House + Garage Wing (Ref: 10.06.10)
  'l-shape-wing': {
    id: 'l-shape-wing',
    baseCoords: [
      [-0.96, 0.84],  // b0: Main TL
      [0.02, 0.84],   // b1: Main TR
      [0.96, 0.76],   // b2: Wing TR
      [0.96, 0.04],   // b3: Wing BR
      [0.02, 0.04],   // b4: Inner L-Corner
      [0.02, -0.84],  // b5: Main BR
      [-0.96, -0.84], // b6: Main BL
    ],
    ridgeCoords: [
      [-0.47, 0.84],  // r0: Main Vertical Ridge Top
      [-0.47, 0.40],  // r1: Main Ridge Wing Junction
      [-0.47, -0.84], // r2: Main Vertical Ridge Bottom
      [0.58, 0.40],   // r3: Garage Wing Hip/Gable Vertex
    ],
    faces: [
      { id: 'ls-w', nameEn: 'Main West Slope', nameEs: 'Faldón Principal Oeste', vertices: ['b0', 'r0', 'r2', 'b6'], colorIndex: 2 },
      { id: 'ls-ne', nameEn: 'Upper East Triangle', nameEs: 'Triángulo Superior Este', vertices: ['r0', 'b1', 'r1'], colorIndex: 0 },
      { id: 'ls-se', nameEn: 'Main Lower East Slope', nameEs: 'Faldón Inferior Este', vertices: ['r1', 'b4', 'b5', 'r2'], colorIndex: 0 },
      { id: 'ls-wn', nameEn: 'Garage North Slope', nameEs: 'Faldón Norte Garaje', vertices: ['b1', 'b2', 'r3', 'r1'], colorIndex: 1 },
      { id: 'ls-we', nameEn: 'Garage East Triangle', nameEs: 'Triángulo Este Garaje', vertices: ['b2', 'b3', 'r3'], colorIndex: 3 },
      { id: 'ls-ws', nameEn: 'Garage South Slope', nameEs: 'Faldón Sur Garaje', vertices: ['r1', 'r3', 'b3', 'b4'], colorIndex: 2 },
    ],
    lines: [
      { id: 'ls-m1', from: 'r0', to: 'r1', isMainRidge: true },
      { id: 'ls-m2', from: 'r1', to: 'r2', isMainRidge: true },
      { id: 'ls-m3', from: 'r1', to: 'r3', isMainRidge: true },
      { id: 'ls-v1', from: 'b1', to: 'r1' },
      { id: 'ls-v2', from: 'b4', to: 'r1' },
      { id: 'ls-h1', from: 'b2', to: 'r3' },
      { id: 'ls-h2', from: 'b3', to: 'r3' },
    ]
  },

  // 11. Multi-Wing Complex Residence (Ref: 10.05.56)
  'multi-wing': {
    id: 'multi-wing',
    baseCoords: [
      [-0.96, 0.80],  // b0: Left Wing TL
      [-0.12, 0.84],  // b1: Top Dormer Left
      [0.42, 0.84],   // b2: Top Dormer Right
      [0.68, 0.60],   // b3: Main TR
      [0.96, 0.25],   // b4: Right Porch TR
      [0.96, -0.45],  // b5: Right Porch BR
      [0.68, -0.78],  // b6: Main BR
      [-0.96, -0.84], // b7: Left Wing BL
    ],
    ridgeCoords: [
      [-0.45, 0.80],  // r0: Left Wing Top Ridge
      [-0.45, 0.02],  // r1: Central Diagonal Valley Apex
      [0.15, 0.84],   // r2: Top Dormer Ridge Peak
      [0.15, 0.02],   // r3: Central Main Ridge Junction
      [0.68, -0.10],  // r4: Right Porch Hip Junction
    ],
    faces: [
      { id: 'mw-lw', nameEn: 'Left Wing West Slope', nameEs: 'Faldón Oeste Ala Izq.', vertices: ['b0', 'r0', 'r1', 'b7'], colorIndex: 2 },
      { id: 'mw-nw', nameEn: 'North-West Triangle', nameEs: 'Triángulo Noroeste', vertices: ['r0', 'b1', 'r1'], colorIndex: 0 },
      { id: 'mw-dl', nameEn: 'North Dormer Left', nameEs: 'Cumbrera Norte Izq.', vertices: ['b1', 'r2', 'r3', 'r1'], colorIndex: 3 },
      { id: 'mw-dr', nameEn: 'North Dormer Right', nameEs: 'Cumbrera Norte Der.', vertices: ['r2', 'b2', 'b3', 'r4', 'r3'], colorIndex: 1 },
      { id: 'mw-mc', nameEn: 'Central Main Slope', nameEs: 'Faldón Central', vertices: ['r1', 'r3', 'r4', 'b6'], colorIndex: 0 },
      { id: 'mw-st', nameEn: 'South Diagonal Triangle', nameEs: 'Gran Triángulo Sur', vertices: ['r1', 'b6', 'b7'], colorIndex: 3 },
      { id: 'mw-rp', nameEn: 'Right Porch Hip Wing', nameEs: 'Ala Hip Derecha', vertices: ['b3', 'b4', 'b5', 'b6', 'r4'], colorIndex: 2 },
    ],
    lines: [
      { id: 'mw-m1', from: 'r0', to: 'r1', isMainRidge: true },
      { id: 'mw-m2', from: 'r1', to: 'r3', isMainRidge: true },
      { id: 'mw-m3', from: 'r3', to: 'r4', isMainRidge: true },
      { id: 'mw-m4', from: 'r2', to: 'r3', isMainRidge: true },
      { id: 'mw-v1', from: 'b7', to: 'r1' },
      { id: 'mw-v2', from: 'b6', to: 'r1' },
      { id: 'mw-v3', from: 'b1', to: 'r1' },
      { id: 'mw-v4', from: 'b4', to: 'r4' },
      { id: 'mw-v5', from: 'b5', to: 'r4' },
    ]
  },

  // 12. V2: Asymmetrical Cross + NW Dormer (Ref: v2 dcsfbd.png)
  'v2-asym-cross': {
    id: 'v2-asym-cross',
    baseCoords: [
      [-0.96, 0.78],  // b0: TL
      [0.96, 0.78],   // b1: TR
      [0.96, -0.78],  // b2: BR
      [-0.96, -0.78], // b3: BL
    ],
    ridgeCoords: [
      [-0.96, 0.0],   // r0: West Gable Ridge End
      [-0.50, 0.0],   // r1: NW Dormer Valley Junction
      [0.18, 0.0],    // r2: Main 4-Way Cross Apex
      [-0.50, 0.78],  // r3: NW Dormer Peak
      [0.18, 0.78],   // r4: North Cross-Gable Peak
      [0.18, -0.78],  // r5: South Cross-Gable Peak
    ],
    faces: [
      { id: 'vac-nwl', nameEn: 'NW Outer Slope', nameEs: 'Faldón Noroeste Ext.', vertices: ['b0', 'r3', 'r1', 'r0'], colorIndex: 0 },
      { id: 'vac-nwd', nameEn: 'NW Dormer Triangle', nameEs: 'Buhardilla Noroeste', vertices: ['r3', 'r4', 'r2', 'r1'], colorIndex: 3 },
      { id: 'vac-ne', nameEn: 'North-East Triangle', nameEs: 'Triángulo Noreste', vertices: ['r4', 'b1', 'r2'], colorIndex: 1 },
      { id: 'vac-e', nameEn: 'East Hip Triangle', nameEs: 'Gran Triángulo Este', vertices: ['b1', 'b2', 'r2'], colorIndex: 3 },
      { id: 'vac-se', nameEn: 'South-East Triangle', nameEs: 'Triángulo Sureste', vertices: ['r2', 'b2', 'r5'], colorIndex: 1 },
      { id: 'vac-sw', nameEn: 'South-West Main Slope', nameEs: 'Faldón Principal Suroeste', vertices: ['r0', 'r1', 'r2', 'r5', 'b3'], colorIndex: 2 },
    ],
    lines: [
      { id: 'vac-m1', from: 'r0', to: 'r1', isMainRidge: true },
      { id: 'vac-m2', from: 'r1', to: 'r2', isMainRidge: true },
      { id: 'vac-m3', from: 'r4', to: 'r2', isMainRidge: true },
      { id: 'vac-m4', from: 'r5', to: 'r2', isMainRidge: true },
      { id: 'vac-m5', from: 'r3', to: 'r1', isMainRidge: true },
      { id: 'vac-v1', from: 'b1', to: 'r2' },
      { id: 'vac-v2', from: 'b2', to: 'r2' },
      { id: 'vac-v3', from: 'b0', to: 'r1' },
      { id: 'vac-v4', from: 'b3', to: 'r2' },
    ]
  },

  // 13. V2: T-Shape Vertical Gable + West Gable Wing (Ref: v2 dfsds.png)
  'v2-t-wing': {
    id: 'v2-t-wing',
    baseCoords: [
      [-0.06, 0.86],  // b0: Main Block TL
      [0.96, 0.86],   // b1: Main Block TR
      [0.96, -0.86],  // b2: Main Block BR
      [-0.06, -0.86], // b3: Main Block BL
      [-0.06, -0.44], // b4: Wing Inner Bottom Corner
      [-0.96, -0.44], // b5: Wing Outer BL
      [-0.96, 0.56],  // b6: Wing Outer TL
      [-0.06, 0.56],  // b7: Wing Inner Top Corner
    ],
    ridgeCoords: [
      [0.45, 0.86],   // r0: Main Vertical Ridge Top
      [0.45, -0.86],  // r1: Main Vertical Ridge Bottom
      [0.20, 0.06],   // r2: Wing-to-Main Triangular Valley Apex
      [-0.96, 0.06],  // r3: West Wing Gable Ridge End
    ],
    faces: [
      { id: 'vtw-e', nameEn: 'Main East Slope', nameEs: 'Faldón Principal Este', vertices: ['r0', 'b1', 'b2', 'r1'], colorIndex: 3 },
      { id: 'vtw-w', nameEn: 'Main West Slope', nameEs: 'Faldón Principal Oeste', vertices: ['b0', 'r0', 'r1', 'b3', 'b4', 'r2', 'b7'], colorIndex: 2 },
      { id: 'vtw-wn', nameEn: 'West Wing North Slope', nameEs: 'Faldón Norte del Ala', vertices: ['b6', 'b7', 'r2', 'r3'], colorIndex: 0 },
      { id: 'vtw-ws', nameEn: 'West Wing South Slope', nameEs: 'Faldón Sur del Ala', vertices: ['r3', 'r2', 'b4', 'b5'], colorIndex: 1 },
    ],
    lines: [
      { id: 'vtw-m1', from: 'r0', to: 'r1', isMainRidge: true },
      { id: 'vtw-m2', from: 'r3', to: 'r2', isMainRidge: true },
      { id: 'vtw-v1', from: 'b7', to: 'r2' },
      { id: 'vtw-v2', from: 'b4', to: 'r2' },
    ]
  },

  // 14. V2: Victorian Cross + Turret & Dormer (Ref: v2 dfsdvsd.png)
  'v2-oct-turret': {
    id: 'v2-oct-turret',
    baseCoords: [
      [-0.44, 0.86],  // b0: North Wing TL
      [0.64, 0.80],   // b1: North Wing TR
      [0.96, 0.56],   // b2: East Wing TR
      [0.96, -0.46],  // b3: SE Turret East Edge
      [0.64, -0.86],  // b4: South Wing BR
      [-0.44, -0.86], // b5: South Wing BL
      [-0.96, -0.86], // b6: West Wing BL
      [-0.96, 0.56],  // b7: West Wing TL
    ],
    ridgeCoords: [
      [0.06, 0.84],   // r0: North Main Ridge
      [0.06, 0.0],    // r1: Central Cross Apex
      [0.06, -0.86],  // r2: South Main Ridge
      [-0.96, 0.0],   // r3: West Wing Ridge End
      [0.24, 0.0],    // r4: East Valley Apex
      [0.76, -0.28],  // r5: SE Turret Peak
    ],
    faces: [
      { id: 'vot-nw', nameEn: 'North-West Slope', nameEs: 'Faldón Noroeste', vertices: ['b0', 'r0', 'r1', 'b7'], colorIndex: 2 },
      { id: 'vot-wn', nameEn: 'West Wing North', nameEs: 'Ala Oeste Norte', vertices: ['b7', 'r1', 'r3'], colorIndex: 0 },
      { id: 'vot-ws', nameEn: 'West Wing South', nameEs: 'Ala Oeste Sur', vertices: ['r3', 'r1', 'b5', 'b6'], colorIndex: 3 },
      { id: 'vot-sw', nameEn: 'South-West Slope', nameEs: 'Faldón Suroeste', vertices: ['b5', 'r1', 'r2'], colorIndex: 2 },
      { id: 'vot-ne', nameEn: 'North-East Slope', nameEs: 'Faldón Noreste', vertices: ['r0', 'b1', 'r4', 'r1'], colorIndex: 3 },
      { id: 'vot-e', nameEn: 'East Triangle', nameEs: 'Triángulo Este', vertices: ['b1', 'b2', 'r5', 'r4'], colorIndex: 0 },
      { id: 'vot-tur', nameEn: 'SE Turret Hip', nameEs: 'Torreta Sureste', vertices: ['b2', 'b3', 'b4', 'r5'], colorIndex: 3 },
      { id: 'vot-se', nameEn: 'South-East Slope', nameEs: 'Faldón Sureste', vertices: ['r1', 'r4', 'r5', 'b4', 'r2'], colorIndex: 1 },
    ],
    lines: [
      { id: 'vot-m1', from: 'r0', to: 'r1', isMainRidge: true },
      { id: 'vot-m2', from: 'r1', to: 'r2', isMainRidge: true },
      { id: 'vot-m3', from: 'r3', to: 'r1', isMainRidge: true },
      { id: 'vot-m4', from: 'r4', to: 'r5', isMainRidge: true },
      { id: 'vot-v1', from: 'b7', to: 'r1' },
      { id: 'vot-v2', from: 'b5', to: 'r1' },
      { id: 'vot-v3', from: 'b1', to: 'r4' },
      { id: 'vot-v4', from: 'b4', to: 'r4' },
      { id: 'vot-v5', from: 'b2', to: 'r5' },
      { id: 'vot-v6', from: 'b3', to: 'r5' },
    ]
  },

  // 15. V2: Stepped Double-Band Hip (Ref: v2 dsfd.png)
  'v2-stepped-hip': {
    id: 'v2-stepped-hip',
    baseCoords: [
      [-0.96, 0.82],  // b0: TL
      [0.96, 0.82],   // b1: TR
      [0.96, -0.82],  // b2: BR
      [-0.96, -0.82], // b3: BL
    ],
    ridgeCoords: [
      [-0.46, 0.24],  // r0: West Upper Spine Vertex
      [-0.46, -0.24], // r1: West Lower Spine Vertex
      [-0.02, 0.82],  // r2: North Band Peak
      [-0.02, -0.82], // r3: South Band Peak
      [0.14, 0.0],    // r4: Central Main Apex (Chimney Center)
    ],
    faces: [
      { id: 'vsh-w', nameEn: 'West Hip Trapezoid', nameEs: 'Faldón Hip Oeste', vertices: ['b0', 'r0', 'r1', 'b3'], colorIndex: 2 },
      { id: 'vsh-nw', nameEn: 'North-West Triangle', nameEs: 'Triángulo Noroeste', vertices: ['b0', 'r2', 'r0'], colorIndex: 0 },
      { id: 'vsh-sw', nameEn: 'South-West Triangle', nameEs: 'Triángulo Suroeste', vertices: ['b3', 'r1', 'r3'], colorIndex: 0 },
      { id: 'vsh-nb', nameEn: 'North Diagonal Band', nameEs: 'Banda Diagonal Norte', vertices: ['r2', 'b1', 'r4', 'r0'], colorIndex: 1 },
      { id: 'vsh-sb', nameEn: 'South Diagonal Band', nameEs: 'Banda Diagonal Sur', vertices: ['r1', 'r4', 'b2', 'r3'], colorIndex: 1 },
      { id: 'vsh-c', nameEn: 'Central Chevron Triangle', nameEs: 'Triángulo Central', vertices: ['r0', 'r4', 'r1'], colorIndex: 0 },
      { id: 'vsh-e', nameEn: 'East Large Triangle', nameEs: 'Gran Triángulo Este', vertices: ['b1', 'b2', 'r4'], colorIndex: 3 },
    ],
    lines: [
      { id: 'vsh-m1', from: 'r0', to: 'r1', isMainRidge: true },
      { id: 'vsh-m2', from: 'r0', to: 'r2', isMainRidge: true },
      { id: 'vsh-m3', from: 'r1', to: 'r3', isMainRidge: true },
      { id: 'vsh-m4', from: 'b1', to: 'r4', isMainRidge: true },
      { id: 'vsh-m5', from: 'b2', to: 'r4', isMainRidge: true },
      { id: 'vsh-v1', from: 'b0', to: 'r0' },
      { id: 'vsh-v2', from: 'b3', to: 'r1' },
      { id: 'vsh-v3', from: 'r0', to: 'r4' },
      { id: 'vsh-v4', from: 'r1', to: 'r4' },
    ]
  },

  // 16. V2: Hip Roof with 6 Symmetrical Dormers (Ref: v2 sss.png)
  'v2-hip-6-dormers': {
    id: 'v2-hip-6-dormers',
    baseCoords: [
      [-0.86, 0.88],  // b0: TL
      [0.86, 0.88],   // b1: TR
      [0.86, -0.88],  // b2: BR
      [-0.86, -0.88], // b3: BL
    ],
    ridgeCoords: [
      [0, 0.48],      // r0: North Main Hip Peak
      [0, -0.48],     // r1: South Main Hip Peak
      [-0.36, 0.24],  // r2: NW Dormer Apex
      [-0.36, -0.24], // r3: SW Dormer Apex
      [0.36, 0.24],   // r4: NE Dormer Apex
      [0.36, -0.24],  // r5: SE Dormer Apex
    ],
    faces: [
      { id: 'vhd-n', nameEn: 'North Hip Triangle', nameEs: 'Triángulo Hip Norte', vertices: ['b0', 'b1', 'r0'], colorIndex: 3 },
      { id: 'vhd-s', nameEn: 'South Hip Triangle', nameEs: 'Triángulo Hip Sur', vertices: ['b3', 'r1', 'b2'], colorIndex: 3 },
      { id: 'vhd-wu', nameEn: 'West Upper Dormer', nameEs: 'Buhardilla Noroeste', vertices: ['b0', 'r0', 'r2'], colorIndex: 2 },
      { id: 'vhd-wm', nameEn: 'West Mid Slope', nameEs: 'Faldón Central Oeste', vertices: ['b0', 'r2', 'r0', 'r1', 'r3', 'b3'], colorIndex: 2 },
      { id: 'vhd-wl', nameEn: 'West Lower Dormer', nameEs: 'Buhardilla Suroeste', vertices: ['b3', 'r3', 'r1'], colorIndex: 1 },
      { id: 'vhd-eu', nameEn: 'East Upper Dormer', nameEs: 'Buhardilla Noreste', vertices: ['r0', 'b1', 'r4'], colorIndex: 0 },
      { id: 'vhd-em', nameEn: 'East Mid Slope', nameEs: 'Faldón Central Este', vertices: ['r0', 'r4', 'b1', 'b2', 'r5', 'r1'], colorIndex: 3 },
      { id: 'vhd-el', nameEn: 'East Lower Dormer', nameEs: 'Buhardilla Sureste', vertices: ['r1', 'r5', 'b2'], colorIndex: 0 },
    ],
    lines: [
      { id: 'vhd-m1', from: 'r0', to: 'r1', isMainRidge: true },
      { id: 'vhd-h1', from: 'b0', to: 'r0', isMainRidge: true },
      { id: 'vhd-h2', from: 'b1', to: 'r0', isMainRidge: true },
      { id: 'vhd-h3', from: 'b2', to: 'r1', isMainRidge: true },
      { id: 'vhd-h4', from: 'b3', to: 'r1', isMainRidge: true },
      { id: 'vhd-d1', from: 'b0', to: 'r2' },
      { id: 'vhd-d2', from: 'r0', to: 'r2' },
      { id: 'vhd-d3', from: 'b3', to: 'r3' },
      { id: 'vhd-d4', from: 'r1', to: 'r3' },
      { id: 'vhd-d5', from: 'b1', to: 'r4' },
      { id: 'vhd-d6', from: 'r0', to: 'r4' },
      { id: 'vhd-d7', from: 'b2', to: 'r5' },
      { id: 'vhd-d8', from: 'r1', to: 'r5' },
    ]
  },

  // 17. V2: Gable with Alternating Left & Right Dormers (Ref: v2ddvds.png)
  'v2-offset-dormers': {
    id: 'v2-offset-dormers',
    baseCoords: [
      [-0.82, 0.88],  // b0: TL
      [0.82, 0.88],   // b1: TR
      [0.82, -0.88],  // b2: BR
      [-0.82, -0.88], // b3: BL
    ],
    ridgeCoords: [
      [0, 0.88],      // r0: North Ridge End
      [0, 0.26],      // r1: Upper-Right Dormer Ridge Junction
      [0, -0.10],     // r2: Lower-Left Dormer Ridge Junction
      [0, -0.88],     // r3: South Ridge End
      [-0.76, -0.10], // r4: Left Dormer Outer Peak
      [0.76, 0.26],   // r5: Right Dormer Outer Peak
    ],
    faces: [
      { id: 'vod-wu', nameEn: 'West Upper Slope', nameEs: 'Faldón Oeste Superior', vertices: ['b0', 'r0', 'r2', 'r4'], colorIndex: 2 },
      { id: 'vod-wd', nameEn: 'West Dormer Triangle', nameEs: 'Triángulo Buhardilla Izq.', vertices: ['b0', 'r4', 'r2', 'b3'], colorIndex: 3 },
      { id: 'vod-wl', nameEn: 'West Lower Slope', nameEs: 'Faldón Oeste Inferior', vertices: ['r4', 'r2', 'r3', 'b3'], colorIndex: 2 },
      { id: 'vod-eu', nameEn: 'East Upper Slope', nameEs: 'Faldón Este Superior', vertices: ['r0', 'b1', 'r5', 'r1'], colorIndex: 0 },
      { id: 'vod-ed', nameEn: 'East Dormer Triangle', nameEs: 'Triángulo Buhardilla Der.', vertices: ['b1', 'b2', 'r1', 'r5'], colorIndex: 3 },
      { id: 'vod-el', nameEn: 'East Lower Slope', nameEs: 'Faldón Este Inferior', vertices: ['r1', 'r5', 'b2', 'r3'], colorIndex: 0 },
    ],
    lines: [
      { id: 'vod-m1', from: 'r0', to: 'r1', isMainRidge: true },
      { id: 'vod-m2', from: 'r1', to: 'r2', isMainRidge: true },
      { id: 'vod-m3', from: 'r2', to: 'r3', isMainRidge: true },
      { id: 'vod-d1', from: 'r4', to: 'r2', isMainRidge: true },
      { id: 'vod-d2', from: 'r5', to: 'r1', isMainRidge: true },
      { id: 'vod-v1', from: 'b0', to: 'r4' },
      { id: 'vod-v2', from: 'b3', to: 'r4' },
      { id: 'vod-v3', from: 'b1', to: 'r5' },
      { id: 'vod-v4', from: 'b2', to: 'r5' },
    ]
  },

  // 18. V3: Stepped West Wing + Center Gable Arrow (Ref: media_0998eda8)
  'v3-stepped-t': {
    id: 'v3-stepped-t',
    baseCoords: [
      [-0.24, 0.86],  // b0: Main TL
      [0.96, 0.86],   // b1: Main TR
      [0.96, -0.82],  // b2: Main BR
      [-0.24, -0.82], // b3: Main BL
      [-0.24, -0.58], // b4: Lower Wing Inner Step
      [-0.96, -0.58], // b5: Far West Wing BL
      [-0.96, 0.34],  // b6: Far West Wing TL
      [-0.24, 0.34],  // b7: Upper West Inner Step
    ],
    ridgeCoords: [
      [0.36, 0.86],   // r0: Main Vertical Ridge Top
      [0.36, 0.14],   // r1: Main Ridge Center-Upper Junction
      [0.36, -0.82],  // r2: Main Vertical Ridge Bottom
      [0.24, 0.14],   // r3: Center Arrow Gable Apex
      [-0.36, 0.14],  // r4: Center Arrow Gable West End
      [-0.42, -0.14], // r5: Far West Lower Wing Apex
    ],
    faces: [
      { id: 'vst-e', nameEn: 'Main East Slope', nameEs: 'Faldón Principal Este', vertices: ['r0', 'b1', 'b2', 'r2', 'r1'], colorIndex: 0 },
      { id: 'vst-nw', nameEn: 'Main Upper-West Slope', nameEs: 'Faldón Noroeste', vertices: ['b0', 'r0', 'r1', 'r3', 'b7'], colorIndex: 2 },
      { id: 'vst-sw', nameEn: 'Main Lower-West Slope', nameEs: 'Faldón Suroeste', vertices: ['r3', 'r1', 'r2', 'b3', 'b4'], colorIndex: 2 },
      { id: 'vst-cn', nameEn: 'Center Gable North', nameEs: 'Cumbrera Central Norte', vertices: ['b7', 'r3', 'r4'], colorIndex: 3 },
      { id: 'vst-cs', nameEn: 'Center Gable South', nameEs: 'Cumbrera Central Sur', vertices: ['r4', 'r3', 'b4', 'r5'], colorIndex: 1 },
      { id: 'vst-wn', nameEn: 'West Addition North', nameEs: 'Extensión Oeste Norte', vertices: ['b6', 'b7', 'r4', 'r5'], colorIndex: 2 },
      { id: 'vst-ws', nameEn: 'West Addition South Triangle', nameEs: 'Triángulo Extensión Oeste', vertices: ['b6', 'r5', 'b4', 'b5'], colorIndex: 3 },
    ],
    lines: [
      { id: 'vst-m1', from: 'r0', to: 'r1', isMainRidge: true },
      { id: 'vst-m2', from: 'r1', to: 'r2', isMainRidge: true },
      { id: 'vst-m3', from: 'r4', to: 'r3', isMainRidge: true },
      { id: 'vst-m4', from: 'b6', to: 'r5', isMainRidge: true },
      { id: 'vst-v1', from: 'b7', to: 'r3' },
      { id: 'vst-v2', from: 'b4', to: 'r3' },
      { id: 'vst-v3', from: 'b5', to: 'r5' },
    ]
  },

  // 19. V3: Vertical Gable with 2 Left Dormers + 1 Right Dormer (Ref: media_71c7875b)
  'v3-triple-dormer': {
    id: 'v3-triple-dormer',
    baseCoords: [
      [-0.86, 0.86],  // b0: TL
      [0.86, 0.86],   // b1: TR
      [0.86, -0.86],  // b2: BR
      [-0.86, -0.86], // b3: BL
    ],
    ridgeCoords: [
      [0, 0.86],      // r0: North Main Ridge End
      [0, -0.86],     // r1: South Main Ridge End
      [-0.22, 0.34],  // r2: Upper-Left Dormer Apex
      [-0.22, -0.34], // r3: Lower-Left Dormer Apex
      [0.24, -0.02],  // r4: Center-Right Dormer Apex
    ],
    faces: [
      { id: 'vtd-wl', nameEn: 'West Main Slope', nameEs: 'Faldón Principal Oeste', vertices: ['b0', 'r0', 'r1', 'b3'], colorIndex: 2 },
      { id: 'vtd-wdu', nameEn: 'Upper-Left Dormer', nameEs: 'Buhardilla Sup. Izquierda', vertices: ['b0', 'r0', 'r2'], colorIndex: 3 },
      { id: 'vtd-wdl', nameEn: 'Lower-Left Dormer', nameEs: 'Buhardilla Inf. Izquierda', vertices: ['b3', 'r3', 'r1'], colorIndex: 3 },
      { id: 'vtd-er', nameEn: 'East Main Slope', nameEs: 'Faldón Principal Este', vertices: ['r0', 'b1', 'b2', 'r1'], colorIndex: 0 },
      { id: 'vtd-edc', nameEn: 'Right Center Dormer', nameEs: 'Buhardilla Central Derecha', vertices: ['b1', 'b2', 'r4'], colorIndex: 3 },
    ],
    lines: [
      { id: 'vtd-m1', from: 'r0', to: 'r1', isMainRidge: true },
      { id: 'vtd-d1', from: 'b0', to: 'r2', isMainRidge: true },
      { id: 'vtd-d2', from: 'r0', to: 'r2' },
      { id: 'vtd-d3', from: 'b3', to: 'r3', isMainRidge: true },
      { id: 'vtd-d4', from: 'r1', to: 'r3' },
      { id: 'vtd-d5', from: 'b1', to: 'r4', isMainRidge: true },
      { id: 'vtd-d6', from: 'b2', to: 'r4' },
    ]
  },

  // 20. V3: NW Wing + 2 Sharp East Triangular Gables (Ref: media_f6565a28)
  'v3-wing-twin-gables': {
    id: 'v3-wing-twin-gables',
    baseCoords: [
      [-0.30, 0.86],  // b0: Main TL
      [0.96, 0.86],   // b1: Main TR
      [0.96, -0.86],  // b2: Main BR
      [-0.30, -0.86], // b3: Main BL
      [-0.30, 0.02],  // b4: NW Wing Inner Corner
      [-0.96, 0.02],  // b5: NW Wing BL
      [-0.96, 0.78],  // b6: NW Wing TL
    ],
    ridgeCoords: [
      [0.28, 0.86],   // r0: Main Vertical Ridge Top
      [0.28, 0.40],   // r1: Upper-Right Triangle Valley Apex
      [0.28, -0.34],  // r2: Lower-Right Triangle Valley Apex
      [0.28, -0.86],  // r3: Main Vertical Ridge Bottom
      [0.02, 0.40],   // r4: NW Wing Triangle Valley Apex
      [-0.96, 0.40],  // r5: NW Wing Gable Ridge End
    ],
    faces: [
      { id: 'vwt-w', nameEn: 'Main West Slope', nameEs: 'Faldón Principal Oeste', vertices: ['b0', 'r0', 'r3', 'b3', 'b4', 'r4'], colorIndex: 2 },
      { id: 'vwt-wn', nameEn: 'NW Wing North Slope', nameEs: 'Ala Noroeste Norte', vertices: ['b6', 'b0', 'r4', 'r5'], colorIndex: 0 },
      { id: 'vwt-ws', nameEn: 'NW Wing South Slope', nameEs: 'Ala Noroeste Sur', vertices: ['r5', 'r4', 'b4', 'b5'], colorIndex: 1 },
      { id: 'vwt-eu', nameEn: 'Upper-East Gable Triangle', nameEs: 'Triángulo Superior Este', vertices: ['r0', 'b1', 'r1'], colorIndex: 3 },
      { id: 'vwt-em', nameEn: 'Middle-East Gable Triangle', nameEs: 'Triángulo Central Este', vertices: ['r1', 'b1', 'b2', 'r2'], colorIndex: 0 },
      { id: 'vwt-el', nameEn: 'Lower-East Gable Triangle', nameEs: 'Triángulo Inferior Este', vertices: ['r2', 'b2', 'r3'], colorIndex: 3 },
    ],
    lines: [
      { id: 'vwt-m1', from: 'r0', to: 'r3', isMainRidge: true },
      { id: 'vwt-m2', from: 'r5', to: 'r4', isMainRidge: true },
      { id: 'vwt-v1', from: 'b0', to: 'r4' },
      { id: 'vwt-v2', from: 'b4', to: 'r4' },
      { id: 'vwt-g1', from: 'b1', to: 'r1', isMainRidge: true },
      { id: 'vwt-g2', from: 'b2', to: 'r2', isMainRidge: true },
      { id: 'vwt-g3', from: 'b1', to: 'r2' },
    ]
  },

  // 21. V3: NW Wing + 2 Right Diamond Dormers (Ref: media_c3a44f57)
  'v3-wing-2-dormers': {
    id: 'v3-wing-2-dormers',
    baseCoords: [
      [-0.30, 0.86],  // b0: Main TL
      [0.96, 0.86],   // b1: Main TR
      [0.96, -0.86],  // b2: Main BR
      [-0.30, -0.86], // b3: Main BL
      [-0.30, -0.26], // b4: NW Wing Inner Corner
      [-0.96, -0.26], // b5: NW Wing BL
      [-0.96, 0.72],  // b6: NW Wing TL
    ],
    ridgeCoords: [
      [0.32, 0.86],   // r0: Main Vertical Ridge Top
      [0.32, 0.24],   // r1: Upper-Right Dormer Apex
      [0.32, -0.44],  // r2: Lower-Right Dormer Apex
      [0.32, -0.86],  // r3: Main Vertical Ridge Bottom
      [0.14, 0.24],   // r4: NW Wing Diagonal Valley Apex
      [-0.96, 0.24],  // r5: NW Wing Gable Ridge End
    ],
    faces: [
      { id: 'vw2-w', nameEn: 'Main West Slope', nameEs: 'Faldón Principal Oeste', vertices: ['b0', 'r0', 'r3', 'b3', 'b4', 'r4'], colorIndex: 2 },
      { id: 'vw2-wn', nameEn: 'NW Wing North Triangle', nameEs: 'Triángulo Norte del Ala', vertices: ['b6', 'b0', 'r4', 'r5'], colorIndex: 1 },
      { id: 'vw2-ws', nameEn: 'NW Wing South Triangle', nameEs: 'Triángulo Sur del Ala', vertices: ['r5', 'r4', 'b4', 'b5'], colorIndex: 0 },
      { id: 'vw2-eu', nameEn: 'Upper-Right Diamond Dormer', nameEs: 'Buhardilla Superior Derecha', vertices: ['r0', 'b1', 'r1'], colorIndex: 3 },
      { id: 'vw2-em', nameEn: 'East Center Slope', nameEs: 'Faldón Central Este', vertices: ['r1', 'b1', 'b2', 'r2'], colorIndex: 0 },
      { id: 'vw2-el', nameEn: 'Lower-Right Diamond Dormer', nameEs: 'Buhardilla Inferior Derecha', vertices: ['r2', 'b2', 'r3'], colorIndex: 3 },
    ],
    lines: [
      { id: 'vw2-m1', from: 'r0', to: 'r3', isMainRidge: true },
      { id: 'vw2-m2', from: 'r5', to: 'r4', isMainRidge: true },
      { id: 'vw2-v1', from: 'b6', to: 'r4' },
      { id: 'vw2-v2', from: 'b5', to: 'r4' },
      { id: 'vw2-d1', from: 'b1', to: 'r1', isMainRidge: true },
      { id: 'vw2-d2', from: 'b2', to: 'r2', isMainRidge: true },
    ]
  },

  // 22. MN: Classic Minnesota Split-Level / Bi-Level with Protruding Garage
  'mn-split-level': {
    id: 'mn-split-level',
    baseCoords: [
      [-0.96, 0.76],  // b0: Upper Bedroom Wing TL
      [0.12, 0.76],   // b1: Upper/Mid Step North
      [0.12, 0.56],   // b2: Living Wing North-East
      [0.96, 0.56],   // b3: Garage Wing TR
      [0.96, -0.84],  // b4: Garage Front BR
      [0.24, -0.84],  // b5: Garage Front BL
      [0.24, -0.44],  // b6: Entry Inner Corner
      [-0.96, -0.44], // b7: Upper Bedroom Wing BL
    ],
    ridgeCoords: [
      [-0.96, 0.16],  // r0: West Gable End (Upper Level)
      [-0.08, 0.16],  // r1: Split-Level Step Ridge
      [0.58, 0.06],   // r2: Living/Garage Hip Junction
      [0.60, -0.50],  // r3: Protruding Garage Hip Peak
    ],
    faces: [
      { id: 'msl-un', nameEn: 'Upper Level North Slope', nameEs: 'Nivel Superior Norte', vertices: ['b0', 'b1', 'r1', 'r0'], colorIndex: 0 },
      { id: 'msl-us', nameEn: 'Upper Level South Slope', nameEs: 'Nivel Superior Sur', vertices: ['r0', 'r1', 'b6', 'b7'], colorIndex: 2 },
      { id: 'msl-mn', nameEn: 'Mid Living North Slope', nameEs: 'Nivel Medio Norte', vertices: ['b1', 'b2', 'b3', 'r2', 'r1'], colorIndex: 1 },
      { id: 'msl-ge', nameEn: 'Garage East Hip Slope', nameEs: 'Cochera Faldón Este', vertices: ['b3', 'b4', 'r3', 'r2'], colorIndex: 0 },
      { id: 'msl-gf', nameEn: 'Garage Front Hip Triangle', nameEs: 'Triángulo Frontal Cochera', vertices: ['b5', 'r3', 'b4'], colorIndex: 3 },
      { id: 'msl-gw', nameEn: 'Garage West Valley Slope', nameEs: 'Cochera Faldón Oeste', vertices: ['b6', 'r1', 'r2', 'r3', 'b5'], colorIndex: 2 },
    ],
    lines: [
      { id: 'msl-m1', from: 'r0', to: 'r1', isMainRidge: true },
      { id: 'msl-m2', from: 'r1', to: 'r2', isMainRidge: true },
      { id: 'msl-m3', from: 'r2', to: 'r3', isMainRidge: true },
      { id: 'msl-h1', from: 'b3', to: 'r2', isMainRidge: true },
      { id: 'msl-h2', from: 'b4', to: 'r3', isMainRidge: true },
      { id: 'msl-h3', from: 'b5', to: 'r3', isMainRidge: true },
      { id: 'msl-v1', from: 'b1', to: 'r1' },
      { id: 'msl-v2', from: 'b6', to: 'r1' },
    ]
  },

  // 23. MN: Minnesota L-Rambler (4-Slope Main Hip + Forward Hip Garage)
  'mn-rambler-garage': {
    id: 'mn-rambler-garage',
    baseCoords: [
      [-0.96, 0.78],  // b0: Main Rear-Left
      [0.96, 0.78],   // b1: Main Rear-Right
      [0.96, -0.86],  // b2: Garage Front-Right
      [0.22, -0.86],  // b3: Garage Front-Left
      [0.22, -0.26],  // b4: Courtyard Inner Corner
      [-0.96, -0.26], // b5: Main Front-Left
    ],
    ridgeCoords: [
      [-0.54, 0.26],  // r0: West Main Hip Peak
      [0.58, 0.26],   // r1: East Main Hip & Garage Junction
      [0.58, -0.48],  // r2: Forward Garage Hip Peak
    ],
    faces: [
      { id: 'mrg-w', nameEn: 'West Hip Triangle', nameEs: 'Triángulo Hip Oeste', vertices: ['b0', 'r0', 'b5'], colorIndex: 3 },
      { id: 'mrg-n', nameEn: 'Main Rear Hip Slope', nameEs: 'Faldón Trasero Principal', vertices: ['b0', 'b1', 'r1', 'r0'], colorIndex: 0 },
      { id: 'mrg-s', nameEn: 'Main Front Hip Slope', nameEs: 'Faldón Frontal Principal', vertices: ['r0', 'r1', 'b4', 'b5'], colorIndex: 2 },
      { id: 'mrg-ge', nameEn: 'Garage East Hip Slope', nameEs: 'Faldón Este Cochera', vertices: ['b1', 'b2', 'r2', 'r1'], colorIndex: 1 },
      { id: 'mrg-gf', nameEn: 'Garage Front Hip Triangle', nameEs: 'Triángulo Frontal Cochera', vertices: ['b3', 'r2', 'b2'], colorIndex: 3 },
      { id: 'mrg-gw', nameEn: 'Garage Inner Valley Slope', nameEs: 'Faldón Interior Cochera', vertices: ['b4', 'r1', 'r2', 'b3'], colorIndex: 2 },
    ],
    lines: [
      { id: 'mrg-m1', from: 'r0', to: 'r1', isMainRidge: true },
      { id: 'mrg-m2', from: 'r1', to: 'r2', isMainRidge: true },
      { id: 'mrg-h1', from: 'b0', to: 'r0', isMainRidge: true },
      { id: 'mrg-h2', from: 'b5', to: 'r0', isMainRidge: true },
      { id: 'mrg-h3', from: 'b1', to: 'r1', isMainRidge: true },
      { id: 'mrg-h4', from: 'b2', to: 'r2', isMainRidge: true },
      { id: 'mrg-h5', from: 'b3', to: 'r2', isMainRidge: true },
      { id: 'mrg-v1', from: 'b4', to: 'r1' },
    ]
  },

  // 24. MN: Suburban 2-Story with 3 Nested Front Gables (3-Car Garage Layout)
  'mn-suburban-3car': {
    id: 'mn-suburban-3car',
    baseCoords: [
      [-0.96, 0.84],  // b0: Rear TL
      [0.96, 0.84],   // b1: Rear TR
      [0.96, -0.86],  // b2: 3-Car Garage Front BR
      [0.28, -0.86],  // b3: 3-Car Garage Step
      [0.28, -0.64],  // b4: Mid Gable Front BR
      [-0.32, -0.64], // b5: Mid Gable Step
      [-0.32, -0.44], // b6: Left Wing Front BR
      [-0.96, -0.44], // b7: Left Wing Front BL
    ],
    ridgeCoords: [
      [-0.56, 0.26],  // r0: Main West Hip/Ridge
      [0.56, 0.26],   // r1: Main East Hip/Ridge
      [-0.64, -0.44], // r2: Left Front Gable Peak
      [-0.02, -0.64], // r3: Center Entry Gable Peak
      [0.62, -0.86],  // r4: Right 3-Car Garage Gable Peak
    ],
    faces: [
      { id: 'ms3-n', nameEn: 'Rear Main Slope', nameEs: 'Faldón Trasero Principal', vertices: ['b0', 'b1', 'r1', 'r0'], colorIndex: 0 },
      { id: 'ms3-w', nameEn: 'West Side Hip', nameEs: 'Faldón Lateral Oeste', vertices: ['b0', 'r0', 'r2', 'b7'], colorIndex: 2 },
      { id: 'ms3-g1', nameEn: 'Left Front Gable Triangle', nameEs: 'Pico Frontal Izquierdo', vertices: ['b7', 'r2', 'r0', 'b6'], colorIndex: 3 },
      { id: 'ms3-g2', nameEn: 'Center Entry Gable Triangle', nameEs: 'Pico Central Entrada', vertices: ['b6', 'r0', 'r1', 'r3', 'b5', 'b4'], colorIndex: 3 },
      { id: 'ms3-g3', nameEn: '3-Car Garage Gable Triangle', nameEs: 'Pico Cochera Triple', vertices: ['b4', 'r1', 'r4', 'b3', 'b2'], colorIndex: 3 },
      { id: 'ms3-e', nameEn: 'East Garage Slope', nameEs: 'Faldón Este Cochera', vertices: ['r1', 'b1', 'b2', 'r4'], colorIndex: 1 },
    ],
    lines: [
      { id: 'ms3-m1', from: 'r0', to: 'r1', isMainRidge: true },
      { id: 'ms3-m2', from: 'r0', to: 'r2', isMainRidge: true },
      { id: 'ms3-m3', from: 'r0', to: 'r3', isMainRidge: true },
      { id: 'ms3-m4', from: 'r1', to: 'r4', isMainRidge: true },
      { id: 'ms3-h1', from: 'b0', to: 'r0', isMainRidge: true },
      { id: 'ms3-h2', from: 'b1', to: 'r1', isMainRidge: true },
      { id: 'ms3-v1', from: 'b7', to: 'r2' },
      { id: 'ms3-v2', from: 'b6', to: 'r2' },
      { id: 'ms3-v3', from: 'b5', to: 'r3' },
      { id: 'ms3-v4', from: 'b4', to: 'r3' },
      { id: 'ms3-v5', from: 'b3', to: 'r4' },
      { id: 'ms3-v6', from: 'b2', to: 'r4' },
    ]
  },

  // 25. MN: Minneapolis Tudor Revival (Steep Cross-Gable + Entry Turret Peak)
  'mn-tudor-steep': {
    id: 'mn-tudor-steep',
    baseCoords: [
      [-0.84, 0.88],  // b0: Main TL
      [0.84, 0.88],   // b1: Main TR
      [0.84, -0.68],  // b2: Main BR
      [0.36, -0.68],  // b3: Front Tudor Gable TR
      [0.36, -0.92],  // b4: Front Tudor Gable BR
      [-0.48, -0.92], // b5: Front Tudor Gable BL
      [-0.48, -0.68], // b6: Main BL
      [-0.84, -0.68], // b7: Far West BL
    ],
    ridgeCoords: [
      [-0.84, 0.14],  // r0: West Main Gable End
      [-0.06, 0.14],  // r1: Tudor Cross Junction
      [0.84, 0.14],   // r2: East Main Gable End
      [-0.06, -0.92], // r3: Steep Front Tudor Gable Peak
      [0.44, -0.34],  // r4: Entry Accent Peak
    ],
    faces: [
      { id: 'mts-n', nameEn: 'North Steep Slope', nameEs: 'Faldón Norte Tudor', vertices: ['b0', 'b1', 'r2', 'r1', 'r0'], colorIndex: 0 },
      { id: 'mts-sw', nameEn: 'South-West Slope', nameEs: 'Faldón Suroeste', vertices: ['r0', 'r1', 'b6', 'b7'], colorIndex: 2 },
      { id: 'mts-tw', nameEn: 'Front Tudor West Slope', nameEs: ' ala Tudor Oeste', vertices: ['b6', 'r1', 'r3', 'b5'], colorIndex: 3 },
      { id: 'mts-te', nameEn: 'Front Tudor East Slope', nameEs: 'Ala Tudor Este', vertices: ['r1', 'r4', 'b3', 'b4', 'r3'], colorIndex: 1 },
      { id: 'mts-se', nameEn: 'South-East Entry Slope', nameEs: 'Faldón Entrada Sureste', vertices: ['r1', 'r2', 'b2', 'b3', 'r4'], colorIndex: 3 },
    ],
    lines: [
      { id: 'mts-m1', from: 'r0', to: 'r1', isMainRidge: true },
      { id: 'mts-m2', from: 'r1', to: 'r2', isMainRidge: true },
      { id: 'mts-m3', from: 'r1', to: 'r3', isMainRidge: true },
      { id: 'mts-m4', from: 'r1', to: 'r4', isMainRidge: true },
      { id: 'mts-v1', from: 'b6', to: 'r1' },
      { id: 'mts-v2', from: 'b3', to: 'r4' },
      { id: 'mts-v3', from: 'b2', to: 'r4' },
    ]
  },

  // 26. MN: Twin Cities Craftsman Bungalow (Wide Gable + Central Dormer + Porch)
  'mn-craftsman-bungalow': {
    id: 'mn-craftsman-bungalow',
    baseCoords: [
      [-0.92, 0.82],  // b0: Main TL
      [0.92, 0.82],   // b1: Main TR
      [0.92, -0.62],  // b2: Main BR
      [0.64, -0.62],  // b3: Front Porch TR
      [0.64, -0.90],  // b4: Front Porch BR
      [-0.64, -0.90], // b5: Front Porch BL
      [-0.64, -0.62], // b6: Front Porch TL
      [-0.92, -0.62], // b7: Main BL
    ],
    ridgeCoords: [
      [-0.92, 0.14],  // r0: West Main Gable Ridge
      [0, 0.14],      // r1: Central Dormer Ridge Tie-in
      [0.92, 0.14],   // r2: East Main Gable Ridge
      [0, -0.56],     // r3: Central Craftsman Dormer Peak
      [0, -0.76],     // r4: Front Porch Hip Center
    ],
    faces: [
      { id: 'mcb-n', nameEn: 'Rear North Slope', nameEs: 'Faldón Trasero Norte', vertices: ['b0', 'b1', 'r2', 'r1', 'r0'], colorIndex: 0 },
      { id: 'mcb-sw', nameEn: 'Front-Left Slope', nameEs: 'Faldón Frontal Izquierdo', vertices: ['r0', 'r1', 'r3', 'b6', 'b7'], colorIndex: 2 },
      { id: 'mcb-se', nameEn: 'Front-Right Slope', nameEs: 'Faldón Frontal Derecho', vertices: ['r1', 'r2', 'b2', 'b3', 'r3'], colorIndex: 2 },
      { id: 'mcb-d', nameEn: 'Central Bungalow Dormer', nameEs: 'Buhardilla Central Bungalow', vertices: ['b6', 'r3', 'b3'], colorIndex: 3 },
      { id: 'mcb-p', nameEn: 'Covered Front Porch Roof', nameEs: 'Techo Pórtico Frontal', vertices: ['b6', 'b3', 'b4', 'r4', 'b5'], colorIndex: 1 },
    ],
    lines: [
      { id: 'mcb-m1', from: 'r0', to: 'r1', isMainRidge: true },
      { id: 'mcb-m2', from: 'r1', to: 'r2', isMainRidge: true },
      { id: 'mcb-m3', from: 'r1', to: 'r3', isMainRidge: true },
      { id: 'mcb-v1', from: 'b6', to: 'r3' },
      { id: 'mcb-v2', from: 'b3', to: 'r3' },
      { id: 'mcb-p1', from: 'b5', to: 'r4' },
      { id: 'mcb-p2', from: 'b4', to: 'r4' },
    ]
  },

  // 27. MN: Historic St. Paul Dutch Colonial / Gambrel + 3 Dormers
  'mn-dutch-colonial': {
    id: 'mn-dutch-colonial',
    baseCoords: [
      [-0.94, 0.78],  // b0: TL
      [0.94, 0.78],   // b1: TR
      [0.94, -0.78],  // b2: BR
      [-0.94, -0.78], // b3: BL
    ],
    ridgeCoords: [
      [-0.94, 0.24],  // r0: Upper Gambrel Knuckle Left
      [0.94, 0.24],   // r1: Upper Gambrel Knuckle Right
      [-0.94, -0.24], // r2: Lower Gambrel Knuckle Left
      [0.94, -0.24],  // r3: Lower Gambrel Knuckle Right
      [-0.52, -0.74], // r4: Left Dormer Peak
      [0, -0.74],     // r5: Center Dormer Peak
      [0.52, -0.74],  // r6: Right Dormer Peak
    ],
    faces: [
      { id: 'mdc-n', nameEn: 'North Steep Gambrel', nameEs: 'Faldón Norte Gambrel', vertices: ['b0', 'b1', 'r1', 'r0'], colorIndex: 0 },
      { id: 'mdc-c', nameEn: 'Upper Gambrel Deck', nameEs: 'Meseta Superior Gambrel', vertices: ['r0', 'r1', 'r3', 'r2'], colorIndex: 1 },
      { id: 'mdc-s', nameEn: 'South Steep Gambrel + Dormers', nameEs: 'Faldón Sur + 3 Buhardillas', vertices: ['r2', 'r3', 'b2', 'b3'], colorIndex: 2 },
      { id: 'mdc-d1', nameEn: 'Left Dormer Triangle', nameEs: 'Buhardilla Izquierda', vertices: ['b3', 'r2', 'r4'], colorIndex: 3 },
      { id: 'mdc-d2', nameEn: 'Center Dormer Triangle', nameEs: 'Buhardilla Central', vertices: ['r2', 'r3', 'r5'], colorIndex: 3 },
      { id: 'mdc-d3', nameEn: 'Right Dormer Triangle', nameEs: 'Buhardilla Derecha', vertices: ['r3', 'b2', 'r6'], colorIndex: 3 },
    ],
    lines: [
      { id: 'mdc-m1', from: 'r0', to: 'r1', isMainRidge: true },
      { id: 'mdc-m2', from: 'r2', to: 'r3', isMainRidge: true },
      { id: 'mdc-d1', from: 'r2', to: 'r4', isMainRidge: true },
      { id: 'mdc-d2', from: 'r2', to: 'r5' },
      { id: 'mdc-d3', from: 'r3', to: 'r5' },
      { id: 'mdc-d4', from: 'r3', to: 'r6', isMainRidge: true },
    ]
  },

  // 28. MN: U-Shape Executive Courtyard / Walkout Home (Edina / Minnetonka)
  'mn-courtyard-u': {
    id: 'mn-courtyard-u',
    baseCoords: [
      [-0.96, 0.84],  // b0: Rear TL
      [0.96, 0.84],   // b1: Rear TR
      [0.96, -0.84],  // b2: Right Wing Front BR
      [0.38, -0.84],  // b3: Right Wing Front BL
      [0.38, -0.14],  // b4: Courtyard Inner TR
      [-0.38, -0.14], // b5: Courtyard Inner TL
      [-0.38, -0.84], // b6: Left Wing Front BR
      [-0.96, -0.84], // b7: Left Wing Front BL
    ],
    ridgeCoords: [
      [-0.67, 0.35],  // r0: Left Hip Junction
      [0.67, 0.35],   // r1: Right Hip Junction
      [-0.67, -0.52], // r2: Left Wing Front Hip Peak
      [0.67, -0.52],  // r3: Right Wing Front Hip Peak
    ],
    faces: [
      { id: 'mcu-n', nameEn: 'Rear Main Hip Slope', nameEs: 'Faldón Trasero Principal', vertices: ['b0', 'b1', 'r1', 'r0'], colorIndex: 0 },
      { id: 'mcu-c', nameEn: 'Center Courtyard Slope', nameEs: 'Faldón Patio Central', vertices: ['r0', 'r1', 'b4', 'b5'], colorIndex: 2 },
      { id: 'mcu-lw', nameEn: 'Left Wing Outer Slope', nameEs: 'Ala Izquierda Exterior', vertices: ['b0', 'r0', 'r2', 'b7'], colorIndex: 1 },
      { id: 'mcu-le', nameEn: 'Left Wing Courtyard Slope', nameEs: 'Ala Izquierda Interior', vertices: ['r0', 'b5', 'b6', 'r2'], colorIndex: 2 },
      { id: 'mcu-lf', nameEn: 'Left Wing Front Triangle', nameEs: 'Triángulo Frontal Izq.', vertices: ['b7', 'r2', 'b6'], colorIndex: 3 },
      { id: 'mcu-re', nameEn: 'Right Wing Outer Slope', nameEs: 'Ala Derecha Exterior', vertices: ['r1', 'b1', 'b2', 'r3'], colorIndex: 1 },
      { id: 'mcu-rw', nameEn: 'Right Wing Courtyard Slope', nameEs: 'Ala Derecha Interior', vertices: ['b4', 'r1', 'r3', 'b3'], colorIndex: 2 },
      { id: 'mcu-rf', nameEn: 'Right Wing Front Triangle', nameEs: 'Triángulo Frontal Der.', vertices: ['b3', 'r3', 'b2'], colorIndex: 3 },
    ],
    lines: [
      { id: 'mcu-m1', from: 'r0', to: 'r1', isMainRidge: true },
      { id: 'mcu-m2', from: 'r0', to: 'r2', isMainRidge: true },
      { id: 'mcu-m3', from: 'r1', to: 'r3', isMainRidge: true },
      { id: 'mcu-h1', from: 'b0', to: 'r0', isMainRidge: true },
      { id: 'mcu-h2', from: 'b1', to: 'r1', isMainRidge: true },
      { id: 'mcu-h3', from: 'b7', to: 'r2' },
      { id: 'mcu-h4', from: 'b6', to: 'r2' },
      { id: 'mcu-h5', from: 'b3', to: 'r3' },
      { id: 'mcu-h6', from: 'b2', to: 'r3' },
      { id: 'mcu-v1', from: 'b5', to: 'r0' },
      { id: 'mcu-v2', from: 'b4', to: 'r1' },
    ]
  },

  // 29. MN: Northwoods Lake Prow Chalet (Pointed Prow Front + Cross Wings)
  'mn-lake-prow': {
    id: 'mn-lake-prow',
    baseCoords: [
      [-0.92, 0.80],  // b0: Rear-Left Wing TL
      [0.92, 0.80],   // b1: Rear-Right Wing TR
      [0.92, -0.22],  // b2: Right Wing BR
      [0.54, -0.22],  // b3: Prow Right Shoulder
      [0, -0.96],     // b4: Pointed Prow Front Tip
      [-0.54, -0.22], // b5: Prow Left Shoulder
      [-0.92, -0.22], // b6: Left Wing BL
    ],
    ridgeCoords: [
      [-0.92, 0.28],  // r0: West Wing Gable End
      [0, 0.28],      // r1: Central Prow Hub Peak
      [0.92, 0.28],   // r2: East Wing Gable End
      [0, -0.96],     // r3: Prow Extended Peak Tip
    ],
    faces: [
      { id: 'mlp-n', nameEn: 'North Rear Wing Slope', nameEs: 'Faldón Trasero Norte', vertices: ['b0', 'b1', 'r2', 'r1', 'r0'], colorIndex: 0 },
      { id: 'mlp-sw', nameEn: 'West Wing Front Slope', nameEs: 'Ala Oeste Frontal', vertices: ['r0', 'r1', 'b5', 'b6'], colorIndex: 2 },
      { id: 'mlp-se', nameEn: 'East Wing Front Slope', nameEs: 'Ala Este Frontal', vertices: ['r1', 'r2', 'b2', 'b3'], colorIndex: 2 },
      { id: 'mlp-pw', nameEn: 'Lake Prow Left Diamond', nameEs: 'Diamante Prow Izquierdo', vertices: ['b5', 'r1', 'r3', 'b4'], colorIndex: 3 },
      { id: 'mlp-pe', nameEn: 'Lake Prow Right Diamond', nameEs: 'Diamante Prow Derecho', vertices: ['r1', 'b3', 'b4', 'r3'], colorIndex: 1 },
    ],
    lines: [
      { id: 'mlp-m1', from: 'r0', to: 'r1', isMainRidge: true },
      { id: 'mlp-m2', from: 'r1', to: 'r2', isMainRidge: true },
      { id: 'mlp-m3', from: 'r1', to: 'r3', isMainRidge: true },
      { id: 'mlp-v1', from: 'b5', to: 'r1' },
      { id: 'mlp-v2', from: 'b3', to: 'r1' },
    ]
  },

  // 30. Simple Gable (2 Slopes)
  'gable': {
    id: 'gable',
    baseCoords: [
      [-0.95, 0.72],  // b0: TL
      [0.95, 0.72],   // b1: TR
      [0.95, -0.72],  // b2: BR
      [-0.95, -0.72], // b3: BL
    ],
    ridgeCoords: [
      [-0.95, 0], // r0: Left Ridge
      [0.95, 0],  // r1: Right Ridge
    ],
    faces: [
      { id: 'gab-n', nameEn: 'North Slope', nameEs: 'Faldón Norte', vertices: ['b0', 'b1', 'r1', 'r0'], colorIndex: 0 },
      { id: 'gab-s', nameEn: 'South Slope', nameEs: 'Faldón Sur', vertices: ['r0', 'r1', 'b2', 'b3'], colorIndex: 2 },
    ],
    lines: [
      { id: 'gab-m', from: 'r0', to: 'r1', isMainRidge: true },
    ]
  },

  // Legacy fallback: Shed (1 Slope)
  'shed': {
    id: 'shed',
    baseCoords: [
      [-0.95, 0.72],
      [0.95, 0.72],
      [0.95, -0.72],
      [-0.95, -0.72],
    ],
    ridgeCoords: [
      [-0.95, 0.72],
      [0.95, 0.72],
    ],
    faces: [
      { id: 'shed-main', nameEn: 'Single Slope', nameEs: 'Faldón Único', vertices: ['b0', 'b1', 'b2', 'b3'], colorIndex: 0 },
    ],
    lines: [
      { id: 'shed-m', from: 'r0', to: 'r1', isMainRidge: true },
    ]
  }
}

/**
 * Rotate normalized coordinate [nx, ny] according to RidgeOrientation:
 * - 'horizontal' (0 deg): [nx, ny]
 * - 'vertical' (90 deg CW): [ny, -nx]
 * - 'horizontal-flip' (180 deg): [-nx, -ny]
 * - 'vertical-flip' (270 deg CW): [-ny, nx]
 */
export function rotateNormalizedCoord(
  coord: [number, number],
  orient: RidgeOrientation
): [number, number] {
  const [nx, ny] = coord
  switch (orient) {
    case 'vertical':
      return [ny, -nx]
    case 'horizontal-flip':
      return [-nx, -ny]
    case 'vertical-flip':
      return [-ny, nx]
    case 'horizontal':
    default:
      return [nx, ny]
  }
}

/**
 * Generate geographical LatLng coordinates for both basePolygon and ridgePoints
 * from a RoofShapeTemplate centered at (centerLat, centerLng) with half-extents (halfLat, halfLng).
 */
export function generateTemplateLatLngs(
  roofType: RoofType,
  orient: RidgeOrientation,
  centerLat: number,
  centerLng: number,
  halfLat: number,
  halfLng: number
): {
  basePolygon: google.maps.LatLngLiteral[]
  ridgePoints: google.maps.LatLngLiteral[]
} {
  const tpl = ROOF_SHAPE_TEMPLATES[roofType] || ROOF_SHAPE_TEMPLATES['hip']

  const basePolygon = tpl.baseCoords.map(c => {
    const [rx, ry] = rotateNormalizedCoord(c, orient)
    return {
      lat: centerLat + ry * halfLat,
      lng: centerLng + rx * halfLng
    }
  })

  const ridgePoints = tpl.ridgeCoords.map(c => {
    const [rx, ry] = rotateNormalizedCoord(c, orient)
    return {
      lat: centerLat + ry * halfLat,
      lng: centerLng + rx * halfLng
    }
  })

  return { basePolygon, ridgePoints }
}

/**
 * Resolve a vertex token ('b0', 'r1', etc.) to its current LatLngLiteral
 */
export function resolveVertexToken(
  token: string,
  basePolygon: google.maps.LatLngLiteral[],
  ridgePoints: google.maps.LatLngLiteral[]
): google.maps.LatLngLiteral | null {
  if (token.startsWith('b')) {
    const idx = parseInt(token.slice(1), 10)
    return basePolygon[idx] || null
  }
  if (token.startsWith('r')) {
    const idx = parseInt(token.slice(1), 10)
    return ridgePoints[idx] || null
  }
  return null
}
