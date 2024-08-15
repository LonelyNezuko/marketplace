import { Language } from "src/__service/language/language.entity";
import { Category } from "src/category/category.entity";
import { Product } from "src/product/product.entity";
import { Role } from "src/role/role.entity";
import { User } from "src/user/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { LogsOrigins } from "./logs.dto";
import { MailTemplate } from "src/__service/mailtemplate/mailtemplate.entity";
import { Storage } from "src/__service/storage/storage.entity";
import { ModerationReportEntity } from "src/moderation/moderation.report/moderation.report.entity";
import { ModerationSupportEntity } from "src/moderation/moderation.support/moderation.support.entity";

@Entity({ name: 'logs', schema: 'public' })
export class Logs {
    @PrimaryGeneratedColumn()
    logID: number

    @Column()
    logOrigin: LogsOrigins

    @ManyToOne(() => User, {
        onDelete: 'SET NULL',
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    logOriginUser?: User

    @ManyToOne(() => Role, {
        onDelete: 'SET NULL',
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    logOriginRole?: Role

    @ManyToOne(() => Category, {
        onDelete: 'SET NULL',
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    logOriginCategory?: Category

    @ManyToOne(() => Product, {
        onDelete: 'SET NULL',
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    logOriginProduct?: Product

    @ManyToOne(() => ModerationReportEntity, {
        onDelete: 'SET NULL',
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    logOriginReports?: ModerationReportEntity

    @ManyToOne(() => ModerationSupportEntity, {
        onDelete: 'SET NULL',
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    logOriginSupport?: ModerationSupportEntity

    @ManyToOne(() => Language, {
        onDelete: 'SET NULL',
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    logOriginLanguage?: Language

    @ManyToOne(() => Storage, {
        onDelete: 'SET NULL',
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    logOriginStorage?: Storage

    @ManyToOne(() => MailTemplate, {
        onDelete: 'SET NULL',
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    logOriginMailtemplate?: MailTemplate

    @ManyToOne(() => User, {
        onDelete: 'SET NULL',
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    logTargetUser?: User

    @Column('text')
    logText: string

    @CreateDateColumn()
    logDate: Date
}