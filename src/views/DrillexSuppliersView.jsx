import React, { useState } from 'react'
import {
  Truck,
  CreditCard,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Copy,
  Plus,
  Send,
  Download,
  Building2,
  Phone,
  Mail,
  Check,
  Filter,
  FileText,
  DollarSign,
  Calendar
} from 'lucide-react'
import { formatCurrency, formatDate, getStatusBadge } from '../utils/formatters'
import { DateFilterBar } from '../components/DateFilterBar'
import { useDateFilter } from '../hooks/useDateFilter'

export function DrillexSuppliersView({
  payables = [],
  rawPessoas = [],
  clientName = 'Drillex',
  onUpdatePayableStatus,
  onAddPayable
}) {
  const [activeTab, setActiveTab] = useState('payables') // 'payables' | 'suppliers'
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [copiedId, setCopiedId] = useState(null)
  const [selectedPayables, setSelectedPayables] = useState([])
  const [showBorderoModal, setShowBorderoModal] = useState(false)

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

  const todayStr = new Date().toISOString().split('T')[0]

  const isPaid = (p) => p.status === 'paid' || p.status === 'liquidated' || p.status === 'PAGO'
  const isOverdue = (p) => !isPaid(p) && (p.status === 'overdue' || (p.dueDate && p.dueDate < todayStr))
  const isToday = (p) => !isPaid(p) && p.dueDate && p.dueDate === todayStr
  const isFuture = (p) => !isPaid(p) && p.dueDate && p.dueDate > todayStr

  // Filtra pessoas que são Fornecedores ou Transportadoras
  const fornecedores = rawPessoas.filter(p => {
    const perfis = Array.isArray(p.perfis) ? p.perfis : []
    return perfis.includes('Fornecedor') || perfis.includes('Transportadora') || (!perfis.includes('Cliente') && perfis.length > 0)
  })

  // 1. Filtragem Estrita por Data do Período
  const dateFilteredPayables = filterByDate(payables, 'dueDate')

  // 2. Filtragem por Status e Termo de Busca
  const filteredPayables = dateFilteredPayables.filter(item => {
    let matchesStatus = true
    if (filterStatus === 'paid') {
      matchesStatus = isPaid(item)
    } else if (filterStatus === 'overdue') {
      matchesStatus = isOverdue(item)
    } else if (filterStatus === 'today') {
      matchesStatus = isToday(item)
    } else if (filterStatus === 'future' || filterStatus === 'scheduled') {
      matchesStatus = isFuture(item) || item.status === 'scheduled' || item.status === 'approved'
    } else if (filterStatus === 'pending_client') {
      matchesStatus = item.status === 'pending_client'
    }

    const matchesSearch =
      (item.supplier && item.supplier.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.barcode && item.barcode.includes(searchTerm))
    return matchesStatus && matchesSearch
  })

  // Filtro de Lista de Fornecedores
  const filteredFornecedores = (fornecedores.length > 0 ? fornecedores : rawPessoas).filter(f =>
    (f.nome && f.nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (f.documento && f.documento.includes(searchTerm))
  )

  // Métricas dos 5 Cards da Conta Azul (Calculados 100% dos registros reais do banco)
  const vencidosList = dateFilteredPayables.filter(p => isOverdue(p))
  const vencidosAmount = vencidosList.reduce((acc, p) => acc + (Number(p.amount) || 0), 0)

  const vencemHojeList = dateFilteredPayables.filter(p => isToday(p))
  const vencemHojeAmount = vencemHojeList.reduce((acc, p) => acc + (Number(p.amount) || 0), 0)

  const aVencerList = dateFilteredPayables.filter(p => isFuture(p))
  const aVencerAmount = aVencerList.reduce((acc, p) => acc + (Number(p.amount) || 0), 0)

  const pagosList = dateFilteredPayables.filter(p => isPaid(p))
  const pagosAmount = pagosList.reduce((acc, p) => acc + (Number(p.amount) || 0), 0)

  const totalPeriodoAmount = dateFilteredPayables.reduce((acc, p) => acc + (Number(p.amount) || 0), 0)

  const selectedTotalAmount = payables
    .filter(p => selectedPayables.includes(p.id))
    .reduce((acc, p) => acc + (p.amount || 0), 0)

  const handleCopyBarcode = (barcode, id) => {
    if (!barcode) return
    navigator.clipboard.writeText(barcode.replace(/\s+/g, ''))
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleToggleSelect = (id) => {
    setSelectedPayables(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <CreditCard className="w-7 h-7 text-amber-400" />
            <span>Fornecedores & Contas a Pagar ({clientName})</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Gestão de fornecedores reais e autorização de pagamentos de {clientName} no período de <strong>{periodLabel}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {selectedPayables.length > 0 && (
            <button
              type="button"
              onClick={() => setShowBorderoModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Gerar Borderô ({selectedPayables.length} títulos • {formatCurrency(selectedTotalAmount)})</span>
            </button>
          )}
        </div>
      </div>

      {/* Alternância de Abas: Contas a Pagar vs Cadastro de Fornecedores */}
      <div className="flex items-center gap-2 p-1 bg-slate-900 rounded-2xl border border-slate-800 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('payables')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'payables'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4 text-amber-400" />
          <span>Contas a Pagar do Período ({dateFilteredPayables.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('suppliers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'suppliers'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Truck className="w-4 h-4 text-cyan-400" />
          <span>Lista de Fornecedores ({filteredFornecedores.length})</span>
        </button>
      </div>

      {/* BARRA DE FILTRO DE DATA */}
      {activeTab === 'payables' && (
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
          totalPayablesCount={dateFilteredPayables.length}
          totalPayablesAmount={totalPeriodoAmount}
          totalReceivablesCount={0}
          totalReceivablesAmount={0}
          diffDays={diffDays}
        />
      )}

      {/* 5 CARDS OFICIAIS DO PADRÃO CONTA AZUL (Vencidos, Vencem hoje, A vencer, Pagos, Total do período) */}
      {activeTab === 'payables' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* Card 1: Vencidos */}
          <div
            onClick={() => setFilterStatus(filterStatus === 'overdue' ? 'all' : 'overdue')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterStatus === 'overdue'
                ? 'bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/20'
                : 'bg-slate-900/80 border-slate-800 hover:border-rose-500/50'
            }`}
          >
            <div className="text-xs text-rose-400 font-semibold mb-1">Vencidos</div>
            <div className="text-lg sm:text-xl font-bold text-rose-300 font-mono">{formatCurrency(vencidosAmount)}</div>
            <div className="text-[11px] text-slate-500 mt-1">{vencidosList.length} títulos</div>
          </div>

          {/* Card 2: Vencem hoje */}
          <div
            onClick={() => setFilterStatus(filterStatus === 'today' ? 'all' : 'today')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterStatus === 'today'
                ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/20'
                : 'bg-slate-900/80 border-slate-800 hover:border-amber-500/50'
            }`}
          >
            <div className="text-xs text-amber-400 font-semibold mb-1">Vencem hoje</div>
            <div className="text-lg sm:text-xl font-bold text-amber-300 font-mono">{formatCurrency(vencemHojeAmount)}</div>
            <div className="text-[11px] text-slate-500 mt-1">{vencemHojeList.length} títulos</div>
          </div>

          {/* Card 3: A vencer */}
          <div
            onClick={() => setFilterStatus(filterStatus === 'scheduled' ? 'all' : 'scheduled')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterStatus === 'scheduled'
                ? 'bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/20'
                : 'bg-slate-900/80 border-slate-800 hover:border-blue-500/50'
            }`}
          >
            <div className="text-xs text-blue-400 font-semibold mb-1">A vencer / Agendados</div>
            <div className="text-lg sm:text-xl font-bold text-blue-300 font-mono">{formatCurrency(aVencerAmount)}</div>
            <div className="text-[11px] text-slate-500 mt-1">{aVencerList.length} títulos</div>
          </div>

          {/* Card 4: Pagos */}
          <div
            onClick={() => setFilterStatus(filterStatus === 'paid' ? 'all' : 'paid')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterStatus === 'paid'
                ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20'
                : 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/50'
            }`}
          >
            <div className="text-xs text-emerald-400 font-semibold mb-1">Pagos / Liquidados</div>
            <div className="text-lg sm:text-xl font-bold text-emerald-300 font-mono">{formatCurrency(pagosAmount)}</div>
            <div className="text-[11px] text-slate-500 mt-1">{pagosList.length} títulos</div>
          </div>

          {/* Card 5: Total do período */}
          <div
            onClick={() => setFilterStatus('all')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer col-span-2 sm:col-span-1 ${
              filterStatus === 'all'
                ? 'bg-slate-800/80 border-slate-600 ring-2 ring-slate-600/20'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="text-xs text-slate-400 font-semibold mb-1">Total do período</div>
            <div className="text-lg sm:text-xl font-bold text-white font-mono">{formatCurrency(totalPeriodoAmount)}</div>
            <div className="text-[11px] text-slate-500 mt-1">{dateFilteredPayables.length} títulos</div>
          </div>
        </div>
      )}

      {/* Barra de Busca e Filtros */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={activeTab === 'payables' ? "Buscar por fornecedor, descrição ou boleto..." : "Buscar fornecedor por nome ou CNPJ..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </div>

        {activeTab === 'payables' && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'overdue', label: 'Vencidos' },
              { id: 'today', label: 'Vencem Hoje' },
              { id: 'scheduled', label: 'A Vencer' },
              { id: 'pending_client', label: 'Aguardando Aprovação' },
              { id: 'paid', label: 'Pagos' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterStatus === tab.id
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ABA 1: TABELA DE CONTAS A PAGAR */}
      {activeTab === 'payables' && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 w-8">
                    <input
                      type="checkbox"
                      checked={selectedPayables.length > 0 && selectedPayables.length === filteredPayables.length}
                      onChange={() => {
                        if (selectedPayables.length === filteredPayables.length) setSelectedPayables([])
                        else setSelectedPayables(filteredPayables.map(p => p.id))
                      }}
                      className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-amber-500"
                    />
                  </th>
                  <th className="pb-3 font-semibold">Fornecedor / Favorecido (Drillex)</th>
                  <th className="pb-3 font-semibold">Categoria</th>
                  <th className="pb-3 font-semibold">Vencimento</th>
                  <th className="pb-3 font-semibold">Valor</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Linha Digitável</th>
                  <th className="pb-3 font-semibold text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredPayables.map(item => {
                  const isSelected = selectedPayables.includes(item.id)
                  const badge = getStatusBadge(item.status)

                  return (
                    <tr key={item.id} className={`hover:bg-slate-800/40 transition-colors ${isSelected ? 'bg-amber-950/20' : ''}`}>
                      <td className="py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(item.id)}
                          className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-amber-500"
                        />
                      </td>

                      <td className="py-3 font-medium text-slate-200">
                        <div className="font-semibold text-white">{item.supplier}</div>
                        <div className="text-[11px] text-slate-400">{item.description}</div>
                      </td>

                      <td className="py-3 text-slate-400">{item.category}</td>

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

                      <td className="py-3">
                        {item.barcode && (
                          <button
                            type="button"
                            onClick={() => handleCopyBarcode(item.barcode, item.id)}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] font-mono text-slate-300 hover:text-white transition-colors"
                          >
                            {copiedId === item.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-cyan-400" />
                                <span>Copiar</span>
                              </>
                            )}
                          </button>
                        )}
                      </td>

                      <td className="py-3 text-right">
                        {item.status !== 'paid' && (
                          <button
                            type="button"
                            onClick={() => onUpdatePayableStatus(item.id, 'paid')}
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400"
                            title="Dar Baixa / Liquidado"
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

      {/* ABA 2: LISTA DE FORNECEDORES REAIS DA DRILLEX */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFornecedores.map((f, idx) => (
            <div key={f.id || idx} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-white text-xs leading-snug">{f.nome}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/50 flex-shrink-0">
                  {Array.isArray(f.perfis) ? f.perfis.join(', ') : 'Fornecedor'}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                CNPJ/CPF: {f.documento || 'Não informado'}
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-3 pt-1">
                {f.email && <span>✉️ {f.email}</span>}
                {f.telefone && <span>📞 {f.telefone}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}
