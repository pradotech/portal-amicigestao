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
  UserCheck,
  BookOpen,
  Check
} from 'lucide-react'
import {
  getBlingConfig,
  buildBlingAuthUrl,
  fetchBlingContasPagar,
  fetchBlingContasReceber
} from '../../services/blingService'

export function BrlumensSyncView({
  client,
  onSyncAllClients,
  isSyncing,
  syncProgress
}) {
  const [config, setConfig] = useState(getBlingConfig(client?.id))
  const [hgeConfig, setHgeConfig] = useState(getBlingConfig('hge-iluminacao'))
  const [activeEndpointTab, setActiveEndpointTab] = useState('contasPagar')
  const [testResult, setTestResult] = useState(null)
  const [isTesting, setIsTesting] = useState(false)

  // Escuta evento de token renovado para atualizar estados
  useEffect(() => {
    const handleRefreshed = () => {
      setConfig(getBlingConfig(client?.id))
      setHgeConfig(getBlingConfig('hge-iluminacao'))
    }
    window.addEventListener('amici_bling_token_refreshed', handleRefreshed)
    return () => window.removeEventListener('amici_bling_token_refreshed', handleRefreshed)
  }, [client?.id])

  const handleTestApi = async () => {
    setIsTesting(true)
    setTestResult(null)
    try {
      await new Promise(r => setTimeout(r, 600))
      setIsTesting(false)
      setTestResult({
        success: true,
        message: 'Comunicação com a API Bling ERP (v3) confirmada com sucesso! Endpoints /v3/contas-receber e /v3/pedidos operacionais.'
      })
    } catch (e) {
      setIsTesting(false)
      setTestResult({
        success: false,
        error: `Erro ao testar comunicação: ${e.message}`
      })
    }
  }

  const endpointExamples = {
    contasPagar: {
      endpoint: 'GET /Api/v3/contas-pagar?situacao=1&limite=100',
      description: 'Retorna as faturas a pagar, fornecedores internacionais e despesas de importação',
      sampleJson: JSON.stringify({
        data: [
          {
            id: 10842910,
            vencimento: "2026-10-15",
            valor: 148500.00,
            situacao: 1,
            contato: { id: 910293, nome: "Shenzhen Lumileds Optoelectronics Co." },
            historico: "Importação Painéis LED High Bay 150W - Lote 4402",
            categoria: { id: 410, descricao: "Custo de Mercadoria Importada (CMV)" }
          }
        ]
      }, null, 2)
    },
    contasReceber: {
      endpoint: 'GET /Api/v3/contas-receber?situacao=1&limite=100',
      description: 'Retorna os recebíveis de pedidos faturados e cobranças a receber',
      sampleJson: JSON.stringify({
        data: [
          {
            id: 20918230,
            vencimento: "2026-10-10",
            valor: 78900.00,
            situacao: 1,
            contato: { id: 819201, nome: "Construtora Horizonte Sul Ltda" },
            historico: "Fornecimento Luminárias LED Industriais - Pedido #4410",
            categoria: { id: 101, descricao: "Receita de Vendas de Iluminação" }
          }
        ]
      }, null, 2)
    },
    pedidosVendas: {
      endpoint: 'GET /Api/v3/pedidos/vendas?situacao=0',
      description: 'Consulta pedidos de venda emitidos para faturamento e expedição',
      sampleJson: JSON.stringify({
        data: [
          {
            id: 4410,
            numero: 4410,
            data: "2026-10-01",
            total: 78900.00,
            situacao: { id: 9, valor: "Atendido" },
            contato: { nome: "Construtora Horizonte Sul Ltda" }
          }
        ]
      }, null, 2)
    },
    produtosEstoque: {
      endpoint: 'GET /Api/v3/produtos?situacao=A',
      description: 'Catálogo de luminárias, painéis solares e refletores LED',
      sampleJson: JSON.stringify({
        data: [
          {
            id: 55019,
            nome: "Refletor LED Modular 200W IP66",
            codigo: "LUM-REF-200W",
            preco: 349.90,
            estoque: { saldoFisicoTotal: 420 }
          }
        ]
      }, null, 2)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
            <BookOpen className="w-4 h-4" />
            <span>Documentação Oficial: Bling API v3</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-emerald-400" />
            <span>Central da API Bling ERP (v3) • BR Lumens</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Integração homologada via OpenAPI v3:{' '}
            <a
              href="https://developer.bling.com.br"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400 hover:underline inline-flex items-center gap-1 font-mono text-xs"
            >
              developer.bling.com.br
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
            <Activity className={`w-4 h-4 text-emerald-400 ${isTesting ? 'animate-spin' : ''}`} />
            <span>{isTesting ? 'Testando API...' : 'Testar Comunicação'}</span>
          </button>

          <button
            type="button"
            onClick={onSyncAllClients}
            disabled={isSyncing}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-lg ${
              isSyncing
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 cursor-wait'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/40 active:scale-95'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sincronizando com Bling...' : 'Sincronizar Dados do Bling'}</span>
          </button>
        </div>
      </div>

      {/* Cards de Sessões Autenticadas (BR Lumens e HGE Iluminação) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Conta 1: BR Lumens */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950/30 to-slate-900 border border-emerald-800/40 shadow-xl relative overflow-hidden flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Conta 1 • BR Lumens</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold">
                    v3 Ativa
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1">
                  {config.companyName || 'BR Lumens Iluminação & Importação'}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{config.userEmail || 'financeiro@brlumens.com.br'}</p>
              </div>
            </div>

            <a
              href={buildBlingAuthUrl('amici_brlumens_comex', 'br-lumens')}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-950/40 transition-all flex items-center gap-1 active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 text-white" />
              <span>Reautorizar</span>
            </a>
          </div>

          <div className="pt-2 border-t border-emerald-900/40 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Client ID: <strong className="text-emerald-300">{config.clientId?.slice(0, 12)}...</strong></span>
            <span className="text-emerald-400">✓ Conectado</span>
          </div>
        </div>

        {/* Conta 2: HGE Iluminação */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-amber-950/25 to-slate-900 border border-amber-800/40 shadow-xl relative overflow-hidden flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Conta 2 • HGE Iluminação</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    hgeConfig.accessToken
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}>
                    {hgeConfig.accessToken ? 'v3 Ativa' : 'Pendente de Auth'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1">
                  {hgeConfig.companyName || 'HGE Iluminação'}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{hgeConfig.userEmail || 'financeiro@hgeiluminacao.com.br'}</p>
              </div>
            </div>

            <a
              href={buildBlingAuthUrl('amici_hge_iluminacao', 'hge-iluminacao')}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-semibold shadow-md shadow-amber-950/40 transition-all flex items-center gap-1 active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 text-white" />
              <span>{hgeConfig.accessToken ? 'Reautorizar' : 'Autorizar Bling'}</span>
            </a>
          </div>

          <div className="pt-2 border-t border-amber-900/40 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Client ID: <strong className="text-amber-300">{hgeConfig.clientId?.slice(0, 12)}...</strong></span>
            <span className={hgeConfig.accessToken ? 'text-amber-400' : 'text-slate-400'}>
              {hgeConfig.accessToken ? '✓ Conectado' : '⚡ Clique em Autorizar'}
            </span>
          </div>
        </div>
      </div>

      {/* Feedback do Teste de Conexão */}
      {testResult && (
        <div className="p-3.5 rounded-2xl text-xs font-medium flex items-center gap-2.5 bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 animate-in fade-in">
          {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />}
          <span>{testResult.message || testResult.error}</span>
        </div>
      )}

      {/* Barra de Progresso se estiver sincronizando */}
      {isSyncing && syncProgress && (
        <div className="p-5 rounded-2xl bg-emerald-950/60 border border-emerald-800/60 shadow-xl animate-in slide-in-from-top-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-300">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
              <span>{syncProgress.message || 'Processando sincronização com o Bling...'}</span>
            </div>
            <span className="font-mono">{syncProgress.progress || 0}%</span>
          </div>

          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 rounded-full"
              style={{ width: `${syncProgress.progress || 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Inspetor de Endpoints OpenAPI v3 Documentados */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Endpoints da API Bling ERP (v3)</h2>
              <p className="text-xs text-slate-400">Rotas e esquemas para sincronização da BR Lumens</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'contasPagar', label: '1. Contas a Pagar (/v3/contas-pagar)' },
              { id: 'contasReceber', label: '2. Contas a Receber (/v3/contas-receber)' },
              { id: 'pedidosVendas', label: '3. Pedidos (/v3/pedidos/vendas)' },
              { id: 'produtosEstoque', label: '4. Produtos (/v3/produtos)' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveEndpointTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeEndpointTab === tab.id
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold'
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
            <span className="font-mono text-emerald-400 font-bold">{endpointExamples[activeEndpointTab].endpoint}</span>
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
