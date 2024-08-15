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
    Injectable,
    Body} from '@nestjs/common';
import { Response, Request } from 'express';

import { AdminService } from './admin.service';

import templateResponse from 'common/templates/response.tp';

import { AuthGuard } from 'common/guards/authGuard';

import { User } from 'src/user/user.entity';
import { Verifycodes } from 'common/verifycodes/verifycodes';
import { RolePrivilegesGuard } from 'common/guards/rolePrivilegesGuard';
import { RoleGuard } from 'common/guards/roleGuard';
import { IsUserBanned } from 'common/guards/isUserBanned';

@Controller('defaultapi/admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) {}

    // get
    @UseGuards(AuthGuard, IsUserBanned, new RolePrivilegesGuard('/admin/*'))
    @Get('verifyaccess')
    verifyAccess(@Res() res: Response) {
        return templateResponse(res, "", 200)
    }


    // post
    // @UseGuards(AuthGuard, new RolePrivilegesGuard('/admin/setrole'))
    // @Post('setrole')
    // async setRole(
    //     @Body('userid') userid: number,
    //     @Body('status') status: string,
    //     @Body('role') role: string,

    //     @Req() req: Request,
    //     @Res() res: Response
    // ) {
    //     return this.adminService.setRole(userid, status, role, req, res)
    // }



    // // testing
    // @UseGuards(AuthGuard, new RoleGuard("developer"))
    // @Post('generatevc')
    // generateVerifyCodes(
    //     @Body('privilege') privilege: string,
    //     @Body('expireddate') expiredDate: any,
    //     @Body('count') count: number,

    //     @Res() res: Response
    // ) {
    //     expiredDate = parseInt(expiredDate)
    //     return templateResponse(res, new Verifycodes().generate(privilege, +new Date + expiredDate, count), 200)
    // }
    // @UseGuards(AuthGuard, new RoleGuard("developer"))
    // @Post('testvc')
    // testVerifyCodes(
    //     @Body('code') code: string,
    //     @Body('privilege') privilege: string,

    //     @Res() res: Response
    // ) {
    //     return templateResponse(res, new Verifycodes().verify(code, privilege), 200)
    // }
}