import { 
    Controller,
    
    Get,
    Post,
    
    Param,
    Query,
    Body,

    Res,
    Req,

    Ip} from '@nestjs/common';
import { UserSigninService } from './user.signin.service';

import { Response, Request } from 'express'
import { UserGeolocation } from '../user.entity';

@Controller('defaultapi/user/sign')
export class UserSigninController {
    constructor(private readonly UserSigninService: UserSigninService) {}

    @Post('/up')
    async signup(
        @Body('email') email: string,
        @Body('password') password: string,
        @Body('name') name: [ string, string ],
        @Body('geolocation') geolocation: UserGeolocation,
        @Body('currency') currency: string,
        @Body('platform') platform: 'site' | 'mobileapp',

        @Res() res: Response,
        @Req() req: Request) {
        return this.UserSigninService.signup(email, password, name, geolocation, currency, platform, res, req)
    }

    @Post()
    async signin(
        @Body('email') username: string,
        @Body('password') password: string,
        @Body('platform') platform: 'site' | 'mobileapp',

        @Res() res: Response,
        @Req() req: Request,
        
        @Body('verifycode') verifyCode?: string) {
        return this.UserSigninService.signin(username, password, platform, res, req, verifyCode)
    }
}