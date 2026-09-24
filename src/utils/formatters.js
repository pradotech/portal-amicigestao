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
      return { label: 'Liquidado', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' }
    case 'overdue':
      return { label: 'Vencido', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20' }
    case 'pending':
      return { label: 'Pendente', bg: 'bg-slate-500/10 text-slate-300 border-slate-500/20' }
    default:
      return { label: status, bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20' }
  }
}
