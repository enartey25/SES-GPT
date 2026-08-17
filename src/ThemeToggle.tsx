import React from 'react'
import { useTheme } from './ThemeContext'

interface ThemeToggleProps {
  className?: string
}

export default function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative w-8 h-8 rounded-full border transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] cursor-pointer flex items-center justify-center overflow-hidden active:scale-95 ${
        isDark
          ? 'bg-[#1e1e24] border-[#383842] text-[#f3f4f6] hover:bg-[#26262e] shadow-xs'
          : 'bg-[#ffffff] border-[#d9d9d9] text-[#1e1e1e] hover:bg-[#f0f0f0] shadow-2xs'
      } ${className}`}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {/* Sun Icon (shown in dark mode) */}
      <span
        className={`absolute inset-0 flex items-center justify-center transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isDark
            ? 'opacity-100 scale-100 rotate-0'
            : 'opacity-0 scale-50 -rotate-90 pointer-events-none'
        }`}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      </span>

      {/* Moon Icon (shown in light mode) */}
      <span
        className={`absolute inset-0 flex items-center justify-center transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          !isDark
            ? 'opacity-100 scale-100 rotate-0'
            : 'opacity-0 scale-50 rotate-90 pointer-events-none'
        }`}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </span>
    </button>
  )
}
