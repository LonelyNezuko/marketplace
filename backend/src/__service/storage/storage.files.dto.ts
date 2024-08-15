import { Storage } from "./storage.entity"

export class StorageFilesDto {
    key: string
    albumKey?: string

    albumLength?: number
    link?: string

    type: StorageFilesTypes
    path?: string
    size?: number

    images?: Array<StorageFileImageDto>
    fileName?: string
}

export class StorageFileImageDto {
    width: number
    
    name?: string
    type?: string

    buffer?: Buffer
    link?: string
}

export interface StorageFileData extends Storage {
    albumFiles: Storage[]
}

export type StorageFilesTypes = "image" | "file"
export type StorageFilesExtendedType = "default" | "admin" | "moderation"
export type StorageFilesAccess = "default" | "secret" | "staff" // default - доступно всем, secret - между определенными аккаунтами и owner'ом (так же модерации/администрации), staff - между модерацией/администрацией и owner'om