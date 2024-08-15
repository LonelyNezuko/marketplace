import { Language } from "@modules/Language"

export function RenderProductModerationStatus(status: number): string {
    switch(status) {
        case 0: {
            return Language('PRODUCT_MODERATION_STATUS_VERIFYING', "на проверке")
        }
        case 1: {
            return Language('PRODUCT_MODERATION_STATUS_VERIFIED', "проверенный")
        }
        case 2: {
            return Language('PRODUCT_MODERATION_STATUS_PROBLEM', "проблемный")
        }
    }
    return 'undefined'
}