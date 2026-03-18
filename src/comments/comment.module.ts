import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentEntity } from './entities/comment.entity';
import { TaskEntity } from '../tasks/entities/task.entities';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';

@Module({
  imports: [TypeOrmModule.forFeature([CommentEntity, TaskEntity])],
  controllers: [CommentController],
  providers: [CommentService],
})
export class CommentModule {}
