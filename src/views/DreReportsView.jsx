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
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  DollarSign,
  Scale,
  Zap,
  Target,
  Sparkles,
  Printer,
  CheckCircle2,
  HelpCircle
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line
} from 'recharts'
import { formatCurrency, formatDate } from '../utils/formatters'

const EXPENSE_COLORS = ['#0077B6', '#0096C7', '#48CAE4', '#90E0EF', '#0284C7', '#38BDF8', '#818CF8', '#6366F1', '#10B981', '#F59E0B']

export function DreReportsView({ clients = [], selectedClientId, payables = [], receivables = [] }) {
  const [selectedMonth, setSelectedMonth] = useState('2026-09')
  const [regime, setRegime] = useState('competencia') // 'competencia' | 'caixa'
  const [showShareModal, setShowShareModal] = useState(false)
  const [copiedSummary, setCopiedSummary] = useState(false)

  const client = clients.find(c => c.id === selectedClientId) || clients[0]

  // Calcula o mês anterior para Análise Horizontal (AH%)
  const previousMonth = useMemo(() => {
    const [yearStr, monthStr] = selectedMonth.split('-')
    let y = parseInt(yearStr, 10)
    let m = parseInt(monthStr, 10) - 1
    if (m === 0) {
      m = 12
      y -= 1
    }
    return `${y}-${String(m).padStart(2, '0')}`
  }, [selectedMonth])

  // Função auxiliar de filtragem por competência ou caixa
  const filterByRegime = (items, targetMonth, type) => {
    return items.filter(item => {
      if (regime === 'caixa') {
        const isAcquitted = item.status === 'paid' || item.status === 'received' || item.status === 'liquidated' || item.status === 'PAGO' || item.status === 'QUITADO'
        if (!isAcquitted) return false
        const paymentDate = item.paymentDate || item.receiptDate || item.paidAt || item.data_baixa || item.dueDate || item.due_date || ''
        return paymentDate.startsWith(targetMonth)
      } else {
        // Regime de Competência
        const dueDate = item.dueDate || item.due_date || item.competenceDate || item.emissao || ''
        return dueDate.startsWith(targetMonth)
      }
    })
  }

  // Lançamentos do Mês Atual
  const currentReceivables = useMemo(() => filterByRegime(receivables, selectedMonth, 'rec'), [receivables, selectedMonth, regime])
  const currentPayables = useMemo(() => filterByRegime(payables, selectedMonth, 'pay'), [payables, selectedMonth, regime])

  // Lançamentos do Mês Anterior (para Análise Horizontal)
  const prevReceivables = useMemo(() => filterByRegime(receivables, previousMonth, 'rec'), [receivables, previousMonth, regime])
  const prevPayables = useMemo(() => filterByRegime(payables, previousMonth, 'pay'), [payables, previousMonth, regime])

  // =========================================================================
  // MOTOR DE CÁLCULO CONTÁBIL DA DRE (MÊS ATUAL)
  // =========================================================================
  // 1. Receita Bruta
  const grossRevenue = currentReceivables.reduce((acc, r) => acc + (Number(r.amount) || 0), 0)

  // 2. Impostos e Deduções da Receita
  const isTaxCategory = (cat) => {
    const c = (cat || '').toLowerCase()
    return c.includes('imposto') || c.includes('tribut') || c.includes('darf') || c.includes('das') || c.includes('simples nacional') || c.includes('icms') || c.includes('iss')
  }
  const taxPayables = currentPayables.filter(p => isTaxCategory(p.category || p.category_name))
  const taxes = taxPayables.reduce((acc, p) => acc + (Number(p.amount) || 0), 0)
  const netRevenue = Math.max(0, grossRevenue - taxes)

  // 3. Custos Diretos / CMV / CSP (Variáveis)
  const isCostCategory = (cat) => {
    const c = (cat || '').toLowerCase()
    return c.includes('insumo') || c.includes('matéria') || c.includes('materia') || c.includes('frete') || c.includes('logística') || c.includes('logistica') || c.includes('fornecedor') || c.includes('mercadoria')
  }
  const costPayables = currentPayables.filter(p => !isTaxCategory(p.category || p.category_name) && isCostCategory(p.category || p.category_name))
  const cogs = costPayables.reduce((acc, p) => acc + (Number(p.amount) || 0), 0)
  const grossProfit = netRevenue - cogs

  // 4. Despesas Financeiras vs Operacionais
  const isFinancialCategory = (cat) => {
    const c = (cat || '').toLowerCase()
    return c.includes('bancár') || c.includes('bancar') || c.includes('tarifa') || c.includes('juros') || c.includes('multa') || c.includes('taxa de boleto') || c.includes('iof')
  }
  const financialPayables = currentPayables.filter(p => isFinancialCategory(p.category || p.category_name))
  const financialExpenses = financialPayables.reduce((acc, p) => acc + (Number(p.amount) || 0), 0)

  // 5. Despesas Operacionais Gerais (Fixas + Administrativas)
  const operationalPayables = currentPayables.filter(p => !isTaxCategory(p.category || p.category_name) && !isCostCategory(p.category || p.category_name) && !isFinancialCategory(p.category || p.category_name))
  const operationalExpensesTotal = operationalPayables.reduce((acc, p) => acc + (Number(p.amount) || 0), 0)

  // 6. EBITDA, Resultado Financeiro e Lucro Líquido
  const ebitda = grossProfit - operationalExpensesTotal
  const financialResult = -financialExpenses // Despesas Financeiras reduzem o resultado
  const netIncome = ebitda + financialResult

  // =========================================================================
  // MOTOR DE CÁLCULO CONTÁBIL DA DRE (MÊS ANTERIOR - PARA AH%)
  // =========================================================================
  const prevGrossRevenue = prevReceivables.reduce((acc, r) => acc + (Number(r.amount) || 0), 0)
  const prevTaxes = prevPayables.filter(p => isTaxCategory(p.category || p.category_name)).reduce((acc, p) => acc + (Number(p.amount) || 0), 0)
  const prevNetRevenue = Math.max(0, prevGrossRevenue - prevTaxes)
  const prevCogs = prevPayables.filter(p => !isTaxCategory(p.category || p.category_name) && isCostCategory(p.category || p.category_name)).reduce((acc, p) => acc + (Number(p.amount) || 0), 0)
  const prevGrossProfit = prevNetRevenue - prevCogs
  const prevOperationalExpenses = prevPayables.filter(p => !isTaxCategory(p.category || p.category_name) && !isCostCategory(p.category || p.category_name) && !isFinancialCategory(p.category || p.category_name)).reduce((acc, p) => acc + (Number(p.amount) || 0), 0)
  const prevEbitda = prevGrossProfit - prevOperationalExpenses
  const prevFinancialExpenses = prevPayables.filter(p => isFinancialCategory(p.category || p.category_name)).reduce((acc, p) => acc + (Number(p.amount) || 0), 0)
  const prevNetIncome = prevEbitda - prevFinancialExpenses

  // =========================================================================
  // MARGENS E INDICADORES ESTRATÉGICOS (AV%, AH%, BREAK-EVEN)
  // =========================================================================
  const calcAV = (val) => (grossRevenue > 0 ? ((val / grossRevenue) * 100).toFixed(1) : '0.0')
  const calcAH = (current, previous) => {
    if (!previous || previous === 0) return current > 0 ? '+100.0%' : '0.0%'
    const diff = ((current - previous) / Math.abs(previous)) * 100
    return `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`
  }

  const grossMargin = grossRevenue > 0 ? ((grossProfit / grossRevenue) * 100).toFixed(1) : '0.0'
  const ebitdaMargin = grossRevenue > 0 ? ((ebitda / grossRevenue) * 100).toFixed(1) : '0.0'
  const netMargin = grossRevenue > 0 ? ((netIncome / grossRevenue) * 100).toFixed(1) : '0.0'

  // Ponto de Equilíbrio Operacional (Break-Even Point)
  // Custos Fixos = Despesas Operacionais + Despesas Financeiras
  // Margem de Contribuição % = (Receita Bruta - Custos Diretos - Impostos) / Receita Bruta
  const fixedExpenses = operationalExpensesTotal + financialExpenses
  const contributionMarginRatio = grossRevenue > 0 ? (grossProfit / grossRevenue) : 0
  const breakEvenPoint = contributionMarginRatio > 0 ? (fixedExpenses / contributionMarginRatio) : 0
  const safetyMarginRatio = grossRevenue > breakEvenPoint && grossRevenue > 0
    ? (((grossRevenue - breakEvenPoint) / grossRevenue) * 100).toFixed(1)
    : '0.0'

  // Agrupamento por categoria para o gráfico de pizza
  const expensesByCategory = useMemo(() => {
    const map = {}
    currentPayables.forEach(p => {
      const cat = p.category || p.category_name || 'Outras Despesas'
      map[cat] = (map[cat] || 0) + (Number(p.amount) || 0)
    })
    const entries = Object.entries(map).map(([name, value]) => ({ name, value }))
    return entries.length > 0 ? entries : [{ name: 'Sem despesas no período', value: 0 }]
  }, [currentPayables])

  // Histórico de 6 Meses para o Gráfico de Evolução de Desempenho
  const historicalTrend = useMemo(() => {
    const months = ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09']
    const monthLabels = {
      '2026-04': 'Abr',
      '2026-05': 'Mai',
      '2026-06': 'Jun',
      '2026-07': 'Jul',
      '2026-08': 'Ago',
      '2026-09': 'Set'
    }

    return months.map(m => {
      const mRec = filterByRegime(receivables, m, 'rec')
      const mPay = filterByRegime(payables, m, 'pay')
      const recTot = mRec.reduce((acc, r) => acc + (Number(r.amount) || 0), 0)
      const payTot = mPay.reduce((acc, p) => acc + (Number(p.amount) || 0), 0)
      const ebitdaVal = recTot - payTot

      return {
        month: monthLabels[m] || m,
        receita: recTot,
        despesas: payTot,
        resultado: ebitdaVal
      }
    })
  }, [receivables, payables, regime])

  // Exportar Relatório DRE Executivo em PDF com Logo Oficial Amici
  const handleExportPDF = () => {
    const companyName = client?.tradeName || client?.corporateName || 'Drillex Indústria e Serviços'
    const corporateName = client?.corporateName || companyName
    const cnpj = client?.cnpj || '12.345.678/0001-90'
    const taxRegime = client?.taxRegime || 'Lucro Presumido'
    const regimeLabel = regime === 'competencia' ? 'Regime de Competência' : 'Regime de Caixa'
    const emissionDate = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    const monthNames = {
      '2026-09': 'Setembro / 2026',
      '2026-08': 'Agosto / 2026',
      '2026-07': 'Julho / 2026',
      '2026-06': 'Junho / 2026',
      '2026-05': 'Maio / 2026',
      '2026-04': 'Abril / 2026'
    }
    const competenceFormatted = monthNames[selectedMonth] || selectedMonth

    const printWindow = window.open('', '_blank', 'width=1100,height=950')
    if (!printWindow) {
      alert('Por favor, autorize a abertura de popups no navegador para gerar o relatório em PDF.')
      return
    }

    // Calcula total de gastos para as barras de categorias
    const totalSpent = expensesByCategory.reduce((acc, c) => acc + (Number(c.value) || 0), 0)

    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>DRE Gerencial Completa - ${companyName} - ${selectedMonth} - Amici Gestão Financeira</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    @page {
      size: A4 portrait;
      margin: 8mm 10mm 8mm 10mm;
    }
    
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #0f172a;
      background: #ffffff;
      font-size: 10px;
      line-height: 1.35;
      padding: 12px;
    }

    .page-break {
      page-break-before: always;
      margin-top: 15px;
    }

    .avoid-break {
      page-break-inside: avoid;
    }

    .header-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2.5px solid #0077B6;
      padding-bottom: 10px;
      margin-bottom: 12px;
    }

    .logo-box {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .company-badge {
      text-align: right;
      font-size: 9.5px;
      color: #475569;
    }

    .company-badge strong {
      color: #0A2540;
      font-size: 13px;
      display: block;
      letter-spacing: -0.2px;
    }

    .report-title-box {
      background: linear-gradient(135deg, #0A2540 0%, #0077B6 100%);
      color: #ffffff;
      padding: 9px 14px;
      border-radius: 8px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 4px rgba(10, 37, 64, 0.1);
    }

    .report-title-box h1 {
      font-size: 14px;
      font-weight: 800;
      letter-spacing: 0.3px;
    }

    .report-title-box .meta {
      font-size: 9.5px;
      opacity: 0.95;
      text-align: right;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 12px;
    }

    .kpi-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px 10px;
      background: #f8fafc;
    }

    .kpi-card.highlight {
      background: #f0fdf4;
      border-color: #bbf7d0;
    }

    .kpi-card.ebitda {
      background: #ecfeff;
      border-color: #a5f3fc;
    }

    .kpi-card.breakeven {
      background: #fffbeb;
      border-color: #fde68a;
    }

    .kpi-label {
      font-size: 8.5px;
      text-transform: uppercase;
      font-weight: 800;
      color: #64748b;
      margin-bottom: 2px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .kpi-badge {
      font-size: 7.5px;
      padding: 1px 4px;
      border-radius: 4px;
      font-weight: 700;
    }

    .kpi-val {
      font-size: 15px;
      font-weight: 900;
      font-family: 'JetBrains Mono', monospace;
      color: #0A2540;
    }

    .kpi-sub {
      font-size: 8.5px;
      color: #64748b;
      margin-top: 3px;
      border-top: 1px dashed #e2e8f0;
      padding-top: 2px;
      display: flex;
      justify-content: space-between;
    }

    table.dre-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      font-size: 9.5px;
    }

    table.dre-table th {
      background: #0A2540;
      color: #ffffff;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 8.5px;
      letter-spacing: 0.5px;
      padding: 5px 8px;
      border: 1px solid #0A2540;
    }

    table.dre-table td {
      padding: 4.5px 8px;
      border: 1px solid #e2e8f0;
    }

    .row-revenue {
      background-color: #f0f9ff !important;
      font-weight: 800;
      color: #0369a1;
    }

    .row-total {
      background-color: #f8fafc;
      font-weight: 700;
      color: #0f172a;
    }

    .row-ebitda {
      background-color: #ecfeff !important;
      font-weight: 900;
      color: #0e7490;
      font-size: 10px;
    }

    .row-net-income {
      background-color: #ecfdf5 !important;
      font-weight: 900;
      color: #047857;
      font-size: 10.5px;
    }

    .row-detail {
      font-size: 8.5px;
      color: #64748b;
      background-color: #ffffff;
    }

    .text-right {
      text-align: right;
    }

    .text-center {
      text-align: center;
    }

    .font-mono {
      font-family: 'JetBrains Mono', monospace;
    }

    .negative {
      color: #be123c;
    }

    .positive {
      color: #047857;
    }

    .section-title {
      font-size: 11px;
      font-weight: 800;
      color: #0A2540;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
      padding-bottom: 3px;
      border-bottom: 1.5px solid #0077B6;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .two-col-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 12px;
    }

    .box-panel {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px 10px;
      background: #ffffff;
    }

    .cat-bar-container {
      margin-bottom: 5px;
    }

    .cat-bar-header {
      display: flex;
      justify-content: space-between;
      font-size: 8.5px;
      margin-bottom: 2px;
    }

    .cat-bar-track {
      width: 100%;
      height: 5px;
      background-color: #f1f5f9;
      border-radius: 3px;
      overflow: hidden;
    }

    .cat-bar-fill {
      height: 100%;
      border-radius: 3px;
    }

    .hist-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9px;
      margin-top: 4px;
    }

    .hist-table th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 8px;
      padding: 4px 6px;
      border: 1px solid #e2e8f0;
    }

    .hist-table td {
      padding: 4px 6px;
      border: 1px solid #e2e8f0;
    }

    .footer-container {
      margin-top: 10px;
      padding-top: 6px;
      border-top: 1px solid #cbd5e1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8px;
      color: #64748b;
    }

    .signatures-box {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 16px;
      padding-top: 8px;
    }

    .signature-line {
      border-top: 1px solid #0f172a;
      text-align: center;
      padding-top: 4px;
      font-size: 9px;
      font-weight: 700;
      color: #0A2540;
    }

    .signature-line span {
      display: block;
      font-size: 8px;
      font-weight: 400;
      color: #64748b;
    }

    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>

  <!-- 1. CABEÇALHO COM LOGO OFICIAL AMICI GESTÃO FINANCEIRA -->
  <div class="header-container">
    <div class="logo-box">
      <svg viewBox="0 0 140 140" style="width: 42px; height: 42px; flex-shrink: 0;" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="70" cy="70" r="62" stroke="#0077B6" stroke-width="9" />
        <path d="M 40 108 L 74 24 L 92 68" stroke="#0A2540" stroke-width="11" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M 22 66 Q 65 62 118 108" stroke="#0077B6" stroke-width="10" stroke-linecap="round" fill="none" />
        <path d="M 32 108 C 36 96 46 92 56 104" stroke="#0A2540" stroke-width="6" stroke-linecap="round" fill="none" />
      </svg>
      <div>
        <div style="font-size: 19px; font-weight: 900; letter-spacing: 1px; color: #0A2540; line-height: 1;">AMICI</div>
        <div style="font-size: 8px; font-weight: 700; letter-spacing: 2px; color: #0077B6; text-transform: uppercase; margin-top: 2px;">GESTÃO FINANCEIRA</div>
      </div>
    </div>

    <div class="company-badge">
      <strong>${corporateName}</strong>
      <span>CNPJ: ${cnpj} • ${taxRegime}</span>
    </div>
  </div>

  <!-- 2. TÍTULO DO RELATÓRIO -->
  <div class="report-title-box">
    <div>
      <h1>DRE GERENCIAL & DEMONSTRATIVO DE RESULTADOS</h1>
    </div>
    <div class="meta">
      <div><strong>${competenceFormatted}</strong> • ${regimeLabel}</div>
    </div>
  </div>

  <!-- 3. CARDS DE KPIS EXECUTIVOS -->
  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">
        <span>Receita Bruta</span>
        <span class="kpi-badge" style="background: #e0f2fe; color: #0369a1;">100.0% AV</span>
      </div>
      <div class="kpi-val">${formatCurrency(grossRevenue)}</div>
      <div class="kpi-sub">
        <span>Mês Anterior:</span>
        <strong class="font-mono">${formatCurrency(prevGrossRevenue)}</strong>
      </div>
    </div>

    <div class="kpi-card">
      <div class="kpi-label">
        <span>Margem Bruta</span>
        <span class="kpi-badge" style="background: #e0f2fe; color: #0369a1;">Operacional</span>
      </div>
      <div class="kpi-val">${grossMargin}%</div>
      <div class="kpi-sub">
        <span>Lucro Bruto:</span>
        <strong class="font-mono text-sky-900">${formatCurrency(grossProfit)}</strong>
      </div>
    </div>

    <div class="kpi-card ebitda">
      <div class="kpi-label">
        <span style="color: #0891b2;">Margem EBITDA</span>
        <span class="kpi-badge" style="background: #cffafe; color: #0e7490;">${ebitdaMargin}%</span>
      </div>
      <div class="kpi-val" style="color: #0e7490;">${formatCurrency(ebitda)}</div>
      <div class="kpi-sub">
        <span>EBITDA Mês Ant.:</span>
        <strong class="font-mono">${formatCurrency(prevEbitda)}</strong>
      </div>
    </div>

    <div class="kpi-card highlight">
      <div class="kpi-label">
        <span style="color: #059669;">Margem Líquida</span>
        <span class="kpi-badge" style="background: #dcfce7; color: #15803d;">${netMargin}%</span>
      </div>
      <div class="kpi-val" style="color: #047857;">${formatCurrency(netIncome)}</div>
      <div class="kpi-sub">
        <span>Resultado Final:</span>
        <strong class="font-mono">${calcAH(netIncome, prevNetIncome)} MoM</strong>
      </div>
    </div>
  </div>

  <!-- 4. TABELA DRE ANALÍTICA COMPLETA COM AV%, AH% E CONTAS ANALÍTICAS -->
  <div class="avoid-break">
    <table class="dre-table">
      <thead>
        <tr>
          <th style="width: 44%;">ESTRUTURA DE CONTAS CONTÁBEIS</th>
          <th style="width: 18%;" class="text-right">COMPETÊNCIA ${selectedMonth}</th>
          <th style="width: 10%;" class="text-right">AV%</th>
          <th style="width: 18%;" class="text-right">MÊS ANTERIOR (${previousMonth})</th>
          <th style="width: 10%;" class="text-right">AH% (MoM)</th>
        </tr>
      </thead>
      <tbody>
        
        {/* 1. RECEITA BRUTA */}
        <tr class="row-revenue">
          <td><strong>(+) RECEITA BRUTA DE VENDAS & SERVIÇOS</strong></td>
          <td class="text-right font-mono"><strong>${formatCurrency(grossRevenue)}</strong></td>
          <td class="text-right font-mono"><strong>100.0%</strong></td>
          <td class="text-right font-mono">${formatCurrency(prevGrossRevenue)}</td>
          <td class="text-right font-mono positive"><strong>${calcAH(grossRevenue, prevGrossRevenue)}</strong></td>
        </tr>

        {/* 2. DEDUÇÕES E TRIBUTOS */}
        <tr>
          <td style="padding-left: 18px;">(-) Deduções da Receita & Tributos (DAS / IRPJ / CSLL / ISS)</td>
          <td class="text-right font-mono negative">(${formatCurrency(taxes)})</td>
          <td class="text-right font-mono">${calcAV(taxes)}%</td>
          <td class="text-right font-mono">(${formatCurrency(prevTaxes)})</td>
          <td class="text-right font-mono">${calcAH(taxes, prevTaxes)}</td>
        </tr>

        {/* 3. RECEITA LÍQUIDA */}
        <tr class="row-total">
          <td style="padding-left: 12px;"><strong>(=) RECEITA OPERACIONAL LÍQUIDA</strong></td>
          <td class="text-right font-mono"><strong>${formatCurrency(netRevenue)}</strong></td>
          <td class="text-right font-mono"><strong>${calcAV(netRevenue)}%</strong></td>
          <td class="text-right font-mono">${formatCurrency(prevNetRevenue)}</td>
          <td class="text-right font-mono positive"><strong>${calcAH(netRevenue, prevNetRevenue)}</strong></td>
        </tr>

        {/* 4. CUSTOS DIRETO / CMV / CSP */}
        <tr>
          <td style="padding-left: 18px;">(-) Custos Diretos / Insumos / Serviços Prestados (CMV/CSP)</td>
          <td class="text-right font-mono negative">(${formatCurrency(cogs)})</td>
          <td class="text-right font-mono">${calcAV(cogs)}%</td>
          <td class="text-right font-mono">(${formatCurrency(prevCogs)})</td>
          <td class="text-right font-mono">${calcAH(cogs, prevCogs)}</td>
        </tr>

        {/* 5. LUCRO BRUTO */}
        <tr class="row-total">
          <td style="padding-left: 12px;"><strong>(=) LUCRO BRUTO OPERACIONAL</strong></td>
          <td class="text-right font-mono"><strong>${formatCurrency(grossProfit)}</strong></td>
          <td class="text-right font-mono"><strong>${calcAV(grossProfit)}%</strong></td>
          <td class="text-right font-mono">${formatCurrency(prevGrossProfit)}</td>
          <td class="text-right font-mono positive"><strong>${calcAH(grossProfit, prevGrossProfit)}</strong></td>
        </tr>

        {/* 6. DESPESAS OPERACIONAIS */}
        <tr style="background-color: #f8fafc; font-weight: 700;">
          <td style="padding-left: 14px;">(-) DESPESAS OPERACIONAIS GERAIS (Fixas & Administrativas)</td>
          <td class="text-right font-mono negative"><strong>(${formatCurrency(operationalExpensesTotal)})</strong></td>
          <td class="text-right font-mono"><strong>${calcAV(operationalExpensesTotal)}%</strong></td>
          <td class="text-right font-mono">(${formatCurrency(prevOperationalExpenses)})</td>
          <td class="text-right font-mono">${calcAH(operationalExpensesTotal, prevOperationalExpenses)}</td>
        </tr>

        {/* DETALHAMENTO ANALÍTICO DAS DESPESAS OPERACIONAIS */}
        ${operationalPayables.slice(0, 8).map(p => `
          <tr class="row-detail">
            <td style="padding-left: 26px;">• ${p.supplier || p.description || 'Despesa'} (${p.category || 'Geral'})</td>
            <td class="text-right font-mono">(${formatCurrency(p.amount)})</td>
            <td class="text-right font-mono">${calcAV(p.amount)}%</td>
            <td class="text-right font-mono text-center">-</td>
            <td class="text-right font-mono text-center">-</td>
          </tr>
        `).join('')}

        {/* 7. EBITDA */}
        <tr class="row-ebitda">
          <td style="padding-left: 12px;"><strong>(=) EBITDA (Lucro Operacional Antes de Juros e Impostos)</strong></td>
          <td class="text-right font-mono"><strong>${formatCurrency(ebitda)}</strong></td>
          <td class="text-right font-mono"><strong>${calcAV(ebitda)}%</strong></td>
          <td class="text-right font-mono">${formatCurrency(prevEbitda)}</td>
          <td class="text-right font-mono positive"><strong>${calcAH(ebitda, prevEbitda)}</strong></td>
        </tr>

        {/* 8. RESULTADO FINANCEIRO */}
        <tr>
          <td style="padding-left: 18px;">(-) Despesas Financeiras & Tarifas Bancárias (C6 Bank)</td>
          <td class="text-right font-mono negative">(${formatCurrency(financialExpenses)})</td>
          <td class="text-right font-mono">${calcAV(financialExpenses)}%</td>
          <td class="text-right font-mono">(${formatCurrency(prevFinancialExpenses)})</td>
          <td class="text-right font-mono">${calcAH(financialExpenses, prevFinancialExpenses)}</td>
        </tr>

        {/* 9. LUCRO LÍQUIDO */}
        <tr class="row-net-income">
          <td style="padding-left: 12px;"><strong>(=) RESULTADO LÍQUIDO DO PERÍODO (LUCRO LÍQUIDO)</strong></td>
          <td class="text-right font-mono"><strong>${formatCurrency(netIncome)}</strong></td>
          <td class="text-right font-mono"><strong>${calcAV(netIncome)}%</strong></td>
          <td class="text-right font-mono">${formatCurrency(prevNetIncome)}</td>
          <td class="text-right font-mono positive"><strong>${calcAH(netIncome, prevNetIncome)}</strong></td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- 5. BLOCO: COMPOSIÇÃO DE DESPESAS + INDICADORES ESTRATÉGICOS -->
  <div class="two-col-grid avoid-break">
    
    <!-- Painel 1: Composição de Gastos com Barras Visuais -->
    <div class="box-panel">
      <div class="section-title">Composição de Gastos por Categoria</div>
      <div style="margin-top: 4px;">
        ${expensesByCategory.map((item, idx) => {
          const pct = totalSpent > 0 ? ((item.value / totalSpent) * 100).toFixed(1) : '0.0'
          const colors = ['#0077B6', '#0096C7', '#48CAE4', '#0284C7', '#6366F1', '#10B981', '#F59E0B', '#EC4899']
          const color = colors[idx % colors.length]
          return `
            <div class="cat-bar-container">
              <div class="cat-bar-header">
                <span><strong>${item.name}</strong></span>
                <span class="font-mono">${formatCurrency(item.value)} (<strong>${pct}%</strong>)</span>
              </div>
              <div class="cat-bar-track">
                <div class="cat-bar-fill" style="width: ${pct}%; background-color: ${color};"></div>
              </div>
            </div>
          `
        }).join('')}
      </div>
    </div>

    <!-- Painel 2: Indicadores Estratégicos & Break-Even -->
    <div class="box-panel">
      <div class="section-title">Indicadores de Ponto de Equilíbrio</div>
      <table style="width: 100%; font-size: 9px; border-collapse: collapse; margin-top: 4px;">
        <tbody>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 3px 0; color: #475569;">Ponto de Equilíbrio (Break-Even):</td>
            <td style="padding: 3px 0; text-align: right; font-weight: 800;" class="font-mono text-slate-900">${formatCurrency(breakEvenPoint)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 3px 0; color: #475569;">Margem de Segurança:</td>
            <td style="padding: 3px 0; text-align: right; font-weight: 800;" class="font-mono positive">+${safetyMarginRatio}% (${formatCurrency(Math.max(0, grossRevenue - breakEvenPoint))})</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 3px 0; color: #475569;">Despesas Fixas Totais:</td>
            <td style="padding: 3px 0; text-align: right; font-weight: 700;" class="font-mono">${formatCurrency(fixedExpenses)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 3px 0; color: #475569;">Margem de Contribuição:</td>
            <td style="padding: 3px 0; text-align: right; font-weight: 700;" class="font-mono">${(contributionMarginRatio * 100).toFixed(1)}% (${formatCurrency(grossProfit)})</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 3px 0; color: #475569;">Alavancagem Operacional:</td>
            <td style="padding: 3px 0; text-align: right; font-weight: 700; color: #0284c7;" class="font-mono">${grossProfit > 0 && ebitda > 0 ? (grossProfit / ebitda).toFixed(2) + 'x' : '1.00x'}</td>
          </tr>
          <tr>
            <td style="padding: 3px 0; color: #475569;">Status de Performance:</td>
            <td style="padding: 3px 0; text-align: right; font-weight: 800; color: #047857;">Operação Superavitária</td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>

  <!-- 6. BLOCO: EVOLUÇÃO HISTÓRICA DOS ÚLTIMOS 6 MESES (GRÁFICO / TABELA) -->
  <div class="box-panel avoid-break" style="margin-bottom: 12px;">
    <div class="section-title">Evolução Histórica de Resultados (Últimos 6 Meses)</div>
    <table class="hist-table">
      <thead>
        <tr>
          <th>Mês</th>
          <th class="text-right">Receita Bruta (R$)</th>
          <th class="text-right">Custos & Despesas (R$)</th>
          <th class="text-right">Resultado Líquido (R$)</th>
          <th class="text-right">Margem Líquida</th>
          <th style="width: 25%;">Comparativo Visual</th>
        </tr>
      </thead>
      <tbody>
        ${historicalTrend.map(row => {
          const pctNet = row.receita > 0 ? ((row.resultado / row.receita) * 100).toFixed(1) : '0.0'
          const maxVal = Math.max(...historicalTrend.map(t => t.receita || 1))
          const recWidth = ((row.receita / maxVal) * 100).toFixed(0)
          const desWidth = ((row.despesas / maxVal) * 100).toFixed(0)
          return `
            <tr>
              <td><strong>${row.month}</strong></td>
              <td class="text-right font-mono font-bold text-sky-900">${formatCurrency(row.receita)}</td>
              <td class="text-right font-mono negative">(${formatCurrency(row.despesas)})</td>
              <td class="text-right font-mono font-bold ${row.resultado >= 0 ? 'positive' : 'negative'}">${formatCurrency(row.resultado)}</td>
              <td class="text-right font-mono font-bold ${row.resultado >= 0 ? 'positive' : 'negative'}">${pctNet}%</td>
              <td>
                <div style="display: flex; flex-direction: column; gap: 1px;">
                  <div style="height: 3px; background-color: #0077B6; width: ${recWidth}%; border-radius: 2px;" title="Receita"></div>
                  <div style="height: 3px; background-color: #f43f5e; width: ${desWidth}%; border-radius: 2px;" title="Despesas"></div>
                </div>
              </td>
            </tr>
          `
        }).join('')}
      </tbody>
    </table>
  </div>

  <!-- 7. ASSINATURAS E VALIDAÇÃO FORMAL -->
  <div class="signatures-box avoid-break">
    <div class="signature-line">
      AMICI GESTÃO FINANCEIRA
      <span>BPO Financeiro & Controladoria Contábil</span>
    </div>
    <div class="signature-line">
      ${corporateName}
      <span>Diretoria Financeira / Responsável</span>
    </div>
  </div>

  <!-- 8. RODAPÉ INSTITUCIONAL AMICI -->
  <div class="footer-container avoid-break">
    <div>
      <strong style="color: #0A2540;">Amici Gestão Financeira</strong> • Relatório Gerencial emitido via Integração Oficial Conta Azul API
    </div>
    <div>
      <span>Emissão: <strong>${emissionDate}</strong> • Documento Confidencial</span>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 450);
    };
  </script>
</body>
</html>
    `

    printWindow.document.open()
    printWindow.document.write(htmlContent)
    printWindow.document.close()
  }

  // Exportar DRE como Planilha CSV / Excel
  const handleExportCSV = () => {
    const headers = ['Estrutura Contábil', `Competência ${selectedMonth} (R$)`, 'Análise Vertical (AV%)', `Mês Anterior ${previousMonth} (R$)`, 'Análise Horizontal (AH%)']
    const rows = [
      ['(+) RECEITA BRUTA DE VENDAS & SERVIÇOS', grossRevenue.toFixed(2), '100.0%', prevGrossRevenue.toFixed(2), calcAH(grossRevenue, prevGrossRevenue)],
      ['(-) Deduções da Receita & Tributos', (-taxes).toFixed(2), `${calcAV(taxes)}%`, (-prevTaxes).toFixed(2), calcAH(taxes, prevTaxes)],
      ['(=) RECEITA OPERACIONAL LÍQUIDA', netRevenue.toFixed(2), `${calcAV(netRevenue)}%`, prevNetRevenue.toFixed(2), calcAH(netRevenue, prevNetRevenue)],
      ['(-) Custos Diretos / CMV / Insumos / Fretes', (-cogs).toFixed(2), `${calcAV(cogs)}%`, (-prevCogs).toFixed(2), calcAH(cogs, prevCogs)],
      ['(=) LUCRO BRUTO OPERACIONAL', grossProfit.toFixed(2), `${calcAV(grossProfit)}%`, prevGrossProfit.toFixed(2), calcAH(grossProfit, prevGrossProfit)],
      ['(-) Despesas Operacionais Gerais', (-operationalExpensesTotal).toFixed(2), `${calcAV(operationalExpensesTotal)}%`, (-prevOperationalExpenses).toFixed(2), calcAH(operationalExpensesTotal, prevOperationalExpenses)],
      ['(=) EBITDA (Lucro Operacional)', ebitda.toFixed(2), `${calcAV(ebitda)}%`, prevEbitda.toFixed(2), calcAH(ebitda, prevEbitda)],
      ['(-) Despesas Financeiras & Tarifas Bancárias', (-financialExpenses).toFixed(2), `${calcAV(financialExpenses)}%`, (-prevFinancialExpenses).toFixed(2), calcAH(financialExpenses, prevFinancialExpenses)],
      ['(=) RESULTADO LÍQUIDO DO EXERCÍCIO', netIncome.toFixed(2), `${calcAV(netIncome)}%`, prevNetIncome.toFixed(2), calcAH(netIncome, prevNetIncome)]
    ]

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `DRE_Amici_${client?.tradeName || 'Cliente'}_${selectedMonth}_${regime}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Copiar Resumo Executivo para WhatsApp / E-mail
  const handleCopySummary = () => {
    const text = `📊 *RESUMO EXECUTIVO DRE - AMICI GESTÃO FINANCEIRA*
🏢 *Empresa:* ${client?.tradeName || 'Drillex'}
📅 *Competência:* ${selectedMonth} (${regime === 'competencia' ? 'Regime de Competência' : 'Regime de Caixa'})

💰 *Receita Bruta:* ${formatCurrency(grossRevenue)}
📦 *Custos Diretos (CMV):* ${formatCurrency(cogs)} (${calcAV(cogs)}%)
🏢 *Despesas Operacionais:* ${formatCurrency(operationalExpensesTotal)} (${calcAV(operationalExpensesTotal)}%)
🏦 *Despesas Financeiras:* ${formatCurrency(financialExpenses)} (${calcAV(financialExpenses)}%)
-------------------------------------
⚡ *EBITDA Operacional:* ${formatCurrency(ebitda)} (Margem: ${ebitdaMargin}%)
🏆 *Resultado Líquido:* ${formatCurrency(netIncome)} (Margem: ${netMargin}%)
🎯 *Ponto de Equilíbrio:* ${formatCurrency(breakEvenPoint)} (Margem Segurança: ${safetyMarginRatio}%)
-------------------------------------
_Gerado automaticamente via Portal Amici BPO Financeiro & Conta Azul API_`

    navigator.clipboard.writeText(text)
    setCopiedSummary(true)
    setTimeout(() => setCopiedSummary(false), 3000)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. CABEÇALHO COM CONTROLES (TEXTOS NO TOPO E BOTÕES NA LINHA DE BAIXO) */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        
        {/* Bloco Superior: Título e Identificação da Empresa */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-600">
            <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Demonstração de Resultados Contábeis & BPO</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileSpreadsheet className="w-7 h-7 text-sky-600 flex-shrink-0" />
            <span>DRE Gerencial & Demonstrativos</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            {client?.corporateName || 'Drillex Indústria e Serviços'} • Regime Tributário: <strong className="text-slate-700">{client?.taxRegime || 'Lucro Presumido'}</strong>
          </p>
        </div>

        {/* Bloco Inferior: Barra de Controles e Botões de Ação */}
        <div className="no-print print:hidden pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          
          {/* Lado Esquerdo: Filtros de Regime e Competência */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Alternador de Regime (Competência x Caixa) */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner">
              <button
                type="button"
                onClick={() => setRegime('competencia')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  regime === 'competencia'
                    ? 'bg-gradient-to-r from-sky-600 to-cyan-600 text-white font-bold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Competência
              </button>
              <button
                type="button"
                onClick={() => setRegime('caixa')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  regime === 'caixa'
                    ? 'bg-gradient-to-r from-sky-600 to-cyan-600 text-white font-bold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Caixa
              </button>
            </div>

            {/* Seletor de Mês */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-sky-900 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer shadow-sm"
            >
              <option value="2026-09">Competência: Setembro / 2026</option>
              <option value="2026-08">Competência: Agosto / 2026</option>
              <option value="2026-07">Competência: Julho / 2026</option>
              <option value="2026-06">Competência: Junho / 2026</option>
              <option value="2026-05">Competência: Maio / 2026</option>
              <option value="2026-04">Competência: Abril / 2026</option>
            </select>
          </div>

          {/* Lado Direito: Ações de Exportação */}
          <div className="flex items-center gap-2.5">
            {/* Botão Exportar Excel / CSV */}
            <button
              type="button"
              onClick={handleExportCSV}
              title="Exportar planilha DRE com Análise Vertical e Horizontal"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-sky-600" />
              <span>Exportar CSV</span>
            </button>

            {/* Botão Exportar PDF com Logo Amici */}
            <button
              type="button"
              onClick={handleExportPDF}
              title="Gerar e salvar Relatório Oficial DRE em PDF com Logotipo Amici Gestão Financeira"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white text-xs font-bold transition-all shadow-md shadow-sky-900/20 active:scale-95 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Exportar PDF</span>
            </button>
          </div>

        </div>
      </div>

      {/* 2. CARDS DE KPIS EXECUTIVOS (MARGENS, EBITDA, PONTO DE EQUILÍBRIO) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Margem Bruta */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Margem Bruta</span>
            <span className="text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200 text-[10px]">AV: {grossMargin}%</span>
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono">
            {grossMargin}%
          </div>
          <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>Lucro Bruto:</span>
            <strong className="text-sky-800 font-mono">{formatCurrency(grossProfit)}</strong>
          </div>
        </div>

        {/* Card 2: Margem EBITDA */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-cyan-600">
            <span>Margem EBITDA</span>
            <span className="text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200 text-[10px]">Operacional</span>
          </div>
          <div className="text-3xl font-black text-cyan-700 font-mono">
            {ebitdaMargin}%
          </div>
          <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>EBITDA Apurado:</span>
            <strong className="text-cyan-800 font-mono">{formatCurrency(ebitda)}</strong>
          </div>
        </div>

        {/* Card 3: Margem Líquida */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-emerald-600">
            <span>Margem Líquida</span>
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">Final</span>
          </div>
          <div className="text-3xl font-black text-emerald-600 font-mono">
            {netMargin}%
          </div>
          <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>Resultado Líquido:</span>
            <strong className="text-emerald-800 font-mono">{formatCurrency(netIncome)}</strong>
          </div>
        </div>

        {/* Card 4: Ponto de Equilíbrio (Break-Even Point) */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-amber-600">
            <span className="flex items-center gap-1">
              <Target className="w-3.5 h-3.5" /> Ponto de Equilíbrio
            </span>
            <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-[10px] font-bold">
              +{safetyMarginRatio}%
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {formatCurrency(breakEvenPoint)}
          </div>
          <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>Margem Segurança:</span>
            <strong className="text-amber-800 font-mono">{formatCurrency(Math.max(0, grossRevenue - breakEvenPoint))}</strong>
          </div>
        </div>

      </div>

      {/* 3. TABELA DRE ANALÍTICA COMPLETA COM AV% E AH% */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Demonstração do Resultado Analítica</h2>
            <p className="text-xs text-slate-500">
              Estrutura Contábil com Análise Vertical (AV%) e Evolução em Relação ao Mês Anterior (AH% MoM).
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 w-fit">
            Exibição: {regime === 'competencia' ? 'Regime de Competência' : 'Regime de Caixa'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[11px]">
                <th className="py-3 px-4">Estrutura de Contas Contábeis</th>
                <th className="py-3 px-4 text-right">Competência {selectedMonth}</th>
                <th className="py-3 px-3 text-right">AV%</th>
                <th className="py-3 px-4 text-right">Mês Anterior ({previousMonth})</th>
                <th className="py-3 px-3 text-right">AH% (MoM)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              
              {/* 1. RECEITA BRUTA */}
              <tr className="font-bold text-slate-900 bg-sky-50/40">
                <td className="py-3 px-4 flex items-center gap-2">
                  <span className="text-sky-600 font-black">(+)</span>
                  <span>RECEITA BRUTA DE VENDAS & SERVIÇOS</span>
                </td>
                <td className="py-3 px-4 text-right font-mono text-sm text-sky-900 font-extrabold">{formatCurrency(grossRevenue)}</td>
                <td className="py-3 px-3 text-right font-mono text-slate-600 font-bold">100.0%</td>
                <td className="py-3 px-4 text-right font-mono text-slate-500">{formatCurrency(prevGrossRevenue)}</td>
                <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">{calcAH(grossRevenue, prevGrossRevenue)}</td>
              </tr>

              {/* 2. DEDUÇÕES E IMPOSTOS */}
              <tr className="text-slate-600 hover:bg-slate-50/80 transition-colors">
                <td className="py-2.5 px-4 pl-8 text-slate-700">
                  (-) Deduções da Receita & Tributos (DAS / IRPJ / CSLL / ISS)
                </td>
                <td className="py-2.5 px-4 text-right font-mono text-rose-700 font-semibold">({formatCurrency(taxes)})</td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-500">{calcAV(taxes)}%</td>
                <td className="py-2.5 px-4 text-right font-mono text-slate-400">({formatCurrency(prevTaxes)})</td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-600">{calcAH(taxes, prevTaxes)}</td>
              </tr>

              {/* 3. RECEITA OPERACIONAL LÍQUIDA */}
              <tr className="font-bold text-slate-900 bg-slate-50 border-t-2 border-b-2 border-slate-200">
                <td className="py-3 px-4 pl-6">(=) RECEITA OPERACIONAL LÍQUIDA</td>
                <td className="py-3 px-4 text-right font-mono text-slate-900">{formatCurrency(netRevenue)}</td>
                <td className="py-3 px-3 text-right font-mono text-slate-700">{calcAV(netRevenue)}%</td>
                <td className="py-3 px-4 text-right font-mono text-slate-500">{formatCurrency(prevNetRevenue)}</td>
                <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">{calcAH(netRevenue, prevNetRevenue)}</td>
              </tr>

              {/* 4. CUSTOS DIRETO / CMV / CSP */}
              <tr className="text-slate-600 hover:bg-slate-50/80 transition-colors">
                <td className="py-2.5 px-4 pl-8 text-slate-700">
                  (-) Custos Diretos / Insumos / Serviços Prestados (CMV/CSP)
                </td>
                <td className="py-2.5 px-4 text-right font-mono text-rose-700 font-semibold">({formatCurrency(cogs)})</td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-500">{calcAV(cogs)}%</td>
                <td className="py-2.5 px-4 text-right font-mono text-slate-400">({formatCurrency(prevCogs)})</td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-600">{calcAH(cogs, prevCogs)}</td>
              </tr>

              {/* 5. LUCRO BRUTO OPERACIONAL */}
              <tr className="font-bold text-sky-950 bg-sky-50/30">
                <td className="py-3 px-4 pl-6">(=) LUCRO BRUTO OPERACIONAL</td>
                <td className="py-3 px-4 text-right font-mono text-sky-900">{formatCurrency(grossProfit)}</td>
                <td className="py-3 px-3 text-right font-mono text-sky-800">{calcAV(grossProfit)}%</td>
                <td className="py-3 px-4 text-right font-mono text-slate-500">{formatCurrency(prevGrossProfit)}</td>
                <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">{calcAH(grossProfit, prevGrossProfit)}</td>
              </tr>

              {/* 6. DESPESAS OPERACIONAIS GERAIS */}
              <tr className="text-slate-700 font-semibold bg-slate-50/40">
                <td className="py-2.5 px-4 pl-8">(-) DESPESAS OPERACIONAIS GERAIS (Fixas & Administrativas)</td>
                <td className="py-2.5 px-4 text-right font-mono text-rose-700">({formatCurrency(operationalExpensesTotal)})</td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-500">{calcAV(operationalExpensesTotal)}%</td>
                <td className="py-2.5 px-4 text-right font-mono text-slate-400">({formatCurrency(prevOperationalExpenses)})</td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-600">{calcAH(operationalExpensesTotal, prevOperationalExpenses)}</td>
              </tr>

              {/* Detalhamento de Despesas Operacionais por Categoria */}
              {operationalPayables.slice(0, 7).map(p => (
                <tr key={p.id} className="text-[11px] text-slate-500 hover:bg-slate-50/50">
                  <td className="py-1.5 px-4 pl-12 truncate max-w-xs">
                    • {p.supplier || p.description} ({p.category || 'Geral'})
                  </td>
                  <td className="py-1.5 px-4 text-right font-mono text-slate-600">({formatCurrency(p.amount)})</td>
                  <td className="py-1.5 px-3 text-right font-mono text-slate-400">{calcAV(p.amount)}%</td>
                  <td className="py-1.5 px-4 text-right font-mono text-slate-400">-</td>
                  <td className="py-1.5 px-3 text-right font-mono text-slate-400">-</td>
                </tr>
              ))}

              {/* 7. EBITDA */}
              <tr className="font-extrabold text-cyan-950 bg-cyan-50/60 border-t-2 border-b-2 border-cyan-200">
                <td className="py-3.5 px-4 pl-6 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-600" />
                  <span>(=) EBITDA (Lucro Operacional Antes de Juros e Tributos)</span>
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-base text-cyan-900">{formatCurrency(ebitda)}</td>
                <td className="py-3.5 px-3 text-right font-mono text-cyan-800 font-black">{calcAV(ebitda)}%</td>
                <td className="py-3.5 px-4 text-right font-mono text-slate-600">{formatCurrency(prevEbitda)}</td>
                <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-700">{calcAH(ebitda, prevEbitda)}</td>
              </tr>

              {/* 8. RESULTADO FINANCEIRO */}
              <tr className="text-slate-600 hover:bg-slate-50/80 transition-colors">
                <td className="py-2.5 px-4 pl-8 text-slate-700">
                  (-) Despesas Financeiras & Tarifas Bancárias (C6 Bank)
                </td>
                <td className="py-2.5 px-4 text-right font-mono text-rose-700 font-semibold">({formatCurrency(financialExpenses)})</td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-500">{calcAV(financialExpenses)}%</td>
                <td className="py-2.5 px-4 text-right font-mono text-slate-400">({formatCurrency(prevFinancialExpenses)})</td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-600">{calcAH(financialExpenses, prevFinancialExpenses)}</td>
              </tr>

              {/* 9. RESULTADO LÍQUIDO DO EXERCÍCIO */}
              <tr className="font-black text-emerald-950 bg-emerald-50 border-t-2 border-emerald-300">
                <td className="py-4 px-4 pl-6 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>(=) RESULTADO LÍQUIDO DO PERÍODO (LUCRO LÍQUIDO)</span>
                </td>
                <td className="py-4 px-4 text-right font-mono text-lg text-emerald-800">{formatCurrency(netIncome)}</td>
                <td className="py-4 px-3 text-right font-mono text-emerald-700 text-sm">{calcAV(netIncome)}%</td>
                <td className="py-4 px-4 text-right font-mono text-slate-600">{formatCurrency(prevNetIncome)}</td>
                <td className="py-4 px-3 text-right font-mono font-black text-emerald-700 text-sm">{calcAH(netIncome, prevNetIncome)}</td>
              </tr>

            </tbody>
          </table>
        </div>
      </div>

      {/* 4. GRÁFICOS INTEGRADOS (COMPOSIÇÃO DE DESPESAS + EVOLUÇÃO HISTÓRICA) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico 1: Composição de Custos & Despesas por Categoria */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold text-slate-900">Composição de Gastos</h3>
              <PieIcon className="w-4 h-4 text-sky-600" />
            </div>
            <p className="text-xs text-slate-500">Distribuição por Categoria Conta Azul no mês</p>

            <div className="h-56 w-full mt-4">
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
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '11px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
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
                    <span className="text-slate-700 truncate">{item.name}</span>
                  </div>
                  <span className="font-mono text-slate-600 font-bold">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleCopySummary}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-bold text-xs transition-all shadow-md active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{copiedSummary ? '✓ Resumo Copiado para WhatsApp!' : 'Copiar Resumo Executivo'}</span>
            </button>
          </div>
        </div>

        {/* Gráfico 2: Evolução de Desempenho Histórico (6 Meses) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div>
                <h3 className="text-base font-bold text-slate-900">Evolução Histórica de Resultados (6 Meses)</h3>
                <p className="text-xs text-slate-500">Comparativo consolidado de Receitas vs Despesas e Lucro Líquido</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-sky-700 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-600" /> Receitas
                </span>
                <span className="flex items-center gap-1.5 text-rose-700 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Despesas
                </span>
                <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Resultado
                </span>
              </div>
            </div>

            <div className="h-72 w-full mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={historicalTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={10} tickFormatter={(val) => `R$ ${val / 1000}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '11px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    formatter={(value) => [formatCurrency(value), '']}
                  />
                  <Bar dataKey="receita" fill="#0077B6" radius={[6, 6, 0, 0]} name="Receita Bruta" />
                  <Bar dataKey="despesas" fill="#F43F5E" radius={[6, 6, 0, 0]} name="Custos & Despesas" />
                  <Bar dataKey="resultado" fill="#10B981" radius={[6, 6, 0, 0]} name="Resultado Líquido" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500">
            <span>Período analisado: <strong>Abril/2026 a Setembro/2026</strong></span>
            <span className="text-sky-700 font-bold">Amici BPO • Monitoramento Contínuo</span>
          </div>
        </div>

      </div>

    </div>
  )
}
