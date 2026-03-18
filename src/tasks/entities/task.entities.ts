import { Exclude } from "class-transformer";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { TaskStatus } from "../enums/task.status";
import { Project } from "../../projects/entities/project.entity";
import { User } from "../../user/entities/user.entity";
import { CommentEntity } from "../../comments/entities/comment.entity";
import { LabelEntity } from "../../labels/entities/label.entity";

@Entity('tasks')
export class TaskEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        nullable: false,
        type: 'varchar',
    })
    title: string;

    @Column({
        nullable: true,
        type: 'text',
    })
    description: string;

    @Column({
        nullable: false,
        type: 'uuid',
    })
    projectId: string;

    @ManyToOne(() => Project, (project) => project.tasks)
    @JoinColumn({ name: 'projectId' })
    project: Project;

    @Column({
        nullable: false,
        type: 'uuid',
    })
    assignedTo: string;

    @ManyToOne(() => User, (user) => user.assignedTasks)
    @JoinColumn({ name: 'assignedTo' })
    assignee: User;

    @OneToMany(() => CommentEntity, (comment) => comment.task)
    comments: CommentEntity[];

    @ManyToMany(() => LabelEntity, (label) => label.tasks)
    @JoinTable({ name: 'task_labels' })
    labels: LabelEntity[];

    @Column({
        type: 'enum',
        nullable: false,
        enum: TaskStatus,
        default: TaskStatus.TODO,
    })
    status: TaskStatus;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Exclude()
    @DeleteDateColumn()
    deletedAt: Date;
}
