import { Injectable, OnModuleInit } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { InjectRepository } from "@nestjs/typeorm";
import templateResponse from "common/templates/response.tp";
import { Request, Response } from "express";
import { LogsService } from "src/logs/logs.service";
import { Product } from "src/product/product.entity";
import { Repository } from "typeorm";
import { User } from "../user.entity";
import { ProductService } from "src/product/product.service";
import { UserService } from "../user.service";
import { AttachmentDTO, AttachmentVerify } from "common/dto/attachment.dto";
import CONFIG_USER from "common/configs/user.config";
import { StorageService } from "src/__service/storage/storage.service";
import { UserGatewayClients } from "../user.gateway";
import { ModerationGatewayClients } from "src/moderation/moderation.gateway";
import { ModerationSupportEntity, ModerationSupportMessageEntity, ModerationSupportType } from "src/moderation/moderation.support/moderation.support.entity";
import { ModerationSupportService } from "src/moderation/moderation.support/moderation.support.service";
import CONFIG_DEFAULT from "common/configs/default.config";

@Injectable()
export class UserSupportService implements OnModuleInit {
    constructor(
        @InjectRepository(ModerationSupportEntity)
        private readonly moderationSupportRepository: Repository<ModerationSupportEntity>,

        @InjectRepository(ModerationSupportMessageEntity)
        private readonly moderationSupportMessageRepository: Repository<ModerationSupportMessageEntity>,

        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        private readonly userGatewayClients: UserGatewayClients,
        private readonly moderationGatewayClients: ModerationGatewayClients,

        private readonly moduleRef: ModuleRef
    ) {}

    private moderationSupportService: ModerationSupportService
    private productService: ProductService
    private userService: UserService
    private logsService: LogsService
    private storageService: StorageService

    async onModuleInit() {
        this.logsService = await this.moduleRef.get(LogsService, { strict: false })
        this.productService = await this.moduleRef.get(ProductService, { strict: false })
        this.userService = await this.moduleRef.get(UserService, { strict: false })
        this.storageService = await this.moduleRef.get(StorageService, { strict: false })
        this.moderationSupportService = await this.moduleRef.get(ModerationSupportService, { strict: false })
    }


    // get
    async getSupportList(
        res: Response,
        req: Request
    ) {
        const supports = await this.moderationSupportRepository.find({
            where: {
                creator: {
                    id: req['user'].id
                }
            },
            order: {
                updateAt: 'desc'
            }
        })

        templateResponse(res, supports, 200)
    }

    async getSupport(
        res: Response,
        req: Request,

        supportID: number
    ) {
        if(!supportID || isNaN(supportID)) {
            return templateResponse(res, "Fields should not be empty [supportID]", 400)
        }

        const support = await this.moderationSupportRepository.findOne({
            where: {
                creator: {
                    id: req['user'].id
                },
                id: supportID
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

        messages.map(mes => {
            if(mes.senderModerator) {
                (mes.sender as any) = { id: mes.sender.id }
            }
        })

        templateResponse(res, {
            support,
            messages
        }, 200)
    }


    // post
    async sendMessage(
        res: Response,
        req: Request,

        supportID: number,
        text: string,
        attachments: Express.Multer.File[]
    ) {
        if(!req['user'].emailVerify) {
            return templateResponse(res, "You need to confirm your email", 403)
        }

        if(!supportID || isNaN(supportID) || !text || !text.length || !attachments || typeof attachments !== 'object') {
            return templateResponse(res, "Fields should not be empty (supportID, text, attachments)", 400)
        }

        if(text.length < 4 || text.length > 1024) {
            return templateResponse(res, "Incorrect data [text]", 400)
        }
    
        const support = await this.moderationSupportRepository.findOne({
            where: {
                creator: {
                    id: req['user'].id
                },
                id: supportID
            },
            relations: {
                moderator: true,
                lastMessage: {
                    sender: true
                }
            }
        })
        if(!support) {
            return templateResponse(res, "Support not found", 404)
        }

        if(support && support.lastMessage && support.lastMessage.sender) {
            if(support.lastMessage.sender.id === req['user'].id
                && +new Date(support.lastMessage.createAt) + CONFIG_DEFAULT.cooldownSendMessage >+ +new Date()
            ) {
                return templateResponse(res, "", 425)
            }
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
            text: text,
            attachments: attachmentsLoaded
        })
        if(!insert) {
            return templateResponse(res, "Failed to create message", 500)
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

        if(support.moderator) {
            await this.moderationGatewayClients.emit(support.moderator, 'onSupportMessage', newMessage)
        }

        await this.moderationSupportRepository.update({ id: support.id }, {
            updateAt: new Date(),
            lastMessage: newMessage
        })
        templateResponse(res, {
            messageID: insert.raw.insertId,
            sender: req['user'],
            attachments: attachmentsLoaded
        }, 200)
    }

    async createSupport(
        res: Response,
        req: Request,

        text: string,
        reason: string,

        type: ModerationSupportType,

        userID?: number,
        productID?: number,
    ) {
        if(!text || !text.length || !reason || !reason.length || !type) {
            return templateResponse(res, "Fields should not be empty (text, reason, type)", 400)
        }

        if(text.length < 10 || text.length > 1024) {
            return templateResponse(res, "Incorrect data [text]", 400)
        }
        if(reason.length < 4 || reason.length > 64) {
            return templateResponse(res, "Incorrect data [reason]", 400)
        }

        if(type !== 'account' && type !== 'other' && type !== 'product') {
            return templateResponse(res, "Incorrect data [type]", 400)
        }

        // if(type === 'account' && !userID) {
        //     return templateResponse(res, "'userID' is required for this 'type'", 400)
        // }
        // if(type === 'product' && !productID) {
        //     return templateResponse(res, "'productID' is required for this 'type'", 400)
        // }

        if(!req['user'].emailVerify) {
            return templateResponse(res, "You need to confirm your email", 403)
        }

        let product: Product
        let user: User

        if(productID) {
            // if(type !== 'product') {
            //     return templateResponse(res, "The 'productID' requires the 'product' type", 400)
            // }

            product = await this.productService.get(productID)
            if(!product) {
                return templateResponse(res, "Product not found", 404)
            }
        }
        if(userID) {
            // if(type !== 'account') {
            //     return templateResponse(res, "The 'userID' requires the 'account' type", 400)
            // }

            user = await this.userService.get(userID)
            if(!user) {
                return templateResponse(res, "User not found", 404)
            }
        }

        if(product && user) {
            return templateResponse(res, "There should be only one field [productID or userID]", 400)
        }

        const currentUser = await this.userRepository.findOne({
            where: {
                id: req['user'].id
            },
            relations: {
                supportList: true
            },
            select: [ 'id', 'supportList' ]
        })
        if(!currentUser) {
            return templateResponse(res, "Unknown error", 520)
        }

        if(user && user.id === currentUser.id) user = null

        const findToReportList = currentUser.supportList.find(item => {
            if(item.status === 'open' && +new Date(item.createAt) <= +new Date() - CONFIG_USER.coolDownToSupportCreate)return true
            // if(item.status === 'open') {
            //     if(product && item.type === 'product' && item.productEntity?.prodID === product.prodID)return true
            //     else if(user && item.type === 'account' && item.userEntity?.id === user.id)return true
            // }
        
            return false
        })
        if(findToReportList) {
            return templateResponse(res, "Support has already been sent recently or there is a support with the same data", 403)
        }

        let insert = await this.moderationSupportRepository.insert({
            creator: req['user'],
            type,
            moderatorSelectAt: null,
            reason: reason
        })
        if(!insert) {
            return templateResponse(res, "Failed to create support", 500)
        }
        
        const supportID = insert.raw.insertId
        await this.moderationSupportService.sendSystemMessage(supportID, "SUPPORT_SYSTEMMESSAGE_CREATE_BY_USER")
    
        insert = await this.moderationSupportMessageRepository.insert({
            support: {
                id: supportID
            },
            sender: req['user'],
            text: text,
            attachments: [],
            attachProduct: product,
            attachUser: user
        })
        if(!insert) {
            this.moderationSupportRepository.delete({ id: supportID })
            this.moderationSupportMessageRepository.delete({ support: { id: supportID } })

            return templateResponse(res, "Failed to create support message", 500)
        }

        await this.moderationSupportRepository.update({ id: supportID }, { updateAt: new Date(), lastMessage: { id: insert.raw.insertId } })
        this.logsService.create('user', `Создал обращение #${supportID}`, {
            reportsData: {
                id: supportID
            } as any
        })

        templateResponse(res, supportID, 200)
    }


    // put
    async closeSupport(
        res: Response,
        req: Request,

        supportID: number
    ) {
        if(!supportID || isNaN(supportID)) {
            return templateResponse(res, "Fields should not be empty [supportID]", 400)
        }

        const support = await this.moderationSupportRepository.findOne({
            where: {
                creator: {
                    id: req['user'].id
                },
                id: supportID,
                status: 'open'
            },
            relations: {
                moderator: true
            }
        })
        if(!support) {
            return templateResponse(res, "Support not found", 404)
        }

        if(support.status !== 'open') {
            return templateResponse(res, "This support not open", 400)
        }

        const message = await this.moderationSupportService.sendSystemMessage(support.id, 'SUPPORT_SYSTEMMESSAGE_CLOSE_BY_USER')
        if(!message) {
            return templateResponse(res, "Failed to close support", 500)
        }

        await this.userGatewayClients.emit(req['user'], 'onSupportMessage', message)
        if(support.moderator) {
            await this.moderationGatewayClients.emit(support.moderator, 'onSupportChangeStatus', support.id, 'closed')
            await this.moderationGatewayClients.emit(support.moderator, 'onSupportMessage', message)
        }

        await this.moderationSupportRepository.update({ id: support.id }, { status: 'closed', updateAt: new Date() })
        
        this.logsService.create('user', `Закрыл обращение #${support}`, {
            supportData: support
        })

        templateResponse(res, "", 200)
    }


    // delete
}