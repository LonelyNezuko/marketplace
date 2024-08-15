import React from 'react'
import { CircleLoader } from '@components/circleLoader/circleLoader'

import './index.scss'

export interface ModalLoaderProps {
    text?: string,
    toggle?: boolean
}
export default function ModalLoader({
    text
}: ModalLoaderProps) {
    return (
        <div className={`modal loader ${text && 'withtext'}`}>
            <div className="wrap">
                <CircleLoader type="big" color={`var(--tm-color)`} />
                {text ? (<span className="text">{text}</span>) : ''}
            </div>
        </div>
    )
}