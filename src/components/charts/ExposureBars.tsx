import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useTheme } from '../../context/ThemeContext'

const levelColor: Record<string, string> = {
  excelente: '#2FC3A0',
  aceptable: '#4E9FE0',
  revisar: '#E0A23B',
  critico: '#E15F66',
}

export default function ExposureBars({
  data,
  height = 220,
}: {
  data: { etiqueta: string; porcentaje: number; nivel: string }[]
  height?: number
}) {
  const { theme } = useTheme()
  const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
  const textColor = theme === 'dark' ? '#BAC2C7' : '#445159'
  const tooltipBg = theme === 'dark' ? '#19222A' : '#FFFFFF'

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
        <XAxis type="number" domain={[0, 60]} tick={{ fontSize: 11, fill: textColor }} unit="%" />
        <YAxis type="category" dataKey="etiqueta" width={150} tick={{ fontSize: 11, fill: textColor }} />
        <Tooltip
          contentStyle={{ background: tooltipBg, border: 'none', borderRadius: 8, fontSize: 12 }}
          formatter={(value: number) => [`${value}%`, 'Exposición']}
        />
        <Bar dataKey="porcentaje" radius={[0, 4, 4, 0]} barSize={16}>
          {data.map((d, i) => (
            <Cell key={i} fill={levelColor[d.nivel] ?? '#4E9FE0'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
