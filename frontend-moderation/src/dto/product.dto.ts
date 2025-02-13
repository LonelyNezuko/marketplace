import CategoryDTO, { CategoryForm } from "./category.dto"
import { CurrencyDTO } from "./currency.dto"
import GeolocationDTO from "./geolocation.dto"
import UserDTO from "./user.dto"

export type ProductForms = {
    [key: string]: string | number | boolean | [number, number]
}

export type ProductFilters = {
    price: [string, string],
    sellerRating: -1 | 5 | 4 | 3 | 2 | 1 | number,

    [key: string]: any
}

export enum enumProductStatus {
    PRODUCT_STATUS_ACTIVE = 0,
    PRODUCT_STATUS_CLOSED,
    PRODUCT_STATUS_FORGOT,
    PRODUCT_STATUS_BANNED,
    PRODUCT_STATUS_DELETED,
}
export enum enumProductModerationStatus {
    PRODUCT_MODERATION_STATUS_VERIFYING = 0,
    PRODUCT_MODERATION_STATUS_VERIFIED,
    PRODUCT_MODERATION_STATUS_PROBLEM
}

export default interface ProductDTO {
    prodID: number
    prodCategory: CategoryDTO
    prodOwner: UserDTO
    prodCreateAt: Date
    prodStatus: number
    prodStatusUpdateAt: Date
    prodModerator: UserDTO
    prodModerationStatus: number
    prodModerationComment: string
    prodModerationDate: Date
    prodForms: string | string[] | ProductForms
    prodImages: string[]
    prodDescription: string
    prodTitle: string
    prodGeo: GeolocationDTO
    prodCurrency: string
    prodPrice: number
    prodAttention: boolean
    prodViews: number,
    prodOnlyCity?: number
}

export interface ProductModerationHistoryDTO {
    id: number
    product: ProductDTO
    createAt: Date
    snapshot: ProductSnapshotDTO
    moderator: UserDTO
    moderationStatus: number
    moderationComment: string
    moderationDate: Date
}

export interface ProductSnapshotDTO {
    id: number
    product: ProductDTO
    createAt: Date
    productStatus: number
    productTitle: string
    productGeolocation: GeolocationDTO
    productCurrency: string
    productPrice: number
    productDescription: string
    productForms: ProductForms
    categoryForms: Array<CategoryForm>
}