import { Injectable, OnModuleInit } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { InjectRepository } from "@nestjs/typeorm";
import isValidJSON from "common/functions/isValidJSON";
import templateResponse from "common/templates/response.tp";
import { Request, Response } from "express";
import { Language } from "src/__service/language/language.entity";
import { LanguageService } from "src/__service/language/language.service";
import { MailTemplateTypes } from "src/__service/mailtemplate/mailtemplate.dto";
import { MailTemplate } from "src/__service/mailtemplate/mailtemplate.entity";
import { MailTemplateService } from "src/__service/mailtemplate/mailtemplate.service";
import { LogsService } from "src/logs/logs.service";
import { Repository } from "typeorm";

@Injectable()
export class AdminMailTemplateService implements OnModuleInit {
    constructor(
        @InjectRepository(MailTemplate)
        private readonly mailTemplateRepository: Repository<MailTemplate>,

        @InjectRepository(Language)
        private readonly languageRepository: Repository<Language>,

        private readonly moduleRef: ModuleRef
    ) {}


    private logsService: LogsService
    private mailTemplateService: MailTemplateService

    async onModuleInit() {
        this.logsService = this.moduleRef.get(LogsService, { strict: false })
        this.mailTemplateService = this.moduleRef.get(MailTemplateService, { strict: false })
    }


    // get
    async getMailtemplate(
        id: number,

        res: Response,
        req: Request
    ) {
        if(!id) {
            return templateResponse(res, "Fields should not be empty (id)", 400)
        }

        const template = await this.mailTemplateService.getTemplate(id)
        if(!template) {
            return templateResponse(res, "MailTemplate with this 'id' not found", 404)
        }

        templateResponse(res, template, 200)
    }

    async getMailtemplateList(
        languagecode: string,

        res: Response,
        req: Request
    ) {
        if(!languagecode) {
            return templateResponse(res, "Fields should not be empty (languagecode)", 400)
        }

        const list = await this.mailTemplateRepository.find({
            where: {
                language: { code: languagecode },
                _deleted: false
            },
            relations: {
                language: true,
                creator: true,
                updator: true
            }
        })
        list.map(item => {
            item.editorJSON = JSON.parse(item.editorJSON)
        })

        templateResponse(res, list, 200)
    }


    // post
    async createMailtemplate(
        type: MailTemplateTypes,
        languagecode: string,
        html: string,
        subject: string,
        editorJSON: any,

        res: Response,
        req: Request
    ) {
        if(!type || !languagecode || !html || !subject || !editorJSON) {
            return templateResponse(res, "Fields should not be empty (type, languagecode, html, subject, editorJSON)", 400)
        }
        if(!isValidJSON(editorJSON)) {
            return templateResponse(res, "Incorrect data [editorJSON]", 400)
        }

        if(!this.mailTemplateService.isRightType(type)) {
            return templateResponse(res, "Incorrect data [type]", 400)
        }
        if(languagecode.length !== 2) {
            return templateResponse(res, "Incorrect data [languagecode]", 400)
        }
        if(html.length < 12 || html.length > 24604) {
            return templateResponse(res, "Incorrect data [html]", 400)
        }
        if(subject.length < 4 || subject.length > 32) {
            return templateResponse(res, "Incorrect data [subject]", 400)
        }

        if(!this.mailTemplateService.checkFormatValues(html, type)) {
            return templateResponse(res, "Not all types are declared in 'html' for this 'type'", 400)
        }

        const language = await this.languageRepository.findOne({
            where: {
                code: languagecode
            }
        })
        if(!language) {
            return templateResponse(res, "Language with this 'languagecode' not found", 404)
        }

        const insert = await this.mailTemplateRepository.insert({
            type,
            language,
            html,
            editorJSON,
            subject,
            creator: req['user']
        })
        if(!insert) {
            return templateResponse(res, "Failed to create MailTemplate", 500)
        }

        const template = await this.mailTemplateService.getTemplate(insert.raw.insertId)
        if(!template) {
            return templateResponse(res, "Failed to create MailTemplate", 500)
        }

        this.logsService.create('user', `Создал mailTemplate #${insert.raw.insertId}`, {
            userData: req['user'],
            mailTemplateData: template
        })

        templateResponse(res, insert.raw.inserId, 200)
    }


    // put
    async updateMailtemplate(
        id: number,
        
        html: string,
        subject: string,

        editorJSON: any,

        res: Response,
        req: Request
    ) {
        if(!id || !html || !subject || !editorJSON) {
            return templateResponse(res, "Fields should not be empty (id, html, subject, editorJSON)", 400)
        }
        if(!isValidJSON(editorJSON)) {
            return templateResponse(res, "Incorrect data [editorJSON]", 400)
        }

        if(html.length < 12 || html.length > 24604) {
            return templateResponse(res, "Incorrect data [html]", 400)
        }
        if(subject.length < 4 || subject.length > 32) {
            return templateResponse(res, "Incorrect data [subject]", 400)
        }

        const template = await this.mailTemplateService.getTemplate(id)
        if(!template) {
            return templateResponse(res, "Mailtemplate with this 'id' not found", 404)
        }

        if(!this.mailTemplateService.checkFormatValues(html, template.type)) {
            return templateResponse(res, "Not all types are declared in 'html' for this 'type'", 400)
        }

        template.html = html
        template.subject = subject
        template.editorJSON = editorJSON

        template.updator = req['user']
        template.updateAt = new Date()

        await this.mailTemplateRepository.save(template)
        templateResponse(res, "", 200)
    }

    async updateActiveStatus(
        id: number,

        res: Response,
        req: Request
    ) {
        if(!id) {
            return templateResponse(res, "Fields should not be empty (id)", 400)
        }

        const template = await this.mailTemplateService.getTemplate(id)
        if(!template) {
            return templateResponse(res, "Mailtemplate with this 'id' not found", 404)
        }

        if(!template.active) {
            const findmatch = await this.mailTemplateRepository.findOne({
                where: {
                    language: { code: template.language.code },
                    type: template.type,
                    active: true
                }
            })
            if(findmatch) {
                return templateResponse(res, "The selected language already has an active mailTemplate of the same type", 406)
            }
        }

        template.active = !template.active

        template.editorJSON = JSON.stringify(template.editorJSON)

        template.updator = req['user']
        template.updateAt = new Date()

        await this.mailTemplateRepository.save(template)

        templateResponse(res, template.active, 200)
    }


    // delete
    async deleteMailtemplate(
        id: number,
        
        res: Response,
        req: Request
    ) {
        if(!id) {
            return templateResponse(res, "Fields should not be empty (id)", 400)
        }

        const template = await this.mailTemplateService.getTemplate(id)
        if(!template) {
            return templateResponse(res, "Mailtemplate with this 'id' not found", 404)
        }

        template._deleted = true

        template.editorJSON = JSON.stringify(template.editorJSON)

        await this.mailTemplateRepository.save(template)

        templateResponse(res, "", 200)
    }
}