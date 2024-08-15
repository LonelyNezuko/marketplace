import AvatarDTO from "./avatar.dto"

export interface SavedaccountDTO {
    id: number
    name: [ string, string ]
    avatar: AvatarDTO
    email: string
    lastSign: Date
}