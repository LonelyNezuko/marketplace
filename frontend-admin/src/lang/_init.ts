import Cookies from 'universal-cookie'

import CONFIG from '@config'

export function languageInit(callback?: Function) {
    const cookies = new Cookies()

    let langCookies = cookies.get('lang')
    let defaultLang = { code: 'ru' }

    if(window.languageList && window.languageList.length) {
        defaultLang = window.languageList.find(elem => elem.main === true)
    }

    function setCook(code: string) {
        cookies.remove('lang', { path: '/' })
        cookies.set('lang', code, {
            expires: new Date(+new Date + ((86400 * 3) * 1000)),
            path: '/'
        })

        window.language = code
        window.languageChoiceModal = true

        if(callback) callback()
    }

    if(!langCookies) {
        let navigatorLang = window.navigator.language
        if(window.languageList && window.languageList.length) {
            window.languageList.map(item => {
                if(item.code === navigatorLang
                    || item.code.toUpperCase() === navigatorLang
                    || item.code.toLowerCase() === navigatorLang) defaultLang = item
            })
        }

        setCook(defaultLang.code)
    }
    else {
        if(window.languageList && window.languageList.length) {
            const find = window.languageList.find(elem => elem.code === langCookies)
            if(!find) {
                return setCook(defaultLang.code)
            }
        }

        window.language = langCookies
        if(callback) callback()
    }
}