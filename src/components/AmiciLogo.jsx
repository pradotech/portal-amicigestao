import React from 'react'

export function AmiciLogo({ className = 'h-10', variant = 'dark', showSubtitle = true }) {
  // Cores institucionais Amici
  const isLight = variant === 'light'
  const primaryColor = isLight ? '#0A2540' : '#FFFFFF'
  const accentColor = '#0077B6'
  const textColor = isLight ? '#0A2540' : '#F8FAFC'
  const subtitleColor = isLight ? '#1E3A8A' : '#94A3B8'

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Emblema Circular com o 'A' Estilizado */}
      <svg
        viewBox="0 0 140 140"
        className="h-full aspect-square flex-shrink-0"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Círculo Externo */}
        <circle
          cx="70"
          cy="70"
          r="62"
          stroke={accentColor}
          strokeWidth="9"
          className="transition-all duration-300"
        />
        
        {/* Arco e haste dinâmica do 'A' */}
        <path
          d="M 40 108 L 74 24 L 92 68"
          stroke={primaryColor}
          strokeWidth="11"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Arco transversal dinâmico */}
        <path
          d="M 22 66 Q 65 62 118 108"
          stroke={accentColor}
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Detalhe inferior esquerdo */}
        <path
          d="M 32 108 C 36 96 46 92 56 104"
          stroke={primaryColor}
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
      </svg>

      {/* Tipografia AMICI GESTÃO FINANCEIRA */}
      <div className="flex flex-col justify-center">
        <span
          className="font-extrabold tracking-wider leading-none text-xl sm:text-2xl"
          style={{ color: textColor, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          AMICI
        </span>
        {showSubtitle && (
          <span
            className="text-[9px] sm:text-[10px] tracking-[0.25em] font-semibold uppercase mt-0.5 leading-tight"
            style={{ color: subtitleColor }}
          >
            Gestão Financeira
          </span>
        )}
      </div>
    </div>
  )
}
