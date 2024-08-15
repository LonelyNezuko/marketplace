import ProductDTO from "./product.dto"
import { ModerationReportDTO } from "./report.dto"
import { ModerationSupportDTO } from "./support.dto"
import UserDTO from "./user.dto"

export default interface UserNotificationsDTO {
    id: number
    forUser: UserDTO
    creator: UserDTO
    type: UserNotificationsType
    name: string
    previewAvatar: string
    text: string
    attachedProduct: ProductDTO
    attachedUser: UserDTO
    attachedReport: ModerationReportDTO
    attachedSupport: ModerationSupportDTO
    createAt: Date
    viewAt: Date

    isRead?: boolean
    isNew?: boolean,
    link?: string
}

export type UserNotificationsType = "system" | "incomingdialogmessage" | "accountBanned" | "accountReportBanned"
    | "accountUnBanned" | "accountUnReportBanned" | "accountWarn"
    | "productBanned" | "productDeleted" | "productModStatusProblem"
    | "reportClosed" | 'reportOpened' | 'supportClosed' | 'supportOpened'