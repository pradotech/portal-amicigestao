import React, { useState } from 'react'
import {
  TrendingUp,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  DollarSign,
  Send,
  Plus,
  Mail,
  MessageCircle,
  X
} from 'lucide-react'
import { formatCurrency, formatDate, getStatusBadge } from '../utils/formatters'

export function ReceivablesView({
  receivables,
  clients,
  selectedClientId,
  onUpdateReceivableStatus,
  onAddReceivable
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [notifyingItem, setNotifyingItem] = useState(null)

  // Form State Novo Recebível
  const [formData, setFormData] = useState({
    clientId: selectedClientId || (clients[0]?.id || ''),
    customer: '',
    category: 'Venda de Serviços / Assinatura',
    description: '',
    amount: '',
    dueDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Boleto Bancário',
    invoiceNumber: ''
  })

  const isReceived = (r) => r.status === 'received' || r.status === 'paid' || r.status === 'liquidated' || r.status === 'RECEBIDO' || r.status === 'QUITADO'
  const isOverdue = (r) => !isReceived(r) && (r.status === 'overdue' || (r.dueDate && r.dueDate < new Date().toISOString().split('T')[0]))

  const getReceivableRemaining = (r) => {
    if (isReceived(r)) return 0
    if (r.amountRemaining !== undefined && r.amountRemaining !== null && Number(r.amountRemaining) > 0) {
      return Number(r.amountRemaining)
    }
    return Number(r.amount || 0)
  }

  const getReceivableReceived = (r) => {
    if (isReceived(r)) return Number(r.amount || 0)
    if (r.amountPaid !== undefined && r.amountPaid !== null && Number(r.amountPaid) > 0) {
      return Number(r.amountPaid)
    }
    return 0
  }

  const filteredReceivables = receivables.filter(item => {
    const matchesClient = selectedClientId ? item.clientId === selectedClientId : true
    const matchesStatus = filterStatus === 'all'
      ? true
      : filterStatus === 'received'
      ? isReceived(item) || getReceivableReceived(item) > 0
      : filterStatus === 'overdue'
      ? isOverdue(item)
      : item.status === filterStatus

    const matchesSearch =
      item.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.invoiceNumber && item.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()))

    return matchesClient && matchesStatus && matchesSearch
  })

  const totalAmount = filteredReceivables.reduce((acc, r) => acc + (Number(r.amount) || 0), 0)
  const receivedAmount = filteredReceivables.reduce((acc, r) => acc + getReceivableReceived(r), 0)
  const overdueAmount = filteredReceivables
    .filter(r => isOverdue(r))
    .reduce((acc, r) => acc + getReceivableRemaining(r), 0)

  const handleCreateSubmit = (e) => {
    e.preventDefault()
    if (!formData.customer || !formData.amount) return

    const newReceivable = {
      id: `rec-${Date.now()}`,
      clientId: formData.clientId,
      customer: formData.customer,
      category: formData.category,
      description: formData.description || 'Recebimento via Amici BPO',
      amount: parseFloat(formData.amount),
      dueDate: formData.dueDate,
      status: 'pending',
      paymentMethod: formData.paymentMethod,
      invoiceNumber: formData.invoiceNumber || `NF-${Math.floor(Math.random() * 9000 + 1000)}`
    }

    onAddReceivable(newReceivable)
    setShowAddModal(false)
    setFormData({
      clientId: selectedClientId || (clients[0]?.id || ''),
      customer: '',
      category: 'Venda de Serviços / Assinatura',
      description: '',
      amount: '',
      dueDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'Boleto Bancário',
      invoiceNumber: ''
    })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <TrendingUp className="w-7 h-7 text-emerald-400" />
            <span>Contas a Receber & Faturamento</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Previsão de entradas, emissão de boletos Conta Azul e régua de cobrança.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950/40 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Recebível</span>
        </button>
      </div>

      {/* Cards de Métricas de Recebíveis */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Previsto</span>
          <div className="text-2xl font-bold text-white mt-2 font-mono">{formatCurrency(totalAmount)}</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Total Liquidado (Recebido)</span>
          <div className="text-2xl font-bold text-emerald-400 mt-2 font-mono">{formatCurrency(receivedAmount)}</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">Em Atraso (Inadimplência)</span>
          <div className="text-2xl font-bold text-rose-400 mt-2 font-mono">{formatCurrency(overdueAmount)}</div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por cliente sacado, nota fiscal ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full md:w-auto">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'pending', label: 'Previstos / Pendentes' },
              { id: 'overdue', label: 'Vencidos' },
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
        </div>
      </div>

      {/* Tabela de Recebíveis */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 font-semibold">Cliente Sacado / Devedor</th>
                <th className="pb-3 font-semibold">Empresa BPO</th>
                <th className="pb-3 font-semibold">Categoria</th>
                <th className="pb-3 font-semibold">Documento</th>
                <th className="pb-3 font-semibold">Vencimento</th>
                <th className="pb-3 font-semibold">Valor</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Régua de Cobrança</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredReceivables.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-500">
                    Nenhum recebível localizado para os filtros informados.
                  </td>
                </tr>
              ) : (
                filteredReceivables.map(item => {
                  const client = clients.find(c => c.id === item.clientId)
                  const badge = getStatusBadge(item.status)

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 font-medium text-slate-200">
                        <div className="font-semibold text-white">{item.customer}</div>
                        <div className="text-[11px] text-slate-400">{item.description}</div>
                      </td>

                      <td className="py-3 text-slate-300 font-medium">
                        {client?.tradeName || '-'}
                      </td>

                      <td className="py-3 text-slate-400">{item.category}</td>

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
                        <div className="flex items-center justify-end gap-1.5">
                          {item.status !== 'received' && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  alert(`Lembrete amigável de cobrança enviado para o cliente ${item.customer} referente à ${item.invoiceNumber}!`)
                                }}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                                title="Enviar Lembrete por E-mail"
                              >
                                <Mail className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => onUpdateReceivableStatus(item.id, 'received')}
                                className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                                title="Confirmar Recebimento / Baixa"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                            </>
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

      {/* Modal Novo Recebível */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Novo Recebível / Venda</h3>
                  <p className="text-xs text-slate-400">Registrar previsão de faturamento no Conta Azul</p>
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.tradeName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Cliente Sacado / Tomador *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Nexus Corp Ltda"
                    value={formData.customer}
                    onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Valor a Receber (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Data de Vencimento *</label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Forma de Pagamento</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Boleto Bancário">Boleto Bancário</option>
                    <option value="PIX Direto">PIX Direto</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Transferência TED/DOC">Transferência TED/DOC</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nota Fiscal / Número do Pedido (Opcional)</label>
                <input
                  type="text"
                  placeholder="NFS-e 4980"
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
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
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-semibold text-white shadow-lg shadow-emerald-950/40"
                >
                  Salvar Recebível
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
