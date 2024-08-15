import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User, UserGeolocation } from "../user.entity";
import { Not, Repository } from "typeorm";
import { LogsService } from "src/logs/logs.service";
import { ModuleRef } from "@nestjs/core";
import { Request, Response } from "express";
import templateResponse from "common/templates/response.tp";
import isValidPassword from "common/functions/isValidPassword";
import isValidJSON from "common/functions/isValidJSON";
import { UserService } from "../user.service";
import currencyList from "common/configs/currency.config";
import { MailerService } from "src/__service/mailer/mailer.service";
import { LanguageService } from "src/__service/language/language.service";
import CONFIG_MAILER from "common/configs/mailer.config";
import CONFIG_STORAGE from "common/configs/storage.config";
import { StorageService } from "src/__service/storage/storage.service";
import { MailTemplateService } from "src/__service/mailtemplate/mailtemplate.service";
import CONFIG_DEFAULT from "common/configs/default.config";
import { UserEmailVerifyCodes } from "../user.emailverify.entity";
import random from "common/functions/random";
import { Verifycodes } from "common/verifycodes/verifycodes";
import isValidEmail from "common/functions/isValidEmail";
import floatToInt from "common/functions/floatToInt";
import { UserUpdateDataDTO } from "./user.settings.dto";
import { UserGatewayClients } from "../user.gateway";
import { UserSigninService } from "../user.signin/user.signin.service";
const jwt = require('jsonwebtoken')

const bcryptjs = require('bcryptjs')

@Injectable()
export class UserSettingsService implements OnModuleInit {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        @InjectRepository(UserEmailVerifyCodes)
        private readonly userVerifyCodesRepository: Repository<UserEmailVerifyCodes>,

        private readonly moduleRef: ModuleRef,
        private readonly userGatewayClients: UserGatewayClients
    ) {}

    private logsService: LogsService
    private userService: UserService
    private mailerService: MailerService
    private languageService: LanguageService
    private storageService: StorageService
    private mailTemplateService: MailTemplateService

    private userSigninService: UserSigninService
    private verifycodes: Verifycodes

    async onModuleInit() {
        this.logsService = this.moduleRef.get(LogsService, { strict: false })
        this.userService = this.moduleRef.get(UserService, { strict: false })
        this.mailerService = this.moduleRef.get(MailerService, { strict: false })
        this.languageService = this.moduleRef.get(LanguageService, { strict: false })
        this.storageService = this.moduleRef.get(StorageService, { strict: false })
        this.mailTemplateService = this.moduleRef.get(MailTemplateService, { strict: false })

        this.userSigninService = this.moduleRef.get(UserSigninService, { strict: false })
        this.verifycodes = this.moduleRef.get(Verifycodes, { strict: false })
    }

    // get
    async getEmailVerify(
        req?: Request,
        res?: Response
    ) {
        const data: User = await this.userRepository.findOne({
            where: {
                id: req['user'].id
            },
            select: [ 'email', 'name', 'emailVerify', 'emailVerifyLastSend' ]
        })
        if(!data) {
            templateResponse(res, "User not found", 200)
            return
        }

        if(res) {
            delete data.email
            delete data.name
        }

        templateResponse(res, data, 200)
        return data
    }

    async emailVerify(
        hash: string,

        res: Response,
        req: Request
    ) {
        if(!hash) {
            return templateResponse(res, "Fields should not be empty (hash)", 400)
        }
        if(hash.length !== CONFIG_DEFAULT.emailVerifyHashLength) {
            return templateResponse(res, "Incorrect data [hash]", 400)
        }

        const result = await this.userVerifyCodesRepository.findOne({
            where: {
                hash,
                user: {
                    id: req['user'].id
                },
                type: 'email-verify'
            },
            relations: {
                user: true
            }
        })
        if(!result) {
            return templateResponse(res, "Hash not found", 404)
        }

        if(result.user.emailVerify) {
            await this.userVerifyCodesRepository.delete({
                user: { id: result.user.id }
            })

            return templateResponse(res, "The mail has already been confirmed", 400)
        }
        if(+new Date(parseInt(result.expires as any)) < +new Date) {
            this.userVerifyCodesRepository.delete({
                id: result.id
            })

            return templateResponse(res, "Hash expires out", 408)
        }

        await this.userVerifyCodesRepository.delete({
            user: { id: result.user.id }
        })
        await this.userRepository.update({
            id: req['user'].id
        }, { emailVerify: true })

        this.logsService.create('user', `Подтвердил почту. Email: ${result.user.email}`, {
            userData: result.user
        })

        await this.userGatewayClients.emit(result.user, "onEmailVerified")

        templateResponse(res, "", 200)
    }

    // post
    async sendEmailVerify(
        language: string,

        req: Request,
        res?: Response,
    ) {
        if(!language) {
            return templateResponse(res, "Fields should not be empty (language)", 400)
        }
        if(language.length !== 2) {
            return templateResponse(res, "Incorrect data [language]", 400)
        }

        if(!req['user'])return

        const emailVerifyData = await this.getEmailVerify(req)

        if(!emailVerifyData || !emailVerifyData.email || !emailVerifyData.name)return templateResponse(res, "User not found", 404)
        if(emailVerifyData.emailVerify)return templateResponse(res, "The user has already been verified", 400)
        if(emailVerifyData.emailVerifyLastSend + 300 > floatToInt(+new Date / 1000))return templateResponse(res, {
            error: "The user has recently been sent a request",
            time: emailVerifyData.emailVerifyLastSend
        }, 400)

        let mailTemplate = await this.mailTemplateService.getTemplate(null, 'email-verify-code', language, false, true)
        if(!mailTemplate) mailTemplate = await this.mailTemplateService.getTemplate(null, 'email-verify-code', 'en', false, true)

        if(!mailTemplate) {
            return templateResponse(res, "The email could not be sent", 500)
        }

        const hash = random.textNumber(CONFIG_DEFAULT.emailVerifyHashLength)
        const generatedLink: string = CONFIG_DEFAULT.mainSiteLink + '/email-verify/' + hash

        const insert = await this.userVerifyCodesRepository.insert({
            user: req['user'],
            type: 'email-verify',
            hash,
            expires: +new Date + CONFIG_DEFAULT.emailVerifyHashExpiresTime
        })
        if(!insert) {
            return templateResponse(res, "The email could not be sent", 500)
        }

        const html = await this.mailTemplateService.format(mailTemplate, {
            'username': req['user'].name[0] + ' ' + req['user'].name[1],
            'companyname': CONFIG_DEFAULT.companyName,
            'servicename': CONFIG_DEFAULT.serviceName,
            'link': generatedLink
        })

        await this.mailerService.send('noreply', emailVerifyData.email, mailTemplate.subject, null, html)
        await this.userRepository.update({ id: req['user'].id }, { emailVerifyLastSend: floatToInt(+new Date / 1000) })

        templateResponse(res, "", 200)
    }

    // put
    async changePassword(
        oldpassword: string,
        newpassword: string,

        res: Response,
        req: Request
    ) {
        if(!oldpassword || !newpassword) {
            templateResponse(res, "Fields should not be empty (oldpassword, newpassword)", 400)
            return
        }

        if(!isValidPassword(oldpassword)) {
            templateResponse(res, "Invalid data [oldpassword]", 400)
            return
        }
        if(!isValidPassword(newpassword)) {
            templateResponse(res, "Invalid data [newpassword]", 400)
            return
        }
        if(oldpassword === newpassword) {
            templateResponse(res, "[oldpassword] cannot be the same as [newpassword]", 400)
            return
        }

        if(!bcryptjs.compareSync(oldpassword, req['user'].password)) {
            templateResponse(res, "The old password is not correct", 400)
            return
        }
        if(bcryptjs.compareSync(newpassword, req['user'].password)) {
            templateResponse(res, "The new password is similar to the old one", 400)
            return
        }

        const salt = bcryptjs.genSaltSync(15)
        const hash = bcryptjs.hashSync(newpassword, salt)

        await this.userRepository.update({ id: req['user'].id }, { password: hash, lastChangePassword: new Date() })
        const tokens = await this.userSigninService.generateJWTTokens(req['user'].id, req['user'].email, '7d', {
            userAgent: req.headers['user-agent'],
            userIp: req.ip,
            platform: 'site'
        })
        
        templateResponse(res, tokens, 200)
    }

    async changeAvatar(
        res: Response,
        req: Request,

        image: string,
        size: any,
        position: any // json x, y
    ) {
        if(!image || !size || !position) {
            return templateResponse(res, "Fields should not be empty (image, size, position)", 400)
        }
        size = parseInt(size)

        if(!image.length) {
            return templateResponse(res, "Incorrect data [image]", 400)
        }
        if(isNaN(size) || size < 50 || size > 200) {
            return templateResponse(res, "Incorrect data [size]", 400)
        }
        if(!position.x || !position.y) {
            return templateResponse(res, "Incorrect data [position]", 400)
        }

        const user: User = await this.userService.get(req['user'].id)
        if(!user) {
            return templateResponse(res, "User not found", 404)
        }

        if(user.avatar.image !== image
            && user.avatar.image !== '/assets/avatars/default.png') {
            let fileKey = user.avatar.image.replace(/(?:http|https):\/\/[\s\S]+\/defaultapi\/service\/storage\//gm, "")
            if(fileKey.length !== CONFIG_STORAGE.fileKeyLength) fileKey = fileKey.slice(0, CONFIG_STORAGE.fileKeyLength)

            this.storageService.deleteFile(fileKey, null, null, null, true)
        }

        user.avatar = {
            image,
            size,
            position
        }

        await this.userRepository.save(user)
        await this.userGatewayClients.emit(user, "onUpdateAvatar", user.avatar)

        templateResponse(res, user.avatar, 200)
    }

    async changeEmail(
        newemail: string,
        language: string,

        res: Response,
        req: Request
    ) {
        if(!newemail || !language) {
            return templateResponse(res, "Fields should do not empty (newemail, language)", 400)
        }

        if(!isValidEmail(newemail)) {
            return templateResponse(res, "Incorrect data [newemail]", 400)
        }
        if(language.length !== 2) {
            return templateResponse(res, "Incorrrect data [language]", 400)
        }

        if(!req['user']) {
            return templateResponse(res, "", 401)
        }

        const user = await this.userService.get(req['user'].id)
        if(!user) {
            return templateResponse(res, "User not found", 404)
        }

        if(user.changeEmailVerifyLastSend + 300 > floatToInt(+new Date / 1000))return templateResponse(res, {
            error: "The user has recently been sent a request",
            time: user.changeEmailVerifyLastSend
        }, 400)

        if(user.email === newemail) {
            return templateResponse(res, "The new mail should not be identical to the old one", 400)
        }
        if(!user.emailVerify) {
            return templateResponse(res, "The account has not been verified by mail", 403)
        }

        const matchCount = await this.userRepository.count({
            where: {
                email: newemail,
                id: Not(user.id)
            }
        })
        if(matchCount > 0) {
            return templateResponse(res, "The email is already busy", 400)
        }

        let mailTemplate = await this.mailTemplateService.getTemplate(null, 'change-email-verify', language, false, true)
        if(!mailTemplate) mailTemplate = await this.mailTemplateService.getTemplate(null, 'change-email-verify', 'en', false, true)

        if(!mailTemplate) {
            return templateResponse(res, "The email could not be sent", 500)
        }

        const hash = random.textNumber(CONFIG_DEFAULT.emailVerifyHashLength)
        const generatedLink: string = CONFIG_DEFAULT.mainSiteLink + '/change-email-verify/' + hash

        const insert = await this.userVerifyCodesRepository.insert({
            user,
            type: 'change-email-verify',
            hash,
            expires: +new Date + CONFIG_DEFAULT.emailVerifyHashExpiresTime
        })
        if(!insert) {
            return templateResponse(res, "The email could not be sent", 500)
        }

        const html = await this.mailTemplateService.format(mailTemplate, {
            'username': user.name[0] + ' ' + user.name[1],
            'companyname': CONFIG_DEFAULT.companyName,
            'servicename': CONFIG_DEFAULT.serviceName,
            'link': generatedLink
        })

        await this.mailerService.send('noreply', newemail, mailTemplate.subject, null, html)
        await this.userRepository.update({ id: user.id }, { changeEmailVerifyLastSend: floatToInt(+new Date / 1000), changeEmailNew: newemail })

        templateResponse(res, "", 200)
    }
    async changeEmailVerify(
        hash: string,

        res: Response,
        req: Request
    ) {
        if(!hash) {
            return templateResponse(res, "Fields should not be empty (hash)", 400)
        }
        if(hash.length !== CONFIG_DEFAULT.emailVerifyHashLength) {
            return templateResponse(res, "Incorrect data [hash]", 400)
        }

        const result = await this.userVerifyCodesRepository.findOne({
            where: {
                hash,
                user: {
                    id: req['user'].id
                },
                type: 'change-email-verify'
            },
            relations: {
                user: true
            }
        })
        if(!result) {
            return templateResponse(res, "Hash not found", 404)
        }

        if(!result.user.changeEmailNew) {
            await this.userVerifyCodesRepository.delete({
                user: { id: result.user.id }
            })

            return templateResponse(res, "The user did not request a mail change", 400)
        }

        if(!result.user.emailVerify) {
            await this.userVerifyCodesRepository.delete({
                user: { id: result.user.id }
            })

            await this.userRepository.update({
                id: req['user'].id
            }, { changeEmailNew: null, changeEmailVerifyLastSend: 0 })

            return templateResponse(res, "The account has not been verified by mail", 403)
        }

        if(+new Date(parseInt(result.expires as any)) < +new Date) {
            this.userVerifyCodesRepository.delete({
                id: result.id
            })

            await this.userRepository.update({
                id: req['user'].id
            }, { changeEmailNew: null, changeEmailVerifyLastSend: 0 })

            return templateResponse(res, "Hash expires out", 408)
        }

        await this.userVerifyCodesRepository.delete({
            user: { id: result.user.id }
        })
        await this.userRepository.update({
            id: req['user'].id
        }, { email: result.user.changeEmailNew, changeEmailNew: null, changeEmailVerifyLastSend: 0 })

        this.logsService.create('user', `Изменил почту. Старый Email: ${result.user.email}. Новый Email: ${result.user.changeEmailNew}`, {
            userData: result.user
        })
        templateResponse(res, "", 200)
    }

    async update(
        data: UserUpdateDataDTO,

        req: Request,
        res: Response
    ) {
        if(!data || !isValidJSON(data as any)) {
            return templateResponse(res, "Fields should not be empty (data)", 400)
        }
        data = JSON.parse(data as any)

        const user: User = await this.userService.get(req['user'].id)
        let isChange: boolean = false

        if(!user) {
            return templateResponse(res, "User not found", 404)
        }

        // main
        if(data.signatureProfileText) {
            if(data.signatureProfileText.length > 24) {
                return templateResponse(res, "Incorrect data [data.signatureProfileText]", 400)
            }

            user.signatureProfileText = data.signatureProfileText
            isChange = true
        }
        if(data.name) {
            const names = data.name.split(' ')
            if(names.length > 2 || !names.length) {
                return templateResponse(res, "Incorrect data [data.name]", 400)
            }

            user.name[0] = names[0]
            user.name[1] = names[1] || ''

            isChange = true
        }
        if(data.gender) {
            data.gender = parseInt(data.gender as any)
            if(isNaN(data.gender)
                || data.gender < -1 || data.gender > 1) {
                return templateResponse(res, "Incorrect data [data.gender]", 400)
            }

            user.gender = data.gender
            isChange = true
        }
        if(data.birthDate) {
            data.birthDate = parseInt(data.birthDate as any)
            if(isNaN(data.birthDate)) {
                return templateResponse(res, "Incorrect data [data.birthDate]", 400)
            }

            if(data.birthDate !== 0) {
                if(!new Date(data.birthDate)
                    || +new Date(data.birthDate) < +new Date('01.01.1900')
                    || +new Date(data.birthDate) > +new Date('01.01.2020')) {
                    return templateResponse(res, "Incorrect data [data.birthDate]", 400)
                }
            }

            user.birthDate = `${+new Date(data.birthDate)}`
            isChange = true
        }

        // privacy
        if(data.privacySettings) {
            if(!data.privacySettings.showBirthDate
                || !data.privacySettings.showGender
                || !data.privacySettings.showCity
                || !data.privacySettings.canCall) {
                return templateResponse(res, "Incorrect data [data.privacySettings]", 400)
            }

            user.privacySettings = data.privacySettings
            isChange = true
        }

        // security
        if(data.securitySettings) {
            if(!data.securitySettings.signinEmailVerify) {
                return templateResponse(res, "Incorrect data [data.securitySettings]", 400)
            }

            user.securitySettings = data.securitySettings
            isChange = true
        }

        // notifications
        if(data.notifySettings) {
            if(data.notifySettings.notifyOnEmail === undefined
                || data.notifySettings.showOnSite === undefined
                || data.notifySettings.soundNotify === undefined) {
                return templateResponse(res, "Incorrect data [data.notifySettings]", 400)
            }
            if(!user.notifySettings.showOnSite) data.notifySettings.soundNotify = false

            user.notifySettings = data.notifySettings
            isChange = true
        }

        if(data.notifySettingsParams) {
            if(data.notifySettingsParams.changeProducts === undefined
                || data.notifySettingsParams.dialogs === undefined
                || data.notifySettingsParams.raiting === undefined
                || data.notifySettingsParams.reactions === undefined
                || data.notifySettingsParams.support === undefined
                || data.notifySettingsParams.report === undefined) {
                return templateResponse(res, "Incorrect data [data.notifySettingsParams]", 400)
            }

            user.notifySettingsParams = data.notifySettingsParams
            isChange = true
        }

        if(isChange) {
            await this.userRepository.save(user)

            if(data.name) {
                await this.userGatewayClients.emit(user, "onUpdateName", user.name)
            }
            return templateResponse(res, '', 200)
        }
        
        return templateResponse(res, 'Nothing is saved', 400)
    }


    async setGeolocation(
        geolocation: UserGeolocation,

        res: Response,
        req: Request
    ) {
        if(!geolocation) {
            return templateResponse(res, "Fields should not be empty (geolocation)", 400)
        }

        if(!geolocation.city
            || !geolocation.cityUniqueID
            || !geolocation.country
            || !geolocation.lat
            || !geolocation.lng) {
            return templateResponse(res, "Invalid data [geolocation]", 400)
        }

        req['user'].geolocation = geolocation
        await this.userRepository.save(req['user'])

        templateResponse(res, "", 200)
    }


    async setCurrency(
        currency: string,
        
        res: Response,
        req: Request
    ) {
        if(!currency || !currency.length) {
            return templateResponse(res, "Fields should not be empty (currency)", 400)
        }
        if(!currencyList.find(item => item.code === currency)) {
            return templateResponse(res, "Incorrect data [currency]", 400)
        }

        this.userRepository.update({ id: req['user'].id }, { currency })
        templateResponse(res, "", 200)
    }
}