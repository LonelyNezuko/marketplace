import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { UserNotifications } from "./user.notifications.entity";
import { And, FindManyOptions, In, LessThanOrEqual, MoreThan, Not, Repository } from "typeorm";
import { ModuleRef } from "@nestjs/core";
import { UserService } from "../user.service";
import { ProductService } from "src/product/product.service";
import { Request, Response } from "express";
import templateResponse from "common/templates/response.tp";
import { User } from "../user.entity";
import { UserGatewayClients } from "../user.gateway";
import { UserNotificationsType } from "./user.notifications.dto";
import { Product } from "src/product/product.entity";
import { MailTemplateService } from "src/__service/mailtemplate/mailtemplate.service";
import { MailerService } from "src/__service/mailer/mailer.service";
import { LanguageService } from "src/__service/language/language.service";
import { ModerationReportEntity } from "src/moderation/moderation.report/moderation.report.entity";
import { ModerationSupportEntity } from "src/moderation/moderation.support/moderation.support.entity";

@Injectable()
export class UserNotificationsService implements OnModuleInit {
    constructor(
        @InjectRepository(UserNotifications)
        private readonly userNotificationsRepository: Repository<UserNotifications>,

        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        @InjectRepository(ModerationReportEntity)
        private readonly moderationReportRepository: Repository<ModerationReportEntity>,

        @InjectRepository(ModerationSupportEntity)
        private readonly moderationSupportRepository: Repository<ModerationSupportEntity>,

        private readonly userGatewayCliens: UserGatewayClients,

        private readonly moduleRef: ModuleRef
    ) {}

    private userService: UserService
    private productService: ProductService

    private mailTemplateService: MailTemplateService
    private mailerService: MailerService

    private languageService: LanguageService

    async onModuleInit() {
        this.userService = await this.moduleRef.get(UserService, { strict: false })
        this.productService = await this.moduleRef.get(ProductService, { strict: false })

        this.mailTemplateService = await this.moduleRef.get(MailTemplateService, { strict: false })
        this.mailerService = await this.moduleRef.get(MailerService, { strict: false })

        this.languageService = await this.moduleRef.get(LanguageService, { strict: false })
    }


    // get
    async getList(
        res: Response,
        req: Request,

        pagination?: { page: number, limit: number },
        notIDS?: number[]
    ) {
        if(!pagination) pagination = { page: 1, limit: 20 }
        if(pagination && !pagination.page) pagination.page = 1
        if(pagination && !pagination.limit) pagination.limit = 20

        if(!notIDS) notIDS = []
        const findOptions: FindManyOptions<UserNotifications> = {
            where: [
                {
                    forUser: { id: req['user'].id },
                    id: Not(In(notIDS)),
                    viewAt: And(LessThanOrEqual(new Date()), MoreThan(req['user'].createAt))
                },
                {
                    type: 'system',
                    viewAt: And(LessThanOrEqual(new Date()), MoreThan(req['user'].createAt)),
                    id: Not(In([...req['user'].deleteSystemNotifications.map(item => item.id), ...notIDS]))
                }
            ],
            relations: {
                forUser: true,
                attachedProduct: {
                    prodCategory: true
                },
                attachedUser: true,
                attachedReport: true,
                attachedSupport: true
            },

            skip: (pagination.page - 1) * pagination.limit,
            take: pagination.limit,

            order: {
                viewAt: 'desc'
            }
        }

        const notifications = await this.userNotificationsRepository.find(findOptions)
        notifications.map(notf => {
            if(req['user'].readNotifications.find(item => item.id === notf.id)) (notf as any).isRead = true
        })

        delete findOptions.skip
        delete findOptions.take
        
        const allNotificationsCount = await this.userNotificationsRepository.count(findOptions)

        templateResponse(res, {
            list: notifications,
            allcount: allNotificationsCount
        }, 200)
    }

    async getUnreadCount(
        res: Response,
        req: Request
    ) {
        const readids: number[] = req['user'].readNotifications.map(notf => {
            return notf.id
        })
        const notDeleteIDS: number[] = req['user'].deleteSystemNotifications.map(notf => {
            return notf.id
        })

        const notificationsCount = await this.userNotificationsRepository.count({
            where: [
                {
                    type: 'system',
                    id: Not(In([...readids, ...notDeleteIDS])),
                    viewAt: And(LessThanOrEqual(new Date()), MoreThan(req['user'].createAt)),
                },
                {
                    forUser: { id: req['user'].id },
                    id: Not(In([...readids, ...notDeleteIDS])),
                    viewAt: And(LessThanOrEqual(new Date()), MoreThan(req['user'].createAt))
                }
            ]
        })
        templateResponse(res, notificationsCount, 200)
    }

    async getAllCount(
        res: Response,
        req: Request
    ) {
        const notSystemIDS: number[] = req['user'].deleteSystemNotifications.map(item => {
            return item.id
        })
        let notificationsCount = await this.userNotificationsRepository.count({
            where: [
                { type: 'system', id: Not(In(notSystemIDS)) },
                { forUser: { id: req['user'].id } }
            ]
        })

        templateResponse(res, notificationsCount, 200)
    }


    // post
    async readNotification(
        notfIDList: any[], // number[]

        res: Response,
        req: Request
    ) {
        if(!notfIDList || !notfIDList.length) {
            return templateResponse(res, "Fields should do not be empty (notfIDList)", 400)
        }

        req['user'].readNotifications.map(notf => {
            const findIndex = notfIDList.indexOf(notf.id.toString())
            if(findIndex !== -1) notfIDList = notfIDList.splice(findIndex, 1)
        })

        if(!notfIDList.length) {
            return templateResponse(res, "The notifications have already been read", 400)
        }

        const notifications = await this.userNotificationsRepository.find({
            where: {
                id: In(notfIDList)
            }
        })
        if(!notifications) {
            return templateResponse(res, "No transmitted notifications were found", 404)
        }

        const readNotfIDList: number[] = []
        notifications.map(item => readNotfIDList.push(item.id))

        req['user'].readNotifications = [ ...req['user'].readNotifications, ...notifications ]

        await this.userRepository.save(req['user'])
        await this.userGatewayCliens.emit(req['user'], 'onNotificationsRead', readNotfIDList.length)

        templateResponse(res, readNotfIDList, 200)
    }


    async send(type: UserNotificationsType, forUser: User, attached?: {
        product?: Product,
        user?: User,
        report?: ModerationReportEntity,
        support?: ModerationSupportEntity,
        text?: string
    }): Promise<boolean> {
        if(type === 'system') {
            throw new Error("[User.Notifications.send] System cannot be sent")
        }

        if((type === 'productBanned'
            || type === 'productDeleted'
            || type === 'productModStatusProblem')
            && (!attached || !attached.product)) {
            throw new Error("[User.Notifications.send] 'attached.product' is required for this type.")
        }
        if((type === 'reportClosed'
            || type === 'reportOpened')
            && (!attached || !attached.report)) {
            throw new Error("[User.Notifications.send] 'attached.report' is required for this type.")
        }
        if((type === 'supportClosed'
            || type === 'supportOpened')
            && (!attached || !attached.support)) {
            throw new Error("[User.Notifications.send] 'attached.support' is required for this type.")
        }

        if(!forUser || !forUser.id) {
            throw new Error("[User.Notifications.send] 'forUser' was not passed")
        }

        forUser = await this.userService.get(forUser.id)
        if(!forUser)return false

        if((type === 'reportClosed'
            || type === 'reportOpened')
            && !forUser.notifySettingsParams.report)return
        if(type === 'incomingdialogmessage'
            && !forUser.notifySettingsParams.dialogs)return
        if(type === 'productModStatusProblem'
                && !forUser.notifySettingsParams.changeProducts)return

        if(attached) {
            if(attached.product) {
                if(!attached.product.prodID) {
                    throw new Error("[User.Notifications.send] The 'attached.product' was passed incorrectly")
                }

                attached.product = await this.productService.get(attached.product.prodID)
            }
            if(attached.user) {
                if(!attached.user.id) {
                    throw new Error("[User.Notifications.send] The 'attached.user' was passed incorrectly")
                }

                attached.user = await this.userService.get(attached.user.id)
            }
            if(attached.report) {
                if(!attached.report.id) {
                    throw new Error("[User.Notifications.send] The 'attached.report' was passed incorrectly")
                }

                attached.report = await this.moderationReportRepository.findOne({
                    where: {
                        id: attached.report.id
                    }
                })
            }
            if(attached.support) {
                if(!attached.support.id) {
                    throw new Error("[User.Notifications.send] The 'attached.support' was passed incorrectly")
                }

                attached.support = await this.moderationSupportRepository.findOne({
                    where: {
                        id: attached.support.id
                    }
                })
            }
            if(attached.text) {
                if(attached.text.length < 1 || attached.text.length > 512) {
                    throw new Error("[User.Notifications.send] The 'attached.text' was passed incorrectly")
                }
            }
        }
        else attached = { product: null, user: null, text: null, support: null, report: null }

        const insert = await this.userNotificationsRepository.insert({
            forUser,
            type,
            attachedProduct: attached.product,
            attachedUser: attached.user,
            attachedReport: attached.report,
            attachedSupport: attached.support,
            text: attached.text
        })
        if(!insert) {
            throw new Error("[User.Notifications.send] Failed to send notification")
        }

        const notification = await this.userNotificationsRepository.findOne({
            where: {
                id: insert.raw.insertId
            },
            relations: {
                attachedProduct: {
                    prodCategory: true
                },
                attachedUser: true
            }
        })
        if(!notification) {
            throw new Error("[User.Notifications.send] Failed to send notification")
        }

        if(forUser.emailVerify
            && forUser.notifySettings.notifyOnEmail) {
            const text = await this.generateText('en', notification)
            if(text !== 'undefined') {
                let mailTemplate = await this.mailTemplateService.getTemplate(null, 'notification', 'en', false, true)
                if(mailTemplate) {
                    const html = await this.mailTemplateService.format(mailTemplate, {
                        'text': text
                    })
                    this.mailerService.send('noreply', forUser.email, mailTemplate.subject, null, html)
                }
            }
        }

        await this.userGatewayCliens.emit(forUser, 'onNotificationsSend', notification, forUser.notifySettings)
        return true
    }


    // delete
    async deleteNotification(
        notfid: number,

        res: Response,
        req: Request
    ) {
        if(!notfid || isNaN(notfid)) {
            return templateResponse(res, "Fields should do not be empty (notfid)", 400)
        }

        const notification = await this.userNotificationsRepository.findOne({
            where: [
                {
                    forUser: { id: req['user'].id },
                    id: notfid
                },
                {
                    type: 'system',
                    id: notfid
                }
            ]
        })
        if(!notification) {
            return templateResponse(res, "Notifications with this 'notfid' not found", 404)
        }

        if(notification.type === 'system') {
            if(req['user'].deleteSystemNotifications.find(item => item.id === notification.id)) {
                return templateResponse(res, "The notification has already been deleted", 400)
            }

            req['user'].deleteSystemNotifications.push(notification)
            await this.userRepository.save(req['user'])
        }
        else {
            await this.userNotificationsRepository.delete({ id: notification.id, forUser: { id: req['user'].id } })
        }

        templateResponse(res, "", 200)
    }

    async clearNotifications(
        res: Response,
        req: Request
    ) {
        const notIDS: number[] = req['user'].deleteSystemNotifications.map(item => {
            return item.id
        })

        const systemNotifications = await this.userNotificationsRepository.find({
            where: {
                id: Not(In(notIDS)),
                type: 'system'
            }
        })
        if(systemNotifications) {
            req['user'].deleteSystemNotifications = [...req['user'].deleteSystemNotifications, ...systemNotifications]
            await this.userRepository.save(req['user'])
        }

        await this.userNotificationsRepository.delete({ forUser: { id: req['user'].id } })
        await new UserGatewayClients().emit(req['user'], 'onNotificationsRead', 999999999999)

        templateResponse(res, "", 200)
    }


    async generateText(languageCode: string, notification: UserNotifications) {
        let text: string = 'undefined'

        switch(notification.type) {
            // case 'productbanned': {
            //     const selector = await this.languageService.getSelector(languageCode, "NOTIFICATION_TYPE_PRODUCTBANNED_TEXT_EMAIL")
            //     text = this.languageService.format(selector, notification.attachedProduct.prodID)
            //     break
            // }
        }

        return text
    }
}