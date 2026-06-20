import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useTheme } from '../../context/ThemeContext'

export default function ComparisonBars({
  data,
  height = 280,
}: {
  data: { etiqueta: string; actual: number; objetivo: number }[]
  height?: number
}) {
  const { theme } = useTheme()
  const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
  const textColor = theme === 'dark' ? '#BAC2C7' : '#445159'
  const tooltipBg = theme === 'dark' ? '#19222A' : '#FFFFFF'

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ left: 0, right: 12, top: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis dataKey="etiqueta" tick={{ fontSize: 10, fill: textColor }} interval={0} angle={-15} textAnchor="end" height={60} />
        <YAxis tick={{ fontSize: 11, fill: textColor }} unit="%" />
        <Tooltip contentStyle={{ background: tooltipBg, border: 'none', borderRadius: 8, fontSize: 12 }} formatter={(v: number) => `${v}%`} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="actual" name="Actual" fill="#4E9FE0" radius={[3, 3, 0, 0]} />
        <Bar dataKey="objetivo" name="Objetivo" fill="#2FC3A0" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
