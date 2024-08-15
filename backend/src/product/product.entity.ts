import { Category } from "src/category/category.entity";
import { User, UserGeolocation } from "src/user/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { enumProductModerationStatus, enumProductStatus } from "./product.enums";
import { ProductUnauthViews } from "./product.unauthviews.entity";
import { Storage } from "src/__service/storage/storage.entity";
import { ProductForms } from "./product";

// Добавить prodTitle, prodType

@Entity({ name: 'products', schema: 'public' })
export class Product {
    @PrimaryGeneratedColumn()
    prodID: number

    @ManyToOne(() => Category, category => category.categoryProducts, {
        onDelete: 'SET NULL',
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    prodCategory: Category

    @ManyToOne(() => User, user => user.products, {
        onDelete: 'SET NULL',
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    prodOwner: User

    @CreateDateColumn()
    prodCreateAt: Date

    @Column({ default: enumProductStatus.PRODUCT_STATUS_ACTIVE })
    prodStatus: number

    @CreateDateColumn()
    prodStatusUpdateAt: Date

    @ManyToOne(() => User, {
        onDelete: 'SET NULL',
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    prodModerator: User

    @Column({ default: enumProductModerationStatus.PRODUCT_MODERATION_STATUS_VERIFIED })
    prodModerationStatus: number

    @Column('text', { default: '' })
    prodModerationComment: string

    @CreateDateColumn()
    prodModerationDate: Date

    @Column('simple-json')
    prodForms: ProductForms

    @Column('simple-array')
    prodImages: string[]

    @Column('text')
    prodDescription: string

    @Column({ length: 50 })
    prodTitle: string

    // geo
    @Column('simple-json')
    prodGeo: UserGeolocation

    @Column('float')
    prodLat: number

    @Column('float')
    prodLng: number

    @Column()
    prodCityUniqueID: string

    @Column({ default: false })
    prodOnlyCity: boolean
    // 

    @Column({ default: 'USD' })
    prodCurrency: string

    @Column('float', { default: 0 })
    prodPrice: number

    @Column({ default: false })
    prodAttention: boolean

    @Column({ default: 0 })
    prodViews: number

    @Column('longtext', {
        default: null,
        nullable: true
    })
    prodKeyWords: string[] | string

    // @OneToMany(() => Storage)
    // @JoinColumn()
    // prodStorage: Storage[]
}