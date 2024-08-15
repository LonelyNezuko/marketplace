import Cookies from 'universal-cookie'
import { notify } from '../../modules/Notify'
import { Language } from '../../modules/Language'
import { API, APISync } from '../../modules/API'
import { isValidJSON } from '../../modules/functions/isValidJSON'
import { CustomStorage } from '@modules/CustomStorage'
import UserHistory from '@modules/UserHistory'
import ProductDTO from '@dto/product.dto'

export function addProductFavorite(product: ProductDTO): boolean {
    if(!product || !product.prodID || isNaN(product.prodID) || product.prodID < 1)return false

    const accountuid = window.userdata.uid
    if(!accountuid || isNaN(accountuid)) {
        window.location.href = '#signin?desc=favorite'
        return false
    }

    const timeout = parseInt(new CustomStorage().get('favorites_ads_timeout'))
    if(timeout && !isNaN(timeout)) {
        if(+new Date > timeout) new CustomStorage().remove('favorites_ads_timeout')
        else {
            notify(Language("TIMEOUT_ERROR"))
            return false
        }
    }

    let favorites: number[] = new CustomStorage().get('favorites_ads')
    if(!favorites) favorites = []

    const index = favorites.indexOf(product.prodID)
    if(index === -1) {
        UserHistory.add('product-favorite', null, product)
        favorites.push(product.prodID)
    }
    else favorites.splice(index, 1);

    (async function() {
        const result = await APISync({
            url: '/defaultapi/user/favoriteproducts',
            type: 'put',
            data: {
                productID: product.prodID
            }
        })
        if(result.statusCode !== 200) notify(result.message, { debug: true })
    }())

    const customStorage = new CustomStorage()

    customStorage.set('favorites_ads', favorites)
    customStorage.set('favorites_ads_timeout', String(+new Date + 2000))

    return true
}