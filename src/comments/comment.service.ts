import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommentEntity } from './entities/comment.entity';
import { TaskEntity } from '../tasks/entities/task.entities';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(CommentEntity)
    private readonly commentRepository: Repository<CommentEntity>,
    @InjectRepository(TaskEntity)
    private readonly taskRepository: Repository<TaskEntity>,
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
    return this.commentRepository.findOne({
      where: { id: saved.id },
      relations: ['user'],
    });
  }

  async findAllByTask(taskId: string): Promise<CommentEntity[]> {
    await this.findTask(taskId);

    return this.commentRepository.find({
      where: { taskId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  private async findTask(taskId: string): Promise<TaskEntity> {
    const task = await this.taskRepository.findOneBy({ id: taskId });
    if (!task) {
      throw new NotFoundException(`Task with id ${taskId} not found`);
    }
    return task;
  }
}
