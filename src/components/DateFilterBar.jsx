import React from 'react'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  RotateCcw,
  Sparkles,
  CalendarDays,
  ArrowRight,
  Filter
} from 'lucide-react'
import { MONTH_NAMES, formatCurrency, formatDate } from '../utils/formatters'

export function DateFilterBar({
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  onStartDateChange,
  onEndDateChange,
  activePreset,
  handleApplyPreset,
  onApplyPreset,
  handlePrevMonth,
  handleNextMonth,
  onPrevMonth,
  onNextMonth,
  periodLabel,
  filteredCount = 0,
  totalCount = 0,
  receivablesTotal = 0,
  payablesTotal = 0,
  showAmounts = true
}) {
  // Unifica props para compatibilidade total
  const applyPreset = handleApplyPreset || onApplyPreset
  const prevMonth = handlePrevMonth || onPrevMonth
  const nextMonth = handleNextMonth || onNextMonth
  const updateStartDate = (d) => {
    if (setStartDate) setStartDate(d)
    if (onStartDateChange) onStartDateChange(d)
  }
  const updateEndDate = (d) => {
    if (setEndDate) setEndDate(d)
    if (onEndDateChange) onEndDateChange(d)
  }

  const presets = [
    { id: 'this_month', label: 'Este Mês (Padrão)' },
    { id: 'last_month', label: 'Mês Anterior' },
    { id: 'today', label: 'Hoje' },
    { id: '30days', label: 'Últimos 30 Dias' },
    { id: '90days', label: 'Últimos 90 Dias' },
    { id: 'this_year', label: 'Ano Atual' },
    { id: 'all_time', label: 'Todo o Histórico' }
  ]

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3.5 backdrop-blur-md">
      
      {/* Linha 1: Seletor de Calendário (Data Início e Fim) + Navegação Mês a Mês */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Bloco de Calendário: Data Início -> Data Fim */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          
          {/* Navegação Rápida de Mês */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 shrink-0 shadow-inner">
            <button
              type="button"
              onClick={prevMonth}
              title="Mês Anterior"
              className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-all active:scale-95 shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-300 px-2 select-none">
              Mês
            </span>
            <button
              type="button"
              onClick={nextMonth}
              title="Próximo Mês"
              className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-all active:scale-95 shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Campo Data Início */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 hover:border-emerald-500/60 focus-within:border-emerald-500 rounded-2xl px-3 py-2 shadow-inner transition-colors">
            <Calendar className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Data Início</span>
              <input
                type="date"
                value={startDate || ''}
                onChange={(e) => updateStartDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-white focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          <div className="text-slate-500 flex items-center justify-center">
            <ArrowRight className="w-3.5 h-3.5" />
          </div>

          {/* Campo Data Fim */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 hover:border-emerald-500/60 focus-within:border-emerald-500 rounded-2xl px-3 py-2 shadow-inner transition-colors">
            <Calendar className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Data Fim</span>
              <input
                type="date"
                value={endDate || ''}
                onChange={(e) => updateEndDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-white focus:outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Resumo do Período e Métricas Rápidas */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <div className="px-3.5 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-2 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Período: <strong className="text-white">{periodLabel || (startDate && endDate ? `${formatDate(startDate)} até ${formatDate(endDate)}` : 'Mês Atual')}</strong></span>
          </div>

          {filteredCount !== undefined && (
            <div className="px-3 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold">
              {filteredCount} {filteredCount === 1 ? 'lançamento' : 'lançamentos'}
            </div>
          )}

          {showAmounts && (receivablesTotal > 0 || payablesTotal > 0) && (
            <div className="px-3 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300">
              {receivablesTotal > 0 && (
                <span>Total: <strong className="text-emerald-400 font-extrabold">{formatCurrency(receivablesTotal)}</strong></span>
              )}
              {payablesTotal > 0 && (
                <span className={receivablesTotal > 0 ? 'ml-2' : ''}>Pagar: <strong className="text-amber-400 font-extrabold">{formatCurrency(payablesTotal)}</strong></span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Linha 2: Barra de Atalhos Rápidos (Presets) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
        <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 shrink-0 mr-1">
          <Filter className="w-3 h-3 text-slate-500" />
          <span>Atalhos:</span>
        </span>
        {presets.map((p) => {
          const isActive = activePreset === p.id
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset && applyPreset(p.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40 border border-emerald-500 font-bold scale-[1.02]'
                  : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {p.label}
            </button>
          )
        })}
      </div>

    </div>
  )
}
