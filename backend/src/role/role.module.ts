import { Module } from "@nestjs/common";
import { RoleController } from "./role.controller";
import { RoleService } from "./role.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "src/user/user.entity";
import { Role } from "./role.entity";
import { LogsModule } from "src/logs/logs.module";
import { LogsService } from "src/logs/logs.service";
import { UserSessions } from "src/user/user.sessions/user.sessions.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Role, UserSessions])
    ],
    controllers: [RoleController],
    providers: [RoleService]
})
export class RoleModule {}