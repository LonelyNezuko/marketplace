import CategoryDTO from "@dto/category.dto";
import CONFIG from '@config'

export function categoryGenerateLink(category: CategoryDTO): string {
    if(!category)return '/'
    let link: string = '/' + category.categoryLink

    if(category.categoryParent) {
        link = '/' + category.categoryParent.categoryLink + link
    }

    link = CONFIG.mainLink + link
    return link
}