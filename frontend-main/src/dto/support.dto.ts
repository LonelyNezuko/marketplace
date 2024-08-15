import { AttachmentDTO } from "./attachment.dto"
import ProductDTO from "./product.dto"
import UserDTO from "./user.dto"

export interface ModerationSupportDTO {
    id: number
    creator: UserDTO
    status: ModerationSupportStatus
    createAt: Date
    updateAt: Date
    type: ModerationSupportType
    moderator: UserDTO
    moderatorSelectAt: Date
    reason: string
}

export interface ModerationSupportMessageDTO {
    id: number
    support: ModerationSupportDTO
    sender: UserDTO
    createAt: Date
    senderModerator: boolean
    senderSystem: boolean
    text: string
    attachments: AttachmentDTO[]
    attachProduct?: ProductDTO
    attachUser?: UserDTO
}

export type ModerationSupportType = "account" | "product" | "other"
export type ModerationSupportStatus = "open" | "closed"



// frontend only
export interface ConfigModerationSupportReason {
    key: string
    name: string
    type: ModerationSupportType

    list?: ConfigModerationSupportReason[]

    searchAccount?: boolean
    selectProduct?: boolean
}