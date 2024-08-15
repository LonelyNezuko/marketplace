import { Body, Controller, Get, Post, Put, Query, Req, Res, UploadedFiles, UseGuards, UseInterceptors } from "@nestjs/common";
import { ModerationUserService } from "../moderation.user/moderation.user.service";
import { AuthGuard } from "common/guards/authGuard";
import { RolePrivilegesGuard } from "common/guards/rolePrivilegesGuard";
import { Request, Response } from "express";
import { FilesInterceptor } from "@nestjs/platform-express";
import { ModerationSupportService } from "./moderation.support.service";

@Controller('defaultapi/moderation/support')
export class ModerationSupportController {
    constructor(
        private readonly moderationSupportService: ModerationSupportService
    ) {}


    // get
    @UseGuards(AuthGuard, new RolePrivilegesGuard('/moderation/support'))
    @Get('')
    getReport(
        @Res() res: Response,
        @Req() req: Request,

        @Query('supportID') supportID: number
    ) {
        return this.moderationSupportService.getSupport(res, req, supportID)
    }

    @UseGuards(AuthGuard, new RolePrivilegesGuard('/moderation/support'))
    @Get('/open')
    getOpenReport(
        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.moderationSupportService.getOpenSupport(res, req)
    }

    @UseGuards(AuthGuard, new RolePrivilegesGuard('/moderation/support'))
    @Get('/open/subject')
    getOpenReportUserID(
        @Res() res: Response,
        @Req() req: Request,

        @Query('supportID') supportID: number
    ) {
        return this.moderationSupportService.getOpenSupportSubjectID(res, req, supportID)
    }


    // post
    @UseInterceptors(FilesInterceptor('attachments[]'))
    @UseGuards(AuthGuard, new RolePrivilegesGuard('/moderation/support/message'))
    @Post('/message')
    sendMessage(
        @Res() res: Response,
        @Req() req: Request,

        @Body('supportID') supportID: number,
        @Body('text') text: string,
        @UploadedFiles() attachments: Express.Multer.File[]
    ) {
        return this.moderationSupportService.sendMessage(res, req, supportID, text, attachments)
    }


    // put
    @UseGuards(AuthGuard, new RolePrivilegesGuard('/moderation/support/status'))
    @Put('/status')
    changeReportStatus(
        @Res() res: Response,
        @Req() req: Request,

        @Body('supportID') supportID: number
    ) {
        return this.moderationSupportService.changeSupportStatus(res, req, supportID)
    }



    // delete
}