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
    <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
      
      {/* Linha Superior: Abas de Modo (Por Mês | Por Dia | Personalizado) + Controles */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Abas de Modo de Visualização */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800 w-fit">
          <button
            type="button"
            onClick={() => onViewModeChange('month')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              viewMode === 'month'
                ? 'bg-gradient-to-r from-sky-600 to-cyan-600 text-white shadow-md shadow-cyan-950/40'
                : 'text-slate-400 hover:text-slate-200'
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
                ? 'bg-gradient-to-r from-sky-600 to-cyan-600 text-white shadow-md shadow-cyan-950/40'
                : 'text-slate-400 hover:text-slate-200'
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
                ? 'bg-gradient-to-r from-sky-600 to-cyan-600 text-white shadow-md shadow-cyan-950/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Personalizado</span>
          </button>
        </div>

        {/* Controles Específicos para cada Modo */}
        <div className="flex flex-wrap items-center gap-3">

          {/* 1. MODO: POR MÊS */}
          {viewMode === 'month' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onPrevMonth}
                title="Mês Anterior"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Seletor de Mês */}
              <select
                value={selectedMonth}
                onChange={(e) => onMonthChange(parseInt(e.target.value, 10))}
                className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
              >
                {MONTH_NAMES.map((m, idx) => (
                  <option key={m} value={idx + 1} className="bg-slate-900 text-white">
                    {m}
                  </option>
                ))}
              </select>

              {/* Seletor de Ano */}
              <select
                value={selectedYear}
                onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
                className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
              >
                {years.map(y => (
                  <option key={y} value={y} className="bg-slate-900 text-white">
                    {y}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={onNextMonth}
                title="Próximo Mês"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all active:scale-95"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onApplyPreset('this_month')}
                className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-[11px] font-semibold text-slate-300 hover:text-cyan-300 transition-all ml-1"
              >
                Mês Atual
              </button>
            </div>
          )}

          {/* 2. MODO: POR DIA */}
          {viewMode === 'day' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onPrevDay}
                title="Dia Anterior"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-700">
                <input
                  type="date"
                  value={selectedDay}
                  onChange={(e) => onDayChange(e.target.value)}
                  className="bg-transparent text-xs font-mono font-bold text-cyan-300 focus:outline-none cursor-pointer"
                />
                <span className="text-[11px] text-slate-400 font-sans hidden sm:inline">
                  ({formatDayDisplay(selectedDay)})
                </span>
              </div>

              <button
                type="button"
                onClick={onNextDay}
                title="Próximo Dia"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all active:scale-95"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onApplyPreset('today')}
                className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-[11px] font-semibold text-slate-300 hover:text-cyan-300 transition-all ml-1"
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
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all ${
                    activePreset === p.id
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60'
                  }`}
                >
                  {p.label}
                </button>
              ))}

              <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
                <span className="text-[10px] font-semibold text-slate-500">DE:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => onStartDateChange(e.target.value)}
                  className="bg-transparent text-[11px] font-mono text-slate-200 focus:outline-none cursor-pointer"
                />
                <span className="text-slate-600">•</span>
                <span className="text-[10px] font-semibold text-slate-500">ATÉ:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => onEndDateChange(e.target.value)}
                  className="bg-transparent text-[11px] font-mono text-slate-200 focus:outline-none cursor-pointer"
                />
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Linha Inferior: Feedback em Tempo Real de Filtro Ativo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 pt-2.5 border-t border-slate-800/80 font-mono gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>
            Período:{' '}
            <strong className="text-white font-sans font-bold">
              {viewMode === 'month' && `${MONTH_NAMES[selectedMonth - 1]} de ${selectedYear}`}
              {viewMode === 'day' && `${formatDate(selectedDay)} (${formatDayDisplay(selectedDay)})`}
              {viewMode === 'custom' && `${formatDate(startDate)} até ${formatDate(endDate)} (${diffDays} dias)`}
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <span className="text-emerald-400 font-semibold">
            {totalReceivablesCount} {totalReceivablesCount === 1 ? 'recebimento' : 'recebimentos'} ({formatCurrency(totalReceivablesAmount)})
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-amber-400 font-semibold">
            {totalPayablesCount} {totalPayablesCount === 1 ? 'pagamento' : 'pagamentos'} ({formatCurrency(totalPayablesAmount)})
          </span>
        </div>
      </div>

    </div>
  )
}
