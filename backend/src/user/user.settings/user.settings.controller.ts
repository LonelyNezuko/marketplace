import { Body, Controller, Get, Post, Put, Req, Res, UseGuards } from "@nestjs/common";
import { UserSettingsService } from "./user.settings.service";
import { AuthGuard } from "common/guards/authGuard";
import { Request, Response } from "express";
import { VerifycodesGuard } from "common/verifycodes/verifycodesGuard";
import { UserGeolocation } from "../user.entity";
import { UserUpdateDataDTO } from "./user.settings.dto";

@Controller('defaultapi/user/settings')
export class UserSettingsController {
    constructor(private readonly userSettingsService: UserSettingsService) {}

    // get
    @UseGuards(AuthGuard)
    @Get()
    get() {

    }

    @UseGuards(AuthGuard)
    @Get('/emailverify')
    getEmailVerify(
        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.userSettingsService.getEmailVerify(req, res)
    }

    @UseGuards(AuthGuard)
    @Put('/emailverify')
    emailVerify(
        @Body('hash') hash: string,

        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.userSettingsService.emailVerify(hash, res, req)
    }

    // post
    @UseGuards(AuthGuard)
    @Post('/emailverify/send')
    sendEmailVerify(
        @Body('language') language: string,

        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.userSettingsService.sendEmailVerify(language, req, res)
    }
 
    // put
    @UseGuards(AuthGuard, new VerifycodesGuard('account-settings-security'))
    @Put('/changepassword')
    changePassword(
        @Body('oldpassword') oldpassword: string,
        @Body('newpassword') newpassword: string,

        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.userSettingsService.changePassword(oldpassword, newpassword, res, req)
    }

    @UseGuards(AuthGuard)
    @Put('/changeavatar')
    changeAvatar(
        @Body('image') image: string,
        @Body('size') size: number,
        @Body('position') position: any, // json, object x, y

        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.userSettingsService.changeAvatar(res, req, image, size, position)
    }

    @UseGuards(AuthGuard, new VerifycodesGuard('account-settings-security'))
    @Put('/changeemail')
    changeEmail(
        @Body('newemail') newemail: string,
        @Body('language') language: string,

        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.userSettingsService.changeEmail(newemail, language, res, req)
    }

    @UseGuards(AuthGuard)
    @Put('/changeemail/verify')
    changeEmailVerify(
        @Body('hash') hash: string,

        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.userSettingsService.changeEmailVerify(hash, res, req)
    }

    @UseGuards(AuthGuard)
    @Put('/update')
    update(
        @Body('data') data: UserUpdateDataDTO,

        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.userSettingsService.update(data, req, res)
    }


    @UseGuards(AuthGuard)
    @Put('/geolocation')
    setGeolocation(
        @Body('geolocation') geolocation: UserGeolocation,

        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.userSettingsService.setGeolocation(geolocation, res, req)
    }

    @UseGuards(AuthGuard)
    @Put('/currency')
    setCurrency(
        @Body('currency') currency: string,

        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.userSettingsService.setCurrency(currency, res, req)
    }
}