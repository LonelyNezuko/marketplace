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

export const roleDefaultUser: RoleDTO = {
    roleID: -1,
    key: '_user_',
    index: -1,
    createAt: new Date(),
    updateAt: new Date(),
    privileges: [],
    name: '_ROLENAME_USER_',
    nameTranslate: null,
    color: [ '#7c7c7c', 'white' ],
}