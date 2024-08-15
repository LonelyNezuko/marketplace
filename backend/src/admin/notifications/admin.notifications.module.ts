import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Product } from "src/product/product.entity";
import { User } from "src/user/user.entity";
import { UserNotifications } from "src/user/user.notifications/user.notifications.entity";
import { AdminNotificationsController } from "./admin.notifications.controller";
import { AdminNotificationsService } from "./admin.notifications.service";
import { UserSessions } from "src/user/user.sessions/user.sessions.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([ User, UserNotifications, Product, UserSessions ])
    ],
    controllers: [ AdminNotificationsController ],
    providers: [ AdminNotificationsService ]
})
export class AdminNotificationsModule {}