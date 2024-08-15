import { Injectable, OnModuleInit } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { InjectRepository } from "@nestjs/typeorm";
import isValidDate from "common/functions/isValidDate";
import { RolePrivilegesVerify } from "common/functions/rolePrivilegesVerify";
import templateResponse from "common/templates/response.tp";
import { Request, Response } from "express";
import { LogsService } from "src/logs/logs.service";
import { Product } from "src/product/product.entity";
import { enumProductModerationStatus, enumProductStatus } from "src/product/product.enums";
import { User } from "src/user/user.entity";
import { UserService } from "src/user/user.service";
import { Like, Not, Repository } from "typeorm";
import { UserModerationHistoryEntity, UserModerationHistoryType } from "./moderation.user.history.entity";
import { UserNotificationsService } from "src/user/user.notifications/user.notifications.service";
import random from "common/functions/random";
import { MailerService } from "src/__service/mailer/mailer.service";
import CONFIG_USER from "common/configs/user.config";
import { RoleGetHighIndex } from "common/functions/roleGetHighIndex";

@Injectable()
export class ModerationUserService implements OnModuleInit {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,

        @InjectRepository(UserModerationHistoryEntity)
        private readonly userModerationHistoryRepository: Repository<UserModerationHistoryEntity>,

        private readonly moduleRef: ModuleRef
    ) {}

    private logsService: LogsService
    private userService: UserService
    private userNotificationsService: UserNotificationsService
    private mailerService: MailerService

    async onModuleInit() {
        this.logsService = this.moduleRef.get(LogsService, { strict: false })
        this.userService = this.moduleRef.get(UserService, { strict: false })
        this.userNotificationsService = this.moduleRef.get(UserNotificationsService, { strict: false })
        this.mailerService = this.moduleRef.get(MailerService, { strict: false })
    }

    // get
    async getList(
        name: string,
        id: number,

        pagination: { page: number, limit: number },

        res: Response,
        req: Request
    ) {
        if(!name && !id) {
            return templateResponse(res, "Fields do not be empty (name or id)", 400)
        }
        if(name && name.length < 3) {
            return templateResponse(res, "The minimum length of the 'name' is 3 characters", 400)
        }

        const users = await this.userRepository.find({
            where: !id ?
                { fullname: Like(`%${name}%`), _deleted: false } :
                { id, _deleted: false },
            select: [ 'id', 'name', 'email', 'avatar' ],

            skip: pagination && pagination.page && pagination.limit ? (pagination.page - 1) * pagination.limit : null,
            take: pagination && pagination.limit ? pagination.limit : null
        })
        templateResponse(res, users, 200)
    }

    async getInfo(
        id: number,

        res: Response,
        req: Request
    ) {
        if(!id) {
            return templateResponse(res, "Fields do not be empty (id)", 400)
        }

        let user = await this.userRepository
            .createQueryBuilder("user")
            .leftJoinAndSelect('user.roles', 'roles')
            .leftJoinAndSelect('user.__serviceStorageList', '__serviceStorageList')
            .loadRelationCountAndMap('user.viewsProductsCount', 'user.viewProducts')
            // .loadRelationCountAndMap('user.viewsProductsCount', 'user.viewProducts')
            .where("user._deleted = 0")
            .andWhere("user.id = :id", { id })
            .getOne()
        
        if(!user) {
            return templateResponse(res, "User with this 'id' not found", 404)
        }

        const productCounts = await this.userService.getProductsCounts(user.id)
        user = {...user, ...productCounts}

        const moderationHistory = await this.userModerationHistoryRepository.find({
            where: {
                user: {
                    id: user.id
                }
            },
            relations: {
                moderator: true
            },
            order: {
                createAt: 'desc'
            }
        })

        if(!RolePrivilegesVerify('/admin/*', req)) delete user.__serviceStorageList
        templateResponse(res, {
            user,
            moderationHistory
        }, 200)
    }


    // put
    async banUser(
        res: Response,
        req: Request,

        userid: number,
        expiresDate: Date,
        comment: string
    ) {
        if(!userid || !expiresDate || !comment || !comment.length) {
            return templateResponse(res, "Fields do not be empty (userid, expiresDate, comment)", 400)
        }

        if(isNaN(userid) || userid < 1) {
            return templateResponse(res, "Incorrect data [userid]", 400)
        }

        expiresDate = new Date(expiresDate)
        if(!isValidDate(expiresDate)) {
            return templateResponse(res, "Incorrect data [expiresDate]", 400)
        }
        if(+new Date(expiresDate) > (+new Date() + CONFIG_USER.maxExpiresDateForBan)) {
            return templateResponse(res, "'expiresDate' cannot be longer than 6 months", 400)
        }

        if(comment.length < 10 || comment.length > 512) {
            return templateResponse(res, "Incorrect data [comment]", 400)
        }

        const user = await this.userService.get(userid)
        if(!user) {
            return templateResponse(res, "User not found", 404)
        }

        if(RoleGetHighIndex(user.roles).index <= RoleGetHighIndex(req['user'].roles).index) {
            return templateResponse(res, "You cannot punish this user", 403)
        }

        if(user.banned) {
            user.banned = false
            user.bannedComment = null
            user.bannedExpires = null
            user.bannedModerator = null

            if(!await this.addModerationHistory(user, req['user'], 'unban', comment)) {
                return templateResponse(res, "Failed to create moderation history", 500)
            }

            this.userNotificationsService.send('accountUnBanned', user)
        }
        else {
            user.banned = true
            user.bannedComment = comment
            user.bannedExpires = expiresDate
            user.bannedModerator = req['user']

            if(!await this.addModerationHistory(user, req['user'], 'ban', comment, expiresDate)) {
                return templateResponse(res, "Failed to create moderation history", 500)
            }
            this.userNotificationsService.send('accountBanned', user)
        }

        await this.userRepository.update({ id: user.id }, {
            banned: user.banned,
            bannedComment: user.bannedComment,
            bannedExpires: user.bannedExpires,
            bannedModerator: user.bannedModerator
        })
        templateResponse(res, "", 200)
    }

    async reportBanUser(
        res: Response,
        req: Request,

        userid: number,
        expiresDate: Date,
        comment: string
    ) {
        if(!userid || !expiresDate || !comment || !comment.length) {
            return templateResponse(res, "Fields do not be empty (userid, expiresDate, comment)", 400)
        }

        if(isNaN(userid) || userid < 1) {
            return templateResponse(res, "Incorrect data [userid]", 400)
        }

        expiresDate = new Date(expiresDate)
        if(!isValidDate(expiresDate)) {
            return templateResponse(res, "Incorrect data [expiresDate]", 400)
        }
        if(+new Date(expiresDate) > (+new Date() + CONFIG_USER.maxExpiresDateForBan)) {
            return templateResponse(res, "'expiresDate' cannot be longer than 6 months", 400)
        }

        if(comment.length < 10 || comment.length > 512) {
            return templateResponse(res, "Incorrect data [comment]", 400)
        }

        const user = await this.userService.get(userid, { roles: true })
        if(!user) {
            return templateResponse(res, "User not found", 404)
        }

        if(RoleGetHighIndex(user.roles).index <= RoleGetHighIndex(req['user'].roles).index) {
            return templateResponse(res, "You cannot punish this user", 403)
        }

        if(user.reportBanned) {
            user.reportBanned = false
            user.reportBannedComment = null
            user.reportBannedExpires = null
            user.reportBannedModerator = null

            if(!await this.addModerationHistory(user, req['user'], 'unReportBan', comment)) {
                return templateResponse(res, "Failed to create moderation history", 500)
            }
            this.userNotificationsService.send('accountUnReportBanned', user)
        }
        else {
            user.reportBanned = true
            user.reportBannedComment = comment
            user.reportBannedExpires = expiresDate
            user.reportBannedModerator = req['user']

            if(!await this.addModerationHistory(user, req['user'], 'reportBan', comment, expiresDate)) {
                return templateResponse(res, "Failed to create moderation history", 500)
            }
            this.userNotificationsService.send('accountReportBanned', user)
        }

        await this.userRepository.update({ id: user.id }, {
            reportBanned: user.reportBanned,
            reportBannedComment: user.reportBannedComment,
            reportBannedExpires: user.reportBannedExpires,
            reportBannedModerator: user.reportBannedModerator
        })
        templateResponse(res, "", 200)
    }

    async warnUser(
        res: Response,
        req: Request,

        userid: number,
        comment: string
    ) {
        if(!userid || !comment || !comment.length) {
            return templateResponse(res, "Fields do not be empty (userid, expiresDate, comment)", 400)
        }

        if(isNaN(userid) || userid < 1) {
            return templateResponse(res, "Incorrect data [userid]", 400)
        }
        if(comment.length < 10 || comment.length > 512) {
            return templateResponse(res, "Incorrect data [comment]", 400)
        }

        const user = await this.userService.get(userid)
        if(!user) {
            return templateResponse(res, "User not found", 404)
        }

        if(RoleGetHighIndex(user.roles).index <= RoleGetHighIndex(req['user'].roles).index) {
            return templateResponse(res, "You cannot punish this user", 403)
        }

        if(!await this.addModerationHistory(user, req['user'], 'warn', comment)) {
            return templateResponse(res, "Failed to create moderation history", 500)
        }

        this.userNotificationsService.send('accountWarn', user, {
            text: comment
        })
        templateResponse(res, "", 200)
    }

    async sendEmailCode(
        res: Response,
        req: Request,

        userid: number
    ) {
        if(!userid) {
            return templateResponse(res, "Fields do not be empty (userid)", 400)
        }

        if(isNaN(userid) || userid < 1) {
            return templateResponse(res, "Incorrect data [userid]", 400)
        }

        const user = await this.userService.get(userid)
        if(!user) {
            return templateResponse(res, "User not found", 404)
        }

        if(!user.email) {
            return templateResponse(res, "The user does not have an email address", 400)
        }
        if(!user.emailVerify) {
            return templateResponse(res, "The user has not verify an email address", 400)
        }
        
        if(user.lastSendModerationEmailCode
            && +new Date(user.lastSendModerationEmailCode) + CONFIG_USER.coolDownToSendModerationEmailCode > +new Date()) {
            return templateResponse(res, "The code has already been sent recently", 400)
        }

        const randomCode = random.textNumber(6)

        if(!await this.addModerationHistory(user, req['user'], 'emailCodeVerify', randomCode)) {
            return templateResponse(res, "Failed to create moderation history", 500)
        }
        await this.mailerService.send('noreply', user.email, 'Verification code', `Please send this code to the moderator through the support system in your personal account: ${randomCode}`)
        await this.userRepository.update({ id: user.id }, { lastSendModerationEmailCode: new Date() })
        
        templateResponse(res, randomCode, 200)
    }



    async addModerationHistory(user: User, moderator: User, type: UserModerationHistoryType, comment: string, expiresDate: Date = null): Promise<number> {
        if(!user || !user.id || !moderator || !moderator.id || !type || !comment) {
            throw new Error("[Moderation.User.Service.addModerationHistory] Not all necessary parameters are specified")
        }

        const insert = await this.userModerationHistoryRepository.insert({
            user,
            moderator,
            type,
            comment,
            expiresDate
        })
        if(!insert) {
            throw new Error("[Moderation.User.Service.addModerationHistory] Failed to create history")
        }

        return insert.raw.insertId
    }
}