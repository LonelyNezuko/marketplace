import { CategoryForm } from "@dto/category.dto"
import { CurrencyDTO } from "@dto/currency.dto"
import { ProductFilters } from "@dto/product.dto"

export default function CategoryFiltersSearchFind(query: Record<string, string>, categoryForms: Array<CategoryForm>): ProductFilters {
    const output: ProductFilters = {
        price: ['', ''],
        priceCurrency: '',
        sellerRating: -1
    }
    
    if(query.price_from) {
        output.price[0] = query.price_from
        delete query.price_from
    }
    if(output.price_to) {
        output.price[1] = query.price_to
        delete query.price_to
    }

    if(query.sellerRating) {
        output.sellerRating = parseInt(query.sellerRating)
        delete query.sellerRating
    }

    if(query.search) {
        output.searchText = query.search
        delete query.select
    }

    categoryForms.map((item: CategoryForm) => {
        if(query[item.key]) {
            if(item.type === 'rangemulti') {
                const val = query[item.key].split(',')
                if(val[0] && val[1] && val.length === 2) output[item.key] = val
            }
            else if(item.type === 'select') {
                const val = query[item.key].split(',')
                try {
                    if(val.length) output[item.key] = val
                }
                catch(e) {}
            }
            else if(item.type === 'range') output[item.key] = output[item.key] = [query[item.key], item.params.max]
            else output[item.key] = query[item.key]
        }
    })

    return output
}