import React, { useState } from 'react'
import {
  Settings,
  Database,
  Zap,
  Code2,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Server,
  ShieldCheck,
  Key
} from 'lucide-react'
import { getSupabaseCredentials, saveSupabaseCredentials, testSupabaseConnection } from '../services/supabase'
import { getContaAzulGlobalConfig, saveContaAzulGlobalConfig, buildContaAzulAuthUrl } from '../services/contaAzulService'

export function SettingsView({ onResetDemoData }) {
  const [supabaseCreds, setSupabaseCreds] = useState(getSupabaseCredentials())
  const [contaAzulConfig, setContaAzulConfig] = useState(getContaAzulGlobalConfig())
  const [isTestingSupabase, setIsTestingSupabase] = useState(false)
  const [supabaseStatus, setSupabaseStatus] = useState(null)
  const [copiedSql, setCopiedSql] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  const handleSaveAll = (e) => {
    e.preventDefault()
    saveSupabaseCredentials(supabaseCreds.url, supabaseCreds.key)
    saveContaAzulGlobalConfig(
      contaAzulConfig.clientId,
      contaAzulConfig.clientSecret,
      contaAzulConfig.redirectUri,
      contaAzulConfig.accessToken,
      contaAzulConfig.refreshToken
    )
    setSaveMessage('Configurações salvas com sucesso!')
    setTimeout(() => setSaveMessage(''), 3000)
  }

  const handleTestSupabase = async () => {
    if (!supabaseCreds.url || !supabaseCreds.key) {
      setSupabaseStatus({ success: false, error: 'Preencha a URL e a Chave Anon do Supabase primeiro.' })
      return
    }
    setIsTestingSupabase(true)
    const res = await testSupabaseConnection(supabaseCreds.url, supabaseCreds.key)
    setIsTestingSupabase(false)
    setSupabaseStatus(res)
  }

  const sqlSchemaSnippet = `-- AMICI GESTÃO FINANCEIRA - SCRIPT DE CRIAÇÃO SUPABASE
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    corporate_name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(30),
    segment VARCHAR(100),
    tax_regime VARCHAR(50) DEFAULT 'Simples Nacional',
    financial_analyst VARCHAR(100) DEFAULT 'Equipe Amici',
    monthly_fee NUMERIC(10,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.conta_azul_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE UNIQUE NOT NULL,
    ca_client_id VARCHAR(255),
    ca_client_secret VARCHAR(255),
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    connection_status VARCHAR(50) DEFAULT 'connected',
    last_sync_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.payables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    description VARCHAR(255) NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(30) DEFAULT 'scheduled',
    barcode TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);`

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSchemaSnippet)
    setCopiedSql(true)
    setTimeout(() => setCopiedSql(false), 2000)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-cyan-400" />
            <span>Configurações & Conexões do Portal</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Parâmetros do banco de dados Supabase, credenciais da API Conta Azul e esquema SQL.
          </p>
        </div>

        <button
          type="button"
          onClick={onResetDemoData}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700 transition-colors"
        >
          Restaurar Dados Demo Amici
        </button>
      </div>

      <form onSubmit={handleSaveAll} className="space-y-6">
        
        {/* Bloco 1: Conexão Supabase */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">Banco de Dados Supabase</h2>
                <p className="text-xs text-slate-400">Armazenamento seguro para clientes, borderôs e logs de auditoria</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleTestSupabase}
              disabled={isTestingSupabase}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTestingSupabase ? 'animate-spin text-cyan-400' : ''}`} />
              <span>Testar Conexão</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Project URL (Supabase)</label>
              <input
                type="text"
                placeholder="https://seu-projeto.supabase.co"
                value={supabaseCreds.url}
                onChange={(e) => setSupabaseCreds({ ...supabaseCreds, url: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Anon / Public Key</label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={supabaseCreds.key}
                onChange={(e) => setSupabaseCreds({ ...supabaseCreds, key: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {supabaseStatus && (
            <div className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
              supabaseStatus.success
                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                : 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
            }`}>
              {supabaseStatus.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              <span>{supabaseStatus.success ? supabaseStatus.message : supabaseStatus.error}</span>
            </div>
          )}
        </div>

        {/* Bloco 2: Credenciais Globais da Conta Azul */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">Credenciais da API Conta Azul (OAuth 2.0)</h2>
                <p className="text-xs text-slate-400">Tokens de autorização para comunicação em tempo real com a API V2</p>
              </div>
            </div>
            
            <a
              href={buildContaAzulAuthUrl()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/60 text-xs font-semibold text-cyan-300 transition-all shadow-sm"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Gerar Novo Token (OAuth2)</span>
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Conta Azul Client ID</label>
              <input
                type="text"
                placeholder="510utbibu9gb6002lerhav28tk"
                value={contaAzulConfig.clientId}
                onChange={(e) => setContaAzulConfig({ ...contaAzulConfig, clientId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Conta Azul Client Secret (Opcional)</label>
              <input
                type="password"
                placeholder="••••••••••••••••••••••••"
                value={contaAzulConfig.clientSecret}
                onChange={(e) => setContaAzulConfig({ ...contaAzulConfig, clientSecret: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Access Token da Conta Azul (Expira a cada 1 hora)
              </label>
              <textarea
                rows="2"
                placeholder="Cole o access_token aqui..."
                value={contaAzulConfig.accessToken}
                onChange={(e) => setContaAzulConfig({ ...contaAzulConfig, accessToken: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-cyan-300 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Refresh Token da Conta Azul
              </label>
              <input
                type="text"
                placeholder="Refresh token para renovação automática"
                value={contaAzulConfig.refreshToken}
                onChange={(e) => setContaAzulConfig({ ...contaAzulConfig, refreshToken: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Botão de Salvar Global */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs font-semibold text-emerald-400">
            {saveMessage}
          </span>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-semibold text-xs shadow-lg shadow-cyan-950/40 transition-all active:scale-95"
          >
            Salvar Todas as Configurações
          </button>
        </div>

      </form>

      {/* Bloco 3: Script SQL Supabase para Copiar */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-sky-500/10 text-sky-400">
              <Code2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Script SQL de Inicialização (Supabase)</h2>
              <p className="text-xs text-slate-400">Execute este script no SQL Editor do Supabase para criar todas as tabelas</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopySql}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-colors"
          >
            {copiedSql ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
            <span>{copiedSql ? 'Copiado!' : 'Copiar SQL'}</span>
          </button>
        </div>

        <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs overflow-x-auto max-h-60">
          {sqlSchemaSnippet}
        </pre>
      </div>

    </div>
  )
}
