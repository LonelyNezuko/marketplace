import { User } from "src/user/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('---service-verifycodes')
export class VerifyCode {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    code: string

    @Column()
    forID: string

    @ManyToOne(() => User, {
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    user: User

    @CreateDateColumn()
    expires: Date
}