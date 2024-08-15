import { User } from "src/user/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('search-history')
export class SearchHistory {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    value: string

    @Column({ default: 1 })
    popularity: number
}