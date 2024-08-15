import { Module } from "@nestjs/common";
import { VerifycodesController } from "./verifycodes.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { VerifyCode } from "./verifycodes.entity";
import { User } from "src/user/user.entity";
import { Verifycodes } from "common/verifycodes/verifycodes";
import { VerifyCodesService } from "./verifycodes.service";
import { UserSessions } from "src/user/user.sessions/user.sessions.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([VerifyCode, User, UserSessions])
    ],
    controllers: [VerifycodesController],
    providers: [Verifycodes, VerifyCodesService]
})
export class VerifycodesModule {}