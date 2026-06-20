import React from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useTheme } from '../../context/ThemeContext'
import { formatCOP } from '../../utils/format'

export interface SimSeriesPoint {
  año: number
  pesimista: number
  base: number
  optimista: number
  aportado: number
}

export default function SimulatorChart({ data, height = 320 }: { data: SimSeriesPoint[]; height?: number }) {
  const { theme } = useTheme()
  const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
  const textColor = theme === 'dark' ? '#BAC2C7' : '#445159'
  const tooltipBg = theme === 'dark' ? '#19222A' : '#FFFFFF'

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="gradOptimista" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2FC3A0" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#2FC3A0" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradBase" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4E9FE0" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#4E9FE0" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradPesimista" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E0A23B" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#E0A23B" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis dataKey="año" tick={{ fontSize: 11, fill: textColor }} unit=" años" />
        <YAxis tick={{ fontSize: 10, fill: textColor }} tickFormatter={(v) => `$${(v / 1_000_000).toFixed(0)}M`} width={56} />
        <Tooltip
          contentStyle={{ background: tooltipBg, border: 'none', borderRadius: 8, fontSize: 12 }}
          formatter={(value: number, name: string) => [formatCOP(value), name]}
          labelFormatter={(l) => `Año ${l}`}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area type="monotone" dataKey="optimista" name="Optimista" stroke="#1B8F76" fill="url(#gradOptimista)" strokeWidth={2} />
        <Area type="monotone" dataKey="base" name="Base" stroke="#4E9FE0" fill="url(#gradBase)" strokeWidth={2} />
        <Area type="monotone" dataKey="pesimista" name="Pesimista" stroke="#A9762A" fill="url(#gradPesimista)" strokeWidth={2} />
        <Area type="monotone" dataKey="aportado" name="Total aportado" stroke="#8D98A0" fill="none" strokeWidth={1.5} strokeDasharray="4 3" />
      </AreaChart>
    </ResponsiveContainer>
  )
}
