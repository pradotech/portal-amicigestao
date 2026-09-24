import React, { useState } from 'react'
import { AmiciLogo } from '../components/AmiciLogo'
import {
  Building2,
  Plus,
  Zap,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  DollarSign,
  TrendingUp,
  CreditCard,
  Layers
} from 'lucide-react'
import { AddClientTokenModal } from '../components/AddClientTokenModal'
import { LogOut } from 'lucide-react'

export function LandingCompanySelectView({
  clients,
  onSelectClient,
  onAddClient,
  isSyncing,
  activeTokenConfig,
  onLogout
}) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [loadingClientId, setLoadingClientId] = useState(null)

  const handleChooseClient = async (client) => {
    setLoadingClientId(client.id)
    await onSelectClient(client)
    setLoadingClientId(null)
  }

  // Identifica a Drillex como a conta conectada principal
  const drillexClient = clients.find(c => c.tradeName.toLowerCase().includes('drillex')) || clients[0]
  const otherClients = clients.filter(c => c.id !== drillexClient?.id)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden selection:bg-cyan-500 selection:text-white">
      
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-sky-600/5 blur-[150px] rounded-full pointer-events-none" />

      {/* Header com Logo Amici */}
      <header className="w-full max-w-6xl mx-auto px-6 py-8 flex items-center justify-between relative z-10">
        <AmiciLogo className="h-12" />
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-400 font-medium">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Portal BPO Gestão Financeira</span>
          </div>
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              title="Encerrar sessão de usuário"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/50 text-xs font-semibold text-slate-400 hover:text-rose-300 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          )}
        </div>
      </header>

      {/* Conteúdo Central: Escolha do Cliente */}
      <main className="w-full max-w-5xl mx-auto px-6 py-8 relative z-10 flex-1 flex flex-col justify-center">
        
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
          <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Central de Acesso Amici BPO
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Qual cliente você deseja acessar?
          </h1>
          <p className="text-sm sm:text-base text-slate-400">
            Selecione a empresa para carregar os dados financeiros, fornecedores, clientes e extratos bancários integrados via Conta Azul.
          </p>
        </div>

        {/* Grid de Seleção de Clientes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto w-full">
          
          {/* Renderiza todos os clientes cadastrados da Amici */}
          {clients.map(client => {
            const isDrillex = client.tradeName.toLowerCase().includes('drillex')
            const companyId = client.contaAzulConfig?.companyId || (isDrillex ? activeTokenConfig?.companyId || '3272538' : 'Configurado')
            const userEmail = client.contaAzulConfig?.userEmail || (isDrillex ? activeTokenConfig?.userEmail || 'drilex.fin@amicigestao.com.br' : client.email)
            const isConnected = client.contaAzulStatus === 'connected' || !!client.contaAzulConfig?.accessToken || isDrillex

            return (
              <div
                key={client.id}
                onClick={() => handleChooseClient(client)}
                className="p-8 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-cyan-950/30 border border-cyan-800/60 hover:border-cyan-400 hover:shadow-2xl hover:shadow-cyan-950/60 transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between"
              >
                {/* Badge de Conectado */}
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-extrabold text-2xl group-hover:scale-110 transition-transform">
                    {client.tradeName.charAt(0).toUpperCase()}
                  </div>
                  {isConnected ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Conta Azul Online
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                      Sem Conexão API
                    </span>
                  )}
                </div>

                {/* Informações da Empresa */}
                <div className="space-y-2 mb-6">
                  <h2 className="text-2xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {client.tradeName}
                  </h2>
                  <p className="text-xs text-slate-400 font-mono truncate">
                    {client.corporateName || client.tradeName}
                  </p>
                  <div className="pt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono">
                    <span className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
                      Empresa Conta Azul #{companyId}
                    </span>
                    {userEmail && (
                      <span className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 truncate max-w-[200px]" title={userEmail}>
                        {userEmail}
                      </span>
                    )}
                  </div>
                </div>

                {/* Botão de Ação com Loading */}
                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs font-semibold text-cyan-400">
                    {loadingClientId === client.id ? 'Buscando dados na API Conta Azul...' : 'Clique para carregar o financeiro'}
                  </span>

                  <button
                    type="button"
                    disabled={loadingClientId === client.id}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-900/40 flex items-center gap-2 group-hover:translate-x-1 transition-transform"
                  >
                    {loadingClientId === client.id ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>Conectando...</span>
                      </>
                    ) : (
                      <>
                        <span>Acessar {client.tradeName}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                {/* Barra decorativa */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-sky-500 to-transparent" />
              </div>
            )
          })}

          {/* Card: CONECTAR FUTURO CLIENTE */}
          <div
            onClick={() => setShowAddModal(true)}
            className="p-8 rounded-3xl bg-slate-900/40 border-2 border-dashed border-slate-800 hover:border-cyan-500/80 hover:bg-slate-900/80 transition-all cursor-pointer group flex flex-col justify-between text-center items-center min-h-[300px]"
          >
            <div className="flex-1 flex flex-col items-center justify-center space-y-4 my-6">
              <div className="w-16 h-16 rounded-3xl bg-slate-800/80 border border-slate-700 text-slate-400 group-hover:text-cyan-400 group-hover:border-cyan-500/40 group-hover:bg-cyan-500/10 flex items-center justify-center transition-all">
                <Plus className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                  + Conectar Futuro Cliente
                </h3>
                <p className="text-xs text-slate-400 max-w-xs mt-1 leading-relaxed">
                  Adicione uma nova empresa à carteira da Amici colando os tokens da Conta Azul dela.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="w-full py-3 px-4 rounded-xl bg-slate-800 group-hover:bg-cyan-600 text-slate-300 group-hover:text-white font-bold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <span>Cadastrar Novo Cliente BPO</span>
              <Plus className="w-4 h-4" />
            </button>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-6 py-6 text-center text-xs text-slate-500 border-t border-slate-900">
        Amici Gestão Financeira • Sistema Integrado de BPO Multicliente com a Conta Azul
      </footer>

      {/* Modal para Adicionar Futuro Cliente */}
      <AddClientTokenModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSaveClient={(newClient) => {
          onAddClient(newClient)
          onSelectClient(newClient)
        }}
      />

    </div>
  )
}
