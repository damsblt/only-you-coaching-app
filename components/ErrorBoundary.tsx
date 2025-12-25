"use client"

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Only log errors that are not from browser extensions
    if (!this.isExtensionError(error, errorInfo)) {
      console.error('Application error caught by boundary:', error, errorInfo)
    }
  }

  private isExtensionError(error: Error, errorInfo: React.ErrorInfo): boolean {
    const errorString = error.toString() + errorInfo.componentStack
    return (
      errorString.includes('chrome-extension://') ||
      errorString.includes('moz-extension://') ||
      errorString.includes('safari-extension://') ||
      errorString.includes('extension://')
    )
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Une erreur s'est produite
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Désolé, une erreur inattendue s'est produite. Veuillez rafraîchir la page.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.reload()
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Rafraîchir la page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}




