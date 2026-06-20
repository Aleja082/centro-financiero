import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import type { GrupoDistribucion } from '../../utils/portfolioMath'
import { colorParaIndice } from '../../utils/portfolioMath'
import { formatCOP } from '../../utils/format'
import { useTheme } from '../../context/ThemeContext'

export default function AllocationDonut({ data, height = 260 }: { data: GrupoDistribucion[]; height?: number }) {
  const { theme } = useTheme()
  const tooltipBg = theme === 'dark' ? '#19222A' : '#FFFFFF'
  const tooltipText = theme === 'dark' ? '#E6EAEC' : '#10151B'

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey="valor" nameKey="etiqueta" innerRadius="58%" outerRadius="85%" paddingAngle={2} strokeWidth={0}>
          {data.map((_, i) => (
            <Cell key={i} fill={colorParaIndice(i)} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ background: tooltipBg, border: 'none', borderRadius: 8, fontSize: 12 }}
          itemStyle={{ color: tooltipText }}
          labelStyle={{ color: tooltipText }}
          formatter={(value: number, name: string) => [formatCOP(value), name]}
        />
        <Legend
          verticalAlign="bottom"
          height={56}
          iconType="circle"
          iconSize={8}
          formatter={(value: string) => <span style={{ fontSize: 11, color: theme === 'dark' ? '#BAC2C7' : '#445159' }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
