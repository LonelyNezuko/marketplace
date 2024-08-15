import { Body, Controller, Get, OnModuleInit, Post, Put, Query, Req, Res, UploadedFiles, UseGuards, UseInterceptors } from "@nestjs/common";
import { ModerationReportService } from "src/moderation/moderation.report/moderation.report.service";
import { ModuleRef } from "@nestjs/core";
import { LogsService } from "src/logs/logs.service";
import { AuthGuard } from "common/guards/authGuard";
import { Request, Response } from "express";
import { AttachmentDTO } from "common/dto/attachment.dto";
import { FilesInterceptor } from "@nestjs/platform-express";
import { UserSupportService } from "./user.support.service";
import { ModerationSupportType } from "src/moderation/moderation.support/moderation.support.entity";

@Controller('defaultapi/user/support')
export class UserSupportController {
    constructor(
        private readonly userSupportService: UserSupportService
    ) {}


    // get
    @UseGuards(AuthGuard)
    @Get()
    getReport(
        @Res() res: Response,
        @Req() req: Request,

        @Query('supportID') supportID: number
    ) {
        return this.userSupportService.getSupport(res, req, supportID)
    }

    @UseGuards(AuthGuard)
    @Get('/list')
    getReportList(
        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.userSupportService.getSupportList(res, req)
    }


    // post
    @UseInterceptors(FilesInterceptor('attachments[]'))
    @UseGuards(AuthGuard)
    @Post('/message')
    sendMessage(
        @Res() res: Response,
        @Req() req: Request,

        @Body('supportID') supportID: number,
        @Body('text') text: string,
        @UploadedFiles() attachments: Express.Multer.File[]
    ) {
        return this.userSupportService.sendMessage(res, req, supportID, text, attachments)
    }

    @UseGuards(AuthGuard)
    @Post()
    createSupport(
        @Res() res: Response,
        @Req() req: Request,

        @Body('text') text: string,
        @Body('reason') reason: string,
        @Body('type') type: ModerationSupportType,

        @Body('userID') userID?: number,
        @Body('productID') productID?: number,
    ) {
        return this.userSupportService.createSupport(res, req, text, reason, type, userID, productID)
    }


    // put
    @UseGuards(AuthGuard)
    @Put('/close')
    closeReport(
        @Res() res: Response,
        @Req() req: Request,

        @Body('supportID') supportID: number
    ) {
        return this.userSupportService.closeSupport(res, req, supportID)
    }



    // delete
}