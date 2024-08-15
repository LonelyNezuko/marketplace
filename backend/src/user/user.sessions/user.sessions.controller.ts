import { 
    Controller,
    
    Get,
    Post,
    
    Param,
    Query,
    Body,

    Res,
    Req,

    Ip,
    UseGuards,
    Delete} from '@nestjs/common';
import { AuthGuard } from "common/guards/authGuard";
import { Request, Response } from 'express';
import { UserSessionsService } from './user.sessions.service';
import { UserSessionsPlatform } from './user.sessions.entity';

@Controller('defaultapi/user/sessions')
export class UserSessionsController {
    constructor(private readonly userSessionsService: UserSessionsService) {}

    @UseGuards(AuthGuard)
    @Get()
    getAll(
        @Res() res: Response,
        @Req() req: Request,

        @Query('platform') platform: UserSessionsPlatform
    ) {
        return this.userSessionsService.getAll(res, req, platform)
    }

    @UseGuards(AuthGuard)
    @Delete()
    delete(
        @Body('sessionID') sessionID: number,

        @Res() res: Response,
        @Req() req: Request) {
        return this.userSessionsService.delete(sessionID, res, req)
    }

    @UseGuards(AuthGuard)
    @Delete('clear')
    clear(
        @Res() res: Response,
        @Req() req: Request) {
        return this.userSessionsService.clear(res, req)
    }
}