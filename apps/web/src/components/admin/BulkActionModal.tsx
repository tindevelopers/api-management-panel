'use client'

import React, { useState } from 'react'
import { X, AlertTriangle, CheckCircle } from 'lucide-react'

interface BulkActionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (action: string) => Promise<void>
  selectedCount: number
  action: 'activate' | 'deactivate' | 'delete'
}

export default function BulkActionModal({ isOpen, onClose, onConfirm, selectedCount, action }: BulkActionModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await onConfirm(action)
      onClose()
    } catch (error) {
      console.error('Failed to perform bulk action:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getActionDetails = () => {
    switch (action) {
      case 'activate':
        return {
          title: 'Activate Users',
          message: `Are you sure you want to activate ${selectedCount} user(s)?`,
          icon: <CheckCircle className="w-6 h-6 text-green-600" />,
          buttonText: 'Activate',
          buttonClass: 'bg-green-600 hover:bg-green-700'
        }
      case 'deactivate':
        return {
          title: 'Deactivate Users',
          message: `Are you sure you want to deactivate ${selectedCount} user(s)?`,
          icon: <AlertTriangle className="w-6 h-6 text-yellow-600" />,
          buttonText: 'Deactivate',
          buttonClass: 'bg-yellow-600 hover:bg-yellow-700'
        }
      case 'delete':
        return {
          title: 'Delete Users',
          message: `Are you sure you want to permanently delete ${selectedCount} user(s)? This action cannot be undone.`,
          icon: <AlertTriangle className="w-6 h-6 text-red-600" />,
          buttonText: 'Delete',
          buttonClass: 'bg-red-600 hover:bg-red-700'
        }
      default:
        return {
          title: 'Bulk Action',
          message: `Are you sure you want to perform this action on ${selectedCount} user(s)?`,
          icon: <AlertTriangle className="w-6 h-6 text-gray-600" />,
          buttonText: 'Confirm',
          buttonClass: 'bg-blue-600 hover:bg-blue-700'
        }
    }
  }

  if (!isOpen) return null

  const { title, message, icon, buttonText, buttonClass } = getActionDetails()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-start space-x-3 mb-6">
          {icon}
          <div>
            <p className="text-gray-700">{message}</p>
            {action === 'delete' && (
              <p className="text-sm text-red-600 mt-2">
                This will permanently remove all user data and cannot be undone.
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-white rounded-md disabled:opacity-50 ${buttonClass}`}
          >
            {isLoading ? 'Processing...' : buttonText}
          </button>
        </div>
      </div>
    </div>
  )
}
