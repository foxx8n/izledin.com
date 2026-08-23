/**
 * Robust Multi-Tier Caching System for izledin.com
 * Features:
 * 1. Fast In-Memory LRU Cache (Instant lookups)
 * 2. Persistent LocalStorage Backup (Survives page reloads)
 * 3. Concurrent Request Deduplication (Prevents duplicate in-flight API requests)
 * 4. Automatic TTL (Time-To-Live) Expiration & Quota Management
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class MultiTierCache<T> {
  private memoryMap: Map<string, CacheEntry<T>> = new Map();
  private inFlightMap: Map<string, Promise<T>> = new Map();
  private prefix: string;
  private defaultTtlMs: number;
  private maxMemoryItems: number;
  private useLocalStorage: boolean;

  constructor(options: {
    prefix: string;
    defaultTtlMs?: number;
    maxMemoryItems?: number;
    useLocalStorage?: boolean;
  }) {
    this.prefix = `izledin_cache_${options.prefix}_`;
    this.defaultTtlMs = options.defaultTtlMs || 1000 * 60 * 60 * 24; // 24 hours default
    this.maxMemoryItems = options.maxMemoryItems || 300;
    this.useLocalStorage = options.useLocalStorage !== false;
  }

  /**
   * Retrieves an item from memory or localStorage if valid.
   */
  get(key: string): T | null {
    const fullKey = `${this.prefix}${key}`;
    const now = Date.now();

    // 1. Check in-memory cache
    const memoryEntry = this.memoryMap.get(fullKey);
    if (memoryEntry) {
      if (memoryEntry.expiresAt > now) {
        // Refresh LRU order (delete & re-insert)
        this.memoryMap.delete(fullKey);
        this.memoryMap.set(fullKey, memoryEntry);
        return memoryEntry.value;
      }
      this.memoryMap.delete(fullKey);
    }

    // 2. Check localStorage cache
    if (this.useLocalStorage && typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(fullKey);
        if (raw) {
          const parsed: CacheEntry<T> = JSON.parse(raw);
          if (parsed.expiresAt > now) {
            // Restore to memory map
            this.setMemory(fullKey, parsed);
            return parsed.value;
          }
          // Expired
          localStorage.removeItem(fullKey);
        }
      } catch (err) {
        // Fallback gracefully on storage quota or serialization error
      }
    }

    return null;
  }

  /**
   * Saves an item to memory and localStorage with a TTL.
   */
  set(key: string, value: T, customTtlMs?: number): void {
    const fullKey = `${this.prefix}${key}`;
    const ttl = customTtlMs ?? this.defaultTtlMs;
    const entry: CacheEntry<T> = {
      value,
      expiresAt: Date.now() + ttl,
    };

    // Store in memory
    this.setMemory(fullKey, entry);

    // Store in localStorage
    if (this.useLocalStorage && typeof window !== 'undefined') {
      try {
        localStorage.setItem(fullKey, JSON.stringify(entry));
      } catch (err) {
        // If storage quota exceeded, clear expired keys
        this.pruneLocalStorage();
      }
    }
  }

  /**
   * Deduplicates concurrent fetch calls for the same key.
   * If a fetch for this key is already running, returns the existing Promise.
   */
  async getOrFetch(key: string, fetcher: () => Promise<T>, customTtlMs?: number): Promise<T> {
    // 1. Check cache first
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    // 2. Check if a request is already in-flight for this key
    const fullKey = `${this.prefix}${key}`;
    const inFlight = this.inFlightMap.get(fullKey);
    if (inFlight) {
      return inFlight;
    }

    // 3. Initiate fetch and store the promise
    const fetchPromise = (async () => {
      try {
        const result = await fetcher();
        if (result !== null && result !== undefined) {
          this.set(key, result, customTtlMs);
        }
        return result;
      } finally {
        this.inFlightMap.delete(fullKey);
      }
    })();

    this.inFlightMap.set(fullKey, fetchPromise);
    return fetchPromise;
  }

  private setMemory(fullKey: string, entry: CacheEntry<T>): void {
    // Evict oldest if exceeding limit
    if (this.memoryMap.size >= this.maxMemoryItems) {
      const oldestKey = this.memoryMap.keys().next().value;
      if (oldestKey) {
        this.memoryMap.delete(oldestKey);
      }
    }
    this.memoryMap.set(fullKey, entry);
  }

  private pruneLocalStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const now = Date.now();
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(this.prefix)) {
          try {
            const item = JSON.parse(localStorage.getItem(k) || '');
            if (item.expiresAt && item.expiresAt <= now) {
              keysToRemove.push(k);
            }
          } catch {
            keysToRemove.push(k);
          }
        }
      }

      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {}
  }
}

// Pre-configured Application Caches:
// 1. Movie & Series Details (7 days TTL - movie details rarely change)
export const movieDetailsCache = new MultiTierCache<any>({
  prefix: 'movie_details',
  defaultTtlMs: 1000 * 60 * 60 * 24 * 7, // 7 Days
  maxMemoryItems: 500,
});

// 2. Search Query Cache (4 hours TTL - fast instant typing results)
export const searchQueryCache = new MultiTierCache<any>({
  prefix: 'search_query',
  defaultTtlMs: 1000 * 60 * 60 * 4, // 4 Hours
  maxMemoryItems: 200,
});

// 3. Trending & Upcoming Catalog (2 hours TTL)
export const trendingCatalogCache = new MultiTierCache<any>({
  prefix: 'trending_catalog',
  defaultTtlMs: 1000 * 60 * 60 * 2, // 2 Hours
  maxMemoryItems: 50,
});
