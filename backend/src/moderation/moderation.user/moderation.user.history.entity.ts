import { User } from "src/user/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('users-moderation-history')
export class UserModerationHistoryEntity {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => User, {
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    user: User

    @Column()
    type: UserModerationHistoryType

    @CreateDateColumn()
    createAt: Date

    @ManyToOne(() => User, {
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    moderator: User

    @Column('text')
    comment: string

    @CreateDateColumn({ default: null, nullable: true })
    expiresDate: Date
}

export type UserModerationHistoryType = 'ban' | 'reportBan' | 'warn' | 'unban' | 'unReportBan' | 'emailCodeVerify'