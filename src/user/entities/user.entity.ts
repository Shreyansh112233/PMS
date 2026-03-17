import { Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Entity, DeleteDateColumn } from "typeorm";
import { RoleType } from "../enum/role-type";
import { Exclude } from "class-transformer";

@Entity('user')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

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


