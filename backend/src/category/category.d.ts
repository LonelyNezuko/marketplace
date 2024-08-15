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
        max?: number
    },
    important?: boolean
}