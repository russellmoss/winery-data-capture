'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface EmailReportButtonProps {
  reportType: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'year-over-year' | 'custom'
  startDate?: Date | undefined
  endDate?: Date | undefined
  className?: string
  disabled?: boolean
  // Optional: Pass existing metrics data to avoid re-fetching
  existingMetrics?: any
  existingYearComparison?: any
}

interface EmailModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (email: string, options: any) => void
  loading: boolean
  reportType: string
  userEmail?: string
}

function EmailModal({ isOpen, onClose, onSubmit, loading, reportType, userEmail }: EmailModalProps) {
  const [email, setEmail] = useState('')
  const [includeAIInsights, setIncludeAIInsights] = useState(true)
  const [includeAssociatesCSV, setIncludeAssociatesCSV] = useState(true)
  const [includeSummaryCSV, setIncludeSummaryCSV] = useState(true)
  const [customTitle, setCustomTitle] = useState('')
  const [sendToSelf, setSendToSelf] = useState(true)

  // Set user email when modal opens
  useEffect(() => {
    if (isOpen && userEmail) {
      setEmail(userEmail)
      setSendToSelf(true)
    }
  }, [isOpen, userEmail])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim()) {
      onSubmit(email.trim(), {
        includeAIInsights,
        includeAssociatesCSV,
        includeSummaryCSV,
        customTitle: customTitle.trim() || undefined,
        templateType: 'full'
      })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">📧 Email Report</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={loading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Recipient Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📧 Recipient Email
              </label>
              
              {/* Send to self option */}
              {userEmail && (
                <div className="mb-3">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="emailOption"
                      checked={sendToSelf}
                      onChange={() => {
                        setSendToSelf(true)
                        setEmail(userEmail)
                      }}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                      disabled={loading}
                    />
                    <span className="text-sm text-gray-700">
                      📧 Send to me ({userEmail})
                    </span>
                  </label>
                  
                  <label className="flex items-center space-x-2 cursor-pointer mt-2">
                    <input
                      type="radio"
                      name="emailOption"
                      checked={!sendToSelf}
                      onChange={() => setSendToSelf(false)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                      disabled={loading}
                    />
                    <span className="text-sm text-gray-700">
                      📤 Send to different email
                    </span>
                  </label>
                </div>
              )}

              {/* Email input */}
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (userEmail && e.target.value !== userEmail) {
                    setSendToSelf(false)
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder={userEmail ? "manager@vineyard.com" : "your-email@example.com"}
                required
                disabled={loading || (sendToSelf && userEmail)}
              />
              
              {userEmail && (
                <p className="text-xs text-gray-500 mt-1">
                  {sendToSelf 
                    ? "✅ Report will be sent to your account email" 
                    : "📤 Enter the recipient email address"
                  }
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Custom Title (Optional)
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder={`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`}
                disabled={loading}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="ai-insights"
                  checked={includeAIInsights}
                  onChange={(e) => setIncludeAIInsights(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  disabled={loading}
                />
                <label htmlFor="ai-insights" className="ml-2 text-sm text-gray-700">
                  🤖 Include AI Insights
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="associates-csv"
                  checked={includeAssociatesCSV}
                  onChange={(e) => setIncludeAssociatesCSV(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  disabled={loading}
                />
                <label htmlFor="associates-csv" className="ml-2 text-sm text-gray-700">
                  📊 Include Associates CSV
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="summary-csv"
                  checked={includeSummaryCSV}
                  onChange={(e) => setIncludeSummaryCSV(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  disabled={loading}
                />
                <label htmlFor="summary-csv" className="ml-2 text-sm text-gray-700">
                  📈 Include Summary CSV
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    <span>Send Report</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function EmailReportButton({ 
  reportType, 
  startDate, 
  endDate, 
  className = '', 
  disabled = false,
  existingMetrics,
  existingYearComparison
}: EmailReportButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userLoading, setUserLoading] = useState(true)

  // Get user email from Supabase
  useEffect(() => {
    async function getUserEmail() {
      try {
        const supabase = createClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) {
          console.error('Error getting user:', error)
        } else if (user?.email) {
          setUserEmail(user.email)
        }
      } catch (error) {
        console.error('Error fetching user email:', error)
      } finally {
        setUserLoading(false)
      }
    }

    getUserEmail()
  }, [])

  const handleSendReport = async (email: string, options: any) => {
    try {
      setLoading(true)
      setMessage(null)

      const requestBody: any = {
        email,
        reportType,
        options
      }

      // Add date range for custom reports
      if (reportType === 'custom' && startDate && endDate) {
        requestBody.startDate = startDate.toISOString().split('T')[0]
        requestBody.endDate = endDate.toISOString().split('T')[0]
      }

      // If we have existing data, use the optimized endpoint
      if (existingMetrics || existingYearComparison) {
        requestBody.existingData = {
          metrics: existingMetrics,
          yearComparison: existingYearComparison
        }
        console.log('📧 Sending report with existing data (no re-fetch)...', requestBody)
        
        const response = await fetch('/api/reports/send-optimized', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        })
        
        const data = await response.json()

        if (response.ok && data.success) {
          setMessage({
            type: 'success',
            text: `✅ Report sent successfully to ${email}! Processing time: ${(data.data.processingTime / 1000).toFixed(1)}s`
          })
          setIsModalOpen(false)
        } else {
          setMessage({
            type: 'error',
            text: `❌ Failed to send report: ${data.error || 'Unknown error'}`
          })
        }
        return
      }

      // Fallback to regular endpoint (re-fetches data)
      console.log('📧 Sending report via API (will re-fetch data)...', requestBody)

      const response = await fetch('/api/reports/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setMessage({
          type: 'success',
          text: `✅ Report sent successfully to ${email}! Processing time: ${(data.data.processingTime / 1000).toFixed(1)}s`
        })
        setIsModalOpen(false)
      } else {
        setMessage({
          type: 'error',
          text: `❌ Failed to send report: ${data.error || 'Unknown error'}`
        })
      }
    } catch (error: any) {
      console.error('Error sending report:', error)
      setMessage({
        type: 'error',
        text: `❌ Network error: ${error.message}`
      })
    } finally {
      setLoading(false)
    }
  }

  const getButtonText = () => {
    const baseText = (() => {
      switch (reportType) {
        case 'daily': return '📧 Email Daily Report'
        case 'weekly': return '📧 Email Weekly Report'
        case 'monthly': return '📧 Email Monthly Report'
        case 'quarterly': return '📧 Email Quarterly Report'
        case 'year-over-year': return '📧 Email Year Comparison'
        case 'custom': return '📧 Email Custom Report'
        default: return '📧 Email Report'
      }
    })()

    // Show user email if available and loading is complete
    if (userEmail && !userLoading) {
      return `${baseText} → ${userEmail}`
    }

    return baseText
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        disabled={disabled}
        className={`px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2 ${className}`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <span>{getButtonText()}</span>
      </button>

      <EmailModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setMessage(null)
        }}
        onSubmit={handleSendReport}
        loading={loading}
        reportType={reportType}
        userEmail={userEmail || undefined}
      />

      {/* Message Display */}
      {message && (
        <div className={`fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 max-w-md ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{message.text}</p>
            <button
              onClick={() => setMessage(null)}
              className="ml-4 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
