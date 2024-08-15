import $ from 'jquery'
import Cookies from 'universal-cookie';
import CONFIG from '@config'
import CONFIG_SERVER from '@config.server'
import { notify } from '../Notify'

import APIDto, { APIDoneCallback, APIFailCallback, APIResult, APIReturnObject } from './index.dto';
import { Alert } from '@components/alert';
import { Language } from '@modules/Language';
import { CustomStorage } from '@modules/CustomStorage';
import { UserAuthTokens } from '@dto/user.dto';
import React from 'react';
import { AuthTokens } from '@modules/AuthTokens';
import API_loadUserData from './loadUserData';

function _setSettigs(params: APIDto): APIDto {
    let APIHostName = process.env.REACT_APP_DEFAULTAPI_URL
    if(params.url.indexOf('/defaultapi') === 0
        && window.location.hostname !== 'localhost'
        && window.location.hostname.indexOf("192.168.0.") === -1) APIHostName = CONFIG_SERVER.PROXY_DEFAULTAPI_URL

    params.url = APIHostName + params.url
    if(!params.headers) params.headers = {}

    if(!params.headers.authorization
        && window.jwtTokenExists) params.headers.authorization = 'Bearer ' + AuthTokens.get().accessToken
    if(!params.headers['verify-codes']) params.headers['verify-codes'] = JSON.stringify(new CustomStorage().get('verifycodes'))
    if(!params.headers['lang']) params.headers['lang'] = window.language

    return params
}
function _request(params: APIDto) {
    const customStorage = new CustomStorage()

    return new Promise((resolve, reject) => {
        $.ajax(params)
            .done((result: APIResult, status, hxr) => {
                if(result.statusCode === 401
                    && result.message === 'Need to refresh token') {
                    window.API_refreshTokenAlreadyCheck = true
                    params.headers.authorization = 'Refresh ' + AuthTokens.get().refreshToken

                    $.ajax(params)
                        .done((result: APIResult, status, xhr) => {
                            const newTokens: UserAuthTokens = (result as any).jwtNewTokens
                            if(newTokens
                                && newTokens.accessToken
                                && newTokens.refreshToken) {
                                const session: boolean = customStorage.get('__refreshToken') ? false : window.sessionStorage.getItem('__refreshToken') ? true : false
                                AuthTokens.set(newTokens.refreshToken, newTokens.accessToken, session)
                            }
                            else {
                                AuthTokens.clear()
                                return window.location.href = '/sign'
                            }

                            resolve(result)
                        })
                        .fail(error => {
                            Alert(Language("UNDEFINED_ERROR_OPEN_CONSOLE"))
                            console.error('[API Refresh] Fail', error)

                            reject(error)
                        })
                }
                else if(result.statusCode === 423 && result.message === 'You are banned') {
                    AuthTokens.clear()
                    resolve(result)
                }
                else resolve(result)

                const verifycodes = hxr.getResponseHeader('verify-codes')
                if(verifycodes) new CustomStorage().set('verifycodes', verifycodes)
            })
            .fail(error => {
                Alert(Language("UNDEFINED_ERROR_OPEN_CONSOLE"))
                console.error('[API] Fail. StatusCode: ' + error.status, error)

                reject(error)
            })
    })
}

export function API(params: APIDto): APIReturnObject {
    params = _setSettigs(params)

    const request = _request(params)
    async function doneCallback(callback?: APIDoneCallback) {
        if(!callback)return

        await request
            .then((result: APIResult) => {
                callback?.(result)
            })
            .catch(err => {
                callback?.({ statusCode: err.statusCode, message: err.statusText })
            })
    }

    return {
        done: doneCallback
    }
}
export async function APISync(params: APIDto): Promise<APIResult> {
    params = _setSettigs(params)

    const request = _request(params)
    let returnResult: APIResult = null

    await request
        .then((result: APIResult) => {
            returnResult = result
        })
        .catch(err => {
            returnResult = { statusCode: err.statusCode, message: err.statusText }
        })
    
    return returnResult
}