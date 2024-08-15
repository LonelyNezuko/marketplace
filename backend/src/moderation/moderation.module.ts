import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { User } from "src/user/user.entity";
import { ModerationController } from "./moderation.controller";
import { ModerationService } from "./moderation.service";
import { ModerationProductModule } from "./moderation.product/moderation.product.module";
import { ModerationUserModule } from "./moderation.user/moderation.user.module";
import { UserSessions } from "src/user/user.sessions/user.sessions.entity";
import { ModerationReportModule } from "./moderation.report/moderation.report.module";
import { ModerationGateway, ModerationSelectReportGateway, ModerationSelectSupportGateway } from "./moderation.gateway";
import { UserService } from "src/user/user.service";
import { GatewayGuard } from "common/guards/gatewayGuard";
import { ModerationReportEntity } from "./moderation.report/moderation.report.entity";
import { ModerationSupportModule } from "./moderation.support/moderation.support.module";
import { ModerationSupportEntity } from "./moderation.support/moderation.support.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([User, UserSessions, ModerationReportEntity, ModerationSupportEntity]),

        ModerationProductModule,
        ModerationUserModule,
        ModerationReportModule,
        ModerationSupportModule
    ],
    controllers: [ModerationController],
    providers: [ModerationService, GatewayGuard, ModerationGateway, ModerationSelectReportGateway, ModerationSelectSupportGateway]
})

export class ModerationModule {}
