import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateProjectDto } from './dto/create-project.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { Project } from './entities/project.entity';

@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateProjectDto,
  ): Promise<Project> {
    return this.projectService.create(userId, dto);
  }

  @Get()
  findAll(): Promise<Project[]> {
    return this.projectService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Project> {
    return this.projectService.findOne(id);
  }

  @Post(':id/members')
  addMember(
    @Param('id', ParseUUIDPipe) projectId: string,
    @CurrentUser('id') currentUserId: string,
    @Body() dto: AddMemberDto,
  ): Promise<Project> {
    return this.projectService.addMember(projectId, dto.userId, currentUserId);
  }
}
