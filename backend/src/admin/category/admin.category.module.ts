import { Module } from "@nestjs/common";
import { AdminCategoryController } from "./admin.category.controller";
import { AdminCategoryService } from "./admin.category.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Category } from "src/category/category.entity";
import { User } from "src/user/user.entity";
import { UserSessions } from "src/user/user.sessions/user.sessions.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([Category, User, UserSessions])
    ],
    controllers: [AdminCategoryController],
    providers: [AdminCategoryService]
})
export class AdminCategoryModule {}