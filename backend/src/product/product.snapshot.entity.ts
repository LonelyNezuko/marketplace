import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Product } from "./product.entity";
import { UserGeolocation } from "src/user/user.entity";
import { ProductForms } from "./product";
import { CategoryForm } from "src/category/category";

@Entity('products-snapshot')
export class ProductSnapshotEntity {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => Product, {
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    product: Product

    @CreateDateColumn()
    createAt: Date

    @Column()
    productStatus: number

    @Column()
    productTitle: string

    @Column('simple-json')
    productGeolocation: UserGeolocation

    @Column()
    productCurrency: string

    @Column('float')
    productPrice: number

    @Column('text')
    productDescription: string

    @Column('simple-json')
    productForms: ProductForms

    @Column('simple-json')
    categoryForms: Array<CategoryForm>
}