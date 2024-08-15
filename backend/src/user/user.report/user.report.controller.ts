import { Body, Controller, Get, OnModuleInit, Post, Put, Query, Req, Res, UploadedFiles, UseGuards, UseInterceptors } from "@nestjs/common";
import { UserReportService } from "./user.report.service";
import { ModerationReportService } from "src/moderation/moderation.report/moderation.report.service";
import { ModuleRef } from "@nestjs/core";
import { LogsService } from "src/logs/logs.service";
import { AuthGuard } from "common/guards/authGuard";
import { Request, Response } from "express";
import { AttachmentDTO } from "common/dto/attachment.dto";
import { FilesInterceptor } from "@nestjs/platform-express";
import { IsUserReportBanned } from "common/guards/isUserReportBanned";

@Controller('defaultapi/user/report')
export class UserReportController {
    constructor(
        private readonly userReportService: UserReportService
    ) {}


    // get
    @UseGuards(AuthGuard)
    @Get()
    getReport(
        @Res() res: Response,
        @Req() req: Request,

        @Query('reportID') reportID: number
    ) {
        return this.userReportService.getReport(res, req, reportID)
    }

    @UseGuards(AuthGuard)
    @Get('/list')
    getReportList(
        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.userReportService.getReportList(res, req)
    }


    // post
    @UseInterceptors(FilesInterceptor('attachments[]'))
    @UseGuards(AuthGuard, IsUserReportBanned)
    @Post('/message')
    sendMessage(
        @Res() res: Response,
        @Req() req: Request,

        @Body('reportID') reportID: number,
        @Body('text') text: string,
        @UploadedFiles() attachments: Express.Multer.File[]
    ) {
        return this.userReportService.sendMessage(res, req, reportID, text, attachments)
    }

    @UseGuards(AuthGuard, IsUserReportBanned)
    @Post()
    createReport(
        @Res() res: Response,
        @Req() req: Request,

        @Body('userID') userID: number,
        @Body('productID') productID: number,
        @Body('text') text: string,
        @Body('reason') reason: string
    ) {
        return this.userReportService.createReport(res, req, userID, productID, text, reason)
    }


    // put
    @UseGuards(AuthGuard, IsUserReportBanned)
    @Put('/close')
    closeReport(
        @Res() res: Response,
        @Req() req: Request,

        @Body('reportID') reportID: number
    ) {
        return this.userReportService.closeReport(res, req, reportID)
    }



    // delete
}