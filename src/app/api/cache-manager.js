// Smart cache to make 10 Stormglass requests last all week
class CacheManager {
  constructor() {
    this.cache = new Map()
    this.CURRENT_CONDITIONS_TTL = 3 * 60 * 60 * 1000 // 3 hours
    this.FORECAST_TTL = 6 * 60 * 60 * 1000 // 6 hours
  }

  generateKey(lat, lng, type = 'current') {
    return `${lat}-${lng}-${type}`
  }

  isExpired(timestamp, ttl) {
    return Date.now() - timestamp > ttl
  }

  get(lat, lng, type = 'current') {
    const key = this.generateKey(lat, lng, type)
    const cached = this.cache.get(key)
    
    if (!cached) return null
    
    const ttl = type === 'forecast' ? this.FORECAST_TTL : this.CURRENT_CONDITIONS_TTL
    
    if (this.isExpired(cached.timestamp, ttl)) {
      this.cache.delete(key)
      return null
    }
    
    console.log(`Cache HIT for ${key} - saved API call!`)
    return cached.data
  }

  set(lat, lng, data, type = 'current') {
    const key = this.generateKey(lat, lng, type)
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
    console.log(`Cache SET for ${key}`)
  }

  getStats() {
    return {
      totalCached: this.cache.size,
      entries: Array.from(this.cache.keys())
    }
  }
}

// Singleton instance
const cacheManager = new CacheManager()
export default cacheManager