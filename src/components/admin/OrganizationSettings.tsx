'use client'

import React, { useState } from 'react'
import { Organization, SubscriptionPlan } from '@/types/multi-role'
import { 
  Settings, 
  Save, 
  Shield,
  Globe,
  Database,
  Bell,
  Key,
  Lock,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

interface OrganizationSettingsProps {
  organization: Organization
  onUpdate: (data: Partial<Organization>) => void
}

export default function OrganizationSettings({ organization, onUpdate }: OrganizationSettingsProps) {
  const [settings, setSettings] = useState({
    // General Settings
    name: organization.name,
    slug: organization.slug,
    description: organization.description || '',
    
    // Subscription Settings
    subscription_plan: organization.subscription_plan,
    max_users: organization.max_users,
    max_apis: organization.max_apis,
    
    // Feature Settings
    features: {
      api_versioning: organization.settings?.api_versioning || false,
      audit_logs: organization.settings?.audit_logs || false,
      sso_enabled: organization.settings?.sso_enabled || false,
      custom_domains: organization.settings?.custom_domains || false,
      advanced_analytics: organization.settings?.advanced_analytics || false,
    },
    
    // Security Settings
    security: {
      password_policy: organization.settings?.password_policy || 'standard',
      two_factor_required: organization.settings?.two_factor_required || false,
      session_timeout: organization.settings?.session_timeout || 24,
      ip_whitelist: organization.settings?.ip_whitelist || [],
    },
    
    // Notification Settings
    notifications: {
      email_notifications: organization.settings?.email_notifications || true,
      api_alerts: organization.settings?.api_alerts || true,
      user_activity: organization.settings?.user_activity || false,
      system_updates: organization.settings?.system_updates || true,
    }
  })
  
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'general' | 'subscription' | 'features' | 'security' | 'notifications'>('general')

  const handleSave = async () => {
    setLoading(true)
    try {
      await onUpdate({
        name: settings.name,
        slug: settings.slug,
        description: settings.description,
        subscription_plan: settings.subscription_plan,
        max_users: settings.max_users,
        max_apis: settings.max_apis,
        settings: {
          ...organization.settings,
          ...settings.features,
          ...settings.security,
          ...settings.notifications,
        }
      })
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPlanFeatures = (plan: SubscriptionPlan) => {
    switch (plan) {
      case SubscriptionPlan.FREE:
        return ['Basic analytics', 'Email support']
      case SubscriptionPlan.BASIC:
        return ['Advanced analytics', 'Priority support', 'Custom APIs']
      case SubscriptionPlan.PREMIUM:
        return ['Advanced analytics', 'Priority support', 'Custom APIs', 'Audit logs', 'API versioning']
      case SubscriptionPlan.ENTERPRISE:
        return ['All features', 'Dedicated support', 'Custom integrations', 'SSO', 'Advanced security']
      default:
        return []
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

  const planLimits = getPlanLimits(settings.subscription_plan)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Organization Settings</h2>
          <p className="text-gray-600">Configure {organization.name} settings and preferences</p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'general', name: 'General', icon: Settings },
            { id: 'subscription', name: 'Subscription', icon: Globe },
            { id: 'features', name: 'Features', icon: Database },
            { id: 'security', name: 'Security', icon: Shield },
            { id: 'notifications', name: 'Notifications', icon: Bell },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="bg-white shadow rounded-lg p-6 space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">General Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={settings.name}
                  onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Slug
                </label>
                <input
                  type="text"
                  value={settings.slug}
                  onChange={(e) => setSettings(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={settings.description}
                onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter organization description"
              />
            </div>
          </div>
        </div>
      )}

      {/* Subscription Settings */}
      {activeTab === 'subscription' && (
        <div className="bg-white shadow rounded-lg p-6 space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Subscription Plan</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.values(SubscriptionPlan).map((plan) => (
                <div
                  key={plan}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                    settings.subscription_plan === plan
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSettings(prev => ({ ...prev, subscription_plan: plan }))}
                >
                  <div className="text-center">
                    <h4 className="font-medium text-gray-900 capitalize">{plan}</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {getPlanFeatures(plan).join(', ')}
                    </p>
                    {settings.subscription_plan === plan && (
                      <CheckCircle className="h-5 w-5 text-blue-600 mx-auto mt-2" />
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Users
                </label>
                <input
                  type="number"
                  value={settings.max_users}
                  onChange={(e) => setSettings(prev => ({ ...prev, max_users: parseInt(e.target.value) || 0 }))}
                  min={planLimits.maxUsers === -1 ? -1 : 1}
                  max={planLimits.maxUsers === -1 ? undefined : planLimits.maxUsers}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  {planLimits.maxUsers === -1 ? 'Enter -1 for unlimited' : `Plan limit: ${planLimits.maxUsers}`}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max APIs
                </label>
                <input
                  type="number"
                  value={settings.max_apis}
                  onChange={(e) => setSettings(prev => ({ ...prev, max_apis: parseInt(e.target.value) || 0 }))}
                  min={planLimits.maxApis === -1 ? -1 : 1}
                  max={planLimits.maxApis === -1 ? undefined : planLimits.maxApis}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  {planLimits.maxApis === -1 ? 'Enter -1 for unlimited' : `Plan limit: ${planLimits.maxApis}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Features Settings */}
      {activeTab === 'features' && (
        <div className="bg-white shadow rounded-lg p-6 space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Feature Flags</h3>
            
            <div className="space-y-4">
              {[
                { key: 'api_versioning', label: 'API Versioning', description: 'Enable API versioning for better compatibility' },
                { key: 'audit_logs', label: 'Audit Logs', description: 'Track all user actions and system changes' },
                { key: 'sso_enabled', label: 'Single Sign-On', description: 'Enable SSO integration for enterprise users' },
                { key: 'custom_domains', label: 'Custom Domains', description: 'Allow custom domain configuration' },
                { key: 'advanced_analytics', label: 'Advanced Analytics', description: 'Enable detailed analytics and reporting' },
              ].map((feature) => (
                <div key={feature.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{feature.label}</h4>
                    <p className="text-sm text-gray-500">{feature.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.features[feature.key as keyof typeof settings.features]}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        features: {
                          ...prev.features,
                          [feature.key]: e.target.checked
                        }
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Security Settings */}
      {activeTab === 'security' && (
        <div className="bg-white shadow rounded-lg p-6 space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Security Configuration</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password Policy
                </label>
                <select
                  value={settings.security.password_policy}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    security: { ...prev.security, password_policy: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="basic">Basic (8+ characters)</option>
                  <option value="standard">Standard (8+ chars, mixed case, numbers)</option>
                  <option value="strong">Strong (12+ chars, special chars, no common patterns)</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                  <p className="text-sm text-gray-500">Require 2FA for all users</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.security.two_factor_required}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      security: { ...prev.security, two_factor_required: e.target.checked }
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Timeout (hours)
                </label>
                <input
                  type="number"
                  value={settings.security.session_timeout}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    security: { ...prev.security, session_timeout: parseInt(e.target.value) || 24 }
                  }))}
                  min="1"
                  max="168"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Settings */}
      {activeTab === 'notifications' && (
        <div className="bg-white shadow rounded-lg p-6 space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
            
            <div className="space-y-4">
              {[
                { key: 'email_notifications', label: 'Email Notifications', description: 'Send email notifications for important events' },
                { key: 'api_alerts', label: 'API Alerts', description: 'Get notified about API errors and performance issues' },
                { key: 'user_activity', label: 'User Activity', description: 'Track user login and activity patterns' },
                { key: 'system_updates', label: 'System Updates', description: 'Receive notifications about system maintenance and updates' },
              ].map((notification) => (
                <div key={notification.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{notification.label}</h4>
                    <p className="text-sm text-gray-500">{notification.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications[notification.key as keyof typeof settings.notifications]}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        notifications: {
                          ...prev.notifications,
                          [notification.key]: e.target.checked
                        }
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
