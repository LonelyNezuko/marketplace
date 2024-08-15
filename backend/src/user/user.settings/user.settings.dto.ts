import { UserNotifySettings, UserNotifySettingsParams, UserPrivacySettings, UserSecuritySettings } from "../user.entity"

export interface UserUpdateDataDTO {
    signatureProfileText: string,
    name: string
    gender: number
    birthDate: number
    privacySettings: UserPrivacySettings
    securitySettings: UserSecuritySettings
    notifySettings: UserNotifySettings
    notifySettingsParams: UserNotifySettingsParams
}