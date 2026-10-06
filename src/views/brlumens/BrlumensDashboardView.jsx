import React, { useState, useMemo, useEffect } from 'react'
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
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Receipt,
  FileText,
  DollarSign,
  Users,
  Award,
  BarChart3,
  ArrowUpRight,
  Sparkles,
  CalendarDays,
  Percent,
  CheckCircle2,
  FileCheck,
  LayoutDashboard,
  Filter,
  ArrowDownUp,
  SlidersHorizontal,
  Layers,
  ArrowRight
} from 'lucide-react'
import { formatCurrency, formatCompactCurrency, formatDate, MONTH_NAMES } from '../../utils/formatters'
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

  // Aba ativa de navegação do Dashboard
  const [activeSection, setActiveSection] = useState('overview') // 'overview' | 'customers' | 'products' | 'sales' | 'all'

  // Métrica do Gráfico de 12 Meses: Faturamento vs Quantidade de Pedidos
  const [chartMetric, setChartMetric] = useState('revenue') // 'revenue' | 'orders'

  // Estado de paginação da tabela de vendas
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [tableSearch, setTableSearch] = useState('')
  const [salesStatusFilter, setSalesStatusFilter] = useState('all') // 'all' | 'received' | 'pending'

  // Buscas dedicadas para os rankings
  const [customerSearch, setCustomerSearch] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [productSortBy, setProductSortBy] = useState('revenue') // 'revenue' | 'quantity'

  // Sub-abas de ranking (Mês selecionado vs Geral)
  const [customerRankingScope, setCustomerRankingScope] = useState('period') // 'period' | 'all'
  const [productRankingScope, setProductRankingScope] = useState('period') // 'period' | 'all'

  // Estado do Modal de Detalhamento
  const [modalDetail, setModalDetail] = useState({
    isOpen: false,
    type: null,
    title: '',
    subtitle: '',
    items: [],
    itemType: 'receivable'
  })
  const [modalSearch, setModalSearch] = useState('')

  // Hook centralizado de filtro de datas (Padrão: Mês Atual com Data Início e Fim)
  const dateFilter = useDateFilter('this_month')
  const {
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    selectedYear,
    selectedMonth,
    setSelectedMonth,
    activePreset,
    periodLabel,
    handlePrevMonth,
    handleNextMonth,
    handleApplyPreset,
    filterByDate
  } = dateFilter

  // Isolamento estrito: apenas títulos da BR Lumens
  const allBrlumensReceivables = useMemo(() => {
    return receivables.filter(r => 
      !r.clientId || 
      r.clientId === 'd0000000-0000-0000-0000-000000000002' ||
      r.erpProvider === 'Bling ERP v3' ||
      String(r.id).startsWith('bling-')
    )
  }, [receivables])

  // Filtragem pelo período ativo
  const periodReceivables = useMemo(() => {
    return filterByDate(allBrlumensReceivables, 'dueDate')
  }, [allBrlumensReceivables, filterByDate])

  // Helper de situação
  const isReceived = (r) => r.status === 'received' || r.status === 'paid'

  // =========================================================================
  // 1. CÁLCULOS DO PERÍODO SELECIONADO (MÊS)
  // =========================================================================
  const periodMetrics = useMemo(() => {
    const totalOrders = periodReceivables.length
    const atendidos = periodReceivables.filter(isReceived)
    const pendentes = periodReceivables.filter(r => !isReceived(r))

    const totalFaturado = atendidos.reduce((acc, r) => acc + Number(r.amountPaid || r.amount || 0), 0)
    const totalPendente = pendentes.reduce((acc, r) => acc + Number(r.amountRemaining || r.amount || 0), 0)
    const totalGeralPeriodo = periodReceivables.reduce((acc, r) => acc + Number(r.amount || 0), 0)

    const ticketMedioPeriodo = totalOrders > 0 ? (totalGeralPeriodo / totalOrders) : 0
    const ticketMedioAtendido = atendidos.length > 0 ? (totalFaturado / atendidos.length) : 0

    // Prazo Médio de Recebimento (PMR) ponderado em dias
    let totalWeightedDays = 0
    let totalWeightAmount = 0
    periodReceivables.forEach(r => {
      const amt = Number(r.amount || 0)
      const days = Number(r.daysTerm || 30)
      if (amt > 0) {
        totalWeightedDays += days * amt
        totalWeightAmount += amt
      }
    })
    const pmrPeriodo = totalWeightAmount > 0 ? Math.round(totalWeightedDays / totalWeightAmount) : 0

    return {
      totalOrders,
      atendidosCount: atendidos.length,
      pendentesCount: pendentes.length,
      totalFaturado,
      totalPendente,
      totalGeralPeriodo,
      ticketMedioPeriodo,
      ticketMedioAtendido,
      pmrPeriodo
    }
  }, [periodReceivables])

  // =========================================================================
  // 2. CÁLCULOS ACUMULADOS HISTÓRICOS (GERAL)
  // =========================================================================
  const generalMetrics = useMemo(() => {
    const totalOrdersAll = allBrlumensReceivables.length
    const atendidosAll = allBrlumensReceivables.filter(isReceived)
    const pendentesAll = allBrlumensReceivables.filter(r => !isReceived(r))

    const totalFaturadoGeral = atendidosAll.reduce((acc, r) => acc + Number(r.amountPaid || r.amount || 0), 0)
    const totalPendenteGeral = pendentesAll.reduce((acc, r) => acc + Number(r.amountRemaining || r.amount || 0), 0)
    const totalGeralAcumulado = allBrlumensReceivables.reduce((acc, r) => acc + Number(r.amount || 0), 0)

    const ticketMedioGeral = totalOrdersAll > 0 ? (totalGeralAcumulado / totalOrdersAll) : 0

    let totalWeightedDays = 0
    let totalWeightAmount = 0
    allBrlumensReceivables.forEach(r => {
      const amt = Number(r.amount || 0)
      const days = Number(r.daysTerm || 30)
      if (amt > 0) {
        totalWeightedDays += days * amt
        totalWeightAmount += amt
      }
    })
    const pmrGeral = totalWeightAmount > 0 ? Math.round(totalWeightedDays / totalWeightAmount) : 0

    return {
      totalOrdersAll,
      atendidosAllCount: atendidosAll.length,
      pendentesAllCount: pendentesAll.length,
      totalFaturadoGeral,
      totalPendenteGeral,
      totalGeralAcumulado,
      ticketMedioGeral,
      pmrGeral
    }
  }, [allBrlumensReceivables])

  // =========================================================================
  // 3. RANKING DE CLIENTES (MÊS vs GERAL)
  // =========================================================================
  const getCustomerRanking = (items) => {
    const customerMap = new Map()
    items.forEach(r => {
      const name = r.customer || r.customerName || 'Cliente Bling'
      const amt = Number(r.amount || 0)
      const isPaid = isReceived(r)
      const paidAmt = isPaid ? (Number(r.amountPaid || r.amount || 0)) : 0

      if (!customerMap.has(name)) {
        customerMap.set(name, {
          name,
          totalAmount: 0,
          totalPaid: 0,
          ordersCount: 0,
          document: r.customerDocument || null
        })
      }
      const cur = customerMap.get(name)
      cur.totalAmount += amt
      cur.totalPaid += paidAmt
      cur.ordersCount += 1
    })

    const totalBase = items.reduce((acc, r) => acc + Number(r.amount || 0), 0) || 1

    return Array.from(customerMap.values())
      .map(c => ({
        ...c,
        ticketMedio: c.ordersCount > 0 ? (c.totalAmount / c.ordersCount) : 0,
        sharePercent: (c.totalAmount / totalBase) * 100
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
  }

  const rankingCustomersPeriod = useMemo(() => getCustomerRanking(periodReceivables), [periodReceivables])
  const rankingCustomersAll = useMemo(() => getCustomerRanking(allBrlumensReceivables), [allBrlumensReceivables])
  const activeCustomerRanking = customerRankingScope === 'period' ? rankingCustomersPeriod : rankingCustomersAll
  const topCustomer = activeCustomerRanking[0] || null

  // Filtro de busca na lista de clientes
  const filteredCustomersList = useMemo(() => {
    if (!customerSearch.trim()) return activeCustomerRanking
    const q = customerSearch.toLowerCase()
    return activeCustomerRanking.filter(c => 
      c.name.toLowerCase().includes(q) || (c.document && c.document.toLowerCase().includes(q))
    )
  }, [activeCustomerRanking, customerSearch])

  // Estatísticas de Clientes
  const customerStats = useMemo(() => {
    const top3 = activeCustomerRanking.slice(0, 3)
    const top3Share = top3.reduce((acc, c) => acc + c.sharePercent, 0)
    const activeCount = activeCustomerRanking.length
    const totalRev = activeCustomerRanking.reduce((acc, c) => acc + c.totalAmount, 0)
    const avgPerCustomer = activeCount > 0 ? (totalRev / activeCount) : 0
    return { top3Share, activeCount, avgPerCustomer }
  }, [activeCustomerRanking])

  // =========================================================================
  // 4. RANKING DE PRODUTOS MAIS VENDIDOS (MÊS vs GERAL)
  // =========================================================================
  const getProductRanking = (items) => {
    const productMap = new Map()

    items.forEach(r => {
      const orderItems = r.items || []
      if (orderItems.length > 0) {
        orderItems.forEach(item => {
          const desc = item.description || 'Produto LED BR Lumens'
          const qty = Number(item.quantity || 1)
          const val = Number(item.totalValue || (qty * Number(item.unitValue || 0)) || 0)
          const code = item.code || 'SKU-LED'

          if (!productMap.has(desc)) {
            productMap.set(desc, {
              description: desc,
              code,
              quantity: 0,
              totalAmount: 0
            })
          }
          const cur = productMap.get(desc)
          cur.quantity += qty
          cur.totalAmount += val
        })
      } else {
        const desc = r.category || 'Módulos & Painéis LED'
        const val = Number(r.amount || 0)
        if (!productMap.has(desc)) {
          productMap.set(desc, {
            description: desc,
            code: 'LINHA-LED',
            quantity: 0,
            totalAmount: 0
          })
        }
        const cur = productMap.get(desc)
        cur.quantity += 1
        cur.totalAmount += val
      }
    })

    const totalProdBase = Array.from(productMap.values()).reduce((acc, p) => acc + p.totalAmount, 0) || 1

    return Array.from(productMap.values())
      .map(p => ({
        ...p,
        unitAverage: p.quantity > 0 ? (p.totalAmount / p.quantity) : 0,
        sharePercent: (p.totalAmount / totalProdBase) * 100
      }))
  }

  const rankingProductsPeriod = useMemo(() => getProductRanking(periodReceivables), [periodReceivables])
  const rankingProductsAll = useMemo(() => getProductRanking(allBrlumensReceivables), [allBrlumensReceivables])
  const baseProductRanking = productRankingScope === 'period' ? rankingProductsPeriod : rankingProductsAll

  // Ordenação de produtos (por faturamento ou volume)
  const sortedProductRanking = useMemo(() => {
    return [...baseProductRanking].sort((a, b) => {
      if (productSortBy === 'quantity') return b.quantity - a.quantity
      return b.totalAmount - a.totalAmount
    })
  }, [baseProductRanking, productSortBy])

  const topProduct = sortedProductRanking[0] || null

  // Filtro de busca na lista de produtos
  const filteredProductsList = useMemo(() => {
    if (!productSearch.trim()) return sortedProductRanking
    const q = productSearch.toLowerCase()
    return sortedProductRanking.filter(p => 
      p.description.toLowerCase().includes(q) || (p.code && p.code.toLowerCase().includes(q))
    )
  }, [sortedProductRanking, productSearch])

  // Estatísticas de Produtos
  const productStats = useMemo(() => {
    const totalUnits = sortedProductRanking.reduce((acc, p) => acc + p.quantity, 0)
    const totalRev = sortedProductRanking.reduce((acc, p) => acc + p.totalAmount, 0)
    const avgPrice = totalUnits > 0 ? (totalRev / totalUnits) : 0
    const totalSkus = sortedProductRanking.length
    return { totalUnits, totalRev, avgPrice, totalSkus }
  }, [sortedProductRanking])

  // =========================================================================
  // 5. HISTÓRICO MÊS A MÊS (EVOLUÇÃO DOS 12 MESES)
  // =========================================================================
  const monthlyHistory = useMemo(() => {
    const history = []
    for (let m = 1; m <= 12; m++) {
      const monthStr = `${selectedYear}-${String(m).padStart(2, '0')}`
      const monthItems = allBrlumensReceivables.filter(r => {
        const d = r.dueDate || r.issueDate || ''
        return d.startsWith(monthStr)
      })

      const monthOrders = monthItems.length
      const monthTotal = monthItems.reduce((acc, r) => acc + Number(r.amount || 0), 0)
      const monthPaid = monthItems.filter(isReceived).reduce((acc, r) => acc + Number(r.amountPaid || r.amount || 0), 0)
      const monthTicketMedio = monthOrders > 0 ? (monthTotal / monthOrders) : 0

      history.push({
        monthNumber: m,
        monthName: MONTH_NAMES[m - 1],
        shortName: MONTH_NAMES[m - 1].slice(0, 3),
        year: selectedYear,
        ordersCount: monthOrders,
        total: monthTotal,
        paid: monthPaid,
        ticketMedio: monthTicketMedio
      })
    }

    const maxTotal = Math.max(...history.map(h => h.total), 1)
    const maxOrders = Math.max(...history.map(h => h.ordersCount), 1)

    return history.map(h => ({
      ...h,
      percentOfMax: (h.total / maxTotal) * 100,
      percentOfMaxOrders: (h.ordersCount / maxOrders) * 100
    }))
  }, [allBrlumensReceivables, selectedYear])

  // =========================================================================
  // 6. MODAL DE DRILL-DOWN
  // =========================================================================
  const modalFilteredItems = useMemo(() => {
    if (!modalSearch.trim()) return modalDetail.items
    const q = modalSearch.toLowerCase()
    return modalDetail.items.filter(item => {
      const name = (item.customer || item.customerName || item.description || '').toLowerCase()
      const doc = (item.orderNumber || item.documentNumber || item.id || '').toLowerCase()
      const desc = (item.category || item.status || '').toLowerCase()
      return name.includes(q) || doc.includes(q) || desc.includes(q)
    })
  }, [modalDetail.items, modalSearch])

  const handleOpenDetail = (type, customPayload = null) => {
    setModalSearch('')
    if (type === 'faturamento') {
      const items = periodReceivables.filter(isReceived)
      setModalDetail({
        isOpen: true,
        type: 'faturamento',
        title: 'Faturamento Atendido no Período',
        subtitle: `Títulos liquidados e notas fiscais faturadas em ${periodLabel} • Total: ${formatCurrency(periodMetrics.totalFaturado)}`,
        items,
        itemType: 'receivable'
      })
    } else if (type === 'pedidos_aberto') {
      const items = periodReceivables.filter(r => !isReceived(r))
      setModalDetail({
        isOpen: true,
        type: 'pedidos_aberto',
        title: 'Vendas e Títulos em Aberto',
        subtitle: `Pedidos e parcelas a liquidar em ${periodLabel} • Total: ${formatCurrency(periodMetrics.totalPendente)}`,
        items,
        itemType: 'receivable'
      })
    } else if (type === 'ticket_medio') {
      setModalDetail({
        isOpen: true,
        type: 'ticket_medio',
        title: 'Lançamentos para Cálculo de Ticket Médio',
        subtitle: `Base de pedidos de ${periodLabel} • ${periodMetrics.totalOrders} pedidos • Ticket Médio: ${formatCurrency(periodMetrics.ticketMedioPeriodo)}`,
        items: periodReceivables,
        itemType: 'receivable'
      })
    } else if (type === 'pmr') {
      setModalDetail({
        isOpen: true,
        type: 'pmr',
        title: 'Prazo Médio de Recebimento (PMR)',
        subtitle: `Média ponderada de dias entre faturamento e liquidação • PMR Médio: ${periodMetrics.pmrPeriodo} dias`,
        items: periodReceivables,
        itemType: 'receivable'
      })
    } else if (type === 'cliente_pedidos' && customPayload) {
      const clientItems = allBrlumensReceivables.filter(r => (r.customer || r.customerName) === customPayload.name)
      setModalDetail({
        isOpen: true,
        type: 'cliente_pedidos',
        title: `Histórico de Compras: ${customPayload.name}`,
        subtitle: `Total Comprado: ${formatCurrency(customPayload.totalAmount)} • ${customPayload.ordersCount} pedidos registrados`,
        items: clientItems,
        itemType: 'receivable'
      })
    }
  }

  // Reseta a página para 1 sempre que o filtro de data ou busca mudar
  useEffect(() => {
    setCurrentPage(1)
  }, [startDate, endDate, activePreset, salesStatusFilter, tableSearch])

  // Lançamentos filtrados pela busca rápida e status da tabela
  const tableFilteredReceivables = useMemo(() => {
    return periodReceivables.filter(r => {
      // Filtro de status
      const isPaid = isReceived(r)
      if (salesStatusFilter === 'received' && !isPaid) return false
      if (salesStatusFilter === 'pending' && isPaid) return false

      // Filtro de busca de texto
      if (!tableSearch.trim()) return true
      const q = tableSearch.toLowerCase()
      const name = (r.customer || r.customerName || '').toLowerCase()
      const desc = (r.description || '').toLowerCase()
      const doc = (r.orderNumber || r.documentNumber || r.id || '').toLowerCase()
      return name.includes(q) || desc.includes(q) || doc.includes(q)
    })
  }, [periodReceivables, tableSearch, salesStatusFilter])

  // Cálculos de paginação da tabela
  const totalTableItems = tableFilteredReceivables.length
  const totalPages = Math.max(1, Math.ceil(totalTableItems / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalTableItems)

  const paginatedReceivables = useMemo(() => {
    return tableFilteredReceivables.slice(startIndex, endIndex)
  }, [tableFilteredReceivables, startIndex, endIndex])

  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      let start = Math.max(1, safeCurrentPage - 2)
      let end = Math.min(totalPages, start + maxVisible - 1)
      if (end - start < maxVisible - 1) {
        start = Math.max(1, end - maxVisible + 1)
      }
      for (let i = start; i <= end; i++) pages.push(i)
    }
    return pages
  }

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      
      {/* 1. Header com Identificação da BR Lumens e Status Bling v3 */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-500/20 shadow-2xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Zap className="w-4 h-4" />
              <span>Divisão Amici Comex • Inteligência de Vendas & Faturamento</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {currentClient.legalName || 'BR Lumens Comércio e Importação de Iluminação Ltda'}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Painel de Vendas, NF-e, Ticket Médio, Clientes e Prazos • Dados sincronizados via <span className="text-emerald-400 font-semibold">Bling API v3</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Bling ERP v3 Ativo
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('customers')}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5"
            >
              <FileCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ver NF-e & Títulos</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Barra Global de Navegação de Datas em Formato de Calendário */}
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
        filteredCount={periodReceivables.length}
        totalCount={allBrlumensReceivables.length}
        receivablesTotal={periodMetrics.totalGeralPeriodo}
        showAmounts={true}
      />

      {/* 3. BARRA DE NAVEGAÇÃO DE VISÕES (SUB-TABS INTUITIVAS) */}
      <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-2xl shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveSection('overview')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSection === 'overview'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50 scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Visão Geral & KPIs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('customers')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSection === 'customers'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50 scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Ranking de Clientes</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              activeSection === 'customers' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              {activeCustomerRanking.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('products')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSection === 'products'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-950/50 scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Produtos & Linhas LED</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              activeSection === 'products' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              {sortedProductRanking.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('sales')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSection === 'sales'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-950/50 scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Extrato de Vendas & NF-e</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              activeSection === 'sales' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              {periodReceivables.length}
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setActiveSection(activeSection === 'all' ? 'overview' : 'all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
            activeSection === 'all'
              ? 'bg-slate-800 text-emerald-400 border-emerald-500/40'
              : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
          }`}
          title="Alternar entre visualização por abas ou tudo em uma só página"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{activeSection === 'all' ? 'Modo em Abas' : 'Ver Tudo Integrado'}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SEÇÃO 1: VISÃO GERAL & KPIS (Faturamento, Ticket Médio, PMR, Gráfico 12M) */}
      {/* ========================================================================= */}
      {(activeSection === 'overview' || activeSection === 'all') && (
        <div className="space-y-6">
          {/* Cards de Indicadores Principais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Faturamento Atendido */}
            <div
              onClick={() => handleOpenDetail('faturamento')}
              className="group cursor-pointer p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/60 hover:bg-slate-850/90 transition-all duration-200 shadow-xl hover:shadow-emerald-500/10 hover:scale-[1.015] relative overflow-hidden flex flex-col justify-between min-h-[160px]"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-emerald-400 transition-colors">
                    Faturamento Atendido
                  </span>
                  <span className="shrink-0 p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 group-hover:scale-110 transition-all">
                    <TrendingUp className="w-4 h-4" />
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-xl sm:text-2xl xl:text-3xl font-extrabold text-white tracking-tight group-hover:text-emerald-300 transition-colors break-words">
                    {formatCurrency(periodMetrics.totalFaturado)}
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400 gap-1.5">
                  <span>{periodMetrics.atendidosCount} pedidos faturados</span>
                  <span className="shrink-0 text-emerald-400 font-semibold inline-flex items-center gap-0.5 group-hover:underline text-[11px]">
                    Detalhes <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center justify-between gap-1 pt-1 border-t border-slate-800/40">
                  <span className="text-slate-500 shrink-0">Acumulado Geral:</span>
                  <strong className="text-slate-300 font-semibold text-right">
                    {formatCurrency(generalMetrics.totalFaturadoGeral)}
                  </strong>
                </div>
              </div>
            </div>

            {/* Card 2: Vendas / Pedidos em Aberto */}
            <div
              onClick={() => handleOpenDetail('pedidos_aberto')}
              className="group cursor-pointer p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/60 hover:bg-slate-850/90 transition-all duration-200 shadow-xl hover:shadow-amber-500/10 hover:scale-[1.015] relative overflow-hidden flex flex-col justify-between min-h-[160px]"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-amber-400 transition-colors">
                    Vendas em Aberto
                  </span>
                  <span className="shrink-0 p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 group-hover:scale-110 transition-all">
                    <Clock className="w-4 h-4" />
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-xl sm:text-2xl xl:text-3xl font-extrabold text-amber-300 tracking-tight break-words">
                    {formatCurrency(periodMetrics.totalPendente)}
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400 gap-1.5">
                  <span>{periodMetrics.pendentesCount} títulos a liquidar</span>
                  <span className="shrink-0 text-amber-400 font-semibold inline-flex items-center gap-0.5 group-hover:underline text-[11px]">
                    Detalhes <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center justify-between gap-1 pt-1 border-t border-slate-800/40">
                  <span className="text-slate-500 shrink-0">Carteira Geral:</span>
                  <strong className="text-slate-300 font-semibold text-right">
                    {formatCurrency(generalMetrics.totalPendenteGeral)}
                  </strong>
                </div>
              </div>
            </div>

            {/* Card 3: Ticket Médio por Venda */}
            <div
              onClick={() => handleOpenDetail('ticket_medio')}
              className="group cursor-pointer p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/60 hover:bg-slate-850/90 transition-all duration-200 shadow-xl hover:shadow-cyan-500/10 hover:scale-[1.015] relative overflow-hidden flex flex-col justify-between min-h-[160px]"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-cyan-400 transition-colors">
                    Ticket Médio
                  </span>
                  <span className="shrink-0 p-2 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 group-hover:scale-110 transition-all">
                    <ShoppingBag className="w-4 h-4" />
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-xl sm:text-2xl xl:text-3xl font-extrabold text-white tracking-tight group-hover:text-cyan-300 transition-colors break-words">
                    {formatCurrency(periodMetrics.ticketMedioPeriodo)}
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400 gap-1.5">
                  <span>Média ({periodMetrics.totalOrders} pedidos)</span>
                  <span className="shrink-0 text-cyan-400 font-semibold inline-flex items-center gap-0.5 group-hover:underline text-[11px]">
                    Ver pedidos <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center justify-between gap-1 pt-1 border-t border-slate-800/40">
                  <span className="text-slate-500 shrink-0">TM Geral:</span>
                  <strong className="text-slate-300 font-semibold text-right">
                    {formatCurrency(generalMetrics.ticketMedioGeral)}
                  </strong>
                </div>
              </div>
            </div>

            {/* Card 4: Prazo Médio de Recebimento (PMR) */}
            <div
              onClick={() => handleOpenDetail('pmr')}
              className="group cursor-pointer p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-purple-500/60 hover:bg-slate-850/90 transition-all duration-200 shadow-xl hover:shadow-purple-500/10 hover:scale-[1.015] relative overflow-hidden flex flex-col justify-between min-h-[160px]"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-purple-400 transition-colors">
                    Prazo Médio (PMR)
                  </span>
                  <span className="shrink-0 p-2 rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 group-hover:scale-110 transition-all">
                    <CalendarDays className="w-4 h-4" />
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-xl sm:text-2xl xl:text-3xl font-extrabold text-purple-300 tracking-tight break-words">
                    {periodMetrics.pmrPeriodo} <span className="text-base font-semibold text-slate-400">dias</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400 gap-1.5">
                  <span>Prazo de recebimento</span>
                  <span className="shrink-0 text-purple-400 font-semibold inline-flex items-center gap-0.5 group-hover:underline text-[11px]">
                    Análise <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center justify-between gap-1 pt-1 border-t border-slate-800/40">
                  <span className="text-slate-500 shrink-0">PMR Geral:</span>
                  <strong className="text-slate-300 font-semibold text-right">
                    {generalMetrics.pmrGeral} dias
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Destaques Comerciais Rápidos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Destaque Top 1 Cliente */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/30 shadow-xl relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                    <Award className="w-4 h-4 text-emerald-400" />
                    <span>Cliente Líder de Compras ({periodLabel})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveSection('customers')}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                  >
                    <span>Ver ranking</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {topCustomer ? (
                  <div className="pt-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-lg font-bold text-white tracking-tight truncate">
                        {topCustomer.name}
                      </div>
                      <span className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Top 1
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      {topCustomer.document ? `CNPJ/CPF: ${topCustomer.document}` : 'Cliente Faturado Bling'} • {topCustomer.ordersCount} pedidos
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-3 border-t border-slate-800/80">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Comprado</div>
                        <div className="text-sm sm:text-base font-extrabold text-emerald-300">
                          {formatCurrency(topCustomer.totalAmount)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Ticket Médio</div>
                        <div className="text-sm sm:text-base font-bold text-white">
                          {formatCurrency(topCustomer.ticketMedio)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Share Receita</div>
                        <div className="text-sm sm:text-base font-bold text-cyan-400">{topCustomer.sharePercent.toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-400 text-xs">Nenhum cliente registrado no período.</div>
                )}
              </div>
            </div>

            {/* Destaque Top 1 Produto */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-cyan-500/30 shadow-xl relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                    <Package className="w-4 h-4 text-cyan-400" />
                    <span>Produto Mais Vendido ({periodLabel})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveSection('products')}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                  >
                    <span>Ver catálogo</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {topProduct ? (
                  <div className="pt-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-lg font-bold text-white tracking-tight truncate">
                        {topProduct.description}
                      </div>
                      <span className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                        Campeão
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      Código: <span className="font-mono text-cyan-300">{topProduct.code}</span> • {topProduct.quantity} unidades vendidas
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-3 border-t border-slate-800/80">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Faturamento</div>
                        <div className="text-sm sm:text-base font-extrabold text-cyan-300">
                          {formatCurrency(topProduct.totalAmount)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Preço Médio</div>
                        <div className="text-sm sm:text-base font-bold text-white">
                          {formatCurrency(topProduct.unitAverage)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Share Vendas</div>
                        <div className="text-sm sm:text-base font-bold text-emerald-400">{topProduct.sharePercent.toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-400 text-xs">Nenhum produto registrado no período.</div>
                )}
              </div>
            </div>
          </div>

          {/* Painel de Evolução do Faturamento Mês a Mês (Histórico Completo de 12 Meses com Valores Completos) */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Evolução das Vendas Mês a Mês ({selectedYear})
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Exibição completa de faturamento e pedidos de cada mês • Clique em qualquer mês para filtrar o painel
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Seletor de Métrica do Gráfico */}
                <div className="flex rounded-lg bg-slate-800 p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setChartMetric('revenue')}
                    className={`px-3 py-1 rounded-md font-semibold transition-all ${
                      chartMetric === 'revenue' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    R$ Faturamento
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartMetric('orders')}
                    className={`px-3 py-1 rounded-md font-semibold transition-all ${
                      chartMetric === 'orders' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Qtd Pedidos
                  </button>
                </div>

                <div className="text-xs text-slate-300 font-semibold bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 shrink-0">
                  Total ({selectedYear}): <span className="text-emerald-400 font-bold">{formatCurrency(generalMetrics.totalGeralAcumulado)}</span>
                </div>
              </div>
            </div>

            {/* Gráfico de Barras com Scroll Horizontal e Colunas Espaçosas que Cabem o Valor Todo */}
            <div className="overflow-x-auto pb-4 pt-1 -mx-2 px-2">
              <div className="grid grid-cols-12 gap-3 min-w-[1720px]">
                {monthlyHistory.map((m) => {
                  const isCurrentSelected = selectedMonth === m.monthNumber
                  const barHeight = chartMetric === 'revenue' ? m.percentOfMax : m.percentOfMaxOrders

                  return (
                    <div
                      key={m.monthNumber}
                      onClick={() => setSelectedMonth(m.monthNumber)}
                      className={`cursor-pointer p-3.5 rounded-2xl border transition-all duration-200 flex flex-col justify-between text-center relative group min-w-[136px] ${
                        isCurrentSelected
                          ? 'bg-emerald-950/60 border-emerald-500 shadow-lg shadow-emerald-950/50 scale-[1.02]'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                      }`}
                    >
                      {isCurrentSelected && (
                        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      )}
                      <div className="text-xs font-bold text-slate-300 group-hover:text-emerald-400 transition-colors uppercase tracking-wider">
                        {m.monthName}
                      </div>

                      <div className="my-3 flex flex-col items-center justify-end h-24">
                        <div className="w-full bg-slate-800/80 rounded-t-lg h-full flex items-end overflow-hidden p-0.5">
                          <div
                            className={`w-full rounded-t transition-all duration-300 ${
                              isCurrentSelected
                                ? chartMetric === 'revenue'
                                  ? 'bg-gradient-to-t from-emerald-600 to-teal-400'
                                  : 'bg-gradient-to-t from-cyan-600 to-blue-400'
                                : chartMetric === 'revenue'
                                ? 'bg-gradient-to-t from-slate-700 to-slate-500 group-hover:from-emerald-700 group-hover:to-teal-500'
                                : 'bg-gradient-to-t from-slate-700 to-slate-500 group-hover:from-cyan-700 group-hover:to-blue-500'
                            }`}
                            style={{ height: `${Math.max(8, barHeight)}%` }}
                          />
                        </div>
                      </div>

                      <div className="space-y-1 pt-1 border-t border-slate-800/60">
                        <div className="text-xs font-black text-white group-hover:text-emerald-300 block whitespace-nowrap">
                          {chartMetric === 'revenue' ? formatCurrency(m.total) : `${m.ordersCount} pedidos`}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
                          {chartMetric === 'revenue' ? `${m.ordersCount} pedidos` : formatCurrency(m.total)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-semibold whitespace-nowrap group-hover:text-slate-200 transition-colors">
                          TM: {formatCurrency(m.ticketMedio)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEÇÃO 2: RANKING COMPLETO DE CLIENTES */}
      {/* ========================================================================= */}
      {(activeSection === 'customers' || activeSection === 'all') && (
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-5">
          {/* Header do Ranking com Filtros de Escopo e Busca */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Ranking de Clientes Compradores ({customerRankingScope === 'period' ? periodLabel : 'Histórico Geral'})
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Análise de faturamento por cliente, ticket médio individual e representatividade de receita
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Campo de Busca de Cliente */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar cliente por nome ou CNPJ..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
                {customerSearch && (
                  <button
                    type="button"
                    onClick={() => setCustomerSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Toggle No Mês vs Geral */}
              <div className="flex rounded-lg bg-slate-800 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setCustomerRankingScope('period')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${customerRankingScope === 'period' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  No Mês
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerRankingScope('all')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${customerRankingScope === 'all' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  Geral
                </button>
              </div>
            </div>
          </div>

          {/* Mini-Cards de Estatísticas de Clientes com Valores Completos */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Clientes Ativos</div>
              <div className="text-lg font-black text-white mt-0.5">{customerStats.activeCount}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Concentração Top 3</div>
              <div className="text-lg font-black text-emerald-400 mt-0.5">{customerStats.top3Share.toFixed(1)}%</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Média por Cliente</div>
              <div className="text-base font-black text-cyan-300 mt-0.5">{formatCurrency(customerStats.avgPerCustomer)}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Cliente Líder</div>
              <div className="text-sm font-bold text-white mt-1 truncate" title={topCustomer?.name || '-'}>
                {topCustomer?.name || '-'}
              </div>
            </div>
          </div>

          {/* Lista de Clientes */}
          {filteredCustomersList.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-sm">
              Nenhum cliente encontrado para o filtro aplicado.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredCustomersList.map((cust, idx) => (
                <div
                  key={cust.name}
                  onClick={() => handleOpenDetail('cliente_pedidos', cust)}
                  className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-emerald-500/50 hover:bg-slate-850 cursor-pointer transition-all duration-200 group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`w-6 h-6 rounded-full font-bold flex items-center justify-center text-xs shrink-0 ${
                          idx === 0
                            ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                            : idx === 1
                            ? 'bg-slate-300 text-black'
                            : idx === 2
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="font-bold text-white group-hover:text-emerald-300 transition-colors truncate">
                            {cust.name}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {cust.document ? `CNPJ/CPF: ${cust.document}` : 'Cliente Bling'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-black text-emerald-400">{formatCurrency(cust.totalAmount)}</div>
                        <div className="text-[10px] text-cyan-400 font-semibold">{cust.sharePercent.toFixed(1)}% do total</div>
                      </div>
                    </div>

                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden my-2">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-400 h-1.5 rounded-full"
                        style={{ width: `${Math.max(3, cust.sharePercent)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60 mt-2">
                    <span>{cust.ordersCount} pedidos realizados</span>
                    <span className="text-slate-300 font-medium">Ticket Médio: <strong className="text-white">{formatCurrency(cust.ticketMedio)}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEÇÃO 3: RANKING DE PRODUTOS & LINHAS LED */}
      {/* ========================================================================= */}
      {(activeSection === 'products' || activeSection === 'all') && (
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-5">
          {/* Header do Ranking de Produtos */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Produtos & Linhas LED Mais Vendidos ({productRankingScope === 'period' ? periodLabel : 'Histórico Geral'})
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Detalhamento de faturamento por SKU, quantidade de peças comercializadas e preço médio unitário
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Campo de Busca de Produto */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar produto ou SKU..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
                {productSearch && (
                  <button
                    type="button"
                    onClick={() => setProductSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Ordenação */}
              <div className="flex rounded-lg bg-slate-800 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setProductSortBy('revenue')}
                  className={`px-2.5 py-1.5 rounded-md font-semibold transition-colors ${productSortBy === 'revenue' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  Por Faturamento
                </button>
                <button
                  type="button"
                  onClick={() => setProductSortBy('quantity')}
                  className={`px-2.5 py-1.5 rounded-md font-semibold transition-colors ${productSortBy === 'quantity' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  Por Volume (Qtd)
                </button>
              </div>

              {/* Toggle No Mês vs Geral */}
              <div className="flex rounded-lg bg-slate-800 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setProductRankingScope('period')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${productRankingScope === 'period' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  No Mês
                </button>
                <button
                  type="button"
                  onClick={() => setProductRankingScope('all')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${productRankingScope === 'all' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  Geral
                </button>
              </div>
            </div>
          </div>

          {/* Mini-Cards de Estatísticas de Produtos */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">SKUs Comercializados</div>
              <div className="text-lg font-black text-white mt-0.5">{productStats.totalSkus}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Volume Total Entregue</div>
              <div className="text-lg font-black text-cyan-400 mt-0.5">{productStats.totalUnits} un</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Preço Médio / Un</div>
              <div className="text-lg font-black text-emerald-400 mt-0.5">{formatCurrency(productStats.avgPrice)}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Produto Campeão</div>
              <div className="text-sm font-bold text-white mt-1 truncate" title={topProduct?.description || '-'}>
                {topProduct?.description || '-'}
              </div>
            </div>
          </div>

          {/* Lista de Produtos */}
          {filteredProductsList.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-sm">
              Nenhum produto encontrado para o filtro aplicado.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredProductsList.map((prod, idx) => (
                <div
                  key={prod.description}
                  className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-cyan-500/50 hover:bg-slate-850 transition-all duration-200 group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`w-6 h-6 rounded-full font-bold flex items-center justify-center text-xs shrink-0 ${
                          idx === 0
                            ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                            : idx === 1
                            ? 'bg-slate-300 text-black'
                            : idx === 2
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                            {prod.description}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            Código / SKU: <span className="font-mono text-cyan-300 font-semibold">{prod.code}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-black text-cyan-300">{formatCurrency(prod.totalAmount)}</div>
                        <div className="text-[10px] text-emerald-400 font-semibold">{prod.sharePercent.toFixed(1)}% do faturamento</div>
                      </div>
                    </div>

                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden my-2">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-teal-400 h-1.5 rounded-full"
                        style={{ width: `${Math.max(3, prod.sharePercent)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60 mt-2">
                    <span>{prod.quantity} unidades comercializadas</span>
                    <span className="text-slate-300 font-medium">Méd. Unit: <strong className="text-white">{formatCurrency(prod.unitAverage)}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEÇÃO 4: EXTRATO COMPLETO DE VENDAS & NF-E COM PAGINAÇÃO */}
      {/* ========================================================================= */}
      {(activeSection === 'sales' || activeSection === 'all') && (
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-4">
          
          {/* Cabeçalho da Tabela com Filtros de Status, Busca e Seletor de Itens */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-400" />
                <span>Extrato de Vendas & Notas Fiscais ({periodLabel})</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Lançamentos sincronizados via Bling ERP • Mostrando {totalTableItems > 0 ? startIndex + 1 : 0} a {endIndex} de {totalTableItems} pedidos
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Filtro Rápido de Status */}
              <div className="flex rounded-lg bg-slate-800 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setSalesStatusFilter('all')}
                  className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                    salesStatusFilter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Todos ({periodReceivables.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSalesStatusFilter('received')}
                  className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                    salesStatusFilter === 'received' ? 'bg-emerald-600 text-white' : 'text-emerald-400/80 hover:text-white'
                  }`}
                >
                  Faturados ({periodMetrics.atendidosCount})
                </button>
                <button
                  type="button"
                  onClick={() => setSalesStatusFilter('pending')}
                  className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                    salesStatusFilter === 'pending' ? 'bg-amber-600 text-white' : 'text-amber-400/80 hover:text-white'
                  }`}
                >
                  A Liquidar ({periodMetrics.pendentesCount})
                </button>
              </div>

              {/* Campo de Busca Rápida */}
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filtrar por pedido ou cliente..."
                  value={tableSearch}
                  onChange={(e) => {
                    setTableSearch(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
                {tableSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setTableSearch('')
                      setCurrentPage(1)
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Seletor de Itens por Página */}
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span>Exibir:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
                >
                  <option value={10}>10 / pág</option>
                  <option value={20}>20 / pág</option>
                  <option value={50}>50 / pág</option>
                  <option value={100}>100 / pág</option>
                </select>
              </div>
            </div>
          </div>

          {totalTableItems === 0 ? (
            <div className="p-10 text-center text-slate-400 text-sm">
              Nenhum lançamento de faturamento encontrado para os filtros selecionados ({periodLabel}).
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                      <th className="py-3 px-3">Pedido / Doc</th>
                      <th className="py-3 px-3">Cliente Comprador</th>
                      <th className="py-3 px-3 text-center">Emissão</th>
                      <th className="py-3 px-3 text-center">Vencimento</th>
                      <th className="py-3 px-3 text-center">Prazo (Dias)</th>
                      <th className="py-3 px-3 text-center">Situação</th>
                      <th className="py-3 px-3 text-right">Valor Total</th>
                      <th className="py-3 px-3 text-right">Valor Recebido</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {paginatedReceivables.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3 font-mono font-semibold text-emerald-400">
                          {rec.orderNumber || rec.documentNumber || rec.id}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-medium text-white">{rec.customer || rec.customerName || 'Cliente Bling'}</div>
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
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            isReceived(rec)
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          }`}>
                            {isReceived(rec) ? 'Faturado / Recebido' : 'Em Aberto'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-white">{formatCurrency(rec.amount)}</td>
                        <td className="py-3 px-3 text-right font-bold text-emerald-300">
                          {formatCurrency(rec.amountPaid || (isReceived(rec) ? rec.amount : 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-700 bg-slate-800/50 font-bold text-white text-xs">
                      <td colSpan={6} className="py-3.5 px-3 text-right">TOTAL DO PERÍODO ({totalTableItems} lançamentos):</td>
                      <td className="py-3.5 px-3 text-right text-white text-sm">{formatCurrency(periodMetrics.totalGeralPeriodo)}</td>
                      <td className="py-3.5 px-3 text-right text-emerald-400 text-sm">{formatCurrency(periodMetrics.totalFaturado)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Barra de Navegação e Paginação */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs">
                <div className="text-slate-400">
                  Página <strong className="text-white">{safeCurrentPage}</strong> de <strong className="text-white">{totalPages}</strong> • Exibindo {totalTableItems > 0 ? startIndex + 1 : 0} a {endIndex} de {totalTableItems}
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Primeira Página */}
                  <button
                    type="button"
                    onClick={() => setCurrentPage(1)}
                    disabled={safeCurrentPage <= 1}
                    className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                    title="Primeira página"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>

                  {/* Página Anterior */}
                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={safeCurrentPage <= 1}
                    className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                    title="Página anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Números das Páginas */}
                  <div className="flex items-center gap-1">
                    {getPageNumbers().map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setCurrentPage(num)}
                        className={`min-w-[32px] h-8 px-2 rounded-lg font-bold text-xs transition-all ${
                          num === safeCurrentPage
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40 border border-emerald-500'
                            : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>

                  {/* Próxima Página */}
                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={safeCurrentPage >= totalPages}
                    className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                    title="Próxima página"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {/* Última Página */}
                  <button
                    type="button"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={safeCurrentPage >= totalPages}
                    className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                    title="Última página"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. MODAL DE DETALHAMENTO RICO */}
      {/* ========================================================================= */}
      {modalDetail.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-4xl max-h-[85vh] flex flex-col bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-scale-up">
            
            {/* Header do Modal */}
            <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
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

            {/* Busca Interna */}
            <div className="p-4 border-b border-slate-800 bg-slate-950/40">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por cliente, documento ou descrição..."
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Conteúdo da Tabela do Modal */}
            <div className="flex-1 overflow-y-auto p-4">
              {modalFilteredItems.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Nenhum registro encontrado para a busca especificada.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold">
                        <th className="py-2.5 px-3">Doc / Pedido</th>
                        <th className="py-2.5 px-3">Cliente / Descrição</th>
                        <th className="py-2.5 px-3 text-center">Vencimento</th>
                        <th className="py-2.5 px-3 text-center">Prazo (PMR)</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50 text-slate-200">
                      {modalFilteredItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-800/30">
                          <td className="py-2.5 px-3 font-mono text-emerald-400 font-semibold">
                            {item.orderNumber || item.documentNumber || item.id}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-white">{item.customer || item.customerName || 'Cliente'}</div>
                            <div className="text-[11px] text-slate-400">{item.description}</div>
                          </td>
                          <td className="py-2.5 px-3 text-center">{formatDate(item.dueDate)}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-300">
                              {item.daysTerm || 30} dias
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isReceived(item) ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                            }`}>
                              {isReceived(item) ? 'Liquidado' : 'Em Aberto'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-white">
                            {formatCurrency(item.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer do Modal */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs">
              <span className="text-slate-400">{modalFilteredItems.length} registros listados</span>
              <button
                onClick={() => setModalDetail({ ...modalDetail, isOpen: false })}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
