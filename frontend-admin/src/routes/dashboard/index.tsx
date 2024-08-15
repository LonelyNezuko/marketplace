import React from 'react'

import './index.scss'
import SetRouteTitle from '@modules/SetRouteTitle'
import { Language } from '@modules/Language'

export default function RouteDashboard() {
    SetRouteTitle(Language("ADMIN_ROUTE_TITLE_DASHBOARD"))

    return (
        <></>
    )
}