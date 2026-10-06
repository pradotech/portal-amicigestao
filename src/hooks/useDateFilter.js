import { useState, useMemo, useCallback } from 'react'
import { isDateInRange, normalizeDate, MONTH_NAMES, formatDate } from '../utils/formatters'

export function useDateFilter(initialPreset = 'this_month') {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1 // 1 a 12
  const todayStr = now.toISOString().split('T')[0]

  // Datas padrão do mês atual
  const lastDayThisMonth = new Date(currentYear, currentMonth, 0).getDate()
  const initialStartDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`
  const initialEndDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(lastDayThisMonth).padStart(2, '0')}`

  const [startDate, setStartDate] = useState(initialStartDate)
  const [endDate, setEndDate] = useState(initialEndDate)
  const [activePreset, setActivePreset] = useState(initialPreset)

  // Mês e Ano de referência derivados da data de início
  const selectedYear = useMemo(() => {
    try {
      return parseInt(startDate.split('-')[0], 10) || currentYear
    } catch {
      return currentYear
    }
  }, [startDate, currentYear])

  const selectedMonth = useMemo(() => {
    try {
      return parseInt(startDate.split('-')[1], 10) || currentMonth
    } catch {
      return currentMonth
    }
  }, [startDate, currentMonth])

  // Contagem de dias no intervalo selecionado
  const diffDays = useMemo(() => {
    if (!startDate || !endDate) return 1
    try {
      const s = new Date(startDate)
      const e = new Date(endDate)
      const diff = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1
      return Math.max(1, diff)
    } catch {
      return 1
    }
  }, [startDate, endDate])

  // Aplicação de Presets de Período Rápidos
  const handleApplyPreset = useCallback((preset) => {
    setActivePreset(preset)
    const d = new Date()
    const y = d.getFullYear()
    const m = d.getMonth() + 1
    const today = d.toISOString().split('T')[0]

    if (preset === 'today') {
      setStartDate(today)
      setEndDate(today)
    } else if (preset === 'this_month') {
      const lastDay = new Date(y, m, 0).getDate()
      setStartDate(`${y}-${String(m).padStart(2, '0')}-01`)
      setEndDate(`${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`)
    } else if (preset === 'last_month') {
      const prevM = m === 1 ? 12 : m - 1
      const prevY = m === 1 ? y - 1 : y
      const lastDay = new Date(prevY, prevM, 0).getDate()
      setStartDate(`${prevY}-${String(prevM).padStart(2, '0')}-01`)
      setEndDate(`${prevY}-${String(prevM).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`)
    } else if (preset === '30days') {
      const past30 = new Date(d.getTime() - 30 * 86400000).toISOString().split('T')[0]
      setStartDate(past30)
      setEndDate(today)
    } else if (preset === '90days') {
      const past90 = new Date(d.getTime() - 90 * 86400000).toISOString().split('T')[0]
      setStartDate(past90)
      setEndDate(today)
    } else if (preset === 'this_year') {
      setStartDate(`${y}-01-01`)
      setEndDate(`${y}-12-31`)
    } else if (preset === 'all_time') {
      setStartDate('2024-01-01')
      setEndDate('2027-12-31')
    }
  }, [])

  // Navegação para o Mês Anterior
  const handlePrevMonth = useCallback(() => {
    let y = selectedYear
    let m = selectedMonth - 1
    if (m < 1) {
      m = 12
      y -= 1
    }
    const lastDay = new Date(y, m, 0).getDate()
    setStartDate(`${y}-${String(m).padStart(2, '0')}-01`)
    setEndDate(`${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`)
    setActivePreset('custom')
  }, [selectedYear, selectedMonth])

  // Navegação para o Próximo Mês
  const handleNextMonth = useCallback(() => {
    let y = selectedYear
    let m = selectedMonth + 1
    if (m > 12) {
      m = 1
      y += 1
    }
    const lastDay = new Date(y, m, 0).getDate()
    setStartDate(`${y}-${String(m).padStart(2, '0')}-01`)
    setEndDate(`${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`)
    setActivePreset('custom')
  }, [selectedYear, selectedMonth])

  // Selecionar Mês Específico diretamente
  const setSelectedMonthDirect = useCallback((m, y = selectedYear) => {
    const lastDay = new Date(y, m, 0).getDate()
    setStartDate(`${y}-${String(m).padStart(2, '0')}-01`)
    setEndDate(`${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`)
    setActivePreset('custom')
  }, [selectedYear])

  // Helper para filtrar listas de itens pelo intervalo [startDate, endDate]
  const filterByDate = useCallback((items = [], dateField = 'dueDate') => {
    return items.filter(item => {
      const val = item[dateField] || item.due_date || item.date || item.issueDate || item.vencimento
      return isDateInRange(val, startDate, endDate)
    })
  }, [startDate, endDate])

  // Rótulo textual amigável do período
  const periodLabel = useMemo(() => {
    if (!startDate || !endDate) return 'Período Completo'
    
    // Se for exatamente o mês inteiro (ex: 2026-10-01 a 2026-10-31)
    const [sY, sM, sD] = startDate.split('-').map(Number)
    const [eY, eM, eD] = endDate.split('-').map(Number)

    if (sY === eY && sM === eM && sD === 1) {
      const lastDay = new Date(sY, sM, 0).getDate()
      if (eD === lastDay) {
        return `${MONTH_NAMES[sM - 1]} de ${sY}`
      }
    }

    if (startDate === endDate) {
      return `${formatDate(startDate)}`
    }

    return `${formatDate(startDate)} até ${formatDate(endDate)}`
  }, [startDate, endDate])

  return {
    startDate,
    setStartDate: (d) => {
      setStartDate(d)
      setActivePreset('custom')
    },
    endDate,
    setEndDate: (d) => {
      setEndDate(d)
      setActivePreset('custom')
    },
    selectedYear,
    setSelectedYear: (y) => {
      const lastDay = new Date(y, selectedMonth, 0).getDate()
      setStartDate(`${y}-${String(selectedMonth).padStart(2, '0')}-01`)
      setEndDate(`${y}-${String(selectedMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`)
      setActivePreset('custom')
    },
    selectedMonth,
    setSelectedMonth: (m) => setSelectedMonthDirect(m),
    activePreset,
    diffDays,
    periodLabel,
    handleApplyPreset,
    handlePrevMonth,
    handleNextMonth,
    filterByDate,
    // Compatibilidade com componentes legados
    viewMode: 'custom',
    setViewMode: () => {}
  }
}
