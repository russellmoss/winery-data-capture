'use client'

import { useState } from 'react'
import Link from 'next/link'
import { UserPlus, BarChart3, Mail, Calendar, TrendingUp } from 'lucide-react'
import EmailReportButton from '@/components/EmailReportButton'

export default function DashboardPage() {
  const [quickEmailLoading, setQuickEmailLoading] = useState(false)

  const quickActions = [
    {
      title: 'Create Profile',
      description: 'Add a new customer profile to the system',
      href: '/dashboard/create-profile',
      icon: UserPlus,
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'View Reports',
      description: 'Analyze data capture metrics and performance',
      href: '/dashboard/reports',
      icon: BarChart3,
      color: 'bg-green-500 hover:bg-green-600'
    }
  ]

  const quickReports = [
    {
      type: 'daily' as const,
      title: 'Daily Report',
      description: 'Yesterday\'s performance summary',
      icon: Calendar,
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      type: 'weekly' as const,
      title: 'Weekly Report',
      description: 'Last 7 days of performance data',
      icon: TrendingUp,
      color: 'bg-indigo-500 hover:bg-indigo-600'
    },
    {
      type: 'monthly' as const,
      title: 'Monthly Report',
      description: 'Last 30 days comprehensive analysis',
      icon: BarChart3,
      color: 'bg-teal-500 hover:bg-teal-600'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">🍷 Milea Estate Vineyard</h1>
        <p className="text-purple-100">Data Capture Analytics Dashboard</p>
        <p className="text-sm text-purple-200 mt-2">
          Welcome to your comprehensive tasting room data management system
        </p>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.title}
                href={action.href}
                className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200 hover:border-gray-300"
              >
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${action.color} text-white`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{action.title}</h3>
                    <p className="text-sm text-gray-500">{action.description}</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Quick Email Reports */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">📧 Quick Email Reports</h2>
        <p className="text-sm text-gray-600 mb-4">
          Send professional reports with AI insights directly to your email
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickReports.map((report) => {
            const Icon = report.icon
            return (
              <div
                key={report.type}
                className="p-4 bg-white rounded-lg shadow-md border border-gray-200"
              >
                <div className="flex items-center mb-3">
                  <div className={`p-2 rounded-lg ${report.color} text-white`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900">{report.title}</h3>
                    <p className="text-sm text-gray-500">{report.description}</p>
                  </div>
                </div>
                <EmailReportButton
                  reportType={report.type}
                  className="w-full"
                  disabled={quickEmailLoading}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">System Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="p-2 bg-green-500 rounded-lg text-white">
              <Mail className="w-5 h-5" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">Email Service</p>
              <p className="text-xs text-green-600">Ready to send reports</p>
            </div>
          </div>
          <div className="flex items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="p-2 bg-blue-500 rounded-lg text-white">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-800">Analytics</p>
              <p className="text-xs text-blue-600">Data capture tracking active</p>
            </div>
          </div>
          <div className="flex items-center p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="p-2 bg-purple-500 rounded-lg text-white">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-purple-800">AI Insights</p>
              <p className="text-xs text-purple-600">Claude AI analysis available</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <div className="p-2 bg-green-500 rounded-lg text-white">
              <Mail className="w-4 h-4" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Email reports ready</p>
              <p className="text-xs text-gray-500">Professional templates with AI insights available</p>
            </div>
          </div>
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <div className="p-2 bg-blue-500 rounded-lg text-white">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Analytics dashboard updated</p>
              <p className="text-xs text-gray-500">Real-time data capture metrics available</p>
            </div>
          </div>
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <div className="p-2 bg-purple-500 rounded-lg text-white">
              <UserPlus className="w-4 h-4" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Profile creation system active</p>
              <p className="text-xs text-gray-500">Ready to capture customer data</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
