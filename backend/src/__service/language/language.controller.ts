import { Body, Controller, Delete, Get, Post, Put, Query, Req, Res, UseGuards } from "@nestjs/common";
import { LanguageService } from "./language.service";
import { AuthGuard } from "common/guards/authGuard";
import { RolePrivilegesGuard } from "common/guards/rolePrivilegesGuard";
import { Request, Response } from "express";
import { GetUserReq } from "common/guards/getUserReq";

@Controller('defaultapi/service/language')
export class LanguageController {
    constructor(private readonly languageService: LanguageService) {}

    @UseGuards(AuthGuard, new RolePrivilegesGuard("/service/language"))
    @Get('')
    getLanguage(
        @Query('id') id: number,

        @Res() res: Response,
        @Req() req: Request,

        @Query('admin') admin?: boolean,
    ) {
        return this.languageService.getLanguage(id, admin, res, req)
    }

    @UseGuards(AuthGuard, new RolePrivilegesGuard("/service/language/example"))
    @Get('/example')
    getExampleLanguage(
        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.languageService.getExampleLanguage(res, req)
    }

    @UseGuards(GetUserReq)
    @Get('/all')
    getAllLanguage(
        @Res() res: Response,
        @Req() req: Request,

        @Query('admin') admin?: any
    ) {
        return this.languageService.getAllLanguage(res, req, admin)
    }


    // put
    @UseGuards(AuthGuard, new RolePrivilegesGuard("/service/language/update"))
    @Put('/update')
    updateLanguage(
        @Body('id') id: number,

        @Body('name') name: string,
        @Body('code') code: string,
        @Body('active') active: boolean,
        @Body('main') main: boolean,
        @Body('params') params: any, // json

        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.languageService.updateLanguage(id, name, code, active, main, params, res, req)
    }

    // post
    @UseGuards(AuthGuard, new RolePrivilegesGuard("/service/language/new"))
    @Post('/new')
    newLanguage(
        @Body('name') name: string,
        @Body('code') code: string,
        @Body('active') active: number,
        @Body('params') params: any, // json

        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.languageService.newLanguage(name, code, active, params, res, req)
    }

    // delete
    @UseGuards(AuthGuard, new RolePrivilegesGuard("/service/language/delete"))
    @Delete('/delete')
    deleteLanguage(
        @Body('id') id: number,

        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.languageService.deleteLanguage(id, res, req)
    }
}