import React from 'react'

import './index.scss'
import { FaFile } from 'react-icons/fa6'
import { formatText } from '@modules/functions/formatText'

import CONFIG from '@config'
import floatToInt from '@modules/functions/floatToInt'
import Button from '@components/button'
import { IoClose } from 'react-icons/io5'
import { APISync } from '@modules/API'

interface FileProps {
    src: string
    
    name?: string
    weight?: number

    size?: 'normal' | 'big'
    nameLength?: number

    isEdit?: boolean
    onDeleteFile?(): void
}
export default function File({
    src,

    name,
    weight,

    size = 'normal',
    nameLength,

    isEdit = false,
    onDeleteFile
}: FileProps) {
    const [ weightFormat, setWeightFormat ] = React.useState<string>(weight ? floatToInt(weight) + ' b.' : null)
    React.useEffect(() => {
        if(weight) {
            if(weight < CONFIG.mbtobyte) {
                setWeightFormat(floatToInt(weight / 1024) + ' kb.')
            }
            if(weight >= CONFIG.mbtobyte && weight < CONFIG.mbtobyte * 1024) {
                setWeightFormat(floatToInt(weight / CONFIG.mbtobyte) + ' mb.')
            }
            else if(weight >= CONFIG.mbtobyte * 1024) {
                setWeightFormat(floatToInt(weight / (CONFIG.mbtobyte * 1024)) + ' gb.')
            }
        }
    }, [weight])

    // async function downloadFile() {
    //     if(!src)return

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
    //         // buffer = btoa(
    //         //     (buffer as any).data.reduce((data, byte) => data + String.fromCharCode(byte), '')
    //         // );

    //         console.log(buffer)
    //     }
    // }

    return (
        <div className={`blockfile size-${size}`} onClick={() => {
            // if(src) downloadFile()
            if(src) window.open(src, "_blank")
        }}>
            <FaFile />
            {name || weight ? (
                <div className="information">
                    <span className="name">{formatText(name, nameLength || 12) || ''}</span>
                    {weight ? (
                        <span className="weight">{weightFormat}</span>
                    ) : ''}
                </div>
            ) : ''}

            {isEdit ? (
                <Button icon={<IoClose />} onClick={() => {
                    onDeleteFile?.()
                }} classname='deleteFile' type={'transparent'} size={"min"} />
            ) : ''}
        </div>
    )
}