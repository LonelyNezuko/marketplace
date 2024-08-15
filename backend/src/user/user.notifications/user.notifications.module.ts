import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../user.entity";
import { UserNotifications } from "./user.notifications.entity";
import { UserNotificationsController } from "./user.notifications.controller";
import { UserNotificationsService } from "./user.notifications.service";
import { Product } from "src/product/product.entity";
import { UserGatewayClients } from "../user.gateway";
import { UserSessions } from "../user.sessions/user.sessions.entity";
import { ModerationReportEntity } from "src/moderation/moderation.report/moderation.report.entity";
import { ModerationSupportEntity } from "src/moderation/moderation.support/moderation.support.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([ User, UserSessions, UserNotifications, Product, ModerationReportEntity, ModerationSupportEntity ])
    ],
    controllers: [ UserNotificationsController ],
    providers: [ UserNotificationsService, UserGatewayClients ]
})
export class UserNotificationsModule {}