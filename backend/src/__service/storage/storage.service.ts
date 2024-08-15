import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Storage } from "./storage.entity";
import { FindOptionsWhere, In, Not, Repository } from "typeorm";
import { LogsService } from "src/logs/logs.service";
import { ModuleRef } from "@nestjs/core";
import { Request, Response } from "express";
import { StorageFileData, StorageFileImageDto, StorageFilesAccess, StorageFilesDto, StorageFilesExtendedType } from "./storage.files.dto";
import { Product } from "src/product/product.entity";
import CONFIG_STORAGE from "common/configs/storage.config";
import templateResponse from "common/templates/response.tp";
import fs from 'fs'
import { StorageFileManager } from "./storage.filemanager";
import { User } from "src/user/user.entity";
import { RolePrivilegesVerify } from "common/functions/rolePrivilegesVerify";
import { UserService } from "src/user/user.service";

@Injectable()
export class StorageService implements OnModuleInit {
    constructor(
        @InjectRepository(Storage)
        private readonly storageRepository: Repository<Storage>,

        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        
        private readonly storageFileManager: StorageFileManager,
        
        private readonly moduleRef: ModuleRef
    ) {}

    private logsService: LogsService
    private userService: UserService

    async onModuleInit() {
        this.logsService = this.moduleRef.get(LogsService, { strict: false })
        this.userService = this.moduleRef.get(UserService, { strict: false })
    }


    async getFile(
        res: Response,
        req: Request,

        key: string,

        size?: any,
        base64?: boolean
    ) {
        if(!key) {
            return templateResponse(res, 'Fields should not be empty (key)', 400)
        }
        if(key.length !== 64) {
            return templateResponse(res, 'Incorrect data [key]', 400)
        }

        if(size) {
            size = parseInt(size)
            if(isNaN(size)) {
                return templateResponse(res, 'Incorrect data [key]', 400)
            }
        }

        const fileBase: Storage = await this.storageRepository.findOne({
            where: {
                key
            },
            relations: {
                accessUsers: true,
                owner: true
            }
        })
        if(!fileBase) {
            return templateResponse(res, 'File with key not found', 404)
        }

        const pathToForbiddenAsset = 'common/assets/forbidden.png'
        const rootPath = __dirname + '../../../../../'

        if(!this.isFileAccess(fileBase, req['user'])) {
            if(base64)return templateResponse(res, fs.readFileSync(pathToForbiddenAsset), 200)
            return res.sendFile(pathToForbiddenAsset, { root: rootPath })
        }
        if(size && fileBase.type !== 'image') {
            return templateResponse(res, 'The file is not an image', 404)
        }

        let path = ''
        let imageType = ''

        if(fileBase.type === 'image') {
            if(!fileBase.images.length) {
                return templateResponse(res, 'The image was not found', 404)
            }

            path = fileBase.path + fileBase.images[0].name
            imageType = fileBase.images[0].type

            fileBase.images.map((image: StorageFileImageDto) => {
                if(image.width === size) {
                    path = fileBase.path + image.name
                    imageType = image.type
                }
            })
        }
        else if(fileBase.type === 'file') {
            if(!fileBase.fileName) {
                return templateResponse(res, 'The file was not found', 404)
            }

            path = fileBase.path + fileBase.fileName
        }

        if(!path.length
            || (fileBase.type === 'image' && !imageType.length)) {
            return templateResponse(res, 'The file path was not found', 404)
        }

        if(base64)return templateResponse(res, fs.readFileSync(path), 200)

        if(fileBase.type === 'file') res.download(path)
        else res.sendFile(path, { root: rootPath })
    }

    async getFileData(
        key: string,

        res?: Response,
        req?: Request,

        onlyImage?: boolean
    ): Promise<StorageFileData> {
        if(!key) {
            templateResponse(res, 'Fields should not be empty (key)', 400)
            return
        }
        if(key.length !== 64) {
            templateResponse(res, 'Incorrect data [key]', 400)
            return
        }

        const fileBase: Storage = await this.storageRepository.findOne({
            where: {
                key
            },
            relations: {
                accessUsers: true,
                owner: true
            }
        })

        if(!fileBase) {
            templateResponse(res, 'File with key not found', 404)
            return
        }
        if(req && (!req['user'] || !this.isFileAccess(fileBase, req['user']))) {
            templateResponse(res, 'Forbidden', 403)
            return
        }
        if(onlyImage
            && fileBase.type !== 'image') {
            templateResponse(res, 'This is not image', 404)
            return
        }

        delete fileBase.access
        delete fileBase.accessUsers
        delete fileBase.extendedType
        delete fileBase.images
        delete fileBase.path
        delete fileBase.type

        fileBase.albumLength = await this.storageRepository.count({
            where: {
                albumKey: fileBase.albumKey
            }
        })

        const albumFiles = await this.storageRepository.find({
            where: {
                albumKey: fileBase.albumKey
            },
            relations: {
                accessUsers: true,
                owner: true
            }
        })

        albumFiles.map(file => {
            delete file.access
            delete file.accessUsers
            delete file.extendedType
            delete file.images
            delete file.path
            delete file.type

            file.albumLength = fileBase.albumLength
        })

        templateResponse(res, { ...fileBase, albumFiles }, 200)
        return { ...fileBase, albumFiles }
    }

    async createFile(
        access: StorageFilesAccess,
        files: Array<Express.Multer.File>,

        extendedType: StorageFilesExtendedType = 'default',

        accessUsers?: User[],
        albumName?: string,

        res?: Response,
        req?: Request,

        otherParams?: {
            albumKey?: string
        }
    ): Promise<StorageFilesDto[]> {
        if(!access || !files) {
            templateResponse(res, "Fields should not be empty (access, files)", 400)
            return
        }

        if(!res && !req) {
            throw new Error("[Service.Storage.createFile] The 'request' was not passed from the 'user'")
        }

        if(extendedType !== 'default'
            && extendedType !== 'admin'
            && extendedType !== 'moderation') {
            templateResponse(res, "Inccorect data [extendedType]", 400)
            return
        }
        if(access !== 'default'
            && access !== 'secret'
            && access !== 'staff') {
            templateResponse(res, "Inccorect data [access]", 400)
            return
        }

        if(access === 'secret'
            && !accessUsers) {
            templateResponse(res, "When specifying 'access', 'accessUsers' must be passed", 400)
            return
        }
        if(access !== 'secret'
            && accessUsers) {
            templateResponse(res, "Passing 'accessUsers' without 'access=secret' doesnt make any sense", 400)
            return
        }

        let accessUsersList: User[]
        if(accessUsers) {
            if(!accessUsers.length) {
                templateResponse(res, "Inccorect data [access]", 400)
                return
            }

            let accessUsersIDs: number[] = []
            accessUsers.map((user: User) => {
                if(user.id) accessUsersIDs.push(user.id)
            })

            accessUsersIDs = accessUsersIDs.filter(id => id !== req['user'].id)
            if(!accessUsersIDs.length) {
                templateResponse(res, "Inccorect data [access]", 400)
                return
            }

            accessUsersList = await this.userRepository.find({
                where: {
                    id: In(accessUsersIDs)
                }
            })
            if(!accessUsersList) {
                templateResponse(res, "The transferred 'accessUsers' were not found", 404)
                return
            }
        }

        let filesList: Array<StorageFilesDto>
        try {
            filesList = await this.storageFileManager.upload(files)
        }
        catch(e) {
            console.error(e)

            templateResponse(res, "Failed to upload files", 500)
            return
        }

        if(!filesList || !filesList.length) {
            templateResponse(res, "Failed to upload files", 500)
            return
        }

        const repository = this.storageRepository
        const output: StorageFilesDto[] = []

        async function load(file: StorageFilesDto) {
            await repository.insert({
                key: file.key,
                albumKey: otherParams && otherParams.albumKey ? otherParams.albumKey : file.albumKey,
                type: file.type,
                path: file.path,
                albumLength: files.length,
                owner: req['user'],
                access,
                accessUsers: accessUsersList,
                images: file.images,
                extendedType,
                albumName,
                fileName: file.fileName
            })

            let data: StorageFilesDto = {
                type: file.type,
                albumLength: files.length,
                albumKey: file.albumKey,
                key: file.key,
                link: CONFIG_STORAGE.link + file.key
            }

            if(file.type === 'image') {
                data.images = []
                file.images.map((image: StorageFileImageDto) => {
                    data.images.push({
                        link: CONFIG_STORAGE.link + file.key + '?size=' + image.width,
                        width: image.width
                    })
                })
            }
            else if(file.type === 'file') {
                data.fileName = file.fileName
            }

            output.push(data)
        }
        await Promise.all(filesList.map(load))

        templateResponse(res, output, 200)
        return output
    }

    async deleteFile(
        fileKey?: string,
        albumKey?: string,

        res?: Response,
        req?: Request,

        _system?: boolean
    ): Promise<boolean> {
        if(!fileKey && !albumKey) {
            if(res)return templateResponse(res, "There must be either an 'albumKey' or a 'fileKey'", 400)
            else throw new Error("[Service.Storage.deleteFile] There must be either an 'albumKey' or a 'fileKey'")
        }

        if(fileKey && fileKey.length !== CONFIG_STORAGE.fileKeyLength) {
            if(res)return templateResponse(res, "Incorrect data [fileKey]", 400)
            else throw new Error("[Service.Storage.deleteFile] Invalid 'fileKey' was passed")
        }
        if(albumKey && albumKey.length !== CONFIG_STORAGE.albumKeyLength) {
            if(res)return templateResponse(res, "Incorrect data [albumKey]", 400)
            else throw new Error("[Service.Storage.deleteFile] Invalid 'albumKey' was passed")
        }

        const file = await this.storageRepository.findOne({
            where: {
                albumKey, key: fileKey
            }
        })
        if(!file) {
            templateResponse(res, "The file was not found for the current query", 404)
            return false
        }

        albumKey = file.albumKey
        fileKey = file.key

        if(!_system) {
            const user: User = req['user']
            if(!user) {
                throw new Error("[Service.Storage.deleteFile] 'Request' with 'user' data was not passed")
            }

            if(file.extendedType === 'moderation') {
                templateResponse(res, "You cannot delete this file", 403)
                return false
            }
            if(file.extendedType === 'admin'
                && !RolePrivilegesVerify('/admin/storage/delete', req)) {
                templateResponse(res, "You cannot delete this file", 403)
                return false
            }
            if(file.extendedType === 'default'
                && !RolePrivilegesVerify('/admin/storage/delete', req)
                && file.owner.id !== user.id) {
                templateResponse(res, "You cannot delete this file", 403)
                return false
            }
        }

        try {
            await this.storageFileManager.delete(albumKey, file.albumLength > 1 && fileKey)
        }
        catch(e) {
            console.error(e)

            templateResponse(res, "The file could not be deleted", 500)
            return false
        }

        if(fileKey) {
            await this.storageRepository.delete({
                id: file.id
            })
            if(file.albumLength > 1) {
                await this.storageRepository.update({
                    albumKey
                }, {
                    albumLength: file.albumLength - 1
                })
            }
        }
        else await this.storageRepository.delete({
            albumKey
        })

        templateResponse(res, "", 200)
        return true
    }


    isFileAccess(file: Storage, user: User): boolean {
        return true
        if(file.access !== 'default'
            && !user) {
            return false
        }
        const staff = RolePrivilegesVerify('/admin/*', { user } as any) || RolePrivilegesVerify('/moderation/*', { user } as any)

        if(file.access === 'secret'
            && (file.accessUsers.length
                || file.owner.id !== user.id)) {
            const find = file.accessUsers.find(user => user.id === user.id)
            if(!find && !staff) {
                return false
            }
        }
        else if(file.access === 'staff'
            && (file.owner.id !== user.id
                && !staff)) {
            return false
        }

        return true
    }
}