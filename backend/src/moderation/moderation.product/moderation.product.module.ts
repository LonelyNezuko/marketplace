import { Module } from "@nestjs/common";
import { ModerationProductController } from "./moderation.product.controller";
import { ModerationProductSerivce } from "./moderation.product.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Product } from "src/product/product.entity";
import { User } from "src/user/user.entity";
import { UserSessions } from "src/user/user.sessions/user.sessions.entity";
import { ProductSnapshotEntity } from "src/product/product.snapshot.entity";
import { ProductModerationHistoryEntity } from "src/product/product.moderationHistory.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([Product, User, UserSessions, ProductSnapshotEntity, ProductModerationHistoryEntity])
    ],
    controllers: [ModerationProductController],
    providers: [ModerationProductSerivce]
})
export class ModerationProductModule {}