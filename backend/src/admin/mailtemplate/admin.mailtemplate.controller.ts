import { Body, Controller, Delete, Get, Post, Put, Query, Req, Res, UseGuards } from "@nestjs/common";
import { AdminMailTemplateService } from "./admin.mailtemplate.service";
import { AuthGuard } from "common/guards/authGuard";
import { RolePrivilegesGuard } from "common/guards/rolePrivilegesGuard";
import { Request, Response } from "express";
import { MailTemplateTypes } from "src/__service/mailtemplate/mailtemplate.dto";

@Controller('/defaultapi/admin/mailtemplate')
export class AdminMailTemplateController {
    constructor(
        private readonly adminMailTemplateService: AdminMailTemplateService
    ) {}


    // get
    @UseGuards(AuthGuard, new RolePrivilegesGuard("/admin/mailtemplate"))
    @Get()
    getMailtemplate(
        @Query('id') id: number,

        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.adminMailTemplateService.getMailtemplate(id, res, req)
    }

    
    @UseGuards(AuthGuard, new RolePrivilegesGuard("/admin/mailtemplate"))
    @Get('/list')
    getMailtemplateList(
        @Query('languagecode') languagecode: string,

        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.adminMailTemplateService.getMailtemplateList(languagecode, res, req)
    }


    // post
    @UseGuards(AuthGuard, new RolePrivilegesGuard("/admin/mailtemplate/create"))
    @Post('/create')
    createMailtemplate(
        @Body('type') type: MailTemplateTypes,
        @Body('languagecode') languagecode: string,
        @Body('html') html: string,
        @Body('subject') subject: string,
        @Body('editorJSON') editorJSON: any,

        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.adminMailTemplateService.createMailtemplate(type, languagecode, html, subject, editorJSON, res, req)
    }


    // put
    @UseGuards(AuthGuard, new RolePrivilegesGuard("/admin/mailtemplate/update"))
    @Put('/update')
    updateMailtemplate(
        @Body('id') id: number,

        @Body('html') html: string,
        @Body('subject') subject: string,
        @Body('editorJSON') editorJSON: any,

        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.adminMailTemplateService.updateMailtemplate(id, html, subject, editorJSON, res, req)
    }

    @UseGuards(AuthGuard, new RolePrivilegesGuard('/admin/mailtemplate/update'))
    @Put('/active')
    updateActiveStatus(
        @Body('id') id: number,

        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.adminMailTemplateService.updateActiveStatus(id, res, req)
    }


    // delete
    @UseGuards(AuthGuard, new RolePrivilegesGuard("/admin/mailtemplate/delete"))
    @Delete('/delete')
    deleteMailtemplate(
        @Body('id') id: number,
        
        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.adminMailTemplateService.deleteMailtemplate(id, res, req)
    }
}