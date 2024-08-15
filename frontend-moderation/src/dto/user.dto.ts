import AvatarDTO from './avatar.dto'
import GeolocationDTO from './geolocation.dto'
import ProductDTO from './product.dto'
import RoleDTO from './role.dto'

export interface UserAuthTokens { refreshToken: string, accessToken: string }

export interface UserPrivacySettings {
    showBirthDate: 'all' | 'daymonth' | 'hide',
    showGender: boolean,
    showCity: boolean,
    canCall: boolean
}

export interface UserNotifySettings {
    showOnSite: boolean,
    soundNotify: boolean,
    notifyOnPhoneNumber: boolean,
    notifyOnEmail: boolean
}

export interface UserNotifySettingsParams {
    dialogs: boolean,
    raiting: boolean,
    reactions: boolean,
    changeProducts: boolean,
    support: boolean
}

export default interface UserDTO {
    id: number
    email: string
    emailVerify: boolean,
    emailVerifyLastSend: number,
    name: [string, string]
    phoneNumber: string
    createAt: Date
    roles: RoleDTO[]
    products: ProductDTO[]
    avatar: AvatarDTO
    rating: number
    signatureProfileText: string
    gender: number
    birthDate: string
    privacySettings: UserPrivacySettings
    lastChangePassword: Date
    authWithEmail: boolean
    authWithPhone: boolean
    notifySettings: UserNotifySettings
    notifySettingsParams: UserNotifySettingsParams
    onlineStatus: boolean
    onlineStatusDate: Date
    geolocation: GeolocationDTO,
    currency?: string,

    // banned
    banned: boolean
    bannedModerator: UserDTO
    bannedComment: string
    bannedExpires: Date

    // report banned
    reportBanned: boolean
    reportBannedModerator: UserDTO
    reportBannedComment: string
    reportBannedExpires: Date

    lastSendModerationEmailCode: Date


    productsCount?: number
    productsActiveCount?: number
    productsClosedCount?: number
    productsBannedCount?: number
    productsDeletedCount?: number
    productsForgotCount?: number
    productsProblemsCount?: number
    productsVerifyingCount?: number
    
    birthDateShow?: boolean
}

export interface UserDialogDTO {
    dialogID: number
    dialogUsers: UserDTO[]
    dialogCreateAt: Date
    dialogType: number
    dialogMessages: UserMessageDTO[]
    dialogLastMessage: UserMessageDTO

    // незабыть добавить в бэк
    dialogAvatar: AvatarDTO,
    dialogTitle: string,

    unreads: number
}

export interface UserMessageDTO {
    messageID: number
    messageDialog: UserDialogDTO
    messageSender: UserDTO
    messageAttachments: string[]
    messageText: string
    messageCreateAt: Date
    messageReaders: UserDTO[],


    _id?: number,
    _sendError?: string
}

export interface UserModerationHistoryDTO {
    id: number
    user: UserDTO
    type: UserModerationHistoryType
    createAt: Date
    moderator: UserDTO
    comment: string
    expiresDate?: Date
}

export type UserModerationHistoryType = 'ban' | 'reportBan' | 'warn' | 'unban' | 'unReportBan' | 'emailCodeVerify'