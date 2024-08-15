import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "src/user/user.entity";
import { ModerationReportEntity, ModerationReportMessageEntity } from "./moderation.report.entity";
import { ModerationReportController } from "./moderation.report.controller";
import { ModerationReportService } from "./moderation.report.service";
import { UserSessions } from "src/user/user.sessions/user.sessions.entity";
import { ModerationGatewayClients } from "../moderation.gateway";
import { UserGatewayClients } from "src/user/user.gateway";

@Module({
    imports: [
        TypeOrmModule.forFeature([ User, UserSessions, ModerationReportEntity, ModerationReportMessageEntity ])
    ],
    controllers: [ ModerationReportController ],
    providers: [ ModerationReportService, ModerationGatewayClients, UserGatewayClients ]
})
export class ModerationReportModule {}