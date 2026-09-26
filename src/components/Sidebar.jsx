import React from 'react'
import {
  LayoutDashboard,
  CreditCard,
  TrendingUp,
  Scale,
  FileSpreadsheet,
  Settings,
  Sparkles,
  Building2,
  ArrowLeft,
  Sun,
  Moon,
  X
} from 'lucide-react'

export function Sidebar({
  activeTab,
  onSelectTab,
  counts = {},
  clientName = 'Drillex',
  onBackToLanding,
  theme = 'light',
  onToggleTheme,
  isMobileOpen = false,
  onCloseMobileMenu
}) {
  const isLight = theme === 'light'

  const menuItems = [
    { id: 'dashboard', label: `Visão Geral (${clientName})`, icon: LayoutDashboard, badge: null },
    {
      id: 'suppliers',
      label: 'Contas a Pagar',
      icon: CreditCard,
      badge: counts.pendingPayables || null,
      badgeColor: isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-500/20 text-amber-300'
    },
    {
      id: 'customers',
      label: 'Contas a Receber',
      icon: TrendingUp,
      badge: counts.receivablesCount || null,
      badgeColor: isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-500/20 text-emerald-300'
    },
    {
      id: 'reconciliation',
      label: 'Bancos & Conciliação',
      icon: Scale,
      badge: counts.pendingReconciliation || null,
      badgeColor: isLight ? 'bg-cyan-100 text-cyan-800 border-cyan-300' : 'bg-cyan-500/20 text-cyan-300'
    },
    {
      id: 'dre',
      label: 'DRE & Categorias',
      icon: FileSpreadsheet,
      badge: '135 itens',
      badgeColor: isLight ? 'bg-sky-100 text-sky-800 border-sky-300' : 'bg-sky-500/20 text-sky-300'
    },
    { id: 'settings', label: 'Configurações', icon: Settings, badge: null }
  ]

  const handleItemClick = (tabId) => {
    onSelectTab(tabId)
    if (onCloseMobileMenu) {
      onCloseMobileMenu()
    }
  }

  const renderContent = (isDrawer = false) => (
    <div className="flex flex-col justify-between h-full space-y-6">
      <div className="space-y-6">
        
        {/* Topo do Drawer Mobile com Botão de Fechar */}
        {isDrawer && (
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-sky-700 dark:text-cyan-400">
              <Sparkles className="w-4 h-4 text-sky-600" />
              <span>Menu de Navegação</span>
            </div>
            <button
              type="button"
              onClick={onCloseMobileMenu}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 transition-colors"
              title="Fechar menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Card do Cliente em Atendimento */}
        <div className={`p-3.5 rounded-2xl border space-y-2 transition-colors ${
          isLight ? 'bg-slate-50 border-slate-200 shadow-sm' : 'bg-slate-900/90 border-slate-800 shadow-inner'
        }`}>
          <div className="flex items-center justify-between text-[11px]">
            <span className={`uppercase font-semibold tracking-wider text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Cliente Ativo</span>
            <button
              type="button"
              onClick={() => {
                onBackToLanding()
                if (onCloseMobileMenu) onCloseMobileMenu()
              }}
              className="text-cyan-600 hover:text-cyan-700 font-semibold text-[11px] hover:underline focus:outline-none"
            >
              Trocar
            </button>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-600 to-sky-700 text-white font-bold flex items-center justify-center text-sm shadow-md shadow-cyan-950/20 flex-shrink-0">
              {clientName.charAt(0)}
            </div>
            <div className="truncate min-w-0">
              <div className={`font-bold text-sm truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{clientName}</div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Conta Azul Ativa</span>
              </div>
            </div>
          </div>
        </div>

        {/* Seção Principal do Menu */}
        <div>
          <div className={`px-3 mb-2.5 text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
            Navegação Principal
          </div>
          <nav className="space-y-1.5">
            {menuItems.map(item => {
              const Icon = item.icon
              const isActive = activeTab === item.id

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all relative group focus:outline-none focus:ring-0 ${
                    isActive
                      ? (isLight
                          ? 'bg-sky-50 text-sky-800 border border-sky-300 shadow-sm'
                          : 'bg-gradient-to-r from-cyan-950/60 to-slate-900 text-white border border-cyan-500/40 shadow-sm shadow-cyan-950/30')
                      : (isLight
                          ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent')
                  }`}
                >
                  {isActive && (
                    <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r ${
                      isLight ? 'bg-sky-600' : 'bg-cyan-400 shadow-sm shadow-cyan-400/80'
                    }`} />
                  )}

                  <div className="flex items-center gap-3 truncate min-w-0">
                    <Icon className={`w-4 h-4 transition-colors flex-shrink-0 ${
                      isActive
                        ? (isLight ? 'text-sky-700' : 'text-cyan-400')
                        : (isLight ? 'text-slate-500 group-hover:text-slate-800' : 'text-slate-400 group-hover:text-slate-200')
                    }`} />
                    <span className={`truncate ${
                      isActive
                        ? (isLight ? 'text-sky-900 font-bold' : 'text-white')
                        : (isLight ? 'text-slate-700 group-hover:text-slate-900' : 'text-slate-400 group-hover:text-slate-200')
                    }`}>
                      {item.label}
                    </span>
                  </div>

                  {item.badge && (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${item.badgeColor || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Rotina do Analista Amici */}
        <div className={`p-3.5 rounded-2xl border text-xs transition-colors ${
          isLight
            ? 'bg-sky-50/70 border-sky-200 shadow-sm text-slate-700'
            : 'bg-gradient-to-b from-slate-900/90 to-slate-950 border-slate-800/90 text-slate-400 shadow-inner'
        }`}>
          <div className={`flex items-center gap-2 font-semibold mb-1 ${isLight ? 'text-sky-800' : 'text-cyan-400'}`}>
            <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Rotina BPO Amici</span>
          </div>
          <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Conciliação bancária diária do banco C6 e conferência dos pagamentos da Drillex.
          </p>
        </div>

      </div>

      {/* Footer com Toggle de Tema e Trocar de Empresa */}
      <div className={`pt-4 border-t space-y-2 ${isLight ? 'border-slate-200' : 'border-slate-800/80'}`}>
        {onToggleTheme && (
          <button
            type="button"
            onClick={onToggleTheme}
            className={`w-full flex items-center justify-between py-2 px-3 rounded-xl border text-xs font-semibold transition-all shadow-sm focus:outline-none ${
              isLight
                ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {isLight ? <Moon className="w-3.5 h-3.5 text-cyan-700" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
              <span>{isLight ? 'Modo Escuro' : 'Modo Claro'}</span>
            </div>
            <span className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
              isLight ? 'bg-sky-100 text-sky-800' : 'bg-slate-800 text-cyan-400'
            }`}>{theme}</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            onBackToLanding()
            if (onCloseMobileMenu) onCloseMobileMenu()
          }}
          className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all shadow-sm focus:outline-none ${
            isLight
              ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900'
              : 'bg-slate-900 hover:bg-slate-800 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
          }`}
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
          <span>Trocar de Empresa</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* 1. SIDEBAR DESKTOP (Fixa em telas md ou maiores) */}
      <aside className={`no-print print:hidden w-64 flex-shrink-0 hidden md:flex flex-col justify-between py-6 px-4 backdrop-blur-xl border-r min-h-[calc(100vh-5rem)] transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-950/60 border-slate-800/80 text-slate-100'
      }`}>
        {renderContent(false)}
      </aside>

      {/* 2. DRAWER / GAVETA MOBILE (Aparece ao clicar no Menu Hambúrguer em telas menores) */}
      {isMobileOpen && (
        <div className="no-print print:hidden fixed inset-0 z-50 md:hidden animate-in fade-in duration-200">
          
          {/* Overlay escuro de fundo com blur */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobileMenu}
          />

          {/* Painel lateral deslizante */}
          <div className={`fixed inset-y-0 left-0 w-72 max-w-[85vw] z-50 p-5 shadow-2xl flex flex-col justify-between overflow-y-auto transform transition-transform duration-300 animate-in slide-in-from-left ${
            isLight ? 'bg-white border-r border-slate-200 text-slate-800' : 'bg-slate-950 border-r border-slate-800 text-slate-100'
          }`}>
            {renderContent(true)}
          </div>
        </div>
      )}
    </>
  )
}

