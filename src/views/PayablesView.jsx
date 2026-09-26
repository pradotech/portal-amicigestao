import React, { useState } from 'react'
import {
  CreditCard,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Copy,
  Plus,
  Send,
  Download,
  Calendar,
  DollarSign,
  ChevronDown,
  Check,
  Building2,
  X
} from 'lucide-react'
import { formatCurrency, formatDate, getStatusBadge } from '../utils/formatters'

export function PayablesView({
  payables,
  clients,
  selectedClientId,
  onUpdatePayableStatus,
  onAddPayable
}) {
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [copiedId, setCopiedId] = useState(null)
  const [selectedPayables, setSelectedPayables] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showBorderoModal, setShowBorderoModal] = useState(false)

  // Form State Novo Pagamento
  const [formData, setFormData] = useState({
    clientId: selectedClientId || (clients[0]?.id || ''),
    supplier: '',
    category: 'Fornecedores & Insumos',
    description: '',
    amount: '',
    dueDate: new Date().toISOString().split('T')[0],
    barcode: '',
    bankAccount: 'Banco Itaú Unibanco'
  })

  const filteredPayables = payables.filter(item => {
    const matchesClient = selectedClientId ? item.clientId === selectedClientId : true
    const matchesStatus = filterStatus === 'all' ? true : item.status === filterStatus
    const matchesSearch =
      item.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.barcode && item.barcode.includes(searchTerm))

    return matchesClient && matchesStatus && matchesSearch
  })

  const totalAmount = filteredPayables.reduce((acc, p) => acc + (p.amount || 0), 0)
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

  const handleSelectAll = () => {
    if (selectedPayables.length === filteredPayables.length) {
      setSelectedPayables([])
    } else {
      setSelectedPayables(filteredPayables.map(p => p.id))
    }
  }

  const handleCreateSubmit = (e) => {
    e.preventDefault()
    if (!formData.supplier || !formData.amount) return

    const newPayable = {
      id: `pay-${Date.now()}`,
      clientId: formData.clientId,
      supplier: formData.supplier,
      category: formData.category,
      description: formData.description || 'Pagamento via Amici BPO',
      amount: parseFloat(formData.amount),
      dueDate: formData.dueDate,
      status: 'scheduled',
      bankAccount: formData.bankAccount,
      barcode: formData.barcode,
      approvalStatus: 'approved',
      hasAttachment: false
    }

    onAddPayable(newPayable)
    setShowAddModal(false)
    setFormData({
      clientId: selectedClientId || (clients[0]?.id || ''),
      supplier: '',
      category: 'Fornecedores & Insumos',
      description: '',
      amount: '',
      dueDate: new Date().toISOString().split('T')[0],
      barcode: '',
      bankAccount: 'Banco Itaú Unibanco'
    })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <CreditCard className="w-7 h-7 text-amber-400" />
            <span>Contas a Pagar & Borderô</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Controle de compromissos, agendamentos bancários e autorização de pagamentos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {selectedPayables.length > 0 && (
            <button
              type="button"
              onClick={() => setShowBorderoModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition-all animate-in zoom-in-95"
            >
              <Send className="w-4 h-4" />
              <span>Gerar Borderô ({selectedPayables.length} itens • {formatCurrency(selectedTotalAmount)})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-950/40 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Pagamento</span>
          </button>
        </div>
      </div>

      {/* Cards de Métricas de Contas a Pagar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Programado</span>
          <div className="text-2xl font-black text-white mt-1.5 font-mono">{formatCurrency(totalAmount)}</div>
          <div className="text-[11px] text-slate-500 mt-1">{filteredPayables.length} títulos no filtro</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-amber-500/30 shadow-md">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">A Pagar / Agendados</span>
          <div className="text-2xl font-black text-amber-300 mt-1.5 font-mono">
            {formatCurrency(filteredPayables.filter(p => p.status !== 'paid' && p.status !== 'overdue').reduce((acc, p) => acc + (p.amount || 0), 0))}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {filteredPayables.filter(p => p.status !== 'paid' && p.status !== 'overdue').length} compromissos pendentes
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-rose-500/30 shadow-md">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">Vencidos (Atraso)</span>
          <div className="text-2xl font-black text-rose-400 mt-1.5 font-mono">
            {formatCurrency(filteredPayables.filter(p => p.status === 'overdue').reduce((acc, p) => acc + (p.amount || 0), 0))}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {filteredPayables.filter(p => p.status === 'overdue').length} títulos em atraso
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-emerald-500/30 shadow-md">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Pagos / Liquidados</span>
          <div className="text-2xl font-black text-emerald-400 mt-1.5 font-mono">
            {formatCurrency(filteredPayables.filter(p => p.status === 'paid').reduce((acc, p) => acc + (p.amount || 0), 0))}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {filteredPayables.filter(p => p.status === 'paid').length} títulos quitados
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-md">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por fornecedor, descrição ou código de barras..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'scheduled', label: 'Agendados' },
              { id: 'pending_client', label: 'Aguardando Aprovação' },
              { id: 'overdue', label: 'Vencidos' },
              { id: 'paid', label: 'Pagos' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  filterStatus === tab.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60 font-mono">
          <span>{filteredPayables.length} títulos listados</span>
          <span>Total Filtrado: <strong className="text-white text-sm">{formatCurrency(totalAmount)}</strong></span>
        </div>
      </div>

      {/* Tabela de Contas a Pagar */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 w-8">
                  <input
                    type="checkbox"
                    checked={selectedPayables.length > 0 && selectedPayables.length === filteredPayables.length}
                    onChange={handleSelectAll}
                    className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-cyan-500"
                  />
                </th>
                <th className="pb-3 font-semibold">Fornecedor / Favorecido</th>
                <th className="pb-3 font-semibold">Cliente BPO</th>
                <th className="pb-3 font-semibold">Categoria</th>
                <th className="pb-3 font-semibold">Vencimento</th>
                <th className="pb-3 font-semibold">Valor</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Código de Barras</th>
                <th className="pb-3 font-semibold text-right">Ações BPO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredPayables.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-500">
                    Nenhum compromisso financeiro encontrado com os filtros atuais.
                  </td>
                </tr>
              ) : (
                filteredPayables.map(item => {
                  const client = clients.find(c => c.id === item.clientId)
                  const isSelected = selectedPayables.includes(item.id)
                  const badge = getStatusBadge(item.status)

                  return (
                    <tr key={item.id} className={`hover:bg-slate-800/40 transition-colors ${isSelected ? 'bg-cyan-950/20' : ''}`}>
                      <td className="py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(item.id)}
                          className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-cyan-500"
                        />
                      </td>

                      <td className="py-3 font-medium text-slate-200">
                        <div className="font-semibold text-white">{item.supplier}</div>
                        <div className="text-[11px] text-slate-400">{item.description}</div>
                      </td>

                      <td className="py-3 text-slate-300">
                        <span className="font-medium">{client?.tradeName || '-'}</span>
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
                        {item.barcode ? (
                          <button
                            type="button"
                            onClick={() => handleCopyBarcode(item.barcode, item.id)}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] font-mono text-slate-300 hover:text-white transition-colors"
                            title={item.barcode}
                          >
                            {copiedId === item.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-cyan-400" />
                                <span>Copiar Linha</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="text-slate-600 text-[11px]">-</span>
                        )}
                      </td>

                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.status !== 'paid' && (
                            <button
                              type="button"
                              onClick={() => onUpdatePayableStatus(item.id, 'paid')}
                              className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-medium transition-colors"
                              title="Dar baixa como Pago"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          {item.status === 'pending_client' && (
                            <button
                              type="button"
                              onClick={() => onUpdatePayableStatus(item.id, 'scheduled')}
                              className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[10px] font-medium transition-colors"
                              title="Marcar como Agendado"
                            >
                              <Clock className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Borderô de Pagamento Diário */}
      {showBorderoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400">
                  <Send className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Borderô de Pagamento Diário</h3>
                  <p className="text-xs text-slate-400">Envio para aprovação ou autorização bancária pelo cliente</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBorderoModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Total a Autorizar ({selectedPayables.length} títulos)</span>
                  <span className="text-xl font-bold text-white font-mono">{formatCurrency(selectedTotalAmount)}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Data de Execução</span>
                  <span className="text-sm font-semibold text-cyan-400">{formatDate(new Date().toISOString())}</span>
                </div>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {payables.filter(p => selectedPayables.includes(p.id)).map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 text-xs">
                    <div>
                      <div className="font-medium text-white">{p.supplier}</div>
                      <div className="text-[10px] text-slate-400">{p.description}</div>
                    </div>
                    <div className="font-mono font-bold text-white">{formatCurrency(p.amount)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowBorderoModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => {
                  alert('Borderô de Pagamentos gerado com sucesso e notificação enviada ao cliente!')
                  setShowBorderoModal(false)
                  setSelectedPayables([])
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/20"
              >
                Enviar Borderô para Cliente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Novo Lançamento de Pagamento */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Novo Pagamento / Conta a Pagar</h3>
                  <p className="text-xs text-slate-400">Registrar título para agendamento no Conta Azul</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Cliente BPO Amici *</label>
                <select
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.tradeName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Fornecedor / Favorecido *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Amazon Web Services"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Valor (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Data de Vencimento *</label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Categoria</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="Fornecedores & Insumos">Fornecedores & Insumos</option>
                    <option value="Softwares & Infraestrutura">Softwares & Infraestrutura</option>
                    <option value="Impostos & Tributos">Impostos & Tributos</option>
                    <option value="Folha de Pagamento">Folha de Pagamento</option>
                    <option value="Despesas Administrativas">Despesas Administrativas</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Linha Digitável / Código de Barras (Opcional)</label>
                <input
                  type="text"
                  placeholder="34191.00000 00000.000000 00000.000000 0 00000000000000"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-xs font-semibold text-white shadow-lg shadow-cyan-900/30"
                >
                  Salvar Pagamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
