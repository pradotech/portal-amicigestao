import React, { useState } from 'react'
import {
  Scale,
  CheckCircle2,
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
  Zap,
  Building2,
  Calendar,
  Filter
} from 'lucide-react'
import { formatCurrency, formatDate } from '../utils/formatters'

export function ReconciliationView({
  transactions,
  clients,
  selectedClientId,
  onReconcileTransaction,
  onReconcileAll
}) {
  const [filterBank, setFilterBank] = useState('all')
  const [filterReconciled, setFilterReconciled] = useState('pending') // pending, reconciled, all

  const filteredTransactions = transactions.filter(tx => {
    const matchesClient = selectedClientId ? tx.clientId === selectedClientId : true
    const matchesBank = filterBank === 'all' ? true : tx.bank === filterBank
    const matchesReconciled =
      filterReconciled === 'all'
        ? true
        : filterReconciled === 'pending'
        ? !tx.isReconciled
        : tx.isReconciled

    return matchesClient && matchesBank && matchesReconciled
  })

  const pendingCount = transactions.filter(tx =>
    (selectedClientId ? tx.clientId === selectedClientId : true) && !tx.isReconciled
  ).length

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Scale className="w-7 h-7 text-cyan-400" />
            <span>Conciliação Bancária Diária</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Conferência e pareamento automático entre extratos bancários e lançamentos da Conta Azul.
          </p>
        </div>

        {pendingCount > 0 && (
          <button
            type="button"
            onClick={onReconcileAll}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-950/40 transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>Conciliar Sugestões com 1 Clique ({pendingCount})</span>
          </button>
        )}
      </div>

      {/* Cards de Resumo da Conciliação */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total de Transações</span>
          <div className="text-2xl font-black text-white mt-1.5 font-mono">{transactions.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Lançamentos importados do extrato</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-rose-500/30 shadow-md">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">Pendências de Conciliação</span>
          <div className="text-2xl font-black text-rose-400 mt-1.5 font-mono">{pendingCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Aguardando confirmação do analista</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-emerald-500/30 shadow-md">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">100% Conciliadas</span>
          <div className="text-2xl font-black text-emerald-400 mt-1.5 font-mono">{transactions.length - pendingCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Integradas com a Conta Azul</div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5">
            {[
              { id: 'pending', label: 'Pendentes' },
              { id: 'reconciled', label: 'Conciliados' },
              { id: 'all', label: 'Todos' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterReconciled(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  filterReconciled === tab.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Mostrando {filteredTransactions.length} transações
        </div>
      </div>

      {/* Lista de Transações para Conciliação */}
      <div className="space-y-4">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-slate-900/80 border border-slate-800 text-slate-400 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-base font-bold text-white">Tudo 100% Conciliado!</h3>
            <p className="text-xs text-slate-500">
              Não existem pendências de conciliação bancária para a seleção atual.
            </p>
          </div>
        ) : (
          filteredTransactions.map(tx => {
            const client = clients.find(c => c.id === tx.clientId)
            const isCredit = tx.type === 'credit'

            return (
              <div
                key={tx.id}
                className={`p-5 rounded-2xl border transition-all ${
                  tx.isReconciled
                    ? 'bg-slate-900/40 border-slate-800/80 opacity-75'
                    : 'bg-slate-900/90 border-cyan-900/40 shadow-lg hover:border-cyan-700/60'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Detalhes da Linha do Extrato */}
                  <div className="flex items-start gap-3.5">
                    <div className={`p-2.5 rounded-xl ${isCredit ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'} flex-shrink-0 mt-0.5`}>
                      {isCredit ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">{tx.description}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium">
                          {tx.bank}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span>Cliente: <strong className="text-slate-300">{client?.tradeName}</strong></span>
                        <span>•</span>
                        <span className="font-mono">{formatDate(tx.date)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Valor e Match Sugerido */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between lg:justify-end gap-4 lg:gap-8 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                    <div className="text-left sm:text-right">
                      <span className={`text-base font-extrabold font-mono ${isCredit ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isCredit ? '+' : ''}{formatCurrency(tx.amount)}
                      </span>

                      {tx.isReconciled ? (
                        <div className="flex items-center sm:justify-end gap-1.5 text-xs text-emerald-400 font-medium mt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Conciliado com: {tx.matchedEntity}</span>
                        </div>
                      ) : (
                        <div className="flex items-center sm:justify-end gap-1.5 text-xs text-cyan-400 mt-0.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span className="truncate max-w-xs">{tx.suggestedMatch}</span>
                        </div>
                      )}
                    </div>

                    {!tx.isReconciled && (
                      <button
                        type="button"
                        onClick={() => onReconcileTransaction(tx.id)}
                        className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-all shadow-md shadow-cyan-900/30 whitespace-nowrap active:scale-95"
                      >
                        Aprovar Match
                      </button>
                    )}
                  </div>

                </div>
              </div>
            )
          })
        )}
      </div>

    </div>
  )
}
