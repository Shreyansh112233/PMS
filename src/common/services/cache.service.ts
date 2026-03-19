import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

/**
 * Cache-aside wrapper with error resilience.
 * Cache failures never break the app — a failed get returns undefined (cache miss),
 * a failed set/del is logged but swallowed.
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    try {
      return await this.cache.get<T>(key);
    } catch (err) {
      this.logger.warn(`Cache GET failed for key "${key}": ${err}`);
      return undefined;
    }
  }

  async set(key: string, value: unknown, ttlMs?: number): Promise<void> {
    try {
      await this.cache.set(key, value, ttlMs);
    } catch (err) {
      this.logger.warn(`Cache SET failed for key "${key}": ${err}`);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cache.del(key);
    } catch (err) {
      this.logger.warn(`Cache DEL failed for key "${key}": ${err}`);
    }
  }
}
