import $ from 'jquery'
import parseQuery from 'parse-query'

import Address from "@components/address"
import { Avatar } from "@components/avatar/avatar"
import Button from "@components/button"
import MapLeaflet from "@components/mapLeaflet"
import { Modal } from "@components/modals"
import RatingStars from "@components/ratingstars"
import Username from "@components/username"
import ProductDTO from "@dto/product.dto"
import { Language } from "@modules/Language"
import { LatLng } from "leaflet"
import React from "react"
import { Link, useLocation } from "react-router-dom"
import Cookies from 'universal-cookie'
import { Alert } from '@components/alert'
import { notify } from '@modules/Notify'
import Input from '@components/input'
import { API } from '@modules/API'
import { CircleLoader } from '@components/circleLoader/circleLoader'
import { RouteErrorCodeProps } from '@routes/errorcodes'
import UserCart from '@components/usercart'

interface RouteProductOwnerDataProps {
    product: ProductDTO,

    setNavigate: React.Dispatch<any>,
    setErrorPage: React.Dispatch<React.SetStateAction<RouteErrorCodeProps>>
}
export default function RouteProductOwnerData({
    product,

    setNavigate,
    setErrorPage
}: RouteProductOwnerDataProps) {
    const [ mapToggle, setMapToggle ] = React.useState(window.isPhone ? false : true)

    return (
        <div className="routeProductOwnerData">
            <section className="wrap">
                <UserCart account={product.prodOwner} type={"mini"} />
            </section>

            {window.isPhone ? (
                <Button type={"border"} selected={mapToggle} name={Language(mapToggle ? "PRODUCT_ID_MAP_HIDE" : "PRODUCT_ID_MAP_SHOW")}
                    onClick={() => setMapToggle(!mapToggle)}
                />
            ) : ''}

            {mapToggle ? (
                <MapLeaflet position={new LatLng(product.prodGeo.lat, product.prodGeo.lng)} disabled={true} radius={product.prodOnlyCity && 10} hideMarker={product.prodOnlyCity && true} />
            ) : ''}
        </div>
    )
}