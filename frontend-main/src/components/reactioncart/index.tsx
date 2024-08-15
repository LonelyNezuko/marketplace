import React from 'react'
import { Link } from 'react-router-dom'

import Moment from 'moment'
import 'moment/min/locales'

import { Avatar } from '@components/avatar/avatar'

import './index.scss'
import RatingStars from '@components/ratingstars'
import AvatarDTO from '@dto/avatar.dto'

interface ReactionCartProps {
    profilelink: string,
    avatar: AvatarDTO,
    name: [string, string],
    createAt: Date,
    text?: string,
    stars?: number
}
export default function ReactionCart({
    profilelink = '/account',
    avatar = { image: '/assets/avatars/default.png', size: 100, position: { x: 0, y: 0 } },
    name = [ 'Name', 'Surname' ],
    createAt = new Date(),
    text = 'reaction text',
    stars = 0
}: ReactionCartProps) {
    Moment.locale(window.language)

    return (
        <div className="reactioncart">
            <Link to={profilelink} className="reactioncart-top">
                <Avatar image={avatar.image} size={avatar.size} position={avatar.position} />
                <div className="title">
                    <div className="name">
                        <h1>{name[0] + ' ' + name[1]}</h1>
                    </div>
                    <div className="date">
                        <h1>{Moment(createAt).fromNow()}</h1>
                    </div>
                </div>
            </Link>
            <div className="reactioncart-description">
                <div className="reactioncart-description-block">
                    <div className="title">Рейтинг</div>
                    <section className="section">
                        <RatingStars stars={stars} />
                    </section>
                </div>
                <div className="reactioncart-description-block">
                    <div className="title">Отзыв</div>
                    <section className="section">
                        <h1 style={{marginBottom: "8px"}}>{text}</h1>
                    </section>
                </div>
            </div>
        </div>
    )
}

export function ReactionCartLoaderDiv() {
    return (
        <div className="reactioncart">
            <div className="reactioncart-top">
                <div className="_loaderdiv" style={{width: "50px", height: "50px", borderRadius: "8px"}}></div>
                <div className="title">
                    <div className="name">
                        <div className="_loaderdiv" style={{width: "130px", height: "20px"}}></div>
                    </div>
                    <div className="date">
                    <div className="_loaderdiv" style={{width: "90px", height: "14px"}}></div>
                    </div>
                </div>
            </div>
            <div className="reactioncart-description">
                <div className="reactioncart-description-block">
                <div className="_loaderdiv" style={{width: "110px", height: "16px"}}></div>
                    <section className="section" style={{marginTop: "8px"}}>
                        <div className="_loaderdiv" style={{width: "240px", height: "30px"}}></div>
                    </section>
                </div>
                <div className="reactioncart-description-block">
                    <div className="_loaderdiv" style={{width: "110px", height: "16px"}}></div>
                    <section className="section" style={{marginTop: "8px"}}>
                        <div className="_loaderdiv" style={{width: "90%", height: "20px"}}></div>
                    </section>
                </div>
            </div>
        </div>
    )
}