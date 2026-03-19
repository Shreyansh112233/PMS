import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import * as bcrypt from 'bcrypt';
import { REDIS_CLIENT } from '../redis/redis.module';
import { ConfigService } from '@nestjs/config';
import { ConfigType } from '../config/config.type';
import ms from 'ms';

const REFRESH_TOKEN_PREFIX = 'pms:refresh';

@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);
  private readonly ttlSeconds: number;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly configService: ConfigService<ConfigType>,
  ) {
    const authConf = this.configService.get('auth', { infer: true })!;
    const expiresIn = authConf.refresh.expiresIn || '7d';
    // Parse the JWT_REFRESH_EXPIRES_IN value to seconds
    this.ttlSeconds = Math.floor(ms(expiresIn as ms.StringValue) / 1000);
  }

  /**
   * Store a hashed refresh token in Redis.
   * Key pattern: pms:refresh:{userId}:{tokenId}
   */
  async storeToken(userId: string, tokenId: string, rawToken: string): Promise<void> {
    const hashedToken = await bcrypt.hash(rawToken, 10);
    const key = `${REFRESH_TOKEN_PREFIX}:${userId}:${tokenId}`;
    await this.redis.set(key, hashedToken, 'EX', this.ttlSeconds);
    this.logger.debug(`Stored refresh token for user ${userId}, session ${tokenId}`);
  }

  /**
   * Validate a refresh token against what's stored in Redis.
   */
  async validateToken(userId: string, tokenId: string, rawToken: string): Promise<boolean> {
    const key = `${REFRESH_TOKEN_PREFIX}:${userId}:${tokenId}`;
    const hashedToken = await this.redis.get(key);
    if (!hashedToken) return false;
    return bcrypt.compare(rawToken, hashedToken);
  }

  /**
   * Revoke a specific session (logout from one device).
   */
  async revokeToken(userId: string, tokenId: string): Promise<void> {
    const key = `${REFRESH_TOKEN_PREFIX}:${userId}:${tokenId}`;
    await this.redis.del(key);
    this.logger.debug(`Revoked refresh token for user ${userId}, session ${tokenId}`);
  }

  /**
   * Revoke all sessions for a user (logout from all devices).
   * Uses SCAN instead of KEYS for production safety (non-blocking).
   */
  async revokeAllTokens(userId: string): Promise<void> {
    const pattern = `${REFRESH_TOKEN_PREFIX}:${userId}:*`;
    let cursor = '0';
    let totalDeleted = 0;

    do {
      const [nextCursor, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      if (keys.length > 0) {
        await this.redis.del(...keys);
        totalDeleted += keys.length;
      }
    } while (cursor !== '0');

    this.logger.log(`Revoked ${totalDeleted} refresh tokens for user ${userId}`);
  }
}
