import { useState, useMemo } from 'react'
import { isDateInRange, normalizeDate, MONTH_NAMES, formatDate, formatMonthYear } from '../utils/formatters'

export function useDateFilter(initialPreset = 'this_month') {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1 // 1 a 12
  const todayStr = now.toISOString().split('T')[0]

  const [viewMode, setViewMode] = useState('month') // 'month' | 'day' | 'custom'
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [selectedDay, setSelectedDay] = useState(todayStr)
  const [activePreset, setActivePreset] = useState(initialPreset)

  const [customStartDate, setCustomStartDate] = useState(() => {
    const lastDay = new Date(currentYear, currentMonth, 0).getDate()
    return `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`
  })

  const [customEndDate, setCustomEndDate] = useState(() => {
    const lastDay = new Date(currentYear, currentMonth, 0).getDate()
    return `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  })

  // Calcula o startDate e endDate efetivos com base no viewMode
  const { startDate, endDate, diffDays, isSingleDay } = useMemo(() => {
    let sDate = ''
    let eDate = ''

    if (viewMode === 'month') {
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate()
      const mStr = String(selectedMonth).padStart(2, '0')
      sDate = `${selectedYear}-${mStr}-01`
      eDate = `${selectedYear}-${mStr}-${String(lastDay).padStart(2, '0')}`
    } else if (viewMode === 'day') {
      sDate = selectedDay
      eDate = selectedDay
    } else {
      sDate = customStartDate
      eDate = customEndDate
    }

    const sObj = new Date(sDate)
    const eObj = new Date(eDate)
    const days = Math.max(1, Math.round((eObj - sObj) / (1000 * 60 * 60 * 24)) + 1)

    return {
      startDate: sDate,
      endDate: eDate,
      diffDays: days,
      isSingleDay: sDate === eDate || days === 1
    }
  }, [viewMode, selectedYear, selectedMonth, selectedDay, customStartDate, customEndDate])

  // Navegação de Mês
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12)
      setSelectedYear(y => y - 1)
    } else {
      setSelectedMonth(m => m - 1)
    }
    setViewMode('month')
  }

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1)
      setSelectedYear(y => y + 1)
    } else {
      setSelectedMonth(m => m + 1)
    }
    setViewMode('month')
  }

  // Navegação de Dia
  const handlePrevDay = () => {
    try {
      const [y, m, d] = selectedDay.split('-').map(Number)
      const prevDate = new Date(y, m - 1, d - 1)
      setSelectedDay(prevDate.toISOString().split('T')[0])
      setViewMode('day')
    } catch {
      // fallback
    }
  }

  const handleNextDay = () => {
    try {
      const [y, m, d] = selectedDay.split('-').map(Number)
      const nextDate = new Date(y, m - 1, d + 1)
      setSelectedDay(nextDate.toISOString().split('T')[0])
      setViewMode('day')
    } catch {
      // fallback
    }
  }

  // Presets Rápidos
  const handleApplyPreset = (preset) => {
    setActivePreset(preset)
    const d = new Date()
    const y = d.getFullYear()
    const m = d.getMonth() + 1
    const today = d.toISOString().split('T')[0]

    if (preset === 'today') {
      setViewMode('day')
      setSelectedDay(today)
    } else if (preset === '7days') {
      setViewMode('custom')
      const past7 = new Date(d.getTime() - 7 * 86400000).toISOString().split('T')[0]
      setCustomStartDate(past7)
      setCustomEndDate(today)
    } else if (preset === 'this_month') {
      setViewMode('month')
      setSelectedYear(y)
      setSelectedMonth(m)
    } else if (preset === 'last_month') {
      setViewMode('month')
      if (m === 1) {
        setSelectedMonth(12)
        setSelectedYear(y - 1)
      } else {
        setSelectedMonth(m - 1)
        setSelectedYear(y)
      }
    } else if (preset === '90days') {
      setViewMode('custom')
      const past90 = new Date(d.getTime() - 90 * 86400000).toISOString().split('T')[0]
      setCustomStartDate(past90)
      setCustomEndDate(today)
    } else if (preset === 'year_2026') {
      setViewMode('custom')
      setCustomStartDate('2026-01-01')
      setCustomEndDate('2026-12-31')
    }
  }

  // Helper para filtrar listas por dueDate
  const filterByDate = (items = [], dateField = 'dueDate') => {
    return items.filter(item => {
      const val = item[dateField] || item.due_date || item.date || item.vencimento
      return isDateInRange(val, startDate, endDate)
    })
  }

  // Descrição do Período
  const periodLabel = useMemo(() => {
    if (viewMode === 'month') {
      return `${MONTH_NAMES[selectedMonth - 1]} de ${selectedYear}`
    }
    if (viewMode === 'day') {
      return `${formatDate(selectedDay)}`
    }
    return `${formatDate(startDate)} até ${formatDate(endDate)}`
  }, [viewMode, selectedMonth, selectedYear, selectedDay, startDate, endDate])

  return {
    viewMode,
    setViewMode,
    selectedYear,
    setSelectedYear,
    selectedMonth,
    setSelectedMonth,
    selectedDay,
    setSelectedDay,
    startDate,
    endDate,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    activePreset,
    diffDays,
    isSingleDay,
    periodLabel,
    handlePrevMonth,
    handleNextMonth,
    handlePrevDay,
    handleNextDay,
    handleApplyPreset,
    filterByDate
  }
}
