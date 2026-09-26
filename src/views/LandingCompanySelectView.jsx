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
  Layers,
  Sun,
  Moon,
  LogOut
} from 'lucide-react'
import { AddClientTokenModal } from '../components/AddClientTokenModal'

export function LandingCompanySelectView({
  clients,
  onSelectClient,
  onAddClient,
  isSyncing,
  activeTokenConfig,
  onLogout,
  theme = 'light',
  onToggleTheme
}) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [loadingClientId, setLoadingClientId] = useState(null)
  const isLight = theme === 'light'

  const handleChooseClient = async (client) => {
    setLoadingClientId(client.id)
    await onSelectClient(client)
    setLoadingClientId(null)
  }

  // Identifica a Drillex como a conta conectada principal
  const drillexClient = clients.find(c => c.tradeName.toLowerCase().includes('drillex')) || clients[0]
  const otherClients = clients.filter(c => c.id !== drillexClient?.id)

  return (
    <div className={`min-h-screen flex flex-col justify-between relative overflow-hidden selection:bg-cyan-500 selection:text-white transition-colors ${
      isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      
      {/* Background Glows */}
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] blur-[120px] rounded-full pointer-events-none ${
        isLight ? 'bg-cyan-500/10' : 'bg-cyan-600/10'
      }`} />
      <div className={`absolute bottom-0 right-0 w-[500px] h-[500px] blur-[150px] rounded-full pointer-events-none ${
        isLight ? 'bg-sky-500/5' : 'bg-sky-600/5'
      }`} />

      {/* Header com Logo Amici */}
      <header className="w-full max-w-6xl mx-auto px-6 py-8 flex items-center justify-between relative z-10">
        <AmiciLogo className="h-10 sm:h-12" variant={theme} />
        <div className="flex items-center gap-3">
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              title={isLight ? 'Alternar para Tema Escuro' : 'Alternar para Tema Claro'}
              className={`p-2 sm:px-3 sm:py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm ${
                isLight
                  ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-cyan-400'
              }`}
            >
              {isLight ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-cyan-700" />
                  <span className="hidden sm:inline font-medium">Tema Escuro</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline font-medium">Tema Claro</span>
                </>
              )}
            </button>
          )}

          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-medium shadow-sm ${
            isLight
              ? 'bg-white border-slate-200 text-slate-700'
              : 'bg-slate-900 border-slate-800 text-slate-400'
          }`}>
            <ShieldCheck className="w-4 h-4 text-cyan-600" />
            <span className="hidden sm:inline">Portal BPO Gestão Financeira</span>
          </div>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              title="Encerrar sessão de usuário"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-sm ${
                isLight
                  ? 'bg-white hover:bg-rose-50 border-slate-200 text-slate-700 hover:text-rose-700'
                  : 'bg-slate-900/80 hover:bg-rose-950/40 border-slate-800 text-slate-400 hover:text-rose-300'
              }`}
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
          <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-1.5 border ${
            isLight
              ? 'bg-sky-100 border-sky-200 text-sky-800'
              : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
          }`}>
            <Sparkles className="w-3.5 h-3.5" />
            Central de Acesso Amici BPO
          </span>
          <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}>
            Qual cliente você deseja acessar?
          </h1>
          <p className={`text-sm sm:text-base ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
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
                className={`p-8 rounded-3xl border transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between ${
                  isLight
                    ? 'bg-white border-slate-200 hover:border-cyan-500 hover:shadow-2xl shadow-sm'
                    : 'bg-gradient-to-b from-slate-900 via-slate-900/90 to-cyan-950/30 border-cyan-800/60 hover:border-cyan-400 hover:shadow-2xl hover:shadow-cyan-950/60'
                }`}
              >
                {/* Badge de Conectado */}
                <div className="flex items-center justify-between mb-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-extrabold text-2xl group-hover:scale-110 transition-transform ${
                    isLight
                      ? 'bg-sky-100 text-sky-800 border border-sky-200'
                      : 'bg-cyan-600/20 border border-cyan-500/30 text-cyan-400'
                  }`}>
                    {client.tradeName.charAt(0).toUpperCase()}
                  </div>
                  {isConnected ? (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-sm border ${
                      isLight
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Conta Azul Online
                    </span>
                  ) : (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                      isLight
                        ? 'bg-slate-100 text-slate-600 border-slate-200'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      Sem Conexão API
                    </span>
                  )}
                </div>

                {/* Informações da Empresa */}
                <div className="space-y-2 mb-6">
                  <h2 className={`text-2xl font-bold transition-colors ${
                    isLight ? 'text-slate-900 group-hover:text-cyan-700' : 'text-white group-hover:text-cyan-300'
                  }`}>
                    {client.tradeName}
                  </h2>
                  <p className={`text-xs font-mono truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {client.corporateName || client.tradeName}
                  </p>
                  <div className="pt-3 flex flex-wrap items-center gap-2 text-xs font-mono">
                    <span className={`px-2.5 py-1 rounded-lg border ${
                      isLight
                        ? 'bg-slate-100 text-slate-700 border-slate-200'
                        : 'bg-slate-800/80 text-slate-400 border-slate-700'
                    }`}>
                      Empresa Conta Azul #{companyId}
                    </span>
                    {userEmail && (
                      <span className={`px-2.5 py-1 rounded-lg border truncate max-w-[200px] ${
                        isLight
                          ? 'bg-slate-100 text-slate-700 border-slate-200'
                          : 'bg-slate-800/80 text-slate-400 border-slate-700'
                      }`} title={userEmail}>
                        {userEmail}
                      </span>
                    )}
                  </div>
                </div>

                {/* Botão de Ação com Loading */}
                <div className={`pt-4 border-t flex items-center justify-between ${
                  isLight ? 'border-slate-100' : 'border-slate-800/80'
                }`}>
                  <span className={`text-xs font-semibold ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>
                    {loadingClientId === client.id ? 'Buscando dados na API Conta Azul...' : 'Clique para carregar o financeiro'}
                  </span>

                  <button
                    type="button"
                    disabled={loadingClientId === client.id}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-900/20 flex items-center gap-2 group-hover:translate-x-1 transition-transform"
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
            className={`p-8 rounded-3xl border-2 border-dashed transition-all cursor-pointer group flex flex-col justify-between text-center items-center min-h-[300px] ${
              isLight
                ? 'bg-white/60 border-slate-300 hover:border-cyan-500 hover:bg-white shadow-sm'
                : 'bg-slate-900/40 border-slate-800 hover:border-cyan-500/80 hover:bg-slate-900/80'
            }`}
          >
            <div className="my-auto space-y-4">
              <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center transition-all ${
                isLight
                  ? 'bg-slate-100 text-slate-600 group-hover:bg-cyan-50 group-hover:text-cyan-600 border border-slate-200'
                  : 'bg-slate-800/80 border border-slate-700 text-slate-400 group-hover:border-cyan-500 group-hover:text-cyan-300'
              }`}>
                <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
              </div>
              <div className="space-y-1">
                <h3 className={`text-lg font-bold transition-colors ${
                  isLight ? 'text-slate-800 group-hover:text-cyan-700' : 'text-slate-200 group-hover:text-white'
                }`}>
                  + Conectar Futuro Cliente
                </h3>
                <p className={`text-xs max-w-[240px] mx-auto ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Adicione uma nova empresa à carteira da Amici colando os tokens da Conta Azul dela.
                </p>
              </div>
            </div>

            <button
              type="button"
              className={`w-full py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                  : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              Cadastrar Novo Cliente BPO +
            </button>
          </div>

        </div>

      </main>

      {/* Footer Simples */}
      <footer className={`w-full max-w-6xl mx-auto px-6 py-6 text-center text-xs border-t ${
        isLight ? 'border-slate-200 text-slate-500' : 'border-slate-900 text-slate-600'
      }`}>
        Amici Gestão Financeira • Sistema de Monitoramento Executivo & BPO
      </footer>

      {/* Modal de Adicionar Novo Cliente */}
      <AddClientTokenModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSaveClient={(newClient) => {
          onAddClient(newClient)
          setShowAddModal(false)
        }}
      />
    </div>
  )
}
