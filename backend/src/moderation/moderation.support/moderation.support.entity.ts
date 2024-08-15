import { AttachmentDTO } from "common/dto/attachment.dto";
import { Product } from "src/product/product.entity";
import { User } from "src/user/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToOne, PrimaryGeneratedColumn, Relation } from "typeorm";

@Entity('moderation-support')
export class ModerationSupportEntity {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => User, user => user.reportList, {
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    creator: User

    @Column({ default: 'open' })
    status: ModerationSupportStatus

    @CreateDateColumn()
    createAt: Date

    @CreateDateColumn()
    updateAt: Date

    @Column()
    reason: string

    @Column()
    type: ModerationSupportType

    @ManyToOne(() => User, {
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    moderator: User

    @CreateDateColumn({ default: null, nullable: true })
    moderatorSelectAt: Date

    @OneToOne(() => ModerationSupportMessageEntity, {
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    lastMessage: Relation<ModerationSupportMessageEntity>
}

@Entity('moderation-support-messages')
export class ModerationSupportMessageEntity {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => ModerationSupportEntity, {
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    support: ModerationSupportEntity

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

    @ManyToOne(() => User, {
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    attachUser: User

    @ManyToOne(() => Product, {
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    attachProduct: Product
}

export type ModerationSupportType = "account" | "product" | "other"
export type ModerationSupportStatus = "open" | "closed"