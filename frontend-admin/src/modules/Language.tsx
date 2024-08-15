import React, { ReactNode } from 'react'
import Cookies from 'universal-cookie'
import JsxParser from 'react-jsx-parser'

import CONFIG from '@config'
import LANGUAGE_ADD from '@src/lang/add.json'

import HTMLParser from 'html-react-parser'

interface LanguageOptions {
    isjsx?: boolean
}

export function Language(selector: string, defaultText?: string, options?: LanguageOptions, ...attrs: Array<any>): any {
    if(!options) options = {}

    const defaultadd = LANGUAGE_ADD

    let list = {}
    let text

    if(window.languageList && window.languageList.length) {
        window.languageList.map(item => {
            list[item.code] = item.params
        })
    }

    if(list[window.language]
        && list[window.language][selector]) text = list[window.language][selector]
    if(!text
        && defaultadd[selector]) text = defaultadd[selector]

    if(!text) text = defaultText || selector



    if(attrs.length) {
        let replaceSymbolAttrsCount = 0

        text = text.replaceAll('%n', (symbol, i) => {
            symbol = attrs[replaceSymbolAttrsCount]
            replaceSymbolAttrsCount ++

            return symbol
        })
    }

    if(window.localStorage.getItem('_language_show_selectors_'))return selector
    
    if(!options.isjsx)return text
    return (
        <>
            {HTMLParser(text)}
        </>
    )
}