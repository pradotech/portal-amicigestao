import React, { useState, useEffect } from 'react'
import { Navbar } from './components/Navbar'
import { Sidebar } from './components/Sidebar'
import { LandingCompanySelectView } from './views/LandingCompanySelectView'
import { DashboardView } from './views/DashboardView'
import { DrillexSuppliersView } from './views/DrillexSuppliersView'
import { DrillexCustomersView } from './views/DrillexCustomersView'
import { ReconciliationView } from './views/ReconciliationView'
import { DreReportsView } from './views/DreReportsView'
import { ContaAzulSyncView } from './views/ContaAzulSyncView'
import { ClientPortalView } from './views/ClientPortalView'
import { SettingsView } from './views/SettingsView'
import { LoginView } from './views/LoginView'
import { RenewTokenModal } from './components/RenewTokenModal'
import {
  getSupabaseCredentials,
  saveClientToSupabase,
  fetchClientsFromSupabase,
  fetchPayablesFromSupabase,
  fetchReceivablesFromSupabase,
  fetchBankTransactionsFromSupabase,
  fetchCounterpartiesFromSupabase,
  updatePayableStatusInSupabase,
  addPayableToSupabase,
  updateReceivableStatusInSupabase,
  reconcileTransactionInSupabase,
  persistContaAzulSyncToSupabase,
  signOutSupabase,
  getSupabaseSession
} from './services/supabase'
import {
  syncRealContaAzulData,
  getContaAzulGlobalConfig,
  saveContaAzulGlobalConfig,
  fetchContaAzulPessoas,
  getTokenExpirationInfo,
  isContaAzulTokenExpired,
  buildContaAzulAuthUrl,
  exchangeContaAzulCodeForToken
} from './services/contaAzulService'

export function App() {
  // Lista de Empresas / Clientes cadastrados no Supabase
  const [clients, setClients] = useState([])

  // Cliente selecionado atualmente
  const [selectedClient, setSelectedClient] = useState(null)

  const [rawPessoas, setRawPessoas] = useState([])
  const [payables, setPayables] = useState([])
  const [receivables, setReceivables] = useState([])
  const [transactions, setTransactions] = useState([])

  const [activeTab, setActiveTab] = useState('dashboard')
  const [viewMode, setViewMode] = useState('bpo') // 'bpo' | 'client'
  
  // Sincronização Conta Azul
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncProgress, setSyncProgress] = useState(null)
  const [syncToast, setSyncToast] = useState(null)

  // Status Supabase & Usuário Conectado
  const [supabaseConfigured, setSupabaseConfigured] = useState(false)
  const [showRenewModal, setShowRenewModal] = useState(false)
  const [tokenVersion, setTokenVersion] = useState(0)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('amici_user_session')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  // Reavalia as credenciais da Conta Azul a cada atualização de token
  const tokenConfig = getContaAzulGlobalConfig()
  const tokenInfo = getTokenExpirationInfo()

  const handleLogout = async () => {
    await signOutSupabase()
    setCurrentUser(null)
    localStorage.removeItem('amici_user_session')
  }

  // Interceptar retorno do fluxo OAuth da Conta Azul caso venha na URL (code ou access_token)
  useEffect(() => {
    async function processOAuthCallback() {
      try {
        const searchParams = new URLSearchParams(window.location.search)
        const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'))
        
        const code = searchParams.get('code') || hashParams.get('code')
        const newAccessToken = searchParams.get('access_token') || hashParams.get('access_token')
        const newRefreshToken = searchParams.get('refresh_token') || hashParams.get('refresh_token')
        
        if (code) {
          setSyncToast('Processando código de autorização da Conta Azul...')
          const res = await exchangeContaAzulCodeForToken(code)
          if (res.success) {
            setTokenVersion(v => v + 1)
            setSyncToast('✓ Conta Azul conectada com sucesso! Atualizando dados...')
            window.history.replaceState({}, document.title, window.location.pathname)
            setTimeout(() => {
              handleSyncApi()
            }, 600)
          } else {
            console.error('Erro na troca de código por token:', res.error)
            setSyncToast(`Aviso: ${res.error}`)
            window.history.replaceState({}, document.title, window.location.pathname)
          }
        } else if (newAccessToken) {
          saveContaAzulGlobalConfig(
            tokenConfig.clientId,
            tokenConfig.clientSecret,
            tokenConfig.redirectUri,
            newAccessToken,
            newRefreshToken || tokenConfig.refreshToken
          )
          setTokenVersion(v => v + 1)
          setSyncToast('✓ Nova autorização da Conta Azul salva com sucesso!')
          window.history.replaceState({}, document.title, window.location.pathname)
          setTimeout(() => {
            handleSyncApi()
          }, 600)
        }
      } catch (e) {
        console.warn('Aviso ao processar retorno OAuth:', e)
      }
    }

    processOAuthCallback()
  }, [])

  // Salvar estados no localStorage para persistência
  useEffect(() => {
    localStorage.setItem('amici_bpo_clients_v4', JSON.stringify(clients))
  }, [clients])

  useEffect(() => {
    localStorage.setItem('amici_payables_v4', JSON.stringify(payables))
  }, [payables])

  useEffect(() => {
    localStorage.setItem('amici_receivables_v4', JSON.stringify(receivables))
  }, [receivables])

  useEffect(() => {
    localStorage.setItem('amici_transactions_v4', JSON.stringify(transactions))
  }, [transactions])

  useEffect(() => {
    if (selectedClient) {
      localStorage.setItem('amici_selected_client_id_v4', selectedClient.id)
    } else {
      localStorage.removeItem('amici_selected_client_id_v4')
    }
  }, [selectedClient])

  const loadDataFromSupabase = async (clientIdOverride) => {
    const creds = getSupabaseCredentials()
    setSupabaseConfigured(creds.isConfigured)

    if (creds.isConfigured) {
      try {
        // 1. Carregar Clientes do Supabase
        const supaClients = await fetchClientsFromSupabase()
        if (supaClients && supaClients.length > 0) {
          setClients(supaClients)
          if (!selectedClient) {
            const savedId = localStorage.getItem('amici_selected_client_id_v4')
            const matched = supaClients.find(c => c.id === savedId) || supaClients[0]
            setSelectedClient(matched)
          }
        }

        const targetId = clientIdOverride || selectedClient?.id || (supaClients && supaClients[0]?.id) || 'd0000000-0000-0000-0000-000000000001'

        // 2. Carregar Contas a Pagar do Supabase (Fonte Única da Verdade)
        const supaPayables = await fetchPayablesFromSupabase(targetId)
        setPayables(supaPayables || [])

        // 3. Carregar Contas a Receber do Supabase (Fonte Única da Verdade)
        const supaReceivables = await fetchReceivablesFromSupabase(targetId)
        setReceivables(supaReceivables || [])

        // 4. Carregar Transações do Supabase (Fonte Única da Verdade)
        const supaTx = await fetchBankTransactionsFromSupabase(targetId)
        setTransactions(supaTx || [])

        // 5. Carregar Fornecedores e Clientes do Supabase
        const supaPessoas = await fetchCounterpartiesFromSupabase(targetId)
        setRawPessoas(supaPessoas || [])
      } catch (err) {
        console.warn('Erro ao carregar dados do Supabase:', err)
      }
    }
  }

  useEffect(() => {
    loadDataFromSupabase(selectedClient?.id)
  }, [selectedClient?.id])

  // Sincronizar cadastros da Conta Azul mantendo o Supabase como fonte única de lançamentos financeiros
  const handleSyncApi = async (targetClient = selectedClient) => {
    if (isSyncing || !targetClient) return
    setIsSyncing(true)

    try {
      const syncResult = await syncRealContaAzulData(targetClient, (prog) => {
        setSyncProgress(prog)
      })

      const targetId = targetClient?.id || 'd0000000-0000-0000-0000-000000000001'

      if (syncResult && syncResult.success) {
        // Puxa lista atualizada de contatos/fornecedores/clientes da Conta Azul para o Supabase
        const tokenOverride = targetClient?.contaAzulConfig?.accessToken
        const pessoas = (syncResult.rawPessoas && syncResult.rawPessoas.length > 0)
          ? syncResult.rawPessoas
          : await fetchContaAzulPessoas(100, tokenOverride)

        if (pessoas && pessoas.length > 0) {
          setRawPessoas(pessoas)
        }

        if (syncResult.mappedReceivables && syncResult.mappedReceivables.length > 0) {
          setReceivables(syncResult.mappedReceivables)
        }

        if (syncResult.mappedPayables && syncResult.mappedPayables.length > 0) {
          setPayables(syncResult.mappedPayables)
        }

        // Persiste as entidades cadastrais e conexão no banco Supabase
        await saveClientToSupabase(targetClient)
        await persistContaAzulSyncToSupabase(targetId, {
          ...syncResult,
          rawPessoas: pessoas
        })

        // Recarrega todos os dados financeiros DIRETAMENTE do banco de dados Supabase
        await loadDataFromSupabase(targetId)

        setSyncToast(`✓ Dados de ${targetClient.tradeName} sincronizados com a Conta Azul (${syncResult.mappedReceivables ? syncResult.mappedReceivables.length : 0} contas a receber)!`)
      } else {
        // Se a API retornou expirada (401), recarrega os dados intactos do Supabase
        await loadDataFromSupabase(targetId)
        setSyncToast('Sessão Conta Azul expirada (401). Exibindo dados salvos no banco Supabase!')
      }
    } catch (err) {
      console.error('Erro na sincronização:', err)
      setSyncToast(`Erro na sincronização com a Conta Azul (${targetClient.tradeName}).`)
    } finally {
      setIsSyncing(false)
      setSyncProgress(null)
      setTimeout(() => setSyncToast(null), 4000)
    }
  }

  // Ao selecionar um cliente na tela principal
  const handleSelectClient = (client) => {
    setSelectedClient(client)
    setActiveTab('dashboard')
  }

  // Adicionar um novo cliente / empresa no BPO
  const handleAddClient = async (newClient) => {
    setClients(prev => {
      const exists = prev.some(c => c.id === newClient.id)
      if (exists) {
        return prev.map(c => c.id === newClient.id ? newClient : c)
      }
      return [...prev, newClient]
    })
    await saveClientToSupabase(newClient)
    setSyncToast(`Empresa ${newClient.tradeName} adicionada e gravada no Supabase!`)
    setTimeout(() => setSyncToast(null), 3000)
  }

  // Handlers de Pagamentos (Com persistência no Supabase)
  const handleUpdatePayableStatus = async (id, status) => {
    setPayables(prev =>
      prev.map(p => (p.id === id ? { ...p, status } : p))
    )
    await updatePayableStatusInSupabase(id, status)
  }

  const handleAddPayable = async (newPayable) => {
    setPayables(prev => [newPayable, ...prev])
    await addPayableToSupabase(newPayable)
    setSyncToast(`Pagamento agendado e gravado no Supabase!`)
    setTimeout(() => setSyncToast(null), 3000)
  }

  // Handlers de Recebíveis (Com persistência no Supabase)
  const handleUpdateReceivableStatus = async (id, status) => {
    setReceivables(prev =>
      prev.map(r => (r.id === id ? { ...r, status } : r))
    )
    await updateReceivableStatusInSupabase(id, status)
  }

  // Handlers de Conciliação (Com persistência no Supabase)
  const handleReconcileTransaction = async (id) => {
    setTransactions(prev =>
      prev.map(t =>
        t.id === id
          ? {
              ...t,
              isReconciled: true,
              matchedEntity: t.suggestedMatch || 'Lançamento Conta Azul'
            }
          : t
      )
    )
    await reconcileTransactionInSupabase(id)
  }

  const handleReconcileAll = async () => {
    setTransactions(prev =>
      prev.map(t => ({
        ...t,
        isReconciled: true,
        matchedEntity: t.matchedEntity || t.suggestedMatch || 'Lançamento Conta Azul'
      }))
    )
    for (const t of transactions) {
      if (!t.isReconciled) {
        await reconcileTransactionInSupabase(t.id)
      }
    }
    setSyncToast('Todas as transações foram conciliadas e gravadas no Supabase!')
    setTimeout(() => setSyncToast(null), 3000)
  }

  // Resetar dados
  const handleResetDemoData = () => {
    if (window.confirm('Deseja recarregar os dados padrão da Amici BPO?')) {
      localStorage.clear()
      window.location.reload()
    }
  }

  // Contagens para badges da Sidebar
  const counts = {
    pendingPayables: payables.filter(p => p.status === 'pending_client' || p.status === 'scheduled').length,
    receivablesCount: receivables.length,
    pendingReconciliation: transactions.filter(t => !t.isReconciled).length
  }

  // ===========================================================================
  // TELA 0: SE NÃO HOUVER USUÁRIO LOGADO -> TELA DE LOGIN COMO TELA INICIAL
  // ===========================================================================
  if (!currentUser) {
    return (
      <LoginView
        onLoginSuccess={(user) => {
          setCurrentUser(user)
        }}
      />
    )
  }

  // ===========================================================================
  // TELA 1: SE NENHUM CLIENTE FOI SELECIONADO -> RENDERIZA A TELA PRINCIPAL (LANDING)
  // ===========================================================================
  if (!selectedClient) {
    return (
      <>
        <LandingCompanySelectView
          clients={clients}
          onSelectClient={handleSelectClient}
          onAddClient={handleAddClient}
          isSyncing={isSyncing}
          activeTokenConfig={tokenConfig}
          onLogout={handleLogout}
        />
        <RenewTokenModal
          isOpen={showRenewModal}
          onClose={() => setShowRenewModal(false)}
          onTokenUpdated={(newToken) => {
            setTokenVersion(v => v + 1)
            setSyncToast('Sessão da Conta Azul renovada com sucesso!')
          }}
          currentClientName="Drillex"
        />
      </>
    )
  }

  // ===========================================================================
  // TELA 2: CLIENTE SELECIONADO (DRILLEX) -> RENDERIZA O PORTAL FINANCEIRO COMPLETO
  // ===========================================================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white">
      
      {/* Barra de Navegação Superior */}
      <Navbar
        selectedClient={selectedClient}
        onBackToLanding={() => setSelectedClient(null)}
        viewMode={viewMode}
        onToggleViewMode={() => setViewMode(prev => prev === 'bpo' ? 'client' : 'bpo')}
        isSyncing={isSyncing}
        onTriggerSync={handleSyncApi}
        supabaseConfigured={supabaseConfigured}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenSettings={() => {
          setViewMode('bpo')
          setActiveTab('settings')
        }}
      />

      {/* Banner Informativo de Conexão com a Conta Azul */}
      <div className={`border-b px-4 py-2 transition-all ${
        tokenInfo.isExpired
          ? 'bg-amber-950/40 border-amber-800/40'
          : 'bg-gradient-to-r from-sky-950/80 via-cyan-950/80 to-slate-950 border-cyan-800/40'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
          
          {tokenInfo.isExpired ? (
            <div className="flex items-center gap-2 text-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>
                <strong>Sessão Conta Azul Expirada (1 hora):</strong> Exibindo dados consolidados e seguros do <strong>Supabase</strong> ({selectedClient.tradeName}).
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-cyan-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                <strong>Conta Azul Conectada ({selectedClient.tradeName}):</strong> Empresa #{tokenConfig.companyId} • <em>{tokenConfig.userEmail}</em> {tokenInfo.expiresAt && `(Ativo até ${tokenInfo.expiresAt})`}
              </span>
            </div>
          )}

          <div className="flex items-center gap-3">
            {tokenInfo.isExpired ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowRenewModal(true)}
                  className="text-[11px] px-3 py-1 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold flex items-center gap-1.5 shadow-md shadow-amber-950/40 transition-all active:scale-95"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  <span>Renovar Sessão / Colar Token</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('bpo')
                    setActiveTab('settings')
                  }}
                  className="text-[11px] text-slate-400 hover:text-slate-200 underline font-semibold"
                >
                  Configurações
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleSyncApi}
                disabled={isSyncing}
                className="text-[11px] text-cyan-400 hover:text-cyan-200 underline font-semibold flex items-center gap-1"
              >
                {isSyncing ? 'Sincronizando...' : 'Atualizar Dados da API Agora'}
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Toast Notification */}
      {syncToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-cyan-950 border border-cyan-700 text-white text-xs font-semibold shadow-2xl animate-in slide-in-from-bottom-5 flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>{syncToast}</span>
        </div>
      )}

      {/* Corpo da Aplicação */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        
        {/* Sidebar Operacional */}
        {viewMode === 'bpo' && (
          <Sidebar
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            counts={counts}
            clientName={selectedClient.tradeName}
            onBackToLanding={() => setSelectedClient(null)}
          />
        )}

        {/* Área de Conteúdo Principal */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          
          {/* MODO PORTAL DO CLIENTE */}
          {viewMode === 'client' ? (
            <ClientPortalView
              client={selectedClient}
              payables={payables}
              receivables={receivables}
              onApprovePayable={(id) => handleUpdatePayableStatus(id, 'approved')}
              onRejectPayable={(id) => handleUpdatePayableStatus(id, 'pending_client')}
            />
          ) : (
            /* MODO BPO AMICI */
            <>
              {/* 1. VISÃO GERAL / DASHBOARD DA DRILLEX */}
              {activeTab === 'dashboard' && (
                <DashboardView
                  clients={[selectedClient]}
                  payables={payables}
                  receivables={receivables}
                  selectedClientId={selectedClient.id}
                  onSelectClient={() => {}}
                  onNavigateTab={setActiveTab}
                />
              )}

              {/* 2. FORNECEDORES & CONTAS A PAGAR DO CLIENTE */}
              {activeTab === 'suppliers' && (
                <DrillexSuppliersView
                  payables={payables}
                  rawPessoas={rawPessoas}
                  clientName={selectedClient.tradeName}
                  onUpdatePayableStatus={handleUpdatePayableStatus}
                  onAddPayable={handleAddPayable}
                  onSyncApi={() => handleSyncApi(selectedClient)}
                  isSyncing={isSyncing}
                />
              )}

              {/* 3. CLIENTES & CONTAS A RECEBER DO CLIENTE */}
              {activeTab === 'customers' && (
                <DrillexCustomersView
                  receivables={receivables}
                  rawPessoas={rawPessoas}
                  clientName={selectedClient.tradeName}
                  onUpdateReceivableStatus={handleUpdateReceivableStatus}
                  onSyncApi={() => handleSyncApi(selectedClient)}
                  isSyncing={isSyncing}
                />
              )}

              {/* 4. CONCILIAÇÃO BANCÁRIA & EXTRATOS */}
              {activeTab === 'reconciliation' && (
                <ReconciliationView
                  transactions={transactions}
                  clients={[selectedClient]}
                  selectedClientId={selectedClient.id}
                  onReconcileTransaction={handleReconcileTransaction}
                  onReconcileAll={handleReconcileAll}
                />
              )}

              {/* 5. DRE & CATEGORIAS */}
              {activeTab === 'dre' && (
                <DreReportsView
                  clients={[selectedClient]}
                  selectedClientId={selectedClient?.id}
                  payables={payables}
                  receivables={receivables}
                />
              )}

              {/* 6. CENTRAL DA API CONTA AZUL */}
              {activeTab === 'sync' && (
                <ContaAzulSyncView
                  clients={[selectedClient]}
                  onSyncAllClients={handleSyncApi}
                  isSyncing={isSyncing}
                  syncProgress={syncProgress}
                />
              )}

              {/* 7. CONFIGURAÇÕES & SUPABASE */}
              {activeTab === 'settings' && (
                <SettingsView
                  onResetDemoData={handleResetDemoData}
                />
              )}
            </>
          )}

        </main>
      </div>

      {/* Modal Global de Renovação de Token da Conta Azul */}
      <RenewTokenModal
        isOpen={showRenewModal}
        onClose={() => setShowRenewModal(false)}
        onTokenUpdated={(newToken) => {
          setTokenVersion(v => v + 1)
          setSyncToast('Sessão da Conta Azul renovada com sucesso! Atualizando dados...')
          setTimeout(() => {
            handleSyncApi()
          }, 500)
        }}
        currentClientName={selectedClient?.tradeName || 'Drillex'}
      />

    </div>
  )
}

export default App
