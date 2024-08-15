import ProductDTO from "./product.dto"
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
    createAt: Date
    viewAt: Date
}

export type UserNotificationsType = "system"