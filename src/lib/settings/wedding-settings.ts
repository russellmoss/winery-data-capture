import { createClient } from '@/lib/supabase/server'

export interface WeddingSetting {
  id: string
  setting_key: string
  setting_value: boolean
  description: string
  created_at: string
  updated_at: string
}

export interface WeddingSettings {
  showWeddingMetrics: boolean
  showWeddingCaptureRate: boolean
  showWeddingLeadProfiles: boolean
  showWeddingSubscriptionRate: boolean
}

/**
 * Fetch wedding settings from the database
 */
export async function getWeddingSettings(): Promise<WeddingSettings> {
  try {
    const supabase = await createClient()
    console.log('Wedding settings: Supabase client created:', !!supabase)
    console.log('Wedding settings: Supabase client has from method:', typeof supabase.from)
    
    const { data, error } = await supabase
      .from('wedding_settings')
      .select('*')
      .order('setting_key', { ascending: true })

    if (error) {
      console.warn('Wedding settings table not found or error fetching settings:', error)
      // Return default values if there's an error (table doesn't exist yet)
      return {
        showWeddingMetrics: true,
        showWeddingCaptureRate: true,
        showWeddingLeadProfiles: true,
        showWeddingSubscriptionRate: true
      }
    }

    // Convert array to object with default values
    const settings: WeddingSettings = {
      showWeddingMetrics: true,
      showWeddingCaptureRate: true,
      showWeddingLeadProfiles: true,
      showWeddingSubscriptionRate: true
    }

    // Map database values to our interface
    data?.forEach((setting: WeddingSetting) => {
      switch (setting.setting_key) {
        case 'show_wedding_metrics':
          settings.showWeddingMetrics = setting.setting_value
          break
        case 'show_wedding_capture_rate':
          settings.showWeddingCaptureRate = setting.setting_value
          break
        case 'show_wedding_lead_profiles':
          settings.showWeddingLeadProfiles = setting.setting_value
          break
        case 'show_wedding_subscription_rate':
          settings.showWeddingSubscriptionRate = setting.setting_value
          break
      }
    })

    return settings
  } catch (error) {
    console.warn('Wedding settings table not found or error fetching settings:', error)
    // Return default values if there's an error (table doesn't exist yet)
    return {
      showWeddingMetrics: true,
      showWeddingCaptureRate: true,
      showWeddingLeadProfiles: true,
      showWeddingSubscriptionRate: true
    }
  }
}

/**
 * Get a specific wedding setting by key
 */
export async function getWeddingSetting(key: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('wedding_settings')
      .select('setting_value')
      .eq('setting_key', key)
      .single()

    if (error) {
      console.warn(`Wedding settings table not found or error fetching setting ${key}:`, error)
      return true // Default to true if there's an error
    }

    return data?.setting_value ?? true
  } catch (error) {
    console.warn(`Wedding settings table not found or error fetching setting ${key}:`, error)
    return true // Default to true if there's an error
  }
}
