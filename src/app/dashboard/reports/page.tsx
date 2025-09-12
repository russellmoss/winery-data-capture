'use client'

import { useState, useEffect } from 'react'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import { subDays } from 'date-fns'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { DataCaptureMetrics, MonthlyComparison } from '@/lib/analytics/service'

type ReportType = 'last30' | 'last90' | 'today' | 'custom' | 'yearByMonth'

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('last30')
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30))
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [metrics, setMetrics] = useState<DataCaptureMetrics | null>(null)
  const [yearComparison, setYearComparison] = useState<MonthlyComparison[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCached, setIsCached] = useState(false)
  const [cacheTimestamp, setCacheTimestamp] = useState<string | null>(null)

  useEffect(() => {
    if (reportType === 'last30') {
      fetchMetrics(subDays(new Date(), 30), new Date())
    } else if (reportType === 'last90') {
      fetchMetrics(subDays(new Date(), 90), new Date())
    } else if (reportType === 'today') {
      const today = new Date()
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)
      fetchMetrics(startOfDay, endOfDay)
    } else if (reportType === 'yearByMonth') {
      fetchYearComparison()
    }
  }, [reportType])

  const fetchMetrics = async (start: Date, end: Date, refresh = false) => {
    try {
      setLoading(true)
      setError(null)
      
      console.log(`Reports: Fetching metrics for date range: ${start.toISOString()} to ${end.toISOString()}${refresh ? ' (refresh requested)' : ''}`)
      
      const response = await fetch('/api/analytics/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          refresh
        })
      })

      if (!response.ok) throw new Error('Failed to fetch metrics')
      
      const data = await response.json()
      setMetrics(data)
      setIsCached(data.cached || false)
      setCacheTimestamp(data.cacheTimestamp || null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchYearComparison = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/analytics/year-comparison')
      if (!response.ok) throw new Error('Failed to fetch year comparison')
      
      const data = await response.json()
      setYearComparison(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    if (reportType === 'yearByMonth') {
      fetchYearComparison()
    } else {
      fetchMetrics(startDate, endDate, true)
    }
  }

  const handleCustomDateSubmit = () => {
    if (reportType === 'custom') {
      fetchMetrics(startDate, endDate)
    }
  }

  const chartData = metrics?.associates.map(a => ({
    name: a.name,
    captureRate: a.captureRate,
    subscriptionRate: a.subscriptionRate,
    guestCount: a.guestCount,
    profilesCreated: a.profilesCreated,
    profilesWithEmail: a.profilesWithEmail,
    profilesWithPhone: a.profilesWithPhone,
    profilesWithData: a.profilesWithData,
    profilesWithSubscription: a.profilesWithSubscription
  })) || []

  const yearChartData = yearComparison?.map(m => ({
    month: m.month,
    currentYear: m.currentYear.companyMetrics.overallCaptureRate,
    previousYear: m.previousYear.companyMetrics.overallCaptureRate,
    change: m.percentageChange
  })) || []

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Data Capture Reports</h1>
      
      {/* Report Type Selector */}
      <div className="mt-6 flex space-x-4">
        <button
          onClick={() => setReportType('last30')}
          className={`px-4 py-2 rounded-md ${
            reportType === 'last30'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Last 30 Days
        </button>
        <button
          onClick={() => setReportType('last90')}
          className={`px-4 py-2 rounded-md ${
            reportType === 'last90'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Last 90 Days
        </button>
        <button
          onClick={() => setReportType('today')}
          className={`px-4 py-2 rounded-md ${
            reportType === 'today'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Today Only
        </button>
        <button
          onClick={() => setReportType('custom')}
          className={`px-4 py-2 rounded-md ${
            reportType === 'custom'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Custom Range
        </button>
        <button
          onClick={() => setReportType('yearByMonth')}
          className={`px-4 py-2 rounded-md ${
            reportType === 'yearByMonth'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Year by Month
        </button>
      </div>

      {/* Refresh Button and Cache Status */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{loading ? 'Refreshing...' : 'Refresh Report'}</span>
          </button>
          
          {isCached && cacheTimestamp && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Cached data from {new Date(cacheTimestamp).toLocaleString()}</span>
            </div>
          )}
        </div>
        
        {loading && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
            <span>Loading analytics data...</span>
          </div>
        )}
      </div>

      {/* Date Picker for Custom Range */}
      {reportType === 'custom' && (
        <div className="mt-4 flex items-end space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date || new Date())}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date || new Date())}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <button
            onClick={handleCustomDateSubmit}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Generate Report
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="mt-8 text-center">
          <p className="text-gray-500">Loading report data...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mt-8 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Debug Information */}
      {!loading && metrics && reportType !== 'yearByMonth' && (
        <div className="mt-8 p-4 bg-gray-100 rounded-md">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Debug Information</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <p>Date Range: {new Date(metrics.startDate).toISOString()} to {new Date(metrics.endDate).toISOString()}</p>
            <p>Total Associates: {metrics.associates.length}</p>
            <p>Total Profiles: {metrics.companyMetrics.totalProfiles}</p>
            <p>Profiles with Data: {metrics.companyMetrics.totalProfilesWithData}</p>
            <p>Total Guest Count: {metrics.companyMetrics.totalGuestCount}</p>
            <p>Wedding Lead Profiles: {metrics.companyMetrics.profilesWithWeddingLeadTag}</p>
            <p>Associate Data Capture Rate: {metrics.companyMetrics.associateDataCaptureRate.toFixed(2)}%</p>
            <p>Company Data Capture Rate: {metrics.companyMetrics.companyDataCaptureRate.toFixed(2)}%</p>
            <p>Company Data Capture Rate Less Weddings: {metrics.companyMetrics.companyDataCaptureRateLessWeddings.toFixed(2)}%</p>
            <p>Total Profiles with Subscription: {metrics.companyMetrics.totalProfilesWithSubscription}</p>
            <p>Overall Subscription Rate: {metrics.companyMetrics.overallSubscriptionRate.toFixed(2)}%</p>
            <p>Associate Data Subscription Rate: {metrics.companyMetrics.associateDataSubscriptionRate.toFixed(2)}%</p>
            <p>Company Data Subscription Rate: {metrics.companyMetrics.companyDataSubscriptionRate.toFixed(2)}%</p>
            <p>Company Data Subscription Rate Less Weddings: {metrics.companyMetrics.companyDataSubscriptionRateLessWeddings.toFixed(2)}%</p>
            <div className="mt-2">
              <p className="font-medium">Associate Details:</p>
              {metrics.associates.map((associate, index) => (
                <p key={index} className="ml-2">
                  {associate.name}: {associate.profilesCreated} profiles, {associate.profilesWithEmail} with email, {associate.profilesWithPhone} with phone, {associate.profilesWithData} with data, {associate.profilesWithSubscription} subscribed, {associate.guestCount} guests
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Metrics Display for Last 30 Days or Custom Range */}
      {!loading && metrics && reportType !== 'yearByMonth' && (
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">{metrics.period}</h2>
          
          {/* Data Capture Metrics */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">📊 Data Capture Metrics</h3>
          </div>
          
          {/* Company Metrics Cards - Capture Rates */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm font-medium text-gray-500">ASSOCIATE DATA CAPTURE RATE</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">
                {metrics.companyMetrics.associateDataCaptureRate.toFixed(2)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">Only associates with guest counts</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm font-medium text-gray-500">COMPANY DATA CAPTURE RATE</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">
                {metrics.companyMetrics.companyDataCaptureRate.toFixed(2)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">All associates</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm font-medium text-gray-500">COMPANY DATA CAPTURE RATE LESS WEDDINGS</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">
                {metrics.companyMetrics.companyDataCaptureRateLessWeddings.toFixed(2)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">Excluding wedding leads</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm font-medium text-gray-500">Wedding Lead Profiles</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">
                {metrics.companyMetrics.profilesWithWeddingLeadTag}
              </p>
            </div>
          </div>

          {/* Subscription Rate Metrics */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">📧 Email Subscription Metrics</h3>
          </div>
          
          {/* Company Metrics Cards - Subscription Rates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
              <p className="text-sm font-medium text-gray-500">ASSOCIATE DATA SUBSCRIPTION RATE</p>
              <p className="mt-2 text-3xl font-semibold text-blue-600">
                {metrics.companyMetrics.associateDataSubscriptionRate.toFixed(2)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">Email opt-in rate for associates tracking guests</p>
              <p className="text-xs text-gray-400 mt-1">
                {metrics.companyMetrics.totalProfilesWithSubscription} subscribed profiles
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
              <p className="text-sm font-medium text-gray-500">COMPANY DATA SUBSCRIPTION RATE</p>
              <p className="mt-2 text-3xl font-semibold text-green-600">
                {metrics.companyMetrics.companyDataSubscriptionRate.toFixed(2)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">Overall email opt-in rate</p>
              <p className="text-xs text-gray-400 mt-1">All associates included</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
              <p className="text-sm font-medium text-gray-500">COMPANY SUBSCRIPTION RATE (NO WEDDINGS)</p>
              <p className="mt-2 text-3xl font-semibold text-purple-600">
                {metrics.companyMetrics.companyDataSubscriptionRateLessWeddings.toFixed(2)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">Email opt-in excluding wedding leads</p>
              <p className="text-xs text-gray-400 mt-1">Wedding leads excluded</p>
            </div>
          </div>

          {/* Bar Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Capture Rate by Associate</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="captureRate" fill="#4F46E5" name="Capture Rate %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Subscription Rate by Associate</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="subscriptionRate" fill="#10B981" name="Subscription Rate %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Associates Table */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Associate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    New Profiles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    With Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    With Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    With Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subscribed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Guest Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Capture Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subscribe Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {metrics.associates.map((associate) => (
                  <tr key={associate.name}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {associate.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {associate.profilesCreated}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {associate.profilesWithEmail}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {associate.profilesWithPhone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {associate.profilesWithData}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {associate.profilesWithSubscription}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {associate.guestCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {associate.captureRate.toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {associate.subscriptionRate.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Year by Month Comparison */}
      {!loading && yearComparison && reportType === 'yearByMonth' && (
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Year over Year Comparison</h2>
          
          {/* Line Chart */}
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={yearChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="currentYear" stroke="#4F46E5" name="Current Year" />
                <Line type="monotone" dataKey="previousYear" stroke="#EF4444" name="Previous Year" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Comparison Table */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Month
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Year
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Previous Year
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Change
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {yearComparison.map((month) => (
                  <tr key={month.month}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {month.month}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {month.currentYear.companyMetrics.overallCaptureRate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {month.previousYear.companyMetrics.overallCaptureRate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={month.percentageChange > 0 ? 'text-green-600' : 'text-red-600'}>
                        {month.percentageChange > 0 ? '+' : ''}{month.percentageChange}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}