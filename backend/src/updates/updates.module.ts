import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "src/user/user.entity";
import { Updates } from "./updates.entity";
import { UpdatesController } from "./updates.controller";
import { UpdatesService } from "./updates.service";
import { UserSessions } from "src/user/user.sessions/user.sessions.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([ User, Updates, UserSessions ])
    ],
    controllers: [ UpdatesController ],
    providers: [ UpdatesService ]
})
export class UpdatesModule {}