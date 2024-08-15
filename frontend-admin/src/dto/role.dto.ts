import UserDTO from "./user.dto"

export default interface RoleDTO {
    roleID: number
    key: string
    index: number
    createAt: Date
    updateAt: Date
    privileges: string[]
    name: string
    nameTranslate: any
    color: string[]

    createUser?: UserDTO
    usersList?: UserDTO[],
    usersCount?: number
}