import {
  ForbiddenException,
  Injectable,
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

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(TaskEntity)
    private readonly taskRepository: Repository<TaskEntity>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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
    return this.taskRepository.save(task);
  }

  async findAllByProject(
    projectId: string,
    currentUserId: string,
  ): Promise<TaskEntity[]> {
    const project = await this.findProject(projectId);
    this.assertMemberOrOwner(project, currentUserId);

    return this.taskRepository.find({
      where: { projectId },
      relations: ['assignee'],
    });
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
    return this.taskRepository.save(task);
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
    return this.taskRepository.save(task);
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
    return this.taskRepository.save(task);
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
