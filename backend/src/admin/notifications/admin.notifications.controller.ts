import { Body, Controller, Delete, Get, Post, Query, Req, Res, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { AdminNotificationsService } from "./admin.notifications.service";
import { AuthGuard } from "common/guards/authGuard";
import { RolePrivilegesGuard } from "common/guards/rolePrivilegesGuard";
import { Request, Response } from "express";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";

@Controller('defaultapi/admin/notifications')
export class AdminNotificationsController {
    constructor(
        private readonly adminNotificationsService: AdminNotificationsService
    ) {}


    // get
    @UseGuards(AuthGuard, new RolePrivilegesGuard('/admin/notifications'))
    @Get('')
    getNotification(
        @Query('id') id: number,

        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.adminNotificationsService.getNotification(id, res, req)
    }

    @UseGuards(AuthGuard, new RolePrivilegesGuard('/admin/notifications'))
    @Get('/list')
    getList(
        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.adminNotificationsService.getList(res, req)
    }


    // post
    @UseGuards(AuthGuard, new RolePrivilegesGuard('/admin/notifications/create'))
    @Post('/create')
    @UseInterceptors(FileInterceptor('file'))
    createNotification(
        @Body('name') name: string,
        @UploadedFile() previewAvatar: Express.Multer.File,
        @Body('text') text: string,
        @Body('viewAt') viewAt: Date,

        @Body('attachedProductID') attachedProductID: number,
        @Body('attachedUserID') attachedUserID: number,

        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.adminNotificationsService.createNotification(name, previewAvatar, text, viewAt, attachedProductID, attachedUserID, res, req)
    }


    // delete
    @UseGuards(AuthGuard, new RolePrivilegesGuard('/admin/notifications/delete'))
    @Delete('/delete')
    deleteNotification(
        @Body('notfid') notfid: number,

        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.adminNotificationsService.deleteNotification(notfid, res, req)
    }
}