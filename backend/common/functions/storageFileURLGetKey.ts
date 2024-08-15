import CONFIG_STORAGE from "common/configs/storage.config"

export function storageFileURLGetKey(url: string): string {
    let key = url.replace(/(?:http|https):\/\/[\s\S]+\/defaultapi\/service\/storage\//gm, "")
    if(key.length !== CONFIG_STORAGE.fileKeyLength) key = key.slice(0, CONFIG_STORAGE.fileKeyLength)

    return key
}