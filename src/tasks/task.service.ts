import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskEntity } from './entities/task.entities';
import { Project } from '../projects/entities/project.entity';
import { User } from '../user/entities/user.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { AssignTaskDto } from './dto/assign-task.dto';
import { CacheService } from '../common/services/cache.service';
import { CacheKeys } from '../common/utils/cache-keys';

const CACHE_TTL_MS = 120_000; // 2 minutes

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(
    @InjectRepository(TaskEntity)
    private readonly taskRepository: Repository<TaskEntity>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly cacheService: CacheService,
  ) {}

  async create(
    projectId: string,
    dto: CreateTaskDto,
    currentUserId: string,
  ): Promise<TaskEntity> {
    const project = await this.findProject(projectId);
    this.assertMemberOrOwner(project, currentUserId);

    if (dto.assignedTo) {
      await this.findUser(dto.assignedTo);
    }

    const task = this.taskRepository.create({
      ...dto,
      projectId,
    });
    const saved = await this.taskRepository.save(task);
    this.logger.log(
      `Task created: "${saved.title}" (${saved.id}) in project ${projectId} by user ${currentUserId}`,
    );
    await this.cacheService.del(CacheKeys.tasksByProject(projectId));
    return saved;
  }

  async findAllByProject(
    projectId: string,
    currentUserId: string,
  ): Promise<TaskEntity[]> {
    const project = await this.findProject(projectId);
    this.assertMemberOrOwner(project, currentUserId);

    const cacheKey = CacheKeys.tasksByProject(projectId);
    const cached = await this.cacheService.get<TaskEntity[]>(cacheKey);
    if (cached) return cached;

    const tasks = await this.taskRepository.find({
      where: { projectId },
      relations: ['assignee'],
    });
    await this.cacheService.set(cacheKey, tasks, CACHE_TTL_MS);
    return tasks;
  }

  async update(
    taskId: string,
    dto: UpdateTaskDto,
    currentUserId: string,
  ): Promise<TaskEntity> {
    const task = await this.findTask(taskId);
    const project = await this.findProject(task.projectId);
    this.assertMemberOrOwner(project, currentUserId);

    if (dto.assignedTo) {
      await this.findUser(dto.assignedTo);
    }

    Object.assign(task, dto);
    const saved = await this.taskRepository.save(task);
    await this.cacheService.del(CacheKeys.tasksByProject(task.projectId));
    return saved;
  }

  async updateStatus(
    taskId: string,
    dto: UpdateTaskStatusDto,
    currentUserId: string,
  ): Promise<TaskEntity> {
    const task = await this.findTask(taskId);
    const project = await this.findProject(task.projectId);
    this.assertMemberOrOwner(project, currentUserId);

    task.status = dto.status;
    const saved = await this.taskRepository.save(task);
    await this.cacheService.del(CacheKeys.tasksByProject(task.projectId));
    return saved;
  }

  async assign(
    taskId: string,
    dto: AssignTaskDto,
    currentUserId: string,
  ): Promise<TaskEntity> {
    const task = await this.findTask(taskId);
    const project = await this.findProject(task.projectId);
    this.assertMemberOrOwner(project, currentUserId);
    await this.findUser(dto.assignedTo);

    task.assignedTo = dto.assignedTo;
    const saved = await this.taskRepository.save(task);
    await this.cacheService.del(CacheKeys.tasksByProject(task.projectId));
    return saved;
  }

  private async findTask(taskId: string): Promise<TaskEntity> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['assignee'],
    });
    if (!task) {
      throw new NotFoundException(`Task with id ${taskId} not found`);
    }
    return task;
  }

  private async findProject(projectId: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['members'],
    });
    if (!project) {
      throw new NotFoundException(`Project with id ${projectId} not found`);
    }
    return project;
  }

  private async findUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }
    return user;
  }

  private assertMemberOrOwner(project: Project, userId: string): void {
    const isMember = project.members.some((m) => m.id === userId);
    const isOwner = project.ownerId === userId;
    if (!isMember && !isOwner) {
      throw new ForbiddenException(
        'You must be a project member or owner to perform this action',
      );
    }
  }
}
