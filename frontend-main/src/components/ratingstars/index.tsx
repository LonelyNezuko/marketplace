import React from 'react'

import './index.scss'

interface RatingStarsProps {
    stars: number,
    hidecount?: boolean,
    size?: 'min'
}
export default function RatingStars({
    stars,
    hidecount = false,
    size
}: RatingStarsProps) {
    const starsRemain = parseInt((stars % 1).toFixed(1))
    return (
        <div className={`ratingstars size-${size}`}>
            {!hidecount ? (<h1 className="ratingstars-count">{stars}</h1>) : ''}
            <section className="ratingstars-stars">
                {new Array(5).fill(0).map((item, i) => {
                    if(stars > i){
                        if(stars > i && stars <= i + 1
                            && starsRemain != 0) {
                            if(starsRemain >= 0.5) {
                                return (
                                    <div key={i} className="ratingstars-image-wrap">
                                        <img className="ratingstars-image" src="/assets/rating/star_half.png" />
                                    </div>
                                )
                            }
                        }
                        else {
                            return (
                                <div key={i} className="ratingstars-image-wrap">
                                    <img className="ratingstars-image" src="/assets/rating/star_on.png" />
                                </div>
                            )
                        }
                    }

                    return (
                        <div key={i} className="ratingstars-image-wrap">
                            <img className="ratingstars-image" src="/assets/rating/star_off.png" />
                        </div>)
                })}
            </section>
        </div>
    )
}