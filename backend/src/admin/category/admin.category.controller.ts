import { Body, Controller, Delete, Post, Put, Req, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "common/guards/authGuard";
import { RolePrivilegesGuard } from "common/guards/rolePrivilegesGuard";
import { AdminCategoryService } from "./admin.category.service";
import { Request, Response } from "express";

@Controller('/defaultapi/admin/category')
export class AdminCategoryController {
    constructor(private readonly adminCategoryService: AdminCategoryService) {}

    @UseGuards(AuthGuard, new RolePrivilegesGuard("/admin/category/create"))
    @Post('create')
    create(
        @Body('name') name: string,
        @Body('nameTranslate') nameTranslate: any, // json
        @Body('icon') icon: string, // link
        @Body('background') background: string, // link
        @Body('parentID') parentID: number, // link
        @Body('forms') forms: string,

        @Res() res: Response,
        @Req() req: Request,
        
        @Body('link') link?: string) {
        return this.adminCategoryService.create(name, nameTranslate, icon, background, parentID, forms, res, req, link)
    }

    @UseGuards(AuthGuard, new RolePrivilegesGuard("/admin/category/delete"))
    @Delete('delete')
    delete(
        @Body('id') id: number,

        @Res() res: Response,
        @Req() req: Request) {
        return this.adminCategoryService.delete(id, res, req)
    }

    @UseGuards(AuthGuard, new RolePrivilegesGuard("/admin/category/update"))
    @Put('update')
    update(
        @Body('id') id: number,
        @Body('name') name: string,
        @Body('nameTranslate') nameTranslate: any, // json
        @Body('icon') icon: string, // link
        @Body('background') background: string, // link
        @Body('parentID') parentID: number, // link
        @Body('forms') forms: string,
        @Body('link') link: string,

        @Res() res: Response,
        @Req() req: Request) {
        return this.adminCategoryService.update(id, name, nameTranslate, icon, background, parentID, forms, link, res, req)
    }
}