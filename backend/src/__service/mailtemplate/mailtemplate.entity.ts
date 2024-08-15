import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { MailTemplateTypes } from "./mailtemplate.dto";
import { User } from "src/user/user.entity";
import { Language } from "../language/language.entity";

@Entity('---service-mailtemplate')
export class MailTemplate {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    type: MailTemplateTypes

    @CreateDateColumn()
    createAt: Date

    @Column('datetime', { default: () => `Date(0)` })
    updateAt: Date

    @ManyToOne(() => User, {
        createForeignKeyConstraints: false
    })
    creator: User

    @ManyToOne(() => User, {
        createForeignKeyConstraints: false
    })
    updator: User

    @ManyToOne(() => Language, {
        createForeignKeyConstraints: false
    })
    language: Language

    @Column({ default: false })
    active: boolean

    @Column('longtext')
    html: string

    @Column('longtext')
    editorJSON: any

    @Column()
    subject: string

    @Column({ default: false })
    _deleted: boolean
}