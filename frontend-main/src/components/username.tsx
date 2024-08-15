import React from 'react'

import { Language } from '../modules/Language'
import UserDTO from '@dto/user.dto'

interface UsernameProps {
    account: UserDTO,

    hideStatus?: boolean,

    size?: 'min' | 'normal' | 'big'
}
export default function Username({
    account,

    hideStatus = false,

    size
}: UsernameProps) {
    if(!account)return (<></>)
    return (
        <div className={`_username_ ${size}`}>
            <h5>{account.name[0] + " " + account.name[1]}</h5>
            
            {/* расскоментировать и малоизменить, когда в UserDTO будет bot и verification */}
            {/* {(account.bot && !hideStatus) ? (
                <span className="bot" data-content={Language("USERNAME_VERIFIED_CONTENT")}></span>
            ) : ''}
            {(account.verification && !hideStatus) ? (
                <span className="verification" data-content={Language("USERNAME_BOT_CONTENT")}></span>
            ) : ''} */}
        </div>
    )
}