import { Body, Controller, Delete, Get, Post, Query, Req, Res, UploadedFiles, UseGuards, UseInterceptors } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { AdminStorageService } from "./admin.storage.service";
import { Request, Response } from "express";
import { AuthGuard } from "common/guards/authGuard";
import { RolePrivilegesGuard } from "common/guards/rolePrivilegesGuard";
import { FilesInterceptor } from "@nestjs/platform-express";
import { StorageFilesAccess } from "src/__service/storage/storage.files.dto";

@Controller('/defaultapi/admin/storage')
export class AdminStorageController {
    constructor(
        private readonly adminStorageService: AdminStorageService
    ) {}

    // get
    @UseGuards(AuthGuard, new RolePrivilegesGuard("/admin/storage/list"))
    @Get('/list')
    getAlbumList(
        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.adminStorageService.getAlbumList(res, req)
    }

    @UseGuards(AuthGuard, new RolePrivilegesGuard("/admin/storage"))
    @Get()
    getAlbum(
        @Query('albumKey') albumKey: string,

        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.adminStorageService.getAlbum(albumKey, res, req)
    }

    // post
    @UseGuards(AuthGuard, new RolePrivilegesGuard("/admin/storage/create"))
    @Post("create")
    @UseInterceptors(FilesInterceptor('files[]', 10))
    createAlbum(
        @UploadedFiles() files: Express.Multer.File[],
        @Body('albumName') albumName: string,
        @Body('access') access: StorageFilesAccess,

        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.adminStorageService.createAlbum(files, albumName, access, res, req)
    }

    // delete
    @UseGuards(AuthGuard, new RolePrivilegesGuard("/admin/storage/delete"))
    @Delete("delete")
    deleteAlbum(
        @Body('albumKey') albumKey: string,
        @Body('fileKey') fileKey: string,

        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.adminStorageService.deleteAlbum(albumKey, fileKey, res, req)
    }
}