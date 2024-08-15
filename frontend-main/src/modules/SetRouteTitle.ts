import CONFIG from '@config'

export default function SetRouteTitle(title?: string) {
    if(title) document.title = title + " | " + CONFIG.defaultTitleName + " - " + CONFIG.serviceSlogan
    else document.title = CONFIG.defaultTitleName + " - " + CONFIG.serviceSlogan
}