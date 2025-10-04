'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

interface OrganizationSettingsProps {
  user: User
}

interface OrganizationData {
  name: string
  description: string
  website: string
  industry: string
  size: string
  location: string
}

export default function OrganizationSettings({ user }: OrganizationSettingsProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [orgData, setOrgData] = useState<OrganizationData>({
    name: user.user_metadata?.organization_name || '',
    description: user.user_metadata?.organization_description || '',
    website: user.user_metadata?.organization_website || '',
    industry: user.user_metadata?.organization_industry || '',
    size: user.user_metadata?.organization_size || '',
    location: user.user_metadata?.organization_location || '',
  })

  const supabase = createClient()

  const handleInputChange = (field: keyof OrganizationData, value: string) => {
    setOrgData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          organization_name: orgData.name,
          organization_description: orgData.description,
          organization_website: orgData.website,
          organization_industry: orgData.industry,
          organization_size: orgData.size,
          organization_location: orgData.location,
        }
      })

      if (error) throw error

      setMessage({ type: 'success', text: 'Organization settings updated successfully!' })
    } catch (error) {
      console.error('Error updating organization settings:', error)
      setMessage({ type: 'error', text: 'Failed to update organization settings. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Organization Settings</h2>
        <p className="mt-1 text-sm text-gray-600">Manage your organization information and preferences.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-md ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="org-name" className="block text-sm font-medium text-gray-700">
                Organization Name
              </label>
              <input
                type="text"
                id="org-name"
                value={orgData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter organization name"
              />
            </div>

            <div>
              <label htmlFor="org-website" className="block text-sm font-medium text-gray-700">
                Website
              </label>
              <input
                type="url"
                id="org-website"
                value={orgData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="https://example.com"
              />
            </div>

            <div>
              <label htmlFor="org-industry" className="block text-sm font-medium text-gray-700">
                Industry
              </label>
              <select
                id="org-industry"
                value={orgData.industry}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Select industry</option>
                <option value="technology">Technology</option>
                <option value="healthcare">Healthcare</option>
                <option value="finance">Finance</option>
                <option value="education">Education</option>
                <option value="retail">Retail</option>
                <option value="manufacturing">Manufacturing</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="org-size" className="block text-sm font-medium text-gray-700">
                Organization Size
              </label>
              <select
                id="org-size"
                value={orgData.size}
                onChange={(e) => handleInputChange('size', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Select size</option>
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201-1000">201-1000 employees</option>
                <option value="1000+">1000+ employees</option>
              </select>
            </div>

            <div>
              <label htmlFor="org-location" className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <input
                type="text"
                id="org-location"
                value={orgData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="City, Country"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="org-description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="org-description"
                rows={4}
                value={orgData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Brief description of your organization"
              />
            </div>
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}