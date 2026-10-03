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
  Globe,
  Ship,
  Briefcase,
  Sun,
  Moon,
  LogOut,
  ChevronRight,
  Check
} from 'lucide-react'
import { AddClientTokenModal } from '../components/AddClientTokenModal'

export function LandingCompanySelectView({
  clients = [],
  onSelectClient,
  onAddClient,
  isSyncing,
  activeTokenConfig,
  onLogout,
  theme = 'light',
  onToggleTheme
}) {
  const [selectedDivisionTab, setSelectedDivisionTab] = useState('all') // 'all' | 'gestao' | 'comex'
  const [showAddModal, setShowAddModal] = useState(false)
  const [defaultAddDivision, setDefaultAddDivision] = useState('gestao')
  const [loadingClientId, setLoadingClientId] = useState(null)
  const isLight = theme === 'light'

  const handleChooseClient = async (client) => {
    setLoadingClientId(client.id)
    await onSelectClient(client)
    setLoadingClientId(null)
  }

  const handleOpenAddModal = (division = 'gestao') => {
    setDefaultAddDivision(division)
    setShowAddModal(true)
  }

  // Separação dos clientes por Unidade de Negócio
  const gestaoClients = clients.filter(c => {
    if (c.division === 'gestao') return true
    if (c.division === 'comex') return false
    const name = (c.tradeName || c.corporateName || '').toLowerCase()
    return !name.includes('comex') && !name.includes('lumens')
  })

  const comexClients = clients.filter(c => {
    if (c.division === 'comex') return true
    if (c.division === 'gestao') return false
    const name = (c.tradeName || c.corporateName || '').toLowerCase()
    return name.includes('comex') || name.includes('lumens')
  })

  // Clientes filtrados pela aba ativa
  const displayedClients = selectedDivisionTab === 'gestao'
    ? gestaoClients
    : selectedDivisionTab === 'comex'
      ? comexClients
      : clients

  return (
    <div className={`min-h-screen flex flex-col justify-between relative overflow-hidden selection:bg-cyan-500 selection:text-white transition-colors ${
      isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      
      {/* Background Glows */}
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] blur-[140px] rounded-full pointer-events-none ${
        isLight ? 'bg-cyan-500/10' : 'bg-cyan-600/10'
      }`} />
      <div className={`absolute bottom-0 right-0 w-[500px] h-[500px] blur-[160px] rounded-full pointer-events-none ${
        isLight ? 'bg-emerald-500/5' : 'bg-emerald-600/5'
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
            <span className="hidden sm:inline">Portal Amici Gestão & Comex</span>
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

      {/* Conteúdo Central: Escolha do Cliente com Distinção de Unidades */}
      <main className="w-full max-w-6xl mx-auto px-6 py-6 relative z-10 flex-1 flex flex-col justify-center">
        
        {/* Título Principal */}
        <div className="text-center max-w-3xl mx-auto mb-8 space-y-3">
          <span className={`px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-1.5 border ${
            isLight
              ? 'bg-sky-100/80 border-sky-200 text-sky-800'
              : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
          }`}>
            <Sparkles className="w-3.5 h-3.5" />
            Central de Acesso Corporativo Amici
          </span>
          <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}>
            Selecione a Empresa / Unidade
          </h1>
          <p className={`text-sm sm:text-base max-w-2xl mx-auto ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Acesse a <strong className={isLight ? 'text-slate-900' : 'text-white'}>Amici Gestão</strong> (BPO Financeiro Drillex via Conta Azul) ou a <strong className={isLight ? 'text-slate-900' : 'text-white'}>Amici Comex</strong> (Operações BR Lumens via Bling ERP).
          </p>
        </div>

        {/* Abas de Navegação / Distinção de Unidades */}
        <div className="flex justify-center mb-8">
          <div className={`p-1.5 rounded-2xl border flex items-center gap-1 shadow-sm backdrop-blur-md ${
            isLight ? 'bg-white/80 border-slate-200' : 'bg-slate-900/80 border-slate-800'
          }`}>
            <button
              type="button"
              onClick={() => setSelectedDivisionTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                selectedDivisionTab === 'all'
                  ? (isLight ? 'bg-slate-900 text-white shadow-md' : 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20')
                  : (isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800/60')
              }`}
            >
              <span>Todas as Empresas</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                selectedDivisionTab === 'all'
                  ? (isLight ? 'bg-white/20 text-white' : 'bg-slate-950/20 text-slate-950')
                  : (isLight ? 'bg-slate-100 text-slate-700' : 'bg-slate-800 text-slate-300')
              }`}>
                {clients.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedDivisionTab('gestao')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                selectedDivisionTab === 'gestao'
                  ? (isLight ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20' : 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20')
                  : (isLight ? 'text-slate-600 hover:text-sky-700 hover:bg-sky-50' : 'text-slate-400 hover:text-sky-300 hover:bg-slate-800/60')
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Amici Gestão (Drillex)</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                selectedDivisionTab === 'gestao'
                  ? (isLight ? 'bg-white/20 text-white' : 'bg-slate-950/20 text-slate-950')
                  : (isLight ? 'bg-sky-100 text-sky-800' : 'bg-sky-950/80 text-sky-300')
              }`}>
                {gestaoClients.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedDivisionTab('comex')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                selectedDivisionTab === 'comex'
                  ? (isLight ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20')
                  : (isLight ? 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50' : 'text-slate-400 hover:text-emerald-300 hover:bg-slate-800/60')
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Amici Comex (BR Lumens)</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                selectedDivisionTab === 'comex'
                  ? (isLight ? 'bg-white/20 text-white' : 'bg-slate-950/20 text-slate-950')
                  : (isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-950/80 text-emerald-300')
              }`}>
                {comexClients.length}
              </span>
            </button>
          </div>
        </div>

        {/* Grid de Cards de Empresas */}
        <div className="space-y-10 max-w-5xl mx-auto w-full">
          
          {/* SEÇÃO 1: AMICI GESTÃO (Se tab 'all' ou 'gestao') */}
          {(selectedDivisionTab === 'all' || selectedDivisionTab === 'gestao') && (
            <div className="space-y-4">
              {selectedDivisionTab === 'all' && (
                <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>Amici Gestão</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60">
                          BPO Financeiro • Conta Azul
                        </span>
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Gestão financeira de contas a pagar, receber, DRE gerencial e conciliação bancária da <strong>Drillex</strong>.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    {gestaoClients.length} {gestaoClients.length === 1 ? 'empresa' : 'empresas'}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {gestaoClients.map(client => renderClientCard(client, 'gestao'))}
                
                {/* Card de adicionar novo cliente BPO Gestão */}
                <div
                  onClick={() => handleOpenAddModal('gestao')}
                  className={`p-7 rounded-3xl border-2 border-dashed transition-all cursor-pointer group flex flex-col justify-between text-center items-center min-h-[280px] ${
                    isLight
                      ? 'bg-white/60 border-slate-300 hover:border-sky-500 hover:bg-sky-50/20 shadow-sm'
                      : 'bg-slate-900/40 border-slate-800 hover:border-sky-500/80 hover:bg-slate-900/80'
                  }`}
                >
                  <div className="my-auto space-y-3">
                    <div className={`w-13 h-13 rounded-2xl mx-auto flex items-center justify-center transition-all ${
                      isLight
                        ? 'bg-sky-50 text-sky-700 group-hover:bg-sky-100 border border-sky-200'
                        : 'bg-slate-800/80 border border-slate-700 text-sky-400 group-hover:border-sky-500 group-hover:text-sky-300'
                    }`}>
                      <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                    </div>
                    <div className="space-y-1">
                      <h3 className={`text-base font-bold transition-colors ${
                        isLight ? 'text-slate-800 group-hover:text-sky-700' : 'text-slate-200 group-hover:text-white'
                      }`}>
                        + Nova Empresa em Amici Gestão
                      </h3>
                      <p className={`text-xs max-w-[240px] mx-auto ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        Conecte uma nova conta Conta Azul para administrar no BPO da Amici Gestão.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`w-full py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      isLight
                        ? 'bg-sky-50 hover:bg-sky-100 border-sky-200 text-sky-800'
                        : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-sky-300 hover:text-white'
                    }`}
                  >
                    Adicionar Cliente Gestão +
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SEÇÃO 2: AMICI COMEX (Se tab 'all' ou 'comex') */}
          {(selectedDivisionTab === 'all' || selectedDivisionTab === 'comex') && (
            <div className="space-y-4">
              {selectedDivisionTab === 'all' && (
                <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800 pt-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>Amici Comex</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                          Comércio Exterior • Bling ERP
                        </span>
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Operações aduaneiras, importação de insumos/iluminação e financeiro da <strong>BR Lumens</strong> integrado via Bling ERP.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    {comexClients.length} {comexClients.length === 1 ? 'empresa' : 'empresas'}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {comexClients.map(client => renderClientCard(client, 'comex'))}

                {/* Card de adicionar nova operação / cliente Comex */}
                <div
                  onClick={() => handleOpenAddModal('comex')}
                  className={`p-7 rounded-3xl border-2 border-dashed transition-all cursor-pointer group flex flex-col justify-between text-center items-center min-h-[280px] ${
                    isLight
                      ? 'bg-white/60 border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/20 shadow-sm'
                      : 'bg-slate-900/40 border-slate-800 hover:border-emerald-500/80 hover:bg-slate-900/80'
                  }`}
                >
                  <div className="my-auto space-y-3">
                    <div className={`w-13 h-13 rounded-2xl mx-auto flex items-center justify-center transition-all ${
                      isLight
                        ? 'bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100 border border-emerald-200'
                        : 'bg-slate-800/80 border border-slate-700 text-emerald-400 group-hover:border-emerald-500 group-hover:text-emerald-300'
                    }`}>
                      <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                    </div>
                    <div className="space-y-1">
                      <h3 className={`text-base font-bold transition-colors ${
                        isLight ? 'text-slate-800 group-hover:text-emerald-700' : 'text-slate-200 group-hover:text-white'
                      }`}>
                        + Nova Empresa em Amici Comex
                      </h3>
                      <p className={`text-xs max-w-[240px] mx-auto ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        Cadastre uma nova operação de Comércio Exterior ou vincule credenciais do Bling ERP.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`w-full py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      isLight
                        ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800'
                        : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-emerald-300 hover:text-white'
                    }`}
                  >
                    Adicionar Operação Comex +
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

      </main>

      {/* Footer Simples */}
      <footer className={`w-full max-w-6xl mx-auto px-6 py-6 text-center text-xs border-t ${
        isLight ? 'border-slate-200 text-slate-500' : 'border-slate-900 text-slate-600'
      }`}>
        Amici Gestão Financeira & Amici Comex • Sistema de Monitoramento Executivo & BPO
      </footer>

      {/* Modal de Adicionar Novo Cliente */}
      <AddClientTokenModal
        isOpen={showAddModal}
        defaultDivision={defaultAddDivision}
        onClose={() => setShowAddModal(false)}
        onSaveClient={(newClient) => {
          onAddClient(newClient)
          setShowAddModal(false)
        }}
      />
    </div>
  )

  // Função auxiliar para renderizar cada card de cliente
  function renderClientCard(client, divisionType) {
    const nameLower = String(client.tradeName || '').toLowerCase()
    const isDrillex = nameLower.includes('drillex')
    const isBrlumens = nameLower.includes('lumens')
    const isComex = divisionType === 'comex' || client.division === 'comex' || nameLower.includes('comex') || isBrlumens
    const isBling = client.erpProvider === 'bling' || isComex || isBrlumens

    const companyId = client.contaAzulConfig?.companyId || (isDrillex ? activeTokenConfig?.companyId || '3272538' : 'Bling-3272539')
    const userEmail = client.contaAzulConfig?.userEmail || client.blingConfig?.userEmail || (isDrillex ? activeTokenConfig?.userEmail || 'drilex.fin@amicigestao.com.br' : client.email)
    const isConnected = client.contaAzulStatus === 'connected' || client.blingStatus === 'connected' || !!client.contaAzulConfig?.accessToken || isDrillex || isComex

    return (
      <div
        key={client.id}
        onClick={() => handleChooseClient(client)}
        className={`p-7 rounded-3xl border transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between ${
          isLight
            ? isComex
              ? 'bg-white border-slate-200 hover:border-emerald-500 hover:shadow-2xl shadow-sm'
              : 'bg-white border-slate-200 hover:border-sky-500 hover:shadow-2xl shadow-sm'
            : isComex
              ? 'bg-gradient-to-b from-slate-900 via-slate-900/90 to-emerald-950/30 border-emerald-800/60 hover:border-emerald-400 hover:shadow-2xl hover:shadow-emerald-950/60'
              : 'bg-gradient-to-b from-slate-900 via-slate-900/90 to-cyan-950/30 border-cyan-800/60 hover:border-cyan-400 hover:shadow-2xl hover:shadow-cyan-950/60'
        }`}
      >
        {/* Topo do Card: Ícone e Badges */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={`w-13 h-13 rounded-2xl flex items-center justify-center font-extrabold text-xl group-hover:scale-105 transition-transform ${
              isLight
                ? isComex
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-sky-100 text-sky-800 border border-sky-200'
                : isComex
                  ? 'bg-emerald-600/20 border border-emerald-500/30 text-emerald-400'
                  : 'bg-cyan-600/20 border border-cyan-500/30 text-cyan-400'
            }`}>
              {isComex ? <Globe className="w-6 h-6" /> : client.tradeName.charAt(0).toUpperCase()}
            </div>
            <div>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                isLight
                  ? isComex
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-sky-50 text-sky-800 border-sky-200'
                  : isComex
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
              }`}>
                {isComex ? <Ship className="w-3 h-3" /> : <Briefcase className="w-3 h-3" />}
                {isComex ? 'Amici Comex' : 'Amici Gestão'}
              </span>
            </div>
          </div>

          {/* Status Conexão ERP */}
          {isConnected ? (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-sm border ${
              isLight
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {isBling ? 'Bling Online (v3)' : 'Conta Azul Online'}
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
          <div className="flex items-baseline justify-between">
            <h2 className={`text-2xl font-bold transition-colors ${
              isLight
                ? isComex ? 'text-slate-900 group-hover:text-emerald-700' : 'text-slate-900 group-hover:text-sky-700'
                : isComex ? 'text-white group-hover:text-emerald-300' : 'text-white group-hover:text-cyan-300'
            }`}>
              {client.tradeName}
            </h2>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
              isComex
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
            }`}>
              {isComex ? 'Bling ERP' : 'Conta Azul'}
            </span>
          </div>
          
          <p className={`text-xs font-mono truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            {client.corporateName || client.tradeName}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className={`px-2.5 py-1 rounded-lg border ${
              isLight
                ? 'bg-slate-100 text-slate-700 border-slate-200'
                : 'bg-slate-800/80 text-slate-400 border-slate-700'
            }`}>
              CNPJ: {client.cnpj}
            </span>
            <span className={`px-2.5 py-1 rounded-lg border truncate max-w-[220px] ${
              isLight
                ? 'bg-slate-100 text-slate-700 border-slate-200'
                : 'bg-slate-800/80 text-slate-400 border-slate-700'
            }`} title={client.segment}>
              {client.segment}
            </span>
          </div>
        </div>

        {/* Botão de Ação com Loading */}
        <div className={`pt-4 border-t flex items-center justify-between ${
          isLight ? 'border-slate-100' : 'border-slate-800/80'
        }`}>
          <span className={`text-xs font-semibold ${
            isLight
              ? isComex ? 'text-emerald-700' : 'text-sky-700'
              : isComex ? 'text-emerald-400' : 'text-cyan-400'
          }`}>
            {loadingClientId === client.id
              ? 'Carregando dados da unidade...'
              : isComex ? 'Acessar módulo Bling & Comex' : 'Acessar painel financeiro'}
          </span>

          <button
            type="button"
            disabled={loadingClientId === client.id}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg flex items-center gap-2 group-hover:translate-x-1 transition-transform text-white ${
              isComex
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-900/20'
                : 'bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 shadow-cyan-900/20'
            }`}
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
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
          isComex
            ? 'from-emerald-500 via-teal-400 to-transparent'
            : 'from-sky-500 via-cyan-400 to-transparent'
        }`} />
      </div>
    )
  }
}
