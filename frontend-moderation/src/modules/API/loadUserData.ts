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
import { AuthTokens } from "@modules/AuthTokens"

let isStart = false
export default async function API_loadUserData() {
    if(window.location.pathname === '/sign')return
    if((window.isAccountInfoLoaded
        || isStart)
        && window.userdata.uid === -1 && window.jwtTokenExists) {
        window.isAccountInfoLoaded = false
        isStart = false
    }

    if(window.isAccountInfoLoadedError
        || window.isAccountInfoLoaded
        || isStart)return
    
    isStart = true
    const customStorage = new CustomStorage()

    window.userdata.roles = customStorage.get('userRoles')
    window.userdata.uid = customStorage.get('uid')
    window.userdata.geolocation = customStorage.get('userGeolocation')
    window.userdata.currency = customStorage.get('userCurrency')

    if(!window.jwtTokenExists) {
        customStorage.remove('uid')
        customStorage.remove('userRoles')
        customStorage.remove('userGeolocation')
        customStorage.remove('userCurrency')

        AuthTokens.clear()
        return window.location.href = '/sign'
    }
    
    if(window.jwtTokenExists) {
        const results = await APISync({
            url: '/defaultapi/moderation/verifyaccess',
            type: 'get'
        })

        if(results.statusCode !== 200) {
            AuthTokens.clear()
            return window.location.href = '/sign'
        }
    }

    if(!window.userdata.roles
        || !window.userdata.uid
        || window.userdata.uid === -1
        || !window.userdata.geolocation
        || !window.userdata.currency
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
            window.userdata.currency = result.message.currency

            customStorage.set('userRoles', window.userdata.roles)
            customStorage.set('uid', window.userdata.uid)
            customStorage.set('userGeolocation', window.userdata.geolocation)
            customStorage.set('userCurrency', window.userdata.currency)
        }
        else {
            notify('(API.CheckJWT) /user/siteInit: ' + result.message, { debug: true })
            window.isAccountInfoLoadedError = true

            customStorage.remove('uid')
            customStorage.remove('userRoles')
            customStorage.remove('userGeolocation')
            customStorage.remove('userCurrency')

            AuthTokens.clear()
            return window.location.href = '/sign'
        }
    }

    window.isAccountInfoLoaded = true
}