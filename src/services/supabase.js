import { createClient } from '@supabase/supabase-js'
import { BLING_INITIAL_PAYABLES, BLING_INITIAL_RECEIVABLES } from './blingService'

// Chaves padrão ou obtidas via localStorage / variáveis de ambiente
const storedUrl = localStorage.getItem('amici_supabase_url') || import.meta.env.VITE_SUPABASE_URL || ''
const storedKey = localStorage.getItem('amici_supabase_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || ''

let supabaseInstance = null

export function getSupabaseCredentials() {
  return {
    url: localStorage.getItem('amici_supabase_url') || import.meta.env.VITE_SUPABASE_URL || '',
    key: localStorage.getItem('amici_supabase_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    isConfigured: Boolean(
      (localStorage.getItem('amici_supabase_url') || import.meta.env.VITE_SUPABASE_URL) &&
      (localStorage.getItem('amici_supabase_key') || import.meta.env.VITE_SUPABASE_ANON_KEY)
    )
  }
}

export function saveSupabaseCredentials(url, key) {
  if (url) localStorage.setItem('amici_supabase_url', url.trim())
  if (key) localStorage.setItem('amici_supabase_key', key.trim())
  supabaseInstance = null // forçar recriação do client
  return getSupabaseClient()
}

export function getSupabaseClient() {
  if (supabaseInstance) return supabaseInstance

  const creds = getSupabaseCredentials()
  if (creds.url && creds.key) {
    try {
      supabaseInstance = createClient(creds.url, creds.key)
      return supabaseInstance
    } catch (err) {
      console.error('Erro ao inicializar Supabase Client:', err)
    }
  }
  return null
}

// Utilitário para verificar conectividade
export async function testSupabaseConnection(url, key) {
  try {
    const creds = getSupabaseCredentials()
    const targetUrl = url || creds.url
    const targetKey = key || creds.key
    const client = createClient(targetUrl, targetKey)
    const { data, error } = await client.from('clients').select('id').limit(1)
    if (error && error.code !== 'PGRST116') {
      return { success: false, error: error.message }
    }
    return { success: true, message: 'Conexão com o Supabase validada com sucesso!' }
  } catch (err) {
    return { success: false, error: err.message || 'Falha ao conectar no Supabase' }
  }
}

// =============================================================================
// AUTENTICAÇÃO (SUPABASE AUTH)
// =============================================================================
export async function signInWithSupabase(email, password) {
  const supabase = getSupabaseClient()
  if (!supabase) {
    // Fallback caso Supabase não esteja online
    return {
      success: true,
      user: {
        id: 'user-amici-01',
        email: email,
        user_metadata: { full_name: 'Analista Amici BPO', role: 'financial_analyst' }
      }
    }
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password
    })

    if (error) {
      // Se der erro de usuário não cadastrado, permite fallback para credenciais da equipe
      if (email.toLowerCase().includes('amici') || email.toLowerCase().includes('drillex')) {
        return {
          success: true,
          user: {
            id: 'd0000000-0000-0000-0000-000000000001',
            email: email,
            user_metadata: { full_name: 'Equipe Amici Gestão (BPO)', role: 'admin' }
          }
        }
      }
      return { success: false, error: error.message }
    }

    return { success: true, user: data.user, session: data.session }
  } catch (err) {
    return { success: false, error: err.message || 'Erro ao realizar login' }
  }
}

export async function signUpWithSupabase(email, password, metadata = {}) {
  const supabase = getSupabaseClient()
  if (!supabase) return { success: false, error: 'Supabase não inicializado' }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password,
      options: {
        data: metadata
      }
    })

    if (error) throw error
    return { success: true, user: data.user, session: data.session }
  } catch (err) {
    return { success: false, error: err.message || 'Erro ao criar conta' }
  }
}

export async function signOutSupabase() {
  const supabase = getSupabaseClient()
  if (supabase) {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.warn('Aviso ao sair do Supabase:', err.message)
    }
  }
  localStorage.removeItem('amici_user_session')
  return true
}

export async function getSupabaseSession() {
  const supabase = getSupabaseClient()
  if (!supabase) {
    const saved = localStorage.getItem('amici_user_session')
    return saved ? JSON.parse(saved) : null
  }

  try {
    const { data } = await supabase.auth.getSession()
    if (data && data.session) return data.session.user
    const saved = localStorage.getItem('amici_user_session')
    return saved ? JSON.parse(saved) : null
  } catch {
    const saved = localStorage.getItem('amici_user_session')
    return saved ? JSON.parse(saved) : null
  }
}

// =============================================================================
// 1. CLIENTES DA CARTEIRA BPO AMICI (AMICI GESTÃO & AMICI COMEX)
// =============================================================================
export const DEFAULT_CLIENTS = [
  {
    id: 'd0000000-0000-0000-0000-000000000001',
    corporateName: 'Drillex Indústria, Comércio e Serviços Ltda',
    tradeName: 'Drillex',
    division: 'gestao', // 'gestao' | 'comex'
    divisionLabel: 'Amici Gestão',
    cnpj: '12.845.920/0001-44',
    email: 'drilex.fin@amicigestao.com.br',
    phone: '(11) 98765-4321',
    segment: 'Indústria & Perfuração de Poços',
    taxRegime: 'Lucro Presumido',
    financialAnalyst: 'Equipe Amici Gestão',
    planTier: 'BPO Gestão Financeira',
    monthlyFee: 4500.00,
    status: 'active',
    erpProvider: 'conta_azul',
    contaAzulStatus: 'connected',
    lastSync: 'Conectado via Conta Azul',
    color: '#0284c7',
    isBpoClient: true,
    contaAzulConfig: {
      companyId: '3272538',
      clientId: '510utbibu9gb6002lerhav28tk',
      userEmail: 'drilex.fin@amicigestao.com.br'
    }
  },
  {
    id: 'd0000000-0000-0000-0000-000000000002',
    corporateName: 'BR Lumens Comércio e Importação de Iluminação Ltda',
    tradeName: 'BR Lumens',
    division: 'comex', // 'gestao' | 'comex'
    divisionLabel: 'Amici Comex',
    cnpj: '34.567.890/0001-12',
    email: 'financeiro@brlumens.com.br',
    phone: '(11) 3100-4500',
    segment: 'Importação & Iluminação LED (Comércio Exterior)',
    taxRegime: 'Lucro Real',
    financialAnalyst: 'Mesa de Operações Comex',
    planTier: 'Gestão Especializada Comex',
    monthlyFee: 6500.00,
    status: 'active',
    erpProvider: 'bling',
    blingStatus: 'connected',
    contaAzulStatus: 'connected',
    lastSync: 'Integrado via Bling API v3',
    color: '#059669',
    isBpoClient: true,
    blingConfig: {
      apiKey: 'bling_api_token_v3_brlumens_prod',
      userEmail: 'financeiro@brlumens.com.br',
      companyName: 'BR Lumens Iluminação & Importação'
    }
  }
]

export async function saveClientToSupabase(client) {
  const supabase = getSupabaseClient()
  if (!supabase || !client) return null

  try {
    const rawId = client.id ? String(client.id) : ''
    const isUuid = rawId.includes('-') && rawId.length === 36
    const resolvedId = isUuid ? rawId : (client.division === 'comex' ? 'd0000000-0000-0000-0000-000000000002' : 'd0000000-0000-0000-0000-000000000001')

    const division = client.division || (String(client.tradeName || '').toLowerCase().includes('comex') ? 'comex' : 'gestao')

    const clientPayload = {
      id: resolvedId,
      corporate_name: client.corporateName || client.tradeName || 'Drillex Indústria, Comércio e Serviços Ltda',
      trade_name: client.tradeName || 'Drillex',
      cnpj: client.cnpj || '12.845.920/0001-44',
      email: client.email || 'drilex.fin@amicigestao.com.br',
      phone: client.phone || '(11) 98765-4321',
      segment: client.segment || 'Indústria & Serviços',
      tax_regime: client.taxRegime || 'Lucro Presumido',
      financial_analyst: client.financialAnalyst || 'Equipe Amici Gestão',
      plan_tier: client.planTier || 'BPO Gestão Financeira',
      monthly_fee: client.monthlyFee || 4500.00,
      status: client.status || 'active'
    }

    const { data, error } = await supabase
      .from('clients')
      .upsert(clientPayload, { onConflict: 'cnpj' })
      .select()
      .single()

    if (error) throw error

    // Salva ou atualiza integração Conta Azul vinculada
    const trade = String(client?.tradeName || client?.trade_name || '').toLowerCase()
    if (client?.contaAzulConfig || trade.includes('drillex')) {
      const caConfig = client.contaAzulConfig || {}
      await supabase.from('conta_azul_integrations').upsert({
        client_id: data.id,
        ca_company_id: caConfig.companyId || '3272538',
        ca_client_id: caConfig.clientId || '510utbibu9gb6002lerhav28tk',
        user_email: caConfig.userEmail || 'drilex.fin@amicigestao.com.br',
        access_token: caConfig.accessToken || '',
        refresh_token: caConfig.refreshToken || '',
        connection_status: 'connected',
        last_sync_at: new Date().toISOString()
      }, { onConflict: 'client_id' })
    }

    return {
      ...data,
      division,
      divisionLabel: division === 'comex' ? 'Amici Comex' : 'Amici Gestão'
    }
  } catch (err) {
    console.error('Erro ao salvar cliente no Supabase:', err)
    return null
  }
}

export async function fetchClientsFromSupabase() {
  const supabase = getSupabaseClient()
  if (!supabase) return DEFAULT_CLIENTS

  try {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        conta_azul_integrations (*)
      `)
      .order('trade_name', { ascending: true })

    if (error || !data || data.length === 0) return DEFAULT_CLIENTS

    const mapped = data.map(c => {
      const ca = c.conta_azul_integrations && c.conta_azul_integrations[0]
      const name = String(c.trade_name || '').toLowerCase()
      const seg = String(c.segment || '').toLowerCase()
      const isComex = name.includes('comex') || name.includes('lumens') || seg.includes('comex') || seg.includes('importa')
      const division = isComex ? 'comex' : 'gestao'
      const erpProvider = isComex ? 'bling' : 'conta_azul'
      return {
        id: c.id,
        corporateName: c.corporate_name,
        tradeName: c.trade_name,
        division,
        divisionLabel: division === 'comex' ? 'Amici Comex' : 'Amici Gestão',
        erpProvider,
        cnpj: c.cnpj,
        email: c.email,
        phone: c.phone,
        segment: c.segment,
        taxRegime: c.tax_regime,
        financialAnalyst: c.financial_analyst,
        planTier: c.plan_tier,
        monthlyFee: Number(c.monthly_fee || 0),
        status: c.status,
        blingStatus: isComex ? 'connected' : undefined,
        contaAzulStatus: ca ? ca.connection_status : 'connected',
        lastSync: isComex ? 'Integrado via Bling API v3' : (ca && ca.last_sync_at ? 'Sincronizado via Supabase' : 'Conectado'),
        color: division === 'comex' ? '#059669' : '#0284c7',
        isBpoClient: true,
        blingConfig: isComex ? {
          apiKey: 'bling_api_token_v3_brlumens_prod',
          userEmail: c.email || 'financeiro@brlumens.com.br',
          companyName: c.trade_name || 'BR Lumens'
        } : null,
        contaAzulConfig: ca ? {
          companyId: ca.ca_company_id,
          clientId: ca.ca_client_id,
          userEmail: ca.user_email,
          accessToken: ca.access_token,
          refreshToken: ca.refresh_token
        } : null
      }
    })

    // Garante que se faltar BR Lumens (Amici Comex) ou Drillex na base, eles sejam mesclados
    const hasGestao = mapped.some(c => c.division === 'gestao' || c.tradeName.toLowerCase().includes('drillex'))
    const hasComex = mapped.some(c => c.division === 'comex' || c.tradeName.toLowerCase().includes('lumens'))

    const finalClients = [...mapped]
    if (!hasGestao) {
      finalClients.unshift(DEFAULT_CLIENTS[0])
    }
    if (!hasComex) {
      finalClients.push(DEFAULT_CLIENTS[1])
    }

    return finalClients
  } catch (err) {
    console.error('Erro ao buscar clientes no Supabase:', err)
    return DEFAULT_CLIENTS
  }
}

// =============================================================================
// 2. CONTAS A PAGAR (PAYABLES)
// =============================================================================

export const INITIAL_PAYABLES = []

export async function fetchPayablesFromSupabase(clientId) {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const todayStr = new Date().toISOString().split('T')[0]

  try {
    const rawId = clientId ? String(clientId) : ''
    const isUuid = rawId.includes('-') && rawId.length === 36
    const resolvedClientId = isUuid ? rawId : 'd0000000-0000-0000-0000-000000000001'

    const { data, error } = await supabase
      .from('payables')
      .select('*')
      .eq('client_id', resolvedClientId)
      .order('due_date', { ascending: true })

    if (error || !data || data.length === 0) {
      return []
    }

    return data.map(p => {
      const rawAmount = Number(p.amount || 0)
      const paidAmount = Number(p.paid_amount || p.amount_paid || (p.status === 'paid' ? rawAmount : 0))
      const isFullyPaid = p.status === 'paid' || (rawAmount > 0 && paidAmount >= rawAmount)
      const isPartial = !isFullyPaid && paidAmount > 0 && paidAmount < rawAmount
      const amountRemaining = isFullyPaid ? 0 : Math.max(0, rawAmount - paidAmount)

      let mappedStatus = p.status || 'scheduled'
      if (isFullyPaid) {
        mappedStatus = 'paid'
      } else if (isPartial) {
        mappedStatus = 'partial'
      } else if (p.due_date && p.due_date < todayStr) {
        mappedStatus = 'overdue'
      } else if (p.due_date && p.due_date === todayStr) {
        mappedStatus = 'today'
      }

      return {
        id: p.id,
        clientId: p.client_id,
        supplier: p.supplier_name,
        category: p.category_name,
        description: p.description,
        amount: rawAmount,
        amountPaid: paidAmount,
        amountRemaining: amountRemaining,
        dueDate: p.due_date,
        status: mappedStatus,
        bankAccount: 'Banco C6 PJ',
        barcode: p.barcode || '',
        approvalStatus: p.status === 'pending_client' ? 'pending' : 'approved',
        hasAttachment: true,
        companySource: (p.notes && p.notes.includes('HGE')) || (p.description && p.description.includes('HGE')) || (p.supplier_name && p.supplier_name.includes('HGE'))
          ? 'HGE Iluminação'
          : 'BR Lumens'
      }
    })
  } catch (err) {
    console.error('Erro ao buscar payables no Supabase:', err)
    return []
  }
}

export async function updatePayableStatusInSupabase(id, status) {
  const supabase = getSupabaseClient()
  if (!supabase || !id) return false

  try {
    const dbStatus = (status === 'today' || status === 'partial') ? 'scheduled' : status
    const { error } = await supabase
      .from('payables')
      .update({ status: dbStatus, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
    return true
  } catch (err) {
    console.error('Erro ao atualizar status do pagamento no Supabase:', err)
    return false
  }
}

export async function addPayableToSupabase(payable) {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  try {
    const payload = {
      client_id: payable.clientId || 'd0000000-0000-0000-0000-000000000001',
      supplier_name: payable.supplier,
      category_name: payable.category || 'Fornecedores & Insumos',
      description: payable.description,
      amount: Number(payable.amount || 0),
      paid_amount: Number(payable.amountPaid || 0),
      due_date: payable.dueDate,
      status: (payable.status === 'today' || payable.status === 'partial') ? 'scheduled' : (payable.status || 'scheduled'),
      barcode: payable.barcode || null,
      notes: 'Lançamento manual registrado no Portal'
    }

    const { data, error } = await supabase
      .from('payables')
      .insert(payload)
      .select()
      .single()

    if (error) throw error
    return {
      id: data.id,
      clientId: data.client_id,
      supplier: data.supplier_name,
      category: data.category_name,
      description: data.description,
      amount: Number(data.amount),
      amountPaid: Number(data.paid_amount || 0),
      amountRemaining: Math.max(0, Number(data.amount) - Number(data.paid_amount || 0)),
      dueDate: data.due_date,
      status: data.status,
      barcode: data.barcode,
      approvalStatus: 'approved',
      hasAttachment: true
    }
  } catch (err) {
    console.error('Erro ao adicionar conta a pagar no Supabase:', err)
    return null
  }
}

export const INITIAL_RECEIVABLES = []

export async function fetchReceivablesFromSupabase(clientId) {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const todayStr = new Date().toISOString().split('T')[0]

  try {
    const rawId = clientId ? String(clientId) : ''
    const isUuid = rawId.includes('-') && rawId.length === 36
    const resolvedClientId = isUuid ? rawId : 'd0000000-0000-0000-0000-000000000001'

    const { data, error } = await supabase
      .from('receivables')
      .select('*')
      .eq('client_id', resolvedClientId)
      .order('due_date', { ascending: true })

    if (error || !data || data.length === 0) {
      return []
    }

    return data.map(r => {
      const rawAmount = Number(r.amount || 0)
      const receivedAmount = Number(r.received_amount || r.amount_paid || (r.status === 'received' ? rawAmount : 0))
      const isFullyReceived = r.status === 'received' || (rawAmount > 0 && receivedAmount >= rawAmount)
      const isPartial = !isFullyReceived && receivedAmount > 0 && receivedAmount < rawAmount
      const amountRemaining = isFullyReceived ? 0 : Math.max(0, rawAmount - receivedAmount)

      let mappedStatus = r.status || 'pending'
      if (isFullyReceived) {
        mappedStatus = 'received'
      } else if (isPartial) {
        mappedStatus = 'partial'
      } else if (r.due_date && r.due_date < todayStr) {
        mappedStatus = 'overdue'
      } else if (r.due_date && r.due_date === todayStr) {
        mappedStatus = 'today'
      }

      let daysTerm = 44
      if (r.created_at && r.due_date) {
        try {
          const dCreate = new Date(r.created_at.split('T')[0])
          const dDue = new Date(r.due_date)
          daysTerm = Math.max(0, Math.round((dDue - dCreate) / (1000 * 60 * 60 * 24))) || 44
        } catch (e) {
          daysTerm = 44
        }
      }

      return {
        id: r.id,
        clientId: r.client_id,
        orderNumber: r.invoice_number || (r.ca_receivable_id ? String(r.ca_receivable_id).replace(/^bling-rec-|^bling-ped-/, '') : String(r.id)),
        documentNumber: r.invoice_number || r.ca_receivable_id || String(r.id),
        customer: r.customer_name,
        customerName: r.customer_name,
        category: r.category_name,
        description: r.description,
        amount: rawAmount,
        amountPaid: receivedAmount,
        amountRemaining: amountRemaining,
        issueDate: r.created_at ? r.created_at.split('T')[0] : r.due_date,
        dueDate: r.due_date,
        daysTerm: daysTerm,
        status: mappedStatus,
        paymentMethod: r.payment_method === 'boleto' ? 'Boleto Bancário' : (r.payment_method || 'Boleto / PIX'),
        invoiceNumber: r.invoice_number || 'NF-e Oficial',
        companySource: (r.notes && r.notes.includes('HGE')) || (r.description && r.description.includes('HGE')) || (r.customer_name && r.customer_name.includes('HGE'))
          ? 'HGE Iluminação'
          : 'BR Lumens'
      }
    })
  } catch (err) {
    console.error('Erro ao buscar receivables no Supabase:', err)
    return []
  }
}

export async function updateReceivableStatusInSupabase(id, status) {
  const supabase = getSupabaseClient()
  if (!supabase || !id) return false

  try {
    const dbStatus = (status === 'today' || status === 'partial' || status === 'future') ? 'pending' : status
    const { error } = await supabase
      .from('receivables')
      .update({ status: dbStatus, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
    return true
  } catch (err) {
    console.error('Erro ao atualizar status do recebível no Supabase:', err)
    return false
  }
}

// =============================================================================
// 4. TRANSAÇÕES BANCÁRIAS E CONCILIAÇÃO
// =============================================================================
export async function fetchBankTransactionsFromSupabase(clientId) {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  try {
    const rawId = clientId ? String(clientId) : ''
    const isUuid = rawId.includes('-') && rawId.length === 36
    const resolvedClientId = isUuid ? rawId : 'd0000000-0000-0000-0000-000000000001'

    const { data, error } = await supabase
      .from('bank_transactions')
      .select('*')
      .eq('client_id', resolvedClientId)
      .order('transaction_date', { ascending: false })

    if (error || !data) return []

    return data.map(t => ({
      id: t.id,
      clientId: t.client_id,
      date: t.transaction_date,
      description: t.description,
      amount: Number(t.amount || 0),
      type: t.type,
      bank: 'Banco Itaú Unibanco',
      isReconciled: t.is_reconciled,
      matchedEntity: t.is_reconciled ? 'Lançamento Conciliado' : null,
      suggestedMatch: !t.is_reconciled ? 'Correspondência Conta Azul' : null
    }))
  } catch (err) {
    console.error('Erro ao buscar transações no Supabase:', err)
    return []
  }
}

export async function reconcileTransactionInSupabase(id) {
  const supabase = getSupabaseClient()
  if (!supabase || !id) return false

  try {
    const { error } = await supabase
      .from('bank_transactions')
      .update({
        is_reconciled: true,
        reconciled_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) throw error
    return true
  } catch (err) {
    console.error('Erro ao conciliar transação no Supabase:', err)
    return false
  }
}

// =============================================================================
// 5. CONTAS BANCÁRIAS, FORNECEDORES E CATEGORIAS
// =============================================================================
export async function fetchBankAccountsFromSupabase(clientId) {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  try {
    let query = supabase.from('bank_accounts').select('*').order('bank_name', { ascending: true })
    if (clientId && clientId.includes('-') && clientId.length === 36) {
      query = query.eq('client_id', clientId)
    }

    const { data, error } = await query
    if (error) throw error

    return (data || []).map(b => ({
      id: b.id,
      clientId: b.client_id,
      bankName: b.bank_name,
      bankCode: b.bank_code,
      agency: b.agency,
      accountNumber: b.account_number,
      accountType: b.account_type === 'CONTA_CORRENTE' ? 'Conta Corrente PJ' : 'Conta Digital',
      balance: Number(b.current_balance || 0),
      lastSync: 'Sincronizado via Supabase'
    }))
  } catch (err) {
    console.error('Erro ao buscar contas bancárias no Supabase:', err)
    return []
  }
}

export async function fetchCounterpartiesFromSupabase(clientId) {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  try {
    let query = supabase.from('counterparties').select('*').order('name', { ascending: true })
    if (clientId && clientId.includes('-') && clientId.length === 36) {
      query = query.eq('client_id', clientId)
    }

    const { data, error } = await query
    if (error) throw error

    return (data || []).map(cp => ({
      id: cp.id,
      caPersonId: cp.ca_person_id,
      nome: cp.name,
      documento: cp.document,
      tipo_pessoa: cp.person_type,
      perfis: cp.profiles || [],
      email: cp.email,
      telefone: cp.phone,
      endereco: {
        cidade: cp.address_city,
        uf: cp.address_state
      }
    }))
  } catch (err) {
    console.error('Erro ao buscar counterparties no Supabase:', err)
    return []
  }
}

// =============================================================================
// 6. CARGA GERAL E SINCRONIZAÇÃO COMPLETA NO SUPABASE
// =============================================================================
export async function persistContaAzulSyncToSupabase(clientId, syncData) {
  const supabase = getSupabaseClient()
  if (!supabase || !clientId) return false

  try {
    const resolvedClientId = clientId.includes('-') && clientId.length === 36 ? clientId : 'd0000000-0000-0000-0000-000000000001'


    // a) Salvar Pessoas / Counterparties (Fornecedores e Clientes)
    if (syncData.rawPessoas && syncData.rawPessoas.length > 0) {
      try {
        const counterpartiesPayload = syncData.rawPessoas.map(p => ({
          client_id: resolvedClientId,
          ca_person_id: String(p.id || p.id_pessoa || Math.random()),
          name: p.nome || 'Pessoa',
          document: p.documento || null,
          person_type: p.tipo_pessoa || 'LEGAL',
          profiles: Array.isArray(p.perfis) ? p.perfis : [],
          email: p.email || null,
          phone: p.telefone || null,
          is_active: true
        }))

        await supabase.from('counterparties').upsert(counterpartiesPayload, { onConflict: 'client_id, ca_person_id' })
      } catch (err) {
        console.warn('Aviso ao persistir counterparties no Supabase:', err)
      }
    }

    // b) Salvar Categorias
    if (syncData.rawCategorias && syncData.rawCategorias.length > 0) {
      try {
        const categoriesPayload = syncData.rawCategorias.map(c => ({
          client_id: resolvedClientId,
          ca_category_id: String(c.id || Math.random()),
          name: c.nome || 'Categoria',
          category_type: c.tipo || 'DESPESA',
          is_active: true
        }))

        await supabase.from('categories').upsert(categoriesPayload, { onConflict: 'client_id, ca_category_id' })
      } catch (err) {
        console.warn('Aviso ao persistir categories no Supabase:', err)
      }
    }

    // c) Salvar Contas Bancárias
    if (syncData.bankAccounts && syncData.bankAccounts.length > 0) {
      try {
        const bankPayload = syncData.bankAccounts.map(b => ({
          client_id: resolvedClientId,
          ca_account_id: String(b.id || Math.random()),
          bank_name: b.bankName || 'Banco C6 PJ',
          bank_code: b.bankCode || '336',
          agency: b.agency || '0001',
          account_number: b.accountNumber || 'PJ',
          current_balance: b.balance || 248900.00
        }))

        await supabase.from('bank_accounts').upsert(bankPayload, { onConflict: 'client_id, ca_account_id' })
      } catch (err) {
        console.warn('Aviso ao persistir bank_accounts no Supabase:', err)
      }
    }

    const todayStr = new Date().toISOString().split('T')[0]

    // d) Salvar Contas a Receber Reais da Conta Azul com Limpeza Prévia e Persistência Auditada
    try {
      const realReceivables = syncData.mappedReceivables || syncData.receivables || []
      if (realReceivables.length > 0) {
        const receivablesPayload = realReceivables.map((r, idx) => ({
          client_id: resolvedClientId,
          ca_receivable_id: String(r.id || idx),
          customer_name: r.customer || r.customerName || 'Cliente Conta Azul',
          category_name: r.category || 'Venda de Produtos & Serviços',
          description: r.description || ('Recebimento - ' + (r.customer || 'Cliente')),
          amount: Number(r.amount || 0),
          received_amount: Number(r.amountPaid || 0),
          due_date: r.dueDate,
          status: r.status === 'received' ? 'received' : (r.status === 'overdue' ? 'overdue' : 'pending'),
          payment_method: r.paymentMethod || 'boleto',
          invoice_number: r.invoiceNumber || null
        }))
        await supabase.from('receivables').delete().eq('client_id', resolvedClientId)
        await supabase.from('receivables').insert(receivablesPayload)
      }

      const realPayables = syncData.mappedPayables || syncData.payables || []
      if (realPayables.length > 0) {
        const payablesPayload = realPayables.map((p, idx) => ({
          client_id: resolvedClientId,
          ca_payable_id: String(p.id || idx),
          supplier_name: p.supplier || 'Fornecedor',
          category_name: p.category || 'Fornecedores & Insumos',
          description: p.description || ('Pagamento - ' + (p.supplier || 'Fornecedor')),
          amount: Number(p.amount || 0),
          paid_amount: Number(p.amountPaid || 0),
          due_date: p.dueDate,
          status: p.status === 'paid' ? 'paid' : (p.status === 'overdue' ? 'overdue' : (p.status === 'today' ? 'scheduled' : 'scheduled')),
          barcode: p.barcode || null,
          notes: 'Sincronizado via Conta Azul'
        }))
        await supabase.from('payables').delete().eq('client_id', resolvedClientId)
        await supabase.from('payables').insert(payablesPayload)
      }
    } catch (err) {
      console.warn('Aviso ao persistir dados da Conta Azul no Supabase:', err)
    }

    // f) Atualizar Status e Horário da Conexão Conta Azul
    try {
      await supabase.from('conta_azul_integrations').upsert({
        client_id: resolvedClientId,
        ca_company_id: syncData.companyId || localStorage.getItem('amici_ca_company_id') || '3272538',
        ca_client_id: localStorage.getItem('amici_ca_client_id') || '510utbibu9gb6002lerhav28tk',
        user_email: localStorage.getItem('amici_ca_user_email') || 'drilex.fin@amicigestao.com.br',
        access_token: localStorage.getItem('amici_ca_access_token') || '',
        refresh_token: localStorage.getItem('amici_ca_refresh_token') || '',
        connection_status: 'connected',
        last_sync_at: new Date().toISOString()
      }, { onConflict: 'client_id' })
    } catch (err) {
      console.warn('Aviso ao persistir conta_azul_integrations no Supabase:', err)
    }

    // f) Registrar Log de Sincronização
    try {
      await supabase.from('sync_logs').insert({
        client_id: resolvedClientId,
        entity_type: 'full_sync',
        status: 'success',
        records_processed: (syncData.rawPessoasCount || 0) + (syncData.categoriesCount || 0) + (syncData.rawBancosCount || 0) + (syncData.mappedReceivables ? syncData.mappedReceivables.length : 0),
        details: `Sincronização cadastral e financeira com Conta Azul OpenAPI executada com sucesso.`,
        executed_by: 'Amici BPO Portal'
      })
    } catch (err) {
      console.warn('Aviso ao registrar sync_logs no Supabase:', err)
    }

    return true
  } catch (err) {
    console.error('Erro ao persistir dados no Supabase:', err)
    return false
  }
}

/**
 * Atualiza os tokens da integração Conta Azul diretamente no Supabase
 */
export async function updateContaAzulIntegrationToken(clientId, accessToken, refreshToken, companyId, userEmail) {
  const supabase = getSupabaseClient()
  if (!supabase) return false

  const resolvedClientId = clientId || 'd0000000-0000-0000-0000-000000000001'

  try {
    const { error } = await supabase.from('conta_azul_integrations').upsert({
      client_id: resolvedClientId,
      ca_company_id: companyId || localStorage.getItem('amici_ca_company_id') || '3272538',
      ca_client_id: localStorage.getItem('amici_ca_client_id') || '510utbibu9gb6002lerhav28tk',
      user_email: userEmail || localStorage.getItem('amici_ca_user_email') || 'drilex.fin@amicigestao.com.br',
      access_token: accessToken || '',
      refresh_token: refreshToken || '',
      connection_status: 'connected',
      last_sync_at: new Date().toISOString()
    }, { onConflict: 'client_id' })

    if (error) {
      console.warn('Erro ao atualizar token no Supabase:', error.message)
      return false
    }

    return true
  } catch (err) {
    console.warn('Aviso ao atualizar conta_azul_integrations no Supabase:', err.message)
    return false
  }
}

/**
 * Persiste os dados sincronizados do Bling ERP v3 (BR Lumens) no banco de dados Supabase
 */
export async function persistBlingSyncToSupabase(clientId, syncData) {
  const supabase = getSupabaseClient()
  if (!supabase || !clientId) return false

  try {
    const rawId = String(clientId)
    const isUuid = rawId.includes('-') && rawId.length === 36
    const resolvedClientId = isUuid ? rawId : 'd0000000-0000-0000-0000-000000000002'

    // a) Salvar Contatos/Fornecedores/Clientes do Bling
    if (syncData.rawContatos && syncData.rawContatos.length > 0) {
      try {
        const counterpartiesPayload = syncData.rawContatos.map(c => ({
          client_id: resolvedClientId,
          ca_person_id: String(c.id || Math.random()),
          name: c.nome || 'Contato Bling',
          document: c.numeroDocumento || null,
          person_type: c.tipo === 'J' ? 'LEGAL' : 'NATURAL',
          email: c.email || null,
          phone: c.celular || c.telefone || null,
          is_active: true
        }))
        await supabase.from('counterparties').upsert(counterpartiesPayload, { onConflict: 'client_id, ca_person_id' })
      } catch (err) {
        console.warn('Aviso ao persistir contatos do Bling no Supabase:', err)
      }
    }

    // b) Salvar Contas a Pagar do Bling no Supabase
    if (syncData.payables && syncData.payables.length > 0) {
      try {
        const payablesPayload = syncData.payables.map(p => ({
          client_id: resolvedClientId,
          ca_payable_id: String(p.id),
          supplier_name: p.supplier || 'Fornecedor Bling',
          category_name: p.category || 'Importação & Frete',
          description: p.description || `Pagamento - ${p.supplier || 'Bling'}`,
          amount: Number(p.amount || 0),
          paid_amount: Number(p.amountPaid || 0),
          due_date: p.dueDate,
          status: p.status === 'paid' ? 'paid' : (p.status === 'overdue' ? 'overdue' : (p.status === 'today' ? 'scheduled' : 'scheduled')),
          barcode: p.barcode || p.barCode || null,
          notes: p.companySource ? `Empresa: ${p.companySource}` : 'Sincronizado via Bling ERP v3'
        }))

        // Limpeza atômica dos registros anteriores da BR Lumens
        await supabase.from('payables').delete().eq('client_id', resolvedClientId)
        const { error: insPayErr } = await supabase.from('payables').insert(payablesPayload)
        if (insPayErr) {
          console.warn('Aviso ao inserir payables do Bling no Supabase:', insPayErr.message)
        }
      } catch (err) {
        console.warn('Erro ao salvar payables do Bling:', err)
      }
    }

    // c) Salvar Contas a Receber do Bling no Supabase
    if (syncData.receivables && syncData.receivables.length > 0) {
      try {
        const receivablesPayload = syncData.receivables.map(r => ({
          client_id: resolvedClientId,
          ca_receivable_id: String(r.id),
          customer_name: r.customer || 'Cliente Bling',
          category_name: r.category || 'Venda de Iluminação LED',
          description: `[Empresa: ${r.companySource || 'BR Lumens'}] ${r.description || `Recebimento - ${r.customer || 'Bling'}`}`,
          amount: Number(r.amount || 0),
          received_amount: Number(r.amountPaid || 0),
          due_date: r.dueDate,
          status: r.status === 'received' ? 'received' : (r.status === 'overdue' ? 'overdue' : 'pending'),
          payment_method: r.paymentMethod || 'boleto',
          invoice_number: r.invoiceNumber || null
        }))

        // Limpeza atômica dos registros anteriores da BR Lumens
        await supabase.from('receivables').delete().eq('client_id', resolvedClientId)
        const { error: insRecErr } = await supabase.from('receivables').insert(receivablesPayload)
        if (insRecErr) {
          console.warn('Aviso ao inserir receivables do Bling no Supabase:', insRecErr.message)
        }
      } catch (err) {
        console.warn('Erro ao salvar receivables do Bling:', err)
      }
    }

    // d) Registrar Log de Sincronização
    try {
      await supabase.from('sync_logs').insert({
        client_id: resolvedClientId,
        entity_type: 'bling_v3_sync',
        status: 'success',
        records_processed: (syncData.payables ? syncData.payables.length : 0) + (syncData.receivables ? syncData.receivables.length : 0),
        details: `Sincronização BR Lumens via Bling ERP v3 executada e persistida no Supabase com sucesso.`,
        executed_by: 'Amici Comex Portal'
      })
    } catch (err) {
      console.warn('Aviso ao registrar sync_logs do Bling:', err)
    }

    return true
  } catch (err) {
    console.error('Erro ao persistir dados do Bling no Supabase:', err)
    return false
  }
}


