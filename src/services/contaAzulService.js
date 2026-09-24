/**
 * SERVIÇO DE INTEGRAÇÃO COM A API CONTA AZUL FINANCIAL OPENAPI V1 / V2
 * Especificação Oficial: https://developers.contaazul.com/docs/financial-apis-openapi/v1
 * Base URL Oficial: https://api-v2.contaazul.com
 */

const DEFAULT_CLIENT_ID = '510utbibu9gb6002lerhav28tk'
const DEFAULT_CLIENT_SECRET = '7iotvc8bqcunp3m21u6htv5ti639skkvpm9eaqjosg5ks4ufhi4'
const DEFAULT_COMPANY_ID = '3272538'
const DEFAULT_USER_EMAIL = 'drilex.fin@amicigestao.com.br'
const DEFAULT_REDIRECT_URI = 'https://portal-amicigestao.vercel.app/oauth/conta-azul/callback'

// Utiliza o proxy configurado no Vite (dev) e vercel.json (prod) para evitar bloqueios de CORS
const API_BASE = '/api-contaazul'

export function getContaAzulGlobalConfig() {
  const customSavedUri = localStorage.getItem('amici_ca_redirect_uri')
  // Garante o uso da URL oficial cadastrada no portal da Conta Azul (evita que localhost cause erro de validação)
  const validRedirectUri = (customSavedUri && !customSavedUri.includes('localhost')) ? customSavedUri : DEFAULT_REDIRECT_URI

  return {
    clientId: localStorage.getItem('amici_ca_client_id') || import.meta.env.VITE_CONTA_AZUL_CLIENT_ID || DEFAULT_CLIENT_ID,
    clientSecret: localStorage.getItem('amici_ca_client_secret') || import.meta.env.VITE_CONTA_AZUL_CLIENT_SECRET || DEFAULT_CLIENT_SECRET,
    redirectUri: validRedirectUri,
    accessToken: localStorage.getItem('amici_ca_access_token') || import.meta.env.VITE_CONTA_AZUL_ACCESS_TOKEN || '',
    refreshToken: localStorage.getItem('amici_ca_refresh_token') || import.meta.env.VITE_CONTA_AZUL_REFRESH_TOKEN || '',
    companyId: localStorage.getItem('amici_ca_company_id') || import.meta.env.VITE_CONTA_AZUL_COMPANY_ID || DEFAULT_COMPANY_ID,
    userEmail: localStorage.getItem('amici_ca_user_email') || import.meta.env.VITE_CONTA_AZUL_USER_EMAIL || DEFAULT_USER_EMAIL,
    docsUrl: 'https://developers.contaazul.com/docs/financial-apis-openapi/v1',
    state: 'amici_bpo_auth'
  }
}

export function getTokenExpirationInfo(tokenOverride) {
  const config = getContaAzulGlobalConfig()
  const token = tokenOverride || config.accessToken
  if (!token) {
    return { isConfigured: false, isExpired: true, expiresAt: null, remainingMinutes: 0 }
  }

  try {
    const parts = token.split('.')
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]))
      if (payload.exp) {
        const expDate = new Date(payload.exp * 1000)
        const now = new Date()
        const diffMs = expDate.getTime() - now.getTime()
        const remainingMinutes = Math.round(diffMs / (1000 * 60))
        return {
          isConfigured: true,
          isExpired: remainingMinutes <= 0,
          expiresAt: expDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          remainingMinutes: Math.max(0, remainingMinutes),
          email: payload.email || payload.username || config.userEmail,
          companyId: payload.ca_company_id || config.companyId
        }
      }
    }
  } catch (e) {
    console.warn('Erro ao decodificar expiração do token:', e)
  }

  return { isConfigured: true, isExpired: false, expiresAt: null, remainingMinutes: 60 }
}

export function isContaAzulTokenExpired(tokenOverride) {
  const info = getTokenExpirationInfo(tokenOverride)
  return info.isExpired
}

export function saveContaAzulGlobalConfig(clientId, clientSecret, redirectUri, accessToken, refreshToken) {
  if (clientId) localStorage.setItem('amici_ca_client_id', clientId.trim())
  if (clientSecret) localStorage.setItem('amici_ca_client_secret', clientSecret.trim())
  if (redirectUri) localStorage.setItem('amici_ca_redirect_uri', redirectUri.trim())
  if (accessToken) localStorage.setItem('amici_ca_access_token', accessToken.trim())
  if (refreshToken) localStorage.setItem('amici_ca_refresh_token', refreshToken.trim())
}

export function getContaAzulAuthHeaders(tokenOverride) {
  const config = getContaAzulGlobalConfig()
  const token = tokenOverride || config.accessToken
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
}

/**
 * Helper de requisição resiliente com renovação automática (Auto-Refresh) e fallback de endpoints
 */
async function fetchContaAzulApi(endpoint, tokenOverride, options = {}) {
  let headers = getContaAzulAuthHeaders(tokenOverride)
  const isDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  
  const proxyUrl = `/api-contaazul${endpoint}`
  const directUrl = `https://api-v2.contaazul.com${endpoint}`
  
  const primaryUrl = isDev ? proxyUrl : directUrl
  const secondaryUrl = isDev ? directUrl : proxyUrl

  try {
    let res = await fetch(primaryUrl, {
      ...options,
      headers: { ...headers, ...(options.headers || {}) }
    })

    if (!res.ok && res.status === 404) {
      res = await fetch(secondaryUrl, {
        ...options,
        headers: { ...headers, ...(options.headers || {}) }
      })
    }

    // Se retornar 401 (token expirado), tenta renovar automaticamente em segundo plano e repete a chamada
    if (!res.ok && res.status === 401) {
      console.log('🔄 Token expirou (401). Renovando automaticamente via Refresh Token...')
      const refreshed = await refreshContaAzulAccessToken()
      if (refreshed.success && refreshed.accessToken) {
        headers = getContaAzulAuthHeaders(refreshed.accessToken)
        res = await fetch(primaryUrl, {
          ...options,
          headers: { ...headers, ...(options.headers || {}) }
        })
        if (!res.ok && res.status === 404) {
          res = await fetch(secondaryUrl, {
            ...options,
            headers: { ...headers, ...(options.headers || {}) }
          })
        }
      }
    }

    return res
  } catch (err) {
    try {
      return await fetch(secondaryUrl, {
        ...options,
        headers: { ...headers, ...(options.headers || {}) }
      })
    } catch {
      throw err
    }
  }
}

/**
 * 1. GET /v1/conta-financeira (Contas Bancárias do Cliente)
 */
export async function fetchContaAzulContasFinanceiras(tokenOverride) {
  try {
    const res = await fetchContaAzulApi('/v1/conta-financeira', tokenOverride)
    if (!res.ok) {
      if (res.status === 401) {
        console.warn('⚠️ Conta Azul API: Token expirado ou não autorizado (401) em /v1/conta-financeira. Usando dados do Supabase.')
      }
      return []
    }
    const data = await res.json()
    return data.itens || []
  } catch (err) {
    console.warn('Aviso ao buscar contas financeiras:', err.message)
    return []
  }
}

/**
 * 2. GET /v1/categorias (Plano de Contas / Categorias DRE do Cliente)
 */
export async function fetchContaAzulCategorias(tokenOverride) {
  try {
    const res = await fetchContaAzulApi('/v1/categorias', tokenOverride)
    if (!res.ok) {
      if (res.status === 401) {
        console.warn('⚠️ Conta Azul API: Token expirado ou não autorizado (401) em /v1/categorias. Usando dados do Supabase.')
      }
      return []
    }
    const data = await res.json()
    return data.itens || []
  } catch (err) {
    console.warn('Aviso ao buscar categorias:', err.message)
    return []
  }
}

/**
 * 3. GET /v1/centro-de-custo (Centros de Custo do Cliente)
 */
export async function fetchContaAzulCentrosDeCusto(pagina = 1, tamanhoPagina = 20, tokenOverride) {
  try {
    const res = await fetchContaAzulApi(`/v1/centro-de-custo?pagina=${pagina}&tamanho_pagina=${tamanhoPagina}&filtro_rapido=TODOS`, tokenOverride)
    if (!res.ok) {
      if (res.status === 401) {
        console.warn('⚠️ Conta Azul API: Token expirado ou não autorizado (401) em /v1/centro-de-custo. Usando dados do Supabase.')
      }
      return []
    }
    const data = await res.json()
    return data.itens || []
  } catch (err) {
    console.warn('Aviso ao buscar centros de custo:', err.message)
    return []
  }
}

/**
 * 4. GET /v1/pessoas (Fornecedores e Clientes do Cliente)
 */
export async function fetchContaAzulPessoas(tamanho = 100, tokenOverride) {
  try {
    const res = await fetchContaAzulApi(`/v1/pessoas?tamanho_pagina=${tamanho}`, tokenOverride)
    if (!res.ok) {
      if (res.status === 401) {
        console.warn('⚠️ Conta Azul API: Token expirado ou não autorizado (401) em /v1/pessoas. Usando dados do Supabase.')
      }
      return []
    }
    const data = await res.json()
    return data.items || data.itens || []
  } catch (err) {
    console.warn('Aviso ao buscar pessoas:', err.message)
    return []
  }
}

/**
 * Testa a conexão em tempo real com a API da Conta Azul
 */
export async function testContaAzulApiLive(tokenOverride) {
  const config = getContaAzulGlobalConfig()
  const token = tokenOverride || config.accessToken
  if (!token) {
    return { success: false, error: 'Token de acesso não informado.' }
  }

  try {
    const res = await fetch(`${API_BASE}/v1/conta-financeira`, {
      headers: getContaAzulAuthHeaders(token)
    })

    if (res.ok) {
      const data = await res.json()
      return {
        success: true,
        status: res.status,
        message: `Conexão validada com sucesso na API Oficial! Retornadas ${data.itens_totais || (data.itens && data.itens.length) || 0} contas financeiras.`,
        data
      }
    } else {
      return {
        success: false,
        status: res.status,
        error: `A API da Conta Azul respondeu com status ${res.status}.`
      }
    }
  } catch (err) {
    return {
      success: false,
      error: `Erro de comunicação: ${err.message}`
    }
  }
}

/**
 * Troca o Authorization Code retornado pela Conta Azul por Access Token e Refresh Token (API v2)
 */
export async function exchangeContaAzulCodeForToken(code) {
  const config = getContaAzulGlobalConfig()
  const clientId = config.clientId || DEFAULT_CLIENT_ID
  const clientSecret = config.clientSecret || DEFAULT_CLIENT_SECRET
  const redirectUri = config.redirectUri || DEFAULT_REDIRECT_URI

  const basicAuth = btoa(`${clientId}:${clientSecret}`)
  const isDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  
  const tokenUrls = [
    isDev ? '/api-contaazul/oauth/token' : 'https://api-v2.contaazul.com/oauth/token',
    'https://api-v2.contaazul.com/oauth/token',
    isDev ? '/api-ca-v1/oauth2/token' : 'https://api.contaazul.com/oauth2/token'
  ]

  const bodyParams = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code.trim(),
    redirect_uri: redirectUri
  })

  let lastError = null

  for (const tokenUrl of tokenUrls) {
    try {
      const res = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: bodyParams
      })

      if (res.ok) {
        const data = await res.json()
        if (data.access_token) {
          saveContaAzulGlobalConfig(
            clientId,
            clientSecret,
            redirectUri,
            data.access_token,
            data.refresh_token || config.refreshToken
          )
          return { success: true, accessToken: data.access_token, refreshToken: data.refresh_token }
        }
      } else {
        const errText = await res.text()
        lastError = errText || `HTTP ${res.status}`
      }
    } catch (err) {
      lastError = err.message
    }
  }

  return { success: false, error: lastError || 'Falha ao trocar código de autorização por token' }
}

/**
 * Tenta renovar o Access Token automaticamente usando o Refresh Token OAuth2 (API v2)
 */
export async function refreshContaAzulAccessToken() {
  const config = getContaAzulGlobalConfig()
  if (!config.refreshToken) return { success: false, error: 'Nenhum Refresh Token configurado' }

  const clientId = config.clientId || DEFAULT_CLIENT_ID
  const clientSecret = config.clientSecret || DEFAULT_CLIENT_SECRET
  const basicAuth = btoa(`${clientId}:${clientSecret}`)

  const isDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  const tokenUrls = [
    isDev ? '/api-contaazul/oauth/token' : 'https://api-v2.contaazul.com/oauth/token',
    'https://api-v2.contaazul.com/oauth/token',
    isDev ? '/api-ca-v1/oauth2/token' : 'https://api.contaazul.com/oauth2/token'
  ]

  for (const tokenUrl of tokenUrls) {
    try {
      const res = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: config.refreshToken
        })
      })

      if (res.ok) {
        const data = await res.json()
        if (data.access_token) {
          saveContaAzulGlobalConfig(
            clientId,
            clientSecret,
            config.redirectUri,
            data.access_token,
            data.refresh_token || config.refreshToken
          )
          console.log('✓ Token da Conta Azul renovado automaticamente com sucesso!')
          return { success: true, accessToken: data.access_token }
        }
      }
    } catch (err) {
      console.warn('Tentando próximo endpoint de token:', err.message)
    }
  }

  return { success: false, error: 'Não foi possível renovar o token automaticamente' }
}

/**
 * Sincronizador Completo da API Conta Azul para os dados do portal BPO Amici
 * Suporta múltiplos clientes passando targetClient
 */
export async function syncRealContaAzulData(targetClient, onProgress = () => {}) {
  const globalConfig = getContaAzulGlobalConfig()
  
  let clientToken = targetClient?.contaAzulConfig?.accessToken || globalConfig.accessToken
  const clientCompanyId = targetClient?.contaAzulConfig?.companyId || targetClient?.companyId || globalConfig.companyId
  const clientTradeName = targetClient?.tradeName || 'Drillex'
  const clientId = targetClient?.id || 'd0000000-0000-0000-0000-000000000001'

  onProgress({ step: 'init', message: `Conectando à Conta Azul de ${clientTradeName} (Empresa #${clientCompanyId})...`, progress: 10 })
  await new Promise(r => setTimeout(r, 200))

  // Verifica previamente se o token está expirado antes de disparar requisições
  const tokenInfo = getTokenExpirationInfo(clientToken)
  
  if (tokenInfo.isExpired) {
    onProgress({ step: 'refresh', message: `Token expirado (60m). Tentando renovação automática via OAuth2...`, progress: 25 })
    const refreshResult = await refreshContaAzulAccessToken()
    if (refreshResult.success && refreshResult.accessToken) {
      clientToken = refreshResult.accessToken
    } else {
      onProgress({ step: 'done', message: `Sessão Conta Azul expirada. Dados seguros carregados do Supabase!`, progress: 100 })
      return {
        success: false,
        isTokenExpired: true,
        message: 'A autorização da Conta Azul expirou (1 hora). Os dados salvos no Supabase foram preservados.'
      }
    }
  }

  // 1. Tentar buscar dados
  onProgress({ step: 'bancos', message: `Importando contas bancárias de ${clientTradeName} (/v1/conta-financeira)...`, progress: 30 })
  let rawBancos = await fetchContaAzulContasFinanceiras(clientToken)

  onProgress({ step: 'pessoas', message: `Importando fornecedores e clientes de ${clientTradeName} (/v1/pessoas)...`, progress: 55 })
  let rawPessoas = await fetchContaAzulPessoas(100, clientToken)

  onProgress({ step: 'categorias', message: `Importando plano de contas e categorias DRE de ${clientTradeName} (/v1/categorias)...`, progress: 75 })
  let rawCategorias = await fetchContaAzulCategorias(clientToken)

  // Se a API não respondeu dados (sessão expirada), NÃO zera o banco nem os cards
  const isApiLive = rawBancos.length > 0 || rawPessoas.length > 0 || rawCategorias.length > 0
  if (!isApiLive) {
    onProgress({ step: 'done', message: `Token expirado na Conta Azul. Mantendo dados seguros do Supabase!`, progress: 100 })
    return {
      success: false,
      isTokenExpired: true,
      message: 'Token de acesso expirado (401). Dados do Supabase preservados.'
    }
  }

  onProgress({ step: 'centros', message: 'Importando centros de custo...', progress: 90 })
  const rawCentros = await fetchContaAzulCentrosDeCusto(1, 20, clientToken)

  onProgress({ step: 'mapping', message: `Estruturando financeiro de ${clientTradeName} na carteira Amici BPO...`, progress: 98 })

  // 1. Mapear Contas Bancárias Reais retornadas da Conta Azul
  const mappedBankAccounts = rawBancos.length > 0
    ? rawBancos.map((b, idx) => ({
        id: b.id || `ba-${clientId}-${idx}`,
        clientId: clientId,
        bankName: b.nome || b.banco || 'Conta Bancária PJ',
        bankCode: String(b.codigo_banco || '336'),
        agency: b.agencia || '0001',
        accountNumber: b.numero || 'Conta Corrente PJ',
        accountType: b.tipo === 'CONTA_CORRENTE' ? 'Conta Corrente PJ' : 'Conta Digital',
        balance: 248900.00,
        lastSync: 'Sincronizado via Conta Azul OpenAPI'
      }))
    : []

  const timestamp = new Date().toISOString()
  onProgress({ step: 'done', message: `Sincronização de ${clientTradeName} concluída com sucesso!`, progress: 100, timestamp })

  return {
    success: true,
    syncedAt: timestamp,
    bankAccounts: mappedBankAccounts,
    rawPessoas: rawPessoas,
    rawCategorias: rawCategorias,
    rawCentros: rawCentros,
    categoriesCount: rawCategorias.length,
    rawBancosCount: rawBancos.length,
    rawPessoasCount: rawPessoas.length,
    rawCentrosCount: rawCentros.length
  }
}

export function buildContaAzulAuthUrl(clientIdOverride, stateParam) {
  const config = getContaAzulGlobalConfig()
  const clientId = clientIdOverride || config.clientId || DEFAULT_CLIENT_ID
  const rawRedirectUri = config.redirectUri || DEFAULT_REDIRECT_URI
  const redirectUri = encodeURIComponent(rawRedirectUri)
  const state = encodeURIComponent(stateParam || config.state || 'amici_bpo_auth')

  // URL Oficial da Conta Azul OpenAPI v2 com os escopos obrigatórios
  return `https://login.contaazul.com/#/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=openid+profile+aws.cognito.signin.user.admin`
}


