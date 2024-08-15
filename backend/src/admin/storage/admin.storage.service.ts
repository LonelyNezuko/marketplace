import { Injectable, OnModuleInit } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { InjectRepository } from "@nestjs/typeorm";
import CONFIG_STORAGE from "common/configs/storage.config";
import isValidJSON from "common/functions/isValidJSON";
import templateResponse from "common/templates/response.tp";
import { Request, Response } from "express";
import { Storage } from "src/__service/storage/storage.entity";
import { StorageFilesAccess } from "src/__service/storage/storage.files.dto";
import { StorageService } from "src/__service/storage/storage.service";
import { LogsService } from "src/logs/logs.service";
import { Repository } from "typeorm";

@Injectable()
export class AdminStorageService implements OnModuleInit {
    constructor(
        @InjectRepository(Storage)
        private readonly storageRepository: Repository<Storage>,

        private readonly moduleRef: ModuleRef
    ) {}

    private storageService: StorageService
    private logsService: LogsService

    async onModuleInit() {
        this.storageService = this.moduleRef.get(StorageService, { strict: false })
        this.logsService = this.moduleRef.get(LogsService, { strict: false })
    }

    // get
    async getAlbum(
        albumKey: string,

        res?: Response,
        req?: Request
    ) {
        const albumList = await this.getAlbumList()
        const album = albumList.find(album => album.albumKey === albumKey)

        if(!album) {
            templateResponse(res, "Album with this 'albumKey' not found", 404)
            return
        }

        templateResponse(res, album, 200)
        return album
    }

    async getAlbumList(
        res?: Response,
        req?: Request
    ) {
        const albums = await this.storageRepository.find({
            where: {
                extendedType: 'admin'
            },
            relations: {
                owner: true
            }
        })

        let prevAlbumMap: Storage
        const albumSort = albums.map((album) => {
            if(prevAlbumMap
                && prevAlbumMap.albumKey === album.albumKey)return

            prevAlbumMap = album
            return {
                albumKey: album.albumKey,
                albumLength: album.albumLength,
                albumName: album.albumName,
                albumCreateAt: album.albumCreateAt,
                owner: album.owner,
                access: album.access,
                files: albums.filter(item => item.albumKey === album.albumKey).map(file => {
                    file.link = CONFIG_STORAGE.link + file.key

                    if(file.type === 'image') {
                        file.images.map(image => {
                            image.link = CONFIG_STORAGE.link + file.key + '?size=' + image.width
                        })
                    }
                    return file
                })
            }
        }).filter(album => album)

        templateResponse(res, albumSort, 200)
        return albumSort
    }

    // post
    async createAlbum(
        files: Express.Multer.File[],
        albumName: string,
        access: StorageFilesAccess,

        res: Response,
        req: Request
    ) {
        if(!files || !albumName || !access) {
            return templateResponse(res, "Fields should not be empty (files, albumName, access)", 400)
        }
        if(files.length > CONFIG_STORAGE.maxFilesAlbumLength) {
            return templateResponse(res, "Max files 10", 400)
        }

        if(albumName.length < 4 || albumName.length > 24) {
            return templateResponse(res, "Incorrect data [albumName]", 400)
        }

        if(access !== 'default'
            && access !== 'staff') {
            return templateResponse(res, "Incorrect data [access]", 400)
        }

        const storage = await this.storageService.createFile(access, files, 'admin', null, albumName, null, req)
        if(!storage || !storage.length) {
            return templateResponse(res, "Failed to upload files", 500)
        }

        this.logsService.create('user', `Создал новый альбом. Ключ: ${storage[0].albumKey} Файлов: ${storage[0].albumLength}`, {
            userData: req['user']
        })
        templateResponse(res, storage[0].albumKey, 200)
    }

    // delete
    async deleteAlbum(
        albumKey: string,
        fileKey: string,

        res: Response,
        req: Request
    ) {
        if(!albumKey) {
            return templateResponse(res, "Fields should not be empty (albumKey)", 400)
        }
        if(albumKey.length !== CONFIG_STORAGE.albumKeyLength) {
            return templateResponse(res, "Incorrect data [albumKey]", 400)
        }

        if(fileKey && fileKey.length !== CONFIG_STORAGE.fileKeyLength) {
            return templateResponse(res, "Incorrect data [fileKey]", 400)
        }

        const album = await this.getAlbum(albumKey)
        if(!album) {
            return templateResponse(res, "Album with this 'albumKey' not found", 404)
        }

        if(fileKey) {
            const file = album.files.find(file => file.key === fileKey)
            if(!file) {
                return templateResponse(res, "File with this 'fileKey' in current album not found", 404)
            }
        }

        if(!await this.storageService.deleteFile(fileKey, albumKey, null, req)) {
            return templateResponse(res, `The ${!fileKey ? 'album' : 'file'} could not be deleted`, 500)
        }

        this.logsService.create('user', `Удалил файл/альбом. Ключ альбома: ${albumKey}. Ключ файла: ${fileKey}`, {
            userData: req['user']
        })
        templateResponse(res, "", 200)
    }
}