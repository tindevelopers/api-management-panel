'use client'

import { useState } from 'react'
import { 
  ChartBarIcon, 
  ClockIcon, 
  TrendingUpIcon,
  TrendingDownIcon,
  EyeIcon,
  ServerIcon
} from '@heroicons/react/24/outline'

interface MetricCard {
  title: string
  value: string
  change: string
  changeType: 'increase' | 'decrease' | 'neutral'
  icon: React.ComponentType<any>
}

export default function AnalyticsOverview() {
  const [timeRange, setTimeRange] = useState('7d')

  const metrics: MetricCard[] = [
    {
      title: 'Total Requests',
      value: '45,231',
      change: '+12.5%',
      changeType: 'increase',
      icon: ChartBarIcon
    },
    {
      title: 'Average Response Time',
      value: '245ms',
      change: '-8.2%',
      changeType: 'decrease',
      icon: ClockIcon
    },
    {
      title: 'Success Rate',
      value: '99.2%',
      change: '+0.3%',
      changeType: 'increase',
      icon: TrendingUpIcon
    },
    {
      title: 'Active Endpoints',
      value: '12',
      change: 'No change',
      changeType: 'neutral',
      icon: ServerIcon
    }
  ]

  const topEndpoints = [
    { endpoint: '/api/users', requests: 15420, avgTime: '180ms', successRate: '99.8%' },
    { endpoint: '/api/auth/login', requests: 8934, avgTime: '320ms', successRate: '98.5%' },
    { endpoint: '/api/data/fetch', requests: 7821, avgTime: '450ms', successRate: '99.1%' },
    { endpoint: '/api/upload', requests: 5632, avgTime: '1.2s', successRate: '97.8%' },
    { endpoint: '/api/analytics', requests: 3421, avgTime: '280ms', successRate: '99.9%' }
  ]

  const recentActivity = [
    { time: '2 minutes ago', event: 'High traffic detected on /api/users', type: 'info' },
    { time: '15 minutes ago', event: 'API response time improved by 12%', type: 'success' },
    { time: '1 hour ago', event: 'New endpoint /api/v2/data deployed', type: 'info' },
    { time: '3 hours ago', event: 'Rate limit exceeded for user ID: 1234', type: 'warning' },
    { time: '5 hours ago', event: 'Database connection restored', type: 'success' }
  ]

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'increase':
        return 'text-green-600'
      case 'decrease':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'increase':
        return <TrendingUpIcon className="w-4 h-4 text-green-600" />
      case 'decrease':
        return <TrendingDownIcon className="w-4 h-4 text-red-600" />
      default:
        return null
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Analytics Overview</h2>
          <p className="text-gray-600">Monitor your API performance and usage</p>
        </div>
        <div className="flex space-x-2">
          {['24h', '7d', '30d', '90d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                timeRange === range
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <metric.icon className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500">{metric.title}</p>
                <p className="text-2xl font-semibold text-gray-900">{metric.value}</p>
                <div className="flex items-center mt-1">
                  {getChangeIcon(metric.changeType)}
                  <p className={`text-sm ml-1 ${getChangeColor(metric.changeType)}`}>
                    {metric.change}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Request Volume</h3>
          </div>
          <div className="p-6">
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Chart visualization would go here</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Response Times</h3>
          </div>
          <div className="p-6">
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Response time chart would go here</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Endpoints and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Endpoints */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Top Endpoints</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {topEndpoints.map((endpoint, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{endpoint.endpoint}</p>
                    <p className="text-sm text-gray-500">
                      {endpoint.requests.toLocaleString()} requests • {endpoint.avgTime} avg
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-green-600">
                      {endpoint.successRate}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <EyeIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.event}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActivityColor(activity.type)}`}>
                    {activity.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}