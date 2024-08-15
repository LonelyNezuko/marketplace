import ProductDTO from "./product.dto"
import UserDTO from "./user.dto"

export type CategoryForm = {
    key: string,
    type: 'input' | 'select' | 'range' | 'rangemulti',
    name: string,
    nameTranslate: {
        [key: string]: string
    },
    params: {
        type?: 'text' | 'number' | 'textarea',
        minLength?: number,
        maxLength?: number,
        list?: Array<{
            title: string,
            translate: {
                [key: string]: string
            }
        }>,
        min?: number,
        max?: number,
        step?: number
    },
    important?: boolean
}

export default interface CategoryDTO {
    categoryID: number
    categoryName: string
    categoryNameTranslate: any
    categoryForms: Array<CategoryForm>
    categoryIcon: string
    categoryBackground: string
    categoryCreator: UserDTO
    categoryCreateAt: Date
    categoryUpdateAt: Date
    categoryUpdator: UserDTO
    categorySubcategories: CategoryDTO[]
    categoryParent: CategoryDTO
    categoryLink: string
    categoryProducts: ProductDTO[]
    _deleted?: boolean,

    productsCount?: number
}