import React, { useState } from 'react'
import { AmiciLogo } from './AmiciLogo'
import {
  Building2,
  RefreshCw,
  Database,
  Bell,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  UserCheck,
  ShieldCheck,
  ArrowLeft,
  Zap,
  LogOut,
  Sun,
  Moon,
  Menu
} from 'lucide-react'

export function Navbar({
  selectedClient,
  onBackToLanding,
  viewMode,
  onToggleViewMode,
  isSyncing,
  onTriggerSync,
  supabaseConfigured,
  onOpenSettings,
  currentUser,
  onLogout,
  theme = 'light',
  onToggleTheme,
  onOpenMobileMenu
}) {
  const isLight = theme === 'light'

  return (
    <header className={`no-print print:hidden sticky top-0 z-40 w-full backdrop-blur-xl border-b transition-colors shadow-sm ${
      isLight ? 'bg-white/95 border-slate-200 text-slate-900' : 'bg-slate-950/80 border-slate-800/80 text-slate-100'
    }`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4">
          
          {/* Lado Esquerdo: Menu Hambúrguer (Mobile) + Logo Amici & Botão Trocar Cliente */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Botão Hambúrguer Mobile (Aparece apenas em telas menores que md) */}
            {onOpenMobileMenu && (
              <button
                type="button"
                onClick={onOpenMobileMenu}
                className={`md:hidden p-2 rounded-xl border text-xs font-semibold transition-all shadow-sm focus:outline-none ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200/80 border-slate-200 text-slate-800'
                    : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200'
                }`}
                title="Abrir menu de navegação"
                aria-label="Abrir menu"
              >
                <Menu className="w-5 h-5 text-sky-700 dark:text-cyan-400" />
              </button>
            )}

            {/* Botão Voltar para Seleção de Clientes (Desktop) */}
            <button
              type="button"
              onClick={onBackToLanding}
              className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-sm group ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200/80 border-slate-200 text-slate-700 hover:text-slate-900'
                  : 'bg-slate-900/90 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
              }`}
              title="Voltar para a tela de escolha de clientes"
            >
              <ArrowLeft className={`w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform ${
                isLight ? 'text-slate-500 group-hover:text-cyan-700' : 'text-slate-400 group-hover:text-cyan-400'
              }`} />
              <span className="hidden md:inline">Trocar Cliente</span>
            </button>

            {/* Logotipo Oficial Amici */}
            <div className="flex items-center">
              <AmiciLogo className="h-7 sm:h-9 md:h-10" variant={theme} />
            </div>
            
            {/* Tag da Empresa Ativa */}
            {selectedClient && (
              <div className={`hidden xl:flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold shadow-inner ${
                isLight
                  ? 'bg-sky-50 border-sky-200 text-sky-900'
                  : 'bg-slate-900 border-cyan-500/30 text-cyan-300'
              }`}>
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                <span className={`font-normal ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Empresa:</span>
                <span className="font-bold truncate max-w-[120px]">{selectedClient.tradeName}</span>
              </div>
            )}
          </div>

          {/* Lado Direito: Ações Rápidas do Topo */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            
            {/* Botão de Toggle Light / Dark Mode */}
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                title={isLight ? 'Alternar para Tema Escuro' : 'Alternar para Tema Claro'}
                className={`p-2 sm:px-3 sm:py-2 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200/80 border-slate-200 text-slate-700 hover:text-slate-900'
                    : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-cyan-400'
                }`}
              >
                {isLight ? (
                  <>
                    <Moon className="w-4 h-4 text-cyan-700" />
                    <span className="hidden lg:inline font-medium">Tema Escuro</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span className="hidden lg:inline font-medium">Tema Claro</span>
                  </>
                )}
              </button>
            )}

            {/* Alternar Modo: Visão BPO x Portal do Cliente */}
            <button
              type="button"
              onClick={onToggleViewMode}
              title="Alternar entre a visão de analista Amici e o portal exclusivo do cliente"
              className={`hidden md:flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all border shadow-sm ${
                viewMode === 'bpo'
                  ? (isLight
                      ? 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border-slate-200'
                      : 'bg-slate-900/90 hover:bg-slate-800/80 text-slate-300 border-slate-800')
                  : (isLight
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40')
              }`}
            >
              <UserCheck className={`w-3.5 h-3.5 ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`} />
              <span className="hidden xl:inline">{viewMode === 'bpo' ? 'Visão BPO Amici' : 'Portal do Cliente'}</span>
            </button>

            {/* Botão Sincronizar Conta Azul */}
            <button
              type="button"
              onClick={onTriggerSync}
              disabled={isSyncing}
              title="Sincronizar dados em tempo real com a Conta Azul"
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-md ${
                isSyncing
                  ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800 cursor-wait'
                  : 'bg-gradient-to-r from-sky-600 via-cyan-600 to-teal-600 hover:from-sky-500 hover:to-teal-500 text-white active:scale-95'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isSyncing ? 'Sincronizando...' : 'Sync Conta Azul'}</span>
            </button>

            {/* Perfil do Usuário e Botão de Logout */}
            <div className={`flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-3 border-l ${isLight ? 'border-slate-200' : 'border-slate-800/80'}`}>
              <div className="hidden lg:flex flex-col text-right">
                <span className={`text-xs font-bold truncate max-w-[110px] ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                  {currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'Analista Amici'}
                </span>
                <span className={`text-[10px] font-mono flex items-center justify-end gap-1 ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> BPO Ativo
                </span>
              </div>

              <button
                type="button"
                onClick={onLogout}
                title="Encerrar sessão e voltar para a tela de login"
                className={`p-2 sm:px-3 sm:py-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-semibold ${
                  isLight
                    ? 'bg-slate-100 hover:bg-rose-50 border-slate-200 hover:border-rose-200 text-slate-800 hover:text-rose-700 shadow-sm'
                    : 'bg-slate-900 hover:bg-rose-950/40 border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-300'
                }`}
              >
                <LogOut className={`w-4 h-4 ${isLight ? 'text-slate-700' : 'text-slate-400'}`} />
                <span className="hidden md:inline font-bold">Sair</span>
              </button>
            </div>

          </div>

        </div>
      </div>
    </header>
  )
}

