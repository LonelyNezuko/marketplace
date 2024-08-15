import Gateway from "@modules/Gateway"
import { languageInit } from "./lang/_init"
import API_loadUserData from "@modules/API/loadUserData"

export default async function _init_(resolve) {
    languageInit()
    if(window.location.hash && window.location.hash.length) {
        // window.location.href = window.location.pathname + window.location.search
    }

    await API_loadUserData()
    Gateway.init('moderation')

    resolve()
}