import { UserSessionsPlatform } from "../user.sessions/user.sessions.entity";

export interface UserSigninJWT {
    id: number,
    email: string,
    expiresDate: string | number,
    platform: UserSessionsPlatform
}