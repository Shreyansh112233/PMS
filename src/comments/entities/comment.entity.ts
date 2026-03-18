import { Exclude } from "class-transformer";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { TaskEntity } from "../../tasks/entities/task.entities";
import { User } from "../../user/entities/user.entity";

@Entity('comments')
export class CommentEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        nullable: false,
        type: 'text',
    })
    content: string;

    @Column({
        nullable: false,
        type: 'uuid',
    })
    taskId: string;

    @ManyToOne(() => TaskEntity, (task) => task.comments)
    @JoinColumn({ name: 'taskId' })
    task: TaskEntity;

    @Column({
        nullable: false,
        type: 'uuid',
    })
    userId: string;

    @ManyToOne(() => User, (user) => user.comments)
    @JoinColumn({ name: 'userId' })
    user: User;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Exclude()
    @DeleteDateColumn()
    deletedAt: Date;
}
