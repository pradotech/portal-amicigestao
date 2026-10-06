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

  const isLight = theme === 'light'

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden selection:bg-cyan-500 selection:text-white transition-colors ${
      isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      
      {/* Botão de Alternância de Tema no Topo Direito */}
      {onToggleTheme && (
        <div className="absolute top-6 right-6 z-20">
          <button
            type="button"
            onClick={onToggleTheme}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border backdrop-blur-md transition-all text-xs font-semibold shadow-sm ${
              isLight
                ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700/60 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40'
            }`}
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
      <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none ${isLight ? 'bg-cyan-500/10' : 'bg-cyan-500/10'}`} />
      <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none ${isLight ? 'bg-sky-500/10' : 'bg-sky-500/10'}`} />
      <div className={`absolute inset-0 [background-size:24px_24px] pointer-events-none ${
        isLight
          ? 'bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] opacity-40'
          : 'bg-[radial-gradient(#1e293b_1px,transparent_1px)] opacity-20'
      }`} />

      {/* Card Principal de Login */}
      <div className={`w-full max-w-md border backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-6 ${
        isLight ? 'bg-white/95 border-slate-200' : 'bg-slate-900/90 border-slate-800'
      }`}>
        
        {/* Cabeçalho com Logo Amici */}
        <div className="text-center space-y-2">
          <div className="inline-block mx-auto mb-2">
            <AmiciLogo variant={theme === 'dark' ? 'dark' : 'light'} className="h-12 mx-auto" />
          </div>
          <h1 className={`text-2xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Portal Financeiro & BPO
          </h1>
          <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Acesso restrito e protegido via <strong>Supabase</strong>
          </p>
        </div>

        {/* Mensagens de Alerta (Erro ou Sucesso) */}
        {errorMessage && (
          <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 animate-in fade-in ${
            isLight ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}>
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 animate-in fade-in ${
            isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          }`}>
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Formulário de Login */}
        <form onSubmit={handleLogin} className="space-y-4">
          
          <div className="space-y-1.5">
            <label className={`text-[11px] font-semibold uppercase tracking-wider ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              E-mail Corporativo
            </label>
            <div className="relative">
              <Mail className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@empresa.com.br"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                    : 'bg-slate-950 border-slate-800 text-white placeholder-slate-500'
                }`}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className={`text-[11px] font-semibold uppercase tracking-wider ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Senha de Acesso
              </label>
            </div>
            <div className="relative">
              <Lock className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                    : 'bg-slate-950 border-slate-800 text-white placeholder-slate-500'
                }`}
              />
            </div>
          </div>

          <div className={`flex items-center justify-between text-xs pt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-cyan-600 focus:ring-cyan-500"
              />
              <span>Lembrar meu acesso</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-600 via-cyan-600 to-sky-600 hover:from-sky-500 hover:to-cyan-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-cyan-900/20 flex items-center justify-center gap-2 group active:scale-[0.99]"
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
        <div className={`pt-2 border-t flex items-center justify-between text-[11px] ${
          isLight ? 'border-slate-200 text-slate-500' : 'border-slate-800/60 text-slate-500'
        }`}>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Supabase RLS Ativo</span>
          </div>
          <span className={`font-mono text-[10px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            {creds.isConfigured ? 'Supabase Conectado' : 'Modo Local'}
          </span>
        </div>

      </div>

    </div>
  )
}
