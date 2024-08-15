import { Language } from "@modules/Language"

export function renderCurrencyIcon(currency) {
    if(!currency.length)return Language("ANY_CURRENCY")

    let format = new Intl.NumberFormat('en', {
        style: "currency",
        currency: currency
    }).format(NaN)

    format = format.replace('NaN', '')

    return format
}