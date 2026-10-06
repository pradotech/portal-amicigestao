import React, { useState, useMemo, useEffect } from 'react'
import {
  Users,
  TrendingUp,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  Phone,
  Mail,
  Filter,
  DollarSign,
  Calendar,
  RefreshCw,
  ShoppingBag,
  FileCheck,
  Send,
  FileText,
  Package,
  Award,
  CalendarDays,
  Percent,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  ShieldCheck
} from 'lucide-react'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { DateFilterBar } from '../../components/DateFilterBar'
import { useDateFilter } from '../../hooks/useDateFilter'

export function BrlumensCustomersView({
  receivables = [],
  rawPessoas = [],
  clientName = 'BR Lumens',
  onUpdateReceivableStatus,
  onSyncApi,
  isSyncing = false
}) {
  const [activeTab, setActiveTab] = useState('receivables') // 'receivables' | 'customers' | 'products'
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  // Estado de paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Reseta a página ao mudar de aba ou filtro
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, filterStatus, searchTerm])

  // Hook centralizado de filtro de data (Padrão: Mês Atual no formato Calendário)
  const dateFilter = useDateFilter('this_month')
  const {
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    activePreset,
    periodLabel,
    handleApplyPreset,
    handlePrevMonth,
    handleNextMonth,
    filterByDate
  } = dateFilter

  // Garante isolamento estrito: apenas títulos da BR Lumens (Bling ERP)
  const allBrlumensReceivables = useMemo(() => {
    return receivables.filter(r => 
      !r.clientId ||
      r.clientId === 'd0000000-0000-0000-0000-000000000002' ||
      r.erpProvider === 'Bling ERP v3' ||
      String(r.id).startsWith('bling-')
    )
  }, [receivables])

  // Filtra lançamentos do Bling pelo período selecionado no DateFilterBar
  const dateFilteredReceivables = useMemo(() => {
    return filterByDate(allBrlumensReceivables, 'dueDate')
  }, [allBrlumensReceivables, filterByDate])

  const filteredReceivables = useMemo(() => {
    return dateFilteredReceivables.filter(receivable => {
      const desc = receivable.description || ''
      const cust = receivable.customer || receivable.customerName || ''
      const cat = receivable.category || ''
      const doc = receivable.orderNumber || receivable.documentNumber || receivable.id || ''
      const matchSearch =
        desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cust.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.toLowerCase().includes(searchTerm.toLowerCase())

      const isPaid = receivable.status === 'paid' || receivable.status === 'received'
      let matchStatus = true
      if (filterStatus === 'received') matchStatus = isPaid
      if (filterStatus === 'pending') matchStatus = !isPaid
      if (filterStatus === 'overdue') matchStatus = receivable.status === 'overdue'

      return matchSearch && matchStatus
    })
  }, [dateFilteredReceivables, searchTerm, filterStatus])

  // Métricas dos Cards da BR Lumens (Bling ERP)
  const nowStr = new Date().toISOString().split('T')[0]

  const metrics = useMemo(() => {
    return dateFilteredReceivables.reduce(
      (acc, item) => {
        const val = Number(item.amount || 0)
        const due = item.dueDate || ''
        const isPaid = item.status === 'paid' || item.status === 'received'

        acc.totalPeriod += val

        if (isPaid) {
          acc.recebido += val
          acc.countRecebido += 1
        } else {
          if (due < nowStr) {
            acc.vencido += val
            acc.countVencido += 1
          } else if (due === nowStr) {
            acc.venceHoje += val
            acc.countVenceHoje += 1
          } else {
            acc.aVencer += val
            acc.countAVencer += 1
          }
        }

        return acc
      },
      {
        vencido: 0,
        countVencido: 0,
        venceHoje: 0,
        countVenceHoje: 0,
        aVencer: 0,
        countAVencer: 0,
        recebido: 0,
        countRecebido: 0,
        totalPeriod: 0
      }
    )
  }, [dateFilteredReceivables, nowStr])

  // Ranking de Clientes
  const customerRanking = useMemo(() => {
    const map = new Map()
    dateFilteredReceivables.forEach(r => {
      const name = r.customer || r.customerName || 'Cliente Bling'
      const amt = Number(r.amount || 0)
      const isPaid = r.status === 'paid' || r.status === 'received'
      const paidAmt = isPaid ? Number(r.amountPaid || r.amount || 0) : 0

      if (!map.has(name)) {
        map.set(name, {
          name,
          totalAmount: 0,
          totalPaid: 0,
          ordersCount: 0,
          document: r.customerDocument || null
        })
      }
      const cur = map.get(name)
      cur.totalAmount += amt
      cur.totalPaid += paidAmt
      cur.ordersCount += 1
    })

    const totalBase = dateFilteredReceivables.reduce((acc, r) => acc + Number(r.amount || 0), 0) || 1

    return Array.from(map.values())
      .map(c => ({
        ...c,
        ticketMedio: c.ordersCount > 0 ? (c.totalAmount / c.ordersCount) : 0,
        sharePercent: (c.totalAmount / totalBase) * 100
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
  }, [dateFilteredReceivables])

  // Ranking de Produtos
  const productRanking = useMemo(() => {
    const map = new Map()
    dateFilteredReceivables.forEach(r => {
      const items = r.items || []
      if (items.length > 0) {
        items.forEach(item => {
          const desc = item.description || 'Produto LED BR Lumens'
          const qty = Number(item.quantity || 1)
          const val = Number(item.totalValue || (qty * Number(item.unitValue || 0)) || 0)
          const code = item.code || 'SKU-LED'

          if (!map.has(desc)) {
            map.set(desc, { description: desc, code, quantity: 0, totalAmount: 0 })
          }
          const cur = map.get(desc)
          cur.quantity += qty
          cur.totalAmount += val
        })
      } else {
        const desc = r.category || 'Módulos & Iluminação LED'
        const val = Number(r.amount || 0)
        if (!map.has(desc)) {
          map.set(desc, { description: desc, code: 'LINHA-LED', quantity: 0, totalAmount: 0 })
        }
        const cur = map.get(desc)
        cur.quantity += 1
        cur.totalAmount += val
      }
    })

    const totalBase = Array.from(map.values()).reduce((acc, p) => acc + p.totalAmount, 0) || 1

    return Array.from(map.values())
      .map(p => ({
        ...p,
        unitAverage: p.quantity > 0 ? (p.totalAmount / p.quantity) : 0,
        sharePercent: (p.totalAmount / totalBase) * 100
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
  }, [dateFilteredReceivables])

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-slate-100">
      
      {/* 1. Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <TrendingUp className="w-8 h-8 text-emerald-400" />
            <span>Vendas, Faturamento & Recebíveis ({clientName})</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Gestão de pedidos faturados, notas fiscais (NF-e) e inteligência de vendas via <strong>Bling ERP v3</strong> em <strong>{periodLabel}</strong>.
          </p>
        </div>

        {onSyncApi && (
          <button
            type="button"
            onClick={onSyncApi}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sincronizando com Bling...' : 'Sincronizar Vendas Bling API'}</span>
          </button>
        )}
      </div>

      {/* 2. Barra Global de Datas em Formato de Calendário */}
      <DateFilterBar
        startDate={startDate}
        endDate={endDate}
        setStartDate={setStartDate}
        setEndDate={setEndDate}
        activePreset={activePreset}
        handleApplyPreset={handleApplyPreset}
        handlePrevMonth={handlePrevMonth}
        handleNextMonth={handleNextMonth}
        periodLabel={periodLabel}
        filteredCount={dateFilteredReceivables.length}
        totalCount={allBrlumensReceivables.length}
        receivablesTotal={metrics.totalPeriod}
        showAmounts={true}
      />

      {/* 3. Cards de Resumo Financeiro */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total do Período */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Faturamento Total</span>
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-white mt-2">
            {formatCurrency(metrics.totalPeriod)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {dateFilteredReceivables.length} pedidos no período
          </div>
        </div>

        {/* Recebidos / Faturados */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recebido / Liquidado</span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-300 mt-2">
            {formatCurrency(metrics.recebido)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {metrics.countRecebido} títulos liquidados
          </div>
        </div>

        {/* A Vencer */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">A Vencer</span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-amber-300 mt-2">
            {formatCurrency(metrics.aVencer)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {metrics.countAVencer} títulos dentro do prazo
          </div>
        </div>

        {/* Vencidos */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vencidos</span>
            <span className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-rose-300 mt-2">
            {formatCurrency(metrics.vencido)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {metrics.countVencido} títulos pendentes
          </div>
        </div>
      </div>

      {/* 4. Abas de Visualização (Recebíveis, NF-e, Clientes, Produtos) */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('receivables')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
            activeTab === 'receivables'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40'
              : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Contas a Receber & Vendas ({filteredReceivables.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('customers')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
            activeTab === 'customers'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40'
              : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Ranking de Clientes ({customerRanking.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
            activeTab === 'products'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40'
              : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Produtos Mais Vendidos ({productRanking.length})</span>
        </button>
      </div>

      {/* 5. Conteúdo da Aba Ativa */}
      {activeTab === 'receivables' && (
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-4">
          
          {/* Barra de Filtros e Busca */}
          {/* Barra de Filtros, Busca e Paginação */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar cliente, número de pedido..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="all">Todas as Situações</option>
                <option value="received">Recebidos / Liquidados</option>
                <option value="pending">Em Aberto</option>
                <option value="overdue">Vencidos</option>
              </select>

              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
              >
                <option value={10}>10 / pág</option>
                <option value={20}>20 / pág</option>
                <option value={50}>50 / pág</option>
                <option value={100}>100 / pág</option>
              </select>
            </div>
          </div>

          {/* Tabela de Recebíveis */}
          {filteredReceivables.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              Nenhum título a receber encontrado com os filtros aplicados.
            </div>
          ) : (
            <>
              {(() => {
                const totalRec = filteredReceivables.length
                const totalPages = Math.max(1, Math.ceil(totalRec / pageSize))
                const safePage = Math.min(currentPage, totalPages)
                const start = (safePage - 1) * pageSize
                const end = Math.min(start + pageSize, totalRec)
                const paginated = filteredReceivables.slice(start, end)

                const getPageNums = () => {
                  const pages = []
                  const max = 5
                  if (totalPages <= max) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i)
                  } else {
                    let s = Math.max(1, safePage - 2)
                    let e = Math.min(totalPages, s + max - 1)
                    if (e - s < max - 1) s = Math.max(1, e - max + 1)
                    for (let i = s; i <= e; i++) pages.push(i)
                  }
                  return pages
                }

                return (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold">
                            <th className="py-3 px-3">Pedido / Doc</th>
                            <th className="py-3 px-3">Cliente Comprador</th>
                            <th className="py-3 px-3 text-center">Emissão</th>
                            <th className="py-3 px-3 text-center">Vencimento</th>
                            <th className="py-3 px-3 text-center">Prazo (Dias)</th>
                            <th className="py-3 px-3 text-center">Status</th>
                            <th className="py-3 px-3 text-right">Valor Nominal</th>
                            <th className="py-3 px-3 text-right">Valor Recebido</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-200">
                          {paginated.map((rec) => {
                            const isPaid = rec.status === 'paid' || rec.status === 'received'
                            return (
                              <tr key={rec.id} className="hover:bg-slate-800/40 transition-colors">
                                <td className="py-3 px-3 font-mono font-semibold text-emerald-400">
                                  {rec.orderNumber || rec.documentNumber || rec.id}
                                </td>
                                <td className="py-3 px-3">
                                  <div className="font-semibold text-white">{rec.customer || rec.customerName || 'Cliente'}</div>
                                  <div className="text-[11px] text-slate-400">{rec.description}</div>
                                </td>
                                <td className="py-3 px-3 text-center text-slate-400">{formatDate(rec.issueDate || rec.dueDate)}</td>
                                <td className="py-3 px-3 text-center font-medium text-slate-300">{formatDate(rec.dueDate)}</td>
                                <td className="py-3 px-3 text-center">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                                    {rec.daysTerm || 30} dias
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-center">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    isPaid
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                  }`}>
                                    {isPaid ? 'Liquidado' : 'Em Aberto'}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-right font-bold text-white">{formatCurrency(rec.amount)}</td>
                                <td className="py-3 px-3 text-right font-bold text-emerald-300">
                                  {formatCurrency(rec.amountPaid || (isPaid ? rec.amount : 0))}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Paginação da Tabela de Recebíveis */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs">
                      <div className="text-slate-400">
                        Página <strong className="text-white">{safePage}</strong> de <strong className="text-white">{totalPages}</strong> • Exibindo {totalRec > 0 ? start + 1 : 0} a {end} de {totalRec} lançamentos
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setCurrentPage(1)}
                          disabled={safePage <= 1}
                          className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-white disabled:opacity-40 transition-colors"
                          title="Primeira página"
                        >
                          <ChevronsLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={safePage <= 1}
                          className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-white disabled:opacity-40 transition-colors"
                          title="Página anterior"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>

                        <div className="flex items-center gap-1">
                          {getPageNums().map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setCurrentPage(num)}
                              className={`min-w-[32px] h-8 px-2 rounded-lg font-bold text-xs transition-all ${
                                num === safePage
                                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40 border border-emerald-500'
                                  : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                              }`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={safePage >= totalPages}
                          className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-white disabled:opacity-40 transition-colors"
                          title="Próxima página"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={safePage >= totalPages}
                          className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-white disabled:opacity-40 transition-colors"
                          title="Última página"
                        >
                          <ChevronsRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </>
                )
              })()}
            </>
          )}
        </div>
      )}

      {/* Aba: Ranking de Clientes */}
      {activeTab === 'customers' && (
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-white text-base">Ranking de Clientes Compradores ({periodLabel})</h3>
              <p className="text-xs text-slate-400">Total faturado, volume de compras e representatividade na receita</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {customerRanking.length} clientes compradores
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold">
                  <th className="py-3 px-3 text-center">Posição</th>
                  <th className="py-3 px-3">Cliente</th>
                  <th className="py-3 px-3 text-center">Pedidos</th>
                  <th className="py-3 px-3 text-right">Ticket Médio</th>
                  <th className="py-3 px-3 text-right">Share (%)</th>
                  <th className="py-3 px-3 text-right">Faturamento Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {customerRanking.map((cust, idx) => (
                  <tr key={cust.name} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 text-center font-bold">
                      <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs ${
                        idx === 0 ? 'bg-amber-500/20 text-amber-300 font-extrabold border border-amber-500/40' :
                        idx === 1 ? 'bg-slate-300/20 text-slate-200 border border-slate-400/40' :
                        idx === 2 ? 'bg-amber-700/20 text-amber-400 border border-amber-700/40' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-white">{cust.name}</div>
                      <div className="text-[11px] text-slate-400">{cust.document || 'Cliente Bling'}</div>
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-slate-300">{cust.ordersCount}</td>
                    <td className="py-3 px-3 text-right font-medium text-slate-300">{formatCurrency(cust.ticketMedio)}</td>
                    <td className="py-3 px-3 text-right font-bold text-cyan-400">{cust.sharePercent.toFixed(1)}%</td>
                    <td className="py-3 px-3 text-right font-extrabold text-emerald-300">{formatCurrency(cust.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Aba: Ranking de Produtos */}
      {activeTab === 'products' && (
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-white text-base">Produtos Líderes de Vendas ({periodLabel})</h3>
              <p className="text-xs text-slate-400">Itens e linhas com maior volume de saída e faturamento gerado</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              {productRanking.length} produtos
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold">
                  <th className="py-3 px-3 text-center">Posição</th>
                  <th className="py-3 px-3">Descrição do Produto</th>
                  <th className="py-3 px-3 text-center">SKU / Código</th>
                  <th className="py-3 px-3 text-center">Unidades</th>
                  <th className="py-3 px-3 text-right">Preço Médio</th>
                  <th className="py-3 px-3 text-right">Share (%)</th>
                  <th className="py-3 px-3 text-right">Faturamento Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {productRanking.map((prod, idx) => (
                  <tr key={prod.description} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 text-center font-bold">
                      <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs ${
                        idx === 0 ? 'bg-cyan-500/20 text-cyan-300 font-extrabold border border-cyan-500/40' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-white">{prod.description}</td>
                    <td className="py-3 px-3 text-center font-mono text-cyan-300 text-[11px]">{prod.code}</td>
                    <td className="py-3 px-3 text-center font-semibold text-slate-300">{prod.quantity}</td>
                    <td className="py-3 px-3 text-right font-medium text-slate-300">{formatCurrency(prod.unitAverage)}</td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-400">{prod.sharePercent.toFixed(1)}%</td>
                    <td className="py-3 px-3 text-right font-extrabold text-cyan-300">{formatCurrency(prod.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  )
}
