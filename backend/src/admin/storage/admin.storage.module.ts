import { Module } from "@nestjs/common";
import { User } from "src/user/user.entity";
import { AdminStorageController } from "./admin.storage.controller";
import { AdminStorageService } from "./admin.storage.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Logs } from "src/logs/logs.entity";
import { Storage } from "src/__service/storage/storage.entity";
import { UserSessions } from "src/user/user.sessions/user.sessions.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Storage, Logs, UserSessions])
    ],
    controllers: [AdminStorageController],
    providers: [AdminStorageService]
})
export class AdminStorageModule {}