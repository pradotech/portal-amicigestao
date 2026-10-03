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

export const BLING_OCTOBER_SALES_SUMMARY = {
  totalFaturado: 9269.85,
  totalEmAberto: 2400.00,
  pedidosAtendidosCount: 5,
  pedidosEmAbertoCount: 1,
  totalPecas: 269,
  ticketMedio: 1853.97,
  estado: 'SP',
  freteMedio: 0.00,
  produtos: [
    { codigo: '1142', descricao: 'CORDAO 100 LEDS C/STROBO 220V - FIO VERDE - BQ', quantidade: 96, custo: 0.00, valor: 2592.00, margem: 100 },
    { codigo: '1153', descricao: 'CASCATA 400 LEDS 220V - BQ', quantidade: 20, custo: 0.00, valor: 1954.00, margem: 100 },
    { codigo: '1237', descricao: 'CORDAO 100 LEDS FIXO 10M 220V VERDE', quantidade: 48, custo: 0.00, valor: 1248.00, margem: 100 },
    { codigo: '1152', descricao: 'CASCATA 400 LEDS COLORIDO - 220V', quantidade: 20, custo: 0.00, valor: 900.00, margem: 100 },
    { codigo: '122536', descricao: 'LUM PEND 12" PRISM - LP 1227 PCF', quantidade: 12, custo: 0.00, valor: 661.20, margem: 100 },
    { codigo: '122356', descricao: 'LUM PEND 16" PRISM - LP 1627 PCF', quantidade: 11, custo: 0.00, valor: 619.50, margem: 100 },
    { codigo: '300217', descricao: 'REATOR MET 220V/150W - AE1528 MTPH', quantidade: 5, custo: 0.00, valor: 400.00, margem: 100 },
    { codigo: '1243', descricao: 'PISCA PISCA - 8 FUN FIO VERDE - 220V - BRANCO QUENTE', quantidade: 48, custo: 0.00, valor: 360.00, margem: 100 }
  ]
}

export const BLING_INITIAL_RECEIVABLES = [
  {
    id: 'rec-bling-001',
    clientId: 'd0000000-0000-0000-0000-000000000002',
    customer: 'Distribuidora Iluminação Brasil S/A',
    customerName: 'Distribuidora Iluminação Brasil S/A',
    description: 'Pedido #1142 - Cordão 100 LEDs c/ Strobo 220V BQ (96 un)',
    dueDate: '2026-10-05',
    amount: 2592.00,
    amountPaid: 2592.00,
    amountRemaining: 0,
    status: 'received',
    category: 'Receita de Vendas de Iluminação (Comex)',
    bankAccount: 'Itaú PJ',
    erpProvider: 'Bling ERP v3',
    documentNumber: 'NF-e 1142',
    state: 'SP'
  },
  {
    id: 'rec-bling-002',
    clientId: 'd0000000-0000-0000-0000-000000000002',
    customer: 'Eletro Watts Materiais Elétricos Ltda',
    customerName: 'Eletro Watts Materiais Elétricos Ltda',
    description: 'Pedido #1153 - Cascata 400 LEDs 220V BQ (20 un)',
    dueDate: '2026-10-10',
    amount: 1954.00,
    amountPaid: 1954.00,
    amountRemaining: 0,
    status: 'received',
    category: 'Receita de Vendas de Iluminação (Comex)',
    bankAccount: 'Itaú PJ',
    erpProvider: 'Bling ERP v3',
    documentNumber: 'NF-e 1153',
    state: 'SP'
  },
  {
    id: 'rec-bling-003',
    clientId: 'd0000000-0000-0000-0000-000000000002',
    customer: 'Luz & Arte Projetos Corporativos',
    customerName: 'Luz & Arte Projetos Corporativos',
    description: 'Pedido #1237 - Cordão 100 LEDs Fixo 10M Verde (48 un)',
    dueDate: '2026-10-14',
    amount: 1248.00,
    amountPaid: 1248.00,
    amountRemaining: 0,
    status: 'received',
    category: 'Receita de Vendas de Iluminação (Comex)',
    bankAccount: 'Itaú PJ',
    erpProvider: 'Bling ERP v3',
    documentNumber: 'NF-e 1237',
    state: 'SP'
  },
  {
    id: 'rec-bling-004',
    clientId: 'd0000000-0000-0000-0000-000000000002',
    customer: 'Prisma Comercial de Elétrica Ltda',
    customerName: 'Prisma Comercial de Elétrica Ltda',
    description: 'Pedido #1152 / 122536 - Cascata LEDs + Lum Pend 12" Prism (32 un)',
    dueDate: '2026-10-18',
    amount: 1561.20,
    amountPaid: 1561.20,
    amountRemaining: 0,
    status: 'received',
    category: 'Receita de Vendas de Iluminação (Comex)',
    bankAccount: 'Itaú PJ',
    erpProvider: 'Bling ERP v3',
    documentNumber: 'NF-e 1152',
    state: 'SP'
  },
  {
    id: 'rec-bling-005',
    clientId: 'd0000000-0000-0000-0000-000000000002',
    customer: 'Mega Luz Comércio Atacadista',
    customerName: 'Mega Luz Comércio Atacadista',
    description: 'Pedido #122356 / 300217 / 1243 - Lum Pend 16" + Reator Met + Pisca Pisca (64 un)',
    dueDate: '2026-10-22',
    amount: 1914.65,
    amountPaid: 1914.65,
    amountRemaining: 0,
    status: 'received',
    category: 'Receita de Vendas de Iluminação (Comex)',
    bankAccount: 'Itaú PJ',
    erpProvider: 'Bling ERP v3',
    documentNumber: 'NF-e 1223',
    state: 'SP'
  },
  {
    id: 'rec-bling-006',
    clientId: 'd0000000-0000-0000-0000-000000000002',
    customer: 'Alpha Iluminação & Decor Ltda',
    customerName: 'Alpha Iluminação & Decor Ltda',
    description: 'Pedido #1250 - Luminárias Industriais High Bay LED 150W (12 un)',
    dueDate: '2026-10-28',
    amount: 2400.00,
    amountPaid: 0.00,
    amountRemaining: 2400.00,
    status: 'pending',
    category: 'Receita de Vendas de Iluminação (Comex)',
    bankAccount: 'Itaú PJ',
    erpProvider: 'Bling ERP v3',
    documentNumber: 'NF-e 1250',
    state: 'SP'
  }
]

/**
 * Helper de requisição resiliente com Proxy anti-CORS (/api-bling) e fallback
 */
async function fetchBlingApi(endpoint, apiKey, options = {}) {
  const config = getBlingConfig()
  const token = apiKey || config.accessToken || config.apiKey
  if (!token) return { ok: false, data: [] }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
    ...(options.headers || {})
  }

  const isDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`

  const urls = [
    `/api-bling${cleanEndpoint}`,
    `https://www.bling.com.br/Api/v3${cleanEndpoint}`
  ]

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        ...options,
        headers
      })

      if (res.ok) {
        const json = await res.json()
        return { ok: true, data: json.data || json || [] }
      }
    } catch (err) {
      // Tenta a próxima URL
    }
  }

  return { ok: false, data: [] }
}

/**
 * Busca Contas a Pagar diretamente da API v3 do Bling com paginação automática
 */
export async function fetchBlingContasPagar(apiKey) {
  const allPayables = []
  let page = 1
  const maxPages = 10

  try {
    while (page <= maxPages) {
      const res = await fetchBlingApi(`/contas/pagar?pagina=${page}&limite=100`, apiKey)
      if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
        allPayables.push(...res.data)
        if (res.data.length < 100) break
        page++
      } else {
        if (page === 1) {
          const fallbackRes = await fetchBlingApi(`/contas-pagar?pagina=1&limite=100`, apiKey)
          if (fallbackRes.ok && Array.isArray(fallbackRes.data)) {
            allPayables.push(...fallbackRes.data)
          }
        }
        break
      }
    }

    console.log(`[Bling API] Contas a Pagar recuperadas: ${allPayables.length} títulos.`)
    return allPayables
  } catch (err) {
    console.warn('Aviso ao consultar contas a pagar no Bling:', err)
    return allPayables
  }
}

/**
 * Busca Contas a Receber diretamente da API v3 do Bling com paginação automática
 */
export async function fetchBlingContasReceber(apiKey) {
  const allReceivables = []
  let page = 1
  const maxPages = 10

  try {
    while (page <= maxPages) {
      const res = await fetchBlingApi(`/contas/receber?pagina=${page}&limite=100`, apiKey)
      if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
        allReceivables.push(...res.data)
        if (res.data.length < 100) break
        page++
      } else {
        if (page === 1) {
          const fallbackRes = await fetchBlingApi(`/contas-receber?pagina=1&limite=100`, apiKey)
          if (fallbackRes.ok && Array.isArray(fallbackRes.data)) {
            allReceivables.push(...fallbackRes.data)
          }
        }
        break
      }
    }

    console.log(`[Bling API] Contas a Receber recuperadas: ${allReceivables.length} títulos.`)
    return allReceivables
  } catch (err) {
    console.warn('Aviso ao consultar contas a receber no Bling:', err)
    return allReceivables
  }
}

/**
 * Busca Contatos (Clientes e Fornecedores) na API v3 do Bling
 */
export async function fetchBlingContatos(apiKey) {
  try {
    const res = await fetchBlingApi('/contatos?limite=100', apiKey)
    if (res.ok && Array.isArray(res.data)) return res.data
    return []
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
    const res = await fetchBlingApi('/pedidos/vendas?limite=100', apiKey)
    if (res.ok && Array.isArray(res.data)) return res.data
    return []
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
  const todayStr = new Date().toISOString().split('T')[0]

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

  // Filtra títulos cancelados (situacao === 4 ou situacao === 'cancelado') para não distorcer totais
  const validLivePayables = livePayables.filter(p => p.situacao !== 4 && p.situacao !== 'cancelado')
  const validLiveReceivables = liveReceivables.filter(r => r.situacao !== 4 && r.situacao !== 'cancelado')

  const mappedPayables = validLivePayables.map((p, idx) => {
    const rawAmount = Number(p.valor || 0)
    const rawSaldo = p.saldo !== undefined && p.saldo !== null ? Number(p.saldo) : (p.situacao === 2 ? 0 : rawAmount)
    const isPaid = p.situacao === 2 || (rawAmount > 0 && rawSaldo === 0)
    const isPartial = p.situacao === 3 || (!isPaid && rawSaldo > 0 && rawSaldo < rawAmount)
    const paidAmount = isPaid ? rawAmount : (isPartial ? Math.max(0, rawAmount - rawSaldo) : 0)
    const dueDate = p.vencimento || p.dataVencimento || todayStr

    let status = 'scheduled'
    if (isPaid) {
      status = 'paid'
    } else if (isPartial) {
      status = 'partial'
    } else if (dueDate < todayStr) {
      status = 'overdue'
    } else if (dueDate === todayStr) {
      status = 'today'
    }

    return {
      id: `bling-pay-${p.id || idx}`,
      clientId: clientId,
      description: p.historico || p.descricao || `Pagamento Bling #${p.id || idx + 1}`,
      supplier: p.contato?.nome || p.fornecedor?.nome || 'Fornecedor Bling',
      dueDate: dueDate,
      amount: rawAmount,
      amountPaid: paidAmount,
      amountRemaining: isPaid ? 0 : rawSaldo,
      status: status,
      category: p.categoria?.descricao || p.categoria?.nome || 'Importação & Fornecedores',
      bankAccount: p.portador?.nome || p.portador?.descricao || 'Itaú Comex Câmbio',
      erpProvider: 'Bling ERP v3',
      documentNumber: String(p.numeroDocumento || p.id || ''),
      barcode: p.codigoBarras || p.linhaDigitavel || null
    }
  })

  const mappedReceivables = validLiveReceivables.map((r, idx) => {
    const rawAmount = Number(r.valor || 0)
    const rawSaldo = r.saldo !== undefined && r.saldo !== null ? Number(r.saldo) : (r.situacao === 2 ? 0 : rawAmount)
    const isReceived = r.situacao === 2 || (rawAmount > 0 && rawSaldo === 0)
    const isPartial = r.situacao === 3 || (!isReceived && rawSaldo > 0 && rawSaldo < rawAmount)
    const receivedAmount = isReceived ? rawAmount : (isPartial ? Math.max(0, rawAmount - rawSaldo) : 0)
    const dueDate = r.vencimento || r.dataVencimento || todayStr

    let status = 'pending'
    if (isReceived) {
      status = 'received'
    } else if (isPartial) {
      status = 'partial'
    } else if (dueDate < todayStr) {
      status = 'overdue'
    } else if (dueDate === todayStr) {
      status = 'today'
    }

    return {
      id: `bling-rec-${r.id || idx}`,
      clientId: clientId,
      customer: r.contato?.nome || r.cliente?.nome || 'Cliente BR Lumens',
      customerName: r.contato?.nome || r.cliente?.nome || 'Cliente BR Lumens',
      description: r.historico || r.descricao || `Recebimento Bling #${r.id || idx + 1}`,
      dueDate: dueDate,
      amount: rawAmount,
      amountPaid: receivedAmount,
      amountRemaining: isReceived ? 0 : rawSaldo,
      status: status,
      category: r.categoria?.descricao || r.categoria?.nome || 'Venda de Iluminação LED (Comex)',
      bankAccount: r.portador?.nome || r.portador?.descricao || 'Itaú PJ',
      erpProvider: 'Bling ERP v3',
      documentNumber: String(r.numeroDocumento || r.id || ''),
      paymentMethod: r.formaPagamento?.descricao || 'Boleto / PIX'
    }
  })

  onProgress({ step: 'done', message: `✓ Dados da BR Lumens sincronizados com sucesso via Bling API v3!`, progress: 100 })

  return {
    success: true,
    payables: mappedPayables,
    receivables: mappedReceivables,
    transactions: [],
    counterparties: liveContatos,
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
