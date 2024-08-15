export default interface APIDto {
    url: string,
    type: 'get' | 'post' | 'delete' | 'put' | 'patch',
    data?: {
        [key: string]: any
    },
    headers?: {
        authorization?: string,
        'verify-codes'?: string,
        'lang'?: string,

        [key: string]: any
    },

    processData?: any,
    contentType?: any,
    dataType?: any,

    _doNotInit?: boolean,
    _refreshToken?: boolean
}

export interface APIResult {
    statusCode: number,
    message: any
}

export type APIDoneCallback = (result?: APIResult) => void
export type APIFailCallback = (error?: any) => void

export interface APIReturnObject {
    done?(callback: APIDoneCallback): void
    fail?(callback: APIFailCallback): void
}