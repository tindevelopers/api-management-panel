/**
 * Comprehensive debug utilities for tracking API calls, component lifecycle, and errors
 */

import React from 'react'

interface DebugLog {
  id: string
  timestamp: Date
  type: 'api' | 'component' | 'error' | 'render' | 'hydration' | 'auth'
  level: 'info' | 'warn' | 'error'
  message: string
  data?: any
  stack?: string
  url?: string
  method?: string
  status?: number
  component?: string
  action?: string
}

class DebugLogger {
  private logs: DebugLog[] = []
  private maxLogs = 1000
  private listeners: ((logs: DebugLog[]) => void)[] = []

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private addLog(log: Omit<DebugLog, 'id' | 'timestamp'>): void {
    const newLog: DebugLog = {
      id: this.generateId(),
      timestamp: new Date(),
      ...log
    }

    this.logs.unshift(newLog)
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs)
    }

    // Notify listeners
    this.listeners.forEach(listener => listener([...this.logs]))

    // Also log to console for development
    if (process.env.NODE_ENV === 'development') {
      const consoleMethod = log.level === 'error' ? 'error' : log.level === 'warn' ? 'warn' : 'log'
      console[consoleMethod](`[DEBUG ${log.type.toUpperCase()}]`, log.message, log.data || '')
    }
  }

  // API Debug Methods
  apiRequest(url: string, method: string, data?: any): void {
    this.addLog({
      type: 'api',
      level: 'info',
      message: `API Request: ${method} ${url}`,
      url,
      method,
      data
    })
  }

  apiResponse(url: string, method: string, status: number, data?: any, error?: any): void {
    this.addLog({
      type: 'api',
      level: status >= 400 ? 'error' : 'info',
      message: `API Response: ${method} ${url} - ${status}`,
      url,
      method,
      status,
      data: error || data
    })
  }

  apiError(url: string, method: string, error: any): void {
    this.addLog({
      type: 'api',
      level: 'error',
      message: `API Error: ${method} ${url}`,
      url,
      method,
      data: error,
      stack: error?.stack
    })
  }

  // Component Debug Methods
  componentMount(component: string, props?: any): void {
    this.addLog({
      type: 'component',
      level: 'info',
      message: `Component Mounted: ${component}`,
      component,
      data: props
    })
  }

  componentUnmount(component: string): void {
    this.addLog({
      type: 'component',
      level: 'info',
      message: `Component Unmounted: ${component}`,
      component
    })
  }

  componentRender(component: string, action: string, data?: any): void {
    this.addLog({
      type: 'render',
      level: 'info',
      message: `Component Render: ${component} - ${action}`,
      component,
      action,
      data
    })
  }

  componentError(component: string, error: any): void {
    this.addLog({
      type: 'error',
      level: 'error',
      message: `Component Error: ${component}`,
      component,
      data: error,
      stack: error?.stack
    })
  }

  // Hydration Debug Methods
  hydrationStart(): void {
    this.addLog({
      type: 'hydration',
      level: 'info',
      message: 'Hydration Started'
    })
  }

  hydrationComplete(): void {
    this.addLog({
      type: 'hydration',
      level: 'info',
      message: 'Hydration Completed'
    })
  }

  hydrationError(error: any): void {
    this.addLog({
      type: 'hydration',
      level: 'error',
      message: 'Hydration Error',
      data: error,
      stack: error?.stack
    })
  }

  // Auth Debug Methods
  authCheck(user: any): void {
    this.addLog({
      type: 'auth',
      level: 'info',
      message: 'Auth Check',
      data: { userId: user?.id, email: user?.email, authenticated: !!user }
    })
  }

  authError(error: any): void {
    this.addLog({
      type: 'auth',
      level: 'error',
      message: 'Auth Error',
      data: error,
      stack: error?.stack
    })
  }

  // General Debug Methods
  info(message: string, data?: any): void {
    this.addLog({
      type: 'component',
      level: 'info',
      message,
      data
    })
  }

  warn(message: string, data?: any): void {
    this.addLog({
      type: 'component',
      level: 'warn',
      message,
      data
    })
  }

  error(message: string, error?: any): void {
    this.addLog({
      type: 'error',
      level: 'error',
      message,
      data: error,
      stack: error?.stack
    })
  }

  // Utility Methods
  getLogs(): DebugLog[] {
    return [...this.logs]
  }

  getLogsByType(type: DebugLog['type']): DebugLog[] {
    return this.logs.filter(log => log.type === type)
  }

  getLogsByLevel(level: DebugLog['level']): DebugLog[] {
    return this.logs.filter(log => log.level === level)
  }

  clearLogs(): void {
    this.logs = []
    this.listeners.forEach(listener => listener([]))
  }

  subscribe(listener: (logs: DebugLog[]) => void): () => void {
    this.listeners.push(listener)
    // Immediately call with current logs
    listener([...this.logs])
    
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  // Export logs as JSON
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  // Get summary statistics
  getStats(): {
    total: number
    byType: Record<string, number>
    byLevel: Record<string, number>
    errors: number
    warnings: number
    apiCalls: number
  } {
    const byType = this.logs.reduce((acc, log) => {
      acc[log.type] = (acc[log.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const byLevel = this.logs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total: this.logs.length,
      byType,
      byLevel,
      errors: byLevel.error || 0,
      warnings: byLevel.warn || 0,
      apiCalls: byType.api || 0
    }
  }
}

// Create singleton instance
export const debugLogger = new DebugLogger()

// Hook for React components
export function useDebugLogger() {
  const [logs, setLogs] = React.useState<DebugLog[]>(debugLogger.getLogs())
  
  React.useEffect(() => {
    return debugLogger.subscribe(setLogs)
  }, [])

  return {
    logs,
    logger: debugLogger,
    stats: debugLogger.getStats()
  }
}

// Enhanced fetch wrapper for API debugging
export async function debugFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const method = options.method || 'GET'
  
  debugLogger.apiRequest(url, method, options.body)
  
  try {
    const response = await fetch(url, options)
    debugLogger.apiResponse(url, method, response.status)
    return response
  } catch (error) {
    debugLogger.apiError(url, method, error)
    throw error
  }
}

// React error boundary for debugging
export class DebugErrorBoundary extends React.Component<
  { children: React.ReactNode; component: string },
  { hasError: boolean; error: any }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error }
  }

  componentDidCatch(error: any, errorInfo: any) {
    debugLogger.componentError(this.props.component, error)
    console.error('DebugErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-red-500 bg-red-50 rounded-lg">
          <h3 className="text-red-800 font-semibold">Error in {this.props.component}</h3>
          <p className="text-red-700 text-sm mt-2">{this.state.error?.message}</p>
          <details className="mt-2">
            <summary className="text-red-600 cursor-pointer">Stack Trace</summary>
            <pre className="text-xs text-red-600 mt-1 overflow-auto">
              {this.state.error?.stack}
            </pre>
          </details>
        </div>
      )
    }

    return this.props.children
  }
}
