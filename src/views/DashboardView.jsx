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
  PieChart as PieIcon,
  Copy,
  Check,
  CalendarClock,
  Receipt,
  ExternalLink
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
import { DateFilterBar } from '../components/DateFilterBar'
import { useDateFilter } from '../hooks/useDateFilter'

export function DashboardView({
  clients = [],
  payables = [],
  receivables = [],
  selectedClientId,
  onSelectClient,
  onNavigateTab
}) {
  const currentClient = clients.find(c => c.id === selectedClientId) || clients[0]

  // Hook centralizado de filtro por Mês / Dia / Período
  const dateFilter = useDateFilter('this_month')
  const {
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
  } = dateFilter

  // Base de Contas a Pagar e Receber para o Cliente Atual (Drillex ou Global)
  const basePayables = selectedClientId
    ? payables.filter(p => !p.clientId || p.clientId === selectedClientId || p.clientId === 'd0000000-0000-0000-0000-000000000001' || p.clientId === 'drillex-company-3272538')
    : payables

  const baseReceivables = selectedClientId
    ? receivables.filter(r => !r.clientId || r.clientId === selectedClientId || r.clientId === 'd0000000-0000-0000-0000-000000000001' || r.clientId === 'drillex-company-3272538')
    : receivables

  // Filtragem ESTRITA pelo Intervalo de Datas Selecionado (De ... Até ...)
  const filteredPayables = filterByDate(basePayables, 'dueDate')
  const filteredReceivables = filterByDate(baseReceivables, 'dueDate')

  const isPaidPayable = (p) => p.status === 'paid' || p.status === 'liquidated' || p.status === 'PAGO' || p.status === 'QUITADO'
  const isReceivedRec = (r) => r.status === 'received' || r.status === 'paid' || r.status === 'liquidated' || r.status === 'RECEBIDO' || r.status === 'QUITADO'

  const getPayablePaid = (p) => {
    if (isPaidPayable(p)) return Number(p.amount || 0)
    if (p.amountPaid !== undefined && p.amountPaid !== null && Number(p.amountPaid) > 0) return Number(p.amountPaid)
    return 0
  }

  const getPayableRemaining = (p) => {
    if (isPaidPayable(p)) return 0
    if (p.amountRemaining !== undefined && p.amountRemaining !== null && Number(p.amountRemaining) > 0) return Number(p.amountRemaining)
    return Number(p.amount || 0)
  }

  const getReceivableReceived = (r) => {
    if (isReceivedRec(r)) return Number(r.amount || 0)
    if (r.amountPaid !== undefined && r.amountPaid !== null && Number(r.amountPaid) > 0) return Number(r.amountPaid)
    return 0
  }

  const getReceivableRemaining = (r) => {
    if (isReceivedRec(r)) return 0
    if (r.amountRemaining !== undefined && r.amountRemaining !== null && Number(r.amountRemaining) > 0) return Number(r.amountRemaining)
    return Number(r.amount || 0)
  }

  // =========================================================================
  // MÉTRICAS CALCULADAS DINAMICAMENTE PARA O PERÍODO SELECIONADO
  // =========================================================================
  const totalPayablesAmount = filteredPayables.reduce((acc, p) => acc + (Number(p.amount) || 0), 0)
  const totalReceivablesAmount = filteredReceivables.reduce((acc, r) => acc + (Number(r.amount) || 0), 0)
  const periodRevenue = totalReceivablesAmount

  // Contagens e valores de pagamentos no período
  const paidPayables = filteredPayables.filter(p => isPaidPayable(p) || getPayablePaid(p) > 0)
  const paidPayablesAmount = filteredPayables.reduce((acc, p) => acc + getPayablePaid(p), 0)
  const pendingPayables = filteredPayables.filter(p => !isPaidPayable(p) && p.status !== 'overdue')
  const pendingPayablesAmount = pendingPayables.reduce((acc, p) => acc + getPayableRemaining(p), 0)
  const overduePayables = filteredPayables.filter(p => !isPaidPayable(p) && (p.status === 'overdue' || (p.dueDate && p.dueDate < new Date().toISOString().split('T')[0])))
  const overduePayablesAmount = overduePayables.reduce((acc, p) => acc + getPayableRemaining(p), 0)
  const pendingPayablesCount = pendingPayables.length
  const overduePayablesCount = overduePayables.length
  const paidPayablesCount = paidPayables.length

  // Contagens e valores de recebimentos no período
  const receivedReceivables = filteredReceivables.filter(r => isReceivedRec(r) || getReceivableReceived(r) > 0)
  const receivedReceivablesAmount = filteredReceivables.reduce((acc, r) => acc + getReceivableReceived(r), 0)
  const pendingReceivables = filteredReceivables.filter(r => !isReceivedRec(r))
  const pendingReceivablesAmount = pendingReceivables.reduce((acc, r) => acc + getReceivableRemaining(r), 0)
  const liquidityRate = periodRevenue > 0 ? Math.round((receivedReceivablesAmount / periodRevenue) * 100) : 0

  // Faturamento Médio Diário no Período
  const dailyAverageRevenue = diffDays > 0 ? (periodRevenue / diffDays) : 0

  // Resultado Operacional Líquido no Período (Receitas - Despesas do Período)
  const netCashFlowPeriod = periodRevenue - totalPayablesAmount

  // Saldo em Caixa Calculado
  const baseCashBalance = selectedClientId
    ? (currentClient?.cashBalance || 0)
    : clients.reduce((acc, c) => acc + (c.cashBalance || 0), 0)

  const totalPendingReconciliations = selectedClientId
    ? (currentClient?.pendingReconciliations || 0)
    : clients.reduce((acc, c) => acc + (c.pendingReconciliations || 0), 0)

  // =========================================================================
  // VENCIMENTOS DE HOJE (RECEITAS E DESPESAS DO DIA ATUAL)
  // =========================================================================
  const [copiedBarcodeId, setCopiedBarcodeId] = useState(null)

  const handleCopyBarcode = (barcode, id) => {
    if (!barcode) return
    navigator.clipboard.writeText(barcode.replace(/\s+/g, ''))
    setCopiedBarcodeId(id)
    setTimeout(() => setCopiedBarcodeId(null), 2000)
  }

  const todayStr = new Date().toISOString().split('T')[0]

  // Despesas que vencem hoje
  const todayPayables = basePayables.filter(p => {
    const d = p.dueDate || p.due_date
    return d === todayStr || p.status === 'today'
  })
  const todayPayablesAmount = todayPayables.reduce((acc, p) => acc + (Number(p.amount) || 0), 0)
  const todayPayablesPaidAmount = todayPayables.reduce((acc, p) => acc + getPayablePaid(p), 0)
  const todayPayablesPendingAmount = todayPayables.filter(p => !isPaidPayable(p)).reduce((acc, p) => acc + getPayableRemaining(p), 0)

  // Receitas que vencem hoje
  const todayReceivables = baseReceivables.filter(r => {
    const d = r.dueDate || r.due_date
    return d === todayStr || r.status === 'today'
  })
  const todayReceivablesAmount = todayReceivables.reduce((acc, r) => acc + (Number(r.amount) || 0), 0)
  const todayReceivablesReceivedAmount = todayReceivables.reduce((acc, r) => acc + getReceivableReceived(r), 0)
  const todayReceivablesPendingAmount = todayReceivables.filter(r => !isReceivedRec(r)).reduce((acc, r) => acc + getReceivableRemaining(r), 0)

  // Saldo projetado do dia
  const todayNetBalance = todayReceivablesAmount - todayPayablesAmount

  // Gráfico de Fluxo de Caixa Dinâmico baseado exclusivamente nos lançamentos reais do banco
  const chartData = React.useMemo(() => {
    const dateMap = {}

    filteredReceivables.forEach(r => {
      const d = r.dueDate || r.due_date
      if (!d) return
      if (!dateMap[d]) dateMap[d] = { month: formatDate(d), fullDate: d, entradas: 0, saidas: 0 }
      dateMap[d].entradas += Number(r.amount) || 0
    })

    filteredPayables.forEach(p => {
      const d = p.dueDate || p.due_date
      if (!d) return
      if (!dateMap[d]) dateMap[d] = { month: formatDate(d), fullDate: d, entradas: 0, saidas: 0 }
      dateMap[d].saidas += Number(p.amount) || 0
    })

    const sorted = Object.values(dateMap).sort((a, b) => (a.fullDate || '').localeCompare(b.fullDate || ''))
    if (sorted.length > 0) return sorted

    return [
      { month: 'Início', entradas: 0, saidas: 0 },
      { month: 'Fim', entradas: 0, saidas: 0 }
    ]
  }, [filteredReceivables, filteredPayables])

  const getPeriodLabel = () => periodLabel

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Banner Superior com Contexto */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-cyan-950/30 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
            <Zap className="w-3.5 h-3.5" />
            <span>{selectedClientId ? `Empresa: ${currentClient?.tradeName}` : 'Visão Consolidada Amici BPO'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {selectedClientId ? currentClient?.corporateName : 'Central de Gestão Financeira'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            {selectedClientId
              ? `Analista Responsável: ${currentClient?.financialAnalyst} • Regime: ${currentClient?.taxRegime}`
              : `Monitoramento executivo em tempo real com integração ativa na Conta Azul.`}
          </p>
        </div>

        {/* Glow decorativo de fundo */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* BARRA DE FILTRO DE PERÍODO (POR MÊS, POR DIA, INTERVALO DE ... ATÉ ...) */}
      <DateFilterBar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        onYearChange={setSelectedYear}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        selectedDay={selectedDay}
        onDayChange={setSelectedDay}
        onPrevDay={handlePrevDay}
        onNextDay={handleNextDay}
        startDate={customStartDate}
        endDate={customEndDate}
        onStartDateChange={setCustomStartDate}
        onEndDateChange={setCustomEndDate}
        onApplyPreset={handleApplyPreset}
        activePreset={activePreset}
        totalReceivablesCount={filteredReceivables.length}
        totalReceivablesAmount={periodRevenue}
        totalPayablesCount={filteredPayables.length}
        totalPayablesAmount={totalPayablesAmount}
        diffDays={diffDays}
      />

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
            {todayPayables.length > 0 ? (
              <span className="text-amber-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                {todayPayables.length} vence hoje
              </span>
            ) : overduePayablesCount > 0 ? (
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
            {todayReceivables.length > 0 ? (
              <span className="text-emerald-400 font-semibold">{todayReceivables.length} vence hoje</span>
            ) : (
              <span>{pendingReceivables.length} a receber</span>
            )}
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

      {/* ========================================================================= */}
      {/* SEÇÃO EXECUTIVA: AGENDA DO DIA • VENCIMENTOS DE HOJE                      */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-2xl space-y-5">
        
        {/* Header da Agenda de Hoje */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-inner">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Vencimentos de Hoje
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  {formatDate(todayStr)}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Receitas previstas e compromissos financeiros a liquidar com vencimento na data de hoje.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs flex items-center gap-2">
              <span className="text-slate-400">Saldo Previsto do Dia:</span>
              <strong className={`font-mono font-bold ${todayNetBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatCurrency(todayNetBalance)}
              </strong>
            </div>
          </div>
        </div>

        {/* Grid de 2 Cards: Receitas de Hoje vs Despesas de Hoje */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          
          {/* Card 1: RECEITAS QUE VENCEM HOJE */}
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-emerald-500/20 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                  <TrendingUp className="w-4 h-4" />
                  <span>Receitas que Vencem Hoje</span>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  {todayReceivables.length} {todayReceivables.length === 1 ? 'título' : 'títulos'}
                </span>
              </div>

              <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono mb-2">
                {formatCurrency(todayReceivablesAmount)}
              </div>

              {todayReceivables.length > 0 ? (
                <div className="space-y-2 mt-4">
                  {todayReceivables.map(rec => (
                    <div
                      key={rec.id}
                      className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="truncate pr-2">
                        <div className="text-xs font-semibold text-white truncate">{rec.customer}</div>
                        <div className="text-[11px] text-slate-400 truncate">{rec.description}</div>
                        {rec.invoiceNumber && (
                          <span className="text-[10px] text-cyan-400 font-mono">{rec.invoiceNumber}</span>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs font-bold text-emerald-400 font-mono">{formatCurrency(rec.amount)}</div>
                        <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-medium border ${
                          isReceivedRec(rec)
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                        }`}>
                          {isReceivedRec(rec) ? 'Recebido' : 'A Vencer Hoje'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 px-4 text-center rounded-xl bg-slate-900/40 border border-dashed border-slate-800 text-slate-400 text-xs mt-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500/60 mx-auto mb-1.5" />
                  <p className="font-medium text-slate-300">Nenhuma receita com vencimento para hoje</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Todos os recebimentos estão programados para outras datas.</p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                {todayReceivablesReceivedAmount > 0
                  ? `Liquidado hoje: ${formatCurrency(todayReceivablesReceivedAmount)}`
                  : `Pendente de recebimento: ${formatCurrency(todayReceivablesPendingAmount)}`}
              </span>
              <button
                type="button"
                onClick={() => onNavigateTab('customers')}
                className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 group"
              >
                <span>Ver Contas a Receber</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* Card 2: DESPESAS QUE VENCEM HOJE */}
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-amber-500/20 hover:border-amber-500/40 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                  <Receipt className="w-4 h-4" />
                  <span>Despesas que Vencem Hoje</span>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  {todayPayables.length} {todayPayables.length === 1 ? 'título a pagar' : 'títulos a pagar'}
                </span>
              </div>

              <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono mb-2">
                {formatCurrency(todayPayablesAmount)}
              </div>

              {todayPayables.length > 0 ? (
                <div className="space-y-2 mt-4">
                  {todayPayables.map(pay => (
                    <div
                      key={pay.id}
                      className="p-3.5 rounded-xl bg-slate-900/90 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                          <span className="text-xs font-bold text-white truncate">{pay.supplier}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {pay.description} {pay.category ? `• ${pay.category}` : ''}
                        </div>
                        {pay.barcode && (
                          <div className="text-[10px] text-slate-500 font-mono truncate mt-1">
                            Linha digitável: {pay.barcode}
                          </div>
                        )}
                      </div>

                      <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 flex-shrink-0">
                        <div className="text-sm font-extrabold text-amber-400 font-mono">
                          {formatCurrency(pay.amount)}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {pay.barcode && (
                            <button
                              type="button"
                              onClick={() => handleCopyBarcode(pay.barcode, pay.id)}
                              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium flex items-center gap-1 transition-colors"
                              title="Copiar linha digitável do boleto"
                            >
                              {copiedBarcodeId === pay.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400 font-bold">Copiado!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3 text-slate-400" />
                                  <span>Copiar Linha</span>
                                </>
                              )}
                            </button>
                          )}
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            isPaidPayable(pay)
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                          }`}>
                            {isPaidPayable(pay) ? 'Pago' : 'Vence Hoje'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 px-4 text-center rounded-xl bg-slate-900/40 border border-dashed border-slate-800 text-slate-400 text-xs mt-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500/60 mx-auto mb-1.5" />
                  <p className="font-medium text-slate-300">Nenhuma despesa vence hoje</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Sem compromissos agendados para liquidação no dia.</p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                {todayPayablesPaidAmount > 0
                  ? `Pago hoje: ${formatCurrency(todayPayablesPaidAmount)}`
                  : `Aguardando liquidação: ${formatCurrency(todayPayablesPendingAmount)}`}
              </span>
              <button
                type="button"
                onClick={() => onNavigateTab('suppliers')}
                className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 group"
              >
                <span>Central de Pagamentos</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
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
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
