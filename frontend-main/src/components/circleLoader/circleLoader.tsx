import React from 'react'

import './circleLoader.scss'

interface CircleLoaderProps {
    type?: 'min' | 'big' | 'megabig',
    id?: string,
    color?: string
    style?: React.CSSProperties
}
export function CircleLoader({ type, id, color, style }: CircleLoaderProps) {
    return (
        <div className={`circleLoader circleLoaderType-${type}`} id={id || ''} style={style || {}}>
            <section>
                <span style={color ? {borderColor: color} : {}}></span>
            </section>
        </div>
    )
}