import { User } from "src/user/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { ForeignKeyMetadata } from "typeorm/metadata/ForeignKeyMetadata";

@Entity({ name: 'roles', schema: 'public' })
export class Role {
    @PrimaryGeneratedColumn()
    roleID: number

    @Column()
    key: string

    @Column()
    index: number

    @CreateDateColumn()
    createAt: Date

    @CreateDateColumn()
    updateAt: Date

    @ManyToOne(() => User, {
        onDelete: 'SET NULL',
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    createUser: User

    @Column('simple-array')
    privileges: string[]

    @Column({ length: 24 })
    name: string

    @Column('simple-json', { default: JSON.stringify({}) })
    nameTranslate: any

    @Column('simple-array')
    color: string[]

    @ManyToMany(() => User, user => user.roles, {
        createForeignKeyConstraints: false
    })
    @JoinTable()
    usersList: User[]
}