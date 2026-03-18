import { IsEnum, IsNotEmpty } from 'class-validator';
import { TaskStatus } from '../enums/task.status';

export class UpdateTaskStatusDto {
  @IsEnum(TaskStatus)
  @IsNotEmpty()
  status: TaskStatus;
}
