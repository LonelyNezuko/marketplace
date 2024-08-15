import { Body, Controller, Delete, Get, Put, Query, Req, Res, UseGuards } from "@nestjs/common";
import { ModerationProductSerivce } from "./moderation.product.service";
import { Request, Response } from "express";
import { AuthGuard } from "common/guards/authGuard";
import { RolePrivilegesGuard } from "common/guards/rolePrivilegesGuard";
import { PaginationDto } from "common/dto/pagination.dto";
import { RolePrivilegesVerify } from "common/functions/rolePrivilegesVerify";

@Controller('defaultapi/moderation/product')
export class ModerationProductController {
    constructor(private readonly moderationProductService: ModerationProductSerivce) {}

    // get
    @UseGuards(AuthGuard, new RolePrivilegesGuard('/moderation/product'))
    @Get('')
    get(
        @Query('prodID') prodID: number,

        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.moderationProductService.get(prodID, res, req)
    }

    @UseGuards(AuthGuard, new RolePrivilegesGuard('/moderation/product'))
    @Get('/verifying')
    getVerfyingProduct(
        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.moderationProductService.getVerifyingProduct(res, req)
    }

    @UseGuards(AuthGuard, new RolePrivilegesGuard('/moderation/product'))
    @Get('/verifying/ownerid')
    getVerfyingProductOwnerID(
        @Res() res: Response,
        @Req() req: Request,

        @Query('prodID') prodID: number
    ) {
        return this.moderationProductService.getVerifyingProductOwnerID(res, req, prodID)
    }

    @UseGuards(AuthGuard, new RolePrivilegesGuard('/moderation/product/list'))
    @Get('/list')
    getList(
        @Res() res: Response,
        @Req() req: Request,

        @Query('categoryID') categoryID?: number,
        @Query('ownerID') ownerID?: number,

        @Query('status') status?: number,
        @Query('moderationStatus') moderationStatus?: number,

        @Query('pagination') pagination?: any, // json
    ) {
        return this.moderationProductService.getList(res, req, categoryID, ownerID, status, moderationStatus, pagination)
    }

    @UseGuards(AuthGuard, new RolePrivilegesGuard('/moderation/product/list/deleted'))
    @Get('/list/deleted')
    getDeletedList(
        @Res() res: Response,
        @Req() req: Request,

        @Query('categoryID') categoryID?: number,
        @Query('ownerID') ownerID?: number,

        @Query('status') status?: number,
        @Query('moderationStatus') moderationStatus?: number,

        @Query('pagination') pagination?: any
    ) {
        return this.moderationProductService.getList(res, req, categoryID, ownerID, status, moderationStatus, pagination)
    }


    // put
    @UseGuards(AuthGuard, new RolePrivilegesGuard('/moderation/product/verdict'))
    @Put('verdict')
    verdict(
        @Body('prodID') prodID: number,

        @Body('status') status: number,
        @Body('comment') comment: string,

        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.moderationProductService.verdict(prodID, status, comment, res, req)
    }

    @UseGuards(AuthGuard, new RolePrivilegesGuard('/moderation/product/ban'))
    @Put('ban')
    ban(
        @Body('prodID') prodID: number,
        @Body('comment') comment: string,

        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.moderationProductService.ban(prodID, comment, res, req)
    }

    // @UseGuards(AuthGuard, new RolePrivilegesGuard('/moderation/product/edit'))
    // @Put('edit')
    // edit(
    //     prodID: number,
    //     categoryID: number,

    //     forms: string,
    //     images: string,
    //     description: string,

    //     @Res() res: Response,
    //     @Req() req: Request
    // ) {
    //     return this.moderationProductService.edit(prodID, categoryID, forms, images, description, res, req)
    // }

    // delete
    // сюда вставить user.verifycodes
    @UseGuards(AuthGuard, new RolePrivilegesGuard('/moderation/product/delete'))
    @Delete('delete')
    delete(
        @Body('prodID') prodID: number,
        @Body('comment') comment: string,

        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.moderationProductService.delete(prodID, comment, res, req)
    }
}