import { Exclude } from "class-transformer";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, ManyToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { TaskEntity } from "../../tasks/entities/task.entities";

@Entity('labels')
export class LabelEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        nullable: false,
        type: 'varchar',
        unique: true,
    })
    name: string;

    @Column({
        nullable: true,
        type: 'varchar',
    })
    color: string;

    @Column({
        nullable: true,
        type: 'varchar',
    })
    description: string;

    @ManyToMany(() => TaskEntity, (task) => task.labels)
    tasks: TaskEntity[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Exclude()
    @DeleteDateColumn()
    deletedAt: Date;
}
