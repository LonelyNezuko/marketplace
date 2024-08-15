import { Body, Controller, Get, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { AuthGuard } from "common/guards/authGuard";
import templateResponse from "common/templates/response.tp";
import { Request, Response } from "express";
import { VerifyCode } from "./verifycodes.entity";
import { Repository } from "typeorm";
import random from "common/functions/random";
import { Verifycodes } from "common/verifycodes/verifycodes";
import { VerifyCodesService } from "./verifycodes.service";

@Controller('/defaultapi/service/verifycodes')
export class VerifycodesController {
    constructor(
        private readonly verifyCodesService: VerifyCodesService,
    ) {}

    @UseGuards(AuthGuard)
    @Get()
    async verify(
        @Query('code') code: string,
        @Query('forid') forid: string,

        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.verifyCodesService.verify(code, forid, null, res, req)
    }

    // post
    @UseGuards(AuthGuard)
    @Post('/create')
    async create(
        @Body('privilege') privilege: string,

        @Body('userid') userid: number,
        @Body('language') language: string,

        @Body('length') length: number,

        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.verifyCodesService.create(privilege, userid, language, length, res, req)
    }
}