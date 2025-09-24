'use client'

import { useState } from 'react'

interface ApiTesterProps {
  apiUrl: string
  apiName: string
}

interface TestResult {
  success: boolean
  response?: any
  error?: string
  duration?: number
}

export default function ApiTester({ apiUrl, apiName }: ApiTesterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [testResults, setTestResults] = useState<TestResult | null>(null)
  const [selectedEndpoint, setSelectedEndpoint] = useState('health')
  const [customRequest, setCustomRequest] = useState('')

  const endpoints = [
    {
      id: 'health',
      name: 'Health Check',
      method: 'GET',
      path: '/health',
      description: 'Check API service health'
    },
    {
      id: 'presets',
      name: 'Get Presets',
      method: 'GET',
      path: '/api/v1/abstraction/presets',
      description: 'Get available writing presets'
    },
    {
      id: 'capabilities',
      name: 'AI Capabilities',
      method: 'GET',
      path: '/api/v1/ai/providers/capabilities',
      description: 'Get AI provider capabilities'
    },
    {
      id: 'generate',
      name: 'Generate Blog',
      method: 'POST',
      path: '/api/v1/abstraction/blog/generate',
      description: 'Generate blog content',
      requiresBody: true,
      sampleBody: {
        topic: "The Future of AI in Web Development",
        preset: "technical_writer",
        word_count: 500,
        include_seo: true
      }
    }
  ]

  const runTest = async () => {
    setLoading(true)
    setTestResults(null)
    
    const startTime = Date.now()
    
    try {
      const endpoint = endpoints.find(e => e.id === selectedEndpoint)
      if (!endpoint) throw new Error('Invalid endpoint selected')

      let requestOptions: RequestInit = {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
        },
      }

      // Add request body for POST requests
      if (endpoint.method === 'POST' && endpoint.requiresBody) {
        requestOptions.body = JSON.stringify(endpoint.sampleBody)
      }

      // Use custom request if provided
      if (customRequest && selectedEndpoint === 'custom') {
        try {
          const parsedRequest = JSON.parse(customRequest)
          requestOptions = {
            method: parsedRequest.method || 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...parsedRequest.headers
            },
            body: parsedRequest.body ? JSON.stringify(parsedRequest.body) : undefined
          }
        } catch (error) {
          throw new Error('Invalid JSON in custom request')
        }
      }

      const url = selectedEndpoint === 'custom' 
        ? `${apiUrl}${customRequest.split(' ')[1] || '/'}` 
        : `${apiUrl}${endpoint.path}`

      const response = await fetch(url, requestOptions)
      const responseData = await response.text()
      
      const duration = Date.now() - startTime
      
      let parsedResponse
      try {
        parsedResponse = JSON.parse(responseData)
      } catch {
        parsedResponse = responseData
      }

      setTestResults({
        success: response.ok,
        response: {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          data: parsedResponse
        },
        duration
      })
    } catch (error) {
      const duration = Date.now() - startTime
      setTestResults({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        duration
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="text-gray-600 hover:text-gray-900 text-sm font-medium"
      >
        Test API
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Test {apiName} API
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* API URL */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Base URL
            </label>
            <div className="bg-gray-100 p-3 rounded-md font-mono text-sm">
              {apiUrl}
            </div>
          </div>

          {/* Endpoint Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Endpoint
            </label>
            <select
              value={selectedEndpoint}
              onChange={(e) => setSelectedEndpoint(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              {endpoints.map((endpoint) => (
                <option key={endpoint.id} value={endpoint.id}>
                  {endpoint.method} {endpoint.name}
                </option>
              ))}
              <option value="custom">Custom Request</option>
            </select>
            {selectedEndpoint !== 'custom' && (
              <p className="mt-1 text-sm text-gray-500">
                {endpoints.find(e => e.id === selectedEndpoint)?.description}
              </p>
            )}
          </div>

          {/* Custom Request */}
          {selectedEndpoint === 'custom' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Request (JSON)
              </label>
              <textarea
                value={customRequest}
                onChange={(e) => setCustomRequest(e.target.value)}
                placeholder={`{
  "method": "GET",
  "path": "/your-endpoint",
  "headers": {},
  "body": {}
}`}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                rows={8}
              />
            </div>
          )}

          {/* Sample Request Body */}
          {selectedEndpoint !== 'custom' && endpoints.find(e => e.id === selectedEndpoint)?.requiresBody && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Request Body
              </label>
              <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-x-auto">
                {JSON.stringify(endpoints.find(e => e.id === selectedEndpoint)?.sampleBody, null, 2)}
              </pre>
            </div>
          )}

          {/* Run Test Button */}
          <div className="mb-4">
            <button
              onClick={runTest}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Testing...
                </>
              ) : (
                'Run Test'
              )}
            </button>
          </div>

          {/* Test Results */}
          {testResults && (
            <div className="border-t pt-4">
              <h4 className="text-md font-medium text-gray-900 mb-2">
                Test Results
                {testResults.duration && (
                  <span className="ml-2 text-sm text-gray-500">
                    ({testResults.duration}ms)
                  </span>
                )}
              </h4>
              
              {testResults.success ? (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">
                        Request Successful
                      </h3>
                      <div className="mt-2 text-sm text-green-700">
                        <pre className="whitespace-pre-wrap overflow-x-auto">
                          {JSON.stringify(testResults.response, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Request Failed
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        {testResults.error}
                        {testResults.response && (
                          <pre className="whitespace-pre-wrap overflow-x-auto mt-2">
                            {JSON.stringify(testResults.response, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
