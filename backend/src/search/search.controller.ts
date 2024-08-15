import { Controller, Get, Query, Req, Res, UseGuards } from "@nestjs/common";
import { SearchService } from "./search.service";
import { Request, Response } from "express";
import { GetUserReq } from "common/guards/getUserReq";

@Controller('defaultapi/search')
export class SearchController {
    constructor(
        private readonly searchService: SearchService
    ) {}

    @UseGuards(GetUserReq)
    @Get('/possiblecategory')
    getPossibleCategory(
        @Query('value') value: string,

        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.searchService.searchPossibleCategory(value, res, req)
    }

    @Get('/possiblevalues')
    getPossibleValues(
        @Query('value') value: string,

        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.searchService.getPossibleValues(value, res, req)
    }
}