import React, { useState } from 'react'
import {
  Zap,
  Key,
  CheckCircle2,
  AlertTriangle,
  X,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  RefreshCw
} from 'lucide-react'
import {
  saveContaAzulGlobalConfig,
  getContaAzulGlobalConfig,
  getTokenExpirationInfo
} from '../services/contaAzulService'

export function RenewTokenModal({ isOpen, onClose, onTokenUpdated, currentClientName = 'Drillex' }) {
  const [tokenInput, setTokenInput] = useState('')
  const [errorMessage, setErrorMessage] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

  if (!isOpen) return null

  const handleApplyToken = () => {
    setErrorMessage(null)
    setSuccessMessage(null)

    const input = tokenInput.trim()
    if (!input) {
      setErrorMessage('Por favor, cole o novo token ou JSON retornado da Conta Azul.')
      return
    }

    setIsProcessing(true)

    try {
      let accessToken = ''
      let refreshToken = ''
      let companyId = ''
      let userEmail = ''

      // 1. Tentar fazer parse como JSON
      if (input.startsWith('{')) {
        const parsed = JSON.parse(input)
        accessToken = parsed.access_token || parsed.accessToken || ''
        refreshToken = parsed.refresh_token || parsed.refreshToken || ''

        // Tentar decodificar do ID Token se existir
        if (parsed.id_token) {
          try {
            const payload = JSON.parse(atob(parsed.id_token.split('.')[1]))
            userEmail = payload.email || ''
            companyId = payload.ca_company_id || ''
          } catch (e) {
            console.warn('Erro ao ler id_token:', e)
          }
        }
      } else {
        // 2. É o access_token diretamente
        accessToken = input
      }

      if (!accessToken) {
        setErrorMessage('Não foi possível identificar o access_token. Verifique o texto colado.')
        setIsProcessing(false)
        return
      }

      // Validar expiração do token decodificando
      const expInfo = getTokenExpirationInfo(accessToken)
      
      const config = getContaAzulGlobalConfig()
      saveContaAzulGlobalConfig(
        config.clientId,
        config.clientSecret,
        config.redirectUri,
        accessToken,
        refreshToken || config.refreshToken
      )

      setSuccessMessage(`Token atualizado com sucesso! Válido até ${expInfo.expiresAt || '60 minutos'}.`)
      
      setTimeout(() => {
        setIsProcessing(false)
        if (onTokenUpdated) onTokenUpdated(accessToken)
        onClose()
      }, 800)

    } catch (err) {
      setErrorMessage('Formato inválido. Cole o token JWT ou o JSON de autenticação.')
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative z-10">
        
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Renovar Sessão Conta Azul</h3>
              <p className="text-xs text-slate-400">Atualize o token de acesso para a empresa <strong>{currentClientName}</strong></p>
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

        {/* Mensagens de Feedback */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Campo de Inserção de Token */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300">
            Cole o novo <span className="font-mono text-cyan-400">access_token</span> ou a resposta <span className="font-mono text-cyan-400">JSON</span> da Conta Azul:
          </label>
          <textarea
            rows="6"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder={'Cole o token JWT (inicia com "eyJraWQi...") ou o JSON completo:\n{\n  "access_token": "eyJ...",\n  "expires_in": 3600\n}'}
            className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all resize-none"
          />
        </div>

        {/* Informações explicativas */}
        <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Dados protegidos pelo Supabase</span>
          </div>
          <p>
            Mesmo com a sessão da Conta Azul expirada, todos os dados históricos e cadastrais da <strong>{currentClientName}</strong> permanecem salvos e acessíveis no Supabase.
          </p>
        </div>

        {/* Rodapé de Ações */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <a
            href="https://app.contaazul.com"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-slate-400 hover:text-cyan-300 inline-flex items-center gap-1 transition-colors"
          >
            <span>Abrir Conta Azul</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={handleApplyToken}
              disabled={isProcessing}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-xs font-bold text-white shadow-lg shadow-cyan-900/30 flex items-center gap-2 transition-all active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
              <span>{isProcessing ? 'Atualizando...' : 'Salvar & Sincronizar'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
