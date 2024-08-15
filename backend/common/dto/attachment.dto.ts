export interface AttachmentDTO {
    type: 'image' | 'video' | 'file'
    url: string
}


export function AttachmentVerify(attachment: AttachmentDTO): boolean {
    if(!attachment.type || !attachment.url)return false
    if(attachment.type !== 'image' && attachment.type !== 'video')return false

    return true
}