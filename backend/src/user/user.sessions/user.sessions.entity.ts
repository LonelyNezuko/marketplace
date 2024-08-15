import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User, UserGeolocation } from "../user.entity";

@Entity({ name: 'users-sessions', schema: 'public' })
export class UserSessions {
    @PrimaryGeneratedColumn()
    sessionID: number

    @ManyToOne(() => User, {
        onDelete: 'SET NULL',
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    sessionUser: User

    @CreateDateColumn()
    sessionCreateAt: Date

    @Column()
    sessionAgent: string

    @Column()
    sessionIP: string

    @Column('simple-json', { default: null, nullable: true })
    sessionGeo: UserGeolocation

    @Column()
    refreshToken: string

    @Column()
    sessionPlatform: UserSessionsPlatform


    isCurrent?: boolean
}


export type UserSessionsPlatform = "site" | "moderation" | "admin" | "mobileapp"