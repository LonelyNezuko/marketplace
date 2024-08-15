import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, LessThan, Not, Repository } from "typeorm";
import { Request, Response } from "express";
import templateResponse from "common/templates/response.tp";
import { ModuleRef } from "@nestjs/core";
import { LogsService } from "src/logs/logs.service";
import { AttachmentDTO, AttachmentVerify } from "common/dto/attachment.dto";
import { ModerationGatewayClients } from "../moderation.gateway";
import { UserGatewayClients } from "src/user/user.gateway";
import { StorageService } from "src/__service/storage/storage.service";
import { UserNotificationsService } from "src/user/user.notifications/user.notifications.service";
import { ModerationSupportEntity, ModerationSupportMessageEntity } from "./moderation.support.entity";

@Injectable()
export class ModerationSupportService implements OnModuleInit {
    constructor(
        @InjectRepository(ModerationSupportEntity)
        private readonly moderationSupportRepository: Repository<ModerationSupportEntity>,

        @InjectRepository(ModerationSupportMessageEntity)
        private readonly moderationSupportMessageRepository: Repository<ModerationSupportMessageEntity>,

        private readonly moderationGatewayClients: ModerationGatewayClients,
        private readonly userGatewayClients: UserGatewayClients,

        private readonly moduleRef: ModuleRef
    ) {}


    private logsService: LogsService
    private storageService: StorageService
    private userNotificationsService: UserNotificationsService

    async onModuleInit() {
        this.logsService = await this.moduleRef.get(LogsService, { strict: false })
        this.storageService = await this.moduleRef.get(StorageService, { strict: false })
        this.userNotificationsService = await this.moduleRef.get(UserNotificationsService, { strict: false })
    }


    // get
    async getSupport(
        res: Response,
        req: Request,

        supportID: number
    ) {
        if(!supportID || isNaN(supportID)) {
            return templateResponse(res, "Fields should not be empty [supportID]", 400)
        }

        await this.clearOldModerators()
        const support = await this.moderationSupportRepository.findOne({
            where: [
                {
                    id: supportID,
                    moderator: IsNull()
                },
                {
                    id: supportID,
                    moderator: {
                        id: req['user'].id
                    }
                }
            ],
            relations: {
                creator: true,
                moderator: true
            }
        })
        if(!support) {
            return templateResponse(res, "Support not found", 404)
        }

        const messages = await this.moderationSupportMessageRepository.find({
            where: {
                support: {
                    id: support.id
                }
            },
            relations: {
                sender: true,
                attachProduct: {
                    prodCategory: true
                },
                attachUser: true
            }
        })

        await this.moderationSupportRepository.update({ id: support.id }, {
            moderator: {
                id: req['user'].id
            },
            moderatorSelectAt: new Date()
        })

        templateResponse(res, {
            support,
            messages
        }, 200)
    }

    async getOpenSupport(
        res: Response,
        req: Request
    ) {
        await this.clearOldModerators()
        const support = await this.moderationSupportRepository.findOne({
            where: [
                {
                    moderator: IsNull(),
                    status: 'open',
                    lastMessage: {
                        senderModerator: false,
                        senderSystem: false
                    }
                },
                {
                    moderator: {
                        id: req['user'].id
                    },
                    lastMessage: {
                        senderModerator: false,
                        senderSystem: false
                    }
                }
            ],
            relations: {
                lastMessage: true
            },
            select: [ 'id', 'updateAt', 'lastMessage' ],
            order: {
                updateAt: 'asc'
            }
        })
        if(!support) {
            return templateResponse(res, "Support not found or closed", 404)
        }

        templateResponse(res, support.id, 200)
    }

    async getOpenSupportSubjectID(
        res: Response,
        req: Request,

        supportID: number
    ) {
        if(!supportID || isNaN(supportID)) {
            return templateResponse(res, "Fields should not be empty [supportID]", 400)
        }

        const support = await this.moderationSupportRepository.findOne({
            where: {
                id: supportID
            },
            relations: {
                creator: true
            },
            select: [ 'id', 'creator' ]
        })
        if(!support) {
            return templateResponse(res, "Support not found", 404)
        }

        templateResponse(res, support.creator.id, 200)
    }


    // post
    async sendMessage(
        res: Response,
        req: Request,

        supportID: number,
        text: string,
        attachments: Express.Multer.File[]
    ) {
        if(!supportID || isNaN(supportID)
            || !text || text.length < 4 || text.length > 1024
            || !attachments || typeof attachments !== 'object') {
            return templateResponse(res, "Fields should not be empty [supportID, text, attachments]", 400)
        }

        const support = await this.moderationSupportRepository.findOne({
            where: {
                id: supportID,
                status: 'open',
                moderator: {
                    id: req['user'].id
                }
            },
            relations: {
                creator: true
            }
        })
        if(!support) {
            return templateResponse(res, "Support not found or closed", 404)
        }

        const attachmentsLoaded: AttachmentDTO[] = []
        if(attachments.length) {
            const files = await this.storageService.createFile('staff', attachments, 'default', null, null, null, req)
            if(!files || !files.length) {
                return templateResponse(res, "Failed to upload files", 500)
            }

            files.map(file => {
                attachmentsLoaded.push({ type: file.type as any, url: file.link })
            })
        }

        const insert = await this.moderationSupportMessageRepository.insert({
            support: support,
            sender: req['user'],
            senderModerator: true,
            text: text,
            attachments: attachmentsLoaded
        })
        if(!insert) {
            return templateResponse(res, "Failed to create message", 50)
        }

        const newMessage = await this.moderationSupportMessageRepository.findOne({
            where: {
                id: insert.raw.insertId
            },
            relations: {
                sender: true
            }
        })
        if(!newMessage) {
            return templateResponse(res, "Failed to create message", 50)
        }

        await this.moderationSupportRepository.update({ id: support.id }, {
            updateAt: new Date(),
            lastMessage: newMessage
        })
        await this.userGatewayClients.emit(support.creator, 'onSupportMessage', newMessage)

        templateResponse(res, {
            messageID: insert.raw.insertId,
            sender: req['user'],
            attachments: attachmentsLoaded
        }, 200)
    }



    // put
    async changeSupportStatus(
        res: Response,
        req: Request,

        supportID: number
    ) {
        if(!supportID || isNaN(supportID)) {
            return templateResponse(res, "Fields should not be empty [supportID]", 400)
        }

        const support = await this.moderationSupportRepository.findOne({
            where: {
                id: supportID,
                moderator: {
                    id: req['user'].id
                }
            },
            select: [ 'id', 'status', 'creator' ],
            relations: {
                creator: true
            }
        })
        if(!support) {
            return templateResponse(res, "Support not found", 404)
        }

        support.status = support.status === 'closed' ? 'open' : 'closed'
        await this.moderationSupportRepository.update({ id: support.id }, {
            status: support.status,
            updateAt: new Date()
        })

        const message = await this.sendSystemMessage(support.id, support.status === 'closed' ? 'SUPPORT_SYSTEMMESSAGE_CLOSE_BY_MODERATOR' : 'SUPPORT_SYSTEMMESSAGE_OPEN_BY_MODERATOR')
        if(message) {
            await this.moderationGatewayClients.emit(req['user'], 'onSupportMessage', message)
            await this.userGatewayClients.emit(support.creator, 'onSupportMessage', message)
        }

        await this.userGatewayClients.emit(support.creator, 'onSupportChangeStatus', support.id, support.status)
        this.userNotificationsService.send(support.status === 'closed' ? 'supportClosed' : 'supportOpened', support.creator, { support: support })

        this.logsService.create('user', `Изменил статус обращения #${support.id} на ${support.status}`, {
            supportData: support
        })
        templateResponse(res, support.status, 200)
    }



    // delete





    // other
    async clearOldModerators() {
        await this.moderationSupportRepository.update({
            moderatorSelectAt: LessThan(new Date(+new Date() - 1800000)),
            moderator: Not(null)
        }, { moderator: null, moderatorSelectAt: null })
    }
    async sendSystemMessage(supportID: number, text: string): Promise<ModerationSupportMessageEntity> {
        const support = await this.moderationSupportRepository.findOne({
            where: {
                id: supportID
            }
        })
        if(!support)return

        const insert = await this.moderationSupportMessageRepository.insert({
            support,
            senderSystem: true,
            text
        })
        if(!insert)return

        return await this.moderationSupportMessageRepository.findOne({
            where: {
                id: insert.raw.insertId
            },
            relations: {
                support: true
            }
        })
    }
}