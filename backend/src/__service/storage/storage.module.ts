import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "src/user/user.entity";
import { Storage } from "./storage.entity";
import { StorageController } from "./storage.controller";
import { StorageService } from "./storage.service";
import { StorageFileManager } from "./storage.filemanager";
import { UserSessions } from "src/user/user.sessions/user.sessions.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([ User, Storage, UserSessions ])
    ],
    controllers: [ StorageController ],
    providers: [ StorageService, StorageFileManager ]
})
export class StorageModule {}