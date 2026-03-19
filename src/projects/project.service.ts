import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { User } from '../user/entities/user.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { CacheService } from '../common/services/cache.service';
import { CacheKeys } from '../common/utils/cache-keys';

const CACHE_TTL_MS = 300_000; // 5 minutes

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly cacheService: CacheService,
  ) {}

  async create(ownerId: string, dto: CreateProjectDto): Promise<Project> {
    const project = this.projectRepository.create({
      ...dto,
      ownerId,
    });
    const saved = await this.projectRepository.save(project);
    await this.cacheService.del(CacheKeys.projectsAll());
    return saved;
  }

  async findAll(): Promise<Project[]> {
    const cacheKey = CacheKeys.projectsAll();
    const cached = await this.cacheService.get<Project[]>(cacheKey);
    if (cached) return cached;

    const projects = await this.projectRepository.find({
      relations: ['owner', 'members'],
    });
    await this.cacheService.set(cacheKey, projects, CACHE_TTL_MS);
    return projects;
  }

  async findOne(projectId: string): Promise<Project> {
    const cacheKey = CacheKeys.project(projectId);
    const cached = await this.cacheService.get<Project>(cacheKey);
    if (cached) return cached;

    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['owner', 'members'],
    });
    if (!project) {
      throw new NotFoundException(`Project with id ${projectId} not found`);
    }
    await this.cacheService.set(cacheKey, project, CACHE_TTL_MS);
    return project;
  }

  async addMember(
    projectId: string,
    userId: string,
    currentUserId: string,
  ): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['members'],
    });
    if (!project) {
      throw new NotFoundException(`Project with id ${projectId} not found`);
    }

    if (project.ownerId !== currentUserId) {
      throw new ForbiddenException('Only the project owner can add members');
    }

    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    const alreadyMember = project.members.some((m) => m.id === userId);
    if (!alreadyMember) {
      project.members.push(user);
      await this.projectRepository.save(project);
    }

    // Invalidate caches
    await this.cacheService.del(CacheKeys.projectsAll());
    await this.cacheService.del(CacheKeys.project(projectId));

    return this.findOne(projectId);
  }
}
