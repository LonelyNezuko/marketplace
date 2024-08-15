import { enumProductStatus } from '@dto/product.dto'
import { Language } from '@modules/Language'

export default function getProductStatusName(status: number): string {
    let statusName: string = Language("PRODUCT_STATUS_ACTIVE")

    switch(status) {
        case enumProductStatus.PRODUCT_STATUS_BANNED: {
            statusName = Language("PRODUCT_STATUS_BANNED")
            break
        }
        case enumProductStatus.PRODUCT_STATUS_CLOSED: {
            statusName = Language("PRODUCT_STATUS_CLOSED")
            break
        }
        case enumProductStatus.PRODUCT_STATUS_DELETED: {
            statusName = Language("PRODUCT_STATUS_DELETED")
            break
        }
        case enumProductStatus.PRODUCT_STATUS_FORGOT: {
            statusName = Language("PRODUCT_STATUS_FORGOT")
            break
        }
    }
    return statusName
}