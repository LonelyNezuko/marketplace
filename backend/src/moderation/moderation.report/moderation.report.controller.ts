import { Body, Controller, Get, Post, Put, Query, Req, Res, UploadedFiles, UseGuards, UseInterceptors } from "@nestjs/common";
import { ModerationUserService } from "../moderation.user/moderation.user.service";
import { AuthGuard } from "common/guards/authGuard";
import { RolePrivilegesGuard } from "common/guards/rolePrivilegesGuard";
import { Request, Response } from "express";
import { ModerationReportService } from "./moderation.report.service";
import { FilesInterceptor } from "@nestjs/platform-express";

@Controller('defaultapi/moderation/report')
export class ModerationReportController {
    constructor(
        private readonly moderationReportService: ModerationReportService
    ) {}


    // get
    @UseGuards(AuthGuard, new RolePrivilegesGuard('/moderation/report'))
    @Get('')
    getReport(
        @Res() res: Response,
        @Req() req: Request,

        @Query('reportID') reportID: number
    ) {
        return this.moderationReportService.getReport(res, req, reportID)
    }

    @UseGuards(AuthGuard, new RolePrivilegesGuard('/moderation/report'))
    @Get('/open')
    getOpenReport(
        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.moderationReportService.getOpenReport(res, req)
    }

    @UseGuards(AuthGuard, new RolePrivilegesGuard('/moderation/report'))
    @Get('/open/subject')
    getOpenReportUserID(
        @Res() res: Response,
        @Req() req: Request,

        @Query('reportID') reportID: number
    ) {
        return this.moderationReportService.getOpenReportSubjectID(res, req, reportID)
    }


    // post
    @UseInterceptors(FilesInterceptor('attachments[]'))
    @UseGuards(AuthGuard, new RolePrivilegesGuard('/moderation/report/message'))
    @Post('/message')
    sendMessage(
        @Res() res: Response,
        @Req() req: Request,

        @Body('reportID') reportID: number,
        @Body('text') text: string,
        @UploadedFiles() attachments: Express.Multer.File[]
    ) {
        return this.moderationReportService.sendMessage(res, req, reportID, text, attachments)
    }


    // put
    @UseGuards(AuthGuard, new RolePrivilegesGuard('/moderation/report/status'))
    @Put('/status')
    changeReportStatus(
        @Res() res: Response,
        @Req() req: Request,

        @Body('reportID') reportID: number
    ) {
        return this.moderationReportService.changeReportStatus(res, req, reportID)
    }



    // delete
}