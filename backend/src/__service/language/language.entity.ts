import { User } from "src/user/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('---service-language')
export class Language {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ length: 16 })
    name: string

    @Column({ length: 2 })
    code: string

    @Column('boolean')
    active: boolean

    @Column('boolean', { default: false })
    main: boolean

    @ManyToOne(() => User, {
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    added: User

    @CreateDateColumn()
    createAt: Date

    @Column('longtext')
    params: string

    @Column('boolean', { default: false })
    _deleted: boolean

    @Column('boolean', { default: false })
    _example: boolean
}