import CategoryDTO from "@dto/category.dto";
import ProductDTO from "@dto/product.dto";
import { CustomStorage } from "./CustomStorage";
import { API } from "./API";
import { notify } from "./Notify";

interface StorageList {
    date: Date
    id?: number
    text?: string
}
export default class UserHistory {
    public static add(
        type: 'product-view' | 'product-favorite' | 'product-message' | 'category-view' | 'search',

        category?: CategoryDTO,
        product?: ProductDTO,
        searchText?: string
    ) {
        if(type !== 'product-favorite' && type !== 'product-view' && type !== 'category-view' && type !== 'search' && type !== 'product-message') {
            throw new Error("[UserHistory.add] Incorrect data [type]")
        }
        
        if((type === 'product-favorite' || type === 'product-view' || type === 'product-message')
            && (!product || !product.prodID)) {
            throw new Error("[UserHistory.add] The 'productID' must be specified for this 'type'")
        }
        if((type === 'category-view')
            && (!category || !category.categoryID)) {
            throw new Error("[UserHistory.add] The 'categoryID' must be specified for this 'type'")
        }
        if((type === 'search')
            && (!searchText || !searchText.length)) {
            throw new Error("[UserHistory.add] The 'searchText' must be specified for this 'type'")
        }

        if(type === 'product-message' && !window.jwtTokenExists)return

        const customStorage = new CustomStorage()
        if(window.jwtTokenExists || type === 'product-message') {
            API({
                url: '/defaultapi/user/history/add',
                type: 'put',
                data: {
                    type,
                    categoryID: category ? category.categoryID : null,
                    productID: product ? product.prodID : null,
                    searchText
                }
            }).done(result => {
                if(result.statusCode !== 200) notify("(UserHistory.add) /user/history/add: " + result.message, { debug: true })
            })
        }
        else addToStorage()

        function addToStorage() {
            const storageID = type === 'product-favorite' ? 'history_productFavorites' : type === 'product-view' ? 'history_productViews' : type === 'category-view' ? 'history_categoryViews' : 'history_searchTexts'
            const addID = type === 'product-favorite' || type === 'product-view' ? product.prodID : type === 'category-view' ? category.categoryID : searchText

            let list: StorageList[] = customStorage.get(storageID)

            if(!list || !list.map || !list.find) list = []
            else {
                if(type !== 'search') {
                    const finded = list.find(item => item.id === addID)
                    if(finded && +new Date(finded.date) >= +new Date(+new Date()-(60000 * 60 * 24)))return

                    list.push({ date: new Date(), id: (addID as number) })
                }
                else {
                    if(list.find(item => item.text === addID))return
                    list.push({ date: new Date(), text: (addID as string) })
                }
            }

            customStorage.set(storageID, list)
        }
    }

    public static update() {
        const customStorage = new CustomStorage()

        let productViews: StorageList[] = customStorage.get('history_productViews')
        let productFavorites: StorageList[] = customStorage.get('history_productFavorites')
        let categoryViews: StorageList[] = customStorage.get('history_categoryViews')
        let searchTexts: StorageList[] = customStorage.get('history_searchTexts')

        if(productViews && productViews.filter) {
            productViews = productViews.filter(item => item.date && item.id)
            if(!productViews.length) productViews = null
        }
        if(productFavorites && productFavorites.filter) {
            productFavorites = productFavorites.filter(item => item.date && item.id)
            if(!productFavorites.length) productFavorites = null
        }
        if(categoryViews && categoryViews.filter) {
            categoryViews = categoryViews.filter(item => item.date && item.id)
            if(!categoryViews.length) categoryViews = null
        }
        if(searchTexts && searchTexts.filter) {
            searchTexts = searchTexts.filter(item => item.date && item.text)
            if(!searchTexts.length) searchTexts = null
        }
        if(!productViews && !productFavorites && !categoryViews && !searchTexts)return

        API({
            url: '/defaultapi/user/history/update',
            type: 'put',
            data: {
                productViews,
                productFavorites,
                categoryViews,
                searchTexts
            }
        }).done(result => {
            if(result.statusCode !== 200) notify("(UserHistory.update) /user/history/update: " + result.message, { debug: true })
            else {
                customStorage.set('history_searchTexts', result.message.searchTexts)
            }
        })

        UserHistory.clear()
    }

    public static clear() {
        const customStorage = new CustomStorage()

        customStorage.remove('history_productViews')
        customStorage.remove('history_productFavorites')
        customStorage.remove('history_categoryViews')
        customStorage.remove('history_searchTexts')
    }

    public static get get() {
        const customStorage = new CustomStorage()

        return {
            productViews: customStorage.get('history_productViews') as StorageList,
            productFavorites: customStorage.get('history_productFavorites') as StorageList,
            categoryViews: customStorage.get('history_categoryViews') as StorageList,
            searchTexts: customStorage.get('history_searchTexts') as StorageList,
        }
    }
}