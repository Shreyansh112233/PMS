import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { TaskPriority } from '../enums/task.priority';

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  assignedTo?: string;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;
}
