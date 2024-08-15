import { Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../user.entity";
import { UserDialogsMessages } from "./user.dialogs.messages.entity";
import { enumDialogTypes } from "./user.dialogs.enums";

@Entity('user-dialogs')
export class UserDialogs {
    @PrimaryGeneratedColumn()
    dialogID: number

    @ManyToMany(() => User, {
        createForeignKeyConstraints: false
    })
    @JoinTable()
    dialogUsers: User[]

    @CreateDateColumn()
    dialogCreateAt: Date

    @Column({ default: enumDialogTypes.DIALOG_TYPE_PERSONAL })
    dialogType: number

    @OneToMany(() => UserDialogsMessages, messages => messages.messageDialog, {
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    dialogMessages: UserDialogsMessages[]

    @OneToOne(() => UserDialogsMessages, {
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    dialogLastMessage: UserDialogsMessages


    unreads: number
}