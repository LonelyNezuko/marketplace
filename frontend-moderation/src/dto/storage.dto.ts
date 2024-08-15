import UserDTO from "./user.dto"

export interface StorageFilesDTO {
    key: string
    albumKey: string

    type: string
    path: string
    size?: number

    images?: Array<StorageFileImageDTO>
}

export interface StorageFileImageDTO {
    width: number
    name: string
    type: string

    buffer?: Buffer
    link?: string
}

export interface StorageDTO {
    id: number
    name: string
    key: string
    link: string
    albumKey: string
    type: string // image, file
    path: string
    albumLength: number
    owner: UserDTO
    access: string[]
    images: StorageFileImageDTO[]
}

export type StorageTypes = "image" | "file"
export type StorageExtendedTypes = "default" | "admin" | "moderation"
export type StorageFilesAccess = "default" | "secret" | "staff" // default - доступно всем, secret - между определенными аккаунтами и owner'ом (так же модерации/администрации), staff - между модерацией/администрацией и owner'om