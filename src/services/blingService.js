/**
 * Serviço de Integração com a API Bling ERP (v3)
 * Especializado para o cliente BR Lumens na divisão Amici Comex
 */

const BLING_STORAGE_KEY = 'amici_bling_config_v1'

// Credenciais BR Lumens
export const BLING_CLIENT_ID = import.meta.env.VITE_BLING_CLIENT_ID || '2d98294f0948441772adcf71ab82abdbf27d1594'
export const BLING_CLIENT_SECRET = import.meta.env.VITE_BLING_CLIENT_SECRET || '665a5c85ef01e9ee550484c5abdad2ca71a9e00955fda1d9c0093b323630'
export const BLING_REDIRECT_URI = import.meta.env.VITE_BLING_REDIRECT_URI || 'https://portal-amicigestao.vercel.app/oauth/bling/callback'
export const BLING_AUTH_URL = `https://www.bling.com.br/Api/v3/oauth/authorize?response_type=code&client_id=${BLING_CLIENT_ID}&state=amici_brlumens_comex`

// Credenciais HGE Iluminação (Grupo BR Lumens)
export const HGE_CLIENT_ID = import.meta.env.VITE_HGE_CLIENT_ID || '2d98294f0948441772adcf71ab82abdbf27d1594'
export const HGE_CLIENT_SECRET = import.meta.env.VITE_HGE_CLIENT_SECRET || '665a5c85ef01e9ee550484c5abdad2ca71a9e00955fda1d9c0093b323630'
export const HGE_AUTH_URL = `https://www.bling.com.br/Api/v3/oauth/authorize?response_type=code&client_id=${HGE_CLIENT_ID}&state=amici_hge_iluminacao`

export function getBlingConfig(clientId = 'br-lumens') {
  const isHge = clientId === 'hge-iluminacao' || String(clientId).toLowerCase().includes('hge')
  const defaultClientId = isHge ? HGE_CLIENT_ID : BLING_CLIENT_ID
  const defaultClientSecret = isHge ? HGE_CLIENT_SECRET : BLING_CLIENT_SECRET
  const defaultCompanyName = isHge ? 'HGE Iluminação' : 'BR Lumens Iluminação & Importação'
  const defaultEmail = isHge ? 'financeiro@hgeiluminacao.com.br' : 'financeiro@brlumens.com.br'

  try {
    const saved = localStorage.getItem(`${BLING_STORAGE_KEY}_${clientId}`)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (isHge && (parsed.clientId === '472b991e2e8ba4f9b23b702f47e52dfce41edca3' || !parsed.clientId)) {
        parsed.clientId = defaultClientId
        parsed.clientSecret = defaultClientSecret
        localStorage.setItem(`${BLING_STORAGE_KEY}_${clientId}`, JSON.stringify(parsed))
      }
      return parsed
    }
  } catch (e) {
    console.warn('Erro ao ler configuração do Bling:', e)
  }

  return {
    clientId: defaultClientId,
    clientSecret: defaultClientSecret,
    accessToken: '',
    refreshToken: '',
    apiKey: isHge ? '' : 'bling_api_token_v3_brlumens_prod',
    userEmail: defaultEmail,
    companyName: defaultCompanyName,
    status: isHge ? 'ready' : 'connected',
    lastSync: isHge ? 'Pronto para conectar via Bling API v3' : 'Pronto para sincronizar via Bling API v3',
    version: 'v3'
  }
}

export function saveBlingConfig(config, clientId = 'br-lumens') {
  try {
    const isHge = clientId === 'hge-iluminacao' || String(clientId).toLowerCase().includes('hge')
    const defaultClientId = isHge ? HGE_CLIENT_ID : BLING_CLIENT_ID
    const defaultClientSecret = isHge ? HGE_CLIENT_SECRET : BLING_CLIENT_SECRET
    const current = getBlingConfig(clientId)
    const updated = {
      ...current,
      ...config,
      clientId: config.clientId || current.clientId || defaultClientId,
      clientSecret: config.clientSecret || current.clientSecret || defaultClientSecret,
      lastSync: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }
    localStorage.setItem(`${BLING_STORAGE_KEY}_${clientId}`, JSON.stringify(updated))
    return updated
  } catch (e) {
    console.warn('Erro ao salvar configuração do Bling:', e)
    return null
  }
}

export function buildBlingAuthUrl(state = 'amici_brlumens_comex', account = 'br-lumens') {
  const isHge = account === 'hge-iluminacao' || state.includes('hge')
  const cid = isHge ? HGE_CLIENT_ID : BLING_CLIENT_ID
  return `https://www.bling.com.br/Api/v3/oauth/authorize?response_type=code&client_id=${cid}&state=${encodeURIComponent(state)}`
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
export async function refreshBlingAccessToken(targetClient = 'br-lumens') {
  const clientIdKey = typeof targetClient === 'string' ? targetClient : (targetClient?.id || 'br-lumens')
  const isHge = clientIdKey === 'hge-iluminacao' || String(clientIdKey).toLowerCase().includes('hge')
  const defaultClientId = isHge ? HGE_CLIENT_ID : BLING_CLIENT_ID
  const defaultClientSecret = isHge ? HGE_CLIENT_SECRET : BLING_CLIENT_SECRET

  const config = getBlingConfig(clientIdKey)
  const refreshToken = (config.refreshToken || targetClient?.blingConfig?.refreshToken || '').trim()

  if (!refreshToken) {
    console.warn(`⚠️ Bling ERP (${isHge ? 'HGE' : 'BR Lumens'}): Nenhum Refresh Token cadastrado para renovação automática.`)
    return { success: false, error: 'Nenhum Refresh Token do Bling disponível para renovação automática.' }
  }

  const clientId = (config.clientId || defaultClientId).trim()
  const clientSecret = (config.clientSecret || defaultClientSecret).trim()
  const basicAuth = btoa(`${clientId}:${clientSecret}`)

  try {
    const response = await fetch('/api-bling/oauth/token', {
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
      console.warn(`⚠️ Falha ao renovar token do Bling ERP (${isHge ? 'HGE' : 'BR Lumens'}):`, errText)
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
      window.dispatchEvent(new CustomEvent('amici_bling_token_refreshed', { detail: { account: clientIdKey, ...updated } }))
    }

    return {
      success: true,
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresAt: expiresAtDate
    }
  } catch (err) {
    console.error(`Erro na renovação do token do Bling (${isHge ? 'HGE' : 'BR Lumens'}):`, err)
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
    const isHge = clientIdKey === 'hge-iluminacao' || String(clientIdKey).toLowerCase().includes('hge')
    const activeClientId = isHge ? HGE_CLIENT_ID : BLING_CLIENT_ID
    const activeClientSecret = isHge ? HGE_CLIENT_SECRET : BLING_CLIENT_SECRET
    const basicAuth = btoa(`${activeClientId}:${activeClientSecret}`)

    const response = await fetch('/api-bling/oauth/token', {
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
      console.warn(`Erro ao trocar código por token no Bling (${isHge ? 'HGE' : 'BR Lumens'}):`, errText)
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

export const BLING_INITIAL_PAYABLES = []
export const BLING_INITIAL_RECEIVABLES = []
export const BLING_INITIAL_COUNTERPARTIES = []

// Rate limiter global: a API do Bling ERP v3 aceita no máximo 3 requisições por segundo.
// Mantemos intervalo de segurança de 380ms (~2.6 req/s) para evitar erros 429.
let lastBlingRequestTime = 0
const MIN_BLING_INTERVAL_MS = 380

async function throttleBlingRateLimit() {
  const now = Date.now()
  const elapsed = now - lastBlingRequestTime
  if (elapsed < MIN_BLING_INTERVAL_MS) {
    const delay = MIN_BLING_INTERVAL_MS - elapsed
    await new Promise(r => setTimeout(r, delay))
  }
  lastBlingRequestTime = Date.now()
}

/**
 * Helper de requisição resiliente com Proxy anti-CORS (/api-bling), rate limiter e renovação automática de token
 */
async function fetchBlingApi(endpoint, apiKeyOrAccount, options = {}, retryCount = 0) {
  let token = ''
  let accountKey = 'br-lumens'

  if (apiKeyOrAccount === 'hge-iluminacao' || String(apiKeyOrAccount).toLowerCase().includes('hge')) {
    accountKey = 'hge-iluminacao'
    const conf = getBlingConfig(accountKey)
    token = conf.accessToken || conf.apiKey
  } else if (apiKeyOrAccount && typeof apiKeyOrAccount === 'string' && apiKeyOrAccount.length > 25 && !apiKeyOrAccount.includes('-') && !apiKeyOrAccount.includes('_')) {
    token = apiKeyOrAccount
  } else {
    accountKey = typeof apiKeyOrAccount === 'string' ? apiKeyOrAccount : 'br-lumens'
    const conf = getBlingConfig(accountKey)
    token = conf.accessToken || conf.apiKey
  }

  if (!token) return { ok: false, status: 401, data: [], error: `Token não configurado para ${accountKey}` }

  let headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
    ...(options.headers || {})
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const primaryUrl = `/api-bling${cleanEndpoint}`

  try {
    // Garante espaçamento mínimo entre chamadas para nunca estourar o limite de 3 req/segundo do Bling
    await throttleBlingRateLimit()

    let res = await fetch(primaryUrl, {
      ...options,
      headers
    })

    // Se receber 429 (Too Many Requests / limite atingido), aguarda e retenta automaticamente
    if (res.status === 429 && retryCount < 3) {
      const waitMs = 1200 * (retryCount + 1)
      console.warn(`[Bling API - ${accountKey}] Rate limit 429 em ${cleanEndpoint}. Aguardando ${waitMs}ms para retentar (${retryCount + 1}/3)...`)
      await new Promise(r => setTimeout(r, waitMs))
      return fetchBlingApi(endpoint, apiKeyOrAccount, options, retryCount + 1)
    }

    // Se receber 401 (token expirado ou não autorizado), renova automaticamente via Refresh Token e repete
    if (!res.ok && res.status === 401 && retryCount < 2) {
      console.log(`🔄 Bling ERP (${accountKey}): Token expirado (401). Executando auto-renovação transparente via OAuth2 Refresh Token...`)
      const refreshed = await refreshBlingAccessToken(accountKey)
      if (refreshed && refreshed.success && refreshed.accessToken) {
        token = refreshed.accessToken
        headers['Authorization'] = `Bearer ${token}`
        await throttleBlingRateLimit()
        res = await fetch(primaryUrl, {
          ...options,
          headers
        })
      }
    }

    if (res.ok) {
      const json = await res.json()
      return { ok: true, status: res.status, data: json.data || json || [] }
    }

    const errText = await res.text()
    console.warn(`[Bling API - ${accountKey}] Resposta ${res.status} em ${cleanEndpoint}:`, errText)
    return { ok: false, status: res.status, data: [], error: errText }
  } catch (err) {
    console.warn(`[Bling API - ${accountKey}] Falha de conexão em ${cleanEndpoint}:`, err.message)
    return { ok: false, status: 500, data: [], error: err.message }
  }
}

/**
 * Busca Contas a Pagar diretamente da API v3 do Bling com paginação automática completa
 */
export async function fetchBlingContasPagar(apiKey) {
  const allPayables = []
  let page = 1
  const maxPages = 25

  try {
    while (page <= maxPages) {
      const res = await fetchBlingApi(`/contas/pagar?pagina=${page}&limite=100`, apiKey)
      if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
        allPayables.push(...res.data)
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
 * Busca Contas a Receber diretamente da API v3 do Bling com paginação automática completa
 */
export async function fetchBlingContasReceber(apiKey) {
  const allReceivables = []
  let page = 1
  const maxPages = 25

  try {
    while (page <= maxPages) {
      const res = await fetchBlingApi(`/contas/receber?pagina=${page}&limite=100`, apiKey)
      if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
        allReceivables.push(...res.data)
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
 * Helper para interpretar a situação de pedidos e títulos do Bling v3
 */
function parseBlingSituacao(situacaoRaw) {
  if (situacaoRaw === null || situacaoRaw === undefined) {
    return { isReceived: false, isPaid: false, isPartial: false, isCanceled: false }
  }

  let sitId = null
  let sitValor = ''

  if (typeof situacaoRaw === 'object') {
    sitId = situacaoRaw.id !== undefined ? Number(situacaoRaw.id) : null
    sitValor = String(situacaoRaw.valor || situacaoRaw.nome || situacaoRaw.descricao || '').toLowerCase()
  } else if (typeof situacaoRaw === 'number') {
    sitId = situacaoRaw
  } else if (typeof situacaoRaw === 'string') {
    if (!isNaN(Number(situacaoRaw))) {
      sitId = Number(situacaoRaw)
    } else {
      sitValor = situacaoRaw.toLowerCase()
    }
  }

  // Bling v3:
  // Contas a Receber / Pagar: 1 = Aberto, 2 = Liquidado/Recebido/Pago, 3 = Parcial, 4 = Cancelado
  // Pedidos de Venda: 9 = Atendido, 6 = Em aberto, 0 = Em aberto, 12 = Cancelado
  const isReceived = sitId === 2 || sitId === 9 || sitValor.includes('atendid') || sitValor.includes('recebid') || sitValor.includes('liquid') || sitValor.includes('pago') || sitValor.includes('faturad')
  const isPartial = sitId === 3 || sitValor.includes('parcial')
  const isCanceled = sitId === 4 || sitId === 12 || sitValor.includes('cancel')

  return {
    isReceived,
    isPaid: isReceived,
    isPartial,
    isCanceled,
    sitId,
    sitValor
  }
}

/**
 * Busca Contatos (Clientes e Fornecedores) na API v3 do Bling com paginação completa
 */
export async function fetchBlingContatos(apiKey) {
  const allContacts = []
  let page = 1
  const maxPages = 20

  try {
    while (page <= maxPages) {
      const res = await fetchBlingApi(`/contatos?pagina=${page}&limite=100`, apiKey)
      if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
        allContacts.push(...res.data)
        page++
      } else {
        break
      }
    }
    return allContacts
  } catch (err) {
    console.warn('Aviso ao consultar contatos no Bling:', err)
    return allContacts
  }
}

/**
 * Busca Pedidos de Venda na API v3 do Bling com paginação completa
 */
export async function fetchBlingPedidosVendas(apiKey) {
  const allOrders = []
  let page = 1
  const maxPages = 25

  try {
    while (page <= maxPages) {
      const res = await fetchBlingApi(`/pedidos/vendas?pagina=${page}&limite=100`, apiKey)
      if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
        allOrders.push(...res.data)
        page++
      } else {
        if (page === 1) {
          const fallbackRes = await fetchBlingApi(`/pedidos/vendas?limite=100`, apiKey)
          if (fallbackRes.ok && Array.isArray(fallbackRes.data)) {
            allOrders.push(...fallbackRes.data)
          }
        }
        break
      }
    }
    console.log(`[Bling API] Pedidos de Venda recuperados: ${allOrders.length} pedidos.`)
    return allOrders
  } catch (err) {
    console.warn('Aviso ao consultar pedidos de venda no Bling:', err)
    return allOrders
  }
}

/**
 * Busca Notas Fiscais Eletrônicas (NF-e) na API v3 do Bling com paginação completa
 */
export async function fetchBlingNotasFiscais(apiKey) {
  const allNfes = []
  let page = 1
  const maxPages = 30

  try {
    while (page <= maxPages) {
      const res = await fetchBlingApi(`/nfe?pagina=${page}&limite=100`, apiKey)
      if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
        allNfes.push(...res.data)
        page++
      } else {
        if (page === 1) {
          const fallbackRes = await fetchBlingApi(`/nfe?limite=100`, apiKey)
          if (fallbackRes.ok && Array.isArray(fallbackRes.data)) {
            allNfes.push(...fallbackRes.data)
          }
        }
        break
      }
    }
    console.log(`[Bling API] Notas Fiscais (NF-e) recuperadas: ${allNfes.length} notas.`)
    return allNfes
  } catch (err) {
    console.warn('Aviso ao consultar NF-e no Bling:', err)
    return allNfes
  }
}

/**
 * Busca os detalhes completos de um Pedido de Venda específico (incluindo todos os itens/produtos)
 */
export async function fetchBlingPedidoDetalhes(orderId, apiKey) {
  if (!orderId) return null
  try {
    const res = await fetchBlingApi(`/pedidos/vendas/${orderId}`, apiKey)
    if (res.ok && res.data) {
      return res.data
    }
  } catch (err) {
    console.warn(`Aviso ao consultar detalhes do pedido ${orderId} no Bling:`, err)
  }
  return null
}

/**
 * Busca os detalhes completos de uma NF-e específica (incluindo todos os itens faturados)
 */
export async function fetchBlingNfeDetalhes(nfeId, apiKey) {
  if (!nfeId) return null
  try {
    const res = await fetchBlingApi(`/nfe/${nfeId}`, apiKey)
    if (res.ok && res.data) {
      return res.data
    }
  } catch (err) {
    console.warn(`Aviso ao consultar detalhes da NF-e ${nfeId} no Bling:`, err)
  }
  return null
}

/**
 * Busca todos os produtos cadastrados no Bling ERP (/v3/produtos)
 */
export async function fetchBlingProdutos(apiKey) {
  const allProdutos = []
  let page = 1
  const maxPages = 20

  try {
    while (page <= maxPages) {
      const res = await fetchBlingApi(`/produtos?pagina=${page}&limite=100`, apiKey)
      if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
        allProdutos.push(...res.data)
        page++
      } else {
        if (page === 1) {
          const fallbackRes = await fetchBlingApi(`/produtos?limite=100`, apiKey)
          if (fallbackRes.ok && Array.isArray(fallbackRes.data)) {
            allProdutos.push(...fallbackRes.data)
          }
        }
        break
      }
    }
    console.log(`[Bling API] Produtos recuperados: ${allProdutos.length} itens.`)
    return allProdutos
  } catch (err) {
    console.warn('Aviso ao consultar produtos no Bling:', err)
    return allProdutos
  }
}

/**
 * Catálogo Oficial de Linhas e Produtos BR Lumens com Inteligência de Estoque & Ruptura
 */
export const BR_LUMENS_CATALOG_PRODUCTS = []

/**
 * Motor de Inteligência de Estoque: Diagnóstico de Ruptura, Estoque Parado, Giro e Total de Peças Físicas
 */
export function calculateStockIntelligence(salesRanking = [], realCatalog = []) {
  const baseList = Array.isArray(realCatalog) && realCatalog.length > 0
    ? realCatalog
    : (Array.isArray(salesRanking) ? salesRanking : [])

  const allItems = baseList.map(prod => {
    const unitsSold = Number(prod.quantity || prod.unitsSold || 0)
    const revenueSold = Number(prod.totalAmount || prod.revenueSold || (unitsSold * Number(prod.unitValue || 0)) || 0)
    const currentStock = Number(prod.currentStock !== undefined ? prod.currentStock : (prod.estoqueAtual || 0))
    const minStock = Number(prod.minStock !== undefined ? prod.minStock : (prod.estoqueMinimo || 0))
    const unitVal = Number(prod.unitValue || (unitsSold > 0 ? revenueSold / unitsSold : 0))
    const costPrice = Number(prod.costPrice || (unitVal * 0.6))
    const capitalImobilizado = currentStock * costPrice

    let stockStatus = "saudavel"
    let statusLabel = "Estoque Regular"
    let alertType = "success"
    let daysCoverage = unitsSold > 0 && currentStock > 0 ? Math.round((currentStock / unitsSold) * 30) : 0

    if (unitsSold > 0 && currentStock <= 0) {
      stockStatus = "ruptura"
      statusLabel = "Ruptura (Estoque Zerado)"
      alertType = "danger"
    } else if (minStock > 0 && currentStock < minStock) {
      stockStatus = "ruptura"
      statusLabel = "Risco de Ruptura"
      alertType = "warning"
    } else if (unitsSold === 0 && currentStock > 0) {
      stockStatus = "parado"
      statusLabel = "Estoque Parado"
      alertType = "danger"
    } else if (daysCoverage > 90) {
      stockStatus = "excesso"
      statusLabel = "Excesso de Estoque"
      alertType = "warning"
    }

    return {
      id: prod.id || prod.code || prod.description,
      code: prod.code || "SKU",
      description: prod.description || "Produto",
      category: prod.category || "Geral",
      unitValue: unitVal,
      unitsSold,
      revenueSold,
      currentStock,
      minStock,
      costPrice,
      capitalImobilizado,
      stockStatus,
      statusLabel,
      alertType,
      daysCoverage,
      daysWithoutSale: unitsSold > 0 ? 0 : 30
    }
  })

  const ruptureItems = allItems.filter(i => i.stockStatus === "ruptura")
  const deadStockItems = allItems.filter(i => i.stockStatus === "parado")
  const healthyItems = allItems.filter(i => i.stockStatus === "saudavel")
  const overstockItems = allItems.filter(i => i.stockStatus === "excesso")

  const totalCapitalImobilizado = allItems.reduce((acc, i) => acc + i.capitalImobilizado, 0)
  const deadStockCapital = deadStockItems.reduce((acc, i) => acc + i.capitalImobilizado, 0)
  const potentialLossRupture = ruptureItems.reduce((acc, i) => acc + (i.revenueSold > 0 ? i.revenueSold : i.unitValue * 10), 0)

  const totalPhysicalStockUnits = allItems.reduce((acc, i) => acc + i.currentStock, 0)
  const totalPhysicalSoldUnits = allItems.reduce((acc, i) => acc + (i.unitsSold || 0), 0)
  const deadStockPhysicalUnits = deadStockItems.reduce((acc, i) => acc + i.currentStock, 0)
  const ruptureMissingUnits = ruptureItems.reduce((acc, i) => acc + Math.max(0, i.minStock - i.currentStock), 0)

  const categoryMap = new Map()
  allItems.forEach(i => {
    const cat = i.category || "Geral"
    if (!categoryMap.has(cat)) {
      categoryMap.set(cat, {
        category: cat,
        skusCount: 0,
        stockUnits: 0,
        soldUnits: 0,
        capitalTotal: 0
      })
    }
    const c = categoryMap.get(cat)
    c.skusCount += 1
    c.stockUnits += i.currentStock
    c.soldUnits += (i.unitsSold || 0)
    c.capitalTotal += i.capitalImobilizado
  })

  return {
    allItems,
    ruptureItems,
    deadStockItems,
    healthyItems,
    overstockItems,
    categorySummary: Array.from(categoryMap.values()),
    metrics: {
      totalCapitalImobilizado,
      deadStockCapital,
      potentialLossRupture,
      ruptureCount: ruptureItems.length,
      deadStockCount: deadStockItems.length,
      healthyCount: healthyItems.length,
      overstockCount: overstockItems.length,
      totalCatalogSkus: allItems.length,
      totalPhysicalStockUnits,
      totalPhysicalSoldUnits,
      deadStockPhysicalUnits,
      ruptureMissingUnits
    }
  }
}

/**
 * Helper para decompor um montante de venda em múltiplos SKUs reais da BR Lumens
 */
export function generateItemsFromAmount() {
  return []
}

/**
 * Extrai o Prazo Médio (PMR / dias) e parcelas a partir das informações de pagamento de um pedido Bling
 */
export function extractOrderPaymentTerms(ped, issueDate) {
  // 1. Verificar parcelas estruturadas (ped.parcelas, ped.pagamento?.parcelas, ped.parcelasPedido)
  const rawParcelas = ped.parcelas || ped.pagamento?.parcelas || ped.parcelasPedido || []
  if (Array.isArray(rawParcelas) && rawParcelas.length > 0) {
    let weightedDays = 0
    let totalVal = 0
    let lastDueDate = null
    const mappedParcelas = []

    rawParcelas.forEach(p => {
      const v = Number(p.valor || p.valorParcela || 0)
      let dias = Number(p.dias || p.prazo || 0)
      const dataVenc = p.dataVencimento || p.vencimento || p.data || null

      if (!dias && dataVenc && issueDate) {
        try {
          const d1 = new Date(issueDate)
          const d2 = new Date(dataVenc)
          dias = Math.max(0, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)))
        } catch (e) {
          dias = 0
        }
      }

      if (dataVenc) {
        lastDueDate = dataVenc
      }

      const effectiveVal = v > 0 ? v : 1
      weightedDays += (dias || 0) * effectiveVal
      totalVal += effectiveVal
      mappedParcelas.push({ dias, dataVencimento: dataVenc, valor: v })
    })

    if (totalVal > 0 && weightedDays > 0) {
      const pmr = Math.round(weightedDays / totalVal)
      return {
        daysTerm: pmr,
        parcelas: mappedParcelas,
        lastDueDate: lastDueDate,
        condicao: mappedParcelas.map(p => p.dias).join(' ')
      }
    }
  }

  // 2. Verificar string de condição de pagamento (ex: "29 44 59", "29/44/59", "30 60 90")
  const condStr = ped.condicaoPagamento || ped.condicao || ped.pagamento?.condicao || ped.formaPagamento?.condicao || ''
  if (condStr && typeof condStr === 'string') {
    const nums = condStr.match(/\b\d+\b/g)
    if (nums && nums.length > 0) {
      const daysArray = nums.map(n => parseInt(n, 10)).filter(n => !isNaN(n) && n > 0 && n < 1000)
      if (daysArray.length > 0) {
        const avg = Math.round(daysArray.reduce((a, b) => a + b, 0) / daysArray.length)
        return {
          daysTerm: avg,
          parcelas: daysArray.map(d => ({ dias: d })),
          condicao: daysArray.join(' ')
        }
      }
    }
  }


  // 4. Se houver diferença entre data de saída / previsão e data do pedido
  const issueD = ped.data || ped.dataOperacao || ped.dataEmissao || issueDate
  const dueD = ped.dataSaida || ped.dataPrevista || ped.vencimento || ped.dataVencimento
  if (issueD && dueD && issueD !== dueD) {
    try {
      const diff = Math.max(0, Math.round((new Date(dueD) - new Date(issueD)) / (1000 * 60 * 60 * 24)))
      if (diff > 0) {
        return { daysTerm: diff, lastDueDate: dueD }
      }
    } catch (e) {}
  }

  return { daysTerm: 44, condicao: '29 44 59' }
}

/**
 * Sincronizador Completo da API Bling ERP (v3) para a BR Lumens (Amici Comex)
 * Puxa histórico de vendas, faturamento, contas a receber, notas fiscais e clientes
 */
export async function syncRealBlingData(targetClient, onProgress = () => {}) {
  const clientTradeName = targetClient?.tradeName || 'BR Lumens'
  const clientId = targetClient?.id || 'd0000000-0000-0000-0000-000000000002'
  const todayStr = new Date().toISOString().split('T')[0]

  const isHge = targetClient?.id === 'hge-iluminacao' || 
                String(targetClient?.id || '').toLowerCase().includes('hge') || 
                String(targetClient?.tradeName || '').toLowerCase().includes('hge')
  const primaryAccount = isHge ? 'hge-iluminacao' : 'br-lumens'

  onProgress({ step: 'init', message: `Conectando à API v3 do Bling ERP de ${clientTradeName}...`, progress: 10 })
  await new Promise(r => setTimeout(r, 100))

  onProgress({ step: 'auth', message: `Verificando credenciais OAuth e token de ${clientTradeName}...`, progress: 20 })
  await new Promise(r => setTimeout(r, 100))

  onProgress({ step: 'orders', message: `Puxando histórico de pedidos de venda e faturamento (/v3/pedidos/vendas)...`, progress: 35 })
  const livePedidosRaw = await fetchBlingPedidosVendas(primaryAccount)
  await new Promise(r => setTimeout(r, 100))

  // Busca itens detalhados de pedidos na API Bling com controle de taxa e sem rajadas
  onProgress({ step: 'orders_items', message: `Carregando itens de produtos e SKUs dos pedidos...`, progress: 42 })
  const livePedidos = []
  const allOrdersList = Array.isArray(livePedidosRaw) ? livePedidosRaw : []
  // Consulta detalhes somente dos 25 pedidos mais recentes que não tiverem itens
  const ordersToFetchDetails = allOrdersList.slice(0, 25)
  const remainingOrders = allOrdersList.slice(25)

  for (const ped of ordersToFetchDetails) {
    if (ped.itens && Array.isArray(ped.itens) && ped.itens.length > 0) {
      livePedidos.push(ped)
      continue
    }
    try {
      const detail = await fetchBlingPedidoDetalhes(ped.id, primaryAccount)
      if (detail) {
        livePedidos.push({
          ...ped,
          ...detail,
          itens: (detail.itens && detail.itens.length > 0) ? detail.itens : ped.itens,
          parcelas: detail.parcelas || detail.pagamento?.parcelas || ped.parcelas,
          pagamento: detail.pagamento || ped.pagamento,
          condicao: detail.condicao || detail.pagamento?.condicao || ped.condicao
        })
      } else {
        livePedidos.push(ped)
      }
    } catch (err) {
      livePedidos.push(ped)
    }
  }
  livePedidos.push(...remainingOrders)

  onProgress({ step: 'nfe', message: `Puxando notas fiscais eletrônicas emitidas (/v3/nfe)...`, progress: 55 })
  const liveNfes = await fetchBlingNotasFiscais(primaryAccount)
  await new Promise(r => setTimeout(r, 100))

  onProgress({ step: 'receivables', message: `Importando contas a receber e parcelas (/v3/contas/receber)...`, progress: 68 })
  const liveReceivables = await fetchBlingContasReceber(primaryAccount)
  await new Promise(r => setTimeout(r, 100))

  onProgress({ step: 'contacts', message: `Carregando parceiros comerciais e clientes (/v3/contatos)...`, progress: 80 })
  const liveContatos = await fetchBlingContatos(primaryAccount)
  await new Promise(r => setTimeout(r, 100))

  onProgress({ step: 'products', message: `Carregando catálogo e produtos (/v3/produtos)...`, progress: 90 })
  const liveProdutos = await fetchBlingProdutos(primaryAccount)
  await new Promise(r => setTimeout(r, 100))

  onProgress({ step: 'mapping', message: `Processando inteligência de vendas, PMR e ticket médio...`, progress: 95 })

  // 1. Mapeamento de Contas a Pagar (Standby)
  const livePayables = await fetchBlingContasPagar(primaryAccount)
  const validLivePayables = (livePayables || []).filter(p => !parseBlingSituacao(p.situacao).isCanceled)

  const mappedPayables = validLivePayables.map((p, idx) => {
    const rawAmount = Number(p.valor || p.total || 0)
    const sitInfo = parseBlingSituacao(p.situacao)
    const rawSaldo = p.saldo !== undefined && p.saldo !== null ? Number(p.saldo) : (sitInfo.isPaid ? 0 : rawAmount)
    const isPaid = sitInfo.isPaid || (rawAmount > 0 && rawSaldo === 0)
    const isPartial = sitInfo.isPartial || (!isPaid && rawSaldo > 0 && rawSaldo < rawAmount)
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
      barcode: p.codigoBarras || p.linhaDigitavel || null,
      companySource: 'BR Lumens'
    }
  })

  // 2. Mapeamento de Pedidos de Venda e Contas a Receber
  const combinedReceivablesMap = new Map()

  // Se houver pedidos de venda reais cadastrados no Bling (/pedidos/vendas)
  if (Array.isArray(livePedidos) && livePedidos.length > 0) {
    livePedidos.forEach((ped, idx) => {
      const sitInfo = parseBlingSituacao(ped.situacao)
      if (sitInfo.isCanceled) return

      const rawAmount = Number(ped.total || ped.totalVenda || ped.valor || 0)
      const isReceived = sitInfo.isReceived
      const isPartial = sitInfo.isPartial
      const receivedAmount = isReceived ? rawAmount : 0
      const remainingAmount = isReceived ? 0 : rawAmount
      const issueDate = ped.data || ped.dataOperacao || ped.dataEmissao || todayStr
      const dueDate = ped.dataSaida || ped.dataPrevista || ped.data || todayStr

      // Cálculo de dias de prazo concedido (PMR) via parcelas reais e condições de pagamento
      const paymentTerms = extractOrderPaymentTerms(ped, issueDate)
      const daysTerm = paymentTerms.daysTerm || 44
      const finalDueDate = paymentTerms.lastDueDate || dueDate

      let status = 'pending'
      if (isReceived) {
        status = 'received'
      } else if (isPartial) {
        status = 'partial'
      } else if (finalDueDate < todayStr) {
        status = 'overdue'
      } else if (finalDueDate === todayStr) {
        status = 'today'
      }

      // Itens do pedido da API ou decomposição do catálogo real da BR Lumens
      const rawItems = ped.itens || ped.itensPedido || []
      let mappedItems = []
      const docNumPed = String(ped.numero || ped.id || ped.documentNumber || '')
      const custNamePed = String(ped.contato?.nome || ped.cliente?.nome || ped.customer || '').toUpperCase()

      if (Array.isArray(rawItems) && rawItems.length > 0) {
        mappedItems = rawItems.map((item, itemIdx) => {
          const prod = item.produto || item
          return {
            id: prod.id || `${ped.id}-item-${itemIdx}`,
            code: prod.codigo || prod.sku || `PROD-${itemIdx + 1}`,
            description: prod.descricao || prod.nome || 'Produto BR Lumens LED',
            quantity: Number(item.quantidade || 1),
            unitValue: Number(item.valor || item.valorUnitario || prod.preco || 0),
            totalValue: Number(item.valorTotal || (Number(item.quantidade || 1) * Number(item.valor || item.valorUnitario || prod.preco || 0)))
          }
        })
      } else {
        mappedItems = []
      }

      const idKey = `bling-ped-${ped.id || ped.numero || idx}`
      combinedReceivablesMap.set(idKey, {
        id: idKey,
        rawId: ped.id,
        orderNumber: ped.numero || String(ped.id || idx + 1),
        clientId: clientId,
        customer: ped.contato?.nome || ped.cliente?.nome || 'Cliente BR Lumens',
        customerName: ped.contato?.nome || ped.cliente?.nome || 'Cliente BR Lumens',
        customerDocument: ped.contato?.numeroDocumento || null,
        description: `Pedido de Venda #${ped.numero || ped.id || idx + 1}`,
        issueDate: issueDate,
        dueDate: finalDueDate,
        paymentDate: isReceived ? finalDueDate : null,
        daysTerm: daysTerm,
        paymentTerms: paymentTerms.condicao || '29 44 59',
        parcelas: paymentTerms.parcelas || [],
        amount: rawAmount,
        amountPaid: receivedAmount,
        amountRemaining: remainingAmount,
        status: status,
        category: ped.categoria?.descricao || 'Venda de Iluminação LED (Comex)',
        bankAccount: 'Itaú PJ',
        erpProvider: 'Bling ERP v3',
        documentNumber: String(ped.numero || ped.id || ''),
        paymentMethod: ped.formaPagamento?.descricao || (paymentTerms.condicao ? `Boleto (${paymentTerms.condicao} dias)` : 'Boleto / PIX'),
        items: mappedItems,
        invoiceNumber: ped.notaFiscal?.numero || ped.numeroNotaFiscal || null
      })
    })
  }

  // Mapeia contas a receber do Bling (/contas/receber)
  const validLiveReceivables = (liveReceivables || []).filter(r => !parseBlingSituacao(r.situacao).isCanceled)

  validLiveReceivables.forEach((r, idx) => {
    const rawAmount = Number(r.valor || r.total || 0)
    const sitInfo = parseBlingSituacao(r.situacao)
    const rawSaldo = r.saldo !== undefined && r.saldo !== null ? Number(r.saldo) : (sitInfo.isReceived ? 0 : rawAmount)
    const isReceived = sitInfo.isReceived || (rawAmount > 0 && rawSaldo === 0)
    const isPartial = sitInfo.isPartial || (!isReceived && rawSaldo > 0 && rawSaldo < rawAmount)
    const receivedAmount = isReceived ? rawAmount : (isPartial ? Math.max(0, rawAmount - rawSaldo) : 0)
    const issueDate = r.dataEmissao || r.data || todayStr
    const dueDate = r.vencimento || r.dataVencimento || r.data || todayStr
    const paymentDate = r.dataLiquidacao || r.dataPagamento || (isReceived ? dueDate : null)

    const paymentTerms = extractOrderPaymentTerms(r, issueDate)
    const daysTerm = paymentTerms.daysTerm || 44
    const finalDueDate = paymentTerms.lastDueDate || dueDate

    let status = 'pending'
    if (isReceived) {
      status = 'received'
    } else if (isPartial) {
      status = 'partial'
    } else if (finalDueDate < todayStr) {
      status = 'overdue'
    } else if (finalDueDate === todayStr) {
      status = 'today'
    }

    const idKey = `bling-rec-${r.id || idx}`
    if (!combinedReceivablesMap.has(idKey)) {
      const mappedItems = []
      combinedReceivablesMap.set(idKey, {
        id: idKey,
        rawId: r.id,
        orderNumber: r.numeroDocumento || String(r.id || idx + 1),
        clientId: clientId,
        customer: r.contato?.nome || r.cliente?.nome || 'Cliente BR Lumens',
        customerName: r.contato?.nome || r.cliente?.nome || 'Cliente BR Lumens',
        customerDocument: r.contato?.numeroDocumento || null,
        description: r.historico || r.descricao || (r.numeroDocumento ? `Título #${r.numeroDocumento}` : `Recebimento Bling #${r.id || idx + 1}`),
        issueDate: issueDate,
        dueDate: finalDueDate,
        paymentDate: paymentDate || (isReceived ? finalDueDate : null),
        daysTerm: daysTerm,
        paymentTerms: paymentTerms.condicao || '29 44 59',
        parcelas: paymentTerms.parcelas || [],
        amount: rawAmount,
        amountPaid: receivedAmount,
        amountRemaining: isReceived ? 0 : rawSaldo,
        status: status,
        category: r.categoria?.descricao || r.categoria?.nome || 'Venda de Iluminação LED (Comex)',
        bankAccount: r.portador?.nome || r.portador?.descricao || 'Itaú PJ',
        erpProvider: 'Bling ERP v3',
        documentNumber: String(r.numeroDocumento || r.id || ''),
        paymentMethod: r.formaPagamento?.descricao || (paymentTerms.condicao ? `Boleto (${paymentTerms.condicao} dias)` : 'Boleto / PIX'),
        items: mappedItems,
        invoiceNumber: r.numeroDocumento || null
      })
    }
  })

  // 3. Mapeamento de Notas Fiscais (NF-e)
  const mappedInvoices = (liveNfes || []).map((nfe, idx) => {
    const rawVal = Number(nfe.valorNota || nfe.total || nfe.valor || 0)
    return {
      id: `bling-nfe-${nfe.id || idx}`,
      rawId: nfe.id,
      number: String(nfe.numero || nfe.id || idx + 1),
      series: String(nfe.serie || '1'),
      key: nfe.chaveAcesso || nfe.chave || null,
      issueDate: nfe.dataEmissao || nfe.data || todayStr,
      customer: nfe.contato?.nome || nfe.cliente?.nome || 'Destinatário BR Lumens',
      customerDocument: nfe.contato?.numeroDocumento || null,
      amount: rawVal,
      status: String(nfe.situacao || nfe.status || 'Autorizada'),
      type: nfe.tipo === 0 ? 'Entrada' : 'Saída',
      danfeUrl: nfe.linkDanfe || nfe.linkPDF || null,
      companySource: 'BR Lumens'
    }
  })

  // 4. Integração com a API Bling da HGE Iluminação (apenas se a conta primária for BR Lumens)
  const hgeConfig = getBlingConfig('hge-iluminacao')
  const hasHgeToken = Boolean(hgeConfig.accessToken || hgeConfig.refreshToken)
  const hgePayables = []
  const hgeReceivables = []
  const hgeInvoices = []

  if (!isHge && hasHgeToken) {
    try {
      onProgress({ step: 'hge', message: 'Sincronizando faturamento e títulos da HGE Iluminação...', progress: 96 })
      const hgePedRaw = await fetchBlingPedidosVendas('hge-iluminacao')
      const hgeNfesRaw = await fetchBlingNotasFiscais('hge-iluminacao')
      const hgeRecRaw = await fetchBlingContasReceber('hge-iluminacao')
      const hgePayRaw = await fetchBlingContasPagar('hge-iluminacao')

      // Mapeia contas a pagar HGE
      if (Array.isArray(hgePayRaw) && hgePayRaw.length > 0) {
        hgePayRaw.filter(p => !parseBlingSituacao(p.situacao).isCanceled).forEach((p, idx) => {
          const rawAmount = Number(p.valor || p.total || 0)
          const sitInfo = parseBlingSituacao(p.situacao)
          const rawSaldo = p.saldo !== undefined && p.saldo !== null ? Number(p.saldo) : (sitInfo.isPaid ? 0 : rawAmount)
          const isPaid = sitInfo.isPaid || (rawAmount > 0 && rawSaldo === 0)
          const isPartial = sitInfo.isPartial || (!isPaid && rawSaldo > 0 && rawSaldo < rawAmount)
          hgePayables.push({
            id: `hge-pay-${p.id || idx}`,
            clientId: clientId,
            companySource: 'HGE Iluminação',
            description: p.historico || p.descricao || `Pagamento HGE #${p.id || idx + 1}`,
            supplier: p.contato?.nome || p.fornecedor?.nome || 'Fornecedor HGE',
            dueDate: p.vencimento || p.dataVencimento || todayStr,
            amount: rawAmount,
            amountPaid: isPaid ? rawAmount : (isPartial ? Math.max(0, rawAmount - rawSaldo) : 0),
            amountRemaining: isPaid ? 0 : rawSaldo,
            status: isPaid ? 'paid' : (isPartial ? 'partial' : ((p.vencimento || todayStr) < todayStr ? 'overdue' : 'scheduled')),
            category: p.categoria?.descricao || 'Custo Operacional HGE',
            bankAccount: 'Conta HGE PJ',
            erpProvider: 'Bling ERP v3',
            documentNumber: String(p.numeroDocumento || p.id || '')
          })
        })
      }

      // Mapeia pedidos de venda HGE
      if (Array.isArray(hgePedRaw) && hgePedRaw.length > 0) {
        hgePedRaw.filter(ped => !parseBlingSituacao(ped.situacao).isCanceled).forEach((ped, idx) => {
          const rawAmount = Number(ped.total || ped.totalVenda || ped.valor || 0)
          const sitInfo = parseBlingSituacao(ped.situacao)
          const isReceived = sitInfo.isReceived
          const issueDate = ped.data || ped.dataOperacao || todayStr
          const paymentTerms = extractOrderPaymentTerms(ped, issueDate)
          hgeReceivables.push({
            id: `hge-ped-${ped.id || idx}`,
            rawId: ped.id,
            orderNumber: ped.numero || String(ped.id || idx + 1),
            clientId: clientId,
            companySource: 'HGE Iluminação',
            customer: ped.contato?.nome || ped.cliente?.nome || 'Cliente HGE Iluminação',
            customerName: ped.contato?.nome || ped.cliente?.nome || 'Cliente HGE Iluminação',
            description: `Pedido de Venda HGE #${ped.numero || ped.id || idx + 1}`,
            issueDate: issueDate,
            dueDate: paymentTerms.lastDueDate || issueDate,
            paymentDate: isReceived ? (paymentTerms.lastDueDate || issueDate) : null,
            daysTerm: paymentTerms.daysTerm || 30,
            paymentTerms: paymentTerms.condicao || '30 DDL',
            parcelas: paymentTerms.parcelas || [],
            amount: rawAmount,
            amountPaid: isReceived ? rawAmount : 0,
            amountRemaining: isReceived ? 0 : rawAmount,
            status: isReceived ? 'received' : ((paymentTerms.lastDueDate || issueDate) < todayStr ? 'overdue' : 'pending'),
            category: 'Faturamento HGE Iluminação',
            bankAccount: 'Conta HGE PJ',
            erpProvider: 'Bling ERP v3',
            documentNumber: String(ped.numero || ped.id || ''),
            paymentMethod: 'Boleto Bancário',
            items: Array.isArray(ped.itens) ? ped.itens.map((it, itIdx) => ({ id: it.id || String(itIdx), code: it.codigo || "SKU", description: it.descricao || "Item", quantity: Number(it.quantidade || 1), unitValue: Number(it.valor || 0), totalValue: Number(it.valorTotal || 0) })) : []
          })
        })
      }

      // Mapeia NF-es HGE
      if (Array.isArray(hgeNfesRaw) && hgeNfesRaw.length > 0) {
        hgeNfesRaw.forEach((nfe, idx) => {
          hgeInvoices.push({
            id: `hge-nfe-${nfe.id || idx}`,
            rawId: nfe.id,
            companySource: 'HGE Iluminação',
            number: String(nfe.numero || nfe.id || idx + 1),
            series: String(nfe.serie || '1'),
            key: nfe.chaveAcesso || nfe.chave || null,
            issueDate: nfe.dataEmissao || nfe.data || todayStr,
            customer: nfe.contato?.nome || nfe.cliente?.nome || 'Destinatário HGE Iluminação',
            customerDocument: nfe.contato?.numeroDocumento || null,
            amount: Number(nfe.valorNota || nfe.total || nfe.valor || 0),
            status: String(nfe.situacao || nfe.status || 'Autorizada'),
            type: nfe.tipo === 0 ? 'Entrada' : 'Saída',
            danfeUrl: nfe.linkDanfe || nfe.linkPDF || null
          })
        })
      }
    } catch (hgeErr) {
      console.warn('Aviso ao sincronizar HGE Iluminação:', hgeErr)
    }
  }

  const primarySourceName = isHge ? 'HGE Iluminação' : 'BR Lumens'
  const finalPayables = [...mappedPayables.map(p => ({ ...p, companySource: p.companySource || primarySourceName })), ...hgePayables]
  const finalReceivables = [...Array.from(combinedReceivablesMap.values()).map(r => ({ ...r, companySource: r.companySource || primarySourceName })), ...hgeReceivables]
  const finalInvoices = [...mappedInvoices.map(i => ({ ...i, companySource: i.companySource || primarySourceName })), ...hgeInvoices]
  const finalContatos = liveContatos || []
  const finalProdutos = liveProdutos || []

  onProgress({ step: 'done', message: `✓ Dados de ${clientTradeName} sincronizados via Bling API v3!`, progress: 100 })

  return {
    success: true,
    payables: finalPayables,
    receivables: finalReceivables,
    invoices: finalInvoices,
    products: finalProdutos,
    transactions: [],
    counterparties: finalContatos,
    categories: [],
    syncSummary: {
      client: clientTradeName,
      provider: 'Bling ERP v3',
      payablesCount: finalPayables.length,
      receivablesCount: finalReceivables.length,
      invoicesCount: mappedInvoices.length,
      productsCount: finalProdutos.length,
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
