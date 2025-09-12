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

  const fetchMetrics = async (start: Date, end: Date) => {
    try {
      setLoading(true)
      setError(null)
      
      console.log(`Reports: Fetching metrics for date range: ${start.toISOString()} to ${end.toISOString()}`)
      
      const response = await fetch('/api/analytics/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: start.toISOString(),
          endDate: end.toISOString()
        })
      })

      if (!response.ok) throw new Error('Failed to fetch metrics')
      
      const data = await response.json()
      setMetrics(data)
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

  const handleCustomDateSubmit = () => {
    if (reportType === 'custom') {
      fetchMetrics(startDate, endDate)
    }
  }

  const chartData = metrics?.associates.map(a => ({
    name: a.name,
    captureRate: a.captureRate,
    guestCount: a.guestCount,
    profilesWithData: a.profilesWithData
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
            <p>Associate Data Capture Rate: {metrics.companyMetrics.associateDataCaptureRate}%</p>
            <p>Company Data Capture Rate: {metrics.companyMetrics.companyDataCaptureRate}%</p>
            <p>Company Data Capture Rate Less Weddings: {metrics.companyMetrics.companyDataCaptureRateLessWeddings}%</p>
            <div className="mt-2">
              <p className="font-medium">Associate Details:</p>
              {metrics.associates.map((associate, index) => (
                <p key={index} className="ml-2">
                  {associate.name}: {associate.profilesCreated} profiles, {associate.profilesWithData} with data, {associate.guestCount} guests
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
          
          {/* Company Metrics Cards - Matching Python Script */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm font-medium text-gray-500">ASSOCIATE DATA CAPTURE RATE</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">
                {metrics.companyMetrics.associateDataCaptureRate}%
              </p>
              <p className="text-xs text-gray-500 mt-1">Only associates with guest counts</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm font-medium text-gray-500">COMPANY DATA CAPTURE RATE</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">
                {metrics.companyMetrics.companyDataCaptureRate}%
              </p>
              <p className="text-xs text-gray-500 mt-1">All associates</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm font-medium text-gray-500">COMPANY DATA CAPTURE RATE LESS WEDDINGS</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">
                {metrics.companyMetrics.companyDataCaptureRateLessWeddings}%
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

          {/* Bar Chart */}
          <div className="bg-white p-6 rounded-lg shadow mb-8">
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

          {/* Associates Table */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Associate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Profiles Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    With Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Guest Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Capture Rate
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
                      {associate.profilesWithData}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {associate.guestCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {associate.captureRate}%
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