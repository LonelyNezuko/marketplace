import { Controller, Get, Param, Req, Res, Post, UseGuards, Body, HttpStatus, Query } from "@nestjs/common";
import { Delete, UploadedFile, UploadedFiles, UseInterceptors } from "@nestjs/common/decorators";
import { ParseFilePipe, ParseFilePipeBuilder } from "@nestjs/common/pipes";
import { StorageService } from "./storage.service";
import { Request, Response } from "express";
import { AuthGuard } from "common/guards/authGuard";
import { FilesInterceptor } from "@nestjs/platform-express";
import { MulterModule } from "@nestjs/platform-express/multer";
import templateResponse from "common/templates/response.tp";
import { StorageFileManager } from "./storage.filemanager";
import { StorageFilesAccess, StorageFilesDto, StorageFilesExtendedType } from "./storage.files.dto";
import isValidJSON from "common/functions/isValidJSON";
import { RolePrivilegesGuard } from "common/guards/rolePrivilegesGuard";
import { User } from "src/user/user.entity";
import { GetUserReq } from "common/guards/getUserReq";

@Controller('defaultapi/service/storage')
export class StorageController {
    constructor(
        private readonly storageService: StorageService,
        private readonly storageFileManager: StorageFileManager
    ) {}

    // get
    @UseGuards(GetUserReq)
    @Get('/filedata/:key')
    getFileData(
        @Param('key') key: string,
        @Query('onlyImage') onlyImage: boolean,

        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.storageService.getFileData(key, res, req, onlyImage)
    }

    @UseGuards(GetUserReq)
    @Get(':key')
    getStorage(
        @Param('key') key: string,

        @Res() res: Response,
        @Req() req: Request,

        @Query('size') size?: any,
        @Query('base64') base64?: boolean
    ) {
        return this.storageService.getFile(res, req, key, size, base64)
    }

    // post
    @Post('/upload')
    @UseGuards(AuthGuard)
    @UseInterceptors(FilesInterceptor('files[]', 10))
    async uploadFile(
        @Body('access') access: StorageFilesAccess,
        @Body('accessUsers') accessUsers: User[],

        @Res() res: Response,
        @Req() req: Request,

        @UploadedFiles() files: Array<Express.Multer.File>,
        @Body('extendedType') extendedType?: StorageFilesExtendedType
    ) {
        return this.storageService.createFile(access, files, extendedType, accessUsers, null, res, req)
    }

    // // delete
    // @Delete('/delete')
    // @UseGuards(AuthGuard, new RolePrivilegesGuard("/admin/storage/delete"))
    // async deleteFile(
    //     @Body('fileKey') fileKey: string,

    //     @Res() res: Response,
    //     @Req() req: Request
    // ) {
    //     return this.storageService.deleteFile(fileKey, res, req)
    // }
}