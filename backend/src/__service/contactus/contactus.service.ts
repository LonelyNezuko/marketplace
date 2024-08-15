import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ServiceContactUs } from "./contactus.entity";
import { Repository } from "typeorm";
import { Request, Response } from "express";
import templateResponse from "common/templates/response.tp";
import isValidEmail from "common/functions/isValidEmail";
import CONFIG_DEFAULT from "common/configs/default.config";
import { ModuleRef } from "@nestjs/core";
import { MailerService } from "../mailer/mailer.service";
import CONFIG_MAILER from "common/configs/mailer.config";

@Injectable()
export class ContactUsService implements OnModuleInit {
    constructor(
        @InjectRepository(ServiceContactUs)
        private readonly contactusRepository: Repository<ServiceContactUs>,

        private readonly moduleRef: ModuleRef
    ) {}

    private mailerService: MailerService
    async onModuleInit() {
        this.mailerService = await this.moduleRef.get(MailerService, { strict: false })
    }


    // get
    async send(
        name: string,
        email: string,
        topic: string,
        text: string,

        res: Response,
        req: Request
    ) {
        if(!name || !email || !topic || !text) {
            return templateResponse(res, "Fileds should do not empty (name, email, topic, text)", 400)
        }

        if(name.length < 2 || name.length > 32) {
            return templateResponse(res, "Incorrect data [name]", 400)
        }
        if(!isValidEmail(email)) {
            return templateResponse(res, "Incorrect data [email]", 400)
        }
        if(topic.length < 6 || topic.length > 24) {
            return templateResponse(res, "Incorrect data [topic]", 400)
        }
        if(text.length < 32 || text.length > 1024) {
            return templateResponse(res, "Incorrect data [text]", 400)
        }

        const result = await this.contactusRepository.findOne({
            where: {
                ip: req.ip,
                agent: req.headers["user-agent"]
            }
        })
        if(result) {
            if((+new Date(result.createAt) + CONFIG_DEFAULT.contactUsTimingToSend) > +new Date) {
                return templateResponse(res, "The time has not expired", 403)
            }
            else {
                await this.contactusRepository.delete({
                    ip: req.ip,
                    agent: req.headers['user-agent']
                })
            }
        }

        this.contactusRepository.insert({
            ip: req.ip,
            agent: req.headers["user-agent"]
        })
        
        await this.mailerService.send('noreply', CONFIG_MAILER.mailboxes.admin.auth.user, `An appeal from ${name}`, `An appeal from ${name}.\nEmail: ${email}.\n--------------------\n\n${text}`, null)
        templateResponse(res, "", 200)
    }
}