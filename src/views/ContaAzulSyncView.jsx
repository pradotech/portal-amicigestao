import React, { useState } from 'react'
import {
  Zap,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Server,
  Code2,
  ExternalLink,
  Activity,
  Terminal,
  ShieldCheck,
  Building2,
  Play,
  UserCheck,
  BookOpen,
  Check
} from 'lucide-react'
import {
  getContaAzulGlobalConfig,
  saveContaAzulGlobalConfig,
  testContaAzulApiLive
} from '../services/contaAzulService'
import { formatDate } from '../utils/formatters'

export function ContaAzulSyncView({
  clients,
  onSyncAllClients,
  isSyncing,
  syncProgress
}) {
  const [config, setConfig] = useState(getContaAzulGlobalConfig())
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [activeEndpointTab, setActiveEndpointTab] = useState('contaFinanceira')
  const [testResult, setTestResult] = useState(null)
  const [isTesting, setIsTesting] = useState(false)

  const handleSaveConfig = (e) => {
    e.preventDefault()
    saveContaAzulGlobalConfig(
      config.clientId,
      config.clientSecret,
      config.redirectUri,
      config.accessToken,
      config.refreshToken
    )
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  const handleTestApi = async () => {
    setIsTesting(true)
    setTestResult(null)
    const res = await testContaAzulApiLive()
    setIsTesting(false)
    setTestResult(res)
  }

  // Exemplos de payload da documentação oficial OpenAPI v1 da Conta Azul
  const endpointExamples = {
    contaFinanceira: {
      endpoint: 'GET /v1/conta-financeira',
      description: 'Retorna a lista de contas bancárias e contas digitais ativas no Conta Azul',
      sampleJson: JSON.stringify({
        itens_totais: 5,
        itens: [
          {
            id: "a68dfb8e-eec0-4509-a0c1-4349c112ae8b",
            banco: "C6",
            codigo_banco: 336,
            nome: "C6 - PJ",
            ativo: true,
            tipo: "CONTA_CORRENTE",
            conta_padrao: false,
            possui_config_boleto_bancario: false
          }
        ]
      }, null, 2)
    },
    pessoas: {
      endpoint: 'GET /v1/pessoas?tamanho_pagina=100',
      description: 'Retorna os clientes, fornecedores e transportadoras cadastrados',
      sampleJson: JSON.stringify({
        totalItems: 194,
        items: [
          {
            id: "5d7ed745-19a5-4b4d-a5e3-1fa92129a55e",
            nome: "RODOALTO TRANSPORTES EIRELI",
            documento: "01220380000132",
            tipo_pessoa: "JURIDICA",
            perfis: ["Transportadora", "Fornecedor"],
            ativo: true
          }
        ]
      }, null, 2)
    },
    categorias: {
      endpoint: 'GET /v1/categorias',
      description: 'Retorna as categorias de receitas e despesas para a estrutura de DRE',
      sampleJson: JSON.stringify({
        itens_totais: 135,
        itens: [
          {
            id: "1c93eb34-fcf3-4749-ae45-5a7842bd734b",
            nome: "13º Salário - 1ª Parcela",
            tipo: "DESPESA",
            entrada_dre: "DESPESAS_ADMINISTRATIVAS",
            considera_custo_dre: false
          }
        ]
      }, null, 2)
    },
    centroCusto: {
      endpoint: 'GET /v1/centro-de-custo?pagina=1&tamanho_pagina=10&filtro_rapido=ATIVO',
      description: 'Retorna os centros de custo cadastrados para rateio financeiro',
      sampleJson: JSON.stringify({
        itens_totais: 0,
        itens: [],
        totais: { ativo: 0, inativo: 0, todos: 0 }
      }, null, 2)
    },
    parcelas: {
      endpoint: 'GET /v1/financeiro/eventos-financeiros/{id_evento}/parcelas',
      description: 'Retorna as parcelas e vencimentos vinculados a um evento de contas a pagar/receber',
      sampleJson: JSON.stringify([
        {
          id: "35473eec-4e74-11ee-b500-9f61de8a8b8b",
          numero: 1,
          valor: 14850.20,
          data_vencimento: "2026-09-24",
          status: "AGENDADO",
          id_conta_financeira: "a68dfb8e-eec0-4509-a0c1-4349c112ae8b"
        }
      ], null, 2)
    },
    baixa: {
      endpoint: 'POST /v1/financeiro/eventos-financeiros/parcelas/{parcela_id}/baixa',
      description: 'Registra a baixa / liquidação do pagamento ou recebimento no banco',
      sampleJson: JSON.stringify({
        data_pagamento: "2026-09-23",
        valor_pago: 14850.20,
        id_conta_financeira: "a68dfb8e-eec0-4509-a0c1-4349c112ae8b"
      }, null, 2)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-1">
            <BookOpen className="w-4 h-4" />
            <span>Documentação Oficial: OpenAPI v1</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Zap className="w-7 h-7 text-cyan-400" />
            <span>Central da API Financeira Conta Azul</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Mapeada conforme a especificação oficial:{' '}
            <a
              href="https://developers.contaazul.com/docs/financial-apis-openapi/v1"
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 hover:underline inline-flex items-center gap-1 font-mono text-xs"
            >
              developers.contaazul.com/docs/financial-apis-openapi/v1
              <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleTestApi}
            disabled={isTesting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
          >
            <Activity className={`w-4 h-4 text-cyan-400 ${isTesting ? 'animate-spin' : ''}`} />
            <span>{isTesting ? 'Testando API...' : 'Testar Comunicação'}</span>
          </button>

          <button
            type="button"
            onClick={onSyncAllClients}
            disabled={isSyncing}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-lg ${
              isSyncing
                ? 'bg-cyan-950 text-cyan-400 border border-cyan-800 cursor-wait'
                : 'bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white shadow-cyan-900/40 active:scale-95'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Dados Reais'}</span>
          </button>
        </div>
      </div>

      {/* Card de Sessão Ativa / Credenciais em Uso */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border border-cyan-800/40 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mt-1">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Sessão Autenticada Conta Azul</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold">
                  API V2 Live
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1">
                {config.userEmail || 'drilex.fin@amicigestao.com.br'}
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-1 font-mono">
                <span>Empresa ID Conta Azul: <strong className="text-white">#{config.companyId || '3272538'}</strong></span>
                <span>•</span>
                <span>Client ID: <strong className="text-cyan-300">{config.clientId}</strong></span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block">Base URL Oficial</span>
            <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/80 px-2.5 py-1 rounded-lg border border-cyan-800/40 inline-block mt-1">
              https://api-v2.contaazul.com
            </span>
          </div>
        </div>

        {/* Feedback do Teste de Conexão */}
        {testResult && (
          <div className="mt-4 pt-4 border-t border-slate-800 animate-in fade-in">
            <div className={`p-3.5 rounded-2xl text-xs font-medium flex items-center gap-2.5 ${
              testResult.success
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                : 'bg-rose-950/80 text-rose-300 border border-rose-700/60'
            }`}>
              {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />}
              <span>{testResult.message || testResult.error}</span>
            </div>
          </div>
        )}
      </div>

      {/* Barra de Progresso se estiver sincronizando */}
      {isSyncing && syncProgress && (
        <div className="p-5 rounded-2xl bg-cyan-950/60 border border-cyan-800/60 shadow-xl animate-in slide-in-from-top-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-cyan-300">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
              <span>{syncProgress.message || 'Processando sincronização...'}</span>
            </div>
            <span className="font-mono">{syncProgress.progress || 0}%</span>
          </div>

          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-300 rounded-full"
              style={{ width: `${syncProgress.progress || 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Inspetor de Endpoints OpenAPI v1 Documentados */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Endpoints Oficiais da OpenAPI Financeira (v1)</h2>
              <p className="text-xs text-slate-400">Rotas e esquemas suportados na URL base https://api-v2.contaazul.com</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'contaFinanceira', label: '1. Contas Bancárias' },
              { id: 'pessoas', label: '2. Pessoas / Clientes' },
              { id: 'categorias', label: '3. Categorias DRE' },
              { id: 'centroCusto', label: '4. Centros de Custo' },
              { id: 'parcelas', label: '5. Parcelas' },
              { id: 'baixa', label: '6. Baixa / Pagamento' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveEndpointTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeEndpointTab === tab.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-mono text-cyan-400 font-bold">{endpointExamples[activeEndpointTab].endpoint}</span>
            <span>{endpointExamples[activeEndpointTab].description}</span>
          </div>

          <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-xs overflow-x-auto">
            {endpointExamples[activeEndpointTab].sampleJson}
          </pre>
        </div>
      </div>

    </div>
  )
}
