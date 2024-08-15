import { enumProductModerationStatus } from '@dto/product.dto'
import { Language } from '@modules/Language'

export default function getProductModerationStatusName(status: number): string {
    let statusName: string = Language("PRODUCT_MODERATION_STATUS_VERIFYING")

    switch(status) {
        case enumProductModerationStatus.PRODUCT_MODERATION_STATUS_VERIFIED: {
            statusName = Language("PRODUCT_MODERATION_STATUS_VERIFIED")
            break
        }
        case enumProductModerationStatus.PRODUCT_MODERATION_STATUS_PROBLEM: {
            statusName = Language("PRODUCT_MODERATION_STATUS_PROBLEM")
            break
        }
    }
    return statusName
}