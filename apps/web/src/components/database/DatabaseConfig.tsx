'use client'

import { useState } from 'react'

interface DatabaseConfigProps {
  databaseId: string
  databaseName: string
  currentConfig?: {
    name: string
    description: string
    status: 'active' | 'inactive' | 'maintenance'
  }
  onSave: (config: { id: string; name: string; description: string; status: 'active' | 'inactive' | 'maintenance'; created_at: string; updated_at: string }) => void
  onClose: () => void
}

export default function DatabaseConfig({ 
  databaseId, 
  databaseName, 
  currentConfig,
  onSave,
  onClose 
}: DatabaseConfigProps) {
  const [formData, setFormData] = useState({
    name: currentConfig?.name || '',
    description: currentConfig?.description || '',
    status: currentConfig?.status || 'active',
    connectionString: '',
    maxConnections: 100,
    timeout: 30,
    retryAttempts: 3
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Database name is required'
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }
    
    if (formData.maxConnections < 1 || formData.maxConnections > 1000) {
      newErrors.maxConnections = 'Max connections must be between 1 and 1000'
    }
    
    if (formData.timeout < 1 || formData.timeout > 300) {
      newErrors.timeout = 'Timeout must be between 1 and 300 seconds'
    }
    
    if (formData.retryAttempts < 0 || formData.retryAttempts > 10) {
      newErrors.retryAttempts = 'Retry attempts must be between 0 and 10'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      onSave({
        id: databaseId,
        ...formData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      
      onClose()
    } catch (error) {
      console.error('Error saving database config:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Configure {databaseName}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900 border-b pb-2">
                Basic Information
              </h4>
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Database Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter database name"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                    errors.description ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Describe the purpose of this database"
                />
                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Connection Settings */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900 border-b pb-2">
                Connection Settings
              </h4>
              
              <div>
                <label htmlFor="connectionString" className="block text-sm font-medium text-gray-700 mb-1">
                  Connection String
                </label>
                <input
                  type="password"
                  id="connectionString"
                  value={formData.connectionString}
                  onChange={(e) => handleInputChange('connectionString', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter database connection string"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Connection string will be encrypted and stored securely
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="maxConnections" className="block text-sm font-medium text-gray-700 mb-1">
                    Max Connections
                  </label>
                  <input
                    type="number"
                    id="maxConnections"
                    value={formData.maxConnections}
                    onChange={(e) => handleInputChange('maxConnections', parseInt(e.target.value))}
                    min="1"
                    max="1000"
                    className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                      errors.maxConnections ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.maxConnections && <p className="mt-1 text-sm text-red-600">{errors.maxConnections}</p>}
                </div>

                <div>
                  <label htmlFor="timeout" className="block text-sm font-medium text-gray-700 mb-1">
                    Timeout (seconds)
                  </label>
                  <input
                    type="number"
                    id="timeout"
                    value={formData.timeout}
                    onChange={(e) => handleInputChange('timeout', parseInt(e.target.value))}
                    min="1"
                    max="300"
                    className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                      errors.timeout ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.timeout && <p className="mt-1 text-sm text-red-600">{errors.timeout}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="retryAttempts" className="block text-sm font-medium text-gray-700 mb-1">
                  Retry Attempts
                </label>
                <input
                  type="number"
                  id="retryAttempts"
                  value={formData.retryAttempts}
                  onChange={(e) => handleInputChange('retryAttempts', parseInt(e.target.value))}
                  min="0"
                  max="10"
                  className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                    errors.retryAttempts ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.retryAttempts && <p className="mt-1 text-sm text-red-600">{errors.retryAttempts}</p>}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save Configuration'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
