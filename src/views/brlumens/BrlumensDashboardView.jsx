import React from 'react'
import {
  TrendingUp,
  CreditCard,
  Clock,
  Zap,
  Package,
  ShoppingBag,
  MapPin,
  Calendar,
  AlertCircle
} from 'lucide-react'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { DateFilterBar } from '../../components/DateFilterBar'
import { useDateFilter } from '../../hooks/useDateFilter'

export function BrlumensDashboardView({
  clients = [],
  payables = [],
  receivables = [],
  selectedClientId,
  onSelectClient,
  onNavigateTab
}) {
  const currentClient = clients.find(c => c.id === selectedClientId) || {
    tradeName: 'BR Lumens',
    legalName: 'BR Lumens Comércio e Importação de Iluminação Ltda',
    segment: 'Comércio Exterior & Iluminação LED'
  }

  // Hook centralizado de filtro de datas
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
    periodLabel,
    handlePrevMonth,
    handleNextMonth,
    handlePrevDay,
    handleNextDay,
    handleApplyPreset,
    filterByDate
  } = dateFilter

  // Filtra lançamentos a pagar e a receber para a BR Lumens diretamente do banco Supabase
  const basePayables = payables.filter(p => !p.clientId || p.clientId === 'd0000000-0000-0000-0000-000000000002')
  const baseReceivables = receivables.filter(r => !r.clientId || r.clientId === 'd0000000-0000-0000-0000-000000000002')

  const filteredPayables = filterByDate(basePayables, 'dueDate')
  const filteredReceivables = filterByDate(baseReceivables, 'dueDate')

  // Cálculos financeiros reais da BR Lumens a partir do banco de dados
  const isReceived = (r) => r.status === 'received' || r.status === 'paid'
  const isPaid = (p) => p.status === 'paid'

  const atendidosReceivables = filteredReceivables.filter(isReceived)
  const pendentesReceivables = filteredReceivables.filter(r => !isReceived(r))

  const totalReceivables = filteredReceivables.reduce((acc, r) => acc + Number(r.amount || 0), 0)
  const totalReceived = atendidosReceivables.reduce((acc, r) => acc + Number(r.amountPaid || r.amount || 0), 0)
  const totalReceivablesPending = pendentesReceivables.reduce((acc, r) => acc + Number(r.amountRemaining || r.amount || 0), 0)

  const totalPayables = filteredPayables.reduce((acc, p) => acc + Number(p.amount || 0), 0)
  const totalPayablesPaid = filteredPayables.filter(isPaid).reduce((acc, p) => acc + Number(p.amountPaid || p.amount || 0), 0)
  const totalPayablesPending = filteredPayables.filter(p => !isPaid(p)).reduce((acc, p) => acc + Number(p.amountRemaining || p.amount || 0), 0)

  const ticketMedio = filteredReceivables.length > 0 ? (totalReceivables / filteredReceivables.length) : 0

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      {/* Header com Identificação da Empresa */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-500/20 shadow-xl backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Zap className="w-4 h-4" />
              Empresa: BR Lumens (Amici Comex)
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {currentClient.legalName || 'BR Lumens Comércio e Importação de Iluminação Ltda'}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Analista Responsável: Mesa de Operações Comex • Conexão: <span className="text-emerald-400 font-medium">Bling ERP v3 Oficial (Supabase)</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Bling ERP Online (v3)
            </span>
          </div>
        </div>
      </div>

      {/* Barra Global de Filtro de Datas */}
      <DateFilterBar
        viewMode={viewMode}
        setViewMode={setViewMode}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        selectedDay={selectedDay}
        setSelectedDay={setSelectedDay}
        startDate={startDate}
        endDate={endDate}
        customStartDate={customStartDate}
        setCustomStartDate={setCustomStartDate}
        customEndDate={customEndDate}
        setCustomEndDate={setCustomEndDate}
        activePreset={activePreset}
        periodLabel={periodLabel}
        handleApplyPreset={handleApplyPreset}
        handlePrevMonth={handlePrevMonth}
        handleNextMonth={handleNextMonth}
        handlePrevDay={handlePrevDay}
        handleNextDay={handleNextDay}
        filteredCount={filteredReceivables.length + filteredPayables.length}
        totalCount={baseReceivables.length + basePayables.length}
        payablesTotal={totalPayables}
        receivablesTotal={totalReceivables}
        showAmounts={true}
      />

      {/* Cards de Métricas Principais (100% Banco Supabase) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Faturamento Atendido / Recebido */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Faturamento Atendido</span>
            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight">
              {formatCurrency(totalReceived)}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
              <span>{atendidosReceivables.length} títulos atendidos</span>
              <span className="text-emerald-400 font-medium">Bling ERP</span>
            </div>
          </div>
        </div>

        {/* Card 2: Pedidos em Aberto */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pedidos em Aberto</span>
            <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-amber-300 tracking-tight">
              {formatCurrency(totalReceivablesPending)}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
              <span>{pendentesReceivables.length} títulos a faturar</span>
              <span className="text-amber-400 font-medium">Em carteira</span>
            </div>
          </div>
        </div>

        {/* Card 3: Ticket Médio do Período */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ticket Médio</span>
            <span className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <ShoppingBag className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight">
              {formatCurrency(ticketMedio)}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
              <span>{filteredReceivables.length} pedidos no período</span>
              <span className="text-cyan-400 font-medium">Média real</span>
            </div>
          </div>
        </div>

        {/* Card 4: Contas a Pagar (Importação & Custo) */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-rose-500/40 transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Contas a Pagar</span>
            <span className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <CreditCard className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-rose-300 tracking-tight">
              {formatCurrency(totalPayables)}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
              <span>{filteredPayables.length} títulos no período</span>
              <span className="text-slate-400 font-medium">{totalPayablesPaid > 0 ? `${formatCurrency(totalPayablesPaid)} pago` : 'A liquidar'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Painel de Situação dos Pedidos */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-cyan-400" />
            <h3 className="font-semibold text-white text-sm">Situação dos Pedidos / Faturamento no Bling ERP</h3>
          </div>
          <span className="text-xs text-emerald-400 font-medium">Dados Reais do Banco Supabase</span>
        </div>

        <div className="space-y-4 pt-2">
          <div>
            <div className="flex justify-between text-xs font-medium text-slate-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Atendido / Faturado ({atendidosReceivables.length} títulos)
              </span>
              <span className="font-bold text-emerald-400">{formatCurrency(totalReceived)}</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-3 rounded-full"
                style={{ width: `${totalReceivables > 0 ? (totalReceived / totalReceivables) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-slate-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Em Aberto ({pendentesReceivables.length} títulos)
              </span>
              <span className="font-bold text-amber-400">{formatCurrency(totalReceivablesPending)}</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-orange-400 h-3 rounded-full"
                style={{ width: `${totalReceivables > 0 ? (totalReceivablesPending / totalReceivables) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80">
            <span>Total Geral em Carteira ({periodLabel}):</span>
            <span className="text-sm font-bold text-white">{formatCurrency(totalReceivables)}</span>
          </div>
        </div>
      </div>

      {/* Tabela de Títulos / Pedidos de Venda Reais Sincronizados */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="font-semibold text-white text-base">Lançamentos de Vendas e Faturamento (Bling ERP)</h3>
            <p className="text-xs text-slate-400">Registros sincronizados do Bling ERP persistidos no Supabase</p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {filteredReceivables.length} lançamentos no período
          </span>
        </div>

        {filteredReceivables.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            Nenhum lançamento de faturamento encontrado no período selecionado ({periodLabel}).
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-3">Doc / NF-e</th>
                  <th className="py-3 px-3">Cliente / Descrição</th>
                  <th className="py-3 px-3 text-center">Vencimento</th>
                  <th className="py-3 px-3 text-center">Situação</th>
                  <th className="py-3 px-3 text-right">Valor Total</th>
                  <th className="py-3 px-3 text-right">Valor Recebido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filteredReceivables.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-semibold text-emerald-400">{rec.documentNumber || rec.invoiceNumber || rec.id}</td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-white">{rec.customer || rec.customerName || 'Cliente Bling'}</div>
                      <div className="text-[11px] text-slate-400">{rec.description}</div>
                    </td>
                    <td className="py-3 px-3 text-center font-medium text-slate-300">{formatDate(rec.dueDate)}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        isReceived(rec)
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}>
                        {isReceived(rec) ? 'Atendido / Recebido' : 'Em Aberto'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-white">{formatCurrency(rec.amount)}</td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-300">{formatCurrency(rec.amountPaid || (isReceived(rec) ? rec.amount : 0))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-700 bg-slate-800/40 font-bold text-white text-xs">
                  <td colSpan={4} className="py-3 px-3 text-right">TOTAL DO PERÍODO:</td>
                  <td className="py-3 px-3 text-right text-white text-sm">{formatCurrency(totalReceivables)}</td>
                  <td className="py-3 px-3 text-right text-emerald-400 text-sm">{formatCurrency(totalReceived)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
