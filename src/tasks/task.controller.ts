import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { AssignTaskDto } from './dto/assign-task.dto';
import { TaskEntity } from './entities/task.entities';

@UseGuards(JwtAuthGuard)
@Controller()
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post('projects/:projectId/tasks')
  create(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateTaskDto,
    @CurrentUser('id') userId: string,
  ): Promise<TaskEntity> {
    return this.taskService.create(projectId, dto, userId);
  }

  @Get('projects/:projectId/tasks')
  findAll(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentUser('id') userId: string,
  ): Promise<TaskEntity[]> {
    return this.taskService.findAllByProject(projectId, userId);
  }

  @Patch('tasks/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser('id') userId: string,
  ): Promise<TaskEntity> {
    return this.taskService.update(id, dto, userId);
  }

  @Patch('tasks/:id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskStatusDto,
    @CurrentUser('id') userId: string,
  ): Promise<TaskEntity> {
    return this.taskService.updateStatus(id, dto, userId);
  }

  @Patch('tasks/:id/assign')
  assign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignTaskDto,
    @CurrentUser('id') userId: string,
  ): Promise<TaskEntity> {
    return this.taskService.assign(id, dto, userId);
  }
}
