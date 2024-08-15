import { Product } from "src/product/product.entity";
import { User } from "src/user/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { CategoryForm } from "./category";

@Entity({ name: 'categories', schema: 'public' })
export class Category {
    @PrimaryGeneratedColumn()
    categoryID: number

    @Column()
    categoryName: string

    @Column('simple-json', { default: JSON.stringify({}) })
    categoryNameTranslate: any

    @Column('simple-json')
    categoryForms: Array<CategoryForm>

    @Column('text', { default: '/assets/category/default.png' })
    categoryIcon: string

    @Column('text', { default: '/assets/category/default_background.jpg' })
    categoryBackground: string

    @ManyToOne(() => User, {
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    categoryCreator: User

    @CreateDateColumn({
        onUpdate: 'CURRENT_TIMESTAMP(6)'
    })
    categoryCreateAt: Date

    @Column('date', { default: null })
    categoryUpdateAt: Date

    @ManyToOne(() => User, {
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    categoryUpdator: User

    categorySubcategories: Category[]

    @ManyToOne(() => Category, {
        createForeignKeyConstraints: false
    })
    @JoinTable()
    categoryParent: Category

    @Column({ default: null })
    categoryLink: string

    @OneToMany(() => Product, product => product.prodCategory, {
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    categoryProducts: Product[]

    @Column({ default: false })
    _deleted: boolean
}