import Gateway from "@modules/Gateway"
import { languageInit } from "./lang/_init"
import API_initUser from "@modules/API/loadUserData"
import store from "./store"
import { emailVerifySetState } from "./store/emailVerify"

export default async function _init_(resolve) {
    languageInit()
    // if(window.location.hash && window.location.hash.length) {
    //     window.location.href = window.location.pathname + window.location.search
    // }

    await API_initUser()
    resolve()

    Gateway.init('user')
    Gateway.on('user', 'onEmailVerified', () => store.dispatch(emailVerifySetState(true)))
}