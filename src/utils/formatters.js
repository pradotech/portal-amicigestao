export function formatCurrency(value) {
  if (value === undefined || value === null || isNaN(value)) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

export function formatDate(dateString) {
  if (!dateString) return '-'
  try {
    const [year, month, day] = dateString.split('T')[0].split('-')
    if (!year || !month || !day) return dateString
    return `${day}/${month}/${year}`
  } catch {
    return dateString
  }
}

export function normalizeDate(dateString) {
  if (!dateString) return ''
  try {
    const clean = String(dateString).trim()
    if (clean.includes('/')) {
      const parts = clean.split('/')
      if (parts.length === 3) {
        const [day, month, year] = parts
        return `${year.padStart(4, '20')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      }
    }
    const isoPart = clean.split('T')[0]
    const [y, m, d] = isoPart.split('-')
    if (y && m && d) {
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
    }
    return isoPart
  } catch {
    return String(dateString)
  }
}

export function isDateInRange(dateString, startDate, endDate) {
  if (!dateString) return false
  const target = normalizeDate(dateString)
  const start = normalizeDate(startDate)
  const end = normalizeDate(endDate)
  if (!start && !end) return true
  if (start && !end) return target >= start
  if (!start && end) return target <= end
  return target >= start && target <= end
}

export const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

export function getMonthName(monthIndex) {
  return MONTH_NAMES[monthIndex] || ''
}

export function formatMonthYear(year, month) {
  const mIdx = typeof month === 'number' ? month - 1 : parseInt(month, 10) - 1
  return `${MONTH_NAMES[mIdx] || month} de ${year}`
}

export function formatCNPJ(cnpj) {
  if (!cnpj) return ''
  const cleaned = cnpj.replace(/\D/g, '')
  if (cleaned.length !== 14) return cnpj
  return cleaned.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

export function getStatusBadge(status) {
  switch (status) {
    case 'connected':
      return { label: 'Conectado', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' }
    case 'expired':
      return { label: 'Token Expirado', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20' }
    case 'disconnected':
      return { label: 'Desconectado', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20' }
    case 'syncing':
      return { label: 'Sincronizando', bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' }
    case 'scheduled':
      return { label: 'Agendado no Banco', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20' }
    case 'pending_client':
      return { label: 'Aguardando Cliente', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20' }
    case 'approved':
      return { label: 'Aprovado', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' }
    case 'paid':
    case 'received':
      return { label: 'Pago', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' }
    case 'partial':
    case 'PAGO_PARCIAL':
      return { label: 'Pago Parcial', bg: 'bg-sky-500/10 text-sky-300 border-sky-500/20' }
    case 'overdue':
      return { label: 'Vencido', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20' }
    case 'pending':
      return { label: 'Em Aberto', bg: 'bg-amber-500/10 text-amber-300 border-amber-500/20' }
    default:
      return { label: status || 'Em Aberto', bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20' }
  }
}
