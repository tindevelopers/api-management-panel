import React from 'react'
import { BarChart3, TrendingUp, Users, Globe, Activity, Calendar } from 'lucide-react'

export default function AdminAnalyticsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
                <p className="text-gray-600">System-wide analytics and performance metrics</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 3 months</option>
                <option>Last year</option>
              </select>
              <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Calendar className="h-4 w-4 mr-2" />
                Export Report
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-sm text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +0% from last month
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Globe className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">API Requests</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-sm text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +0% from last month
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-sm text-red-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1 rotate-180" />
                  -0% from last month
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Response Time</p>
                <p className="text-2xl font-bold text-gray-900">0ms</p>
                <p className="text-sm text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1 rotate-180" />
                  -0% from last month
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* API Usage Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">API Usage</h3>
              <select className="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option>Requests</option>
                <option>Errors</option>
                <option>Response Time</option>
              </select>
            </div>
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p>No data available</p>
              </div>
            </div>
          </div>

          {/* User Activity Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">User Activity</h3>
              <select className="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option>Logins</option>
                <option>API Calls</option>
                <option>Organizations</option>
              </select>
            </div>
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p>No data available</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          </div>
          <div className="p-8 text-center">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No recent activity</h3>
            <p className="text-gray-600">Activity will appear here as users interact with the system.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
