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
    <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4 backdrop-blur-sm">
      
      {/* Linha Superior: Abas de Modo (Por Mês | Por Dia | Personalizado) + Controles */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Abas de Modo de Visualização (Segmented Control) */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60 w-fit shadow-inner">
          <button
            type="button"
            onClick={() => onViewModeChange('month')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              viewMode === 'month'
                ? 'bg-gradient-to-r from-sky-600 to-cyan-600 text-white shadow-md font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700/60'
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
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700/60'
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
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700/60'
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
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200 dark:border-slate-700/60">
              <button
                type="button"
                onClick={onPrevMonth}
                title="Mês Anterior"
                className="p-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95 shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Seletor de Mês */}
              <select
                value={selectedMonth}
                onChange={(e) => onMonthChange(parseInt(e.target.value, 10))}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-sky-800 dark:text-cyan-300 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer shadow-sm"
              >
                {MONTH_NAMES.map((m, idx) => (
                  <option key={m} value={idx + 1} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    {m}
                  </option>
                ))}
              </select>

              {/* Seletor de Ano */}
              <select
                value={selectedYear}
                onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
                className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer shadow-sm"
              >
                {years.map(y => (
                  <option key={y} value={y} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    {y}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={onNextMonth}
                title="Próximo Mês"
                className="p-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95 shadow-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onApplyPreset('this_month')}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-cyan-500/50 text-[11px] font-bold text-sky-800 dark:text-cyan-300 hover:text-sky-950 dark:hover:text-cyan-200 transition-all shadow-sm ml-1"
              >
                Mês Atual
              </button>
            </div>
          )}

          {/* 2. MODO: POR DIA */}
          {viewMode === 'day' && (
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200 dark:border-slate-700/60">
              <button
                type="button"
                onClick={onPrevDay}
                title="Dia Anterior"
                className="p-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95 shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <input
                  type="date"
                  value={selectedDay}
                  onChange={(e) => onDayChange(e.target.value)}
                  className="bg-transparent text-xs font-mono font-bold text-sky-800 dark:text-cyan-300 focus:outline-none cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
                />
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-sans hidden sm:inline">
                  ({formatDayDisplay(selectedDay)})
                </span>
              </div>

              <button
                type="button"
                onClick={onNextDay}
                title="Próximo Dia"
                className="p-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95 shadow-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onApplyPreset('today')}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-cyan-500/50 text-[11px] font-bold text-sky-800 dark:text-cyan-300 hover:text-sky-950 dark:hover:text-cyan-200 transition-all shadow-sm ml-1"
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
                      ? 'bg-sky-100 dark:bg-cyan-950/60 text-sky-900 dark:text-cyan-300 border border-sky-300 dark:border-cyan-700/60 font-bold'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  {p.label}
                </button>
              ))}

              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-inner">
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">DE:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => onStartDateChange(e.target.value)}
                  className="bg-transparent text-xs font-mono font-bold text-slate-900 dark:text-slate-200 focus:outline-none cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
                />
                <span className="text-slate-400 dark:text-slate-500 font-bold">•</span>
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">ATÉ:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => onEndDateChange(e.target.value)}
                  className="bg-transparent text-xs font-mono font-bold text-slate-900 dark:text-slate-200 focus:outline-none cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Linha Inferior: Feedback em Tempo Real de Filtro Ativo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600 dark:text-slate-400 pt-3 border-t border-slate-200 dark:border-slate-800/80 font-mono gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
          <span>
            Período:{' '}
            <strong className="text-slate-900 dark:text-slate-100 font-sans font-bold">
              {viewMode === 'month' && `${MONTH_NAMES[selectedMonth - 1]} de ${selectedYear}`}
              {viewMode === 'day' && `${formatDate(selectedDay)} (${formatDayDisplay(selectedDay)})`}
              {viewMode === 'custom' && `${formatDate(startDate)} até ${formatDate(endDate)} (${diffDays} dias)`}
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-[11px]">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-semibold shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {totalReceivablesCount} rec. ({formatCurrency(totalReceivablesAmount)})
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 font-semibold shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            {totalPayablesCount} pag. ({formatCurrency(totalPayablesAmount)})
          </span>
        </div>
      </div>

    </div>
  )
}
