import { Body, Controller, Delete, Get, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import { UserNotificationsService } from "./user.notifications.service";
import { AuthGuard } from "common/guards/authGuard";
import { Request, Response } from "express";
import templateResponse from "common/templates/response.tp";

@Controller('defaultapi/user/notifications')
export class UserNotificationsController {
    constructor(
        private readonly userNotificationsService: UserNotificationsService
    ) {}


    // get
    @UseGuards(AuthGuard)
    @Get('/list')
    getList(
        @Res() res: Response,
        @Req() req: Request,

        @Query('pagination') pagination?: { page: number, limit: number },
        @Query('notIDS') notIDS?: number[]
    ) {
        return this.userNotificationsService.getList(res, req, pagination, notIDS)
    }

    @UseGuards(AuthGuard)
    @Get('/unreadcount')
    getUnreadCount(
        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.userNotificationsService.getUnreadCount(res, req)
    }

    @UseGuards(AuthGuard)
    @Get('/allcount')
    getAllNotificationsCount(
        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.userNotificationsService.getAllCount(res, req)
    }


    // post
    @UseGuards(AuthGuard)
    @Post('/read')
    readNotification(
        @Body('notfIDList') notfIDList: number[],

        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.userNotificationsService.readNotification(notfIDList, res, req)
    }


    // delete
    @UseGuards(AuthGuard)
    @Delete('/delete')
    deleteNotification(
        @Body('notfid') notfid: number,

        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.userNotificationsService.deleteNotification(notfid, res, req)
    }

    @UseGuards(AuthGuard)
    @Delete('/clear')
    clearNotifications(
        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.userNotificationsService.clearNotifications(res, req)
    }
}