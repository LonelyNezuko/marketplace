import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "src/user/user.entity";
import { ProductController } from "./product.controller";
import { ProductService } from "./product.service";
import { Product } from "./product.entity";
import { ProductUnauthViews } from "./product.unauthviews.entity";
import { UserSessions } from "src/user/user.sessions/user.sessions.entity";
import { ProductModerationHistoryEntity } from "./product.moderationHistory.entity";
import { ProductSnapshotEntity } from "./product.snapshot.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([User, UserSessions, Product, ProductUnauthViews, ProductModerationHistoryEntity, ProductSnapshotEntity])
    ],
    controllers: [ProductController],
    providers: [ProductService]
})
export class ProductModule {}