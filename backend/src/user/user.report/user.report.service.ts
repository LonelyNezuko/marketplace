import { Injectable, OnModuleInit } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { InjectRepository } from "@nestjs/typeorm";
import templateResponse from "common/templates/response.tp";
import { Request, Response } from "express";
import { LogsService } from "src/logs/logs.service";
import { ModerationReportEntity, ModerationReportMessageEntity } from "src/moderation/moderation.report/moderation.report.entity";
import { ModerationReportService } from "src/moderation/moderation.report/moderation.report.service";
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
import CONFIG_DEFAULT from "common/configs/default.config";

@Injectable()
export class UserReportService implements OnModuleInit {
    constructor(
        @InjectRepository(ModerationReportEntity)
        private readonly moderationReportRepository: Repository<ModerationReportEntity>,

        @InjectRepository(ModerationReportMessageEntity)
        private readonly moderationReportMessageRepository: Repository<ModerationReportMessageEntity>,

        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        private readonly userGatewayClients: UserGatewayClients,
        private readonly moderationGatewayClients: ModerationGatewayClients,

        private readonly moduleRef: ModuleRef
    ) {}

    private moderationReportService: ModerationReportService
    private productService: ProductService
    private userService: UserService
    private logsService: LogsService
    private storageService: StorageService

    async onModuleInit() {
        this.moderationReportService = await this.moduleRef.get(ModerationReportService, { strict: false })
        this.logsService = await this.moduleRef.get(LogsService, { strict: false })
        this.productService = await this.moduleRef.get(ProductService, { strict: false })
        this.userService = await this.moduleRef.get(UserService, { strict: false })
        this.storageService = await this.moduleRef.get(StorageService, { strict: false })
    }


    // get
    async getReportList(
        res: Response,
        req: Request
    ) {
        const reports = await this.moderationReportRepository.find({
            where: {
                creator: {
                    id: req['user'].id
                }
            },
            relations: {
                productEntity: true,
                userEntity: true
            },
            order: {
                updateAt: 'desc'
            }
        })

        templateResponse(res, reports, 200)
    }

    async getReport(
        res: Response,
        req: Request,

        reportID: number
    ) {
        if(!reportID || isNaN(reportID)) {
            return templateResponse(res, "Fields should not be empty [reportID]", 400)
        }

        const report = await this.moderationReportRepository.findOne({
            where: {
                creator: {
                    id: req['user'].id
                },
                id: reportID
            },
            relations: {
                productEntity: true,
                userEntity: true
            }
        })
        if(!report) {
            return templateResponse(res, "Report not found", 404)
        }

        const messages = await this.moderationReportMessageRepository.find({
            where: {
                report: {
                    id: report.id
                }
            },
            relations: {
                sender: true
            }
        })

        messages.map(mes => {
            if(mes.senderModerator) {
                (mes.sender as any) = { id: mes.sender.id }
            }
        })

        templateResponse(res, {
            report,
            messages
        }, 200)
    }


    // post
    async sendMessage(
        res: Response,
        req: Request,

        reportID: number,
        text: string,
        attachments: Express.Multer.File[]
    ) {
        if(!req['user'].emailVerify) {
            return templateResponse(res, "You need to confirm your email", 403)
        }

        if(!reportID || isNaN(reportID) || !text || !text.length || !attachments || typeof attachments !== 'object') {
            return templateResponse(res, "Fields should not be empty (reportID, text, attachments)", 400)
        }

        if(text.length < 4 || text.length > 1024) {
            return templateResponse(res, "Incorrect data [text]", 400)
        }
    
        const report = await this.moderationReportRepository.findOne({
            where: {
                creator: {
                    id: req['user'].id
                },
                id: reportID
            },
            relations: {
                moderator: true,
                lastMessage: {
                    sender: true
                }
            }
        })
        if(!report) {
            return templateResponse(res, "Report not found", 404)
        }

        if(report && report.lastMessage && report.lastMessage.sender) {
            if(report.lastMessage.sender.id === req['user'].id
                && +new Date(report.lastMessage.createAt) + CONFIG_DEFAULT.cooldownSendMessage >+ +new Date()
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

        const insert = await this.moderationReportMessageRepository.insert({
            report: report,
            sender: req['user'],
            text: text,
            attachments: attachmentsLoaded
        })
        if(!insert) {
            return templateResponse(res, "Failed to create message", 500)
        }

        const newMessage = await this.moderationReportMessageRepository.findOne({
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

        if(report.moderator) {
            await this.moderationGatewayClients.emit(report.moderator, 'onReportMessage', newMessage)
        }

        await this.moderationReportRepository.update({ id: report.id }, {
            updateAt: new Date(),
            lastMessage: newMessage
        })

        templateResponse(res, {
            messageID: insert.raw.insertId,
            sender: req['user'],
            attachments: attachmentsLoaded
        }, 200)
    }

    async createReport(
        res: Response,
        req: Request,

        userID: number,
        productID: number,
        text: string,
        reason: string
    ) {
        if(!text || !text.length || !reason || !reason.length) {
            return templateResponse(res, "Fields should not be empty (text, reason)", 400)
        }

        if(text.length < 10 || text.length > 1024) {
            return templateResponse(res, "Incorrect data [text]", 400)
        }
        if(reason.length < 4 || reason.length > 32) {
            return templateResponse(res, "Incorrect data [reason]", 400)
        }

        if(!req['user'].emailVerify) {
            return templateResponse(res, "You need to confirm your email", 403)
        }

        if(!productID && !userID) {
            return templateResponse(res, "One of fields should not be empty [productID or userID]", 400)
        }
        if(productID && userID) {
            return templateResponse(res, "There should be only one field [productID or userID]", 400)
        }

        let product: Product
        let user: User

        if(productID) {
            product = await this.productService.get(productID)
            if(!product) {
                return templateResponse(res, "Product not found", 404)
            }
        }
        if(userID) {
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
                reportList: {
                    productEntity: true,
                    userEntity: true
                }
            },
            select: [ 'id', 'reportList' ]
        })
        if(!currentUser) {
            return templateResponse(res, "Unknown error", 520)
        }

        const findToReportList = currentUser.reportList.find(item => {
            if(+new Date(item.createAt) >= +new Date() - CONFIG_USER.coolDownToReportSimilar) {
                if(product && item.type === 'product' && item.productEntity) {
                    if(item.productEntity.prodID === product.prodID)return true
                }
                else if(user && item.type === 'user' && item.userEntity) {
                    if(item.userEntity.id === user.id)return true
                }
            }
        
            return false
        })
        if(findToReportList) {
            return templateResponse(res, "Recently, a complaint has already been created against this entity", 403)
        }

        let insert = await this.moderationReportRepository.insert({
            creator: req['user'],
            type: product ? 'product' : 'user',
            userEntity: user,
            productEntity: product,
            moderatorSelectAt: null,
            reason: reason
        })
        if(!insert) {
            return templateResponse(res, "Failed to create report", 500)
        }
        
        const reportID = insert.raw.insertId
        await this.moderationReportService.sendSystemMessage(reportID, "REPORT_SYSTEMMESSAGE_CREATE_BY_USER")
    
        insert = await this.moderationReportMessageRepository.insert({
            report: {
                id: reportID
            },
            sender: req['user'],
            text: text,
            attachments: []
        })
        if(!insert) {
            this.moderationReportRepository.delete({ id: reportID })
            this.moderationReportMessageRepository.delete({ report: { id: reportID } })

            return templateResponse(res, "Failed to create report message", 500)
        }

        this.logsService.create('user', `Создал жалобу #${reportID}`, {
            reportsData: {
                id: reportID
            } as any
        })

        templateResponse(res, reportID, 200)
    }


    // put
    async closeReport(
        res: Response,
        req: Request,

        reportID: number
    ) {
        if(!reportID || isNaN(reportID)) {
            return templateResponse(res, "Fields should not be empty [reportID]", 400)
        }

        const report = await this.moderationReportRepository.findOne({
            where: {
                creator: {
                    id: req['user'].id
                },
                id: reportID,
                status: 'open'
            },
            relations: {
                moderator: true
            }
        })
        if(!report) {
            return templateResponse(res, "Report not found", 404)
        }

        if(report.status !== 'open') {
            return templateResponse(res, "This report not open", 400)
        }

        const message = await this.moderationReportService.sendSystemMessage(report.id, 'REPORT_SYSTEMMESSAGE_CLOSE_BY_USER')
        if(!message) {
            return templateResponse(res, "Failed to close report", 500)
        }

        await this.userGatewayClients.emit(req['user'], 'onReportMessage', message)
        if(report.moderator) {
            await this.moderationGatewayClients.emit(report.moderator, 'onReportChangeStatus', report.id, 'closed')
            await this.moderationGatewayClients.emit(report.moderator, 'onReportMessage', message)
        }

        await this.moderationReportRepository.update({ id: report.id }, { status: 'closed', updateAt: new Date() })
        
        this.logsService.create('user', `Закрыл жалобу #${reportID}`, {
            reportsData: report
        })

        templateResponse(res, "", 200)
    }


    // delete
}