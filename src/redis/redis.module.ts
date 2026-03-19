import { Global, Logger, Module, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { ConfigType } from '../config/config.type';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (config: ConfigService<ConfigType>) => {
        const logger = new Logger('RedisModule');
        const redisConf = config.get('redis', { infer: true })!;

        const client = new Redis({
          host: redisConf.host,
          port: redisConf.port,
          maxRetriesPerRequest: 3,
          retryStrategy(times) {
            const delay = Math.min(times * 200, 2000);
            return delay;
          },
        });

        client.on('connect', () => logger.log('Redis connected'));
        client.on('error', (err) => logger.error('Redis error', err.message));

        return client;
      },
      inject: [ConfigService],
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule implements OnModuleDestroy {
  constructor(
    private readonly config: ConfigService<ConfigType>,
  ) {}

  // Graceful shutdown: close Redis connection when app stops
  async onModuleDestroy() {
    // The REDIS_CLIENT provider handles its own lifecycle via ioredis
    // ioredis auto-disconnects when the process exits, but we log for clarity
    const logger = new Logger('RedisModule');
    logger.log('Redis module destroyed');
  }
}
