import React, { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Unhandled UI Exception caught by ErrorBoundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-navy-950 p-8 text-center" style={{ fontFamily: 'var(--font-sans)' }}>
          <div className="w-14 h-14 rounded-2xl bg-rose-400/10 border border-rose-400/30 flex items-center justify-center mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fb7185" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 style={{ fontFamily: 'var(--font-mono)' }} className="text-white font-semibold text-base mb-2">
            Something went wrong loading this view
          </h2>
          <p className="text-slate-400 text-xs max-w-md mb-6 leading-relaxed">
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-cyan-400 text-navy-900 text-xs font-semibold rounded-xl hover:bg-cyan-300 transition-colors cursor-pointer"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            Reload View
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
