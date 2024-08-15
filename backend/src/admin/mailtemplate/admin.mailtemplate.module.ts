import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MailTemplate } from "src/__service/mailtemplate/mailtemplate.entity";
import { User } from "src/user/user.entity";
import { AdminMailTemplateController } from "./admin.mailtemplate.controller";
import { AdminMailTemplateService } from "./admin.mailtemplate.service";
import { Language } from "src/__service/language/language.entity";
import { UserSessions } from "src/user/user.sessions/user.sessions.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([ User, MailTemplate, Language, UserSessions ])
    ],
    controllers: [ AdminMailTemplateController ],
    providers: [ AdminMailTemplateService ]
})
export class AdminMailTemplateModule {}