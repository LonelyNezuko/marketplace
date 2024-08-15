import { notify } from "@modules/Notify"
import $ from 'jquery'

import CONFIG from '@config'

import Cookies from "universal-cookie"
import { API, APISync } from "."
import { APIResult } from "./index.dto"
import UserDTO from "@dto/user.dto"
import { isValidJSON } from "@modules/functions/isValidJSON"
import UserInfoDTO from "@dto/userInfo.dto"
import { CustomStorage } from "@modules/CustomStorage"
import store from "@src/store"
import { emailVerifySetState } from "@src/store/emailVerify"

let isStart = false
export default async function API_initUser() {
    if((window.isAccountInfoLoaded
        || isStart)
        && window.userdata.uid === -1 && window.jwtTokenExists) {
        window.isAccountInfoLoaded = false
        isStart = false
    }

    if(window.isAccountInfoLoadedError
        || window.isAccountInfoLoaded
        || isStart)return

    if(window.userdata.banned === undefined || window.userdata.reportBanned === undefined) {
        API({
            url: '/defaultapi/user/getbanned',
            type: 'get',
            _doNotInit: true
        }).done(result => {
            if(result.statusCode === 200) {
                window.userdata.banned = result.message.banned
                window.userdata.reportBanned = result.message.reportBanned
            }
            else {
                window.userdata.banned =
                window.userdata.reportBanned = false
            }
        })
    }
    
    isStart = true
    const customStorage = new CustomStorage()

    window.userdata.roles = customStorage.get('userRoles')
    window.userdata.uid = customStorage.get('uid')
    window.userdata.currency = customStorage.get('userCurrency')
    window.userdata.geolocation = customStorage.get('userGeolocation')
    window.userdata.mapRadius = customStorage.get('userMapRadius')

    if(customStorage.get('userEmailVerify')) store.dispatch(emailVerifySetState(customStorage.get('userEmailVerify')))

    if(window.userdata.uid
        && window.userdata.uid !== -1
        && !window.jwtTokenExists) {
        window.userdata.uid = -1
        window.userdata.roles = []

        customStorage.set('uid', -1)
        customStorage.set('userRoles', [])
        
        store.dispatch(emailVerifySetState(false))
    }

    if(!window.userdata.mapRadius) {
        window.userdata.mapRadius = 1
        customStorage.set('userMapRadius', 1)
    }
    
    if(!window.userdata.roles
        || !window.userdata.uid
        || (window.userdata.uid === -1 && window.jwtTokenExists)
        || !window.userdata.currency
        || !window.userdata.geolocation
        || customStorage.get('userEmailVerify') === undefined
    ) {
        const result = await APISync({
            url: '/defaultapi/user/siteInit',
            type: 'get',
            _doNotInit: true
        })

        if(result.statusCode === 200) {
            window.userdata.uid = result.message.uid
            window.userdata.roles = result.message.roles
            window.userdata.geolocation = result.message.geolocation

            const currency = result.message.currency
            if(currency && currency.length && CONFIG.currencyList.find(item => item.code === currency)) {
                customStorage.set('userCurrency', currency)
                window.userdata.currency = currency
            }
            else {
                customStorage.set('userCurrency', CONFIG.defaultCurrency)
                window.userdata.currency = CONFIG.defaultCurrency
            }

            customStorage.set('userRoles', window.userdata.roles)
            customStorage.set('uid', window.userdata.uid)
            customStorage.set('userCurrency', window.userdata.currency)
            customStorage.set('userGeolocation', window.userdata.geolocation)
            customStorage.set('favorites_ads', result.message.favoriteProducts)

            customStorage.set('userEmailVerify', result.message.emailVerify)
            store.dispatch(emailVerifySetState(result.message.emailVerify))

            if(result.message.searchHistory) {
                customStorage.set('userSearchHistory', result.message.searchHistory)
            }
        }
        else {
            notify('(API.CheckJWT) /user/siteInit: ' + result.message, { debug: true })
            window.isAccountInfoLoadedError = true
        }
    }
    else if(window.jwtTokenExists) {
        await APISync({
            url: '/defaultapi/user/jwtcheck',
            type: 'get'
        })
    }

    window.isAccountInfoLoaded = true
}