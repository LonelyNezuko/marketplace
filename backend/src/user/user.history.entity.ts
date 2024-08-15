import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entity";
import { Product } from "src/product/product.entity";
import { Category } from "src/category/category.entity";

@Entity('users-history-product-views')
export class UserHistoryProductViews {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => User, {
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    user: User

    @ManyToOne(() => Product, {
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    product: Product

    @CreateDateColumn()
    date: Date
}

@Entity('users-history-product-favorites')
export class UserHistoryProductFavorites {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => User, {
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    user: User

    @ManyToOne(() => Product, {
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    product: Product

    @CreateDateColumn()
    date: Date
}

@Entity('users-history-product-messages')
export class UserHistoryProductMessages {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => User, {
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    user: User

    @ManyToOne(() => Product, {
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    product: Product

    @CreateDateColumn()
    date: Date
}

@Entity('users-history-category-views')
export class UserHistoryCategoryViews {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => User, {
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    user: User

    @ManyToOne(() => Category, {
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    category: Category

    @CreateDateColumn()
    date: Date
}

@Entity('users-history-search')
export class UserHistorySearch {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => User, {
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    user: User

    @Column()
    text: string

    @CreateDateColumn()
    date: Date
}


export interface UserHistoryClientData {
    date: Date
    id?: string // number
    text?: string
}