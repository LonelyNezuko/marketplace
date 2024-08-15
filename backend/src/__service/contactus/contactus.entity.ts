import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('---service-contactus')
export class ServiceContactUs {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    ip: string

    @Column()
    agent: string

    @CreateDateColumn()
    createAt: Date
}