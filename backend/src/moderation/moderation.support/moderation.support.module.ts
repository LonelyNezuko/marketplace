import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "src/user/user.entity";
import { UserSessions } from "src/user/user.sessions/user.sessions.entity";
import { ModerationGatewayClients } from "../moderation.gateway";
import { UserGatewayClients } from "src/user/user.gateway";
import { ModerationSupportController } from "./moderation.support.controller";
import { ModerationSupportService } from "./moderation.support.service";
import { ModerationSupportEntity, ModerationSupportMessageEntity } from "./moderation.support.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([ User, UserSessions, ModerationSupportEntity, ModerationSupportMessageEntity ])
    ],
    controllers: [ ModerationSupportController ],
    providers: [ ModerationSupportService, ModerationGatewayClients, UserGatewayClients ]
})
export class ModerationSupportModule {}