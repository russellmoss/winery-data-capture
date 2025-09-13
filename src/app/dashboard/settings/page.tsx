'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface GuestCountSKU {
  id: string
  name: string
  sku_id: string
  created_at: string
}

interface WeddingSetting {
  id: string
  setting_key: string
  setting_value: boolean
  description: string
  created_at: string
  updated_at: string
}

export default function SettingsPage() {
  const [skus, setSkus] = useState<GuestCountSKU[]>([])
  const [weddingSettings, setWeddingSettings] = useState<WeddingSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newSkuName, setNewSkuName] = useState('')
  const [newSkuId, setNewSkuId] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const supabase = createClient()

  useEffect(() => {
    loadSkus()
    loadWeddingSettings()
  }, [])

  const loadSkus = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('guest_count_skus')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error loading SKUs:', error)
        setMessage({ type: 'error', text: 'Failed to load SKU settings' })
        return
      }

      setSkus(data || [])
    } catch (error) {
      console.error('Error loading SKUs:', error)
      setMessage({ type: 'error', text: 'Failed to load SKU settings' })
    } finally {
      setLoading(false)
    }
  }

  const loadWeddingSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('wedding_settings')
        .select('*')
        .order('setting_key', { ascending: true })

      if (error) {
        console.warn('Wedding settings table not found or error loading settings:', error)
        // Don't show error message to user - this is expected if table doesn't exist yet
        setWeddingSettings([])
        return
      }

      setWeddingSettings(data || [])
    } catch (error) {
      console.warn('Wedding settings table not found or error loading settings:', error)
      // Don't show error message to user - this is expected if table doesn't exist yet
      setWeddingSettings([])
    }
  }

  const addSku = async () => {
    if (!newSkuName.trim() || !newSkuId.trim()) {
      setMessage({ type: 'error', text: 'Please enter both SKU name and ID' })
      return
    }

    try {
      setSaving(true)
      const { data, error } = await supabase
        .from('guest_count_skus')
        .insert([
          {
            name: newSkuName.trim(),
            sku_id: newSkuId.trim()
          }
        ])
        .select()

      if (error) {
        console.error('Error adding SKU:', error)
        setMessage({ type: 'error', text: 'Failed to add SKU' })
        return
      }

      if (data && data.length > 0) {
        setSkus([...skus, data[0]])
        setNewSkuName('')
        setNewSkuId('')
        setMessage({ type: 'success', text: 'SKU added successfully' })
      }
    } catch (error) {
      console.error('Error adding SKU:', error)
      setMessage({ type: 'error', text: 'Failed to add SKU' })
    } finally {
      setSaving(false)
    }
  }

  const removeSku = async (id: string) => {
    if (!confirm('Are you sure you want to remove this SKU?')) {
      return
    }

    try {
      setSaving(true)
      const { error } = await supabase
        .from('guest_count_skus')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error removing SKU:', error)
        setMessage({ type: 'error', text: 'Failed to remove SKU' })
        return
      }

      setSkus(skus.filter(sku => sku.id !== id))
      setMessage({ type: 'success', text: 'SKU removed successfully' })
    } catch (error) {
      console.error('Error removing SKU:', error)
      setMessage({ type: 'error', text: 'Failed to remove SKU' })
    } finally {
      setSaving(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addSku()
    }
  }

  const toggleWeddingSetting = async (settingId: string, newValue: boolean) => {
    try {
      setSaving(true)
      const { error } = await supabase
        .from('wedding_settings')
        .update({ setting_value: newValue })
        .eq('id', settingId)

      if (error) {
        console.error('Error updating wedding setting:', error)
        setMessage({ type: 'error', text: 'Failed to update wedding setting' })
        return
      }

      // Update local state
      setWeddingSettings(prev => 
        prev.map(setting => 
          setting.id === settingId 
            ? { ...setting, setting_value: newValue }
            : setting
        )
      )
      
      setMessage({ type: 'success', text: 'Wedding setting updated successfully' })
    } catch (error) {
      console.error('Error updating wedding setting:', error)
      setMessage({ type: 'error', text: 'Failed to update wedding setting' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">
            Configure your winery's data capture settings and preferences.
          </p>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-md ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {message.type === 'success' ? (
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{message.text}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setMessage(null)}
                  className="inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Guest Count SKUs Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Guest Count SKUs</h2>
            <p className="mt-1 text-sm text-gray-600">
              Configure the SKU IDs that represent guest counts in your system. 
              The system will use these to calculate accurate guest counts for reports.
            </p>
          </div>

          <div className="p-6">
            {/* Add New SKU Form */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Guest Count SKU</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="sku-name" className="block text-sm font-medium text-gray-700 mb-2">
                    SKU Name
                  </label>
                  <input
                    type="text"
                    id="sku-name"
                    value={newSkuName}
                    onChange={(e) => setNewSkuName(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="e.g., Tasting Fee, Wine Flight"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="sku-id" className="block text-sm font-medium text-gray-700 mb-2">
                    SKU ID
                  </label>
                  <input
                    type="text"
                    id="sku-id"
                    value={newSkuId}
                    onChange={(e) => setNewSkuId(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="e.g., TASTE001, FLIGHT002"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={addSku}
                  disabled={saving || !newSkuName.trim() || !newSkuId.trim()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {saving ? 'Adding...' : 'Add SKU'}
                </button>
              </div>
            </div>

            {/* Current SKUs List */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Current Guest Count SKUs ({skus.length})
              </h3>
              
              {skus.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No SKUs configured</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by adding your first guest count SKU.</p>
                </div>
              ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <ul className="divide-y divide-gray-200">
                    {skus.map((sku) => (
                      <li key={sku.id} className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-medium text-indigo-600">
                                    {sku.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {sku.name}
                                </p>
                                <p className="text-sm text-gray-500 truncate">
                                  ID: {sku.sku_id}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <button
                              onClick={() => removeSku(sku.id)}
                              disabled={saving}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Remove
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Wedding Feature Settings Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Wedding Feature Settings</h2>
            <p className="mt-1 text-sm text-gray-600">
              Configure which wedding-related metrics are displayed in your reports. 
              Toggle these off if your winery doesn't offer wedding services.
            </p>
          </div>

          <div className="p-6">
            <div className="space-y-6">
              {weddingSettings.map((setting) => (
                <div key={setting.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">
                      {setting.setting_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {setting.description}
                    </p>
                  </div>
                  <div className="ml-4">
                    <button
                      onClick={() => toggleWeddingSetting(setting.id, !setting.setting_value)}
                      disabled={saving}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                        setting.setting_value ? 'bg-indigo-600' : 'bg-gray-200'
                      } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          setting.setting_value ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {weddingSettings.length === 0 && (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No wedding settings found</h3>
                <p className="mt-1 text-sm text-gray-500">Wedding settings will appear here once configured.</p>
              </div>
            )}
          </div>
        </div>

        {/* Information Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                How Guest Count SKUs Work
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Guest Count SKUs are the product IDs in your Commerce7 system that represent 
                  guest visits (like tasting fees, wine flights, etc.). The system uses these SKUs 
                  to accurately calculate how many guests each associate has served.
                </p>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  <li>Add all SKUs that represent guest visits or tastings</li>
                  <li>Use descriptive names that your team will recognize</li>
                  <li>The system will automatically use these for guest count calculations</li>
                  <li>Changes take effect immediately for new reports</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
