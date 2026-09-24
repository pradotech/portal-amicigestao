import React, { useState } from 'react'
import {
  Users,
  TrendingUp,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Mail,
  Plus,
  FileText,
  DollarSign,
  Calendar,
  ArrowUpRight
} from 'lucide-react'
import { formatCurrency, formatDate, getStatusBadge } from '../utils/formatters'
import { DateFilterBar } from '../components/DateFilterBar'
import { useDateFilter } from '../hooks/useDateFilter'

export function DrillexCustomersView({
  receivables = [],
  rawPessoas = [],
  clientName = 'Drillex',
  onUpdateReceivableStatus
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
    diffDays,
    periodLabel,
    handlePrevMonth,
    handleNextMonth,
    handlePrevDay,
    handleNextDay,
    handleApplyPreset,
    filterByDate
  } = dateFilter

  // Filtra pessoas que são Clientes
  const clientes = rawPessoas.filter(p => {
    const perfis = Array.isArray(p.perfis) ? p.perfis : []
    return perfis.includes('Cliente') || perfis.length === 0
  })

  // 1. Filtragem Estrita por Data do Período
  const dateFilteredReceivables = filterByDate(receivables, 'dueDate')

  // 2. Filtragem por Status e Termo de Busca
  const filteredReceivables = dateFilteredReceivables.filter(item => {
    const matchesStatus = filterStatus === 'all' ? true : item.status === filterStatus
    const matchesSearch =
      (item.customer && item.customer.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.invoiceNumber && item.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesStatus && matchesSearch
  })

  // Filtro de Lista de Clientes
  const filteredClientes = (clientes.length > 0 ? clientes : rawPessoas).filter(c =>
    (c.nome && c.nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.documento && c.documento.includes(searchTerm))
  )

  // Métricas do Período
  const totalAmount = dateFilteredReceivables.reduce((acc, r) => acc + (Number(r.amount) || 0), 0)
  const receivedAmount = dateFilteredReceivables.filter(r => r.status === 'received' || r.status === 'paid').reduce((acc, r) => acc + (Number(r.amount) || 0), 0)
  const pendingAmount = dateFilteredReceivables.filter(r => r.status !== 'received' && r.status !== 'paid').reduce((acc, r) => acc + (Number(r.amount) || 0), 0)
  const receivedCount = dateFilteredReceivables.filter(r => r.status === 'received' || r.status === 'paid').length
  const pendingCount = dateFilteredReceivables.filter(r => r.status !== 'received' && r.status !== 'paid').length

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <TrendingUp className="w-7 h-7 text-emerald-400" />
            <span>Clientes & Contas a Receber ({clientName})</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Gestão dos clientes sacados e faturamento de {clientName} no período de <strong>{periodLabel}</strong>.
          </p>
        </div>
      </div>

      {/* Alternância de Abas: Contas a Receber vs Lista de Clientes */}
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
          <span>Lista de Clientes ({filteredClientes.length})</span>
        </button>
      </div>

      {/* BARRA DE FILTRO DE DATA */}
      {activeTab === 'receivables' && (
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
          totalReceivablesCount={dateFilteredReceivables.length}
          totalReceivablesAmount={totalAmount}
          totalPayablesCount={0}
          totalPayablesAmount={0}
          diffDays={diffDays}
        />
      )}

      {/* Cards de Resumo do Faturamento no Período */}
      {activeTab === 'receivables' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-xs text-slate-400 font-semibold mb-1">Total Faturado no Período</div>
            <div className="text-xl font-bold text-white font-mono">{formatCurrency(totalAmount)}</div>
            <div className="text-[11px] text-slate-500 mt-1">{dateFilteredReceivables.length} títulos no período</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-xs text-emerald-400 font-semibold mb-1">Total Liquidado / Recebido</div>
            <div className="text-xl font-bold text-emerald-300 font-mono">{formatCurrency(receivedAmount)}</div>
            <div className="text-[11px] text-slate-500 mt-1">{receivedCount} títulos liquidados</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-xs text-amber-400 font-semibold mb-1">Pendente de Recebimento</div>
            <div className="text-xl font-bold text-amber-300 font-mono">{formatCurrency(pendingAmount)}</div>
            <div className="text-[11px] text-slate-500 mt-1">{pendingCount} títulos em aberto</div>
          </div>
        </div>
      )}

      {/* Busca e Filtros */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={activeTab === 'receivables' ? "Buscar por cliente, documento ou nota fiscal..." : "Buscar cliente por nome ou CNPJ..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>

        {activeTab === 'receivables' && (
          <div className="flex items-center gap-1.5">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'pending', label: 'Pendentes' },
              { id: 'received', label: 'Recebidos' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterStatus === tab.id
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ABA 1: TABELA DE CONTAS A RECEBER */}
      {activeTab === 'receivables' && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">Cliente Sacado (Drillex)</th>
                  <th className="pb-3 font-semibold">Documento</th>
                  <th className="pb-3 font-semibold">Vencimento</th>
                  <th className="pb-3 font-semibold">Valor</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredReceivables.map(item => {
                  const badge = getStatusBadge(item.status)

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 font-medium text-slate-200">
                        <div className="font-semibold text-white">{item.customer}</div>
                        <div className="text-[11px] text-slate-400">{item.description}</div>
                      </td>

                      <td className="py-3 text-slate-300 font-mono">
                        {item.invoiceNumber || '-'}
                      </td>

                      <td className="py-3 text-slate-300 font-mono">
                        {formatDate(item.dueDate)}
                      </td>

                      <td className="py-3 text-white font-bold font-mono text-sm">
                        {formatCurrency(item.amount)}
                      </td>

                      <td className="py-3">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold border ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </td>

                      <td className="py-3 text-right">
                        {item.status !== 'received' && (
                          <button
                            type="button"
                            onClick={() => onUpdateReceivableStatus(item.id, 'received')}
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400"
                            title="Confirmar Recebimento"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA 2: LISTA DE CLIENTES REAIS DA DRILLEX */}
      {activeTab === 'customers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClientes.map((c, idx) => (
            <div key={c.id || idx} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-white text-xs leading-snug">{c.nome}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/50 flex-shrink-0">
                  Cliente
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                CNPJ/CPF: {c.documento || 'Não informado'}
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-3 pt-1">
                {c.email && <span>✉️ {c.email}</span>}
                {c.telefone && <span>📞 {c.telefone}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}
