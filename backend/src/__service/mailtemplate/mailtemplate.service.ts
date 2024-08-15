import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { MailTemplate } from "./mailtemplate.entity";
import { Repository } from "typeorm";
import { MailTemplateFormatValues, MailTemplateTypes } from "./mailtemplate.dto";
import CONFIG_MAILTEMPLATE from "common/configs/mailtemplate.config";

@Injectable()
export class MailTemplateService {
    constructor(
        @InjectRepository(MailTemplate)
        private readonly mailTemplateRepository: Repository<MailTemplate>
    ) {}


    async getTemplate(
        id?: number,

        type?: MailTemplateTypes,
        languagecode?: string,

        _deleted: boolean = false,
        active?: boolean
    ): Promise<MailTemplate> {
        if(!id && !type && !languagecode) throw new Error("[Service.MailTemplate.getTemplate] No arguments are specified")
        if(languagecode && languagecode.length !== 2) throw new Error("[Service.MailTemplate.getTemplate] The 'languagecode' is specified incorrectly")
        if(type && !this.isRightType(type)) throw new Error("[Service.MailTemplate.getTemplate] The 'type' is specified incorrectly")

        const mailtemplate = await this.mailTemplateRepository.findOne({
            where: id ?
                { id, _deleted, active }
                : { type, language: { code: languagecode }, _deleted, active }
            ,
            relations: {
                language: true,
                creator: true,
                updator: true
            }
        })

        if(mailtemplate) mailtemplate.editorJSON = JSON.parse(mailtemplate.editorJSON)
        return mailtemplate
    }


    isRightType(type: MailTemplateTypes) {
        return type === 'email-verify-code' || type === 'email-code' || type === 'change-email-verify' || type === 'notification'
    }


    checkFormatValues(html: string, type: MailTemplateTypes): boolean {
        if(!html || !type) throw new Error("[Service.MailTemplate.checkFormatValues] No arguments are specified")
        if(!this.isRightType(type)) throw new Error("[Service.MailTemplate.checkFormatValues] No arguments are specified")

        let status: boolean = true
        CONFIG_MAILTEMPLATE.mailTemplateTypesFormatValues[type].map(key => {
            if(html.indexOf(`{${key}}`) === -1) status = false
        })

        if(!status)return false
        return true
    }

    async format(
        mailTemplate: MailTemplate,
        attrs: {
            [K in MailTemplateFormatValues]?: any
        }
    ): Promise<string> {
        if(!mailTemplate || !attrs) throw new Error("[Service.MailTemplate.format] No arguments are specified")
        if(!mailTemplate.html) throw new Error("[Service.MailTemplate.format] 'html' is not specified in the 'mailTemplate'")

        try {
            if(JSON.stringify(attrs) === '{}') throw new Error("[Service.MailTemplate.format] 'attrs' is empty")
        }
        catch(e) {
            throw new Error("[Service.MailTemplate.format] The 'attrs' is specified incorrectly")
        }

        let htmlFormated = mailTemplate.html
        for(const key in attrs) {
            htmlFormated = htmlFormated.replaceAll(`{${key}}`, attrs[key])
        }
        return htmlFormated
    }
}