import React from 'react'

import './index.scss'
import { Link, Navigate, useParams } from 'react-router-dom'
import Button from '@components/button'
import DotsLoader from '@components/dotsloader'
import { API } from '@modules/API'
import { Language } from '@modules/Language'

export default function RouteEmailVerify() {
    const params = useParams()

    const [ navigate, setNavigate ] = React.useState(null)
    React.useEffect(() => { if(navigate !== null) setNavigate(null) }, [navigate])

    const [ loader, setLoader ] = React.useState(false)
    const [ expiresOut, setExpiresOut ] = React.useState(false)
    const [ emailVerifyAlready, setEmailVerifyAlready ] = React.useState(false)

    React.useMemo(() => {
        const hash = params.hash
        if(!hash) {
            return setNavigate('/')
        }

        setLoader(true)
        setExpiresOut(false)
        setEmailVerifyAlready(false)

        API({
            url: '/defaultapi/user/settings/emailverify',
            type: 'put',
            data: {
                hash
            }
        }).done(result => {
            if(result.statusCode === 200) {
                setLoader(false)
            }
            else {
                if(result.statusCode === 408) {
                    setExpiresOut(true)
                    setLoader(false)
                }
                else if(result.message === 'The mail has already been confirmed') {
                    setEmailVerifyAlready(true)
                    setLoader(false)
                }
                else setNavigate('/')
            }
        })
    }, [])

    return (
        <div className="route" id="routeEmailVerify">
            {loader ? (
                <div className="block loaderblock">
                    <div className="loader">
                        <DotsLoader size={"big"} color={"colorful"} />
                    </div>
                    <h6 className="title">{Language("ROUTE_EMAILVERIFY_LOADER_TITLE")}</h6>
                    <span className="description">{Language("ROUTE_EMAILVERIFY_LOADER_DESCRIPTION")}</span>
                </div>
            ) : ''}

            {!loader && expiresOut ? (
                <div className="block expiresoutblock">
                    <div className="icon">
                        <img src="/assets/errorcodes/408.png" />
                    </div>
                    <h6 className="title">{Language("ROUTE_EMAILVERIFY_EXPIRESOUT_TITLE")}</h6>
                    <span className="description">{Language("ROUTE_EMAILVERIFY_EXPIRESOUT_DESCRIPTION")}</span>
                </div>
            ) : ''}

            {!loader && emailVerifyAlready ? (
                <div className="block alreadyblock">
                    <div className="icon">
                        <img src="/assets/errorcodes/408.png" />
                    </div>
                    <h6 className="title">{Language("ROUTE_EMAILVERIFY_ALREADY_TITLE")}</h6>
                    <span className="description">{Language("ROUTE_EMAILVERIFY_ALREADY_DESCRIPTION")}</span>
                    <Link to="/">
                        <Button name={Language("ROUTE_EMAILVERIFY_ACTION")} size={"big"} />
                    </Link>
                </div>
            ) : ''}

            {!loader && !expiresOut && !emailVerifyAlready ? (
                <div className="block">
                    <div className="icon">
                        <img src="/assets/other/routeEmailVerifySuccess.png" />
                    </div>
                    <h6 className="title">{Language("ROUTE_EMAILVERIFY_TITLE")}</h6>
                    <span className="description">{Language("ROUTE_EMAILVERIFY_DESCRIPTION")}</span>
                    <Link to="/">
                        <Button name={Language("ROUTE_EMAILVERIFY_ACTION")} size={"big"} />
                    </Link>
                </div>
            ) : ''}

            {navigate ? (<Navigate to={navigate} />) : ''}
        </div>
    )
}