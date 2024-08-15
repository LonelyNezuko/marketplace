import { Language } from "../../../modules/Language"

export function RenderProductStatus(status: number): string {
    switch(status) {
        case 0: {
            return Language('PRODUCT_STATUS_ACTIVE', "активный")
            break
        }
        case 1: {
            return Language('PRODUCT_STATUS_CLOSED', "закрытый")
            break
        }
        case 2: {
            return Language('PRODUCT_STATUS_FORGOT', "заброшенный")
            break
        }
        case 3: {
            return Language('PRODUCT_STATUS_BANNED', "заблокированный")
            break
        }
        case 4: {
            return Language('PRODUCT_STATUS_DELETED', "удаленный")
            break
        }
    }
    return 'undefined'
}