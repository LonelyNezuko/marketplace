import { UserAuthTokens } from "@dto/user.dto";
import { CustomStorage } from "./CustomStorage";

export class AuthTokens {
    static set(refreshToken: string, accessToken: string, session?: boolean) {
        const customStorage = new CustomStorage()
        if(session) {
            window.sessionStorage.setItem('__refreshToken', refreshToken)
            window.sessionStorage.setItem('__accessToken', accessToken)
        }
        else {
            customStorage.set('__refreshToken', refreshToken)
            customStorage.set('__accessToken', accessToken)
        }

        window.jwtTokenExists = true
    }

    static get(): UserAuthTokens {
        const customStorage = new CustomStorage()
        const resposeTokens: UserAuthTokens = {
            refreshToken: null,
            accessToken: null
        }

        resposeTokens.refreshToken = customStorage.get('__refreshToken')
        resposeTokens.accessToken = customStorage.get('__accessToken')

        if(!resposeTokens.refreshToken) resposeTokens.refreshToken = window.sessionStorage.getItem('__refreshToken')
        if(!resposeTokens.accessToken) resposeTokens.accessToken = window.sessionStorage.getItem('__accessToken')

        return resposeTokens
    }

    static clear() {
        window.jwtTokenExists = false
        const customStorage = new CustomStorage()

        customStorage.remove('__refreshToken')
        customStorage.remove('__accessToken')

        window.sessionStorage.removeItem('__refreshToken')
        window.sessionStorage.removeItem('__accessToken')

        customStorage.set('userRoles', [])
        customStorage.set('uid', -1)
        customStorage.remove('favorites_ads')

        customStorage.remove('history_productViews')
        customStorage.remove('history_productFavorites')
        customStorage.remove('history_categoryViews')
    }
}