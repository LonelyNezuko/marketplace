import { StorageImageDTO } from '@dto/storageImageSizes.dto'
import CONFIG from '../../config.json'

export function formatImage(url, size: StorageImageDTO) {
    if(!url.length)return
    
    let find
    find = CONFIG.serviceStorageLinkList.find(item => {
        if(url.indexOf(item) === -1)return false
        return true
    })

    if(find
        && size) {
        const newURL = new URL(url)
        url = newURL.protocol + '//' + newURL.host + newURL.pathname + '?size=' + size
    }
    return url
}