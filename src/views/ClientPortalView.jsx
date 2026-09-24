import React, { useState } from 'react'
import {
  Building2,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  TrendingUp,
  FileSpreadsheet,
  Download,
  MessageCircle,
  Clock,
  ShieldCheck,
  DollarSign,
  Send,
  X,
  Check
} from 'lucide-react'
import { formatCurrency, formatDate } from '../utils/formatters'

export function ClientPortalView({
  client,
  payables,
  receivables,
  onApprovePayable,
  onRejectPayable
}) {
  const [approvedIds, setApprovedIds] = useState([])
  const [feedbackNotes, setFeedbackNotes] = useState('')

  if (!client) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-3">
        <Building2 className="w-12 h-12 text-cyan-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Nenhum cliente selecionado</h2>
        <p className="text-xs">Selecione uma empresa no topo para visualizar a área do cliente.</p>
      </div>
    )
  }

  const clientPayables = payables.filter(p => p.clientId === client.id)
  const clientReceivables = receivables.filter(r => r.clientId === client.id)

  const pendingApproval = clientPayables.filter(p => p.status === 'pending_client')
  const totalPending = pendingApproval.reduce((acc, p) => acc + (p.amount || 0), 0)

  const handleApprove = (id) => {
    setApprovedIds(prev => [...prev, id])
    onApprovePayable(id)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Banner de Boas-Vindas da Área do Cliente */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-sky-950/60 to-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Portal de Gestão Financeira BPO Amici</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Olá, Gestor da {client.tradeName}
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              Acompanhe suas contas, aprove pagamentos agendados e consulte a saúde financeira da sua empresa em tempo real.
            </p>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80">
            <div className="w-10 h-10 rounded-full bg-cyan-600/20 text-cyan-400 flex items-center justify-center font-bold">
              AS
            </div>
            <div className="text-xs">
              <div className="text-slate-400">Analista Responsável:</div>
              <div className="font-bold text-white">{client.financialAnalyst}</div>
              <a
                href={`https://wa.me/5511999999999?text=Ol%C3%A1%20Amici,%20gostaria%20de%20tirar%20uma%20d%C3%BAvida%20sobre%20o%20financeiro%20da%20${encodeURIComponent(client.tradeName)}`}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline flex items-center gap-1 mt-0.5"
              >
                <MessageCircle className="w-3 h-3" /> Falar no WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Resumo Rápido */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Saldo Consolidado</span>
          <div className="text-2xl font-bold text-white mt-2 font-mono">{formatCurrency(client.cashBalance)}</div>
          <span className="text-[11px] text-emerald-400 mt-1 block">Contas Bancárias Integradas</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Aguardando Sua Aprovação</span>
          <div className="text-2xl font-bold text-amber-400 mt-2 font-mono">{formatCurrency(totalPending)}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">{pendingApproval.length} pagamentos pendentes</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Faturamento do Mês</span>
          <div className="text-2xl font-bold text-cyan-400 mt-2 font-mono">{formatCurrency(client.monthlyRevenue)}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Sincronizado via Conta Azul</span>
        </div>
      </div>

      {/* Pagamentos Aguardando Aprovação */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-400" />
              <span>Borderô Diário de Pagamentos (Aprovação Obrigatória)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Os pagamentos abaixo foram preparados pela equipe Amici e necessitam do seu aval para liquidação.
            </p>
          </div>

          {pendingApproval.length > 0 && (
            <button
              type="button"
              onClick={() => {
                pendingApproval.forEach(p => onApprovePayable(p.id))
                alert('Todos os pagamentos foram aprovados com sucesso!')
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-emerald-950/30 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Aprovar Todos ({pendingApproval.length})</span>
            </button>
          )}
        </div>

        {pendingApproval.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            Nenhum pagamento pendente de autorização no momento. Tudo em dia!
          </div>
        ) : (
          <div className="space-y-3">
            {pendingApproval.map(item => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{item.supplier}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{item.description}</p>
                  <div className="text-[11px] text-slate-500">
                    Vencimento: <strong className="text-slate-300 font-mono">{formatDate(item.dueDate)}</strong> • Banco: {item.bankAccount}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-left sm:text-right">
                    <span className="text-lg font-bold text-white font-mono">{formatCurrency(item.amount)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleApprove(item.id)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Aprovar</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
