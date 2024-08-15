import CategoryDTO from "@dto/category.dto";

export function categoryGenerateLink(category: CategoryDTO): string {
    if(!category)return '/'
    let link: string = '/' + category.categoryLink

    if(category.categoryParent) {
        link = '/' + category.categoryParent.categoryLink + link
    }
    
    return link
}