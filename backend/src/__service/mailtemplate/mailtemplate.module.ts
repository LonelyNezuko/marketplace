import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "src/user/user.entity";
import { MailTemplate } from "./mailtemplate.entity";
import { MailTemplateService } from "./mailtemplate.service";
import { UserSessions } from "src/user/user.sessions/user.sessions.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([ User, MailTemplate, UserSessions ])
    ],
    providers: [ MailTemplateService ]
})
export class MailTemplateModule {}