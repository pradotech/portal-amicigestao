import React, { useState, useEffect, useRef } from 'react'
import { Navbar } from './components/Navbar'
import { Sidebar } from './components/Sidebar'
import { LandingCompanySelectView } from './views/LandingCompanySelectView'
import { DashboardView } from './views/DashboardView'
import { DrillexSuppliersView } from './views/DrillexSuppliersView'
import { DrillexCustomersView } from './views/DrillexCustomersView'
import { BrlumensSuppliersView } from './views/brlumens/BrlumensSuppliersView'
import { BrlumensCustomersView } from './views/brlumens/BrlumensCustomersView'
import { BrlumensSyncView } from './views/brlumens/BrlumensSyncView'
import { BrlumensDashboardView } from './views/brlumens/BrlumensDashboardView'
import { ReconciliationView } from './views/ReconciliationView'
import { DreReportsView } from './views/DreReportsView'
import { ContaAzulSyncView } from './views/ContaAzulSyncView'
import { ClientPortalView } from './views/ClientPortalView'
import { SettingsView } from './views/SettingsView'
import { LoginView } from './views/LoginView'
import { RenewTokenModal } from './components/RenewTokenModal'
import { useTheme } from './hooks/useTheme'
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
  persistBlingSyncToSupabase,
  signOutSupabase,
  getSupabaseSession,
  DEFAULT_CLIENTS
} from './services/supabase'
import {
  syncRealContaAzulData,
  getContaAzulGlobalConfig,
  saveContaAzulGlobalConfig,
  fetchContaAzulPessoas,
  getTokenExpirationInfo,
  isContaAzulTokenExpired,
  buildContaAzulAuthUrl,
  exchangeContaAzulCodeForToken,
  refreshContaAzulAccessToken,
  checkAndAutoRenewToken
} from './services/contaAzulService'
import {
  exchangeBlingCodeForToken,
  getBlingConfig,
  syncRealBlingData,
  refreshBlingAccessToken,
  checkAndAutoRenewBlingToken,
  getBlingTokenExpirationInfo
} from './services/blingService'
import { RefreshCw } from 'lucide-react'

export function App() {
  // Hook de controle de Tema Light / Dark (Padrão: Light)
  const { theme, toggleTheme } = useTheme()

  // Lista de Empresas / Clientes cadastrados no Supabase (Drillex em Amici Gestão e Amici Comex)
  const [clients, setClients] = useState(DEFAULT_CLIENTS)

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
  const [isRenewingToken, setIsRenewingToken] = useState(false)
  const [syncProgress, setSyncProgress] = useState(null)
  const [syncToast, setSyncToast] = useState(null)
  const failedRefreshTokensRef = useRef(new Set())
  const selectedClientRef = useRef(selectedClient)
  const isSyncingRef = useRef(isSyncing)
  const handleSyncApiRef = useRef(null)

  // Status Supabase & Usuário Conectado
  const [supabaseConfigured, setSupabaseConfigured] = useState(false)
  const [showRenewModal, setShowRenewModal] = useState(false)
  const [tokenVersion, setTokenVersion] = useState(0)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('amici_user_session')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  // Helper para identificar cliente Bling ERP (BR Lumens / Amici Comex)
  const isBlingClient = (client) => {
    if (!client) return false
    const name = String(client.tradeName || client.corporateName || '').toLowerCase()
    return (
      client.erpProvider === 'bling' ||
      client.division === 'comex' ||
      client.id === 'd0000000-0000-0000-0000-000000000002' ||
      name.includes('lumens') ||
      name.includes('bling') ||
      name.includes('comex')
    )
  }

  // Reavalia as credenciais da Conta Azul a cada atualização de token
  const tokenConfig = getContaAzulGlobalConfig()
  const tokenInfo = getTokenExpirationInfo(selectedClient?.contaAzulConfig?.accessToken || tokenConfig.accessToken)

  const handleLogout = async () => {
    await signOutSupabase()
    setCurrentUser(null)
    setSelectedClient(null)
    localStorage.removeItem('amici_user_session')
    localStorage.removeItem('amici_selected_client_id_v4')
  }

  // Renovação Manual Automática (via OAuth2 Refresh Token)
  const handleManualAutoRenew = async () => {
    failedRefreshTokensRef.current.clear()
    setIsRenewingToken(true)
    setSyncToast('🔄 Renovando token automaticamente via Conta Azul OAuth2...')
    try {
      const res = await refreshContaAzulAccessToken(selectedClient)
      if (res.success) {
        setTokenVersion(v => v + 1)
        setSyncToast('✓ Sessão Conta Azul renovada com sucesso! Atualizando dados...')
        setTimeout(() => {
          handleSyncApi()
        }, 400)
      } else {
        console.warn('Erro ao renovar token:', res.error)
        setSyncToast(`Aviso: ${res.error || 'Não foi possível renovar automaticamente. Cole o novo token.'}`)
        setShowRenewModal(true)
      }
    } catch (e) {
      setSyncToast(`Erro ao renovar: ${e.message}`)
      setShowRenewModal(true)
    } finally {
      setIsRenewingToken(false)
    }
  }

  // Monitoramento e Renovação Automática Proativa em Segundo Plano (Auto-Refresh 100% Automático)
  useEffect(() => {
    let isChecking = false

    const runAutoRefreshCheck = async () => {
      if (isChecking) return
      isChecking = true
      try {
        const isBling = isBlingClient(selectedClient)

        if (isBling) {
          // 1. Auto-Refresh Proativo Bling ERP (v3)
          const blingInfo = getBlingTokenExpirationInfo(selectedClient?.id)
          if (blingInfo.isConfigured && (blingInfo.isExpired || blingInfo.remainingMinutes <= 10)) {
            const blingConf = getBlingConfig(selectedClient?.id)
            const refreshToken = blingConf.refreshToken || selectedClient?.blingConfig?.refreshToken
            if (refreshToken && !failedRefreshTokensRef.current.has(`bling_${refreshToken}`)) {
              console.log('🔄 Executando renovação automática de token do Bling ERP em background...')
              const res = await refreshBlingAccessToken(selectedClient)
              if (res.success) {
                setTokenVersion(v => v + 1)
              } else {
                failedRefreshTokensRef.current.add(`bling_${refreshToken}`)
              }
            }
          }
        } else {
          // 2. Auto-Refresh Proativo Conta Azul
          const config = getContaAzulGlobalConfig()
          const token = selectedClient?.contaAzulConfig?.accessToken || config.accessToken
          const refreshToken = selectedClient?.contaAzulConfig?.refreshToken || config.refreshToken

          if (refreshToken && !failedRefreshTokensRef.current.has(refreshToken)) {
            const expInfo = getTokenExpirationInfo(token)
            if (expInfo.isExpired || (expInfo.remainingMinutes !== null && expInfo.remainingMinutes <= 5)) {
              console.log('🔄 Executando renovação automática de token da Conta Azul em background...')
              const res = await refreshContaAzulAccessToken(selectedClient)
              if (res.success) {
                setTokenVersion(v => v + 1)
              } else {
                failedRefreshTokensRef.current.add(refreshToken)
              }
            }
          }
        }
      } catch (err) {
        console.warn('Aviso na checagem de auto-refresh:', err)
      } finally {
        isChecking = false
      }
    }

    // Checar imediatamente ao montar ou mudar cliente/versão
    runAutoRefreshCheck()

    // Checagem periódica a cada 30 segundos
    const interval = setInterval(runAutoRefreshCheck, 30000)

    // Checar ao voltar para a aba ou focar
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        runAutoRefreshCheck()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('focus', runAutoRefreshCheck)

    const handleTokenRefreshed = () => {
      setTokenVersion(v => v + 1)
    }
    window.addEventListener('amici_token_refreshed', handleTokenRefreshed)
    window.addEventListener('amici_bling_token_refreshed', handleTokenRefreshed)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('focus', runAutoRefreshCheck)
      window.removeEventListener('amici_token_refreshed', handleTokenRefreshed)
      window.removeEventListener('amici_bling_token_refreshed', handleTokenRefreshed)
    }
  }, [selectedClient?.id, tokenVersion])

  // Interceptar retorno do fluxo OAuth da Conta Azul caso venha na URL (code ou access_token)
  useEffect(() => {
    async function processOAuthCallback() {
      try {
        const searchParams = new URLSearchParams(window.location.search)
        const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'))
        
        const code = searchParams.get('code') || hashParams.get('code')
        const state = searchParams.get('state') || hashParams.get('state') || ''
        const error = searchParams.get('error') || hashParams.get('error')
        const errorDesc = searchParams.get('error_description') || hashParams.get('error_description')
        const newAccessToken = searchParams.get('access_token') || hashParams.get('access_token')
        const newRefreshToken = searchParams.get('refresh_token') || hashParams.get('refresh_token')
        
        if (error) {
          console.warn('Retorno de erro OAuth:', error, errorDesc)
          window.history.replaceState({}, document.title, window.location.pathname)
          if (errorDesc?.includes('state')) {
            setSyncToast('Aviso: O parâmetro state é obrigatório na URL do Bling. Use o link com &state=amici_brlumens_comex')
          } else {
            setSyncToast(`Aviso de autorização: ${errorDesc || error}`)
          }
          return
        }
        
        if (code) {
          const isBlingAuth = state.includes('bling') || state.includes('comex') || window.location.pathname.includes('bling')

          if (isBlingAuth) {
            setSyncToast('Processando código de autorização do Bling ERP (BR Lumens)...')
            const res = await exchangeBlingCodeForToken(code)
            if (res.success) {
              setTokenVersion(v => v + 1)
              setSyncToast('✓ Bling ERP da BR Lumens conectado com sucesso!')
              window.history.replaceState({}, document.title, window.location.pathname)
            }
          } else {
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

  // 1. Carregamento inicial de clientes cadastrados do Supabase (Apenas 1 vez no mount)
  useEffect(() => {
    let isMounted = true

    async function initClients() {
      const creds = getSupabaseCredentials()
      setSupabaseConfigured(creds.isConfigured)

      if (creds.isConfigured) {
        try {
          const supaClients = await fetchClientsFromSupabase()
          if (isMounted && supaClients && supaClients.length > 0) {
            setClients(supaClients)
          }
        } catch (err) {
          console.warn('Erro ao carregar clientes do Supabase:', err)
        }
      }
    }

    initClients()

    return () => {
      isMounted = false
    }
  }, [])

  // 2. Carrega dados financeiros sempre que o cliente ativo for selecionado/alterado
  const loadDataFromSupabase = async (clientIdOverride) => {
    const targetId = clientIdOverride || selectedClient?.id
    if (!targetId) return

    const currentClient = clients.find(c => c.id === targetId) || selectedClient
    const isBling = isBlingClient(currentClient)
    const resolvedId = targetId.includes('-') && targetId.length === 36
      ? targetId
      : (isBling ? 'd0000000-0000-0000-0000-000000000002' : 'd0000000-0000-0000-0000-000000000001')

    try {
      const [supaPayables, supaReceivables, supaTx, supaPessoas] = await Promise.all([
        fetchPayablesFromSupabase(resolvedId),
        fetchReceivablesFromSupabase(resolvedId),
        fetchBankTransactionsFromSupabase(resolvedId),
        fetchCounterpartiesFromSupabase(resolvedId)
      ])

      if (isBling) {
        // Se a BR Lumens no Supabase ainda estiver vazia, sincroniza automaticamente com a API do Bling
        if ((!supaReceivables || supaReceivables.length === 0) && (!supaPayables || supaPayables.length === 0)) {
          setPayables([])
          setReceivables([])
          // Dispara primeira sincronização com o Bling ERP
          handleSyncApi(currentClient)
          return
        }

        setPayables(supaPayables || [])
        setReceivables(supaReceivables || [])
        setTransactions(supaTx || [])
        setRawPessoas(supaPessoas || [])
        return
      }

      // Para Drillex (Amici Gestão), carrega do Supabase / Conta Azul
      setPayables(supaPayables || [])
      setReceivables(supaReceivables || [])
      setTransactions(supaTx || [])
      setRawPessoas(supaPessoas || [])
    } catch (err) {
      console.warn('Erro ao carregar dados do Supabase para o cliente:', err)
      if (isBling) {
        setPayables([])
        setReceivables([])
      } else {
        setPayables([])
        setReceivables([])
      }
    }
  }

  useEffect(() => {
    if (selectedClient?.id) {
      localStorage.setItem('amici_selected_client_id_v4', selectedClient.id)
      loadDataFromSupabase(selectedClient.id)
    }
  }, [selectedClient?.id])

  // Ação de voltar para a tela de escolha de clientes
  const handleBackToLanding = () => {
    localStorage.removeItem('amici_selected_client_id_v4')
    setSelectedClient(null)
  }

  // Sincronizar cadastros (Conta Azul para Drillex / Bling ERP para BR Lumens)
  const handleSyncApi = async (targetClient) => {
    // Validação estrita: previne que SyntheticEvent do React seja tratado como objeto de cliente
    const isSyntheticEvent = targetClient && (targetClient.nativeEvent || targetClient.target || targetClient.type)
    const effectiveClient = (!isSyntheticEvent && targetClient && (targetClient.id || targetClient.tradeName || targetClient.erpProvider))
      ? targetClient
      : selectedClient

    if (isSyncing || !effectiveClient) return
    setIsSyncing(true)

    const isBling = isBlingClient(effectiveClient)
    const providerName = isBling ? 'Bling ERP v3' : 'Conta Azul'

    try {
      const targetId = effectiveClient?.id || (isBling ? 'd0000000-0000-0000-0000-000000000002' : 'd0000000-0000-0000-0000-000000000001')

      if (isBling) {
        console.log('🚀 Iniciando sincronização EXCLUSIVA do Bling ERP (BR Lumens)...', effectiveClient)
        const syncResult = await syncRealBlingData(effectiveClient, (prog) => {
          setSyncProgress(prog)
        })

        if (syncResult && syncResult.success) {
          // Persiste as entidades cadastrais e conexão no banco Supabase
          await saveClientToSupabase(effectiveClient)
          await persistBlingSyncToSupabase(targetId, syncResult)

          // Recarrega todos os dados financeiros DIRETAMENTE do banco de dados Supabase de forma incondicional
          const [supaPayables, supaReceivables, supaTx, supaPessoas] = await Promise.all([
            fetchPayablesFromSupabase(targetId),
            fetchReceivablesFromSupabase(targetId),
            fetchBankTransactionsFromSupabase(targetId),
            fetchCounterpartiesFromSupabase(targetId)
          ])

          const finalPayables = (supaPayables && supaPayables.length > 0) ? supaPayables : syncResult.payables
          const finalReceivables = (supaReceivables && supaReceivables.length > 0)
            ? supaReceivables.map(sr => {
                const liveMatch = syncResult.receivables.find(lr => lr.id === sr.id || lr.orderNumber === sr.orderNumber || lr.documentNumber === sr.documentNumber)
                return liveMatch ? { ...liveMatch, ...sr, items: liveMatch.items || [] } : sr
              })
            : syncResult.receivables

          setPayables(finalPayables || [])
          setReceivables(finalReceivables || [])
          setTransactions(supaTx || [])
          setRawPessoas(supaPessoas || [])

          const countPay = finalPayables.length
          const countRec = finalReceivables.length
          setSyncToast(`✓ Dados da BR Lumens sincronizados e gravados no banco Supabase (${countPay} títulos a pagar, ${countRec} vendas/recebíveis)!`)
        } else {
          // Se a API falhou/expirou, recarrega os dados intactos do Supabase
          await loadDataFromSupabase(targetId)
          setSyncToast('Sessão Bling expirada ou indisponível. Exibindo dados salvos no banco Supabase!')
        }
      } else {
        console.log('🚀 Iniciando sincronização da Conta Azul (Drillex)...', effectiveClient)
        const syncResult = await syncRealContaAzulData(effectiveClient, (prog) => {
          setSyncProgress(prog)
        })

        if (syncResult && syncResult.success) {
          // Puxa lista atualizada de contatos/fornecedores/clientes da Conta Azul para o Supabase
          const tokenOverride = effectiveClient?.contaAzulConfig?.accessToken
          const pessoas = (syncResult.rawPessoas && syncResult.rawPessoas.length > 0)
            ? syncResult.rawPessoas
            : await fetchContaAzulPessoas(100, tokenOverride)

          if (pessoas && pessoas.length > 0) {
            setRawPessoas(pessoas)
          }

          // Persiste as entidades cadastrais e conexão no banco Supabase
          await saveClientToSupabase(effectiveClient)
          await persistContaAzulSyncToSupabase(targetId, {
            ...syncResult,
            rawPessoas: pessoas
          })

          // Recarrega todos os dados financeiros DIRETAMENTE do banco de dados Supabase de forma incondicional
          const [supaPayables, supaReceivables, supaTx, supaPessoas] = await Promise.all([
            fetchPayablesFromSupabase(targetId),
            fetchReceivablesFromSupabase(targetId),
            fetchBankTransactionsFromSupabase(targetId),
            fetchCounterpartiesFromSupabase(targetId)
          ])

          setPayables(supaPayables || [])
          setReceivables(supaReceivables || [])
          setTransactions(supaTx || [])
          setRawPessoas(supaPessoas || [])

          const countRec = supaReceivables && supaReceivables.length > 0 ? supaReceivables.length : 0
          setSyncToast(`✓ Dados de ${effectiveClient.tradeName} sincronizados com a Conta Azul (${countRec} contas a receber)!`)
        } else {
          // Se a API retornou expirada (401), recarrega os dados intactos do Supabase
          await loadDataFromSupabase(targetId)
          setSyncToast('Sessão Conta Azul expirada (401). Exibindo dados salvos no banco Supabase!')
        }
      }
    } catch (err) {
      console.error('Erro na sincronização:', err)
      setSyncToast(`Erro na sincronização com ${providerName} (${effectiveClient?.tradeName || 'cliente'}).`)
    } finally {
      setIsSyncing(false)
      setSyncProgress(null)
      setTimeout(() => setSyncToast(null), 4000)
    }
  }

  // Mantém refs atualizados para evitar closures obsoletas no setInterval
  useEffect(() => {
    selectedClientRef.current = selectedClient
  }, [selectedClient])

  useEffect(() => {
    isSyncingRef.current = isSyncing
  }, [isSyncing])

  useEffect(() => {
    handleSyncApiRef.current = handleSyncApi
  })

  // Sincronização automática em segundo plano a cada 5 minutos para o cliente ativo
  useEffect(() => {
    if (!selectedClient?.id) return

    const FIVE_MINUTES_MS = 5 * 60 * 1000 // 5 minutos (300.000 ms)

    const intervalId = setInterval(() => {
      const currentClient = selectedClientRef.current
      if (currentClient && !isSyncingRef.current) {
        console.log(`⏱️ [Auto-Sync 5 min] Executando sincronização periódica em background para: ${currentClient.tradeName || currentClient.corporateName || 'Cliente'}`)
        if (handleSyncApiRef.current) {
          handleSyncApiRef.current(currentClient)
        }
      }
    }, FIVE_MINUTES_MS)

    return () => clearInterval(intervalId)
  }, [selectedClient?.id])

  // Ao selecionar um cliente na tela principal
  const handleSelectClient = (client) => {
    localStorage.setItem('amici_selected_client_id_v4', client.id)
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
          setSelectedClient(null)
          localStorage.removeItem('amici_selected_client_id_v4')
        }}
        theme={theme}
        onToggleTheme={toggleTheme}
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
          theme={theme}
          onToggleTheme={toggleTheme}
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
    <div className={`min-h-screen flex flex-col selection:bg-cyan-500 selection:text-white transition-colors ${
      theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      
      {/* Barra de Navegação Superior */}
      <Navbar
        selectedClient={selectedClient}
        onBackToLanding={handleBackToLanding}
        viewMode={viewMode}
        onToggleViewMode={() => setViewMode(prev => prev === 'bpo' ? 'client' : 'bpo')}
        isSyncing={isSyncing}
        onTriggerSync={handleSyncApi}
        supabaseConfigured={supabaseConfigured}
        currentUser={currentUser}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onOpenSettings={() => {
          setViewMode('bpo')
          setActiveTab('settings')
        }}
      />

      {/* Banner Informativo de Conexão com o ERP (Bling ERP para BR Lumens / Conta Azul para Drillex) */}
      {(() => {
        const isBling = isBlingClient(selectedClient)
        const blingConf = getBlingConfig(selectedClient?.id)

        if (isBling) {
          return (
            <div className={`no-print print:hidden border-b px-4 py-2.5 transition-all ${
              theme === 'light'
                ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                : 'bg-gradient-to-r from-emerald-950/80 via-teal-950/80 to-slate-950 border-emerald-800/40 text-emerald-300'
            }`}>
              <div className="w-full px-2 sm:px-4 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className={`flex items-center gap-2 font-medium ${theme === 'light' ? 'text-emerald-900' : 'text-emerald-300'}`}>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>
                    <strong>Bling ERP Conectado ({selectedClient.tradeName}):</strong> Empresa #2d98294f • <em>{blingConf.userEmail || 'financeiro@brlumens.com.br'}</em> (API v3 Online)
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleSyncApi(selectedClient)}
                    disabled={isSyncing}
                    className={`text-[11px] font-semibold flex items-center gap-1 underline ${
                      theme === 'light' ? 'text-emerald-700 hover:text-emerald-900' : 'text-emerald-400 hover:text-emerald-200'
                    }`}
                  >
                    {isSyncing ? 'Sincronizando com Bling...' : 'Atualizar Dados da API Bling Agora'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('bpo')
                      setActiveTab('settings')
                    }}
                    className={`text-[11px] underline font-semibold transition-colors ${
                      theme === 'light' ? 'text-emerald-800 hover:text-emerald-950' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Configurações
                  </button>
                </div>
              </div>
            </div>
          )
        }

        return (
          <div className={`no-print print:hidden border-b px-4 py-2.5 transition-all ${
            theme === 'light'
              ? (tokenInfo.isExpired
                  ? 'bg-amber-50/90 border-amber-200 text-amber-900'
                  : 'bg-sky-50/90 border-sky-200 text-sky-950')
              : (tokenInfo.isExpired
                  ? 'bg-amber-950/40 border-amber-800/40 text-amber-300'
                  : 'bg-gradient-to-r from-sky-950/80 via-cyan-950/80 to-slate-950 border-cyan-800/40 text-cyan-300')
          }`}>
            <div className="w-full px-2 sm:px-4 flex flex-wrap items-center justify-between gap-2 text-xs">
              
              {tokenInfo.isExpired ? (
                <div className={`flex items-center gap-2 font-medium ${theme === 'light' ? 'text-amber-900' : 'text-amber-300'}`}>
                  <span className="w-2 h-2 rounded-full bg-amber-500 shadow-sm" />
                  <span>
                    <strong>Sessão Conta Azul Expirada (1 hora):</strong> Exibindo dados consolidados e seguros do <strong>Supabase</strong> ({selectedClient.tradeName}).
                  </span>
                </div>
              ) : (
                <div className={`flex items-center gap-2 font-medium ${theme === 'light' ? 'text-sky-900' : 'text-cyan-300'}`}>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>
                    <strong>Conta Azul Conectada ({selectedClient.tradeName}):</strong> Empresa #{tokenConfig.companyId} • <em>{tokenConfig.userEmail}</em> {tokenInfo.expiresAt && `(Ativo até ${tokenInfo.expiresAt})`}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2.5">
                {tokenInfo.isExpired ? (
                  <>
                    <button
                      type="button"
                      onClick={handleManualAutoRenew}
                      disabled={isRenewingToken}
                      className="text-[11px] px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950/20 transition-all active:scale-95 disabled:opacity-50"
                      title="Renovar token imediatamente utilizando OAuth2 Refresh Token"
                    >
                      <RefreshCw className={`w-3 h-3 ${isRenewingToken ? 'animate-spin' : ''}`} />
                      <span>{isRenewingToken ? 'Renovando...' : 'Renovar Automaticamente Agora'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRenewModal(true)}
                      className={`text-[11px] px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                        theme === 'light'
                          ? 'bg-white hover:bg-amber-100/60 text-amber-900 border border-amber-300'
                          : 'bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-amber-800/40'
                      }`}
                    >
                      <span>Colar Token (Manual)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode('bpo')
                        setActiveTab('settings')
                      }}
                      className={`text-[11px] underline font-semibold transition-colors ${
                        theme === 'light' ? 'text-amber-800 hover:text-amber-950' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Configurações
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSyncApi(selectedClient)}
                    disabled={isSyncing}
                    className={`text-[11px] font-semibold flex items-center gap-1 underline ${
                      theme === 'light' ? 'text-sky-700 hover:text-sky-900' : 'text-cyan-400 hover:text-cyan-200'
                    }`}
                  >
                    {isSyncing ? 'Sincronizando...' : 'Atualizar Dados da API Agora'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {/* Toast Notification */}
      {syncToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-cyan-950 border border-cyan-700 text-white text-xs font-semibold shadow-2xl animate-in slide-in-from-bottom-5 flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>{syncToast}</span>
        </div>
      )}

      {/* Corpo da Aplicação (Largura total, Sidebar colada na esquerda) */}
      <div className="flex-1 flex w-full">
        
        {/* Sidebar Operacional */}
        {viewMode === 'bpo' && (
          <Sidebar
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            counts={counts}
            clientName={selectedClient.tradeName}
            onBackToLanding={handleBackToLanding}
            theme={theme}
            onToggleTheme={toggleTheme}
            isMobileOpen={isMobileMenuOpen}
            onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Área de Conteúdo Principal com Máximo Espaço e Fluidez */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 w-full overflow-x-hidden">
          
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
              {/* 1. VISÃO GERAL / DASHBOARD */}
              {activeTab === 'dashboard' && (
                isBlingClient(selectedClient) ? (
                  <BrlumensDashboardView
                    clients={[selectedClient]}
                    payables={payables}
                    receivables={receivables}
                    selectedClientId={selectedClient.id}
                    onSelectClient={() => {}}
                    onNavigateTab={setActiveTab}
                  />
                ) : (
                  <DashboardView
                    clients={[selectedClient]}
                    payables={payables}
                    receivables={receivables}
                    selectedClientId={selectedClient.id}
                    onSelectClient={() => {}}
                    onNavigateTab={setActiveTab}
                  />
                )
              )}

              {/* 2. FORNECEDORES & CONTAS A PAGAR DO CLIENTE */}
              {activeTab === 'suppliers' && (
                isBlingClient(selectedClient) ? (
                  <BrlumensSuppliersView
                    payables={payables}
                    rawPessoas={rawPessoas}
                    clientName={selectedClient.tradeName}
                    onUpdatePayableStatus={handleUpdatePayableStatus}
                    onAddPayable={handleAddPayable}
                    onSyncApi={() => handleSyncApi(selectedClient)}
                    isSyncing={isSyncing}
                  />
                ) : (
                  <DrillexSuppliersView
                    payables={payables}
                    rawPessoas={rawPessoas}
                    clientName={selectedClient.tradeName}
                    onUpdatePayableStatus={handleUpdatePayableStatus}
                    onAddPayable={handleAddPayable}
                    onSyncApi={() => handleSyncApi(selectedClient)}
                    isSyncing={isSyncing}
                  />
                )
              )}

              {/* 3. CLIENTES & CONTAS A RECEBER DO CLIENTE */}
              {activeTab === 'customers' && (
                isBlingClient(selectedClient) ? (
                  <BrlumensCustomersView
                    receivables={receivables}
                    rawPessoas={rawPessoas}
                    clientName={selectedClient.tradeName}
                    onUpdateReceivableStatus={handleUpdateReceivableStatus}
                    onSyncApi={() => handleSyncApi(selectedClient)}
                    isSyncing={isSyncing}
                  />
                ) : (
                  <DrillexCustomersView
                    receivables={receivables}
                    rawPessoas={rawPessoas}
                    clientName={selectedClient.tradeName}
                    onUpdateReceivableStatus={handleUpdateReceivableStatus}
                    onSyncApi={() => handleSyncApi(selectedClient)}
                    isSyncing={isSyncing}
                  />
                )
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

              {/* 6. CENTRAL DA API FINANCEIRA (BLING ERP PARA BR LUMENS / CONTA AZUL PARA DRILLEX) */}
              {activeTab === 'sync' && (
                isBlingClient(selectedClient) ? (
                  <BrlumensSyncView
                    client={selectedClient}
                    onSyncAllClients={() => handleSyncApi(selectedClient)}
                    isSyncing={isSyncing}
                    syncProgress={syncProgress}
                  />
                ) : (
                  <ContaAzulSyncView
                    clients={[selectedClient]}
                    onSyncAllClients={() => handleSyncApi(selectedClient)}
                    isSyncing={isSyncing}
                    syncProgress={syncProgress}
                  />
                )
              )}

              {/* 7. CONFIGURAÇÕES & SUPABASE */}
              {activeTab === 'settings' && (
                <SettingsView
                  selectedClient={selectedClient}
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
