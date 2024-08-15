import { Column, CreateDateColumn, Entity, JoinColumn, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../user.entity";
import { UserNotificationsType } from "./user.notifications.dto";
import { Product } from "src/product/product.entity";
import { ModerationReportEntity } from "src/moderation/moderation.report/moderation.report.entity";
import { ModerationSupportEntity } from "src/moderation/moderation.support/moderation.support.entity";

@Entity("user-notifications")
export class UserNotifications {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => User, {
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    forUser: User

    @ManyToOne(() => User, {
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    creator: User

    @Column()
    type: UserNotificationsType

    @Column({ default: null, nullable: true, length: 32 })
    name: string

    @Column({ default: null, nullable: true })
    previewAvatar: string

    @Column({ default: null, nullable: true, length: 512 })
    text: string

    @ManyToOne(() => Product, {
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    attachedProduct: Product

    @ManyToOne(() => User, {
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    attachedUser: User

    @ManyToOne(() => ModerationReportEntity, {
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    attachedReport: ModerationReportEntity

    @ManyToOne(() => ModerationSupportEntity, {
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    attachedSupport: ModerationSupportEntity

    @Column('text', { default: null, nullable: true })
    attachedText: string

    @CreateDateColumn()
    createAt: Date

    @CreateDateColumn()
    viewAt: Date



    // 
    link?: string
}