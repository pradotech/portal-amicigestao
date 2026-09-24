import React, { useState } from 'react'
import {
  TrendingUp,
  CreditCard,
  Building2,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Zap,
  DollarSign,
  ChevronRight,
  FileText,
  Calendar,
  Filter,
  CalendarDays,
  RotateCcw,
  Sparkles,
  PieChart as PieIcon
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import { formatCurrency, formatDate } from '../utils/formatters'
import { CASH_FLOW_CHART_DATA } from '../data/mockData'

export function DashboardView({
  clients = [],
  payables = [],
  receivables = [],
  selectedClientId,
  onSelectClient,
  onNavigateTab
}) {
  const currentClient = clients.find(c => c.id === selectedClientId) || clients[0]

  // Configuração inicial de datas (Mês Atual por padrão)
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0')
  const lastDayOfMonth = new Date(currentYear, now.getMonth() + 1, 0).getDate()

  // Estados do Filtro de Período (Mês / Dia / Intervalo)
  const [periodPreset, setPeriodPreset] = useState('this_month') // 'today' | '7days' | 'this_month' | 'last_month' | '90days' | 'month_select' | 'custom'
  const [startDate, setStartDate] = useState(`${currentYear}-${currentMonth}-01`)
  const [endDate, setEndDate] = useState(`${currentYear}-${currentMonth}-${String(lastDayOfMonth).padStart(2, '0')}`)
  const [selectedMonthInput, setSelectedMonthInput] = useState(`${currentYear}-${currentMonth}`)

  // Manipulador de Presets Rápidos
  const handleApplyPreset = (preset) => {
    setPeriodPreset(preset)
    const d = new Date()
    const y = d.getFullYear()
    const m = d.getMonth()

    if (preset === 'today') {
      const today = d.toISOString().split('T')[0]
      setStartDate(today)
      setEndDate(today)
    } else if (preset === '7days') {
      const past7 = new Date(d.getTime() - 7 * 86400000).toISOString().split('T')[0]
      setStartDate(past7)
      setEndDate(d.toISOString().split('T')[0])
    } else if (preset === 'this_month') {
      const curM = String(m + 1).padStart(2, '0')
      const lastDay = new Date(y, m + 1, 0).getDate()
      setStartDate(`${y}-${curM}-01`)
      setEndDate(`${y}-${curM}-${String(lastDay).padStart(2, '0')}`)
      setSelectedMonthInput(`${y}-${curM}`)
    } else if (preset === 'last_month') {
      const prevMonthDate = new Date(y, m - 1, 1)
      const prevY = prevMonthDate.getFullYear()
      const prevM = String(prevMonthDate.getMonth() + 1).padStart(2, '0')
      const lastDay = new Date(prevY, prevMonthDate.getMonth() + 1, 0).getDate()
      setStartDate(`${prevY}-${prevM}-01`)
      setEndDate(`${prevY}-${prevM}-${String(lastDay).padStart(2, '0')}`)
      setSelectedMonthInput(`${prevY}-${prevM}`)
    } else if (preset === '90days') {
      const past90 = new Date(d.getTime() - 90 * 86400000).toISOString().split('T')[0]
      setStartDate(past90)
      setEndDate(d.toISOString().split('T')[0])
    }
  }

  // Ao selecionar mês específico no input de mês
  const handleMonthInputChange = (e) => {
    const value = e.target.value // Formato YYYY-MM
    if (!value) return
    setSelectedMonthInput(value)
    setPeriodPreset('month_select')
    const [yStr, mStr] = value.split('-')
    const y = parseInt(yStr, 10)
    const m = parseInt(mStr, 10)
    const lastDay = new Date(y, m, 0).getDate()
    setStartDate(`${value}-01`)
    setEndDate(`${value}-${String(lastDay).padStart(2, '0')}`)
  }

  // Base de Contas a Pagar e Receber para o Cliente Atual (Drillex ou Global)
  const basePayables = selectedClientId
    ? payables.filter(p => !p.clientId || p.clientId === selectedClientId || p.clientId === 'd0000000-0000-0000-0000-000000000001' || p.clientId === 'drillex-company-3272538')
    : payables

  const baseReceivables = selectedClientId
    ? receivables.filter(r => !r.clientId || r.clientId === selectedClientId || r.clientId === 'd0000000-0000-0000-0000-000000000001' || r.clientId === 'drillex-company-3272538')
    : receivables

  // Filtragem ESTRITA pelo Intervalo de Datas Selecionado (De ... Até ...)
  const filteredPayables = basePayables.filter(p => {
    if (!p.dueDate) return false
    return p.dueDate >= startDate && p.dueDate <= endDate
  })

  const filteredReceivables = baseReceivables.filter(r => {
    if (!r.dueDate) return false
    return pDueDateInRange(r.dueDate, startDate, endDate)
  })

  function pDueDateInRange(dueDate, start, end) {
    return dueDate >= start && dueDate <= end
  }

  // Cálculo de Dias do Período Selecionado
  const diffDays = Math.max(1, Math.round((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1)
  const isSingleDay = diffDays === 1 || startDate === endDate

  // =========================================================================
  // MÉTRICAS CALCULADAS DINAMICAMENTE PARA O PERÍODO SELECIONADO
  // =========================================================================
  const totalPayablesAmount = filteredPayables.reduce((acc, p) => acc + (Number(p.amount) || 0), 0)
  const totalReceivablesAmount = filteredReceivables.reduce((acc, r) => acc + (Number(r.amount) || 0), 0)
  const periodRevenue = totalReceivablesAmount

  // Contagens e valores de pagamentos no período
  const paidPayables = filteredPayables.filter(p => p.status === 'paid')
  const paidPayablesAmount = paidPayables.reduce((acc, p) => acc + (Number(p.amount) || 0), 0)
  const pendingPayables = filteredPayables.filter(p => p.status === 'pending_client' || p.status === 'scheduled' || p.status === 'pending' || p.status === 'approved')
  const pendingPayablesAmount = pendingPayables.reduce((acc, p) => acc + (Number(p.amount) || 0), 0)
  const overduePayables = filteredPayables.filter(p => p.status === 'overdue')
  const overduePayablesAmount = overduePayables.reduce((acc, p) => acc + (Number(p.amount) || 0), 0)
  const pendingPayablesCount = pendingPayables.length
  const overduePayablesCount = overduePayables.length
  const paidPayablesCount = paidPayables.length

  // Contagens e valores de recebimentos no período
  const receivedReceivables = filteredReceivables.filter(r => r.status === 'received' || r.status === 'paid')
  const receivedReceivablesAmount = receivedReceivables.reduce((acc, r) => acc + (Number(r.amount) || 0), 0)
  const pendingReceivables = filteredReceivables.filter(r => r.status !== 'received' && r.status !== 'paid')
  const pendingReceivablesAmount = pendingReceivables.reduce((acc, r) => acc + (Number(r.amount) || 0), 0)
  const liquidityRate = periodRevenue > 0 ? Math.round((receivedReceivablesAmount / periodRevenue) * 100) : 0

  // Faturamento Médio Diário no Período
  const dailyAverageRevenue = diffDays > 0 ? (periodRevenue / diffDays) : 0

  // Resultado Operacional Líquido no Período (Receitas - Despesas do Período)
  const netCashFlowPeriod = periodRevenue - totalPayablesAmount

  // Saldo em Caixa Base da Empresa
  const baseCashBalance = selectedClientId
    ? (currentClient?.cashBalance || 248900.00)
    : clients.reduce((acc, c) => acc + (c.cashBalance || 0), 0)

  const totalPendingReconciliations = selectedClientId
    ? (currentClient?.pendingReconciliations || 0)
    : clients.reduce((acc, c) => acc + (c.pendingReconciliations || 0), 0)

  // Descrição legível do período selecionado
  const getPeriodLabel = () => {
    if (periodPreset === 'today') return 'Hoje'
    if (periodPreset === '7days') return 'Últimos 7 dias'
    if (periodPreset === 'this_month') return 'Este Mês'
    if (periodPreset === 'last_month') return 'Mês Anterior'
    if (periodPreset === '90days') return 'Últimos 90 dias'
    if (periodPreset === 'month_select') {
      const [y, m] = selectedMonthInput.split('-')
      const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
      const mIdx = parseInt(m, 10) - 1
      return `${monthNames[mIdx] || m}/${y}`
    }
    return `${formatDate(startDate)} até ${formatDate(endDate)}`
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Banner Superior com Contexto */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-1">
            <Zap className="w-4 h-4" />
            <span>{selectedClientId ? `Empresa: ${currentClient?.tradeName}` : 'Visão Consolidada Amici BPO'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {selectedClientId ? currentClient?.corporateName : 'Central de Gestão Financeira'}
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            {selectedClientId
              ? `Analista Responsável: ${currentClient?.financialAnalyst} • Regime: ${currentClient?.taxRegime}`
              : `Monitoramento em tempo real com integração ativa na Conta Azul.`}
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            type="button"
            onClick={() => onNavigateTab('suppliers')}
            className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-all shadow-lg shadow-cyan-900/30 flex items-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            <span>Gerar Borderô do Dia</span>
          </button>
        </div>

        {/* Glow decorativo de fundo */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* BARRA DE FILTRO DE PERÍODO (MÊS, DIA, INTERVALO DE ... ATÉ ...) */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Presets Rápidos */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>Período:</span>
            </span>

            {[
              { id: 'today', label: 'Hoje' },
              { id: '7days', label: '7 Dias' },
              { id: 'this_month', label: 'Este Mês' },
              { id: 'last_month', label: 'Mês Anterior' },
              { id: '90days', label: 'Últimos 90 Dias' },
              { id: 'custom', label: 'Personalizado' }
            ].map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  if (p.id === 'custom') setPeriodPreset('custom')
                  else handleApplyPreset(p.id)
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  periodPreset === p.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/60'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Seletores Específicos: Escolher Mês e Intervalo De / Até */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Seletor Rápido de Mês */}
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-[11px] font-medium text-slate-400">Escolher Mês:</span>
              <input
                type="month"
                value={selectedMonthInput}
                onChange={handleMonthInputChange}
                className="bg-transparent text-xs font-mono text-cyan-300 focus:outline-none cursor-pointer"
              />
            </div>

            {/* Inputs De / Até */}
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-[11px] font-medium text-slate-400">De:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  setPeriodPreset('custom')
                }}
                className="bg-transparent text-xs font-mono text-slate-200 focus:outline-none cursor-pointer"
              />
              <span className="text-slate-600">•</span>
              <span className="text-[11px] font-medium text-slate-400">Até:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value)
                  setPeriodPreset('custom')
                }}
                className="bg-transparent text-xs font-mono text-slate-200 focus:outline-none cursor-pointer"
              />
            </div>

          </div>

        </div>

        {/* Resumo do Intervalo Ativo com Feedback em Tempo Real */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60 font-mono gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Filtro ativo: <strong className="text-white">{getPeriodLabel()}</strong> ({diffDays} {diffDays === 1 ? 'dia' : 'dias'})</span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-emerald-400 font-semibold">{filteredReceivables.length} recebimentos ({formatCurrency(periodRevenue)})</span>
            <span>•</span>
            <span className="text-amber-400 font-semibold">{filteredPayables.length} pagamentos ({formatCurrency(totalPayablesAmount)})</span>
          </div>
        </div>

      </div>

      {/* Grid 1: Destaque de Faturamento (Período & Dia/Média) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Card 1: FATURAMENTO DO PERÍODO SELECIONADO */}
        <div
          onClick={() => onNavigateTab('customers')}
          className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950/20 to-slate-900 border border-emerald-500/30 hover:border-emerald-400 hover:shadow-2xl hover:shadow-emerald-950/40 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  {isSingleDay ? 'Faturamento do Dia' : 'Faturamento do Período'}
                </span>
                <p className="text-[11px] text-slate-400">{getPeriodLabel()}</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <ArrowUpRight className="w-3.5 h-3.5" />
              {filteredReceivables.length} {filteredReceivables.length === 1 ? 'título' : 'títulos'}
            </span>
          </div>

          <div className="text-3xl sm:text-4xl font-black text-white tracking-tight font-mono">
            {formatCurrency(periodRevenue)}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>
              {isSingleDay
                ? `Liquidado hoje: `
                : `Média diária no período: `}
              <strong className="text-emerald-400">
                {isSingleDay ? formatCurrency(receivedReceivablesAmount) : `${formatCurrency(dailyAverageRevenue)}/dia`}
              </strong>
            </span>
            <span className="text-cyan-400 group-hover:underline flex items-center gap-1 font-semibold">
              Ver faturamento <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Card 2: MÉDIA DIÁRIA NO PERÍODO OU FATURAMENTO DO DIA */}
        <div
          onClick={() => onNavigateTab('customers')}
          className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-cyan-950/20 to-slate-900 border border-cyan-500/30 hover:border-cyan-400 hover:shadow-2xl hover:shadow-cyan-950/40 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  {isSingleDay ? 'Status de Liquidação' : 'Média Diária no Período'}
                </span>
                <p className="text-[11px] text-slate-400">
                  {isSingleDay ? `${filteredReceivables.length} faturamentos hoje` : `Intervalo de ${diffDays} dias`}
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              <Clock className="w-3.5 h-3.5" />
              {receivedReceivables.length} recebidos ({liquidityRate}%)
            </span>
          </div>

          <div className="text-3xl sm:text-4xl font-black text-white tracking-tight font-mono">
            {isSingleDay ? formatCurrency(receivedReceivablesAmount) : formatCurrency(dailyAverageRevenue)}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>
              {isSingleDay ? 'Pendente de recebimento: ' : 'Total liquidado no período: '}
              <strong className="text-cyan-300">
                {isSingleDay ? formatCurrency(pendingReceivablesAmount) : formatCurrency(receivedReceivablesAmount)}
              </strong>
            </span>
            <span className="text-cyan-400 group-hover:underline flex items-center gap-1 font-semibold">
              Detalhar títulos <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

      </div>

      {/* Grid 2: Indicadores Operacionais Reativos ao Período */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Resultado Operacional Líquido do Período */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all shadow-md group">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Resultado no Período</span>
            <div className={`p-2 rounded-xl ${netCashFlowPeriod >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'} group-hover:scale-110 transition-transform`}>
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className={`text-2xl font-extrabold tracking-tight font-mono ${netCashFlowPeriod >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(netCashFlowPeriod)}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
            <span>Saldo em Bancos:</span>
            <span className="text-slate-200 font-semibold">{formatCurrency(baseCashBalance)}</span>
          </div>
        </div>

        {/* Card 2: Contas a Pagar (Período) */}
        <div
          onClick={() => onNavigateTab('suppliers')}
          className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 transition-all shadow-md group cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Contas a Pagar</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight font-mono">
            {formatCurrency(totalPayablesAmount)}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
            <span>{pendingPayablesCount} a pagar ({formatCurrency(pendingPayablesAmount)})</span>
            {overduePayablesCount > 0 ? (
              <span className="text-rose-400 font-semibold">{overduePayablesCount} em atraso</span>
            ) : (
              <span className="text-emerald-400 font-medium">{paidPayablesCount} pagos</span>
            )}
          </div>
        </div>

        {/* Card 3: Contas a Receber (Período) */}
        <div
          onClick={() => onNavigateTab('customers')}
          className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition-all shadow-md group cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Contas a Receber</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight font-mono">
            {formatCurrency(totalReceivablesAmount)}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
            <span className="text-cyan-400 font-medium">{liquidityRate}% liquidado</span>
            <span>{pendingReceivables.length} a receber</span>
          </div>
        </div>

        {/* Card 4: Conciliação Bancária */}
        <div
          onClick={() => onNavigateTab('reconciliation')}
          className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition-all shadow-md group cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Conciliação Diária</span>
            <div className={`p-2 rounded-xl ${totalPendingReconciliations > 0 ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'} group-hover:scale-110 transition-transform`}>
              {totalPendingReconciliations > 0 ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">
            {totalPendingReconciliations} {totalPendingReconciliations === 1 ? 'pendência' : 'pendências'}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2">
            <span>Sincronizado via Conta Azul</span>
          </div>
        </div>

      </div>

      {/* Gráfico de Fluxo de Caixa e Resumo da Carteira */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico Principal (2 colunas) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Fluxo de Caixa Consolidado (Realizado vs Projetado)</h2>
              <p className="text-xs text-slate-400 mt-0.5">Visão consolidada de entradas, saídas e saldo líquido mensal</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block" /> Entradas
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Saídas
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CASH_FLOW_CHART_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0077B6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#0077B6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSaidas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E63946" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#E63946" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={val => `R$ ${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(value) => [formatCurrency(value), '']}
                />
                <Area type="monotone" dataKey="entradas" stroke="#0077B6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorEntradas)" name="Recebimentos" />
                <Area type="monotone" dataKey="saidas" stroke="#E63946" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSaidas)" name="Pagamentos" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Matriz do Cliente e Resumo do Período (1 coluna) */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white tracking-tight">Status do Cliente</h2>
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Conta Azul Ativa
              </span>
            </div>
            
            <div className="space-y-3">
              {clients.map(client => {
                const isSelected = selectedClientId === client.id
                return (
                  <div
                    key={client.id}
                    onClick={() => onSelectClient(isSelected ? null : client.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500/60 shadow-md'
                        : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div
                        className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: client.color || '#0077B6' }}
                      />
                      <div className="truncate">
                        <div className="text-xs font-semibold text-slate-200 truncate">{client.tradeName}</div>
                        <div className="text-[10px] text-slate-400 truncate">{client.segment}</div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-bold text-slate-200 font-mono">{formatCurrency(periodRevenue || client.monthlyRevenue)}</div>
                      <div className="text-[10px] flex items-center justify-end gap-1 mt-0.5">
                        <span className="text-cyan-400 font-medium">{getPeriodLabel()}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Destaque das Métricas no Período */}
            <div className="mt-4 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Faturamento ({getPeriodLabel()}):</span>
                <span className="text-emerald-400 font-bold font-mono">{formatCurrency(periodRevenue)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Despesas ({getPeriodLabel()}):</span>
                <span className="text-rose-400 font-bold font-mono">{formatCurrency(totalPayablesAmount)}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-slate-300 font-semibold">
                <span>Saldo Líquido:</span>
                <span className={netCashFlowPeriod >= 0 ? 'text-emerald-300 font-mono' : 'text-rose-300 font-mono'}>
                  {formatCurrency(netCashFlowPeriod)}
                </span>
              </div>
            </div>

          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Regime Tributário</span>
            <span className="text-white font-semibold">{currentClient?.taxRegime || 'Lucro Presumido'}</span>
          </div>
        </div>

      </div>

      {/* Contas a Pagar do Período */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Contas a Pagar do Período ({getPeriodLabel()})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {filteredPayables.length > 0
                ? `Exibindo ${filteredPayables.length} títulos programados no intervalo filtrado`
                : `Nenhum pagamento registrado no intervalo de ${getPeriodLabel()}`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('suppliers')}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors self-start sm:self-auto"
          >
            Abrir Central de Pagamentos
          </button>
        </div>

        {filteredPayables.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">Favorecido / Fornecedor</th>
                  <th className="pb-3 font-semibold">Categoria</th>
                  <th className="pb-3 font-semibold">Vencimento</th>
                  <th className="pb-3 font-semibold">Valor</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredPayables.slice(0, 8).map(item => {
                  return (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 font-medium text-slate-200">
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                          <div>
                            <div>{item.supplier}</div>
                            <div className="text-[10px] text-slate-500">{item.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-slate-400">{item.category}</td>
                      <td className="py-3 text-slate-300 font-mono">{formatDate(item.dueDate)}</td>
                      <td className="py-3 text-white font-bold font-mono">{formatCurrency(item.amount)}</td>
                      <td className="py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          item.status === 'paid'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : item.status === 'scheduled'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : item.status === 'overdue'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {item.status === 'paid' ? 'Liquidado' : item.status === 'scheduled' ? 'Agendado' : item.status === 'overdue' ? 'Vencido' : 'Aguardando Aprovação'}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => onNavigateTab('suppliers')}
                          className="text-cyan-400 hover:text-cyan-300 font-medium"
                        >
                          Detalhes
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center rounded-2xl bg-slate-950/40 border border-dashed border-slate-800 text-slate-400 text-xs">
            <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="font-semibold text-slate-300">Nenhum título a pagar no período selecionado ({getPeriodLabel()})</p>
            <p className="text-[11px] text-slate-500 mt-1">Experimente selecionar outro mês ou o preset "Este Mês" / "Últimos 90 Dias".</p>
          </div>
        )}
      </div>

    </div>
  )
}
