import React from 'react'
import {
  LayoutDashboard,
  Truck,
  TrendingUp,
  Scale,
  FileSpreadsheet,
  Zap,
  Settings,
  Sparkles,
  Building2,
  ArrowLeft
} from 'lucide-react'

export function Sidebar({ activeTab, onSelectTab, counts = {}, clientName = 'Drillex', onBackToLanding }) {
  const menuItems = [
    { id: 'dashboard', label: `Visão Geral (${clientName})`, icon: LayoutDashboard, badge: null },
    { id: 'suppliers', label: 'Fornecedores & Pagar', icon: Truck, badge: counts.pendingPayables || null, badgeColor: 'bg-amber-500/20 text-amber-300' },
    { id: 'customers', label: 'Clientes & Receber', icon: TrendingUp, badge: counts.receivablesCount || null, badgeColor: 'bg-emerald-500/20 text-emerald-300' },
    { id: 'reconciliation', label: 'Bancos & Conciliação', icon: Scale, badge: counts.pendingReconciliation || null, badgeColor: 'bg-cyan-500/20 text-cyan-300' },
    { id: 'dre', label: 'DRE & Categorias', icon: FileSpreadsheet, badge: '135 itens', badgeColor: 'bg-sky-500/20 text-sky-300' },
    { id: 'sync', label: 'Integração Conta Azul', icon: Zap, badge: 'API V2', badgeColor: 'bg-emerald-500/20 text-emerald-300' },
    { id: 'settings', label: 'Configurações & Supabase', icon: Settings, badge: null }
  ]

  return (
    <aside className="w-64 flex-shrink-0 hidden md:flex flex-col justify-between py-6 px-4 bg-slate-900/60 border-r border-slate-800/80 min-h-[calc(100vh-5rem)]">
      <div className="space-y-6">
        
        {/* Card do Cliente em Atendimento */}
        <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Cliente em Atendimento:</span>
            <button
              type="button"
              onClick={onBackToLanding}
              className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
            >
              Trocar
            </button>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-sm border border-cyan-500/30">
              {clientName.charAt(0)}
            </div>
            <div className="truncate">
              <div className="font-bold text-white text-sm truncate">{clientName}</div>
              <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Conta Azul Sincronizada</span>
              </div>
            </div>
          </div>
        </div>

        {/* Seção Principal do Menu */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Módulos Financeiros
          </div>
          <nav className="space-y-1">
            {menuItems.map(item => {
              const Icon = item.icon
              const isActive = activeTab === item.id

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-gradient-to-r from-sky-600/20 to-cyan-600/10 text-cyan-300 border border-cyan-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border border-white/5 ${item.badgeColor || 'bg-slate-800 text-slate-400'}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Rotina do Analista Amici */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-b from-slate-800/80 to-slate-800/30 border border-slate-700/60 text-xs">
          <div className="flex items-center gap-2 text-cyan-400 font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Rotina BPO Amici</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Conciliação bancária diária do banco C6 e conferência dos pagamentos da Drillex.
          </p>
        </div>

      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-slate-800/60">
        <button
          type="button"
          onClick={onBackToLanding}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Trocar de Empresa</span>
        </button>
      </div>
    </aside>
  )
}
