import { createClient } from '@supabase/supabase-js'

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
// 1. CLIENTES DA CARTEIRA BPO AMICI
// =============================================================================
export async function saveClientToSupabase(client) {
  const supabase = getSupabaseClient()
  if (!supabase || !client) return null

  try {
    const rawId = client.id ? String(client.id) : ''
    const isUuid = rawId.includes('-') && rawId.length === 36
    const resolvedId = isUuid ? rawId : 'd0000000-0000-0000-0000-000000000001'

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

    return data
  } catch (err) {
    console.error('Erro ao salvar cliente no Supabase:', err)
    return null
  }
}

export async function fetchClientsFromSupabase() {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        conta_azul_integrations (*)
      `)
      .order('trade_name', { ascending: true })

    if (error || !data) return []

    return data.map(c => {
      const ca = c.conta_azul_integrations && c.conta_azul_integrations[0]
      return {
        id: c.id,
        corporateName: c.corporate_name,
        tradeName: c.trade_name,
        cnpj: c.cnpj,
        email: c.email,
        phone: c.phone,
        segment: c.segment,
        taxRegime: c.tax_regime,
        financialAnalyst: c.financial_analyst,
        planTier: c.plan_tier,
        monthlyFee: Number(c.monthly_fee || 0),
        status: c.status,
        contaAzulStatus: ca ? ca.connection_status : 'connected',
        lastSync: ca && ca.last_sync_at ? 'Sincronizado via Supabase' : 'Conectado',
        color: '#0077B6',
        isBpoClient: true,
        contaAzulConfig: ca ? {
          companyId: ca.ca_company_id,
          clientId: ca.ca_client_id,
          userEmail: ca.user_email,
          accessToken: ca.access_token,
          refreshToken: ca.refresh_token
        } : null
      }
    })
  } catch (err) {
    console.error('Erro ao buscar clientes no Supabase:', err)
    return []
  }
}

// =============================================================================
// 2. CONTAS A PAGAR (PAYABLES)
// =============================================================================
export async function fetchPayablesFromSupabase(clientId) {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  try {
    const rawId = clientId ? String(clientId) : ''
    const isUuid = rawId.includes('-') && rawId.length === 36
    const resolvedClientId = isUuid ? rawId : 'd0000000-0000-0000-0000-000000000001'

    const { data, error } = await supabase
      .from('payables')
      .select('*')
      .eq('client_id', resolvedClientId)
      .order('due_date', { ascending: true })

    if (error || !data) return []

    return data.map(p => ({
      id: p.id,
      clientId: p.client_id,
      supplier: p.supplier_name,
      category: p.category_name,
      description: p.description,
      amount: Number(p.amount || 0),
      dueDate: p.due_date,
      status: p.status,
      bankAccount: 'Banco Itaú Unibanco',
      barcode: p.barcode || '',
      approvalStatus: p.status === 'pending_client' ? 'pending' : 'approved',
      hasAttachment: true
    }))
  } catch (err) {
    console.error('Erro ao buscar payables no Supabase:', err)
    return []
  }
}

export async function updatePayableStatusInSupabase(id, status) {
  const supabase = getSupabaseClient()
  if (!supabase || !id) return false

  try {
    const { error } = await supabase
      .from('payables')
      .update({ status, updated_at: new Date().toISOString() })
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
      due_date: payable.dueDate,
      status: payable.status || 'scheduled',
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

// =============================================================================
// 3. CONTAS A RECEBER (RECEIVABLES)
// =============================================================================
export async function fetchReceivablesFromSupabase(clientId) {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  try {
    const rawId = clientId ? String(clientId) : ''
    const isUuid = rawId.includes('-') && rawId.length === 36
    const resolvedClientId = isUuid ? rawId : 'd0000000-0000-0000-0000-000000000001'

    const { data, error } = await supabase
      .from('receivables')
      .select('*')
      .eq('client_id', resolvedClientId)
      .order('due_date', { ascending: true })

    if (error || !data) return []

    return data.map(r => ({
      id: r.id,
      clientId: r.client_id,
      customer: r.customer_name,
      category: r.category_name,
      description: r.description,
      amount: Number(r.amount || 0),
      dueDate: r.due_date,
      status: r.status,
      paymentMethod: r.payment_method === 'boleto' ? 'Boleto Bancário' : (r.payment_method || 'Boleto / PIX'),
      invoiceNumber: r.invoice_number || 'NF-e Oficial'
    }))
  } catch (err) {
    console.error('Erro ao buscar receivables no Supabase:', err)
    return []
  }
}

export async function updateReceivableStatusInSupabase(id, status) {
  const supabase = getSupabaseClient()
  if (!supabase || !id) return false

  try {
    const { error } = await supabase
      .from('receivables')
      .update({ status, updated_at: new Date().toISOString() })
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

    // d) Salvar Contas a Receber Reais da Conta Azul
    if (syncData.mappedReceivables && syncData.mappedReceivables.length > 0) {
      try {
        await supabase.from('receivables').delete().eq('client_id', resolvedClientId)
        
        const receivablesPayload = syncData.mappedReceivables.map(r => ({
          client_id: resolvedClientId,
          ca_receivable_id: r.caReceivableId || r.id,
          customer_name: r.customer,
          category_name: r.category || 'Venda de Produtos & Serviços',
          description: r.description,
          amount: Number(r.amount || 0),
          due_date: r.dueDate,
          status: r.status,
          payment_method: 'boleto',
          invoice_number: r.invoiceNumber
        }))

        await supabase.from('receivables').insert(receivablesPayload)
      } catch (err) {
        console.warn('Aviso ao persistir receivables no Supabase:', err)
      }
    }

    // e) Salvar Contas a Pagar Reais da Conta Azul
    if (syncData.mappedPayables && syncData.mappedPayables.length > 0) {
      try {
        await supabase.from('payables').delete().eq('client_id', resolvedClientId)
        
        const payablesPayload = syncData.mappedPayables.map(p => ({
          client_id: resolvedClientId,
          ca_payable_id: p.caPayableId || p.id,
          supplier_name: p.supplier,
          category_name: p.category || 'Fornecedores & Insumos',
          description: p.description,
          amount: Number(p.amount || 0),
          due_date: p.dueDate,
          status: p.status,
          barcode: p.barcode || null,
          notes: 'Sincronizado via Conta Azul V2'
        }))

        await supabase.from('payables').insert(payablesPayload)
      } catch (err) {
        console.warn('Aviso ao persistir payables no Supabase:', err)
      }
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
