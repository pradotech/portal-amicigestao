import React from 'react'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  RotateCcw,
  Sparkles
} from 'lucide-react'
import { MONTH_NAMES, formatCurrency, formatDate } from '../utils/formatters'

export function DateFilterBar({
  viewMode = 'month', // 'month' | 'day' | 'custom'
  onViewModeChange,
  selectedYear,
  selectedMonth,
  onMonthChange,
  onYearChange,
  onPrevMonth,
  onNextMonth,
  selectedDay,
  onDayChange,
  onPrevDay,
  onNextDay,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onApplyPreset,
  activePreset,
  totalReceivablesCount = 0,
  totalReceivablesAmount = 0,
  totalPayablesCount = 0,
  totalPayablesAmount = 0,
  diffDays = 30
}) {
  const years = [2024, 2025, 2026, 2027]

  // Formata o dia para exibição amigável
  const formatDayDisplay = (dateStr) => {
    if (!dateStr) return ''
    try {
      const [y, m, d] = dateStr.split('-')
      const dateObj = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10))
      const weekDays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
      return `${d}/${m}/${y} • ${weekDays[dateObj.getDay()]}`
    } catch {
      return dateStr
    }
  }

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
      
      {/* Linha Superior: Abas de Modo (Por Mês | Por Dia | Personalizado) + Controles */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Abas de Modo de Visualização (Segmented Control) */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200 w-fit shadow-inner">
          <button
            type="button"
            onClick={() => onViewModeChange('month')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              viewMode === 'month'
                ? 'bg-gradient-to-r from-sky-600 to-cyan-600 text-white shadow-md font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Por Mês</span>
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange('day')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              viewMode === 'day'
                ? 'bg-gradient-to-r from-sky-600 to-cyan-600 text-white shadow-md font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Por Dia</span>
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange('custom')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              viewMode === 'custom'
                ? 'bg-gradient-to-r from-sky-600 to-cyan-600 text-white shadow-md font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Personalizado</span>
          </button>
        </div>

        {/* Controles Específicos para cada Modo */}
        <div className="flex flex-wrap items-center gap-2.5">

          {/* 1. MODO: POR MÊS */}
          {viewMode === 'month' && (
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={onPrevMonth}
                title="Mês Anterior"
                className="p-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 transition-all active:scale-95 shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Seletor de Mês */}
              <select
                value={selectedMonth}
                onChange={(e) => onMonthChange(parseInt(e.target.value, 10))}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-sky-800 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer shadow-sm"
              >
                {MONTH_NAMES.map((m, idx) => (
                  <option key={m} value={idx + 1} className="bg-white text-slate-900">
                    {m}
                  </option>
                ))}
              </select>

              {/* Seletor de Ano */}
              <select
                value={selectedYear}
                onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer shadow-sm"
              >
                {years.map(y => (
                  <option key={y} value={y} className="bg-white text-slate-900">
                    {y}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={onNextMonth}
                title="Próximo Mês"
                className="p-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 transition-all active:scale-95 shadow-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onApplyPreset('this_month')}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-[11px] font-bold text-sky-800 hover:text-sky-950 transition-all shadow-sm ml-1"
              >
                Mês Atual
              </button>
            </div>
          )}

          {/* 2. MODO: POR DIA */}
          {viewMode === 'day' && (
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={onPrevDay}
                title="Dia Anterior"
                className="p-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 transition-all active:scale-95 shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                <input
                  type="date"
                  value={selectedDay}
                  onChange={(e) => onDayChange(e.target.value)}
                  className="bg-transparent text-xs font-mono font-bold text-sky-800 focus:outline-none cursor-pointer"
                />
                <span className="text-[11px] text-slate-500 font-sans hidden sm:inline">
                  ({formatDayDisplay(selectedDay)})
                </span>
              </div>

              <button
                type="button"
                onClick={onNextDay}
                title="Próximo Dia"
                className="p-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 transition-all active:scale-95 shadow-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onApplyPreset('today')}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-[11px] font-bold text-sky-800 hover:text-sky-950 transition-all shadow-sm ml-1"
              >
                Hoje
              </button>
            </div>
          )}

          {/* 3. MODO: PERSONALIZADO (INTERVALO DE / ATÉ) */}
          {viewMode === 'custom' && (
            <div className="flex flex-wrap items-center gap-2">
              {/* Presets Rápidos */}
              {[
                { id: 'today', label: 'Hoje' },
                { id: '7days', label: '7 Dias' },
                { id: 'this_month', label: 'Este Mês' },
                { id: 'last_month', label: 'Mês Anterior' },
                { id: '90days', label: '90 Dias' },
                { id: 'year_2026', label: 'Ano 2026' }
              ].map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onApplyPreset(p.id)}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all shadow-sm ${
                    activePreset === p.id
                      ? 'bg-sky-100 text-sky-900 border border-sky-300 font-bold'
                      : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}

              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 shadow-inner">
                <span className="text-[10px] font-bold text-slate-600">DE:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => onStartDateChange(e.target.value)}
                  className="bg-transparent text-xs font-mono font-bold text-slate-900 focus:outline-none cursor-pointer"
                />
                <span className="text-slate-400 font-bold">•</span>
                <span className="text-[10px] font-bold text-slate-600">ATÉ:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => onEndDateChange(e.target.value)}
                  className="bg-transparent text-xs font-mono font-bold text-slate-900 focus:outline-none cursor-pointer"
                />
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Linha Inferior: Feedback em Tempo Real de Filtro Ativo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600 pt-3 border-t border-slate-200 font-mono gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
          <span>
            Período:{' '}
            <strong className="text-slate-900 font-sans font-bold">
              {viewMode === 'month' && `${MONTH_NAMES[selectedMonth - 1]} de ${selectedYear}`}
              {viewMode === 'day' && `${formatDate(selectedDay)} (${formatDayDisplay(selectedDay)})`}
              {viewMode === 'custom' && `${formatDate(startDate)} até ${formatDate(endDate)} (${diffDays} dias)`}
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-[11px]">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {totalReceivablesCount} rec. ({formatCurrency(totalReceivablesAmount)})
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 font-semibold shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            {totalPayablesCount} pag. ({formatCurrency(totalPayablesAmount)})
          </span>
        </div>
      </div>

    </div>
  )
}
