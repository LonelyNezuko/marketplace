import React from 'react'

import './index.scss'
import { useSwipeable } from 'react-swipeable'

interface PhoneTopHideProps {
    onHide: () => void,
    delta?: number
}
export default function PhoneTopHide({
    onHide,
    delta = 15
}: PhoneTopHideProps) {
    const swipeToHideInfo = useSwipeable({
        onSwipedDown: () => {
            onHide()
        },
        delta
    })

    if(!window.isPhone)return
    return (
        <div className="_phoneTopHide_" onClick={onHide} {...swipeToHideInfo}>
            <section></section>
        </div>
    )
}