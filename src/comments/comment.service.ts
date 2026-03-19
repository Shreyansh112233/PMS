import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommentEntity } from './entities/comment.entity';
import { TaskEntity } from '../tasks/entities/task.entities';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CacheService } from '../common/services/cache.service';
import { CacheKeys } from '../common/utils/cache-keys';

const CACHE_TTL_MS = 120_000; // 2 minutes

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(CommentEntity)
    private readonly commentRepository: Repository<CommentEntity>,
    @InjectRepository(TaskEntity)
    private readonly taskRepository: Repository<TaskEntity>,
    private readonly cacheService: CacheService,
  ) {}

  async create(
    taskId: string,
    userId: string,
    dto: CreateCommentDto,
  ): Promise<CommentEntity> {
    await this.findTask(taskId);

    const comment = this.commentRepository.create({
      ...dto,
      taskId,
      userId,
    });
    const saved = await this.commentRepository.save(comment);
    const result = await this.commentRepository.findOne({
      where: { id: saved.id },
      relations: ['user'],
    });

    if (!result) {
      throw new Error('Comment not found after save');
    }

    await this.cacheService.del(CacheKeys.commentsByTask(taskId));
    return result;
  }

  async findAllByTask(taskId: string): Promise<CommentEntity[]> {
    await this.findTask(taskId);

    const cacheKey = CacheKeys.commentsByTask(taskId);
    const cached = await this.cacheService.get<CommentEntity[]>(cacheKey);
    if (cached) return cached;

    const comments = await this.commentRepository.find({
      where: { taskId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
    await this.cacheService.set(cacheKey, comments, CACHE_TTL_MS);
    return comments;
  }

  private async findTask(taskId: string): Promise<TaskEntity> {
    const task = await this.taskRepository.findOneBy({ id: taskId });
    if (!task) {
      throw new NotFoundException(`Task with id ${taskId} not found`);
    }
    return task;
  }
}
