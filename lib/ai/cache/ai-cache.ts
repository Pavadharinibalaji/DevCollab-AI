/**
 * Cached entry structure containing the cached value and its absolute expiration timestamp.
 */
interface CacheEntry<T> {
  value: T;
  expiry: number;
}

/**
 * In-memory TTL cache for AI responses and intent mappings.
 *
 * Prevents redundant calls to external model providers by storing past outcomes.
 * Supports lazy expiration cleanup on lookups, explicit deletion, and active timeout cleanup.
 *
 * Supported Agents in next phase:
 * - PlanningAgent: Cache task breakdown results
 * - RepositoryAgent: Cache codebase file analysis results
 * - KnowledgeAgent: Cache scientific lookup answers (UniProt/ChEMBL)
 * - RiskAgent: Cache risk assessment reports
 * - CodeAgent: Cache generated code snippets
 * - ScrumAgent: Cache compiled standup summaries
 */
export class AICache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTtlMs: number;
  private activeTimeouts = new Map<string, NodeJS.Timeout>();

  /**
   * Instantiates the cache with a default TTL.
   *
   * @param defaultTtlSeconds Default time-to-live in seconds. Defaults to 300 seconds (5 minutes).
   */
  constructor(defaultTtlSeconds: number = 300) {
    this.defaultTtlMs = defaultTtlSeconds * 1000;
  }

  /**
   * Retrieves a value from the cache. Returns null if expired or missing.
   *
   * @param key Cache key string.
   * @returns The cached value or null if invalid/expired.
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Lazy cleanup: check if expired
    if (Date.now() > entry.expiry) {
      this.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Stores a value in the cache with an optional custom TTL.
   * Sets up active timeout expiration to clean up resources automatically.
   *
   * @param key Cache key string.
   * @param value The value to cache.
   * @param ttlSeconds Optional custom TTL in seconds.
   */
  set<T>(key: string, value: T, ttlSeconds?: number): void {
    const ttlMs =
      ttlSeconds !== undefined ? ttlSeconds * 1000 : this.defaultTtlMs;
    const expiry = Date.now() + ttlMs;

    // Clear any existing timeout for this key before setting a new one
    this.clearTimeout(key);

    this.cache.set(key, { value, expiry });

    // Active automatic expiration cleanup
    if (ttlMs > 0) {
      const timeout = setTimeout(() => {
        const current = this.cache.get(key);
        if (current && current.expiry <= Date.now()) {
          this.cache.delete(key);
        }
        this.activeTimeouts.delete(key);
      }, ttlMs);

      // If in Node.js environment, unref to avoid blocking process termination (helpful in tests/scripts)
      if (timeout && typeof timeout.unref === "function") {
        timeout.unref();
      }

      this.activeTimeouts.set(key, timeout);
    }
  }

  /**
   * Deletes an entry from the cache and cleans up its timeout resource.
   *
   * @param key Cache key string to remove.
   * @returns true if deleted, false otherwise.
   */
  delete(key: string): boolean {
    this.clearTimeout(key);
    return this.cache.delete(key);
  }

  /**
   * Clears all cache entries and timeouts.
   */
  clear(): void {
    for (const key of this.activeTimeouts.keys()) {
      this.clearTimeout(key);
    }
    this.activeTimeouts.clear();
    this.cache.clear();
  }

  /**
   * Clears the active timeout for a key.
   */
  private clearTimeout(key: string): void {
    const timeout = this.activeTimeouts.get(key);
    if (timeout) {
      clearTimeout(timeout);
      this.activeTimeouts.delete(key);
    }
  }
}

// Export a default cache instance
export const aiCache = new AICache();
