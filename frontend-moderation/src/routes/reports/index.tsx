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
import ReportCard from '@components/reportcard'
import ProductCard from '@components/productcard'
import SetRouteTitle from '@modules/SetRouteTitle'

export default function RouteReports() {
    const [ errorcode, setErrorcode ] = React.useState<RouteErrorCodeProps>(null)
    const [ loader, setLoader ] = React.useState(true)

    const [ navigate, setNavigate ] = React.useState(null)
    React.useEffect(() => { if(navigate !== null) setNavigate(null) }, [navigate])

    const [ productNotFound, setProductNotFound ] = React.useState(false)

    const [ reportID, setReportID ] = React.useState<number>(null)

    const [ userID, setUserID ] = React.useState<number>(null)
    const [ productID, setProductID ] = React.useState<number>(null)

    const params = useParams()
    const location = useLocation()

    React.useEffect(() => {
        setLoader(true)
        SetRouteTitle(Language("MODERATION_ROUTE_TITLE_REPORTS"))

        const id = parseInt(params.id)
        if(!id || isNaN(id)) {
            findReport()
            return
        }

        SetRouteTitle(Language("MODERATION_ROUTE_TITLE_REPORTS_ID"))
        API({
            url: '/defaultapi/moderation/report/open/subject',
            type: 'get',
            data: {
                reportID: id
            }
        }).done(result => {
            setLoader(false)
            if(result.statusCode === 200) {
                setReportID(id)

                setProductID(result.message.product)
                setUserID(result.message.user)
            }
            else {
                if(result.statusCode === 404 || result.statusCode === 403) setErrorcode({ code: result.statusCode })
                else notify("(route.reports) /moderation/report/open/subject: " + result.message, { debug: true })
            }
        })
    }, [params.id])


    async function findReport() {
        const result = await APISync({
            url: '/defaultapi/moderation/report/open',
            type: 'get'
        })

        setLoader(false)
        if(result.statusCode === 200) {
            setNavigate('/reports/' + result.message)
        }
        else {
            if(result.statusCode === 404) setProductNotFound(true)
            else if(result.statusCode === 403) setErrorcode({ code: 403 })
            else notify("(route.reports.findReport) /moderation/report/open: " + result.message, { debug: true })
        }
    }

    if(errorcode)return (<RouteErrorCode {...errorcode} />)
    if(loader)return (
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%', padding: '144px 0' }}>
            <DotsLoader color={"colorful"} />
        </div>
    )

    if(productNotFound)return (
        <div className="route productNotFound" id="routeReports">
            <div className="productNotFoundWrap">
                <img src="./assets/errorcodes/productNotFound.png" />
                <section>
                    <h1>{Language("MODERATION_REPORTS_EMPTY")}</h1>
                    <span>{Language("MODERATION_REPORTS_EMPTY_DESC")}</span>
                </section>
                <Link to={'/reports'} reloadDocument={true}>
                    <Button name={Language("REFRESH")} size={"big"} />
                </Link>
            </div>

            {navigate ? (<Navigate to={navigate} />) : ''}
        </div>
    )
    return (
        <div className="route" id="routeReports">
            {reportID ? (<ReportCard reportID={reportID} />) : ''}

            {userID ? (<UserCard userid={userID} />) : ''}
            {productID ? (<ProductCard productid={productID} />) : ''}

            {navigate ? (<Navigate to={navigate} />) : ''}
        </div>
    )
}