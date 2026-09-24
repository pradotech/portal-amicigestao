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
  LogOut
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
  onLogout
}) {
  const [showNotifications, setShowNotifications] = useState(false)

  // Notificações operacionais da Drillex
  const notifications = [
    { id: 1, title: 'API Conta Azul V2 Conectada', desc: 'Sessão ativa como drilex.fin@amicigestao.com.br', time: 'Agora', type: 'success' },
    { id: 2, title: '194 Pessoas Importadas', desc: 'Fornecedores e clientes sincronizados da Drillex', time: 'Há 5 min', type: 'info' },
    { id: 3, title: 'Conta Bancária Ativa', desc: 'C6 Bank PJ conectado com sucesso', time: 'Hoje', type: 'info' }
  ]

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          
          {/* Logo Amici & Botão Voltar para Seleção de Clientes */}
          <div className="flex items-center gap-4 sm:gap-6">
            <button
              type="button"
              onClick={onBackToLanding}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-cyan-600 border border-slate-700 hover:border-cyan-500 text-xs font-semibold text-slate-300 hover:text-white transition-all shadow-sm group"
              title="Voltar para a tela de escolha de clientes"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden sm:inline">Trocar Cliente</span>
            </button>

            <AmiciLogo className="h-9 sm:h-11" />
            
            {/* Tag da Empresa Ativa */}
            {selectedClient && (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-cyan-300 text-xs font-bold">
                <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Empresa: {selectedClient.tradeName}</span>
              </div>
            )}
          </div>

          {/* Ações Rápidas do Topo */}
          <div className="flex items-center gap-3">
            
            {/* Alternar Modo: Visão BPO x Portal do Cliente */}
            <button
              type="button"
              onClick={onToggleViewMode}
              title="Alternar entre a visão de analista Amici e o portal exclusivo do cliente"
              className={`hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
                viewMode === 'bpo'
                  ? 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700'
                  : 'bg-emerald-950/80 text-emerald-400 border-emerald-700/60 shadow-lg shadow-emerald-950/30'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{viewMode === 'bpo' ? 'Visão BPO Amici' : 'Portal do Cliente'}</span>
            </button>

            {/* Botão Sincronizar Conta Azul */}
            <button
              type="button"
              onClick={onTriggerSync}
              disabled={isSyncing}
              title="Sincronizar dados em tempo real com a Conta Azul"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-md ${
                isSyncing
                  ? 'bg-cyan-900/60 text-cyan-300 border border-cyan-700 cursor-wait'
                  : 'bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white shadow-cyan-900/20 active:scale-95'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-cyan-200' : ''}`} />
              <span className="hidden sm:inline">{isSyncing ? 'Sincronizando...' : 'Sync Conta Azul'}</span>
            </button>

            {/* Perfil do Usuário e Botão de Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-200 truncate max-w-[130px]">
                  {currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'Analista Amici'}
                </span>
                <span className="text-[10px] text-cyan-400 font-mono">BPO Conectado</span>
              </div>

              <button
                type="button"
                onClick={onLogout}
                title="Encerrar sessão e voltar para a tela de login"
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-500/50 text-slate-300 hover:text-rose-300 transition-all flex items-center gap-1.5 text-xs font-semibold"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">Sair</span>
              </button>
            </div>

          </div>

        </div>
      </div>
    </header>
  )
}
