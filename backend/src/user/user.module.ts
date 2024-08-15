import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { User } from "./user.entity";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";

import { UserSigninModule } from "./user.signin/user.signin.module";
import { UserSessionsModule } from "./user.sessions/user.sessions.module";
import { UserSettingsModule } from "./user.settings/user.settings.module";
import { Product } from "src/product/product.entity";
import { UserDialogsModule } from "./user.dialogs/user.dialogs.module";
import { UserGateway } from "./user.gateway";
import { GatewayGuard } from "common/guards/gatewayGuard";
import { MailerModule } from "src/__service/mailer/mailer.module";
import { UserNotificationsModule } from "./user.notifications/user.notifications.module";
import { ConfigModule } from "@nestjs/config";
import { UserSessions } from "./user.sessions/user.sessions.entity";
import { UserHistoryCategoryViews, UserHistoryProductFavorites, UserHistoryProductMessages, UserHistoryProductViews, UserHistorySearch } from "./user.history.entity";
import { Category } from "src/category/category.entity";
import { UserReportModule } from "./user.report/user.report.module";
import { UserSupportModule } from "./user.support/user.support.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Product, UserSessions, Category,
            UserHistoryCategoryViews, UserHistoryProductFavorites, UserHistoryProductViews, UserHistorySearch,
            UserHistoryProductMessages
        ]),

        UserSigninModule,
        UserSessionsModule,
        UserSettingsModule,
        UserDialogsModule,
        UserNotificationsModule,
        UserReportModule,
        UserSupportModule
    ],
    controllers: [UserController],
    providers: [UserService, GatewayGuard, UserGateway]
})

export class UserModule {}
