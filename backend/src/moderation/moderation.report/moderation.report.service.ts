import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ModerationReportEntity, ModerationReportMessageEntity } from "./moderation.report.entity";
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

@Injectable()
export class ModerationReportService implements OnModuleInit {
    constructor(
        @InjectRepository(ModerationReportEntity)
        private readonly moderationReportRepository: Repository<ModerationReportEntity>,

        @InjectRepository(ModerationReportMessageEntity)
        private readonly moderationReportMessageRepository: Repository<ModerationReportMessageEntity>,

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
    async getReport(
        res: Response,
        req: Request,

        reportID: number
    ) {
        if(!reportID || isNaN(reportID)) {
            return templateResponse(res, "Fields should not be empty [reportID]", 400)
        }

        await this.clearOldModerators()
        const report = await this.moderationReportRepository.findOne({
            where: [
                {
                    id: reportID,
                    moderator: IsNull()
                },
                {
                    id: reportID,
                    moderator: {
                        id: req['user'].id
                    }
                }
            ],
            relations: {
                creator: true,
                productEntity: true,
                userEntity: true,
                moderator: true
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

        await this.moderationReportRepository.update({ id: report.id }, {
            moderator: {
                id: req['user'].id
            },
            moderatorSelectAt: new Date()
        })

        templateResponse(res, {
            report,
            messages
        }, 200)
    }

    async getOpenReport(
        res: Response,
        req: Request
    ) {
        await this.clearOldModerators()
        const report = await this.moderationReportRepository.findOne({
            where: [
                {
                    moderator: IsNull(),
                    status: 'open'
                },
                {
                    moderator: {
                        id: req['user'].id
                    }
                }
            ],
            select: [ 'id', 'updateAt' ],
            order: {
                updateAt: 'asc'
            }
        })
        if(!report) {
            return templateResponse(res, "Report not found or closed", 404)
        }

        templateResponse(res, report.id, 200)
    }

    async getOpenReportSubjectID(
        res: Response,
        req: Request,

        reportID: number
    ) {
        if(!reportID || isNaN(reportID)) {
            return templateResponse(res, "Fields should not be empty [reportID]", 400)
        }

        const report = await this.moderationReportRepository.findOne({
            where: {
                id: reportID
            },
            relations: {
                productEntity: true,
                userEntity: true
            },
            select: [ 'id', 'updateAt', 'creator' ],
            order: {
                updateAt: 'asc'
            }
        })
        if(!report) {
            return templateResponse(res, "Report not found", 404)
        }

        templateResponse(res, {
            user: report.userEntity?.id,
            product: report.productEntity?.prodID
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
        if(!reportID || isNaN(reportID)
            || !text || text.length < 4 || text.length > 1024
            || !attachments || typeof attachments !== 'object') {
            return templateResponse(res, "Fields should not be empty [reportID, text, attachments]", 400)
        }

        const report = await this.moderationReportRepository.findOne({
            where: {
                id: reportID,
                status: 'open',
                moderator: {
                    id: req['user'].id
                }
            },
            relations: {
                creator: true
            }
        })
        if(!report) {
            return templateResponse(res, "Report not found or closed", 404)
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
            senderModerator: true,
            text: text,
            attachments: attachmentsLoaded
        })
        if(!insert) {
            return templateResponse(res, "Failed to create message", 50)
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

        await this.moderationReportRepository.update({ id: report.id }, {
            updateAt: new Date()
        })
        await this.userGatewayClients.emit(report.creator, 'onReportMessage', newMessage)

        templateResponse(res, {
            messageID: insert.raw.insertId,
            sender: req['user'],
            attachments: attachmentsLoaded
        }, 200)
    }



    // put
    async changeReportStatus(
        res: Response,
        req: Request,

        reportID: number
    ) {
        if(!reportID || isNaN(reportID)) {
            return templateResponse(res, "Fields should not be empty [reportID]", 400)
        }

        const report = await this.moderationReportRepository.findOne({
            where: {
                id: reportID,
                moderator: {
                    id: req['user'].id
                }
            },
            select: [ 'id', 'status', 'creator' ],
            relations: {
                creator: true
            }
        })
        if(!report) {
            return templateResponse(res, "Report not found", 404)
        }

        report.status = report.status === 'closed' ? 'open' : 'closed'
        await this.moderationReportRepository.update({ id: report.id }, {
            status: report.status,
            updateAt: new Date()
        })

        const message = await this.sendSystemMessage(report.id, report.status === 'closed' ? 'REPORT_SYSTEMMESSAGE_CLOSE_BY_MODERATOR' : 'REPORT_SYSTEMMESSAGE_OPEN_BY_MODERATOR')
        if(message) {
            await this.moderationGatewayClients.emit(req['user'], 'onReportMessage', message)
            await this.userGatewayClients.emit(report.creator, 'onReportMessage', message)
        }

        await this.userGatewayClients.emit(report.creator, 'onReportChangeStatus', report.id, report.status)
        this.userNotificationsService.send(report.status === 'closed' ? 'reportClosed' : 'reportOpened', report.creator, { report: report })

        this.logsService.create('user', `Изменил статус жалобы #${report.id} на ${report.status}`, {
            reportsData: report
        })
        templateResponse(res, report.status, 200)
    }



    // delete





    // other
    async clearOldModerators() {
        await this.moderationReportRepository.update({
            moderatorSelectAt: LessThan(new Date(+new Date() - 1800000)),
            moderator: Not(null)
        }, { moderator: null, moderatorSelectAt: null })
    }
    async sendSystemMessage(reportID: number, text: string): Promise<ModerationReportMessageEntity> {
        const report = await this.moderationReportRepository.findOne({
            where: {
                id: reportID
            }
        })
        if(!report)return

        const insert = await this.moderationReportMessageRepository.insert({
            report,
            senderSystem: true,
            text
        })
        if(!insert)return

        return await this.moderationReportMessageRepository.findOne({
            where: {
                id: insert.raw.insertId
            },
            relations: {
                report: true
            }
        })
    }
}