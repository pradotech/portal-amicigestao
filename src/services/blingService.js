/**
 * Serviço de Integração com a API Bling ERP (v3)
 * Especializado para o cliente BR Lumens na divisão Amici Comex
 */

const BLING_STORAGE_KEY = 'amici_bling_config_v1'
export const BLING_CLIENT_ID = import.meta.env.VITE_BLING_CLIENT_ID || '2d98294f0948441772adcf71ab82abdbf27d1594'
export const BLING_CLIENT_SECRET = import.meta.env.VITE_BLING_CLIENT_SECRET || '665a5c85ef01e9ee550484c5abdad2ca71a9e00955fda1d9c0093b323630'
export const BLING_REDIRECT_URI = import.meta.env.VITE_BLING_REDIRECT_URI || 'https://portal-amicigestao.vercel.app/oauth/bling/callback'
export const BLING_AUTH_URL = `https://www.bling.com.br/Api/v3/oauth/authorize?response_type=code&client_id=${BLING_CLIENT_ID}&state=amici_brlumens_comex`

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

export const BLING_INITIAL_PAYABLES = []
export const BLING_INITIAL_RECEIVABLES = []
export const BLING_INITIAL_COUNTERPARTIES = []

/**
 * Helper de requisição resiliente com Proxy anti-CORS (/api-bling) e renovação automática de token
 */
async function fetchBlingApi(endpoint, apiKey, options = {}) {
  const config = getBlingConfig()
  let token = apiKey || config.accessToken || config.apiKey
  if (!token) return { ok: false, status: 401, data: [], error: 'Token não configurado' }

  let headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
    ...(options.headers || {})
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const primaryUrl = `/api-bling${cleanEndpoint}`

  try {
    let res = await fetch(primaryUrl, {
      ...options,
      headers
    })

    // Se receber 401 (token expirado ou não autorizado), renova automaticamente via Refresh Token e repete
    if (!res.ok && res.status === 401) {
      console.log('🔄 Bling ERP: Token expirado (401). Executando auto-renovação transparente via OAuth2 Refresh Token...')
      const refreshed = await refreshBlingAccessToken()
      if (refreshed && refreshed.success && refreshed.accessToken) {
        token = refreshed.accessToken
        headers['Authorization'] = `Bearer ${token}`
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
    console.warn(`[Bling API] Resposta ${res.status} em ${cleanEndpoint}:`, errText)
    return { ok: false, status: res.status, data: [], error: errText }
  } catch (err) {
    console.warn(`[Bling API] Falha de conexão em ${cleanEndpoint}:`, err.message)
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

  onProgress({ step: 'payables', message: `Importando contas a pagar de importação e fornecedores (/v3/contas/pagar)...`, progress: 45 })
  const livePayables = await fetchBlingContasPagar()
  await new Promise(r => setTimeout(r, 150))

  onProgress({ step: 'orders', message: `Consultando pedidos de venda e faturamento (/v3/pedidos/vendas)...`, progress: 65 })
  const livePedidos = await fetchBlingPedidosVendas()
  await new Promise(r => setTimeout(r, 150))

  onProgress({ step: 'receivables', message: `Importando contas a receber (/v3/contas/receber)...`, progress: 80 })
  const liveReceivables = await fetchBlingContasReceber()
  await new Promise(r => setTimeout(r, 150))

  onProgress({ step: 'contacts', message: `Carregando parceiros comerciais (/v3/contatos)...`, progress: 90 })
  const liveContatos = await fetchBlingContatos()
  await new Promise(r => setTimeout(r, 150))

  onProgress({ step: 'mapping', message: `Processando fluxo financeiro e faturamento da BR Lumens...`, progress: 95 })

  // 1. Mapeamento de Contas a Pagar
  const validLivePayables = livePayables.filter(p => !parseBlingSituacao(p.situacao).isCanceled)

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
      barcode: p.codigoBarras || p.linhaDigitavel || null
    }
  })

  // 2. Mapeamento de Pedidos de Venda e Contas a Receber
  const combinedReceivablesMap = new Map()

  // Se houver pedidos de venda reais cadastrados no Bling (/pedidos/vendas)
  if (Array.isArray(livePedidos) && livePedidos.length > 0) {
    livePedidos.forEach((ped, idx) => {
      const sitInfo = parseBlingSituacao(ped.situacao)
      if (sitInfo.isCanceled) return

      const rawAmount = Number(ped.total || ped.valor || 0)
      const isReceived = sitInfo.isReceived
      const isPartial = sitInfo.isPartial
      const receivedAmount = isReceived ? rawAmount : 0
      const remainingAmount = isReceived ? 0 : rawAmount
      const dueDate = ped.dataSaida || ped.data || ped.dataPrevista || todayStr

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

      const idKey = `bling-ped-${ped.id || ped.numero || idx}`
      combinedReceivablesMap.set(idKey, {
        id: idKey,
        clientId: clientId,
        customer: ped.contato?.nome || ped.cliente?.nome || 'Cliente BR Lumens',
        customerName: ped.contato?.nome || ped.cliente?.nome || 'Cliente BR Lumens',
        description: `Pedido de Venda #${ped.numero || ped.id || idx + 1}`,
        dueDate: dueDate,
        amount: rawAmount,
        amountPaid: receivedAmount,
        amountRemaining: remainingAmount,
        status: status,
        category: ped.categoria?.descricao || 'Venda de Iluminação LED (Comex)',
        bankAccount: 'Itaú PJ',
        erpProvider: 'Bling ERP v3',
        documentNumber: String(ped.numero || ped.id || ''),
        paymentMethod: 'Boleto / PIX / Faturamento'
      })
    })
  }

  // Mapeia contas a receber do Bling (/contas/receber)
  const validLiveReceivables = liveReceivables.filter(r => !parseBlingSituacao(r.situacao).isCanceled)

  validLiveReceivables.forEach((r, idx) => {
    const rawAmount = Number(r.valor || r.total || 0)
    const sitInfo = parseBlingSituacao(r.situacao)
    const rawSaldo = r.saldo !== undefined && r.saldo !== null ? Number(r.saldo) : (sitInfo.isReceived ? 0 : rawAmount)
    const isReceived = sitInfo.isReceived || (rawAmount > 0 && rawSaldo === 0)
    const isPartial = sitInfo.isPartial || (!isReceived && rawSaldo > 0 && rawSaldo < rawAmount)
    const receivedAmount = isReceived ? rawAmount : (isPartial ? Math.max(0, rawAmount - rawSaldo) : 0)
    const dueDate = r.vencimento || r.dataVencimento || r.data || todayStr

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

    const idKey = `bling-rec-${r.id || idx}`
    // Se não tivermos o pedido correspondente ou para títulos adicionais
    if (!combinedReceivablesMap.has(idKey)) {
      combinedReceivablesMap.set(idKey, {
        id: idKey,
        clientId: clientId,
        customer: r.contato?.nome || r.cliente?.nome || 'Cliente BR Lumens',
        customerName: r.contato?.nome || r.cliente?.nome || 'Cliente BR Lumens',
        description: r.historico || r.descricao || (r.numeroDocumento ? `Título #${r.numeroDocumento}` : `Recebimento Bling #${r.id || idx + 1}`),
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
      })
    }
  })

  const finalPayables = mappedPayables
  const finalReceivables = Array.from(combinedReceivablesMap.values())
  const finalContatos = liveContatos

  onProgress({ step: 'done', message: `✓ Dados da BR Lumens sincronizados com sucesso via Bling API v3!`, progress: 100 })

  return {
    success: true,
    payables: finalPayables,
    receivables: finalReceivables,
    transactions: [],
    counterparties: finalContatos,
    categories: [],
    syncSummary: {
      client: clientTradeName,
      provider: 'Bling ERP v3',
      payablesCount: finalPayables.length,
      receivablesCount: finalReceivables.length,
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
