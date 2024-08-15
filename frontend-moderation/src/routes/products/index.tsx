import React from 'react'

import './index.scss'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import ProductDTO from '@dto/product.dto'
import { API, APISync } from '@modules/API'
import { RouteErrorCode, RouteErrorCodeProps } from '@routes/errorcodes'
import DotsLoader from '@components/dotsloader'
import Button from '@components/button'
import { Language } from '@modules/Language'
import { notify } from '@modules/Notify'
import UserCard from '@components/usercard'
import ProductCard from '@components/productcard'
import SetRouteTitle from '@modules/SetRouteTitle'

export default function RouteProducts() {
    const [ errorcode, setErrorcode ] = React.useState<RouteErrorCodeProps>(null)
    const [ loader, setLoader ] = React.useState(true)

    const [ navigate, setNavigate ] = React.useState(null)
    React.useEffect(() => { if(navigate !== null) setNavigate(null) }, [navigate])

    const [ productNotFound, setProductNotFound ] = React.useState(false)

    const [ productID, setProductID ] = React.useState<number>(null)
    const [ userID, setUserID ] = React.useState<number>(null)

    const params = useParams()
    const location = useLocation()

    React.useEffect(() => {
        SetRouteTitle(Language("MODERATION_ROUTE_TITLE_PRODUCTS"))
        setLoader(true)

        const id = parseInt(params.id)
        if(!id || isNaN(id)) {
            findProduct()
            return
        }

        API({
            url: '/defaultapi/moderation/product/verifying/ownerid',
            type: 'get',
            data: {
                prodID: id
            }
        }).done(result => {
            setLoader(false)
            console.log(result)
            if(result.statusCode === 200) {
                setProductID(id)
                setUserID(result.message)
            }
            else {
                if(result.statusCode === 404 || result.statusCode === 403) setErrorcode({ code: result.statusCode })
                else notify("(route.products) /moderation/product/verifying/ownerid: " + result.message, { debug: true })
            }
        })
    }, [location])


    async function findProduct() {
        const result = await APISync({
            url: '/defaultapi/moderation/product/verifying',
            type: 'get'
        })

        setLoader(false)
        if(result.statusCode === 200) {
            setNavigate('/products/' + result.message)
        }
        else {
            if(result.statusCode === 404) setProductNotFound(true)
            else if(result.statusCode === 403) setErrorcode({ code: 403 })
            else notify("(route.products.findProduct) /moderation/product/verifying: " + result.message, { debug: true })
        }
    }

    if(errorcode)return (<RouteErrorCode {...errorcode} />)
    if(loader)return (
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%', padding: '144px 0' }}>
            <DotsLoader color={"colorful"} />
        </div>
    )

    if(productNotFound)return (
        <div className="route productNotFound" id="routeProducts">
            <div className="productNotFoundWrap">
                <img src="./assets/errorcodes/productNotFound.png" />
                <section>
                    <h1>Объявлений для проверки нет</h1>
                    <span>Сейчас нет объявлений, которые необходимо проверить. Попробуйте позже</span>
                </section>
                <Link to={'/products'} reloadDocument={true}>
                    <Button name={Language("REFRESH")} size={"big"} />
                </Link>
            </div>

            {navigate ? (<Navigate to={navigate} />) : ''}
        </div>
    )
    return (
        <div className="route" id="routeProducts">
            <ProductCard productid={productID} />
            <UserCard userid={userID} />

            {navigate ? (<Navigate to={navigate} />) : ''}
        </div>
    )
}