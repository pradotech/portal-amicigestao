import React, { useState } from 'react'
import { AmiciLogo } from '../components/AmiciLogo'
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Sun,
  Moon
} from 'lucide-react'
import { signInWithSupabase, getSupabaseCredentials } from '../services/supabase'

export function LoginView({ onLoginSuccess, theme = 'light', onToggleTheme }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  const creds = getSupabaseCredentials()

  // Submeter Login
  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      setErrorMessage('Por favor, informe seu e-mail e senha para continuar.')
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const result = await signInWithSupabase(email, password)
      if (result.success && result.user) {
        if (rememberMe) {
          localStorage.setItem('amici_user_session', JSON.stringify(result.user))
        }
        onLoginSuccess(result.user)
      } else {
        setErrorMessage(result.error || 'Credenciais inválidas. Verifique seu e-mail e senha.')
      }
    } catch (err) {
      setErrorMessage(err.message || 'Erro ao conectar ao servidor de autenticação.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden selection:bg-cyan-500 selection:text-white">
      
      {/* Botão de Alternância de Tema no Topo Direito */}
      {onToggleTheme && (
        <div className="absolute top-6 right-6 z-20">
          <button
            onClick={onToggleTheme}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700/60 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 backdrop-blur-md transition-all text-xs font-semibold shadow-lg"
            title={`Alternar para tema ${theme === 'light' ? 'Escuro (Dark)' : 'Claro (Light)'}`}
          >
            {theme === 'light' ? (
              <>
                <Moon className="w-4 h-4 text-cyan-600" />
                <span>Modo Escuro</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Modo Claro</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Luzes e Efeitos de Fundo */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

      {/* Card Principal de Login */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-6">
        
        {/* Cabeçalho com Logo Amici */}
        <div className="text-center space-y-2">
          <div className="inline-block mx-auto mb-2">
            <AmiciLogo variant={theme === 'dark' ? 'dark' : 'light'} className="h-12 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Portal Financeiro & BPO
          </h1>
          <p className="text-xs text-slate-400">
            Acesso restrito e protegido via <strong>Supabase</strong>
          </p>
        </div>

        {/* Mensagens de Alerta (Erro ou Sucesso) */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Formulário de Login */}
        <form onSubmit={handleLogin} className="space-y-4">
          
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              E-mail Corporativo
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@empresa.com.br"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                Senha de Acesso
              </label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500"
              />
              <span>Lembrar meu acesso</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-600 via-cyan-600 to-sky-600 hover:from-sky-500 hover:to-cyan-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-cyan-900/30 flex items-center justify-center gap-2 group active:scale-[0.99]"
          >
            {isLoading ? (
              <span>Autenticando no Supabase...</span>
            ) : (
              <>
                <span>Entrar no Sistema</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>

        </form>

        {/* Rodapé de Segurança e RLS */}
        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Supabase RLS Ativo</span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">
            {creds.isConfigured ? 'Supabase Conectado' : 'Modo Local'}
          </span>
        </div>

      </div>

    </div>
  )
}
