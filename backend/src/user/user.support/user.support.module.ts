import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../user.entity";
import { UserSessions } from "../user.sessions/user.sessions.entity";
import { Product } from "src/product/product.entity";
import { Logs } from "src/logs/logs.entity";
import { UserGatewayClients } from "../user.gateway";
import { ModerationGatewayClients } from "src/moderation/moderation.gateway";
import { UserSupportController } from "./user.support.controller";
import { UserSupportService } from "./user.support.service";
import { ModerationSupportEntity, ModerationSupportMessageEntity } from "src/moderation/moderation.support/moderation.support.entity";
import { ModerationSupportService } from "src/moderation/moderation.support/moderation.support.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([ User, UserSessions, ModerationSupportEntity, ModerationSupportMessageEntity, Product, Logs ])
    ],
    controllers: [ UserSupportController ],
    providers: [ UserSupportService, UserGatewayClients, ModerationGatewayClients, ModerationSupportService ]
})
export class UserSupportModule {}