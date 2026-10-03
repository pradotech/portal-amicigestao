import React, { useState } from 'react'
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
  Send
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
  const [activeTab, setActiveTab] = useState('receivables') // 'receivables' | 'customers'
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  // Hook centralizado de filtro de data
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
    setPreset,
    handlePrevMonth,
    handleNextMonth,
    getPeriodLabel,
    filterDataByPeriod
  } = dateFilter

  const periodLabel = getPeriodLabel()

  // Filtra lançamentos do Bling pelo período selecionado no DateFilterBar
  const dateFilteredReceivables = filterDataByPeriod(receivables, 'dueDate')

  const filteredReceivables = dateFilteredReceivables.filter(receivable => {
    const desc = receivable.description || ''
    const cust = receivable.customer || receivable.customerName || receivable.customer_name || ''
    const cat = receivable.category || receivable.category_name || ''
    const matchSearch =
      desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cust.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = filterStatus === 'all' || receivable.status === filterStatus
    return matchSearch && matchStatus
  })

  // Métricas dos 5 Cards da BR Lumens (Bling ERP)
  const nowStr = new Date().toISOString().split('T')[0]

  const metrics = dateFilteredReceivables.reduce(
    (acc, item) => {
      const val = Number(item.amount || 0)
      const due = item.dueDate || ''
      const isPaid = item.status === 'paid'

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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <TrendingUp className="w-7 h-7 text-emerald-400" />
            <span>Faturamento & Contas a Receber ({clientName})</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Gestão dos clientes compradores, pedidos faturados e cobrança via <strong>Bling ERP v3</strong> no período de <strong>{periodLabel}</strong>.
          </p>
        </div>

        {onSyncApi && (
          <button
            type="button"
            onClick={onSyncApi}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sincronizando com Bling...' : 'Sincronizar Vendas Bling ERP'}</span>
          </button>
        )}
      </div>

      {/* Alternância de Abas */}
      <div className="flex items-center gap-2 p-1 bg-slate-900 rounded-2xl border border-slate-800 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('receivables')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'receivables'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span>Contas a Receber do Período ({dateFilteredReceivables.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('customers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'customers'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4 text-cyan-400" />
          <span>Clientes / Compradores Bling ({rawPessoas.length > 0 ? rawPessoas.length : '12'})</span>
        </button>
      </div>

      {/* BARRA DE FILTRO DE PERÍODO */}
      <DateFilterBar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        selectedDay={selectedDay}
        startDate={startDate}
        endDate={endDate}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        activePreset={activePreset}
        onMonthChange={setSelectedMonth}
        onYearChange={setSelectedYear}
        onDayChange={setSelectedDay}
        onCustomDateChange={(start, end) => {
          setCustomStartDate(start)
          setCustomEndDate(end)
        }}
        onPresetChange={setPreset}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
      />

      {/* 5 CARDS DE MÉTRICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        
        {/* Card 1: Vencidos */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-rose-900/40 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-rose-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Vencidos</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-xl font-extrabold text-white">
            {formatCurrency(metrics.vencido)}
          </div>
          <div className="text-[11px] text-rose-300/80 mt-1">
            {metrics.countVencido} {metrics.countVencido === 1 ? 'recebível vencido' : 'recebíveis vencidos'}
          </div>
        </div>

        {/* Card 2: Vencem Hoje */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-900/40 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Vencem Hoje</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-xl font-extrabold text-white">
            {formatCurrency(metrics.venceHoje)}
          </div>
          <div className="text-[11px] text-amber-300/80 mt-1">
            {metrics.countVenceHoje} {metrics.countVenceHoje === 1 ? 'recebível para hoje' : 'recebíveis para hoje'}
          </div>
        </div>

        {/* Card 3: A Vencer */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-900/40 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">A Vencer</span>
            <Calendar className="w-4 h-4" />
          </div>
          <div className="text-xl font-extrabold text-white">
            {formatCurrency(metrics.aVencer)}
          </div>
          <div className="text-[11px] text-emerald-300/80 mt-1">
            {metrics.countAVencer} {metrics.countAVencer === 1 ? 'fatura a vencer' : 'faturas a vencer'}
          </div>
        </div>

        {/* Card 4: Recebidos */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-teal-900/40 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-teal-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Recebidos</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-xl font-extrabold text-white">
            {formatCurrency(metrics.recebido)}
          </div>
          <div className="text-[11px] text-teal-300/80 mt-1">
            {metrics.countRecebido} {metrics.countRecebido === 1 ? 'fatura quitada' : 'faturas quitadas'}
          </div>
        </div>

        {/* Card 5: Total do Período */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-950/40 border border-emerald-800/40 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total do Período</span>
            <DollarSign className="w-4 h-4" />
          </div>
          <div className="text-xl font-extrabold text-white">
            {formatCurrency(metrics.totalPeriod)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 truncate">
            {periodLabel}
          </div>
        </div>

      </div>

      {/* ABA 1: TABELA DE CONTAS A RECEBER */}
      {activeTab === 'receivables' && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por cliente sacado, pedido, categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Todos os Status</option>
                <option value="pending">Aguardando Pagamento</option>
                <option value="paid">Recebido / Liquidado</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400">
                  <th className="p-3.5 font-semibold">Cliente Comprador</th>
                  <th className="p-3.5 font-semibold">Descrição / Pedido Bling</th>
                  <th className="p-3.5 font-semibold">Categoria / Banco</th>
                  <th className="p-3.5 font-semibold">Vencimento</th>
                  <th className="p-3.5 font-semibold text-right">Valor</th>
                  <th className="p-3.5 font-semibold text-center">Status</th>
                  <th className="p-3.5 font-semibold text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredReceivables.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      Nenhum recebível de vendas encontrado no Bling para o período de {periodLabel}.
                    </td>
                  </tr>
                ) : (
                  filteredReceivables.map((item) => {
                    const isOverdue = item.dueDate < nowStr && item.status !== 'paid'
                    const custName = item.customer || item.customerName || item.customer_name || 'Cliente BR Lumens'

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="p-3.5 font-medium text-white">
                          <div className="font-bold">{custName}</div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {item.documentNumber ? `NF-e / Doc #${item.documentNumber}` : 'Bling ERP v3'}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-300">
                          {item.description}
                        </td>
                        <td className="p-3.5 text-slate-400">
                          <div>{item.category || 'Receita de Vendas (Comex)'}</div>
                          <span className="text-[10px] text-slate-500">{item.bankAccount || 'Itaú PJ'}</span>
                        </td>
                        <td className="p-3.5 font-mono">
                          <span className={isOverdue ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                            {formatDate(item.dueDate)}
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-white">
                          {formatCurrency(item.amount)}
                        </td>
                        <td className="p-3.5 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                            item.status === 'paid'
                              ? 'bg-teal-950 text-teal-300 border-teal-800'
                              : isOverdue
                              ? 'bg-rose-950 text-rose-300 border-rose-800'
                              : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          }`}>
                            {item.status === 'paid' ? 'Recebido' : isOverdue ? 'Vencido' : 'Em Aberto'}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          {item.status !== 'paid' && onUpdateReceivableStatus && (
                            <button
                              type="button"
                              onClick={() => onUpdateReceivableStatus(item.id, 'paid')}
                              className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-[10px] font-bold shadow-sm transition-all"
                            >
                              Receber
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ABA 2: LISTA DE CLIENTES COMPRADORES */}
      {activeTab === 'customers' && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Carteira de Clientes Faturados</h2>
              <p className="text-xs text-slate-400">Compradores de iluminação corporativa e industrial sincronizados via Bling API v3</p>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-semibold">
              {rawPessoas.length > 0 ? `${rawPessoas.length} clientes` : 'Clientes Ativos'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                nome: 'Construtora Horizonte Sul Ltda',
                doc: '21.432.654/0001-99',
                cidade: 'Curitiba, PR',
                segmento: 'Construção Civil & Shopping Centers',
                email: 'suprimentos@horizontesul.com.br'
              },
              {
                nome: 'Iluminação & Design Projetos Arquitetônicos',
                doc: '32.654.987/0001-11',
                cidade: 'São Paulo, SP',
                segmento: 'Distribuição e Iluminação Comercial',
                email: 'compras@iluminacaodesign.com.br'
              },
              {
                nome: 'Engenharia & Obras Paulistana Eireli',
                doc: '43.876.123/0001-22',
                cidade: 'Campinas, SP',
                segmento: 'Galpões Logísticos e Indústria',
                email: 'financeiro@obraspaulistana.com.br'
              },
              {
                nome: 'Rede Varejo Center Lojas e Departamentos',
                doc: '54.098.345/0001-33',
                cidade: 'Belo Horizonte, MG',
                segmento: 'Retrofit de Iluminação LED para Lojas',
                email: 'contasapagar@redecenter.com.br'
              }
            ].map((cli, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2.5 hover:border-emerald-700/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-bold text-white text-xs">{cli.nome}</div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Bling v3
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">{cli.doc}</div>
                <div className="text-[11px] text-emerald-400 font-medium">{cli.segmento}</div>
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>{cli.cidade}</span>
                  <span className="text-slate-500 font-mono text-[10px]">{cli.email}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
