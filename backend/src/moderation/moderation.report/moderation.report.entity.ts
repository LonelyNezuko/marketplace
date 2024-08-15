import { AttachmentDTO } from "common/dto/attachment.dto";
import { Product } from "src/product/product.entity";
import { User } from "src/user/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, Relation } from "typeorm";

@Entity('moderation-report')
export class ModerationReportEntity {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => User, user => user.reportList, {
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    creator: User

    @Column({ default: 'open' })
    status: ModerationReportStatus

    @CreateDateColumn()
    createAt: Date

    @CreateDateColumn()
    updateAt: Date

    @Column()
    reason: string

    @Column()
    type: ModerationReportType

    @ManyToOne(() => Product, {
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    productEntity: Product

    @ManyToOne(() => User, {
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    userEntity: User

    @ManyToOne(() => User, {
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    moderator: User

    @CreateDateColumn({ default: null, nullable: true })
    moderatorSelectAt: Date

    @OneToOne(() => ModerationReportMessageEntity, message => message.report, {
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    lastMessage: Relation<ModerationReportMessageEntity>
}

@Entity('moderation-report-messages')
export class ModerationReportMessageEntity {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => ModerationReportEntity, {
        createForeignKeyConstraints: false,
        onDelete: 'CASCADE'
    })
    @JoinColumn()
    report: ModerationReportEntity

    @ManyToOne(() => User, {
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    sender: User

    @CreateDateColumn()
    createAt: Date
    
    @Column({ default: false })
    senderModerator: boolean

    @Column({ default: false })
    senderSystem: boolean

    @Column('longtext')
    text: string

    @Column('simple-json', { default: JSON.stringify([]) })
    attachments: AttachmentDTO[]
}

export type ModerationReportType = "user" | "product"
export type ModerationReportStatus = "open" | "closed"