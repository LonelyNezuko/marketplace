import React from 'react'
import { Link } from 'react-router-dom'

import './index.scss'
import { Language } from '@modules/Language'

interface _MarketingBlockProps {
    id: number | string,
    type: 'banner',
    style: 'vertical' | 'horizontal',
    size?: {
        width?: string,
        height?: string
    }
}

export default function _MarketingBlock({
    id,
    type,

    style,

    size = {width: '150px', height: '150px'}
}: _MarketingBlockProps) {
    const [ loader, setLoader ] = React.useState(true)

    const [ data, setData ] = React.useState<{ link?: string, image?: string }>({})
    React.useMemo(() => {
        // api
    }, [])

    return
    return (
        <div id={`_marketingblock_` + id} style={{width: size.width, minWidth: size.width, height: size.height, minHeight: size.height}} className={`_marketingblock ${type} ${style} ${!data.link ? 'empty' : ''}`}>
            {data.link ? (
                <Link to={data.link}>
                    <img src={data.image} />
                </Link>
            ) : ''}
            {!data.link ? (
                <Link to="/service/advertising">
                    <h6>{Language("MARKETING_EMPTY", "MARKETING_EMPTY")}</h6>
                </Link>
            ) : ''}
        </div>
    )
}