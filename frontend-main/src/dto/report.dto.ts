import { AttachmentDTO } from "./attachment.dto"
import ProductDTO from "./product.dto"
import UserDTO from "./user.dto"

export interface ModerationReportDTO {
    id: number
    creator: UserDTO
    status: ModerationReportStatus
    createAt: Date
    updateAt: Date
    type: ModerationReportType
    userEntity: UserDTO
    productEntity: ProductDTO
    moderator: UserDTO
    moderatorSelectAt: Date
    reason: string
}

export interface ModerationReportMessageDTO {
    id: number
    report: ModerationReportDTO
    sender: UserDTO
    createAt: Date
    senderModerator: boolean
    senderSystem: boolean
    text: string
    attachments: AttachmentDTO[]
}

export type ModerationReportType = "user" | "product"
export type ModerationReportStatus = "open" | "closed"