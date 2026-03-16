import { Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Entity } from "typeorm";
import { RoleType } from "../enum/role-type";

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

    @Column({
        nullable: false,
    })
    password: string;

    @Column({
        nullable: true,
    })
    refreshToken: string;
    @Column({
        type: 'enum',
        nullable: false,
        enum: RoleType,
    })
    role: RoleType;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

}


