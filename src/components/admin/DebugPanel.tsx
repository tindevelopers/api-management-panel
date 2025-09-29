'use client'

import React, { useState, useEffect } from 'react'
import { debugLogger, useDebugLogger } from '@/lib/utils/debug'
import { 
  Bug, 
  X, 
  Download, 
  Trash2, 
  Filter, 
  Eye, 
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Info,
  Clock,
  Wifi,
  WifiOff,
  Activity
} from 'lucide-react'

interface DebugPanelProps {
  className?: string
}

export default function DebugPanel({ className = '' }: DebugPanelProps) {
  const { logs, stats } = useDebugLogger()
  const [isOpen, setIsOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'error' | 'warn' | 'api' | 'component'>('all')
  const [showDetails, setShowDetails] = useState(false)
  const [autoScroll, setAutoScroll] = useState(true)

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll) {
      const panel = document.getElementById('debug-panel-logs')
      if (panel) {
        panel.scrollTop = panel.scrollHeight
      }
    }
  }, [logs, autoScroll])

  const filteredLogs = filter === 'all' 
    ? logs 
    : filter === 'error' 
      ? logs.filter(log => log.level === 'error')
      : filter === 'warn'
        ? logs.filter(log => log.level === 'warn')
        : logs.filter(log => log.type === filter)

  const getLogIcon = (log: any) => {
    switch (log.type) {
      case 'api':
        return log.status && log.status >= 400 ? <WifiOff className="h-4 w-4 text-red-500" /> : <Wifi className="h-4 w-4 text-blue-500" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'component':
        return <Activity className="h-4 w-4 text-green-500" />
      case 'auth':
        return <CheckCircle className="h-4 w-4 text-purple-500" />
      case 'hydration':
        return <Info className="h-4 w-4 text-orange-500" />
      default:
        return <Info className="h-4 w-4 text-gray-500" />
    }
  }

  const getLogColor = (log: any) => {
    switch (log.level) {
      case 'error':
        return 'border-l-red-500 bg-red-50'
      case 'warn':
        return 'border-l-yellow-500 bg-yellow-50'
      default:
        return 'border-l-blue-500 bg-blue-50'
    }
  }

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    })
  }

  const exportLogs = () => {
    const dataStr = JSON.stringify(logs, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `debug-logs-${new Date().toISOString().slice(0, 19)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const clearLogs = () => {
    debugLogger.clearLogs()
  }

  if (!isOpen) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <button
          onClick={() => setIsOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg transition-colors"
          title="Open Debug Panel"
        >
          <Bug className="h-5 w-5" />
          {stats.errors > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {stats.errors}
            </span>
          )}
        </button>
      </div>
    )
  }

  return (
    <div className={`fixed inset-0 z-50 bg-black bg-opacity-50 ${className}`}>
      <div className="fixed bottom-4 right-4 w-96 h-96 bg-white rounded-lg shadow-xl border flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b bg-gray-50 rounded-t-lg">
          <div className="flex items-center space-x-2">
            <Bug className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-gray-800">Debug Panel</h3>
            <div className="flex space-x-1">
              {stats.errors > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                  {stats.errors} errors
                </span>
              )}
              {stats.warnings > 0 && (
                <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                  {stats.warnings} warnings
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-3 border-b bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex space-x-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="text-xs border rounded px-2 py-1"
              >
                <option value="all">All ({logs.length})</option>
                <option value="error">Errors ({stats.errors})</option>
                <option value="warn">Warnings ({stats.warnings})</option>
                <option value="api">API ({stats.apiCalls})</option>
                <option value="component">Components</option>
              </select>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs border rounded px-2 py-1 flex items-center space-x-1"
                title={showDetails ? 'Hide Details' : 'Show Details'}
              >
                {showDetails ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                <span>Details</span>
              </button>
            </div>
            <div className="flex space-x-1">
              <button
                onClick={exportLogs}
                className="text-xs border rounded px-2 py-1 flex items-center space-x-1"
                title="Export Logs"
              >
                <Download className="h-3 w-3" />
              </button>
              <button
                onClick={clearLogs}
                className="text-xs border rounded px-2 py-1 flex items-center space-x-1 text-red-600"
                title="Clear Logs"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-600">
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`flex items-center space-x-1 ${autoScroll ? 'text-blue-600' : 'text-gray-400'}`}
            >
              <Clock className="h-3 w-3" />
              <span>Auto-scroll</span>
            </button>
            <span>•</span>
            <span>Total: {stats.total}</span>
          </div>
        </div>

        {/* Logs */}
        <div 
          id="debug-panel-logs"
          className="flex-1 overflow-y-auto p-2 space-y-1"
        >
          {filteredLogs.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-8">
              No logs to display
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className={`border-l-4 p-2 text-xs ${getLogColor(log)} rounded-r`}
              >
                <div className="flex items-start space-x-2">
                  {getLogIcon(log)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-800">
                        {log.type.toUpperCase()}
                      </span>
                      <span className="text-gray-500">
                        {formatTimestamp(log.timestamp)}
                      </span>
                    </div>
                    <div className="text-gray-700 mt-1">
                      {log.message}
                    </div>
                    {showDetails && log.data && (
                      <details className="mt-1">
                        <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                          Data
                        </summary>
                        <pre className="text-xs text-gray-600 mt-1 overflow-auto max-h-20 bg-gray-100 p-1 rounded">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      </details>
                    )}
                    {showDetails && log.stack && (
                      <details className="mt-1">
                        <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                          Stack Trace
                        </summary>
                        <pre className="text-xs text-gray-600 mt-1 overflow-auto max-h-20 bg-gray-100 p-1 rounded">
                          {log.stack}
                        </pre>
                      </details>
                    )}
                    {log.url && (
                      <div className="text-gray-600 mt-1">
                        <span className="font-medium">{log.method}:</span> {log.url}
                        {log.status && (
                          <span className={`ml-2 px-1 rounded ${
                            log.status >= 400 ? 'bg-red-200 text-red-800' :
                            log.status >= 300 ? 'bg-yellow-200 text-yellow-800' :
                            'bg-green-200 text-green-800'
                          }`}>
                            {log.status}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
