'use client'

import React, { useState } from 'react'
import { Organization, SubscriptionPlan } from '@/types/multi-role'
import { X, Save } from 'lucide-react'

interface OrganizationFormProps {
  organization?: Organization | null
  onSubmit: (data: Partial<Organization>) => void
  onCancel: () => void
}

export default function OrganizationForm({ organization, onSubmit, onCancel }: OrganizationFormProps) {
  const [formData, setFormData] = useState({
    name: organization?.name || '',
    slug: organization?.slug || '',
    description: organization?.description || '',
    subscription_plan: organization?.subscription_plan || SubscriptionPlan.FREE,
    max_users: organization?.max_users || 5,
    max_apis: organization?.max_apis || 2,
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      // Basic validation
      const newErrors: Record<string, string> = {}
      
      if (!formData.name.trim()) {
        newErrors.name = 'Organization name is required'
      }
      
      if (!formData.slug.trim()) {
        newErrors.slug = 'Organization slug is required'
      } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
        newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens'
      }
      
      if (formData.max_users < 1 && formData.max_users !== -1) {
        newErrors.max_users = 'Max users must be at least 1 or -1 for unlimited'
      }
      
      if (formData.max_apis < 1 && formData.max_apis !== -1) {
        newErrors.max_apis = 'Max APIs must be at least 1 or -1 for unlimited'
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        return
      }

      await onSubmit(formData)
    } catch (error) {
      console.error('Error submitting form:', error)
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

  const getPlanLimits = (plan: SubscriptionPlan) => {
    switch (plan) {
      case SubscriptionPlan.FREE:
        return { maxUsers: 5, maxApis: 2 }
      case SubscriptionPlan.BASIC:
        return { maxUsers: 25, maxApis: 10 }
      case SubscriptionPlan.PREMIUM:
        return { maxUsers: 100, maxApis: 50 }
      case SubscriptionPlan.ENTERPRISE:
        return { maxUsers: -1, maxApis: -1 }
      default:
        return { maxUsers: 5, maxApis: 2 }
    }
  }

  const planLimits = getPlanLimits(formData.subscription_plan)

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            {organization ? 'Edit Organization' : 'Create Organization'}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
        {/* Organization Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Organization Name *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.name ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter organization name"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        {/* Organization Slug */}
        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
            Organization Slug *
          </label>
          <input
            type="text"
            id="slug"
            value={formData.slug}
            onChange={(e) => handleInputChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.slug ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="organization-slug"
          />
          <p className="mt-1 text-sm text-gray-500">
            Used in URLs. Only lowercase letters, numbers, and hyphens allowed.
          </p>
          {errors.slug && (
            <p className="mt-1 text-sm text-red-600">{errors.slug}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter organization description"
          />
        </div>

        {/* Subscription Plan */}
        <div>
          <label htmlFor="subscription_plan" className="block text-sm font-medium text-gray-700 mb-2">
            Subscription Plan
          </label>
          <select
            id="subscription_plan"
            value={formData.subscription_plan}
            onChange={(e) => handleInputChange('subscription_plan', e.target.value as SubscriptionPlan)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={SubscriptionPlan.FREE}>Free</option>
            <option value={SubscriptionPlan.BASIC}>Basic</option>
            <option value={SubscriptionPlan.PREMIUM}>Premium</option>
            <option value={SubscriptionPlan.ENTERPRISE}>Enterprise</option>
          </select>
          <p className="mt-1 text-sm text-gray-500">
            {formData.subscription_plan === SubscriptionPlan.FREE && 'Up to 5 users, 2 APIs'}
            {formData.subscription_plan === SubscriptionPlan.BASIC && 'Up to 25 users, 10 APIs'}
            {formData.subscription_plan === SubscriptionPlan.PREMIUM && 'Up to 100 users, 50 APIs'}
            {formData.subscription_plan === SubscriptionPlan.ENTERPRISE && 'Unlimited users and APIs'}
          </p>
        </div>

        {/* Max Users */}
        <div>
          <label htmlFor="max_users" className="block text-sm font-medium text-gray-700 mb-2">
            Max Users
          </label>
          <input
            type="number"
            id="max_users"
            value={formData.max_users}
            onChange={(e) => handleInputChange('max_users', parseInt(e.target.value) || 0)}
            min={planLimits.maxUsers === -1 ? -1 : 1}
            max={planLimits.maxUsers === -1 ? undefined : planLimits.maxUsers}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.max_users ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder={planLimits.maxUsers === -1 ? 'Unlimited' : planLimits.maxUsers.toString()}
          />
          <p className="mt-1 text-sm text-gray-500">
            {planLimits.maxUsers === -1 ? 'Enter -1 for unlimited users' : `Plan limit: ${planLimits.maxUsers} users`}
          </p>
          {errors.max_users && (
            <p className="mt-1 text-sm text-red-600">{errors.max_users}</p>
          )}
        </div>

        {/* Max APIs */}
        <div>
          <label htmlFor="max_apis" className="block text-sm font-medium text-gray-700 mb-2">
            Max APIs
          </label>
          <input
            type="number"
            id="max_apis"
            value={formData.max_apis}
            onChange={(e) => handleInputChange('max_apis', parseInt(e.target.value) || 0)}
            min={planLimits.maxApis === -1 ? -1 : 1}
            max={planLimits.maxApis === -1 ? undefined : planLimits.maxApis}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.max_apis ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder={planLimits.maxApis === -1 ? 'Unlimited' : planLimits.maxApis.toString()}
          />
          <p className="mt-1 text-sm text-gray-500">
            {planLimits.maxApis === -1 ? 'Enter -1 for unlimited APIs' : `Plan limit: ${planLimits.maxApis} APIs`}
          </p>
          {errors.max_apis && (
            <p className="mt-1 text-sm text-red-600">{errors.max_apis}</p>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {loading ? 'Saving...' : organization ? 'Update Organization' : 'Create Organization'}
          </button>
        </div>
      </form>
    </div>
  )
}
