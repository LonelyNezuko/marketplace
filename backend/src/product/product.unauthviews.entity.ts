import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { Product } from "./product.entity";

@Entity('products_unauth_views')
export class ProductUnauthViews {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    ip: string

    @Column()
    agent: string

    @ManyToMany(() => Product, {
        createForeignKeyConstraints: false
    })
    @JoinTable()
    viewProducts: Product[]
}