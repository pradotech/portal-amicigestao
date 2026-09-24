import React, { useState } from 'react'
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
import { DRE_DATA } from '../data/mockData'

const EXPENSE_COLORS = ['#0077B6', '#0096C7', '#48CAE4', '#90E0EF', '#ADE8F4']

export function DreReportsView({ clients, selectedClientId }) {
  const [selectedMonth, setSelectedMonth] = useState('09/2026')
  const client = clients.find(c => c.id === selectedClientId)

  // Despesas para o gráfico de pizza
  const expensesChartData = [
    { name: 'Folha & Pessoal', value: DRE_DATA.operationalExpenses.payroll },
    { name: 'Marketing & Vendas', value: DRE_DATA.operationalExpenses.marketing },
    { name: 'Administrativo & Aluguel', value: DRE_DATA.operationalExpenses.administrative },
    { name: 'Software & Cloud', value: DRE_DATA.operationalExpenses.softwareTech },
    { name: 'Despesas Bancárias', value: DRE_DATA.operationalExpenses.financialCharges }
  ]

  const totalExpenses = Object.values(DRE_DATA.operationalExpenses).reduce((a, b) => a + b, 0)
  const grossMargin = ((DRE_DATA.grossProfit / DRE_DATA.netRevenue) * 100).toFixed(1)
  const ebitdaMargin = ((DRE_DATA.ebitda / DRE_DATA.netRevenue) * 100).toFixed(1)
  const netMargin = ((DRE_DATA.netIncome / DRE_DATA.netRevenue) * 100).toFixed(1)

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
            <option value="09/2026">Competência: Setembro / 2026</option>
            <option value="08/2026">Competência: Agosto / 2026</option>
            <option value="07/2026">Competência: Julho / 2026</option>
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
            <span className="text-xs text-slate-400 font-normal">({formatCurrency(DRE_DATA.grossProfit)})</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Margem EBITDA</span>
          <div className="text-2xl font-extrabold text-cyan-400 mt-2 font-mono flex items-baseline gap-2">
            <span>{ebitdaMargin}%</span>
            <span className="text-xs text-slate-400 font-normal">({formatCurrency(DRE_DATA.ebitda)})</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Margem Líquida</span>
          <div className="text-2xl font-extrabold text-emerald-400 mt-2 font-mono flex items-baseline gap-2">
            <span>{netMargin}%</span>
            <span className="text-xs text-slate-400 font-normal">({formatCurrency(DRE_DATA.netIncome)})</span>
          </div>
        </div>
      </div>

      {/* Grid Principal: Tabela DRE e Gráfico de Despesas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Tabela DRE Analítica (2 colunas) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <h2 className="text-base font-bold text-white tracking-tight">Estrutura de Resultados - {selectedMonth}</h2>

          <div className="divide-y divide-slate-800 text-xs">
            
            {/* Receita Bruta */}
            <div className="py-3 flex items-center justify-between font-bold text-white text-sm">
              <span>(+) RECEITA BRUTA DE VENDAS & SERVIÇOS</span>
              <span className="font-mono text-cyan-400">{formatCurrency(DRE_DATA.grossRevenue)}</span>
            </div>

            {/* Impostos */}
            <div className="py-2.5 flex items-center justify-between text-slate-400 pl-4">
              <span>(-) Deduções da Receita & Tributos (DAS / IRPJ / CSLL / ISS)</span>
              <span className="font-mono text-rose-400">({formatCurrency(DRE_DATA.taxes)})</span>
            </div>

            {/* Receita Líquida */}
            <div className="py-3 flex items-center justify-between font-bold text-slate-200 bg-slate-800/30 px-3 rounded-xl">
              <span>(=) RECEITA OPERACIONAL LÍQUIDA</span>
              <span className="font-mono text-white">{formatCurrency(DRE_DATA.netRevenue)}</span>
            </div>

            {/* Custos Diretos */}
            <div className="py-2.5 flex items-center justify-between text-slate-400 pl-4">
              <span>(-) Custos Diretos / Insumos / Serviços Prestados (CMV/CSP)</span>
              <span className="font-mono text-rose-400">({formatCurrency(DRE_DATA.cogs)})</span>
            </div>

            {/* Lucro Bruto */}
            <div className="py-3 flex items-center justify-between font-bold text-slate-200 bg-slate-800/30 px-3 rounded-xl">
              <span>(=) LUCRO BRUTO OPERACIONAL</span>
              <span className="font-mono text-white">{formatCurrency(DRE_DATA.grossProfit)}</span>
            </div>

            {/* Despesas Operacionais */}
            <div className="py-2.5 space-y-2 pl-4">
              <span className="font-semibold text-slate-300 block">(-) DESPESAS OPERACIONAIS</span>
              
              <div className="space-y-1.5 pl-4 text-slate-400">
                <div className="flex justify-between">
                  <span>• Despesas com Pessoal & Folha</span>
                  <span className="font-mono">({formatCurrency(DRE_DATA.operationalExpenses.payroll)})</span>
                </div>
                <div className="flex justify-between">
                  <span>• Marketing & Aquisição de Clientes</span>
                  <span className="font-mono">({formatCurrency(DRE_DATA.operationalExpenses.marketing)})</span>
                </div>
                <div className="flex justify-between">
                  <span>• Administrativas, Aluguel & Facilities</span>
                  <span className="font-mono">({formatCurrency(DRE_DATA.operationalExpenses.administrative)})</span>
                </div>
                <div className="flex justify-between">
                  <span>• Softwares, Servidores & Tecnologia</span>
                  <span className="font-mono">({formatCurrency(DRE_DATA.operationalExpenses.softwareTech)})</span>
                </div>
                <div className="flex justify-between">
                  <span>• Tarifas Bancárias & Encargos</span>
                  <span className="font-mono">({formatCurrency(DRE_DATA.operationalExpenses.financialCharges)})</span>
                </div>
              </div>
            </div>

            {/* EBITDA */}
            <div className="py-3 flex items-center justify-between font-bold text-cyan-300 bg-cyan-950/30 px-3 rounded-xl border border-cyan-800/40">
              <span>(=) EBITDA (Lucro Antes de Juros, Impostos e Depreciação)</span>
              <span className="font-mono">{formatCurrency(DRE_DATA.ebitda)}</span>
            </div>

            {/* Resultado Líquido */}
            <div className="py-4 flex items-center justify-between font-extrabold text-emerald-400 text-base bg-emerald-950/30 px-4 rounded-2xl border border-emerald-700/50">
              <span>(=) RESULTADO LÍQUIDO DO PERÍODO</span>
              <span className="font-mono">{formatCurrency(DRE_DATA.netIncome)}</span>
            </div>

          </div>
        </div>

        {/* Gráfico de Despesas (1 coluna) */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Composição de Custos & Despesas</h2>
            <p className="text-xs text-slate-400 mt-0.5">Distribuição das despesas operacionais no mês</p>

            <div className="h-60 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensesChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {expensesChartData.map((entry, index) => (
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

            <div className="space-y-2 mt-4">
              {expensesChartData.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: EXPENSE_COLORS[idx] }} />
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
