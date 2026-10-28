"use client"

import React from 'react'
import { ROOF_SHAPE_TEMPLATES, RoofType } from '@/lib/roofShapes'

interface RoofShapeIconProps {
  shapeId: RoofType
  selected?: boolean
  className?: string
}

const UNSELECTED_FILLS = [
  '#dbeafe', // blue-100
  '#bfdbfe', // blue-200
  '#93c5fd', // blue-300
  '#60a5fa', // blue-400 (triangles/cumbreras stand out)
  '#bae6fd', // sky-200
]

const SELECTED_FILLS = [
  'rgba(255,255,255,0.22)',
  'rgba(255,255,255,0.34)',
  'rgba(255,255,255,0.16)',
  'rgba(255,255,255,0.48)',
  'rgba(255,255,255,0.28)',
]

export default function RoofShapeIcon({ shapeId, selected = false, className = 'w-11 h-9' }: RoofShapeIconProps) {
  const tpl = ROOF_SHAPE_TEMPLATES[shapeId]

  if (!tpl) {
    return (
      <svg viewBox="-1.1 -1.0 2.2 2.0" className={className}>
        <polygon
          points="-0.85,-0.7 0.85,-0.7 0.85,0.7 -0.85,0.7"
          fill={selected ? 'rgba(255,255,255,0.25)' : '#dbeafe'}
          stroke={selected ? '#ffffff' : '#2563eb'}
          strokeWidth="0.09"
        />
      </svg>
    )
  }

  const getCoord = (token: string): [number, number] => {
    if (token.startsWith('b')) {
      const idx = parseInt(token.slice(1), 10)
      const c = tpl.baseCoords[idx] || [0, 0]
      return [c[0], -c[1]]
    }
    if (token.startsWith('r')) {
      const idx = parseInt(token.slice(1), 10)
      const c = tpl.ridgeCoords[idx] || [0, 0]
      return [c[0], -c[1]]
    }
    return [0, 0]
  }

  const fills = selected ? SELECTED_FILLS : UNSELECTED_FILLS
  const strokeColor = selected ? '#ffffff' : '#1d4ed8'
  const ridgeColor = selected ? '#ffffff' : '#1e3a8a'

  return (
    <svg
      viewBox="-1.12 -0.98 2.24 1.96"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      {/* Sloped Facets & Triangles (Cumbreras) */}
      {tpl.faces.map((face) => {
        const pts = face.vertices
          .map(v => {
            const [x, y] = getCoord(v)
            return `${x.toFixed(3)},${y.toFixed(3)}`
          })
          .join(' ')
        return (
          <polygon
            key={face.id}
            points={pts}
            fill={fills[face.colorIndex % fills.length]}
            stroke={strokeColor}
            strokeWidth="0.055"
            strokeLinejoin="round"
          />
        )
      })}

      {/* Outer Perimeter Outline */}
      <polygon
        points={tpl.baseCoords.map(([x, y]) => `${x.toFixed(3)},${(-y).toFixed(3)}`).join(' ')}
        fill="none"
        stroke={strokeColor}
        strokeWidth="0.075"
        strokeLinejoin="round"
      />

      {/* Ridge & Hip Triangle Lines */}
      {tpl.lines.map((line) => {
        const [x1, y1] = getCoord(line.from)
        const [x2, y2] = getCoord(line.to)
        return (
          <line
            key={line.id}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={ridgeColor}
            strokeWidth={line.isMainRidge ? '0.095' : '0.06'}
            strokeLinecap="round"
          />
        )
      })}

      {/* Cumbrera / Ridge Apex Dots */}
      {tpl.ridgeCoords.map(([rx, ry], idx) => (
        <circle
          key={`r-dot-${idx}`}
          cx={rx}
          cy={-ry}
          r="0.085"
          fill={selected ? '#ffffff' : '#2563eb'}
        />
      ))}
    </svg>
  )
}

