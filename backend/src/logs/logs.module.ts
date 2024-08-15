import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Logs } from "./logs.entity";
import { LogsService } from "./logs.service";
import { User } from "src/user/user.entity";
import { Role } from "src/role/role.entity";
import { Category } from "src/category/category.entity";
import { Product } from "src/product/product.entity";
import { Language } from "src/__service/language/language.entity";
import { Storage } from "src/__service/storage/storage.entity";
import { MailTemplate } from "src/__service/mailtemplate/mailtemplate.entity";
import { UserSessions } from "src/user/user.sessions/user.sessions.entity";
import { ModerationReportEntity } from "src/moderation/moderation.report/moderation.report.entity";
import { ModerationSupportEntity } from "src/moderation/moderation.support/moderation.support.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([Logs, User, UserSessions, Role, Category, Product, Language, Storage, MailTemplate, ModerationReportEntity, ModerationSupportEntity])
    ],
    providers: [LogsService]
})
export class LogsModule {}