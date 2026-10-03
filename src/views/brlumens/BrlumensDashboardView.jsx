import React, { useState } from 'react'
import {
  TrendingUp,
  CreditCard,
  Clock,
  Zap,
  Package,
  ShoppingBag,
  MapPin,
  Calendar,
  AlertCircle,
  X,
  Search,
  ExternalLink,
  ChevronRight,
  Receipt,
  FileText,
  DollarSign
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

  // Estado do Modal de Detalhamento
  const [modalDetail, setModalDetail] = useState({
    isOpen: false,
    type: null, // 'faturamento' | 'pedidos_aberto' | 'ticket_medio' | 'contas_pagar'
    title: '',
    subtitle: '',
    items: [],
    itemType: 'receivable' // 'receivable' | 'payable'
  })
  const [modalSearch, setModalSearch] = useState('')

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

  // Abertura de Modais com Detalhamento
  const handleOpenDetail = (type) => {
    setModalSearch('')
    if (type === 'faturamento') {
      setModalDetail({
        isOpen: true,
        type: 'faturamento',
        title: 'Faturamento Atendido / Recebido',
        subtitle: `Títulos liquidados no período de ${periodLabel} • Total: ${formatCurrency(totalReceived)} (${atendidosReceivables.length} títulos)`,
        items: atendidosReceivables,
        itemType: 'receivable'
      })
    } else if (type === 'pedidos_aberto') {
      setModalDetail({
        isOpen: true,
        type: 'pedidos_aberto',
        title: 'Pedidos e Títulos em Aberto (A Receber)',
        subtitle: `Títulos pendentes no período de ${periodLabel} • Total: ${formatCurrency(totalReceivablesPending)} (${pendentesReceivables.length} títulos)`,
        items: pendentesReceivables,
        itemType: 'receivable'
      })
    } else if (type === 'ticket_medio') {
      setModalDetail({
        isOpen: true,
        type: 'ticket_medio',
        title: 'Todos os Lançamentos de Vendas & Pedidos',
        subtitle: `Base completa de faturamento de ${periodLabel} • ${filteredReceivables.length} pedidos • Média: ${formatCurrency(ticketMedio)}`,
        items: filteredReceivables,
        itemType: 'receivable'
      })
    } else if (type === 'contas_pagar') {
      setModalDetail({
        isOpen: true,
        type: 'contas_pagar',
        title: 'Detalhamento de Contas a Pagar',
        subtitle: `Obrigações e despesas de ${periodLabel} • Total: ${formatCurrency(totalPayables)} (${filteredPayables.length} títulos)`,
        items: filteredPayables,
        itemType: 'payable'
      })
    }
  }

  // Itens filtrados pela busca dentro do modal
  const modalFilteredItems = (modalDetail.items || []).filter(item => {
    const q = modalSearch.toLowerCase()
    const name = (item.customer || item.customerName || item.supplier || item.supplier_name || '').toLowerCase()
    const desc = (item.description || '').toLowerCase()
    const doc = (item.documentNumber || item.invoiceNumber || item.barcode || item.id || '').toLowerCase()
    return name.includes(q) || desc.includes(q) || doc.includes(q)
  })

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

      {/* Cards de Métricas Principais Clicáveis com Detalhamento */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Faturamento Atendido / Recebido */}
        <div
          onClick={() => handleOpenDetail('faturamento')}
          className="group cursor-pointer p-5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-850 hover:shadow-emerald-500/10 transition-all duration-200 shadow-lg hover:scale-[1.015] relative"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider group-hover:text-emerald-400 transition-colors">
              Faturamento Atendido
            </span>
            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 group-hover:scale-110 transition-all">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight group-hover:text-emerald-300 transition-colors">
              {formatCurrency(totalReceived)}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
              <span>{atendidosReceivables.length} títulos atendidos</span>
              <span className="text-emerald-400 font-medium inline-flex items-center gap-1 group-hover:underline">
                Ver detalhes <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Pedidos em Aberto */}
        <div
          onClick={() => handleOpenDetail('pedidos_aberto')}
          className="group cursor-pointer p-5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-850 hover:shadow-amber-500/10 transition-all duration-200 shadow-lg hover:scale-[1.015] relative"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider group-hover:text-amber-400 transition-colors">
              Pedidos em Aberto
            </span>
            <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 group-hover:scale-110 transition-all">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-amber-300 tracking-tight">
              {formatCurrency(totalReceivablesPending)}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
              <span>{pendentesReceivables.length} a faturar / receber</span>
              <span className="text-amber-400 font-medium inline-flex items-center gap-1 group-hover:underline">
                Ver detalhes <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Ticket Médio do Período */}
        <div
          onClick={() => handleOpenDetail('ticket_medio')}
          className="group cursor-pointer p-5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-850 hover:shadow-cyan-500/10 transition-all duration-200 shadow-lg hover:scale-[1.015] relative"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider group-hover:text-cyan-400 transition-colors">
              Ticket Médio
            </span>
            <span className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 group-hover:scale-110 transition-all">
              <ShoppingBag className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight group-hover:text-cyan-300 transition-colors">
              {formatCurrency(ticketMedio)}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
              <span>{filteredReceivables.length} pedidos no período</span>
              <span className="text-cyan-400 font-medium inline-flex items-center gap-1 group-hover:underline">
                Ver pedidos <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Contas a Pagar */}
        <div
          onClick={() => handleOpenDetail('contas_pagar')}
          className="group cursor-pointer p-5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-rose-500/50 hover:bg-slate-850 hover:shadow-rose-500/10 transition-all duration-200 shadow-lg hover:scale-[1.015] relative"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider group-hover:text-rose-400 transition-colors">
              Contas a Pagar
            </span>
            <span className="p-2 rounded-lg bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20 group-hover:scale-110 transition-all">
              <CreditCard className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-rose-300 tracking-tight">
              {formatCurrency(totalPayables)}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
              <span>{filteredPayables.length} obrigações no período</span>
              <span className="text-rose-400 font-medium inline-flex items-center gap-1 group-hover:underline">
                Ver contas <ChevronRight className="w-3 h-3" />
              </span>
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
          <div onClick={() => handleOpenDetail('faturamento')} className="cursor-pointer group">
            <div className="flex justify-between text-xs font-medium text-slate-300 mb-1.5 group-hover:text-emerald-300 transition-colors">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Atendido / Faturado ({atendidosReceivables.length} títulos)
              </span>
              <span className="font-bold text-emerald-400">{formatCurrency(totalReceived)}</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-3 rounded-full group-hover:brightness-110 transition-all"
                style={{ width: `${totalReceivables > 0 ? (totalReceived / totalReceivables) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div onClick={() => handleOpenDetail('pedidos_aberto')} className="cursor-pointer group">
            <div className="flex justify-between text-xs font-medium text-slate-300 mb-1.5 group-hover:text-amber-300 transition-colors">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Em Aberto ({pendentesReceivables.length} títulos)
              </span>
              <span className="font-bold text-amber-400">{formatCurrency(totalReceivablesPending)}</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-orange-400 h-3 rounded-full group-hover:brightness-110 transition-all"
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

      {/* MODAL DE DETALHAMENTO DOS CARDS */}
      {modalDetail.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-4xl max-h-[85vh] flex flex-col bg-slate-900 border border-slate-850 rounded-2xl shadow-2xl overflow-hidden animate-scale-up">
            {/* Header do Modal */}
            <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <Receipt className="w-4 h-4" />
                  </span>
                  <h3 className="text-lg font-bold text-white tracking-tight">{modalDetail.title}</h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">{modalDetail.subtitle}</p>
              </div>
              <button
                onClick={() => setModalDetail({ ...modalDetail, isOpen: false })}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Barra de Busca dentro do Modal */}
            <div className="p-4 border-b border-slate-800/60 bg-slate-900/80 flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome, documento ou descrição..."
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <div className="text-xs text-slate-400 whitespace-nowrap">
                Exibindo <span className="font-bold text-white">{modalFilteredItems.length}</span> registros
              </div>
            </div>

            {/* Corpo do Modal com a Lista de Títulos */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-800/40">
              {modalFilteredItems.length === 0 ? (
                <div className="p-10 text-center text-slate-400 text-sm">
                  Nenhum registro encontrado para a pesquisa.
                </div>
              ) : (
                modalFilteredItems.map((item, idx) => {
                  const isRec = modalDetail.itemType === 'receivable'
                  const titleName = isRec ? (item.customer || item.customerName || 'Cliente Bling') : (item.supplier || item.supplier_name || 'Fornecedor Bling')
                  const itemAmount = Number(item.amount || 0)
                  const itemPaid = Number(item.amountPaid || (item.status === 'paid' || item.status === 'received' ? itemAmount : 0))
                  const itemRemaining = Number(item.amountRemaining || (item.status === 'paid' || item.status === 'received' ? 0 : Math.max(0, itemAmount - itemPaid)))

                  return (
                    <div key={item.id || idx} className="pt-2.5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/40 hover:bg-slate-800/50 border border-slate-800/60 transition-colors">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-sm truncate">{titleName}</span>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            {item.documentNumber || item.invoiceNumber || item.barcode || `#${idx + 1}`}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 line-clamp-1">{item.description}</div>
                        <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                          <span>Vencimento: <span className="text-slate-300 font-medium">{formatDate(item.dueDate)}</span></span>
                          <span>Categoria: <span className="text-slate-300 font-medium">{item.category || item.category_name || 'Geral'}</span></span>
                        </div>
                      </div>

                      <div className="text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                        <div className="text-base font-bold text-white tracking-tight">
                          {formatCurrency(itemAmount)}
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          item.status === 'paid' || item.status === 'received'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : item.status === 'partial'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-500/10 text-slate-300 border border-slate-600/40'
                        }`}>
                          {item.status === 'paid' || item.status === 'received'
                            ? 'Liquidado'
                            : item.status === 'partial'
                            ? `Parcial (${formatCurrency(itemPaid)})`
                            : 'Em Aberto'}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Footer do Modal com Botão de Ação Rápida */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <button
                onClick={() => setModalDetail({ ...modalDetail, isOpen: false })}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                Fechar
              </button>
              {onNavigateTab && (
                <button
                  onClick={() => {
                    setModalDetail({ ...modalDetail, isOpen: false })
                    if (modalDetail.itemType === 'receivable') {
                      onNavigateTab('customers')
                    } else {
                      onNavigateTab('suppliers')
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition-all shadow-sm"
                >
                  Abrir Módulo Completo <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
