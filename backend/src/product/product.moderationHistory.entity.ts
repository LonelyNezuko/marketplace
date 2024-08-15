import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Product } from "./product.entity";
import { ProductSnapshotEntity } from "./product.snapshot.entity";
import { User } from "src/user/user.entity";

@Entity('products-moderation-history')
export class ProductModerationHistoryEntity {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => Product, {
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    product: Product

    @CreateDateColumn()
    createAt: Date

    @OneToOne(() => ProductSnapshotEntity, {
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    snapshot: ProductSnapshotEntity

    @ManyToOne(() => User, {
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    moderator: User

    @Column()
    moderationStatus: number

    @Column('text')
    moderationComment: string

    @CreateDateColumn()
    moderationDate: Date
}