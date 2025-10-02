'use client'

import { useState } from 'react'
import { 
  DatabaseIcon, 
  TableCellsIcon,
  CircleStackIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  PlusIcon,
  CogIcon
} from '@heroicons/react/24/outline'

interface Database {
  id: string
  name: string
  description: string
  type: 'postgresql' | 'mysql' | 'mongodb' | 'redis'
  status: 'active' | 'inactive' | 'maintenance'
  size: string
  tables: number
  lastBackup: string
  connections: number
  maxConnections: number
}

interface Table {
  name: string
  rows: number
  size: string
  lastModified: string
}

export default function DatabaseOverview() {
  const [databases, setDatabases] = useState<Database[]>([
    {
      id: '1',
      name: 'Main Database',
      description: 'Primary application database',
      type: 'postgresql',
      status: 'active',
      size: '2.4 GB',
      tables: 15,
      lastBackup: '2024-01-15T02:00:00Z',
      connections: 12,
      maxConnections: 100
    },
    {
      id: '2',
      name: 'Analytics DB',
      description: 'Analytics and reporting data',
      type: 'postgresql',
      status: 'active',
      size: '1.8 GB',
      tables: 8,
      lastBackup: '2024-01-15T02:00:00Z',
      connections: 5,
      maxConnections: 50
    },
    {
      id: '3',
      name: 'Cache Store',
      description: 'Redis cache for session management',
      type: 'redis',
      status: 'maintenance',
      size: '256 MB',
      tables: 0,
      lastBackup: '2024-01-14T02:00:00Z',
      connections: 0,
      maxConnections: 1000
    }
  ])

  const [selectedDatabase, setSelectedDatabase] = useState<Database | null>(databases[0])

  const recentTables: Table[] = [
    { name: 'users', rows: 1234, size: '45 MB', lastModified: '2024-01-15T10:30:00Z' },
    { name: 'organizations', rows: 89, size: '2.1 MB', lastModified: '2024-01-15T09:15:00Z' },
    { name: 'api_logs', rows: 15420, size: '234 MB', lastModified: '2024-01-15T11:45:00Z' },
    { name: 'user_roles', rows: 456, size: '8.2 MB', lastModified: '2024-01-14T16:20:00Z' },
    { name: 'sessions', rows: 789, size: '12 MB', lastModified: '2024-01-15T12:00:00Z' }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800'
      case 'inactive':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />
      case 'maintenance':
        return <ClockIcon className="w-5 h-5 text-yellow-600" />
      case 'inactive':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
      default:
        return <ExclamationTriangleIcon className="w-5 h-5 text-gray-600" />
    }
  }

  const getDatabaseIcon = (type: string) => {
    switch (type) {
      case 'postgresql':
      case 'mysql':
        return <DatabaseIcon className="w-8 h-8 text-blue-600" />
      case 'mongodb':
        return <CircleStackIcon className="w-8 h-8 text-green-600" />
      case 'redis':
        return <DatabaseIcon className="w-8 h-8 text-red-600" />
      default:
        return <DatabaseIcon className="w-8 h-8 text-gray-600" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getConnectionPercentage = (current: number, max: number) => {
    return Math.round((current / max) * 100)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Database Management</h2>
          <p className="text-gray-600">Monitor and manage your database connections</p>
        </div>
        <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Database
        </button>
      </div>

      {/* Database Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <DatabaseIcon className="w-8 h-8 text-indigo-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Databases</p>
              <p className="text-2xl font-semibold text-gray-900">{databases.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CheckCircleIcon className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active</p>
              <p className="text-2xl font-semibold text-gray-900">
                {databases.filter(db => db.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <TableCellsIcon className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Tables</p>
              <p className="text-2xl font-semibold text-gray-900">
                {databases.reduce((sum, db) => sum + db.tables, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <ShieldCheckIcon className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Last Backup</p>
              <p className="text-sm font-semibold text-gray-900">Today</p>
            </div>
          </div>
        </div>
      </div>

      {/* Database List and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Database List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Databases</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {databases.map((database) => (
                  <div
                    key={database.id}
                    onClick={() => setSelectedDatabase(database)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors duration-200 ${
                      selectedDatabase?.id === database.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {getDatabaseIcon(database.type)}
                        <div className="ml-3">
                          <p className="font-medium text-gray-900">{database.name}</p>
                          <p className="text-sm text-gray-500">{database.description}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {database.type.toUpperCase()} • {database.size}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {getStatusIcon(database.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Database Details */}
        <div className="lg:col-span-2">
          {selectedDatabase && (
            <div className="space-y-6">
              {/* Database Info */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">{selectedDatabase.name}</h3>
                  <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors duration-200">
                    <CogIcon className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Status</p>
                      <div className="flex items-center mt-1">
                        {getStatusIcon(selectedDatabase.status)}
                        <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedDatabase.status)}`}>
                          {selectedDatabase.status}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Type</p>
                      <p className="text-sm text-gray-900 mt-1">{selectedDatabase.type.toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Size</p>
                      <p className="text-sm text-gray-900 mt-1">{selectedDatabase.size}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Tables</p>
                      <p className="text-sm text-gray-900 mt-1">{selectedDatabase.tables}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Connections</p>
                      <div className="mt-1">
                        <p className="text-sm text-gray-900">
                          {selectedDatabase.connections} / {selectedDatabase.maxConnections}
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-indigo-600 h-2 rounded-full"
                            style={{ width: `${getConnectionPercentage(selectedDatabase.connections, selectedDatabase.maxConnections)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Last Backup</p>
                      <p className="text-sm text-gray-900 mt-1">{formatDate(selectedDatabase.lastBackup)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Tables */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Recent Tables</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Table Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rows
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Size
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Modified
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentTables.map((table, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <TableCellsIcon className="w-5 h-5 text-gray-400 mr-3" />
                              <span className="text-sm font-medium text-gray-900">{table.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {table.rows.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {table.size}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(table.lastModified)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}