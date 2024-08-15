import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";

import { User } from "src/user/user.entity";
import { AdminCategoryModule } from "./category/admin.category.module";
import { AdminStorageModule } from "./storage/admin.storage.module";
import { AdminMailTemplateModule } from "./mailtemplate/admin.mailtemplate.module";
import { AdminNotificationsModule } from "./notifications/admin.notifications.module";
import { UserSessions } from "src/user/user.sessions/user.sessions.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([User, UserSessions]),

        AdminCategoryModule,
        AdminStorageModule,
        AdminMailTemplateModule,
        AdminNotificationsModule
    ],
    controllers: [AdminController],
    providers: [AdminService]
})

export class AdminModule {}
