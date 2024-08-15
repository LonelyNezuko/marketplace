import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './user/user.entity';

import { UserModule } from './user/user.module';
import { AdminModule } from './admin/admin.module';
import { ModerationModule } from './moderation/moderation.module';
import { CategoryModule } from './category/category.module';
import { RoleModule } from './role/role.module';
import { LogsModule } from './logs/logs.module';
import { Role } from './role/role.entity';
import { ProductModule } from './product/product.module';
import { Product } from './product/product.entity';
import { Logs } from './logs/logs.entity';
import { Category } from './category/category.entity';
import { LanguageModule } from './__service/language/language.module';
import { StorageModule } from './__service/storage/storage.module';
import { WebSocketGateway } from '@nestjs/websockets';
import { VerifycodesModule } from './__service/verifycodes/verifycodes.module';
import { UpdatesModule } from './updates/updates.module';
import { MailerModule } from './__service/mailer/mailer.module';
import { MailTemplateModule } from './__service/mailtemplate/mailtemplate.module';
import { ContactUsModule } from './__service/contactus/contactus.module';
import { UserSessions } from './user/user.sessions/user.sessions.entity';
import { SearchModule } from './search/search.module';
import { dataSourceOptions } from 'database/connect';

const NODEENV: string = process.env.NODE_ENV

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: !NODEENV ? '.env' : `.${NODEENV}.env`
        }),
        TypeOrmModule.forRoot(dataSourceOptions),

        UserModule,
        AdminModule,
        ModerationModule,
        CategoryModule,
        RoleModule,
        LogsModule,
        ProductModule,
        UpdatesModule,
        SearchModule,

        LanguageModule,
        StorageModule,
        VerifycodesModule,
        MailerModule,
        MailTemplateModule,
        ContactUsModule
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
