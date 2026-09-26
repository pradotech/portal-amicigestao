/**
 * SERVIÇO DE INTEGRAÇÃO COM A API CONTA AZUL FINANCIAL OPENAPI V1 / V2
 * Especificação Oficial: https://developers.contaazul.com/docs/financial-apis-openapi/v1
 * Base URL Oficial: https://api-v2.contaazul.com
 */

import { updateContaAzulIntegrationToken } from './supabase'

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

/**
 * Decodifica com segurança o payload de um token JWT (suportando formato base64url e caracteres especiais)
 */
export function parseJwtPayload(token) {
  if (!token || typeof token !== 'string') return null
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    let base64Url = parts[1]
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    while (base64.length % 4 !== 0) {
      base64 += '='
    }
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (e) {
    try {
      const parts = token.split('.')
      return JSON.parse(atob(parts[1]))
    } catch {
      return null
    }
  }
}

export function getTokenExpirationInfo(tokenOverride) {
  const config = getContaAzulGlobalConfig()
  const token = tokenOverride || config.accessToken
  if (!token) {
    return { isConfigured: false, isExpired: true, expiresAt: null, remainingMinutes: 0 }
  }

  const payload = parseJwtPayload(token)
  if (payload && payload.exp) {
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
 * 5. GET /v1/venda/busca (Vendas e Contas a Receber da Conta Azul)
 */
export async function fetchContaAzulVendas(pagina = 1, tamanho = 100, queryParams = '', tokenOverride) {
  try {
    const q = queryParams ? `&${queryParams}` : ''
    const res = await fetchContaAzulApi(`/v1/venda/busca?pagina=${pagina}&tamanho_pagina=${tamanho}${q}`, tokenOverride)
    if (!res.ok) {
      if (res.status === 401) {
        console.warn('⚠️ Conta Azul API: Token expirado (401) em /v1/venda/busca.')
      }
      return []
    }
    const data = await res.json()
    return data.itens || data.items || []
  } catch (err) {
    console.warn('Aviso ao buscar vendas na Conta Azul:', err.message)
    return []
  }
}

/**
 * Busca abrangente e determinística de todas as Contas a Receber e Vendas da Conta Azul via OpenAPI Financeiro e Vendas
 */
export async function fetchAllRecentContaAzulVendas(tokenOverride) {
  const allReceivablesMap = new Map()

  // 1. Consultar Endpoints Oficiais do Módulo Financeiro (Contas a Receber)
  const financialReceivableEndpoints = [
    '/v1/financeiro/eventos-financeiros/contas-a-receber/buscar?pagina=1&tamanho_pagina=100',
    '/v1/financeiro/eventos-financeiros/contas-a-receber?pagina=1&tamanho_pagina=100',
    '/v1/financeiro/contas-a-receber/buscar?pagina=1&tamanho_pagina=100',
    '/v1/financeiro/contas-a-receber?pagina=1&tamanho_pagina=100',
    '/v1/financeiro/eventos-financeiros?pagina=1&tamanho_pagina=100&tipo=RECEITA'
  ]

  for (const endpoint of financialReceivableEndpoints) {
    try {
      const res = await fetchContaAzulApi(endpoint, tokenOverride)
      if (res.ok) {
        const data = await res.json()
        const list = data.itens || data.items || data.receitas || data.contas_a_receber || data.eventos || (Array.isArray(data) ? data : [])
        if (Array.isArray(list) && list.length > 0) {
          list.forEach((item, itemIdx) => {
            if (item) {
              const itemId = String(item.id || item.id_evento || item.id_parcela || item.numero || `rec_fin_${itemIdx}`)
              allReceivablesMap.set(itemId, item)
            }
          })
          console.log(`✓ Obtidos ${list.length} registros de contas a receber financeiras via ${endpoint}`)

          // Paginação completa se houver mais páginas
          const totalPages = data.total_de_paginas || data.totalPages || (data.itens_totais ? Math.ceil(data.itens_totais / 100) : 1)
          if (totalPages > 1) {
            for (let p = 2; p <= Math.min(totalPages, 15); p++) {
              try {
                const nextUrl = endpoint.replace('pagina=1', `pagina=${p}`)
                const nextRes = await fetchContaAzulApi(nextUrl, tokenOverride)
                if (nextRes.ok) {
                  const nextData = await nextRes.json()
                  const nextList = nextData.itens || nextData.items || []
                  nextList.forEach((item, nextIdx) => {
                    if (item) {
                      const itemId = String(item.id || item.id_evento || item.id_parcela || `rec_fin_p${p}_${nextIdx}`)
                      allReceivablesMap.set(itemId, item)
                    }
                  })
                }
              } catch (e) {
                console.warn(`Erro na página ${p} de recebíveis:`, e.message)
              }
            }
          }

          // Se obtivemos sucesso neste endpoint canônico, não consulta os demais para evitar duplicatas
          break
        }
      }
    } catch (err) {
      console.warn(`Tentativa em ${endpoint} falhou:`, err.message)
    }
  }

  // Se já obtivemos os títulos financeiros oficiais, retornamos diretamente
  if (allReceivablesMap.size > 0) {
    return Array.from(allReceivablesMap.values())
  }

  // 2. Fallback: Busca módulo comercial de Vendas da Conta Azul (/v1/venda/busca) de forma paginada e determinística
  try {
    const maxPages = 8
    for (let p = 1; p <= maxPages; p++) {
      const pageList = await fetchContaAzulVendas(p, 100, '', tokenOverride)
      if (Array.isArray(pageList) && pageList.length > 0) {
        pageList.forEach((v, vIdx) => {
          if (v && (v.id || v.numero)) {
            const vId = String(v.id || `venda_${v.numero || vIdx}`)
            allReceivablesMap.set(vId, v)
          }
        })
        if (pageList.length < 100) break
      } else {
        break
      }
    }
  } catch (e) {
    console.warn('Aviso ao paginar vendas comerciais:', e.message)
  }

  const allVendasList = Array.from(allReceivablesMap.values())
  if (allVendasList.length === 0) return []

  // 3. Detalhamento determinístico das vendas que necessitam de parcelas ou data de vencimento real
  const vendasParaDetalhar = allVendasList.filter(v =>
    !v.condicao_pagamento && !v.parcelas && !v.parcelas_financeiras && v.id
  )

  const detailedVendasMap = new Map()
  const CHUNK_SIZE = 20
  for (let i = 0; i < vendasParaDetalhar.length; i += CHUNK_SIZE) {
    const chunk = vendasParaDetalhar.slice(i, i + CHUNK_SIZE)
    const details = await Promise.all(
      chunk.map(async (v) => {
        try {
          const res = await fetchContaAzulApi(`/v1/venda/${v.id}`, tokenOverride)
          if (res.ok) {
            const data = await res.json()
            return { id: v.id, ...v, ...(data.venda || data), cliente: data.cliente || v.cliente }
          }
        } catch {}
        return v
      })
    )
    details.forEach(d => {
      if (d && d.id) detailedVendasMap.set(String(d.id), d)
    })
  }

  return allVendasList.map(v => (v.id && detailedVendasMap.get(String(v.id))) || v)
}

/**
 * 6. GET /v1/financeiro/eventos-financeiros/contas-a-pagar/buscar (Contas a Pagar e Despesas Oficiais)
 */
export async function fetchAllContaAzulDespesas(tokenOverride) {
  const allDespesasMap = new Map()

  // Candidatos de endpoints da API Financeira da Conta Azul para Contas a Pagar / Despesas
  const candidateEndpoints = [
    '/v1/financeiro/eventos-financeiros/contas-a-pagar/buscar?pagina=1&tamanho_pagina=100',
    '/v1/financeiro/eventos-financeiros/contas-a-pagar?pagina=1&tamanho_pagina=100',
    '/v1/financeiro/contas-a-pagar/buscar?pagina=1&tamanho_pagina=100',
    '/v1/financeiro/contas-a-pagar?pagina=1&tamanho_pagina=100',
    '/v1/financeiro/eventos-financeiros?pagina=1&tamanho_pagina=100&tipo=DESPESA'
  ]

  for (const endpoint of candidateEndpoints) {
    try {
      const res = await fetchContaAzulApi(endpoint, tokenOverride)
      if (res.ok) {
        const data = await res.json()
        const list = data.itens || data.items || data.despesas || data.contas_a_pagar || data.eventos || (Array.isArray(data) ? data : [])
        if (Array.isArray(list) && list.length > 0) {
          list.forEach((item, itemIdx) => {
            if (item) {
              const itemId = String(item.id || item.id_evento || item.id_parcela || item.numero || `desp_fin_${itemIdx}`)
              allDespesasMap.set(itemId, item)
            }
          })
          console.log(`✓ Obtidos ${list.length} registros de contas a pagar via ${endpoint}`)

          // Paginação completa se houver mais páginas
          const totalPages = data.total_de_paginas || data.totalPages || (data.itens_totais ? Math.ceil(data.itens_totais / 100) : 1)
          if (totalPages > 1) {
            for (let p = 2; p <= Math.min(totalPages, 15); p++) {
              try {
                const nextUrl = endpoint.replace('pagina=1', `pagina=${p}`)
                const nextRes = await fetchContaAzulApi(nextUrl, tokenOverride)
                if (nextRes.ok) {
                  const nextData = await nextRes.json()
                  const nextList = nextData.itens || nextData.items || []
                  nextList.forEach((item, nextIdx) => {
                    if (item) {
                      const itemId = String(item.id || item.id_evento || item.id_parcela || `desp_fin_p${p}_${nextIdx}`)
                      allDespesasMap.set(itemId, item)
                    }
                  })
                }
              } catch (e) {
                console.warn(`Erro na página ${p} de despesas:`, e.message)
              }
            }
          }

          // Se obtivemos sucesso neste endpoint canônico, não consulta os demais para evitar duplicatas
          break
        }
      }
    } catch (err) {
      console.warn(`Tentativa em ${endpoint} falhou:`, err.message)
    }
  }

  // Se já obtivemos as despesas financeiras oficiais, retornamos diretamente
  if (allDespesasMap.size > 0) {
    return Array.from(allDespesasMap.values())
  }

  // Fallback para compras comerciais de forma paginada e determinística
  try {
    for (let p = 1; p <= 5; p++) {
      const res = await fetchContaAzulApi(`/v1/compras/busca?pagina=${p}&tamanho_pagina=100`, tokenOverride)
      if (res.ok) {
        const data = await res.json()
        const list = data.itens || data.items || data.compras || []
        if (Array.isArray(list) && list.length > 0) {
          list.forEach((item, itemIdx) => {
            if (item) {
              const itemId = String(item.id || `compra_p${p}_${itemIdx}`)
              allDespesasMap.set(itemId, item)
            }
          })
          if (list.length < 100) break
        } else {
          break
        }
      } else {
        break
      }
    }
  } catch (err) {
    console.warn('Aviso ao buscar compras comerciais:', err.message)
  }

  return Array.from(allDespesasMap.values())
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
 * Suporta tanto a configuração global quanto as credenciais do cliente especificado
 */
export async function refreshContaAzulAccessToken(targetClient) {
  const config = getContaAzulGlobalConfig()
  const clientCa = targetClient?.contaAzulConfig || {}

  const refreshToken = (clientCa.refreshToken || config.refreshToken || '').trim()
  if (!refreshToken) {
    console.warn('⚠️ Nenhum Refresh Token configurado para efetuar a renovação automática.')
    return { success: false, error: 'Nenhum Refresh Token configurado' }
  }

  const clientId = (clientCa.clientId || config.clientId || DEFAULT_CLIENT_ID).trim()
  const clientSecret = (config.clientSecret || DEFAULT_CLIENT_SECRET).trim()
  const redirectUri = config.redirectUri || DEFAULT_REDIRECT_URI
  const basicAuth = btoa(`${clientId}:${clientSecret}`)

  const isDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  
  const tokenUrls = [
    isDev ? '/api-contaazul/oauth/token' : 'https://api-v2.contaazul.com/oauth/token',
    isDev ? '/api-contaazul/oauth2/token' : 'https://api-v2.contaazul.com/oauth2/token',
    isDev ? '/api-ca-v1/oauth2/token' : 'https://api.contaazul.com/oauth2/token',
    isDev ? '/api-ca-v1/oauth/token' : 'https://api.contaazul.com/oauth/token',
    'https://api-v2.contaazul.com/oauth/token',
    'https://api.contaazul.com/oauth2/token'
  ]

  let lastError = null

  for (const tokenUrl of tokenUrls) {
    try {
      const body = new URLSearchParams()
      body.append('grant_type', 'refresh_token')
      body.append('refresh_token', refreshToken)

      const res = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: body
      })

      if (res.ok) {
        const data = await res.json()
        if (data.access_token) {
          const newAccessToken = data.access_token
          const newRefreshToken = data.refresh_token || refreshToken

          // 1. Salvar no localStorage
          saveContaAzulGlobalConfig(
            clientId,
            clientSecret,
            redirectUri,
            newAccessToken,
            newRefreshToken
          )

          // 2. Persistir no Supabase para integridade
          const resolvedClientId = targetClient?.id || 'd0000000-0000-0000-0000-000000000001'
          await updateContaAzulIntegrationToken(
            resolvedClientId,
            newAccessToken,
            newRefreshToken,
            targetClient?.companyId || config.companyId,
            targetClient?.userEmail || config.userEmail
          )

          // 3. Notificar a aplicação inteira via evento customizado
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('amici_token_refreshed', {
              detail: {
                clientId: resolvedClientId,
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
              }
            }))
          }

          console.log('✓ Token da Conta Azul renovado automaticamente com sucesso!')
          return {
            success: true,
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
          }
        }
      } else {
        const errText = await res.text()
        lastError = `HTTP ${res.status}: ${errText}`
        console.warn(`Tentativa de renovação em ${tokenUrl} falhou:`, errText)
      }
    } catch (err) {
      lastError = err.message
      console.warn(`Erro de conexão ao renovar token em ${tokenUrl}:`, err.message)
    }
  }

  return { success: false, error: lastError || 'Não foi possível renovar o token automaticamente' }
}

/**
 * Verifica proativamente se o token está expirado ou prestes a expirar (<= 5 minutos)
 * e realiza a renovação automática em segundo plano
 */
export async function checkAndAutoRenewToken(targetClient) {
  const config = getContaAzulGlobalConfig()
  const token = targetClient?.contaAzulConfig?.accessToken || config.accessToken
  const refreshToken = targetClient?.contaAzulConfig?.refreshToken || config.refreshToken

  if (!refreshToken) {
    return { shouldRenew: false, reason: 'Sem refresh_token' }
  }

  const expInfo = getTokenExpirationInfo(token)
  
  // Se expirou ou resta 5 minutos ou menos, executa a renovação preventiva
  if (expInfo.isExpired || expInfo.remainingMinutes <= 5) {
    console.log(`⏳ Auto-renovação preventiva: token expira em ${expInfo.remainingMinutes} min. Renovando agora...`)
    const result = await refreshContaAzulAccessToken(targetClient)
    return {
      shouldRenew: true,
      success: result.success,
      accessToken: result.accessToken,
      error: result.error
    }
  }

  return { shouldRenew: false, remainingMinutes: expInfo.remainingMinutes }
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
    const refreshResult = await refreshContaAzulAccessToken(targetClient)
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
  onProgress({ step: 'bancos', message: `Importando contas bancárias de ${clientTradeName} (/v1/conta-financeira)...`, progress: 20 })
  let rawBancos = await fetchContaAzulContasFinanceiras(clientToken)

  onProgress({ step: 'pessoas', message: `Importando fornecedores e clientes de ${clientTradeName} (/v1/pessoas)...`, progress: 40 })
  let rawPessoas = await fetchContaAzulPessoas(100, clientToken)

  onProgress({ step: 'vendas', message: `Importando vendas e contas a receber de ${clientTradeName} (/v1/venda/busca)...`, progress: 50 })
  let rawVendas = await fetchAllRecentContaAzulVendas(clientToken)

  onProgress({ step: 'despesas', message: `Importando despesas e contas a pagar de ${clientTradeName} (/v1/financeiro)...`, progress: 70 })
  let rawDespesas = await fetchAllContaAzulDespesas(clientToken)

  onProgress({ step: 'categorias', message: `Importando plano de contas e categorias DRE de ${clientTradeName} (/v1/categorias)...`, progress: 85 })
  let rawCategorias = await fetchContaAzulCategorias(clientToken)

  // Se a API não respondeu dados (sessão expirada), NÃO zera o banco nem os cards
  const isApiLive = rawBancos.length > 0 || rawPessoas.length > 0 || rawCategorias.length > 0 || rawVendas.length > 0
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

  onProgress({ step: 'mapping', message: `Estruturando financeiro de ${clientTradeName} na carteira Amici BPO...`, progress: 95 })

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

  // 2. Mapear Vendas e Contas a Receber Reais da Conta Azul
  const todayStr = new Date().toISOString().split('T')[0]

  function extractDate(val) {
    if (!val) return null
    try {
      const s = String(val).trim()
      if (s.includes('T')) return s.split('T')[0]
      if (s.includes(' ')) return s.split(' ')[0]
      if (s.includes('/')) {
        const parts = s.split('/')
        if (parts.length === 3 && parts[2].length === 4) {
          return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
        }
      }
      const match = s.match(/\d{4}-\d{2}-\d{2}/)
      if (match) return match[0]
    } catch {
      return null
    }
    return null
  }

  // 2. Mapear Vendas e Contas a Receber Reais da Conta Azul
  const mappedReceivables = []
  if (rawVendas && rawVendas.length > 0) {
    rawVendas.forEach((r, idx) => {
      const customerName =
        r.cliente?.nome ||
        r.cliente?.razao_social ||
        r.cliente_nome ||
        r.favorecido?.nome ||
        r.favorecido ||
        r.pessoa?.nome ||
        r.pessoa_nome ||
        r.contato?.nome ||
        r.nome ||
        r.nome_cliente ||
        r.sacado?.nome ||
        r.sacado ||
        'Cliente'

      const receiptDate =
        extractDate(r.data_recebimento) ||
        extractDate(r.data_pagamento) ||
        extractDate(r.data_baixa) ||
        extractDate(r.data_liquidacao) ||
        null

      const dueDate =
        extractDate(r.data_vencimento) ||
        extractDate(r.vencimento) ||
        extractDate(r.due_date) ||
        extractDate(r.data_previsao) ||
        (receiptDate ? receiptDate : (extractDate(r.data_competencia) || extractDate(r.data_emissao) || todayStr))

      const rawAmount = Number(r.valor || r.total || r.valor_total || r.valor_bruto || r.valor_original || r.valor_liquido || 0)
      let amountRemaining = Number(r.valor_em_aberto || r.saldo || r.a_receber || r.valor_pendente || r.valor_restante || 0)
      let amountPaid = Number(r.valor_pago || r.valor_recebido || r.total_pago || r.total_recebido || 0)

      const rawStatus = String(
        r.status ||
        r.situacao?.nome ||
        r.situacao?.descricao ||
        r.situacao ||
        r.situacao_venda ||
        r.status_financeiro ||
        ''
      ).toUpperCase()

      const isReceived =
        rawStatus.includes('RECEBID') ||
        rawStatus.includes('QUITAD') ||
        rawStatus.includes('LIQUIDADO') ||
        rawStatus.includes('PAGO') ||
        rawStatus.includes('ACQUITTED') ||
        rawStatus.includes('CONCRETIZAD') ||
        rawStatus.includes('FATURAD') ||
        Boolean(receiptDate) ||
        (amountPaid > 0 && amountRemaining === 0)

      const isPartial =
        rawStatus.includes('PARCIAL') ||
        (amountPaid > 0 && amountRemaining > 0)

      const isCancelled =
        rawStatus.includes('CANCELAD') ||
        rawStatus.includes('PERDID')

      let status = 'future'
      if (isCancelled) {
        status = 'cancelled'
      } else if (isReceived) {
        status = 'received'
        amountPaid = rawAmount
        amountRemaining = 0
      } else if (isPartial) {
        status = 'partial'
        if (amountPaid === 0 && amountRemaining > 0 && rawAmount > amountRemaining) {
          amountPaid = rawAmount - amountRemaining
        } else if (amountRemaining === 0 && amountPaid > 0 && rawAmount > amountPaid) {
          amountRemaining = rawAmount - amountPaid
        }
      } else if (dueDate < todayStr || rawStatus.includes('ATRASAD') || rawStatus.includes('VENCID')) {
        status = 'overdue'
        amountRemaining = amountRemaining > 0 ? amountRemaining : rawAmount
        amountPaid = 0
      } else if (dueDate === todayStr) {
        status = 'today'
        amountRemaining = amountRemaining > 0 ? amountRemaining : rawAmount
        amountPaid = 0
      } else {
        status = 'future'
        amountRemaining = amountRemaining > 0 ? amountRemaining : rawAmount
        amountPaid = 0
      }

      // Se o item contém parcelas internas (como vendas comerciais com múltiplas parcelas)
      const rawParcelas = (r.condicao_pagamento && Array.isArray(r.condicao_pagamento.parcelas) && r.condicao_pagamento.parcelas.length > 0)
        ? r.condicao_pagamento.parcelas
        : (Array.isArray(r.parcelas) && r.parcelas.length > 0)
        ? r.parcelas
        : (Array.isArray(r.parcelas_financeiras) && r.parcelas_financeiras.length > 0)
        ? r.parcelas_financeiras
        : null

      if (rawParcelas && rawParcelas.length > 0) {
        rawParcelas.forEach((p, pIdx) => {
          const pDueDate =
            extractDate(p.data_vencimento) ||
            extractDate(p.vencimento) ||
            extractDate(p.due_date) ||
            extractDate(p.data_previsao) ||
            dueDate

          const pAmount = Number(p.valor || p.total || p.valor_parcela || (rawAmount / rawParcelas.length) || 0)
          let pAmountRemaining = Number(p.valor_em_aberto || p.saldo || p.a_receber || p.valor_pendente || 0)
          let pAmountPaid = Number(p.valor_pago || p.valor_recebido || p.total_pago || 0)

          const pStatusRaw = String((p.situacao && (p.situacao.nome || p.situacao)) || p.status || '').toUpperCase()
          const pIsReceived =
            pStatusRaw.includes('RECEBID') ||
            pStatusRaw.includes('QUITAD') ||
            pStatusRaw.includes('PAGO') ||
            pStatusRaw.includes('LIQUIDADO') ||
            Boolean(p.data_recebimento || p.data_pagamento)

          const pIsPartial = pStatusRaw.includes('PARCIAL') || (pAmountPaid > 0 && pAmountRemaining > 0)

          let pStatus = 'future'
          if (pIsReceived) {
            pStatus = 'received'
            pAmountPaid = pAmount
            pAmountRemaining = 0
          } else if (pIsPartial) {
            pStatus = 'partial'
          } else if (pDueDate < todayStr) {
            pStatus = 'overdue'
            pAmountRemaining = pAmountRemaining > 0 ? pAmountRemaining : pAmount
            pAmountPaid = 0
          } else if (pDueDate === todayStr) {
            pStatus = 'today'
            pAmountRemaining = pAmountRemaining > 0 ? pAmountRemaining : pAmount
            pAmountPaid = 0
          } else {
            pStatus = 'future'
            pAmountRemaining = pAmountRemaining > 0 ? pAmountRemaining : pAmount
            pAmountPaid = 0
          }

          const uniqueParcelaId = String(p.id || (r.id ? `${r.id}_p${pIdx + 1}` : `rec_${idx}_p${pIdx + 1}`))

          mappedReceivables.push({
            id: uniqueParcelaId,
            caReceivableId: uniqueParcelaId,
            clientId: clientId,
            customer: customerName,
            category: r.categoria?.nome || r.categoria_nome || 'Venda de Produtos & Serviços',
            description: `Venda ${r.numero || ''} - Parcela ${pIdx + 1}/${rawParcelas.length} - ${customerName}`.trim(),
            amount: pAmount,
            amountPaid: pAmountPaid,
            amountRemaining: pAmountRemaining,
            dueDate: pDueDate,
            receiptDate: extractDate(p.data_recebimento || p.data_pagamento) || receiptDate,
            status: pStatus,
            rawStatus: pStatusRaw || rawStatus,
            paymentMethod: r.forma_pagamento || 'Boleto Bancário',
            invoiceNumber: r.numero ? `Venda #${r.numero}` : 'Venda Conta Azul'
          })
        })
      } else {
        const uniqueRecId = String(r.id || `rec_${clientId}_${idx}`)
        mappedReceivables.push({
          id: uniqueRecId,
          caReceivableId: uniqueRecId,
          clientId: clientId,
          customer: customerName,
          category: r.categoria?.nome || r.categoria_nome || 'Venda de Produtos & Serviços',
          description: r.descricao || r.historico || r.resumo || (r.numero ? `Venda #${r.numero} - ${customerName}` : `Conta a Receber - ${customerName}`),
          amount: rawAmount,
          amountPaid: amountPaid,
          amountRemaining: amountRemaining,
          dueDate: dueDate,
          receiptDate: receiptDate,
          status: status,
          rawStatus: rawStatus,
          paymentMethod: r.forma_pagamento || 'Boleto Bancário',
          invoiceNumber: r.numero ? `Venda #${r.numero}` : (r.numero_documento || 'Conta Azul')
        })
      }
    })
  }

  // 3. Mapear Despesas e Contas a Pagar Reais da Conta Azul
  const mappedPayables = []
  if (rawDespesas && rawDespesas.length > 0) {
    rawDespesas.forEach((d, idx) => {
      const supplierName =
        d.fornecedor?.nome ||
        d.fornecedor_nome ||
        d.favorecido?.nome ||
        d.favorecido ||
        d.pessoa?.nome ||
        d.contato?.nome ||
        d.nome ||
        d.cliente_fornecedor?.nome ||
        'Fornecedor'

      const dueDate =
        extractDate(d.data_vencimento) ||
        extractDate(d.vencimento) ||
        extractDate(d.data) ||
        extractDate(d.data_previsao) ||
        extractDate(d.data_competencia) ||
        extractDate(d.data_emissao) ||
        todayStr

      const paymentDate =
        extractDate(d.data_pagamento) ||
        extractDate(d.data_baixa) ||
        extractDate(d.data_liquidacao) ||
        null

      const rawAmount = Number(d.valor || d.total || d.valor_bruto || d.valor_original || d.valor_liquido || 0)
      const amountRemaining = Number(d.valor_em_aberto || d.saldo || d.a_pagar || d.valor_pendente || 0)
      const amountPaid = Number(d.valor_pago || d.total_pago || 0)

      const rawStatus = String(
        d.status ||
        d.situacao?.nome ||
        d.situacao?.descricao ||
        d.situacao ||
        d.status_financeiro ||
        ''
      ).toUpperCase()

      const isPaid =
        rawStatus.includes('QUITAD') ||
        rawStatus.includes('PAGO') ||
        rawStatus.includes('LIQUIDADO') ||
        rawStatus.includes('ACQUITTED') ||
        (amountPaid > 0 && amountRemaining === 0)

      const isPartial =
        rawStatus.includes('PARCIAL') ||
        (amountPaid > 0 && amountRemaining > 0)

      let status = 'scheduled'
      if (isPaid) {
        status = 'paid'
      } else if (isPartial) {
        status = 'partial'
      } else if (dueDate < todayStr || rawStatus.includes('ATRASAD') || rawStatus.includes('VENCID')) {
        status = 'overdue'
      } else if (dueDate === todayStr) {
        status = 'today'
      } else {
        status = 'scheduled'
      }

      const uniquePayId = String(d.id || d.id_evento || `pay_${clientId}_${idx}`)

      mappedPayables.push({
        id: uniquePayId,
        caPayableId: uniquePayId,
        clientId: clientId,
        supplier: supplierName,
        category: d.categoria?.nome || d.categoria_nome || d.categoria || 'Despesas Operacionais',
        description: d.descricao || d.historico || d.resumo || d.numero_documento || `Pagamento - ${supplierName}`,
        amount: rawAmount,
        amountPaid: isPaid ? rawAmount : amountPaid,
        amountRemaining: (amountRemaining > 0) ? amountRemaining : (isPaid ? 0 : rawAmount),
        dueDate: dueDate,
        paymentDate: paymentDate,
        status: status,
        rawStatus: rawStatus,
        barcode: d.codigo_barras || d.linha_digitavel || d.codigo_de_barras || '',
        costCenter: d.centro_custo?.nome || d.centro_de_custo?.nome || ''
      })
    })
  }

  // Ordena de forma determinística por data de vencimento
  mappedReceivables.sort((a, b) => {
    if (!a.dueDate) return 1
    if (!b.dueDate) return -1
    return a.dueDate.localeCompare(b.dueDate)
  })

  mappedPayables.sort((a, b) => {
    if (!a.dueDate) return 1
    if (!b.dueDate) return -1
    return a.dueDate.localeCompare(b.dueDate)
  })

  const timestamp = new Date().toISOString()
  onProgress({ step: 'done', message: `Sincronização de ${clientTradeName} concluída com sucesso!`, progress: 100, timestamp })

  return {
    success: true,
    syncedAt: timestamp,
    bankAccounts: mappedBankAccounts,
    rawPessoas: rawPessoas,
    rawCategorias: rawCategorias,
    rawCentros: rawCentros,
    rawVendas: rawVendas,
    rawDespesas: rawDespesas,
    mappedReceivables: mappedReceivables,
    mappedPayables: mappedPayables,
    categoriesCount: rawCategorias.length,
    rawBancosCount: rawBancos.length,
    rawPessoasCount: rawPessoas.length,
    rawCentrosCount: rawCentros.length,
    rawVendasCount: mappedReceivables.length,
    rawDespesasCount: mappedPayables.length
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


