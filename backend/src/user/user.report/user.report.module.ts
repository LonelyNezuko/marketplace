import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../user.entity";
import { UserSessions } from "../user.sessions/user.sessions.entity";
import { ModerationReportEntity, ModerationReportMessageEntity } from "src/moderation/moderation.report/moderation.report.entity";
import { UserReportController } from "./user.report.controller";
import { UserReportService } from "./user.report.service";
import { Product } from "src/product/product.entity";
import { Logs } from "src/logs/logs.entity";
import { UserGatewayClients } from "../user.gateway";
import { ModerationGatewayClients } from "src/moderation/moderation.gateway";

@Module({
    imports: [
        TypeOrmModule.forFeature([ User, UserSessions, ModerationReportEntity, ModerationReportMessageEntity, Product, Logs ])
    ],
    controllers: [ UserReportController ],
    providers: [ UserReportService, UserGatewayClients, ModerationGatewayClients ]
})
export class UserReportModule {}