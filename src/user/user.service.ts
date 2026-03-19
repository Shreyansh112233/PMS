import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CacheService } from '../common/services/cache.service';
import { CacheKeys } from '../common/utils/cache-keys';

const CACHE_TTL_MS = 600_000; // 10 minutes

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly cacheService: CacheService,
  ) {}

  async findOne(userId: string): Promise<User> {
    const cacheKey = CacheKeys.user(userId);
    const cached = await this.cacheService.get<User>(cacheKey);
    if (cached) return cached;

    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }
    await this.cacheService.set(cacheKey, user, CACHE_TTL_MS);
    return user;
  }
}
