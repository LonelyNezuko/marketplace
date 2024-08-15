import UserDTO from "./user.dto"

export default interface UpdatesDTO {
    id: number
    creator: UserDTO
    createAt: Date
    updateAt: Date
    updator: UserDTO
    where: string
    name: string
    version: string
    publishDate: Date
    background: string
    body: string
    views: number
}