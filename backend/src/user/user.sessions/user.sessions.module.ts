import { Module } from "@nestjs/common";
import { UserSessionsController } from "./user.sessions.controller";
import { UserSessionsService } from "./user.sessions.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../user.entity";
import { UserSessions } from "./user.sessions.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([User, UserSessions]),
    ],
    controllers: [UserSessionsController],
    providers: [UserSessionsService]
})
export class UserSessionsModule {}