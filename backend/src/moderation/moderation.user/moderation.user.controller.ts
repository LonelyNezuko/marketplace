import { Body, Controller, Get, Post, Put, Query, Req, Res, UseGuards } from "@nestjs/common";
import { ModerationUserService } from "./moderation.user.service";
import { AuthGuard } from "common/guards/authGuard";
import { RolePrivilegesGuard } from "common/guards/rolePrivilegesGuard";
import { Request, Response } from "express";

@Controller('defaultapi/moderation/user')
export class ModerationUserController {
    constructor(private readonly moderationUserService: ModerationUserService) {}

    // get
    @UseGuards(AuthGuard, new RolePrivilegesGuard([ "/moderation/user", "/admin/*" ]))
    @Get('/list')
    getList(
        @Query('name') name: string,
        @Query('id') id: number,

        @Query('pagination') pagination: { page: number, limit: number },

        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.moderationUserService.getList(name, id, pagination, res, req)
    }

    @UseGuards(AuthGuard, new RolePrivilegesGuard("/moderation/user"))
    @Get('')
    getInfo(
        @Query('id') id: number,

        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.moderationUserService.getInfo(id, res, req)
    }

    // put
    @UseGuards(AuthGuard, new RolePrivilegesGuard('/moderation/user/ban'))
    @Put('/ban')
    banUser(
        @Res() res: Response,
        @Req() req: Request,

        @Body('userid') userid: number,
        @Body('expiresDate') expiresDate: Date,
        @Body('comment') comment: string
    ) {
        return this.moderationUserService.banUser(res, req, userid, expiresDate, comment)
    }

    @UseGuards(AuthGuard, new RolePrivilegesGuard('/moderation/user/ban/report'))
    @Put('/ban/report')
    reportBanUser(
        @Res() res: Response,
        @Req() req: Request,

        @Body('userid') userid: number,
        @Body('expiresDate') expiresDate: Date,
        @Body('comment') comment: string
    ) {
        return this.moderationUserService.reportBanUser(res, req, userid, expiresDate, comment)
    }

    @UseGuards(AuthGuard, new RolePrivilegesGuard('/moderation/user/warn'))
    @Put('/warn')
    warnUser(
        @Res() res: Response,
        @Req() req: Request,

        @Body('userid') userid: number,
        @Body('comment') comment: string
    ) {
        return this.moderationUserService.warnUser(res, req, userid, comment)
    }

    // post
    @UseGuards(AuthGuard, new RolePrivilegesGuard('/moderation/user/email/sendcode'))
    @Post('/email/sendcode')
    sendEmailCode(
        @Res() res: Response,
        @Req() req: Request,

        @Body('userid') userid: number
    ) {
        return this.moderationUserService.sendEmailCode(res, req, userid)
    }
}