import { Injectable, OnModuleInit, PipeTransform  } from "@nestjs/common";
import { StorageFileImageDto, StorageFilesDto } from "./storage.files.dto";
import random from "common/functions/random";
import sharp from "sharp";
import fs from 'fs'
import CONFIG_STORAGE from "common/configs/storage.config";

@Injectable()
export class StorageFileManager implements PipeTransform<Express.Multer.File, Promise<any>>, OnModuleInit {
    constructor() {}

    async onModuleInit() {
        if(!fs.existsSync("storage")) {
            fs.mkdirSync("storage")
            console.log('[Service.Storage.Filemanager] Folder /storage created')
        }
    }

    async upload(files: Array<Express.Multer.File>): Promise<Array<StorageFilesDto>> {
        if(!files.length)return
        if(files.length > CONFIG_STORAGE.maxFilesAlbumLength)return

        let error: boolean = false
        files.map((file: Express.Multer.File) => {
            if(CONFIG_STORAGE.mimeTypes.indexOf(file.mimetype) === -1)return error = true
            if(file.size >= CONFIG_STORAGE.maxFileSize)return error = true
        })
        if(error)return

        const outputFiles: Array<StorageFilesDto> = []
        const transform = this.transform

        const albumKey = random.textNumber(CONFIG_STORAGE.albumKeyLength) // генерация ключа альбома
        fs.mkdirSync('storage/' + albumKey) // создание папки альбома

        async function load(file: Express.Multer.File) {
            if(file.mimetype.indexOf('image/') !== -1) {
                const key = random.textNumber(CONFIG_STORAGE.fileKeyLength) // генерация ключа файла

                let imagesTrasformed: Array<TransformOutput> = await transform(file) // трансформируем изображение до нужных размеров
                imagesTrasformed = imagesTrasformed.sort((a: any, b: any) => b.width - a.width) // сортируем по размерам

                const path = 'storage/' + albumKey + '/' + key + '/' // генерируем путь до файла
                const storageImages: Array<StorageFileImageDto> = []

                imagesTrasformed.map((item: TransformOutput) => {
                    storageImages.push({
                        width: item.width,
                        name: item.width + '.' + item.type,
                        type: item.type,
                        buffer: item.buffer
                    })
                })

                fs.mkdirSync(path) // создание файла
                storageImages.map((item: StorageFileImageDto) => {
                    fs.writeFileSync(path + item.name, item.buffer)
                    delete item.buffer
                }) // создание изображений

                outputFiles.push({
                    key,
                    albumKey,
                    type: 'image',
                    path,
                    images: storageImages
                })
            }
            // else if video
            else {
                const key = random.textNumber(CONFIG_STORAGE.fileKeyLength) // генерация ключа файла

                const path = 'storage/' + albumKey + '/' + key + '/' // генерируем путь до файла

                fs.mkdirSync(path) // создание файла
                fs.writeFileSync(path + file.originalname, file.buffer) // создание файла

                outputFiles.push({
                    key,
                    albumKey,
                    type: 'file',
                    path,
                    fileName: file.originalname
                })
            }
        }

        await Promise.all(files.map(load))
        return outputFiles
    }

    async delete(albumKey: string, fileKey?: string) {
        if(!albumKey) throw new Error("[Service.Storage.FileManager.Delete] The 'albumKey' must be passed")
        if(albumKey.length !== CONFIG_STORAGE.albumKeyLength) throw new Error("[Service.Storage.FileManager.Delete] Invalid 'albumKey' was passed")
        if(fileKey && fileKey.length !== CONFIG_STORAGE.fileKeyLength) throw new Error("[Service.Storage.FileManager.Delete] Invalid 'fileKey' was passed")

        let path = 'storage/' + albumKey
        if(fileKey) path += '/' + fileKey
        
        function del(resolve, reject) {
            fs.rm(path, { recursive: true }, (err) => {
                if(err) reject(err)
                else resolve("")
            })
        }

        new Promise(del)
            .catch(err => {
                
            })
    }


    async transform(image: Express.Multer.File): Promise<Array<TransformOutput>> {
        const list: Array<TransformOutput> = []
        const type = image.mimetype.replace('image/', '')

        await Promise.all(CONFIG_STORAGE.imageWidthList.map(async function(width: number) {
            const buffer: Buffer = await sharp(image.buffer)
                .resize(width, null, {
                    fit: 'cover'
                })
                .toBuffer()
            list.push({
                buffer,
                width,
                type
            })
        }))
        return list
    }
}


interface TransformOutput {
    buffer: Buffer,
    width: number,
    type: string
}