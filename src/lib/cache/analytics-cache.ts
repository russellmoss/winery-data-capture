import { DataCaptureMetrics } from '@/lib/analytics/service'

interface CacheEntry {
  data: DataCaptureMetrics
  timestamp: number
  expiresAt: number
}

class AnalyticsCache {
  private cache = new Map<string, CacheEntry>()
  private readonly CACHE_DURATION = 48 * 60 * 60 * 1000 // 48 hours in milliseconds

  /**
   * Generate a cache key based on the date range
   */
  private generateCacheKey(startDate: Date, endDate: Date): string {
    const start = startDate.toISOString().split('T')[0] // YYYY-MM-DD
    const end = endDate.toISOString().split('T')[0] // YYYY-MM-DD
    return `analytics:${start}:${end}`
  }

  /**
   * Get cached analytics data if it exists and is not expired
   */
  get(startDate: Date, endDate: Date): DataCaptureMetrics | null {
    const key = this.generateCacheKey(startDate, endDate)
    const entry = this.cache.get(key)

    if (!entry) {
      console.log(`Analytics Cache: No cache entry found for key: ${key}`)
      return null
    }

    const now = Date.now()
    if (now > entry.expiresAt) {
      console.log(`Analytics Cache: Cache expired for key: ${key} (expired at: ${new Date(entry.expiresAt).toISOString()})`)
      this.cache.delete(key)
      return null
    }

    const ageMinutes = Math.round((now - entry.timestamp) / (1000 * 60))
    console.log(`Analytics Cache: Cache hit for key: ${key} (age: ${ageMinutes} minutes)`)
    return entry.data
  }

  /**
   * Store analytics data in cache
   */
  set(startDate: Date, endDate: Date, data: DataCaptureMetrics): void {
    const key = this.generateCacheKey(startDate, endDate)
    const now = Date.now()
    const expiresAt = now + this.CACHE_DURATION

    const entry: CacheEntry = {
      data,
      timestamp: now,
      expiresAt
    }

    this.cache.set(key, entry)
    console.log(`Analytics Cache: Cached data for key: ${key} (expires at: ${new Date(expiresAt).toISOString()})`)
  }

  /**
   * Clear cache for a specific date range
   */
  clear(startDate: Date, endDate: Date): void {
    const key = this.generateCacheKey(startDate, endDate)
    const deleted = this.cache.delete(key)
    console.log(`Analytics Cache: ${deleted ? 'Cleared' : 'No cache found'} for key: ${key}`)
  }

  /**
   * Clear all cached data
   */
  clearAll(): void {
    const count = this.cache.size
    this.cache.clear()
    console.log(`Analytics Cache: Cleared all ${count} cache entries`)
  }

  /**
   * Get cache statistics
   */
  getStats(): { totalEntries: number; entries: Array<{ key: string; age: number; expiresAt: Date }> } {
    const now = Date.now()
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: Math.round((now - entry.timestamp) / (1000 * 60)), // age in minutes
      expiresAt: new Date(entry.expiresAt)
    }))

    return {
      totalEntries: this.cache.size,
      entries
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now()
    let cleaned = 0

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
        cleaned++
      }
    }

    if (cleaned > 0) {
      console.log(`Analytics Cache: Cleaned up ${cleaned} expired entries`)
    }
  }
}

// Export a singleton instance
export const analyticsCache = new AnalyticsCache()

// Clean up expired entries every hour
setInterval(() => {
  analyticsCache.cleanup()
}, 60 * 60 * 1000) // 1 hour
