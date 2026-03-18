import { Exclude } from "class-transformer";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ProjectStatus } from "../enums/project.status";
import { User } from "../../user/entities/user.entity";
import { TaskEntity } from "../../tasks/entities/task.entities";

@Entity('projects')
export class Project {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        nullable: false,
        type: 'varchar',
    })
    name: string;

    @Column({
        nullable: true,
        type: 'text',
    })
    description: string;

    @Column({
        nullable: false,
        type: 'uuid',
    })
    ownerId: string;

    @ManyToOne(() => User, (user) => user.ownedProjects)
    @JoinColumn({ name: 'ownerId' })
    owner: User;

    @ManyToMany(() => User, (user) => user.projects)
    @JoinTable({ name: 'project_members' })
    members: User[];

    @OneToMany(() => TaskEntity, (task) => task.project)
    tasks: TaskEntity[];

    @Column({
        type: 'enum',
        nullable: false,
        enum: ProjectStatus,
        default: ProjectStatus.ACTIVE,
    })
    status: ProjectStatus;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Exclude()
    @DeleteDateColumn()
    deletedAt: Date;
}