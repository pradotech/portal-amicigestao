import React, { useState, useMemo } from 'react'
import {
  FileSpreadsheet,
  Download,
  Send,
  TrendingUp,
  Percent,
  Calendar,
  Building2,
  PieChart as PieIcon,
  ChevronDown
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts'
import { formatCurrency } from '../utils/formatters'

const EXPENSE_COLORS = ['#0077B6', '#0096C7', '#48CAE4', '#90E0EF', '#ADE8F4', '#38BDF8', '#818CF8']

export function DreReportsView({ clients = [], selectedClientId, payables = [], receivables = [] }) {
  const [selectedMonth, setSelectedMonth] = useState('2026-09')
  const client = clients.find(c => c.id === selectedClientId) || clients[0]

  // Filtra lançamentos da competência selecionada
  const monthReceivables = useMemo(() => {
    return receivables.filter(r => {
      const d = r.dueDate || r.due_date || ''
      return d.startsWith(selectedMonth)
    })
  }, [receivables, selectedMonth])

  const monthPayables = useMemo(() => {
    return payables.filter(p => {
      const d = p.dueDate || p.due_date || ''
      return d.startsWith(selectedMonth)
    })
  }, [payables, selectedMonth])

  // 1. Receita Bruta
  const grossRevenue = monthReceivables.reduce((acc, r) => acc + (Number(r.amount) || 0), 0)

  // 2. Impostos e Deduções
  const taxPayables = monthPayables.filter(p => {
    const cat = (p.category || p.category_name || '').toLowerCase()
    return cat.includes('imposto') || cat.includes('tribut') || cat.includes('darf') || cat.includes('das')
  })
  const taxes = taxPayables.reduce((acc, p) => acc + (Number(p.amount) || 0), 0)
  const netRevenue = Math.max(0, grossRevenue - taxes)

  // 3. Custos Diretos (CMV / CSP)
  const costPayables = monthPayables.filter(p => {
    const cat = (p.category || p.category_name || '').toLowerCase()
    return cat.includes('insumo') || cat.includes('matéria') || cat.includes('materia') || cat.includes('frete') || cat.includes('logística') || cat.includes('logistica')
  })
  const cogs = costPayables.reduce((acc, p) => acc + (Number(p.amount) || 0), 0)
  const grossProfit = netRevenue - cogs

  // 4. Despesas Operacionais (demais pagamentos)
  const operationalPayables = monthPayables.filter(p => !taxPayables.includes(p) && !costPayables.includes(p))
  const operationalExpensesTotal = operationalPayables.reduce((acc, p) => acc + (Number(p.amount) || 0), 0)

  // Agrupamento por categoria para o gráfico
  const expensesByCategory = useMemo(() => {
    const map = {}
    monthPayables.forEach(p => {
      const cat = p.category || p.category_name || 'Outras Despesas'
      map[cat] = (map[cat] || 0) + (Number(p.amount) || 0)
    })
    const entries = Object.entries(map).map(([name, value]) => ({ name, value }))
    return entries.length > 0 ? entries : [{ name: 'Sem despesas no mês', value: 0 }]
  }, [monthPayables])

  const ebitda = grossProfit - operationalExpensesTotal
  const netIncome = ebitda

  const grossMargin = netRevenue > 0 ? ((grossProfit / netRevenue) * 100).toFixed(1) : '0.0'
  const ebitdaMargin = netRevenue > 0 ? ((ebitda / netRevenue) * 100).toFixed(1) : '0.0'
  const netMargin = netRevenue > 0 ? ((netIncome / netRevenue) * 100).toFixed(1) : '0.0'

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <FileSpreadsheet className="w-7 h-7 text-sky-400" />
            <span>DRE Gerencial & Demonstrativos</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Demonstração do Resultado do Exercício consolidada ou por cliente BPO.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="2026-09">Competência: Setembro / 2026</option>
            <option value="2026-08">Competência: Agosto / 2026</option>
            <option value="2026-07">Competência: Julho / 2026</option>
            <option value="2026-06">Competência: Junho / 2026</option>
            <option value="2026-05">Competência: Maio / 2026</option>
            <option value="2026-04">Competência: Abril / 2026</option>
            <option value="2026-03">Competência: Março / 2026</option>
            <option value="2026-02">Competência: Fevereiro / 2026</option>
            <option value="2026-01">Competência: Janeiro / 2026</option>
          </select>

          <button
            type="button"
            onClick={() => alert('Relatório DRE Gerencial exportado em formato PDF/Excel com sucesso!')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4 text-sky-400" />
            <span>Exportar PDF</span>
          </button>
        </div>
      </div>

      {/* Margens e Indicadores Chave */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Margem Bruta</span>
          <div className="text-2xl font-extrabold text-white mt-2 font-mono flex items-baseline gap-2">
            <span>{grossMargin}%</span>
            <span className="text-xs text-slate-400 font-normal">({formatCurrency(grossProfit)})</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Margem EBITDA</span>
          <div className="text-2xl font-extrabold text-cyan-400 mt-2 font-mono flex items-baseline gap-2">
            <span>{ebitdaMargin}%</span>
            <span className="text-xs text-slate-400 font-normal">({formatCurrency(ebitda)})</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Margem Líquida</span>
          <div className="text-2xl font-extrabold text-emerald-400 mt-2 font-mono flex items-baseline gap-2">
            <span>{netMargin}%</span>
            <span className="text-xs text-slate-400 font-normal">({formatCurrency(netIncome)})</span>
          </div>
        </div>
      </div>

      {/* Grid Principal: Tabela DRE e Gráfico de Despesas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Tabela DRE Analítica (2 colunas) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <h2 className="text-base font-bold text-white tracking-tight">Estrutura de Resultados - Competência {selectedMonth}</h2>

          <div className="divide-y divide-slate-800 text-xs">
            
            {/* Receita Bruta */}
            <div className="py-3 flex items-center justify-between font-bold text-white text-sm">
              <span>(+) RECEITA BRUTA DE VENDAS & SERVIÇOS</span>
              <span className="font-mono text-cyan-400">{formatCurrency(grossRevenue)}</span>
            </div>

            {/* Impostos */}
            <div className="py-2.5 flex items-center justify-between text-slate-400 pl-4">
              <span>(-) Deduções da Receita & Tributos (DAS / IRPJ / CSLL / ISS)</span>
              <span className="font-mono text-rose-400">({formatCurrency(taxes)})</span>
            </div>

            {/* Receita Líquida */}
            <div className="py-3 flex items-center justify-between font-bold text-slate-200 bg-slate-800/30 px-3 rounded-xl">
              <span>(=) RECEITA OPERACIONAL LÍQUIDA</span>
              <span className="font-mono text-white">{formatCurrency(netRevenue)}</span>
            </div>

            {/* Custos Diretos */}
            <div className="py-2.5 flex items-center justify-between text-slate-400 pl-4">
              <span>(-) Custos Diretos / Insumos / Serviços Prestados (CMV/CSP)</span>
              <span className="font-mono text-rose-400">({formatCurrency(cogs)})</span>
            </div>

            {/* Lucro Bruto */}
            <div className="py-3 flex items-center justify-between font-bold text-slate-200 bg-slate-800/30 px-3 rounded-xl">
              <span>(=) LUCRO BRUTO OPERACIONAL</span>
              <span className="font-mono text-white">{formatCurrency(grossProfit)}</span>
            </div>

            {/* Despesas Operacionais */}
            <div className="py-2.5 space-y-2 pl-4">
              <span className="font-semibold text-slate-300 block">(-) DESPESAS OPERACIONAIS GERAIS</span>
              
              <div className="space-y-1.5 pl-4 text-slate-400">
                {operationalPayables.map(p => (
                  <div key={p.id} className="flex justify-between">
                    <span>• {p.supplier || p.description} ({p.category})</span>
                    <span className="font-mono">({formatCurrency(p.amount)})</span>
                  </div>
                ))}
                {operationalPayables.length === 0 && (
                  <div className="text-slate-500 italic">Nenhuma despesa operacional registrada para este mês</div>
                )}
              </div>
            </div>

            {/* EBITDA */}
            <div className="py-3 flex items-center justify-between font-bold text-cyan-300 bg-cyan-950/30 px-3 rounded-xl border border-cyan-800/40">
              <span>(=) EBITDA (Lucro Antes de Juros, Impostos e Depreciação)</span>
              <span className="font-mono">{formatCurrency(ebitda)}</span>
            </div>

            {/* Resultado Líquido */}
            <div className="py-4 flex items-center justify-between font-extrabold text-emerald-400 text-base bg-emerald-950/30 px-4 rounded-2xl border border-emerald-700/50">
              <span>(=) RESULTADO LÍQUIDO DO PERÍODO</span>
              <span className="font-mono">{formatCurrency(netIncome)}</span>
            </div>

          </div>
        </div>

        {/* Gráfico de Despesas (1 coluna) */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Composição de Custos & Despesas</h2>
            <p className="text-xs text-slate-400 mt-0.5">Distribuição das despesas por categoria no mês</p>

            <div className="h-60 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensesByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {expensesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                    formatter={(value) => [formatCurrency(value), '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 mt-4 max-h-48 overflow-y-auto pr-1">
              {expensesByCategory.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: EXPENSE_COLORS[idx % EXPENSE_COLORS.length] }} />
                    <span className="text-slate-300 truncate">{item.name}</span>
                  </div>
                  <span className="font-mono text-slate-400">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => alert('Resumo executivo do mês enviado para o WhatsApp/E-mail do cliente!')}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-semibold text-xs transition-all shadow-lg shadow-cyan-900/30"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enviar Resumo Mensal ao Cliente</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  )
}
