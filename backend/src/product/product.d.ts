import { CurrencyDTO } from "common/dto/currency.dto"

export type ProductForms = {
    [key: string]: string | number | boolean | Array<number, number>
}
export type ProductFilters = {
    price: [number, number],
    sellerRating: -1 | 5 | 4 | 3 | 2 | 1 | number,
    searchText?: string,

    [key: string]: any
}