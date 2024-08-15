import CONFIG_DEFAULT from "common/configs/default.config";
import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entity";

@Entity('user-email-verify-codes')
export class UserEmailVerifyCodes {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    type: UserEmailVerifyCodesTypes

    @Column({ length: CONFIG_DEFAULT.emailVerifyHashLength })
    hash: string

    @OneToOne(() => User, {
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    user: User

    @Column('bigint')
    expires: number
}


export type UserEmailVerifyCodesTypes = "email-verify" | "change-email-verify"