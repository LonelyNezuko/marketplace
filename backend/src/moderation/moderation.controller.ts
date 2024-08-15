import { 
    Controller,
    
    Get,
    Post,
    Put,
    
    Param,
    Query,

    Res,
    Req, 
    UseGuards,
    Injectable} from '@nestjs/common';
import { Response, Request } from 'express';

import templateResponse from 'common/templates/response.tp';

import { AuthGuard } from 'common/guards/authGuard';

import { User } from 'src/user/user.entity';
import { ModerationService } from './moderation.service';
import { RolePrivilegesGuard } from 'common/guards/rolePrivilegesGuard';
import { IsUserBanned } from 'common/guards/isUserBanned';

@Controller('defaultapi/moderation')
export class ModerationController {
    constructor(private readonly moderationService: ModerationService) {}

    @UseGuards(AuthGuard, IsUserBanned, new RolePrivilegesGuard('/moderation/*'))
    @Get('verifyaccess')
    verifyAccess(@Res() res: Response) {
        return templateResponse(res, "", 200)
    }
}