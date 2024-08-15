import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Language } from "./language.entity";
import { LanguageController } from "./language.controller";
import { LanguageService } from "./language.service";
import { Logs } from "src/logs/logs.entity";
import { User } from "src/user/user.entity";
import { UserSessions } from "src/user/user.sessions/user.sessions.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([Language, User, UserSessions])
    ],
    controllers: [LanguageController],
    providers: [LanguageService]
})
export class LanguageModule {}