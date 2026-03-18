import { Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Entity, DeleteDateColumn, OneToMany, ManyToMany } from "typeorm";
import { RoleType } from "../enum/role.type";
import { Exclude } from "class-transformer";
import { Project } from "../../projects/entities/project.entity";
import { TaskEntity } from "../../tasks/entities/task.entities";
import { CommentEntity } from "../../comments/entities/comment.entity";

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        nullable: false,
        type: 'varchar',
    })
    name: string;

    @Column({
        unique: true,
        nullable: false,
        type: 'varchar',
    })
    email: string;

    @Exclude()
    @Column({
        nullable: false,
    })
    password: string;

    @Exclude()
    @Column({
        nullable: true,
    })
    refreshToken: string;

    @Exclude()
    @Column({
        type: 'enum',
        nullable: false,
        enum: RoleType,
        default: RoleType.USER,
    })
    role: RoleType;

    @OneToMany(() => Project, (project) => project.owner)
    ownedProjects: Project[];

    @ManyToMany(() => Project, (project) => project.members)
    projects: Project[];

    @OneToMany(() => TaskEntity, (task) => task.assignee)
    assignedTasks: TaskEntity[];

    @OneToMany(() => CommentEntity, (comment) => comment.user)
    comments: CommentEntity[];

    @Exclude()
    @CreateDateColumn()
    createdAt: Date;

    @Exclude()
    @UpdateDateColumn()
    updatedAt: Date;

    @Exclude()
    @DeleteDateColumn()
    deletedAt: Date | null;

}


