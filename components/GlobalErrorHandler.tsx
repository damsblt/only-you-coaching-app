"use client"

import { useEffect } from 'react'

/**
 * Global error handler that filters out browser extension errors
 * and only logs real application errors
 */
export function GlobalErrorHandler() {
  useEffect(() => {
    // Check if we're in production
    const isProduction = process.env.NODE_ENV === 'production'

    /**
     * Check if an error originates from a browser extension
     */
    const isExtensionError = (error: ErrorEvent | PromiseRejectionEvent): boolean => {
      const filename = 'filename' in error ? (error.filename || '') : ''
      const message = error.message || String(error.reason || '')
      const errorString = String(error.reason || '')
      
      // Get error object and stack trace for additional checking
      const errorObj = 'error' in error ? error.error : error.reason
      const stack = errorObj?.stack || ''
      
      // If filename is empty and message is empty, likely an extension error
      if (!filename && !message && !errorObj) {
        return true
      }
      
      // Check filename patterns
      const isExtensionFile = (
        filename.includes('chrome-extension://') ||
        filename.includes('moz-extension://') ||
        filename.includes('safari-extension://') ||
        filename.includes('extension://') ||
        filename.includes('heuristicsRedefinitions.js') ||
        filename.includes('extensionState.js') ||
        filename.includes('installHook.js') || // React DevTools and other extensions
        filename.includes('overrideMethod') || // Common extension pattern
        (filename.includes('utils.js') && filename.includes('extension'))
      )
      
      // Check stack trace for extension patterns
      const isExtensionStack = (
        stack.includes('chrome-extension://') ||
        stack.includes('moz-extension://') ||
        stack.includes('safari-extension://') ||
        stack.includes('extension://') ||
        stack.includes('installHook.js') ||
        stack.includes('overrideMethod') ||
        stack.includes('heuristicsRedefinitions') ||
        stack.includes('extensionState')
      )
      
      // Check message patterns
      const isExtensionMessage = (
        message.includes('chrome-extension://') ||
        message.includes('moz-extension://') ||
        message.includes('safari-extension://') ||
        message.includes('extension://') ||
        message.includes('installHook') || // React DevTools
        message.includes('overrideMethod') || // Common extension pattern
        message.includes('LoginName is not defined') || // Common extension error
        message.includes('Frame with ID') || // Common extension error
        message.includes('extension port') || // Common extension error
        message.includes('back/forward cache') || // Common extension error
        errorString.includes('chrome-extension://') ||
        errorString.includes('moz-extension://') ||
        errorString.includes('safari-extension://') ||
        errorString.includes('extension://') ||
        errorString.includes('installHook') ||
        errorString.includes('overrideMethod')
      )
      
      // Check for ERR_FILE_NOT_FOUND on extension files
      const isExtensionFileNotFound = (
        (message.includes('ERR_FILE_NOT_FOUND') || errorString.includes('ERR_FILE_NOT_FOUND')) &&
        (filename.includes('heuristicsRedefinitions') ||
         filename.includes('extensionState') ||
         filename.includes('utils.js') ||
         message.includes('heuristicsRedefinitions') ||
         message.includes('extensionState') ||
         errorString.includes('heuristicsRedefinitions') ||
         errorString.includes('extensionState'))
      )
      
      return isExtensionFile || isExtensionMessage || isExtensionFileNotFound || isExtensionStack
    }

    /**
     * Handle global JavaScript errors
     */
    const handleError = (event: ErrorEvent) => {
      // Filter out extension errors
      if (isExtensionError(event)) {
        // Silently ignore extension errors
        event.preventDefault()
        return false
      }

      // Extract error details with fallbacks
      const errorDetails: Record<string, any> = {
        message: event.message || '(no message)',
        filename: event.filename || '(no filename)',
        lineno: event.lineno ?? null,
        colno: event.colno ?? null,
        type: event.type || 'error',
        timeStamp: event.timeStamp ?? null
      }

      // Add error object details if available
      if (event.error) {
        // Check if error object is actually empty (no enumerable properties)
        const errorKeys = Object.keys(event.error)
        const hasErrorProperties = errorKeys.length > 0 || 
          event.error.name || 
          event.error.message || 
          event.error.stack ||
          event.error.toString !== Object.prototype.toString

        if (hasErrorProperties) {
          errorDetails.error = {
            name: event.error.name || 'Error',
            message: event.error.message || '(no error message)',
            stack: event.error.stack || '(no stack trace)',
            toString: typeof event.error.toString === 'function' ? event.error.toString() : String(event.error)
          }
        } else {
          // Empty object, likely extension error
          errorDetails.error = null
        }
      } else {
        errorDetails.error = null
      }

      // Check if this is actually an empty/meaningless error
      const hasMeaningfulInfo = (
        (errorDetails.message !== '(no message)' && errorDetails.message) ||
        (errorDetails.filename !== '(no filename)' && errorDetails.filename) ||
        errorDetails.error !== null ||
        errorDetails.lineno !== null ||
        errorDetails.colno !== null
      )

      // Only log if there's meaningful information
      if (!hasMeaningfulInfo) {
        // Likely an extension error that wasn't caught, silently ignore
        event.preventDefault()
        return false
      }

      // Log real application errors
      if (isProduction) {
        // In production, you might want to send to an error tracking service
        console.error('[APP ERROR]', errorDetails)
      } else {
        // In development, log with full details
        console.error('Application error:', errorDetails)
      }

      // Don't prevent default behavior for real errors
      return true
    }

    /**
     * Handle unhandled promise rejections
     */
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      const message = reason?.message || String(reason || '')
      
      // Filter out extension errors
      if (isExtensionError(event)) {
        event.preventDefault()
        return false
      }

      // Log real application errors
      if (isProduction) {
        console.error('[APP ERROR] Unhandled promise rejection:', {
          reason: reason,
          message: message
        })
      } else {
        // In development, extract properties for better logging
        console.error('Unhandled promise rejection:', {
          reason: reason,
          message: message,
          stack: reason?.stack,
          type: event.type,
          timeStamp: event.timeStamp,
          promise: event.promise
        })
      }

      return true
    }

    /**
     * Handle network errors (resource loading failures)
     * This catches ERR_FILE_NOT_FOUND and similar network errors
     */
    const handleResourceError = (event: Event) => {
      const target = event.target as HTMLElement
      if (!target) return
      
      // Check if the error is from an extension resource
      const src = (target as HTMLScriptElement | HTMLLinkElement | HTMLImageElement).src || 
                  (target as HTMLScriptElement).href || ''
      
      if (
        src.includes('chrome-extension://') ||
        src.includes('moz-extension://') ||
        src.includes('safari-extension://') ||
        src.includes('extension://') ||
        src.includes('heuristicsRedefinitions') ||
        src.includes('extensionState') ||
        src.includes('installHook') ||
        src.includes('overrideMethod') ||
        src.includes('utils.js')
      ) {
        // Silently ignore extension resource errors
        event.preventDefault()
        event.stopPropagation()
        return false
      }
      
      // For real application resource errors, log them
      if (isProduction) {
        console.error('[APP ERROR] Resource loading failed:', {
          src: src,
          tagName: target.tagName
        })
      }
      
      return true
    }

    // Add event listeners
    window.addEventListener('error', handleError, true) // Use capture phase
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    
    // Listen for resource loading errors
    document.addEventListener('error', handleResourceError, true)

    // Cleanup
    return () => {
      window.removeEventListener('error', handleError, true)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      document.removeEventListener('error', handleResourceError, true)
    }
  }, [])

  return null
}

