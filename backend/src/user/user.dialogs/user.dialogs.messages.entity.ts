import { User } from "src/user/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { UserDialogs } from "./user.dialogs.entity";

@Entity('user-dialog-messages')
export class UserDialogsMessages {
    @PrimaryGeneratedColumn()
    messageID: number

    @ManyToOne(() => UserDialogs, userDialogs => userDialogs.dialogMessages, {
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    messageDialog: UserDialogs

    @ManyToOne(() => User, {
        createForeignKeyConstraints: false  
    })
    @JoinColumn()
    messageSender: User

    @Column('simple-array')
    messageAttachments: string[]

    @Column('text')
    messageText: string

    @CreateDateColumn()
    messageCreateAt: Date

    @ManyToMany(() => User, {
        createForeignKeyConstraints: false
    })
    @JoinTable()
    messageReaders: User[]
}