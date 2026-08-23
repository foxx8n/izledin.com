/**
 * High-Scale Production Rate Limiter for izledin.com
 * Supports:
 * 1. Edge & Node.js in-memory Token Bucket (0ms latency, zero extra infrastructure required)
 * 2. Distributed Upstash Redis (when UPSTASH_REDIS_REST_URL & UPSTASH_REDIS_REST_TOKEN are provided)
 * 3. IP and User-ID multi-key throttling
 */

interface RateLimitConfig {
  limit: number;      // Maximum requests allowed within window
  windowMs: number;   // Sliding window in milliseconds
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number; // Unix timestamp in ms
}

class TokenBucketMemoryStore {
  private store: Map<string, { count: number; resetAt: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Periodic garbage collection every 60 seconds
    if (typeof window === 'undefined') {
      this.cleanupInterval = setInterval(() => {
        const now = Date.now();
        for (const [key, val] of this.store.entries()) {
          if (val.resetAt <= now) {
            this.store.delete(key);
          }
        }
      }, 60000);
      if (this.cleanupInterval && typeof this.cleanupInterval.unref === 'function') {
        this.cleanupInterval.unref();
      }
    }
  }

  check(key: string, limit: number, windowMs: number): RateLimitResult {
    const now = Date.now();
    const existing = this.store.get(key);

    if (!existing || existing.resetAt <= now) {
      // New window
      const resetAt = now + windowMs;
      this.store.set(key, { count: 1, resetAt });
      return {
        success: true,
        limit,
        remaining: limit - 1,
        resetAt,
      };
    }

    if (existing.count < limit) {
      existing.count += 1;
      return {
        success: true,
        limit,
        remaining: limit - existing.count,
        resetAt: existing.resetAt,
      };
    }

    // Rate limited
    return {
      success: false,
      limit,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }
}

const globalMemoryStore = new TokenBucketMemoryStore();

// Pre-defined Rate Limit Profiles
export const RATE_LIMIT_PROFILES = {
  // Reviews & Watch Diary logging (Max 6 logs per minute)
  DIARY_LOG: { limit: 6, windowMs: 60 * 1000 },
  // Direct Chat Messages (Max 25 messages per minute)
  CHAT_MESSAGE: { limit: 25, windowMs: 60 * 1000 },
  // Social Swipes / Match creation (Max 35 per minute)
  MATCH_SWIPE: { limit: 35, windowMs: 60 * 1000 },
  // Live OMDB Worldwide Search (Max 40 searches per minute)
  SEARCH_QUERY: { limit: 40, windowMs: 60 * 1000 },
  // Auth Sign-in / OTP requests (Max 5 attempts per 15 minutes)
  AUTH_ATTEMPT: { limit: 5, windowMs: 15 * 60 * 1000 },
};

/**
 * Universal rate limit checker.
 * @param identifier User ID or Client IP Address
 * @param profile Rate limit profile configuration
 */
export async function checkRateLimit(
  identifier: string,
  profile: RateLimitConfig
): Promise<RateLimitResult> {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  // 1. Distributed Upstash Redis (if configured in production env)
  if (upstashUrl && upstashToken) {
    try {
      const key = `ratelimit:${identifier}`;
      const res = await fetch(`${upstashUrl}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${upstashToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          ['INCR', key],
          ['PTTL', key],
        ]),
      });

      if (res.ok) {
        const [incrRes, pttlRes] = await res.json();
        const count = incrRes.result;
        let ttl = pttlRes.result;

        // If newly created key without TTL, set expiration
        if (ttl === -1) {
          await fetch(`${upstashUrl}/PEXPIRE/${key}/${profile.windowMs}`, {
            headers: { Authorization: `Bearer ${upstashToken}` },
          });
          ttl = profile.windowMs;
        }

        const success = count <= profile.limit;
        return {
          success,
          limit: profile.limit,
          remaining: Math.max(0, profile.limit - count),
          resetAt: Date.now() + (ttl > 0 ? ttl : profile.windowMs),
        };
      }
    } catch (err) {
      console.warn('Upstash Redis rate limiter fallback to in-memory store:', err);
    }
  }

  // 2. High-Performance Token Bucket In-Memory Store (0ms Fallback)
  return globalMemoryStore.check(identifier, profile.limit, profile.windowMs);
}
