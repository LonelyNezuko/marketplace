import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../user.entity";
import { UserSettingsController } from "./user.settings.controller";
import { UserSettingsService } from "./user.settings.service";
import { ConfigModule } from "@nestjs/config";
import { GatewayGuard } from "common/guards/gatewayGuard";
import { UserEmailVerifyCodes } from "../user.emailverify.entity";
import { UserGatewayClients } from "../user.gateway";
import { UserSessions } from "../user.sessions/user.sessions.entity";

const NODEENV: string = process.env.NODE_ENV
@Module({
    imports: [
        TypeOrmModule.forFeature([User, UserSessions, UserEmailVerifyCodes])
    ],
    controllers: [UserSettingsController],
    providers: [UserSettingsService, UserGatewayClients, GatewayGuard]
})
export class UserSettingsModule {}