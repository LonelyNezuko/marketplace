import GeolocationDTO from "./geolocation.dto"
import UserDTO from "./user.dto"

export interface UserSessionsDTO {
    sessionID: number
    sessionUser: UserDTO
    sessionCreateAt: Date
    sessionAgent: string
    sessionIP: string
    sessionGeo: GeolocationDTO
    refreshToken: string
    sessionPlatform: UserSessionsPlatform
    
    isCurrent?: boolean
}

export type UserSessionsPlatform = "site" | "moderation" | "admin" | "mobileapp"