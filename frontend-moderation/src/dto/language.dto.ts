import UserDTO from "./user.dto"

export default interface LanguageDTO {
    id: number
    name: string
    code: string
    active: boolean
    main: boolean
    added: UserDTO
    createAt: Date
    params: any
    _deleted: boolean
    _example: boolean
}