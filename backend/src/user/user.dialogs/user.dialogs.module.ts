import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "src/user/user.entity";
import { UserDialogs } from "./user.dialogs.entity";
import { UserDialogsMessages } from "./user.dialogs.messages.entity";
import { UserDialogsController } from "./user.dialogs.controller";
import { UserDialogsService } from "./user.dialogs.service";
import { GatewayGuard } from "common/guards/gatewayGuard";
import { UserGatewayClients } from "../user.gateway";
import { UserSessions } from "../user.sessions/user.sessions.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([User, UserSessions, UserDialogs, UserDialogsMessages]),
    ],
    controllers: [UserDialogsController],
    providers: [UserDialogsService, GatewayGuard, UserGatewayClients]
})
export class UserDialogsModule {}