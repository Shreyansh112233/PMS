import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { typeORMConfig } from './config/database.config';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { appConfigSchema, ConfigType } from './config/config.type';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ProjectModule } from './projects/project.module';
import { TaskModule } from './tasks/task.module';
import { CommentModule } from './comments/comment.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user/entities/user.entity';
import { Project } from './projects/entities/project.entity';
import { TaskEntity } from './tasks/entities/task.entities';
import { CommentEntity } from './comments/entities/comment.entity';
import { LabelEntity } from './labels/entities/label.entity';
import { authConfig } from './config/auth.config';
import { redisConfig } from './config/redis.config';
import { RedisModule } from './redis/redis.module';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis-yet';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import Redis from 'ioredis';
import { APP_GUARD } from '@nestjs/core';
import { CustomThrottlerGuard } from './common/guards/custom-throttler.guard';
import { ScheduleModule } from '@nestjs/schedule';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [typeORMConfig, authConfig, redisConfig],
      validationSchema: appConfigSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<ConfigType>) => ({
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        ...configService.get('database'),
        entities: [User, Project, TaskEntity, CommentEntity, LabelEntity],
      }),
    }),
    RedisModule,
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService<ConfigType>) => {
        const redisConf = config.get('redis', { infer: true })!;
        return {
          store: await redisStore({
            host: redisConf.host,
            port: redisConf.port,
          }),
          ttl: 300_000, // default 300s in ms
        };
      },
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<ConfigType>) => {
        const redisConf = config.get('redis', { infer: true })!;
        return {
          throttlers: [{ name: 'default', ttl: 60_000, limit: 100 }],
          storage: new ThrottlerStorageRedisService(
            new Redis({ host: redisConf.host, port: redisConf.port }),
          ),
        };
      },
    }),
    ScheduleModule.forRoot(),
    CommonModule,
    AuthModule,
    UserModule,
    ProjectModule,
    TaskModule,
    CommentModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: CustomThrottlerGuard },
  ],
})
export class AppModule {}
