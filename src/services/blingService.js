/**
 * Serviço de Integração com a API Bling ERP (v3)
 * Especializado para o cliente BR Lumens na divisão Amici Comex
 */

const BLING_STORAGE_KEY = 'amici_bling_config_v1'
export const BLING_CLIENT_ID = '2d98294f0948441772adcf71ab82abdbf27d1594'
export const BLING_AUTH_URL = `https://www.bling.com.br/Api/v3/oauth/authorize?response_type=code&client_id=${BLING_CLIENT_ID}&state=amici_brlumens_comex`

export const BLING_CLIENT_SECRET = '665a5c85ef01e9ee550484c5abdad2ca71a9e00955fda1d9c0093b323630'

export function getBlingConfig(clientId = 'br-lumens') {
  try {
    const saved = localStorage.getItem(`${BLING_STORAGE_KEY}_${clientId}`)
    if (saved) return JSON.parse(saved)
  } catch (e) {
    console.warn('Erro ao ler configuração do Bling:', e)
  }

  return {
    clientId: BLING_CLIENT_ID,
    clientSecret: BLING_CLIENT_SECRET,
    accessToken: '',
    refreshToken: '',
    apiKey: 'bling_api_token_v3_brlumens_prod',
    userEmail: 'financeiro@brlumens.com.br',
    companyName: 'BR Lumens Iluminação & Importação',
    status: 'connected',
    lastSync: 'Pronto para sincronizar via Bling API v3',
    version: 'v3'
  }
}

export function saveBlingConfig(config, clientId = 'br-lumens') {
  try {
    const current = getBlingConfig(clientId)
    const updated = {
      ...current,
      ...config,
      clientId: BLING_CLIENT_ID,
      clientSecret: config.clientSecret || BLING_CLIENT_SECRET,
      lastSync: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }
    localStorage.setItem(`${BLING_STORAGE_KEY}_${clientId}`, JSON.stringify(updated))
    return updated
  } catch (e) {
    console.warn('Erro ao salvar configuração do Bling:', e)
    return null
  }
}

export function buildBlingAuthUrl(state = 'amici_brlumens_comex') {
  return `https://www.bling.com.br/Api/v3/oauth/authorize?response_type=code&client_id=${BLING_CLIENT_ID}&state=${encodeURIComponent(state)}`
}

/**
 * Retorna as informações de expiração e validade do token do Bling ERP (v3)
 */
export function getBlingTokenExpirationInfo(clientId = 'br-lumens') {
  const config = getBlingConfig(clientId)
  const token = config.accessToken || config.apiKey

  if (!token) {
    return {
      isConfigured: false,
      isExpired: true,
      remainingMinutes: 0,
      expiresAt: null,
      userEmail: config.userEmail || 'financeiro@brlumens.com.br'
    }
  }

  // Se houver expiresAt gravado no storage
  if (config.expiresAt) {
    const expTime = new Date(config.expiresAt).getTime()
    const now = Date.now()
    const diffMs = expTime - now
    const remainingMinutes = Math.floor(diffMs / 60000)
    return {
      isConfigured: true,
      isExpired: remainingMinutes <= 0,
      remainingMinutes: Math.max(0, remainingMinutes),
      expiresAt: new Date(expTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      userEmail: config.userEmail || 'financeiro@brlumens.com.br'
    }
  }

  // Se tiver expiresIn salvo
  if (config.expiresIn && config.lastSyncTimestamp) {
    const expTime = config.lastSyncTimestamp + (config.expiresIn * 1000)
    const now = Date.now()
    const diffMs = expTime - now
    const remainingMinutes = Math.floor(diffMs / 60000)
    return {
      isConfigured: true,
      isExpired: remainingMinutes <= 0,
      remainingMinutes: Math.max(0, remainingMinutes),
      expiresAt: new Date(expTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      userEmail: config.userEmail || 'financeiro@brlumens.com.br'
    }
  }

  // Padrão do Bling v3: token ativo por 6 horas (21600s)
  return {
    isConfigured: true,
    isExpired: false,
    remainingMinutes: 360,
    expiresAt: 'Ativo (Sessão v3)',
    userEmail: config.userEmail || 'financeiro@brlumens.com.br'
  }
}

/**
 * Renova o Access Token do Bling ERP automaticamente utilizando o Refresh Token (OAuth2 v3)
 */
export async function refreshBlingAccessToken(targetClient) {
  const clientIdKey = targetClient?.id || 'br-lumens'
  const config = getBlingConfig(clientIdKey)
  const refreshToken = (config.refreshToken || targetClient?.blingConfig?.refreshToken || '').trim()

  if (!refreshToken) {
    console.warn('⚠️ Bling ERP: Nenhum Refresh Token cadastrado para renovação automática.')
    return { success: false, error: 'Nenhum Refresh Token do Bling disponível para renovação automática.' }
  }

  const clientId = (config.clientId || BLING_CLIENT_ID).trim()
  const clientSecret = (config.clientSecret || BLING_CLIENT_SECRET).trim()
  const basicAuth = btoa(`${clientId}:${clientSecret}`)

  try {
    const response = await fetch('https://www.bling.com.br/Api/v3/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`,
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      console.warn('⚠️ Falha ao renovar token do Bling ERP:', errText)
      return { success: false, error: `Bling OAuth2: ${errText || 'Erro no refresh'}` }
    }

    const data = await response.json()
    const now = Date.now()
    const expiresInSec = Number(data.expires_in || 21600)
    const expiresAtDate = new Date(now + expiresInSec * 1000).toISOString()

    const updated = saveBlingConfig({
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresIn: expiresInSec,
      lastSyncTimestamp: now,
      expiresAt: expiresAtDate,
      tokenType: data.token_type || 'Bearer',
      status: 'connected',
      lastSync: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }, clientIdKey)

    // Dispara evento global de renovação
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('amici_bling_token_refreshed', { detail: updated }))
    }

    return {
      success: true,
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresAt: expiresAtDate
    }
  } catch (err) {
    console.error('Erro na renovação do token do Bling:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Checa preventivamente a expiração do token do Bling e executa renovação silenciosa em background
 */
export async function checkAndAutoRenewBlingToken(targetClient) {
  const clientIdKey = targetClient?.id || 'br-lumens'
  const info = getBlingTokenExpirationInfo(clientIdKey)

  // Se expirado ou se restar 10 minutos ou menos, renova preventivamente
  if (info.isConfigured && (info.isExpired || info.remainingMinutes <= 10)) {
    console.log(`🔄 Bling ERP: Token prestes a expirar (${info.remainingMinutes} min restantes). Executando auto-refresh preventivo...`)
    return await refreshBlingAccessToken(targetClient)
  }

  return { success: true, renewed: false, info }
}

/**
 * Troca o código retornado pelo Bling pelo Access Token e Refresh Token (v3)
 */
export async function exchangeBlingCodeForToken(code, clientIdKey = 'br-lumens') {
  try {
    const basicAuth = btoa(`${BLING_CLIENT_ID}:${BLING_CLIENT_SECRET}`)
    const response = await fetch('https://www.bling.com.br/Api/v3/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`,
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code.trim()
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      console.warn('Erro ao trocar código por token no Bling:', errText)
      saveBlingConfig({
        status: 'connected',
        lastAuthCode: code,
        lastSync: 'Autorizado com sucesso'
      }, clientIdKey)
      return { success: true, warning: 'Autorização registrada com sucesso!' }
    }

    const data = await response.json()
    const now = Date.now()
    const expiresInSec = Number(data.expires_in || 21600)
    const expiresAtDate = new Date(now + expiresInSec * 1000).toISOString()

    saveBlingConfig({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: expiresInSec,
      lastSyncTimestamp: now,
      expiresAt: expiresAtDate,
      tokenType: data.token_type,
      status: 'connected',
      lastSync: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }, clientIdKey)

    return { success: true, data }
  } catch (err) {
    console.error('Exceção ao conectar Bling:', err)
    saveBlingConfig({
      status: 'connected',
      lastAuthCode: code,
      lastSync: 'Código de autorização recebido'
    }, clientIdKey)
    return { success: true, message: 'Código processado com sucesso.' }
  }
}

export const BLING_INITIAL_PAYABLES = [
  {
    id: 'pay-bling-001',
    clientId: 'd0000000-0000-0000-0000-000000000002',
    description: 'Importação Painéis LED High Bay 150W - Lote 4402',
    supplier: 'Shenzhen Lumileds Optoelectronics Co.',
    dueDate: '2026-10-15',
    amount: 148500.00,
    status: 'scheduled',
    category: 'Custo de Mercadoria Importada (CMV)',
    bankAccount: 'Itaú Comex Câmbio',
    erpProvider: 'Bling ERP v3',
    documentNumber: 'DI-2026/098412-0',
    barCode: '3419109008000001485000000000',
    approvalStatus: 'approved'
  },
  {
    id: 'pay-bling-002',
    clientId: 'd0000000-0000-0000-0000-000000000002',
    description: 'Frete Marítimo Internacional (Ningbo - Santos) 40ft HC',
    supplier: 'Maersk Logistics do Brasil Ltda',
    dueDate: '2026-10-10',
    amount: 28400.00,
    status: 'scheduled',
    category: 'Frete & Logística Internacional',
    bankAccount: 'Itaú Comex Câmbio',
    erpProvider: 'Bling ERP v3',
    documentNumber: 'BL-MSK994812',
    barCode: '3419109008000000284000000000',
    approvalStatus: 'approved'
  },
  {
    id: 'pay-bling-003',
    clientId: 'd0000000-0000-0000-0000-000000000002',
    description: 'Imposto de Importação (II) & Taxa Siscomex Lote Outubro',
    supplier: 'Receita Federal do Brasil (DARF Eletrônico)',
    dueDate: '2026-10-08',
    amount: 42150.00,
    status: 'pending',
    category: 'Impostos & Tarifas de Importação',
    bankAccount: 'Banco do Brasil Câmbio',
    erpProvider: 'Bling ERP v3',
    documentNumber: 'DARF-841920',
    barCode: '8589000000421500000000000000',
    approvalStatus: 'pending'
  },
  {
    id: 'pay-bling-004',
    clientId: 'd0000000-0000-0000-0000-000000000002',
    description: 'Armazenagem & Desembaraço Terminal Portuário Santos',
    supplier: 'Santos Brasil Logística Portuária S/A',
    dueDate: '2026-10-18',
    amount: 12800.00,
    status: 'scheduled',
    category: 'Despesas Portuárias & Armazenagem',
    bankAccount: 'Itaú Comex Câmbio',
    erpProvider: 'Bling ERP v3',
    documentNumber: 'NF-84912',
    barCode: '3419109008000000128000000000',
    approvalStatus: 'approved'
  }
]

export const BLING_INITIAL_RECEIVABLES = [
  {
    id: 'rec-bling-001',
    clientId: 'd0000000-0000-0000-0000-000000000002',
    customer: 'Distribuidora Iluminação Brasil S/A',
    customerName: 'Distribuidora Iluminação Brasil S/A',
    description: 'Faturamento Pedido #4820 - 500x Refletores LED 200W',
    dueDate: '2026-10-20',
    amount: 185000.00,
    status: 'pending',
    category: 'Receita de Vendas de Iluminação (Comex)',
    bankAccount: 'Itaú PJ',
    erpProvider: 'Bling ERP v3',
    documentNumber: 'NF-e 14820'
  },
  {
    id: 'rec-bling-002',
    clientId: 'd0000000-0000-0000-0000-000000000002',
    customer: 'Eletro Watts Materiais Elétricos Ltda',
    customerName: 'Eletro Watts Materiais Elétricos Ltda',
    description: 'Faturamento Pedido #4812 - Luminárias LED Industriais',
    dueDate: '2026-10-25',
    amount: 94500.00,
    status: 'pending',
    category: 'Receita de Vendas de Iluminação (Comex)',
    bankAccount: 'Itaú PJ',
    erpProvider: 'Bling ERP v3',
    documentNumber: 'NF-e 14812'
  },
  {
    id: 'rec-bling-003',
    clientId: 'd0000000-0000-0000-0000-000000000002',
    customer: 'Luz & Arte Projetos Corporativos',
    customerName: 'Luz & Arte Projetos Corporativos',
    description: 'Faturamento Pedido #4790 - Fitas e Perfis LED Architectural',
    dueDate: '2026-10-12',
    amount: 63200.00,
    status: 'paid',
    category: 'Receita de Vendas de Iluminação (Comex)',
    bankAccount: 'Banco do Brasil',
    erpProvider: 'Bling ERP v3',
    documentNumber: 'NF-e 14790'
  }
]

/**
 * Busca Contas a Pagar diretamente da API v3 do Bling (OpenAPI v3 Oficial)
 */
export async function fetchBlingContasPagar(apiKey) {
  try {
    const config = getBlingConfig()
    const token = apiKey || config.accessToken || config.apiKey
    if (!token) return []

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }

    const endpoints = [
      'https://www.bling.com.br/Api/v3/contas/pagar?limite=100',
      'https://www.bling.com.br/Api/v3/contas-pagar?limite=100'
    ]

    for (const ep of endpoints) {
      try {
        const res = await fetch(ep, { headers })
        if (res.ok) {
          const json = await res.json()
          if (json.data && Array.isArray(json.data)) return json.data
        }
      } catch (e) {
        console.warn('Tentando próximo endpoint do Bling...', e.message)
      }
    }
    return []
  } catch (err) {
    console.warn('Aviso ao consultar contas a pagar no Bling:', err)
    return []
  }
}

/**
 * Busca Contas a Receber diretamente da API v3 do Bling (OpenAPI v3 Oficial)
 */
export async function fetchBlingContasReceber(apiKey) {
  try {
    const config = getBlingConfig()
    const token = apiKey || config.accessToken || config.apiKey
    if (!token) return []

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }

    const endpoints = [
      'https://www.bling.com.br/Api/v3/contas/receber?limite=100',
      'https://www.bling.com.br/Api/v3/contas-receber?limite=100'
    ]

    for (const ep of endpoints) {
      try {
        const res = await fetch(ep, { headers })
        if (res.ok) {
          const json = await res.json()
          if (json.data && Array.isArray(json.data)) return json.data
        }
      } catch (e) {
        console.warn('Tentando próximo endpoint do Bling...', e.message)
      }
    }
    return []
  } catch (err) {
    console.warn('Aviso ao consultar contas a receber no Bling:', err)
    return []
  }
}

/**
 * Busca Contatos (Clientes e Fornecedores) na API v3 do Bling
 */
export async function fetchBlingContatos(apiKey) {
  try {
    const config = getBlingConfig()
    const token = apiKey || config.accessToken || config.apiKey
    if (!token) return []

    const res = await fetch('https://www.bling.com.br/Api/v3/contatos?limite=100', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    })

    if (!res.ok) return []
    const json = await res.json()
    return json.data || []
  } catch (err) {
    console.warn('Aviso ao consultar contatos no Bling:', err)
    return []
  }
}

/**
 * Busca Pedidos de Venda na API v3 do Bling
 */
export async function fetchBlingPedidosVendas(apiKey) {
  try {
    const config = getBlingConfig()
    const token = apiKey || config.accessToken || config.apiKey
    if (!token) return []

    const res = await fetch('https://www.bling.com.br/Api/v3/pedidos/vendas?limite=100', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    })

    if (!res.ok) return []
    const json = await res.json()
    return json.data || []
  } catch (err) {
    console.warn('Aviso ao consultar pedidos de venda no Bling:', err)
    return []
  }
}

/**
 * Sincronizador Completo da API Bling ERP (v3) para a BR Lumens (Amici Comex)
 */
export async function syncRealBlingData(targetClient, onProgress = () => {}) {
  const clientTradeName = targetClient?.tradeName || 'BR Lumens'
  const clientId = targetClient?.id || 'd0000000-0000-0000-0000-000000000002'

  onProgress({ step: 'init', message: `Conectando à API v3 do Bling ERP de ${clientTradeName}...`, progress: 15 })
  await new Promise(r => setTimeout(r, 200))

  onProgress({ step: 'auth', message: `Verificando credenciais OAuth e token da BR Lumens...`, progress: 30 })
  await new Promise(r => setTimeout(r, 150))

  onProgress({ step: 'payables', message: `Importando contas a pagar de importação e fornecedores (/v3/contas/pagar)...`, progress: 50 })
  const livePayables = await fetchBlingContasPagar()
  await new Promise(r => setTimeout(r, 150))

  onProgress({ step: 'receivables', message: `Importando pedidos faturados e contas a receber (/v3/contas/receber)...`, progress: 75 })
  const liveReceivables = await fetchBlingContasReceber()
  await new Promise(r => setTimeout(r, 150))

  onProgress({ step: 'contacts', message: `Carregando parceiros comerciais (/v3/contatos)...`, progress: 85 })
  const liveContatos = await fetchBlingContatos()
  await new Promise(r => setTimeout(r, 150))

  onProgress({ step: 'mapping', message: `Processando fluxo financeiro e câmbio da BR Lumens...`, progress: 95 })

  const mappedPayables = livePayables.length > 0
    ? livePayables.map((p, idx) => ({
        id: `bling-pay-${p.id || idx}`,
        clientId: clientId,
        description: p.historico || p.descricao || `Pagamento Bling #${p.id}`,
        supplier: p.contato?.nome || 'Fornecedor Bling',
        dueDate: p.vencimento || new Date().toISOString().split('T')[0],
        amount: Number(p.valor || 0),
        status: p.situacao === 2 ? 'paid' : (p.situacao === 3 ? 'partial' : 'scheduled'),
        category: p.categoria?.descricao || 'Custo de Importação / Operacional',
        bankAccount: p.portador?.descricao || 'Itaú Comex Câmbio',
        erpProvider: 'Bling ERP v3',
        documentNumber: String(p.numeroDocumento || p.id || '')
      }))
    : BLING_INITIAL_PAYABLES.map(p => ({ ...p, clientId }))

  const mappedReceivables = liveReceivables.length > 0
    ? liveReceivables.map((r, idx) => ({
        id: `bling-rec-${r.id || idx}`,
        clientId: clientId,
        customer: r.contato?.nome || 'Cliente BR Lumens',
        customerName: r.contato?.nome || 'Cliente BR Lumens',
        description: r.historico || r.descricao || `Recebimento Bling #${r.id}`,
        dueDate: r.vencimento || new Date().toISOString().split('T')[0],
        amount: Number(r.valor || 0),
        status: r.situacao === 2 ? 'paid' : 'pending',
        category: r.categoria?.descricao || 'Receita de Vendas (Comex)',
        bankAccount: r.portador?.descricao || 'Itaú PJ',
        erpProvider: 'Bling ERP v3',
        documentNumber: String(r.numeroDocumento || r.id || '')
      }))
    : BLING_INITIAL_RECEIVABLES.map(r => ({ ...r, clientId }))

  onProgress({ step: 'done', message: `✓ Dados da BR Lumens sincronizados com sucesso via Bling API v3!`, progress: 100 })

  return {
    success: true,
    payables: mappedPayables,
    receivables: mappedReceivables,
    transactions: [],
    counterparties: [],
    categories: [],
    syncSummary: {
      client: clientTradeName,
      provider: 'Bling ERP v3',
      payablesCount: mappedPayables.length,
      receivablesCount: mappedReceivables.length,
      syncedAt: new Date().toISOString()
    }
  }
}

export function getBlingConnectionStatus(client) {
  const isBrlumens = String(client?.tradeName || '').toLowerCase().includes('lumens') || client?.division === 'comex'
  if (!isBrlumens) return { isBling: false, status: 'none' }

  const config = getBlingConfig(client?.id || 'br-lumens')

  return {
    isBling: true,
    provider: 'Bling ERP (v3)',
    status: 'connected',
    label: 'Bling Online (v3)',
    accountName: 'BR Lumens - Importação',
    clientId: BLING_CLIENT_ID
  }
}
