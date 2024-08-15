import { Body, Controller, Get, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import { UpdatesService } from "./updates.service";
import { AuthGuard } from "common/guards/authGuard";
import { Request, Response } from "express";
import { RolePrivilegesGuard } from "common/guards/rolePrivilegesGuard";
import { GetUserReq } from "common/guards/getUserReq";

@Controller('defaultapi/updates')
export class UpdatesController {
    constructor(private readonly updatesService: UpdatesService) {}

    // get
    @UseGuards(GetUserReq)
    @Get()
    getList(@Res() res: Response, @Req() req: Request) {
        return this.updatesService.getList(res, req)
    }

    @UseGuards(GetUserReq)
    @Get('/id')
    getID(
        @Query('id') id: number,

        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.updatesService.getID(id, res, req)
    }

    @UseGuards(GetUserReq)
    @Get('/last')
    getLast(
        @Query('where') where: string,

        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.updatesService.getLast(where, res, req)
    }


    // post
    @UseGuards(AuthGuard, new RolePrivilegesGuard("/updates/create"))
    @Post('/create')
    create(
        @Body('where') where: string,

        @Body('name') name: string,
        @Body('version') version: string,

        @Body('publishDate') publishDate: Date,

        @Body('background') background: string,
        @Body('body') body: string,

        @Res() res: Response,
        @Req() req: Request
    ) {
        console.log(publishDate)
        return this.updatesService.create(where, name, version, publishDate, background, body, res, req)
    }


    // put
    @UseGuards(AuthGuard, new RolePrivilegesGuard("/updates/update"))
    @Post('/update')
    update(
        @Body('id') id: number,

        @Body('name') name: string,
        @Body('version') version: string,

        @Body('background') background: string,
        @Body('body') body: string,

        @Res() res: Response,
        @Req() req: Request,

        @Body('publishDate') publishDate?: Date,
    ) {
        return this.updatesService.update(id, name, version, background, body, res, req, publishDate)
    }
}