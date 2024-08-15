import { Injectable } from "@nestjs/common";
import CONFIG_MAILER, { CONFIG_MAILER_BOXNAMES } from "common/configs/mailer.config";
import nodemailer from 'nodemailer'
import SMTPTransport from "nodemailer/lib/smtp-transport";

@Injectable()
export class MailerService {
    private readonly transports: Record<string, nodemailer.Transporter<SMTPTransport.SentMessageInfo>> = {}

    constructor() {
        for(var boxname in CONFIG_MAILER.mailboxes) {
            this.transports[boxname] = nodemailer.createTransport(CONFIG_MAILER.mailboxes[boxname])
            console.log(`[Service.Mailer] Create ${boxname} transport`)
        }
    }

    async send(boxname: CONFIG_MAILER_BOXNAMES, to: string, subject: string, text?: string, html?: string, from?: string): Promise<SMTPTransport.SentMessageInfo> {
        if(!to) throw Error("[Service.Mailer.Send] The 'to' parameter is not specified")
        if(!subject) throw Error("[Service.Mailer.Send] The 'subject' parameter is not specified")
        if(!boxname) throw Error("[Service.Mailer.Send] The 'subject' parameter is not specified")
        if(!text && !html) throw Error('[Service.Mailer.Send] It must be either text or html')

        if(!this.transports[boxname]) throw Error(`[Service.Mailer.Send] No transport with the name '${boxname}' was found`)

        if(!from) {
            from = CONFIG_MAILER.mailboxes[boxname].auth.user
            if(CONFIG_MAILER.mailboxes[boxname]._host && CONFIG_MAILER.mailboxes[boxname]._host.from) from = CONFIG_MAILER.mailboxes[boxname]._host.from
        }

        return await this.transports[boxname].sendMail({
            from,
            to,
            subject,
            text,
            html
        })
    }
}