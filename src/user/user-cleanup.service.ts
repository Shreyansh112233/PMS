import { Inject, Injectable } from '@nestjs/common';
import type { LoggerService } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Injectable()
export class UserCleanupService {
  private readonly RETENTION_DAYS = 30;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async purgeDeletedUsers(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.RETENTION_DAYS);

    const users = await this.userRepository
      .createQueryBuilder('user')
      .withDeleted()
      .where('user.deletedAt IS NOT NULL')
      .andWhere('user.deletedAt < :cutoffDate', { cutoffDate })
      .getMany();

    if (users.length === 0) {
      this.logger.log(
        'No soft-deleted users past retention period found',
        'UserCleanupService',
      );
      return;
    }

    await this.userRepository
      .createQueryBuilder()
    .delete()
      .from(User)
      .where('deletedAt IS NOT NULL')
      .andWhere('deletedAt < :cutoffDate', { cutoffDate })
      .execute();

    this.logger.log(
      `Permanently deleted ${users.length} user(s) past ${this.RETENTION_DAYS}-day retention period`,
      'UserCleanupService',
    );
  }
}
