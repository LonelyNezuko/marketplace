import React from 'react'

import './index.scss'
import { Link } from 'react-router-dom'
import UserDTO from '@dto/user.dto'
import { Avatar } from '@components/avatar/avatar'
import Username from '@components/username'

interface UserCartDefaultProps {
    type: 'mini'
}

interface UserCartProps extends UserCartDefaultProps {
    account: UserDTO
    linkTo?: boolean
}
export default function UserCart({
    account,
    type,
    linkTo = true
}: UserCartProps) {

    if(type === 'mini')return (
        <Link to={linkTo ? "/profile/" + account.id : null} className="usercart type-mini">
            <Avatar {...account.avatar} type="medium" onlinestatus={account.onlineStatus} />
            <div className="desc">
                <Username account={account} size={"normal"} />
                <div className={`onlinestatus ${account.onlineStatus ? 'online' : ''}`}>{account.onlineStatus ? 'Online' : 'Offline'}</div>
                {/* <div className="rating">
                    <RatingStars stars={account.rating} />
                </div> */}
            </div>
        </Link>
    )
}

export function UserCartLoader({
    type
}: UserCartDefaultProps) {

    if(type === 'mini')return (
        <div className="usercart type-mini _loaderdiv_" style={{ background: 'transparent' }}>
            <div className='_loaderdiv' style={{ width: '64px', minWidth: '64px', height: '64px', borderRadius: '8px' }}></div>
            <div className="desc">
                <div className='_loaderdiv' style={{ width: '60%', height: '24px', borderRadius: '6px' }}></div>
                <div className='_loaderdiv' style={{ width: '40%', height: '18px', borderRadius: '12px', marginTop: '6px' }}></div>
            </div>
        </div>
    )
}