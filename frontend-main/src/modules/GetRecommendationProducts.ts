import ProductDTO from "@dto/product.dto"
import { CustomStorage } from "./CustomStorage"
import UserHistory from "./UserHistory"
import { APISync } from "./API"
import { notify } from "./Notify"

export default async function getRecommendationProducts(currentProductsList?: ProductDTO[], takeCount?: number, doNotTake?: number[]): Promise<ProductDTO[]> {
    const customStorage = new CustomStorage()
    const historyData = UserHistory.get

    if(!doNotTake) doNotTake = []
    if(currentProductsList && currentProductsList.length) {
        doNotTake = [...doNotTake, ...currentProductsList.map(item => item.prodID)]
    }

    const result = await APISync({
        url: '/defaultapi/user/recommendation',
        type: 'get',
        data: {
            client_geolocation: customStorage.get('userGeolocation'),
            client_productViews: historyData.productViews,
            client_productFavorites: historyData.productFavorites,
            client_categoryViews: historyData.categoryViews,
            client_searchTexts: historyData.searchTexts,
            paginationTake: takeCount,
            doNotTake
        }
    })
    if(result.statusCode === 200)return result.message

    notify("(getRecommendationProducts) /user/recommendation: " + result.message, { debug: true })
    return []
}