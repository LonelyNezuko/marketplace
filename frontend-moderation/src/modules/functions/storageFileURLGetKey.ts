export function storageFileURLGetKey(url: string): string {
    let key = url.replace(/(?:http|https):\/\/[\s\S]+\/defaultapi\/service\/storage\//gm, "")
    return key
}