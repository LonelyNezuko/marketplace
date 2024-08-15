import React from 'react'
import './avatar.scss'

import { formatImage } from '@modules/functions/formatImage'
import AvatarDTO from '@dto/avatar.dto'
import { StorageImageDTO } from '@dto/storageImageSizes.dto'

interface AvatarProps extends AvatarDTO {
    type?: 'medium' | 'big' | 'megabig' | 'ultrabig' | 'min'
    circle?: boolean

    classname?: string

    code?: React.JSX.Element
    onlinestatus?: boolean

    reRender?: boolean

    sizeImage?: StorageImageDTO
}

export function Avatar({
    image,
    
    position,
    size,

    type,
    circle,

    classname,

    code,
    onlinestatus,

    reRender = false,

    sizeImage = 90
}: AvatarProps) {
    let imgStyle: { left?: string, top?: string, width?: string, height?: string } = {}

    if(position) {
        imgStyle.left = position.x + '%'
        imgStyle.top = position.y + '%'
    }
    if(size) {
        imgStyle.width = size + '%'
        imgStyle.height = size + '%'
    }

    const [ _reRender, _setReRender ] = React.useState(false)
    React.useEffect(() => {
        if(reRender) _setReRender(true)
    }, [position])
    React.useEffect(() => {
        if(_reRender) _setReRender(false)
    }, [_reRender])

    return (
        <div className={`
            avatar
            ${type ? 'avatar-' + type : ''}
            ${[classname ? classname : '']}
            ${onlinestatus ? 'onlinestatus-' + 'online' : ''}
            ${circle ? `circle` : ''}
        `}>
            {_reRender}
            <div className="avatarWrapper">
                <img src={formatImage(image, sizeImage)} alt="Avatar" style={imgStyle} />
            </div>
            {code ? code : ''}
        </div>
    )
}

