import CategoryDTO from "@dto/category.dto";

export function categoryParentJSONParse(category: CategoryDTO): CategoryDTO {
    if(category.categorySubcategories) {
        category.categorySubcategories.map((cat: any, i: number) => {
            if(cat.categorySubcategories) {
                cat.categorySubcategories.map((cat2: any, b: number) => {
                    cat2.categoryParent.categoryParent = JSON.parse(cat2.categoryParent.categoryParent)
                })
            }
            else cat.categoryParent.categoryParent = JSON.parse(cat.categoryParent.categoryParent)
        })
    }
    else if(category.categoryParent) {
        let tmp: any = category.categoryParent.categoryParent
        category.categoryParent.categoryParent = JSON.parse(tmp)
    }

    return category
}