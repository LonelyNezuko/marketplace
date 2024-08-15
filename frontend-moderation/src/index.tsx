import React from 'react';
import ReactDOM from 'react-dom/client';
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Link,
    useLocation,
    Navigate
} from 'react-router-dom'
import $ from 'jquery'

import { languageInit } from './lang/_init';

import './default'
import './index.scss'
import _init_ from './init';

import Layout from '@layouts/index'

import RouteSign from '@routes/sign/sign';
// import { RouteProducts } from '@routes/products/index';
// import RouteProductsID from '@routes/products/id/id';
import { RouteErrorCode, RouteErrorCodeProps } from '@routes/errorcodes/index';
import { Language } from '@modules/Language';

import CONFIG from '@config'
import CONFIG_SERVER from '@config.server'
// import { RouteReports } from '@routes/reports/index';
// import { RouteReportsID } from '@routes/reports/id/id';
import { notify } from '@modules/Notify';
import RoleDTO from '@dto/role.dto';
import LanguageDTO from '@dto/language.dto';
import Sidebar from '@layouts/sidebar';
import RouteUsers from '@routes/users';
import { AuthTokens } from '@modules/AuthTokens';
import { API } from '@modules/API';
import GeolocationDTO from '@dto/geolocation.dto';
import RouteProducts from '@routes/products';
import RouteReports from '@routes/reports';
import RouteSupport from '@routes/support';

declare global {
    interface Window {
        userdata?: {
            uid?: number,
            geolocation?: GeolocationDTO,
            roles?: Array<RoleDTO>,
            currency?: string
        },

        languageList?: Array<LanguageDTO>,
        language?: string,

        currency: string,

        lastUpdateBtnView?: boolean,

        isAccountInfoLoaded?: boolean,
        isAccountInfoLoadedError?: boolean,

        isPhone?: boolean,

        API_refreshTokenAlreadyCheck?: boolean,
        jwtTokenExists?: boolean
    }
}

window.userdata = {}

if(AuthTokens.get().refreshToken) window.jwtTokenExists = true
window.addEventListener('customStorageUpdate', event => {
    const storage = (event as any).detail.storage
    const storageRemoved = (event as any).detail.storageRemoved

    if(storage && storage.key === 'userLanguage') window.language = storage.value
    else if(storageRemoved && storageRemoved.key === 'userLanguage') window.language = 'en'
})

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <>
        <Router>
            <Render />
        </Router>
    </>
);

function Render() {
    const location = useLocation()

    const [ loadInit, setLoadInit ] = React.useState(true)
    const [ loadLanguage, setLoadLanguage ] = React.useState(true)

    const [ errorcode, setErrorcode ] = React.useState<RouteErrorCodeProps>({
        code: 0,
        text: ''
    })

    React.useMemo(() => {
        setLoadLanguage(true)
        API({
            url: '/defaultapi/service/language/all',
            type: 'get',
            _doNotInit: true
        }).done(result => {
            if(result.statusCode === 200) {
                window.languageList = result.message
                languageInit(() => setLoadLanguage(false))
            }
            else {
                setLoadLanguage(false)
                notify('FATAL ERROR!!!\nLOADING LANGUAGE: ' + result.message, { debug: true })
            }
        })

        new Promise(_init_)
            .then(() => {
                setLoadInit(false)
            })
            .catch(e => {
                setLoadInit(false)
            })


        $(document).on('ajaxError', (event, jqXHR) => {
            console.log(jqXHR.status)
            setLoadLanguage(false)

            if(jqXHR.status === 504
                || jqXHR.status === 503) {
                setErrorcode({
                    code: jqXHR.status,
                    text: Language("504PAGE_TEXT", "error")
                })
            }
            else if(jqXHR.status === 500) {
                setErrorcode({
                    code: jqXHR.status,
                    text: Language("500PAGE_TEXT", "error")
                })
            }
            else if(jqXHR.status === 404) {
                setErrorcode({
                    code: 404,
                    text: Language("404PAGE_TEXT", "error")
                })
            }
            else if(jqXHR.status === 403) {
                setErrorcode({
                    code: 403,
                    text: Language("404PAGE_TEXT", "error")
                })
            }
            else setErrorcode({ code: 1024, text: null, classes: 'flexcenter' })
        })
    }, [])

    if(loadLanguage || loadInit)return
    return (
        <>
            {errorcode.code !== 0 ? (
                <RouteErrorCode code={errorcode.code} text={errorcode.text} fixed={true} />
            ) : ''}

            <Layout />
            <section id='rootWrapper'>
                {location.pathname.indexOf('sign') === -1 ? (<Sidebar />) : ''}
                <section id="body">
                    <Routes>
                        <Route path='/' element={<Navigate to="/dashboard" />}></Route>

                        <Route path='/products/:id?' element={<RouteProducts />}></Route>
                        <Route path='/reports/:id?' element={<RouteReports />}></Route>
                        <Route path='/support/:id?' element={<RouteSupport />}></Route>

                        {/* <Route path='/products' element={<RouteProducts moderationStatus={CONFIG.enumProductModerationStatus.PRODUCT_MODERATION_STATUS_VERIFYING} />}></Route>
                        <Route path='/products/checkeds' element={<RouteProducts moderationStatus={CONFIG.enumProductModerationStatus.PRODUCT_MODERATION_STATUS_VERIFIED} />}></Route>
                        <Route path='/products/problems' element={<RouteProducts moderationStatus={CONFIG.enumProductModerationStatus.PRODUCT_MODERATION_STATUS_PROBLEM} />}></Route>
                        <Route path='/products/banneds' element={<RouteProducts status={CONFIG.enumProductStatus.PRODUCT_STATUS_BANNED} />}></Route>
                        <Route path='/products/deleted' element={<RouteProducts status={CONFIG.enumProductStatus.PRODUCT_STATUS_DELETED} />}></Route>
                        <Route path='/products/id/:id/*' element={<RouteProductsID />}></Route>

                        <Route path='/reports' element={< RouteReports status={CONFIG.enumReportsStatus.REPORTS_STATUS_WAITING} />}></Route>
                        <Route path='/reports/you' element={< RouteReports status={CONFIG.enumReportsStatus.REPORTS_STATUS_VERIFYING} you={true} />}></Route>
                        <Route path='/reports/id/:id/*' element={< RouteReportsID />}></Route> */}

                        <Route path='/users/:userid?/product?/:productid?' element={<RouteUsers />}></Route>

                        <Route path='/sign' element={<RouteSign />}></Route>

                        <Route path='/*' element={< RouteErrorCode code={404} text={Language('404PAGE_TEXT', 'ошибка')} />}></Route>
                    </Routes>
                </section>
            </section>
        </>
    )
}
