import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In, getManager, EntityManager, Like, Not } from "typeorm";
import { UserDialogsMessages } from "./user.dialogs.messages.entity";
import { ModuleRef } from "@nestjs/core";
import { UserService } from "../user.service";
import { UserDialogs } from "./user.dialogs.entity";
import { Request, Response } from "express";
import templateResponse from "common/templates/response.tp";
import isValidJSON from "common/functions/isValidJSON";
import { User } from "../user.entity";
import { UserGatewayClients } from "../user.gateway";
import { UserNotifications } from "../user.notifications/user.notifications.entity";
import random from "common/functions/random";
import CONFIG_DEFAULT from "common/configs/default.config";

@Injectable()
export class UserDialogsService implements OnModuleInit {
    constructor(
        @InjectRepository(UserDialogs)
        private readonly userDialogsRepository: Repository<UserDialogs>,

        @InjectRepository(UserDialogsMessages)
        private readonly userDialogsMessagesRepository: Repository<UserDialogsMessages>,

        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        private readonly moduleRef: ModuleRef,
        private readonly userGatewayClients: UserGatewayClients
    ) {}

    private userService: UserService
    async onModuleInit() {
        this.userService = this.moduleRef.get(UserService, { strict: false })
    }


    async getDialogList(
        res: Response,
        req: Request,

        pagination?: any // object
    ) {
        if(!pagination) pagination = { page: 1, limit: 20 }

        let dialogs: UserDialogs[] = await this.userDialogsRepository.find({
            where: {
                dialogUsers: {
                    id: In([req['user'].id])
                }
            },
            relations: {
                dialogUsers: true,
            },
            
            take: pagination.limit,
            skip: (pagination.page - 1) * pagination.limit
        })

        // чтобы показывало не только req['user'] пользователя в dialogUsers
        const dialogIDS = dialogs.map((dialog: UserDialogs) => dialog.dialogID)
        dialogs = await this.userDialogsRepository.find({
            where: {
                dialogID: In(dialogIDS)
            },
            relations: {
                dialogUsers: true,
                dialogLastMessage: {
                    messageReaders: true,
                    messageSender: true
                }
            },
            order: {
                dialogLastMessage: {
                    messageCreateAt: 'desc'
                }
            }
        })

        await Promise.all(
            dialogs.map(async (d: UserDialogs, i: number) => {
                const allcount = await this.userDialogsMessagesRepository.count({
                    where: {
                        messageDialog: {
                            dialogID: d.dialogID
                        }
                    }
                })
                const unreads = await this.userDialogsMessagesRepository.count({
                    relations: {
                        messageReaders: true
                    },
                    where: {
                        messageDialog: {
                            dialogID: d.dialogID
                        },
                        messageReaders: {
                            id: req['user'].id
                        }
                    }
                })

                d.unreads = allcount - unreads
            })
        )

        templateResponse(res, dialogs, 200)
        return dialogs
    }
    async getDialog(
        dialogID: number,

        res?: Response,
        req?: Request,
    ): Promise<UserDialogs> {
        if(!dialogID || isNaN(dialogID)) {
            templateResponse(res, "Fields should not be empty (dialogID)", 400)
            return
        }

        const dialog = await this.userDialogsRepository.findOne({
            relations: {
                dialogMessages: {
                    messageReaders: true,
                    messageSender: true,
                },
                dialogUsers: true
            },
            where: {
                dialogID
            }
        })
        if(!dialog) {
            templateResponse(res, "Dialog with this dialogID not found", 404)
            return
        }

        if(!this.isDialogAccess(dialog, req['user'])) {
            templateResponse(res, "You do not have access to this dialog", 403)
            return
        }

        templateResponse(res, dialog, 200)
        return dialog
    }

    async getAllUnreadMessagesCount(
        res: Response,
        req: Request
    ) {
        let count = 0

        const dialogs: UserDialogs[] = await this.userDialogsRepository.find({
            where: {
                dialogUsers: {
                    id: req['user'].id
                }
            },
            relations: {
                dialogUsers: true
            },
            select: { dialogID: true }
        })
        if(dialogs) {
            const dialogsids = []
            dialogs.map((dialog: UserDialogs) => dialogsids.push(dialog.dialogID))

            const allcount = count = await this.userDialogsMessagesRepository.count({
                where: {
                    messageDialog: {
                        dialogID: In(dialogsids)
                    }
                },
                relations: {
                    messageDialog: true
                }
            })

            count = await this.userDialogsMessagesRepository.count({
                where: {
                    messageDialog: {
                        dialogID: In(dialogsids)
                    },
                    messageReaders: {
                        id: req['user'].id
                    }
                },
                relations: {
                    messageDialog: true,
                    messageReaders: true
                }
            })

            count = allcount - count
        }

        templateResponse(res, count, 200)
    }


    // дописать
    async sendMessage(
        res: Response,
        req: Request,

        text: string,
        attachments: any, // json array

        usersID?: any, // json simple array
        dialogID?: number
    ) {
        if(!text || !text.length
            || !attachments || !isValidJSON(attachments)) {
            return templateResponse(res, "Fields should not be empty (text, attachments)", 400)
        }
        if(!usersID && !dialogID) {
            return templateResponse(res, "You need either a usersID or a dialogID", 400)
        }

        const user: User = req['user']
        if(!user.emailVerify) {
            return templateResponse(res, "The user's email has not been verified", 403)
        }

        text = text.trim()
        attachments = JSON.parse(attachments)

        const sender = await this.userService.get(req['user'].id)
        if(!sender) {
            return templateResponse(res, "User not found", 404)
        }

        const repository = this.userDialogsRepository
        const isDialogAccess = this.isDialogAccess
        async function findDialog(id: number, afterInsert?: boolean): Promise<UserDialogs> {
            const dialog = await repository.findOne({
                where: {
                    dialogID: id
                },
                relations: {
                    dialogUsers: true,
                    dialogLastMessage: {
                        messageSender: true
                    }
                }
            })
            if(!dialog) {
                templateResponse(res, "Dialog with this id not found", 404)
                return
            }

            if(!afterInsert && !isDialogAccess(dialog, sender)) {
                templateResponse(res, "You do not have access to this dialog", 403)
                return
            }
            return dialog
        }

        let dialog: UserDialogs = null
        if(dialogID) {
            dialog = await findDialog(dialogID)
            if(!dialog)return
        }

        if(!dialog) {
            if(!usersID || !isValidJSON(usersID)) {
                return templateResponse(res, "Incorrect data [usersID]", 400)
            }

            usersID = JSON.parse(usersID)
            if(!usersID.length) {
                return templateResponse(res, "The usersID cannot be empty", 400)
            }
            if(!usersID.find(item => {
                if(item != sender.id
                    || parseInt(item) != sender.id)return false
                return true
            })) usersID.push(sender.id)

            const users: User[] = await this.userRepository.find({
                where: {
                    id: In(usersID)
                }
            })
            if(users.length !== usersID.length) {
                return templateResponse(res, "Some users were not found", 400)
            }
            if(users.length <= 1) {
                return templateResponse(res, "At least 2 users are required to create a dialog", 400)
            }

            if(users.length === 2) {
                const dialogs: UserDialogs[] = await this.getDialogList(null, req)
                if(dialogs) {
                    let tmpuser: User = users.find(item => item.id !== sender.id)
                    dialog = dialogs.find((d: UserDialogs) => d.dialogUsers.find(item => item.id === tmpuser.id))
                }
            }

            if(!dialog) {
                const insert = await this.userDialogsRepository.insert({})

                dialog = await findDialog(insert.raw.insertId, true)
                if(!dialog) {
                    return templateResponse(res, "Dialog with this dialogID not found", 404)
                }
                
                dialog.dialogUsers = users
                await this.userDialogsRepository.save(dialog)
            }
        }

        if(dialog && dialog.dialogLastMessage && dialog.dialogLastMessage.messageSender) {
            if(dialog.dialogLastMessage.messageSender.id === req['user'].id
                && +new Date(dialog.dialogLastMessage.messageCreateAt) + CONFIG_DEFAULT.cooldownSendMessage >+ +new Date()
            ) {
                return templateResponse(res, "", 425)
            }
        }

        const insert = await this.userDialogsMessagesRepository.insert({
            messageDialog: dialog,
            messageSender: sender,
            messageAttachments: attachments,
            messageText: text
        })
        const message: UserDialogsMessages = await this.userDialogsMessagesRepository.findOne({
            relations: {
                messageReaders: true,
                messageDialog: true,
                messageSender: true
            },
            where: {
                messageID: insert.raw.insertId
            }
        })

        message.messageReaders.push(sender)
        await this.userDialogsMessagesRepository.save(message)

        dialog.dialogLastMessage = message
        await this.userDialogsRepository.save(dialog)

        await this.messageRead(null, dialog.dialogID, null, req)

        dialog.dialogUsers.map((user: User) => {
            if(user.id !== sender.id) {
                this.userGatewayClients.emit(user, 'onMessageIncoming', message, dialog)
                if(user.notifySettingsParams.dialogs) this.userGatewayClients.emit(user, 'onNotificationsSend_page', {
                    id: random.textNumber(64),
                    link: '/account/messages/' + dialog.dialogID,
                    type: 'incomingdialogmessage',
                    attachedUser: sender
                } as UserNotifications, user.notifySettings)
            }
        })

        templateResponse(res, {
            messageid: insert.raw.insertId,
            dialogid: dialog.dialogID
        }, 200)
    }


    // put
    async messageRead(
        messageids?: number[],
        dialogid?: number,

        res?: Response,
        req?: Request
    ) {
        let messages: UserDialogsMessages[] = null

        if(messageids) {
            messages = await this.userDialogsMessagesRepository.find({
                relations: {
                    messageReaders: true,
                    messageDialog: {
                        dialogUsers: true
                    }
                },
                where: {
                    messageID: In(messageids)
                }
            })
        }
        else if(dialogid && !isNaN(dialogid) && dialogid >= 1) {
            const dialog = await this.getDialog(dialogid, null, req)
            if(!dialog) {
                return templateResponse(res, "Dialog with this dialogid not found", 404)
            }

            messages = dialog.dialogMessages
            messages.map((message: UserDialogsMessages) => message.messageDialog = dialog)
        }
        else {
            return templateResponse(res, "At least one field is required (messageids, dialogid)", 400)
        }

        if(!messages) {
            return templateResponse(res, "Messages with this messageids not found", 404)
        }

        let dialog: UserDialogs = messages[0].messageDialog

        messages = messages.filter((message: UserDialogsMessages) => message.messageDialog.dialogID === dialog.dialogID)
        messages = messages.filter((message: UserDialogsMessages) => !message.messageReaders.find((acc: User) => acc.id === req['user'].id))

        if(!messages.length) {
            return templateResponse(res, "Messages not found", 404)
        }

        if(!this.isDialogAccess(dialog, req['user'])) {
            return templateResponse(res, "You do not have access to this dialog", 403)
        }

        messages.map((message: UserDialogsMessages) => message.messageReaders.push(req['user']))
        await this.userDialogsMessagesRepository.save(messages)

        messageids = []
        messages.map((message: UserDialogsMessages) => messageids.push(message.messageID))
        dialog.dialogUsers.map((user: User) => {
            if(user.id !== req['user'].id) {
                this.userGatewayClients.emit(user, 'onMessagesRead', messageids, req['user'])
                this.userGatewayClients.emit(user, 'onMessagesReadDialogs', dialog.dialogID, messageids, req['user'])
            }
        })

        this.userGatewayClients.emit(req['user'], 'onMessagesReadIt', messageids.length)
        
        templateResponse(res, "", 200)
    }


    // проверка на доступ к диалогу и сообщениям
    isDialogAccess(dialog: UserDialogs, user: User) {
        if(!dialog || !user)return false
        if(!dialog.dialogUsers || !user.id)return false

        // добавить проверку привелегий ролей на чтение переписок
        return !dialog.dialogUsers.find(item => item.id === user.id) ? false : true
    }
}