import { Product } from "src/product/product.entity";
import { User } from "src/user/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { StorageFileImageDto, StorageFilesAccess, StorageFilesExtendedType, StorageFilesTypes } from "./storage.files.dto";
import CONFIG_STORAGE from "common/configs/storage.config";

@Entity('---service-storage')
export class Storage {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ length: CONFIG_STORAGE.fileKeyLength })
    key: string

    @Column({ length: CONFIG_STORAGE.albumKeyLength })
    albumKey: string

    @Column({ default: null, nullable: true })
    albumName: string

    @CreateDateColumn()
    albumCreateAt: Date
    
    @Column()
    type: StorageFilesTypes

    @Column('text')
    path: string

    @Column()
    albumLength: number

    @ManyToOne(() => User, user => user.__serviceStorageList, {
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    owner: User

    @Column({ default: 'default' })
    access: StorageFilesAccess

    @ManyToOne(() => User, {
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    accessUsers: User[]

    @Column('simple-json', { default: JSON.stringify([]) })
    images: StorageFileImageDto[]

    @Column({ default: 'default' })
    extendedType: StorageFilesExtendedType

    @Column({ default: null, nullable: true })
    name: string

    @Column({ default: null, nullable: true })
    fileName: string

    link?: string
}