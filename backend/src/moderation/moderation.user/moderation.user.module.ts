import { Module } from "@nestjs/common";
import { ModerationUserController } from "./moderation.user.controller";
import { ModerationUserService } from "./moderation.user.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "src/user/user.entity";
import { Product } from "src/product/product.entity";
import { UserSessions } from "src/user/user.sessions/user.sessions.entity";
import { UserModerationHistoryEntity } from "./moderation.user.history.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Product, UserSessions, UserModerationHistoryEntity])
    ],
    controllers: [ModerationUserController],
    providers: [ModerationUserService]
})
export class ModerationUserModule {}