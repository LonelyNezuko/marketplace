import React from 'react'

import { Language } from '../modules/Language'

interface OnlineStatusProps {
    status: boolean
}
export default function OnlineStatus({
    status
}: OnlineStatusProps) {
    if(!status)return (<div className="_onlinestatus_ offline">{Language("OFFLINE")}</div>)
    return (<div className="_onlinestatus_ online">{Language("ONLINE")}</div>)
}