import { storageFileURLGetKey } from "@modules/functions/storageFileURLGetKey"
import React from "react"
import { Navigate, useLocation } from "react-router-dom"
import CONFIG from '@config'
import { APISync } from "@modules/API"

interface ImageProps {
    src?: string
    alt?: string
}
export default function Image({
    src,
    alt
}: ImageProps) {
    const location = useLocation()

    const [ navigate, setNavigate ] = React.useState(null)
    React.useEffect(() => { if(navigate !== null) setNavigate(null) }, [navigate])

    const [ image, setImage ] = React.useState<any>('/assets/imageload.png')

    function onClick() {
        if(src.indexOf('http') === 0) {
            const fileKey = storageFileURLGetKey(src)
            if(fileKey && fileKey.length > 32) setNavigate(location.pathname + location.search + (location.search.length ? '&image=' : '?image=') + fileKey + location.hash)
        }
    }
    async function onLoad() {
        // let find
        // find = CONFIG.serviceStorageLinkList.find(item => {
        //     if(src.indexOf(item) === -1)return false
        //     return true
        // })

        // if(find) {
        //     src = src.replace('http://localhost:7000', '')
        //     src = src + ((src.indexOf('?') !== -1 ? '&' : '?') + 'base64=true')

        //     const result = await APISync({
        //         url: src,
        //         type: 'get',
        //         contentType: false,
        //         processData: false
        //     })

        //     if(result?.statusCode === 200) {
        //         let buffer: Buffer | string = result.message
        //         buffer = btoa(
        //             (buffer as any).data.reduce((data, byte) => data + String.fromCharCode(byte), '')
        //         );

        //         if(buffer) setImage('data:image;base64,' + buffer)
        //         else setImage('/assets/errorcodes/notfound.png')
        //     }
        //     else setImage('/assets/errorcodes/notfound.png')
        // }
        // else setImage(src)
        setImage(src)
    }

    React.useEffect(() => {
        onLoad()
    }, [src])

    return (
        <>
            {navigate ? (<Navigate to={navigate} />) : ''}
            <img src={image} alt={alt} onClick={onClick} style={{ cursor: 'pointer' }} />
        </>
    )
}