import React, { useState } from 'react'
import {
  Building2,
  Zap,
  Key,
  Code2,
  CheckCircle2,
  AlertTriangle,
  X,
  Sparkles,
  ExternalLink
} from 'lucide-react'

export function AddClientTokenModal({ isOpen, onClose, onSaveClient }) {
  const [mode, setMode] = useState('json') // 'json' | 'form'
  const [jsonInput, setJsonInput] = useState('')
  const [formData, setFormData] = useState({
    tradeName: '',
    corporateName: '',
    cnpj: '',
    segment: 'Serviços & Comércio',
    financialAnalyst: 'Equipe Amici Gestão',
    monthlyFee: 3500,
    clientId: '',
    companyId: '',
    userEmail: '',
    accessToken: '',
    refreshToken: '',
    idToken: ''
  })
  const [parseError, setParseError] = useState('')
  const [parseSuccess, setParseSuccess] = useState('')

  if (!isOpen) return null

  // Processa e extrai automaticamente os dados do JSON fornecido da Conta Azul
  const handleParseJson = () => {
    setParseError('')
    setParseSuccess('')

    if (!jsonInput.trim()) {
      setParseError('Cole o JSON com os tokens da Conta Azul.')
      return
    }

    try {
      const parsed = JSON.parse(jsonInput.trim())
      
      let email = ''
      let companyId = ''
      let clientId = ''

      // Tenta decodificar o ID Token ou Access Token se presentes
      if (parsed.id_token) {
        try {
          const payload = JSON.parse(atob(parsed.id_token.split('.')[1]))
          email = payload.email || ''
          companyId = payload.ca_company_id || ''
          clientId = payload.aud || payload.client_id || ''
        } catch (e) {
          console.warn('Erro ao decodificar id_token:', e)
        }
      }

      if (!email && parsed.access_token) {
        try {
          const payload = JSON.parse(atob(parsed.access_token.split('.')[1]))
          email = payload.username || payload.email || ''
          clientId = payload.client_id || ''
        } catch (e) {
          console.warn('Erro ao decodificar access_token:', e)
        }
      }

      // Sugere nome baseado no e-mail ou company_id
      const suggestedName = email
        ? email.split('@')[0].split('.')[0].toUpperCase()
        : `Cliente #${companyId || 'Novo'}`

      setFormData(prev => ({
        ...prev,
        tradeName: prev.tradeName || suggestedName,
        corporateName: prev.corporateName || `${suggestedName} Ltda`,
        userEmail: email || prev.userEmail,
        companyId: companyId || prev.companyId,
        clientId: clientId || prev.clientId,
        accessToken: parsed.access_token || '',
        refreshToken: parsed.refresh_token || '',
        idToken: parsed.id_token || ''
      }))

      setParseSuccess(`Tokens extraídos com sucesso! Empresa #${companyId || 'Identificada'} (${email})`)
      setMode('form')
    } catch (err) {
      setParseError('JSON inválido. Certifique-se de colar a resposta completa com access_token e refresh_token.')
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.tradeName) return

    const newClient = {
      id: `client-${formData.companyId || Date.now()}`,
      corporateName: formData.corporateName || formData.tradeName,
      tradeName: formData.tradeName,
      cnpj: formData.cnpj || '00.000.000/0001-00',
      email: formData.userEmail || 'financeiro@empresa.com.br',
      phone: '(11) 98765-4321',
      segment: formData.segment,
      taxRegime: 'Simples Nacional',
      financialAnalyst: formData.financialAnalyst,
      planTier: 'BPO Gestão Financeira',
      monthlyFee: parseFloat(formData.monthlyFee) || 3500.00,
      status: 'active',
      contaAzulStatus: formData.accessToken ? 'connected' : 'disconnected',
      lastSync: formData.accessToken ? 'Sincronizado agora' : 'Nunca',
      monthlyRevenue: 280000.00,
      monthlyExpense: 160000.00,
      cashBalance: 195000.00,
      pendingReconciliations: 1,
      payablesToday: 2,
      color: '#0096C7',
      // Credenciais específicas desta empresa
      contaAzulConfig: {
        clientId: formData.clientId,
        companyId: formData.companyId,
        userEmail: formData.userEmail,
        accessToken: formData.accessToken,
        refreshToken: formData.refreshToken,
        idToken: formData.idToken
      }
    }

    onSaveClient(newClient)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Topo do Modal */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Conectar Nova Empresa / Cliente na Amici</h3>
              <p className="text-xs text-slate-400">Adicione uma nova conta Conta Azul para administrar no BPO</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas: Colar JSON vs Formulário Manual */}
        <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setMode('json')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${
              mode === 'json'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Colar JSON da Conta Azul (Automático)</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('form')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${
              mode === 'form'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Dados & Credenciais do Cliente</span>
          </button>
        </div>

        {/* MODO 1: Colar JSON */}
        {mode === 'json' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Cole a resposta JSON da Conta Azul (contendo id_token, access_token, refresh_token):
              </label>
              <textarea
                rows="8"
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder={'{\n  "access_token": "eyJraWQi...",\n  "refresh_token": "...",\n  "token_type": "Bearer",\n  "expires_in": 3600\n}'}
                className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
              />
            </div>

            {parseError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{parseError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleParseJson}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-xs font-semibold text-white shadow-lg shadow-cyan-900/30 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Extrair Dados e Avançar</span>
              </button>
            </div>
          </div>
        )}

        {/* MODO 2: Formulário com os campos prontos */}
        {mode === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {parseSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                <span>{parseSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nome Fantasia / Empresa *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Drillex, Alfa Tech, Nova Indústria..."
                  value={formData.tradeName}
                  onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Razão Social</label>
                <input
                  type="text"
                  placeholder="Ex: Drillex Indústria e Comércio Ltda"
                  value={formData.corporateName}
                  onChange={(e) => setFormData({ ...formData, corporateName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">E-mail da Conta Azul</label>
                <input
                  type="email"
                  placeholder="usuario@empresa.com.br"
                  value={formData.userEmail}
                  onChange={(e) => setFormData({ ...formData, userEmail: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Company ID Conta Azul</label>
                <input
                  type="text"
                  placeholder="Ex: 3272538"
                  value={formData.companyId}
                  onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Segmento</label>
                <input
                  type="text"
                  placeholder="Ex: Indústria, Tecnologia, Clínicas..."
                  value={formData.segment}
                  onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Honorários BPO Amici (R$/mês)</label>
                <input
                  type="number"
                  value={formData.monthlyFee}
                  onChange={(e) => setFormData({ ...formData, monthlyFee: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setMode('json')}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Voltar para JSON
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-xs font-bold text-white shadow-lg shadow-cyan-900/40"
              >
                Salvar & Conectar Empresa no BPO
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  )
}
