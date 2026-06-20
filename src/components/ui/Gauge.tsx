import React from 'react'

// Gauge de arco — elemento de firma visual de la app (estética "dial de terminal").
// Se usa para la salud del portafolio y para puntuaciones individuales.
export default function Gauge({
  value,
  size = 160,
  strokeWidth = 14,
  label,
  sublabel,
  colorFor,
}: {
  value: number // 0-100
  size?: number
  strokeWidth?: number
  label?: string
  sublabel?: string
  colorFor?: (v: number) => string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = Math.PI * radius * 1.5 // arco de 270°
  const clamped = Math.max(0, Math.min(100, value))
  const offset = circumference * (1 - clamped / 100)
  const color = colorFor ? colorFor(clamped) : clamped >= 75 ? '#2FC3A0' : clamped >= 55 ? '#4E9FE0' : clamped >= 35 ? '#E0A23B' : '#E15F66'

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-[225deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-ink-100 dark:text-ink-700"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeLinecap="round"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl font-semibold tabular text-ink-900 dark:text-ink-50">{Math.round(clamped)}</span>
        {label && <span className="text-[11px] text-ink-400 mt-0.5 text-center px-4">{label}</span>}
        {sublabel && <span className="text-[10px] text-ink-300 mt-0.5">{sublabel}</span>}
      </div>
    </div>
  )
}
