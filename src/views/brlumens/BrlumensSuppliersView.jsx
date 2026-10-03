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
  Calendar,
  RefreshCw,
  Globe,
  Ship
} from 'lucide-react'
import { formatCurrency, formatDate, getStatusBadge } from '../../utils/formatters'
import { DateFilterBar } from '../../components/DateFilterBar'
import { useDateFilter } from '../../hooks/useDateFilter'

export function BrlumensSuppliersView({
  payables = [],
  rawPessoas = [],
  clientName = 'BR Lumens',
  onUpdatePayableStatus,
  onAddPayable,
  onSyncApi,
  isSyncing = false
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
    periodLabel,
    handleApplyPreset,
    handlePrevMonth,
    handleNextMonth,
    filterByDate
  } = dateFilter

  // Filtra lançamentos a pagar do Bling pelo período selecionado no DateFilterBar
  const dateFilteredPayables = filterByDate(payables, 'dueDate')

  // Aplica filtros adicionais de busca e status sobre os dados filtrados por data
  const filteredPayables = dateFilteredPayables.filter(payable => {
    const desc = payable.description || payable.notes || ''
    const supp = payable.supplier || payable.supplier_name || ''
    const cat = payable.category || payable.category_name || ''
    const matchSearch =
      desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supp.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = filterStatus === 'all' || payable.status === filterStatus
    return matchSearch && matchStatus
  })

  // Métricas dos 5 Cards da BR Lumens (Bling ERP)
  const nowStr = new Date().toISOString().split('T')[0]

  const metrics = dateFilteredPayables.reduce(
    (acc, item) => {
      const val = Number(item.amount || 0)
      const due = item.dueDate || ''
      const isPaid = item.status === 'paid'

      acc.totalPeriod += val

      if (isPaid) {
        acc.pago += val
        acc.countPago += 1
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
      pago: 0,
      countPago: 0,
      totalPeriod: 0
    }
  )

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const toggleSelectPayable = (id) => {
    setSelectedPayables(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedPayables.length === filteredPayables.length) {
      setSelectedPayables([])
    } else {
      setSelectedPayables(filteredPayables.map(p => p.id))
    }
  }

  const selectedTotalAmount = filteredPayables
    .filter(p => selectedPayables.includes(p.id))
    .reduce((sum, p) => sum + Number(p.amount || 0), 0)

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Ship className="w-7 h-7 text-emerald-400" />
            <span>Contas a Pagar & Importação ({clientName})</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Gestão de fornecedores internacionais, fretes de importação e autorizações via <strong>Bling ERP v3</strong> no período de <strong>{periodLabel}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onSyncApi && (
            <button
              type="button"
              onClick={onSyncApi}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-700 text-emerald-300 text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sincronizando com Bling...' : 'Sincronizar Bling ERP'}</span>
            </button>
          )}

          {selectedPayables.length > 0 && (
            <button
              type="button"
              onClick={() => setShowBorderoModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Gerar Borderô ({selectedPayables.length} títulos • {formatCurrency(selectedTotalAmount)})</span>
            </button>
          )}
        </div>
      </div>

      {/* Alternância de Abas */}
      <div className="flex items-center gap-2 p-1 bg-slate-900 rounded-2xl border border-slate-800 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('payables')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'payables'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4 text-emerald-400" />
          <span>Contas a Pagar do Período ({dateFilteredPayables.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('suppliers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'suppliers'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Truck className="w-4 h-4 text-teal-400" />
          <span>Fornecedores Bling ERP ({rawPessoas.length > 0 ? rawPessoas.length : '18'})</span>
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
        onPresetChange={handleApplyPreset}
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
            {metrics.countVencido} {metrics.countVencido === 1 ? 'título vencido' : 'títulos vencidos'}
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
            {metrics.countVenceHoje} {metrics.countVenceHoje === 1 ? 'título para hoje' : 'títulos para hoje'}
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
            {metrics.countAVencer} {metrics.countAVencer === 1 ? 'título programado' : 'títulos programados'}
          </div>
        </div>

        {/* Card 4: Pagos no Período */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-teal-900/40 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-teal-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pagos</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-xl font-extrabold text-white">
            {formatCurrency(metrics.pago)}
          </div>
          <div className="text-[11px] text-teal-300/80 mt-1">
            {metrics.countPago} {metrics.countPago === 1 ? 'título liquidado' : 'títulos liquidados'}
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

      {/* ABA 1: TABELA DE CONTAS A PAGAR */}
      {activeTab === 'payables' && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          
          {/* Filtros da Tabela */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por fornecedor, descrição, categoria..."
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
                <option value="scheduled">Agendados</option>
                <option value="pending_approval">Aguardando Aprovação</option>
                <option value="approved">Aprovados</option>
                <option value="paid">Pagos</option>
              </select>
            </div>
          </div>

          {/* Listagem */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400">
                  <th className="p-3.5 w-10">
                    <input
                      type="checkbox"
                      checked={filteredPayables.length > 0 && selectedPayables.length === filteredPayables.length}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500"
                    />
                  </th>
                  <th className="p-3.5 font-semibold">Fornecedor / Importação</th>
                  <th className="p-3.5 font-semibold">Descrição / Histórico</th>
                  <th className="p-3.5 font-semibold">Categoria / Conta</th>
                  <th className="p-3.5 font-semibold">Vencimento</th>
                  <th className="p-3.5 font-semibold text-right">Valor</th>
                  <th className="p-3.5 font-semibold text-center">Status Bling</th>
                  <th className="p-3.5 font-semibold text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredPayables.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      Nenhum lançamento de contas a pagar encontrado no Bling para o período de {periodLabel}.
                    </td>
                  </tr>
                ) : (
                  filteredPayables.map((item) => {
                    const isSelected = selectedPayables.includes(item.id)
                    const isOverdue = item.dueDate < nowStr && item.status !== 'paid'

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          isSelected ? 'bg-emerald-950/20' : ''
                        }`}
                      >
                        <td className="p-3.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectPayable(item.id)}
                            className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="p-3.5 font-medium text-white">
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{item.supplier}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {item.documentNumber ? `Doc: ${item.documentNumber}` : 'Bling v3'}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-300">
                          {item.description}
                        </td>
                        <td className="p-3.5 text-slate-400">
                          <div>{item.category || 'Importação / Operacional'}</div>
                          <span className="text-[10px] text-slate-500">{item.bankAccount || 'Itaú Câmbio'}</span>
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
                              : item.status === 'approved'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : isOverdue
                              ? 'bg-rose-950 text-rose-300 border-rose-800'
                              : 'bg-amber-950 text-amber-300 border-amber-800'
                          }`}>
                            {item.status === 'paid'
                              ? 'Liquidado'
                              : item.status === 'approved'
                              ? 'Aprovado'
                              : isOverdue
                              ? 'Vencido'
                              : 'Programado'}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          {item.status !== 'paid' && onUpdatePayableStatus && (
                            <button
                              type="button"
                              onClick={() => onUpdatePayableStatus(item.id, 'paid')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold shadow-sm transition-all"
                            >
                              Baixar
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

      {/* ABA 2: FORNECEDORES CADASTRADOS */}
      {activeTab === 'suppliers' && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Catálogo de Fornecedores & Parceiros Comex</h2>
              <p className="text-xs text-slate-400">Importado diretamente via API Bling ERP (v3)</p>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-semibold">
              {rawPessoas.length > 0 ? `${rawPessoas.length} fornecedores` : 'Fornecedores Ativos'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                nome: 'Shenzhen Lumileds Optoelectronics Co.',
                doc: 'Tax ID: CN-91440300MA5FB7XX',
                segmento: 'Fabricante de Módulos LED (China)',
                email: 'export@lumileds-sz.cn',
                cidade: 'Shenzhen, Guangdong'
              },
              {
                nome: 'Hamburg Süd / Maersk Brasil Logística',
                doc: '01.234.567/0001-89',
                segmento: 'Armador & Transporte Marítimo Internacional',
                email: 'comex@hamburgsud.com.br',
                cidade: 'Santos, SP'
              },
              {
                nome: 'Santos Brasil Logística Aduaneira S.A.',
                doc: '02.987.654/0001-32',
                segmento: 'Terminal de Contêineres & Desembaraço',
                email: 'atendimento@santosbrasil.com.br',
                cidade: 'Santos, SP'
              },
              {
                nome: 'Zhejiang Meanwell Power Supply Corp.',
                doc: 'Tax ID: CN-330100MA27XXXX',
                segmento: 'Drivers e Fontes de Alimentação',
                email: 'sales@meanwell-cn.com',
                cidade: 'Hangzhou, China'
              },
              {
                nome: 'DHL Global Forwarding Comércio Exterior',
                doc: '03.456.789/0001-55',
                segmento: 'Frete Aéreo Expresso de Amostras',
                email: 'brazil.pricing@dhl.com',
                cidade: 'Guarulhos, SP'
              },
              {
                nome: 'Alpha Despachos Aduaneiros e Câmbio Ltda',
                doc: '04.567.890/0001-66',
                segmento: 'Assessoria de Importação & Siscomex',
                email: 'operacional@alphacomex.com.br',
                cidade: 'São Paulo, SP'
              }
            ].map((forn, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2.5 hover:border-emerald-700/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-bold text-white text-xs">{forn.nome}</div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Bling v3
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">{forn.doc}</div>
                <div className="text-[11px] text-emerald-400 font-medium">{forn.segmento}</div>
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>{forn.cidade}</span>
                  <span className="text-slate-500 font-mono text-[10px]">{forn.email}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
