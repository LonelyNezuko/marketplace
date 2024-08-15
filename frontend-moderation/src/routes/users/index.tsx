import React from 'react'

import './index.scss'
import RouteUsersSearchform from './searchform'
import { useLocation, useParams } from 'react-router-dom'
import { RouteErrorCode, RouteErrorCodeProps } from '@routes/errorcodes'
import UserCard from '@components/usercard'
import SetRouteTitle from '@modules/SetRouteTitle'
import { Language } from '@modules/Language'
import ProductCard from '@components/productcard'

export default function RouteUsers() {
    SetRouteTitle(Language("MODERATION_ROUTE_TITLE_USERS"))

    const params = useParams()
    const location = useLocation()

    const [ userid, setUserid ] = React.useState<number>(null)
    const [ productid, setProductid ] = React.useState<number>(null)

    React.useEffect(() => {
        if(params.userid) setUserid(parseInt(params.userid))
        else setUserid(null)

        if(params.productid) setProductid(parseInt(params.productid))
        else setProductid(null)
    }, [location])

    return (
        <div className={`route ${productid && 'productcardshow'}`} id="routeUsers">
            <RouteUsersSearchform accountSelected={parseInt(params.userid)} />

            {userid !== null ? (<UserCard userid={userid} />) : ''}
            {productid !== null ? (<ProductCard productid={productid} />) : ''}
        </div>
    )
}