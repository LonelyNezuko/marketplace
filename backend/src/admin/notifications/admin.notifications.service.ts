import { Injectable, OnModuleInit } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { InjectRepository } from "@nestjs/typeorm";
import CONFIG_NOTIFICATIONS from "common/configs/notifications.config";
import templateResponse from "common/templates/response.tp";
import { Request, Response } from "express";
import { StorageService } from "src/__service/storage/storage.service";
import { LogsService } from "src/logs/logs.service";
import { Product } from "src/product/product.entity";
import { ProductService } from "src/product/product.service";
import { User } from "src/user/user.entity";
import { UserNotifications } from "src/user/user.notifications/user.notifications.entity";
import { UserService } from "src/user/user.service";
import { Repository } from "typeorm";

@Injectable()
export class AdminNotificationsService implements OnModuleInit {
    constructor(
        @InjectRepository(UserNotifications)
        private readonly userNotificationsRepository: Repository<UserNotifications>,

        private readonly moduleRef: ModuleRef
    ) {}

    private logsService: LogsService
    private storageService: StorageService
    private productService: ProductService
    private userService: UserService

    async onModuleInit() {
        this.logsService = await this.moduleRef.get(LogsService, { strict: false })
        this.storageService = await this.moduleRef.get(StorageService, { strict: false })
        this.productService = await this.moduleRef.get(ProductService, { strict: false })
        this.userService = await this.moduleRef.get(UserService, { strict: false })
    }


    // get
    async getNotification(
        id: number,

        res: Response,
        req: Request
    ) {
        if(!id) {
            return templateResponse(res, "Fields should do not be empty (id)", 400)
        }

        const notification = await this.userNotificationsRepository.findOne({
            where: [
                {
                    id,
                    type: 'system'
                }
            ],
            relations: {
                attachedProduct: true,
                attachedUser: true,
                creator: true
            }
        })
        if(!notification) {
            return templateResponse(res, "Notification with this 'id' not found", 404)
        }

        templateResponse(res, notification, 200)
    }

    async getList(
        res: Response,
        req: Request
    ) {
        const notifications = await this.userNotificationsRepository.find({
            where: {
                type: 'system'
            },
            order: {
                viewAt: 'desc'
            },

            relations: {
                attachedProduct: true,
                attachedUser: true,
                creator: true
            }
        })

        templateResponse(res, notifications, 200)
    }


    // post
    async createNotification(
        name: string,
        previewAvatar: Express.Multer.File,
        text: string,
        viewAt: Date,

        attachedProductID: number,
        attachedUserID: number,

        res: Response,
        req: Request
    ) {
        if(!name || !previewAvatar || !text || !viewAt) {
            return templateResponse(res, "Fields sould do not be empty (name, previewAvatar, text, viewAt)", 400)
        }
        viewAt = new Date(viewAt)

        if(name.length < 4 || name.length > 32) {
            return templateResponse(res, "Incorrect data [name]", 400)
        }
        if(text.length < 10 || text.length > 512) {
            return templateResponse(res, "Incorrect data [text]", 400)
        }

        const verifyDate = +new Date(+new Date + CONFIG_NOTIFICATIONS.viewAtMinBetween).setHours(0, 0, 0, 0)
        if(+new Date(viewAt) < verifyDate) {
            return templateResponse(res, "Incorrect data [viewAt]", 400)
        }

        let attachedProduct: Product
        let attachedUser: User

        console.log(attachedProductID)

        if(!isNaN(attachedProductID)) {
            attachedProduct = await this.productService.get(attachedProductID)
            if(!attachedProduct) {
                return templateResponse(res, "Product with this 'attachedProductID' not found", 404)
            }
        }
        if(!isNaN(attachedUserID)) {
            attachedUser = await this.userService.get(attachedUserID)
            if(!attachedUser) {
                return templateResponse(res, "User with this 'attachedUserID' not found", 404)
            }
        }

        const uploadPreviewAvatarResult = await this.storageService.createFile('default', [ previewAvatar ], 'admin', null, name + ' [previewAvatar]', null, req)
        if(!uploadPreviewAvatarResult) {
            return templateResponse(res, "Failed to upload 'previewAvatar'", 500)
        }

        const insert = await this.userNotificationsRepository.insert({
            name,
            previewAvatar: uploadPreviewAvatarResult[0].link,
            text,
            viewAt,
            attachedProduct,
            attachedUser,
            type: 'system',
            creator: req['user']
        })
        if(!insert) {
            return templateResponse(res, "Failed to create notification", 500)
        }

        this.logsService.create('user', `Создал уведомление #${insert.raw.insertId}`, {
            userData: req['user']
        })
        templateResponse(res, insert.raw.insertId, 200)
    }


    // delete
    async deleteNotification(
        notfid: number,

        res: Response,
        req: Request
    ) {
        if(!notfid) {
            return templateResponse(res, "Fields sould do not be empty (notfid)", 400)
        }

        const notification = await this.userNotificationsRepository.findOne({
            where: {
                type: 'system',
                id: notfid
            }
        })
        if(!notification) {
            return templateResponse(res, "Notification with this 'notfid' not found", 404)
        }

        if(notification.viewAt < new Date()) {
            return templateResponse(res, "The ad cannot be deleted because it has already been sent", 400)
        }

        await this.userNotificationsRepository.delete({ id: notification.id })
        this.logsService.create('user', `Удалил уведомление #${notification.id}`, {
            userData: req['user']
        })

        templateResponse(res, "", 200)
    }
}