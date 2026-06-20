import type { SubScore } from '../types/portfolio'

export function healthScore(subScores: SubScore[]): number {
  const totalPeso = subScores.reduce((acc, s) => acc + s.peso, 0) || 1
  const weighted = subScores.reduce((acc, s) => acc + s.valor * s.peso, 0)
  return Math.round(weighted / totalPeso)
}

export function healthLabel(score: number): { label: string; level: 'excelente' | 'aceptable' | 'revisar' | 'critico' } {
  if (score >= 75) return { label: 'Excelente', level: 'excelente' }
  if (score >= 55) return { label: 'Aceptable', level: 'aceptable' }
  if (score >= 35) return { label: 'Necesita atención', level: 'revisar' }
  return { label: 'Crítico', level: 'critico' }
}

export interface SimInputs {
  aporteMensual: number
  incrementoAnual: number
  inflacionAnual: number
  tasaAnual: number
  valorInicial: number
  años: number
}

export interface SimPoint {
  año: number
  nominal: number
  real: number
  aportado: number
}

// Simulación mes a mes: el aporte mensual crece `incrementoAnual` cada 12 meses,
// el saldo se capitaliza con la tasa anual convertida a mensual equivalente.
export function simulate(inputs: SimInputs): SimPoint[] {
  const { aporteMensual, incrementoAnual, inflacionAnual, tasaAnual, valorInicial, años } = inputs
  const tasaMensual = Math.pow(1 + tasaAnual, 1 / 12) - 1
  const inflacionMensual = Math.pow(1 + inflacionAnual, 1 / 12) - 1

  let saldo = valorInicial
  let aporteActual = aporteMensual
  let totalAportado = valorInicial
  let factorInflacion = 1

  const puntos: SimPoint[] = [{ año: 0, nominal: saldo, real: saldo, aportado: totalAportado }]

  const totalMeses = años * 12
  for (let mes = 1; mes <= totalMeses; mes++) {
    saldo = saldo * (1 + tasaMensual) + aporteActual
    totalAportado += aporteActual
    factorInflacion *= 1 + inflacionMensual

    if (mes % 12 === 0) {
      aporteActual *= 1 + incrementoAnual
      puntos.push({
        año: mes / 12,
        nominal: Math.round(saldo),
        real: Math.round(saldo / factorInflacion),
        aportado: Math.round(totalAportado),
      })
    }
  }

  return puntos
}

export function calcularPlanPersonalizado(monto: number, porcentajes: { id: string; nombre: string; porcentaje: number }[]) {
  return porcentajes.map((p) => ({
    ...p,
    valorExacto: Math.round((monto * p.porcentaje) / 100),
  }))
}
