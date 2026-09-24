-- ==============================================================================
-- AMICI GESTÃO FINANCEIRA (BPO) - SUPABASE DATABASE SCHEMA
-- Especificação Oficial Conta Azul API V2: https://developers.contaazul.com/docs/financial-apis-openapi/v1
-- Suporte a Multi-Tenant (BPO Amici -> Empresas Clientes -> Fornecedores/Clientes/Bancos)
-- ==============================================================================

-- Habilita extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA DE EMPRESAS CLIENTES DO BPO (Ex: Drillex e futuros clientes da Amici)
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    corporate_name VARCHAR(255) NOT NULL, -- Razão Social
    trade_name VARCHAR(255) NOT NULL,     -- Nome Fantasia (Ex: Drillex)
    cnpj VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(30),
    segment VARCHAR(100),                 -- Ex: Indústria, Serviços, Comércio
    tax_regime VARCHAR(50) DEFAULT 'Simples Nacional', -- Simples Nacional, Lucro Presumido, Lucro Real
    financial_analyst VARCHAR(100) DEFAULT 'Equipe Amici Gestão',
    plan_tier VARCHAR(50) DEFAULT 'BPO Gestão Financeira',
    monthly_fee NUMERIC(10,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'onboarding')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. CREDENCIAIS & TOKENS OAUTH2 DA CONTA AZUL POR EMPRESA
CREATE TABLE IF NOT EXISTS public.conta_azul_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE UNIQUE NOT NULL,
    ca_company_id VARCHAR(100) NOT NULL,  -- Company ID na Conta Azul (Ex: 3272538 da Drillex)
    ca_client_id VARCHAR(255),            -- OAuth Client ID
    ca_client_secret VARCHAR(255),        -- OAuth Client Secret
    user_email VARCHAR(255),              -- E-mail do usuário autenticado no Conta Azul
    access_token TEXT,                    -- Bearer Access Token
    refresh_token TEXT,                   -- Refresh Token para auto-renovação
    token_expires_at TIMESTAMP WITH TIME ZONE,
    connection_status VARCHAR(50) DEFAULT 'connected' CHECK (connection_status IN ('connected', 'expired', 'disconnected', 'syncing', 'error')),
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_frequency VARCHAR(20) DEFAULT 'hourly', -- hourly, daily, realtime
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. PESSOAS / PARCEIROS (Fornecedores e Clientes sincronizados de GET /v1/pessoas)
CREATE TABLE IF NOT EXISTS public.counterparties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    ca_person_id VARCHAR(100) NOT NULL,   -- ID na Conta Azul
    name VARCHAR(255) NOT NULL,           -- Nome / Razão Social (Ex: Rodoalto, Airlink, AGIS)
    document VARCHAR(30),                 -- CPF ou CNPJ
    person_type VARCHAR(20) DEFAULT 'LEGAL', -- LEGAL (PJ), NATURAL (PF)
    profiles TEXT[],                      -- Array de perfis: ['Fornecedor'], ['Cliente'], ['Transportadora']
    email VARCHAR(255),
    phone VARCHAR(50),
    address_street VARCHAR(255),
    address_city VARCHAR(100),
    address_state VARCHAR(10),
    address_zipcode VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(client_id, ca_person_id)
);

-- 4. CATEGORIAS & PLANO DE CONTAS (Sincronizadas de GET /v1/categorias para DRE)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    ca_category_id VARCHAR(100) NOT NULL, -- ID da Categoria no Conta Azul
    name VARCHAR(255) NOT NULL,           -- Nome da Categoria
    category_type VARCHAR(30) NOT NULL,   -- RECEITA, DESPESA, CUSTO, DRE
    parent_category_id VARCHAR(100),      -- Categoria Pai (Hierarquia)
    code VARCHAR(50),                     -- Código contábil / estrutural
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(client_id, ca_category_id)
);

-- 5. CENTROS DE CUSTO (Sincronizados de GET /v1/centro-de-custo)
CREATE TABLE IF NOT EXISTS public.cost_centers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    ca_cost_center_id VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(client_id, ca_cost_center_id)
);

-- 6. CONTAS BANCÁRIAS E CAIXAS (Sincronizadas de GET /v1/conta-financeira)
CREATE TABLE IF NOT EXISTS public.bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    ca_account_id VARCHAR(100) NOT NULL,  -- ID correspondente no Conta Azul
    bank_name VARCHAR(100) NOT NULL,      -- Banco C6 PJ, Itaú, Bradesco, etc.
    bank_code VARCHAR(10),                -- 336 (C6), 341 (Itaú), etc.
    agency VARCHAR(20),
    account_number VARCHAR(30),
    account_type VARCHAR(50) DEFAULT 'CONTA_CORRENTE', -- CONTA_CORRENTE, APLICACAO, CAIXA
    current_balance NUMERIC(15,2) DEFAULT 0.00,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(client_id, ca_account_id)
);

-- 7. CONTAS A PAGAR (Sincronizadas com Conta Azul + Controle de Borderô do BPO)
CREATE TABLE IF NOT EXISTS public.payables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    ca_payable_id VARCHAR(100),           -- ID do título / parcela no Conta Azul
    ca_event_id VARCHAR(100),             -- ID do evento financeiro pai
    supplier_name VARCHAR(255) NOT NULL,  -- Nome do Fornecedor / Favorecido
    counterparty_id UUID REFERENCES public.counterparties(id),
    category_name VARCHAR(100) NOT NULL,
    category_id UUID REFERENCES public.categories(id),
    description VARCHAR(255) NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    paid_amount NUMERIC(15,2) DEFAULT 0.00,
    due_date DATE NOT NULL,
    payment_date DATE,
    bank_account_id UUID REFERENCES public.bank_accounts(id),
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'approved_by_client', 'scheduled', 'paid', 'overdue', 'cancelled')),
    barcode TEXT,                         -- Linha digitável / Código de barras do Boleto
    document_url TEXT,                    -- Anexo / PDF da NF ou Boleto
    approval_token VARCHAR(100),          -- Token de segurança para aprovação do cliente
    bordero_id UUID,                      -- Vinculação com o borderô de pagamento
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. CONTAS A RECEBER (Sincronizadas com Conta Azul)
CREATE TABLE IF NOT EXISTS public.receivables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    ca_receivable_id VARCHAR(100),        -- ID do título / parcela no Conta Azul
    ca_event_id VARCHAR(100),             -- ID do evento financeiro pai
    customer_name VARCHAR(255) NOT NULL,  -- Nome do Cliente Sacado
    counterparty_id UUID REFERENCES public.counterparties(id),
    category_name VARCHAR(100) NOT NULL,
    category_id UUID REFERENCES public.categories(id),
    description VARCHAR(255) NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    received_amount NUMERIC(15,2) DEFAULT 0.00,
    due_date DATE NOT NULL,
    receipt_date DATE,
    bank_account_id UUID REFERENCES public.bank_accounts(id),
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'received', 'overdue', 'cancelled', 'protested')),
    invoice_number VARCHAR(100),          -- Número da NF-e / NFS-e
    payment_method VARCHAR(50) DEFAULT 'boleto', -- boleto, pix, cartao, transferencia
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. TRANSAÇÕES E EXTRATO BANCÁRIO PARA CONCILIAÇÃO
CREATE TABLE IF NOT EXISTS public.bank_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE CASCADE NOT NULL,
    ca_transaction_id VARCHAR(100),       -- ID do lançamento no extrato Conta Azul
    transaction_date DATE NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount NUMERIC(15,2) NOT NULL,        -- Positivo (Crédito/Entrada), Negativo (Débito/Saída)
    type VARCHAR(10) CHECK (type IN ('credit', 'debit')),
    is_reconciled BOOLEAN DEFAULT FALSE,
    reconciled_with_payable_id UUID REFERENCES public.payables(id),
    reconciled_with_receivable_id UUID REFERENCES public.receivables(id),
    reconciled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. BORDERÔS DE APROVAÇÃO (Para envio ao cliente autorizar pagamentos do dia)
CREATE TABLE IF NOT EXISTS public.payment_bordereaux (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,          -- Ex: Borderô de Pagamentos - 23/09/2026
    total_amount NUMERIC(15,2) NOT NULL,
    items_count INTEGER DEFAULT 0,
    scheduled_for_date DATE NOT NULL,
    status VARCHAR(30) DEFAULT 'pending_client' CHECK (status IN ('draft', 'pending_client', 'approved', 'rejected', 'executed')),
    client_feedback TEXT,
    approval_token VARCHAR(100) UNIQUE,   -- Link único para o cliente aprovar sem login
    approved_by VARCHAR(255),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. LOGS DE AUDITORIA E SINCRONIZAÇÃO
CREATE TABLE IF NOT EXISTS public.sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL,     -- 'pessoas', 'categorias', 'contas_financeiras', 'payables', 'receivables'
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed', 'running')),
    records_processed INTEGER DEFAULT 0,
    details TEXT,
    error_message TEXT,
    executed_by VARCHAR(100) DEFAULT 'Amici BPO Sync Service',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 12. POLÍTICAS DE ACESSO RLS (ROW LEVEL SECURITY)
-- Permite leitura e escrita pelo portal web do BPO
-- ==============================================================================
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all on clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.conta_azul_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all on conta_azul_integrations" ON public.conta_azul_integrations FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.counterparties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all on counterparties" ON public.counterparties FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all on categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all on cost_centers" ON public.cost_centers FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all on bank_accounts" ON public.bank_accounts FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.payables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all on payables" ON public.payables FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.receivables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all on receivables" ON public.receivables FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all on bank_transactions" ON public.bank_transactions FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.payment_bordereaux ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all on payment_bordereaux" ON public.payment_bordereaux FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all on sync_logs" ON public.sync_logs FOR ALL USING (true) WITH CHECK (true);


