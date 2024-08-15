import ProductDTO from "@dto/product.dto"
import { CustomStorage } from "./CustomStorage"
import UserHistory from "./UserHistory"
import { APISync } from "./API"
import { notify } from "./Notify"

export default async function getSimilarProducts(product: ProductDTO, currentProductsList?: ProductDTO[], takeCount?: number, ): Promise<ProductDTO[]> {
    if(!product || !product.prodID || isNaN(product.prodID))return []

    let doNotTake: number[] = []
    if(currentProductsList && currentProductsList.length) {
        doNotTake = currentProductsList.map(item => item.prodID)
    }

    const result = await APISync({
        url: '/defaultapi/product/similar',
        type: 'get',
        data: {
            productID: product.prodID,
            paginationTake: takeCount,
            doNotTake
        }
    })
    if(result.statusCode === 200)return result.message

    notify("(getSimilarProducts) /product/similar: " + result.message, { debug: true })
    return []
}