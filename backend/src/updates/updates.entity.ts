import { User } from "src/user/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('updates')
export class Updates {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => User, {
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    creator: User

    @CreateDateColumn()
    createAt: Date

    @CreateDateColumn({ default: 0 })
    updateAt: Date

    @ManyToOne(() => User, {
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    updator: User

    @Column()
    where: string

    @Column({ length: 24 })
    name: string

    @Column({ length: 10 })
    version: string

    @CreateDateColumn()
    publishDate: Date

    @Column()
    background: string

    @Column('text')
    body: string

    @Column({ default: 1 })
    views: number
}