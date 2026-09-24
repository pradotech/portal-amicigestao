import React, { useState } from 'react'
import {
  Users,
  Plus,
  Search,
  Building2,
  Phone,
  Mail,
  Zap,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Edit2,
  DollarSign,
  TrendingUp,
  Sparkles,
  ArrowRight,
  X
} from 'lucide-react'
import { formatCurrency, formatCNPJ, formatDate } from '../utils/formatters'
import { AddClientTokenModal } from '../components/AddClientTokenModal'

export function ClientsView({
  clients,
  selectedClientId,
  onSelectClient,
  onAddClient,
  onSyncClient,
  isSyncing
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSegment, setFilterSegment] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)

  const filteredClients = clients.filter(c => {
    const matchesSearch =
      c.tradeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.corporateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.cnpj.includes(searchTerm)
    const matchesSegment = filterSegment === 'all' || c.segment === filterSegment
    return matchesSearch && matchesSegment
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Cabeçalho da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Gestão Multicliente Amici BPO</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Building2 className="w-8 h-8 text-cyan-400" />
            <span>Escolha a Empresa para Administrar</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Selecione entre a <strong>Drillex</strong> ou conecte novos clientes com suas respectivas contas da Conta Azul.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white text-xs font-bold shadow-xl shadow-cyan-950/50 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Conectar Novo Cliente Conta Azul</span>
        </button>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar empresa por nome ou CNPJ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={filterSegment}
            onChange={(e) => setFilterSegment(e.target.value)}
            className="px-3 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          >
            <option value="all">Todos os Segmentos</option>
            <option value="Indústria & Serviços">Indústria & Serviços</option>
            <option value="Tecnologia / SaaS">Tecnologia / SaaS</option>
            <option value="Alimentação & Gastronomia">Alimentação & Gastronomia</option>
          </select>

          <span className="text-xs text-slate-400 whitespace-nowrap">
            {filteredClients.length} {filteredClients.length === 1 ? 'empresa' : 'empresas'}
          </span>
        </div>
      </div>

      {/* Grid Principal de Empresas / Clientes BPO */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Card de Adição Rápida */}
        <div
          onClick={() => setShowAddModal(true)}
          className="p-6 rounded-3xl border-2 border-dashed border-cyan-800/60 hover:border-cyan-500 bg-cyan-950/10 hover:bg-cyan-950/30 transition-all cursor-pointer flex flex-col items-center justify-center text-center group min-h-[300px]"
        >
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform mb-3 border border-cyan-500/20">
            <Plus className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-white text-base group-hover:text-cyan-300">Conectar Novo Cliente BPO</h3>
          <p className="text-xs text-slate-400 max-w-xs mt-1">
            Cole os tokens ou integre a conta Conta Azul de um novo cliente da Amici.
          </p>
          <span className="mt-4 text-xs font-semibold text-cyan-400 flex items-center gap-1">
            <span>Adicionar Conta</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </span>
        </div>

        {/* Cards das Empresas Cadastradas (Drillex, etc.) */}
        {filteredClients.map(client => {
          const isSelected = selectedClientId === client.id
          const isDrillex = client.tradeName.toLowerCase().includes('drillex')

          return (
            <div
              key={client.id}
              className={`p-6 rounded-3xl border transition-all shadow-xl flex flex-col justify-between relative overflow-hidden ${
                isSelected
                  ? 'bg-gradient-to-b from-cyan-950/60 to-slate-900 border-cyan-500 shadow-cyan-950/40 ring-2 ring-cyan-500/30'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Header do Card */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-white text-lg shadow-lg"
                      style={{ backgroundColor: client.color || '#0077B6' }}
                    >
                      {client.tradeName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-white text-lg leading-tight">
                          {client.tradeName}
                        </h3>
                        {isDrillex && (
                          <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold">
                            API V2 Ativa
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{client.cnpj}</p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Conta Azul OK
                  </span>
                </div>

                {/* Detalhes do Contrato */}
                <div className="space-y-2 py-3 border-y border-slate-800/80 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Segmento:</span>
                    <span className="text-slate-200 font-medium">{client.segment}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Regime:</span>
                    <span className="text-slate-200 font-medium">{client.taxRegime}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>E-mail:</span>
                    <span className="text-cyan-300 font-mono text-[11px] truncate max-w-[170px]">{client.email}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Honorários BPO:</span>
                    <span className="text-emerald-400 font-bold">{formatCurrency(client.monthlyFee)}/mês</span>
                  </div>
                </div>

                {/* Resumo Financeiro da Empresa */}
                <div className="grid grid-cols-2 gap-3 my-4">
                  <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/40">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Faturamento</span>
                    <span className="text-xs font-bold text-white font-mono">{formatCurrency(client.monthlyRevenue)}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/40">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Saldo em Caixa</span>
                    <span className="text-xs font-bold text-emerald-400 font-mono">{formatCurrency(client.cashBalance)}</span>
                  </div>
                </div>
              </div>

              {/* Botão de Seleção / Administração */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSelectClient(client.id)}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30'
                      : 'bg-slate-800 hover:bg-cyan-600 text-white hover:shadow-md'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{isSelected ? '✓ Empresa em Edição' : `Administrar ${client.tradeName}`}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSyncClient(client)}
                  disabled={isSyncing}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium transition-colors"
                  title="Sincronizar Conta Azul desta empresa"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isSyncing ? 'animate-spin' : ''}`} />
                </button>
              </div>

            </div>
          )
        })}

      </div>

      {/* Modal de Conexão Rápida com Tokens da Conta Azul */}
      <AddClientTokenModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSaveClient={onAddClient}
      />

    </div>
  )
}
