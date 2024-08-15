import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { VerifyCode } from "./verifycodes.entity";
import { Repository } from "typeorm";
import { Verifycodes } from "common/verifycodes/verifycodes";
import { Request, Response } from "express";
import templateResponse from "common/templates/response.tp";
import random from "common/functions/random";
import { User } from "src/user/user.entity";
import { ModuleRef } from "@nestjs/core";
import { UserService } from "src/user/user.service";
import { MailerService } from "../mailer/mailer.service";
import { MailTemplateService } from "../mailtemplate/mailtemplate.service";
import CONFIG_DEFAULT from "common/configs/default.config";

@Injectable()
export class VerifyCodesService implements OnModuleInit {
    constructor(
        @InjectRepository(VerifyCode)
        private readonly verifycodeRepository: Repository<VerifyCode>,

        private readonly verifycodes: Verifycodes,
        private readonly moduleRef: ModuleRef
    ) {}

    private userService: UserService
    private mailerService: MailerService
    private mailTemplateService: MailTemplateService

    async onModuleInit() {
        this.userService = await this.moduleRef.get(UserService, { strict: false })
        this.mailerService = await this.moduleRef.get(MailerService, { strict: false })
        this.mailTemplateService = await this.moduleRef.get(MailTemplateService, { strict: false })
    }

    // get
    async verify(
        code: string,
        forid: string,

        user?: User,

        res?: Response,
        req?: Request
    ): Promise<string> {
        if(!code || !forid) {
            templateResponse(res, "Fields should not be empty (code, forid)", 400)
            return 'Fields should not be empty (code, forid)'
        }

        if(!user && !req) {
            return 'Fields should not be empty (user or req)'
        }

        const search = await this.verifycodeRepository.findOne({
            relations: {
                user: true
            },
            where: {
                user: {
                    id: user ? user.id : req['user'].id
                },
                forID: forid,
                code
            }
        })
        if(!search) {
            templateResponse(res, "The code is incorrect", 406)
            return 'The code is incorrect'
        }
        if(search.expires < new Date()) {
            this.verifycodeRepository.delete({ id: search.id })

            templateResponse(res, "The code's lifetime has expired", 406)
            return "The code's lifetime has expired"
        }

        this.verifycodeRepository.delete({ id: search.id })
        const generateJWT = this.verifycodes.generate(forid, +new Date + 86400000, 20)

        templateResponse(res, generateJWT, 200)
        return generateJWT
    }

    // post
    async create(
        privilege: string,

        userid: number,
        language: string,

        length: number,

        res?: Response,
        req?: Request
    ): Promise<boolean | string> {
        if(!privilege || !userid || isNaN(userid) || !language || language.length !== 2) {
            templateResponse(res, "Fields should not be empty (privilege, language, length)", 400)
            return 'Fields should not be empty (privilege, language, length)'
        }
        const code: string = random.textNumber(length || CONFIG_DEFAULT.verifycodesDefaultCodeLength)

        const user = await this.userService.get(userid)
        if(!user) {
            templateResponse(res, "User with this 'user' not found", 404)
            return "User with this 'user' not found"
        }

        if(!user.email
            || !user.emailVerify) {
            templateResponse(res, "The user has no mail, or it has not been verified", 400)
            return "The user has no mail, or it has not been verified"
        }

        const search = await this.verifycodeRepository.findOne({
            relations: {
                user: true
            },
            where: {
                user: {
                    id: user.id
                },
                forID: privilege
            }
        })
        if(search) {
            if(search.expires < new Date()) await this.verifycodeRepository.delete({ id: search.id })
            else {
                templateResponse(res, "The code has already been sent", 200)
                return "The code has already been sent"
            }
        }

        const insert = await this.verifycodeRepository.insert({
            user: user,
            forID: privilege,
            code,
            expires: new Date(+new Date + 1800000)
        })
        if(!insert) {
            templateResponse(res, "Couldn't create the code", 500)
            return "Couldn't create the code"
        }

        let mailTemplate = await this.mailTemplateService.getTemplate(null, 'email-code', language, false, true)
        if(!mailTemplate) mailTemplate = await this.mailTemplateService.getTemplate(null, 'email-code', 'en', false, true)

        if(!mailTemplate) {
            templateResponse(res, "The code has already been sent", 500)
            return "The code has already been sent"
        }

        const html = await this.mailTemplateService.format(mailTemplate, {
            'username': user.name[0] + ' ' + user.name[1],
            'companyname': CONFIG_DEFAULT.companyName,
            'servicename': CONFIG_DEFAULT.serviceName,
            'code6length': code
        })
        
        await this.mailerService.send('noreply', user.email, mailTemplate.subject, null, html)
        templateResponse(res, "", 200)

        return true
    }


    // delete
    async delete(
        userid: number,
        privilege: string
    ): Promise<boolean> {
        if(!userid || !privilege) {
            throw new Error("[Service.VerifyCodes.delete] Fields should not be empty (privilege, userid)")
        }

        const search = await this.verifycodeRepository.findOne({
            relations: {
                user: true
            },
            where: {
                user: {
                    id: userid
                },
                forID: privilege
            }
        })
        if(!search)return false

        await this.verifycodeRepository.delete({ id: search.id })
        return true
    }
}