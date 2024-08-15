import React, { ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Link,
    useLocation,
    Navigate,
    useParams
} from 'react-router-dom'
import $ from 'jquery'
import Cookies from 'universal-cookie'

import { languageInit } from './lang/_init';

import _init_ from './init';
import './default'
import './index.scss'

import Layout from '@layouts/index'

import { RouteErrorCode, RouteErrorCodeProps } from './routes/errorcodes/index';
import { Language } from './modules/Language';

import CONFIG from '@config'
import CONFIG_SERVER from '@config.server'
import RouteHome from '@routes/home/index';
import Footer from '@layouts/footer';
import RouteProduct from '@routes/product/index';
import RoutePlacead from '@routes/placead/index';
import RouteAccount from '@routes/account/index';
import { notify } from '@modules/Notify';
import { API, APISync } from '@modules/API';
import { Avatar } from '@components/avatar/avatar';
import Input from '@components/input/index';
import RouteProfile from '@routes/profile/index';

import { MdBrowserUpdated } from "react-icons/md";
import { RolePrivilegesVerifyIndexOf } from '@modules/RolePrivilegesVerify';
import RouteCategory from '@routes/category/index';
import RoleDTO from '@dto/role.dto';
import RouteFeed from '@routes/feed';
import Sidebar from '@layouts/sidebar';
import StaffHeader from '@layouts/staffheader';
import SetRouteTitle from '@modules/SetRouteTitle';
import BottomNavigate from '@layouts/bottomNavigate';
import LanguageDTO from '@dto/language.dto';
import DotsLoader from '@components/dotsloader';
import RouteCategoryPhone from '@routes/category/categoryPhone';
import RoutePhoneMenu from '@routes/phoneMenu';
import RouteEmailVerify from '@routes/emailverify';
import RouteChangeEmailVerify from '@routes/emailverify/changeEmailVerify';
import GeolocationDTO from '@dto/geolocation.dto';
import { CustomStorage } from '@modules/CustomStorage';
import { AuthTokens } from '@modules/AuthTokens';
import RouteSearchNotfound from '@routes/search/notfound';
import GlobalSearch from '@components/globalSearch';
import '@functions/duplicateLetters'
import '@functions/linesCount'

declare global {
    interface Window {
        userdata?: {
            roles?: Array<RoleDTO>,
            uid?: number,
            currency?: string,
            geolocation?: GeolocationDTO,
            banned?: boolean
            reportBanned?: boolean

            mapRadius?: number
        },

        languageList?: Array<LanguageDTO>,
        language?: string,

        geolocationChoiceModal?: boolean,
        languageChoiceModal?: boolean,
        currencyChoiceModal?: boolean,

        lastUpdateBtnView?: boolean,
        isPhone?: boolean,

        isAccountInfoLoaded?: boolean,
        isAccountInfoLoadedError?: boolean,

        API_refreshTokenAlreadyCheck?: boolean,
        jwtTokenExists?: boolean
    }

    interface String {
        duplicateLetters(letter: string): number
        linesCount(): number
    }
}

window.userdata = {}
window.userdata.currency = CONFIG.defaultCurrency

if(AuthTokens.get().refreshToken) window.jwtTokenExists = true
window.addEventListener('customStorageUpdate', event => {
    const storage = (event as any).detail.storage
    const storageRemoved = (event as any).detail.storageRemoved

    if(storage && storage.key === 'userLanguage') window.language = storage.value
    else if(storageRemoved && storageRemoved.key === 'userLanguage') window.language = 'en'
})

if(window.innerWidth <= 1000) window.isPhone = true

const root = ReactDOM.createRoot(document.getElementById('root') as Element);
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

    const [ navigate, setNavigate ] = React.useState<string | null>(null)
    const [ oldpath, setOldpath ] = React.useState('/')

    React.useEffect(() => {
        if(navigate !== null) setNavigate(null)
        if(navigate === '/refresh') {
            setNavigate(oldpath)
            setOldpath('/')
        }
    }, [navigate])

    const [ errorcode, setErrorcode ] = React.useState<RouteErrorCodeProps>({
        code: 0,
        text: ''
    })
    React.useMemo(() => {
        setLoadLanguage(true)
        setLoadInit(true)

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

        function onAjaxError(event, jqXHR) {
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
            else setErrorcode({ code: 1024, text: null, classes: 'flexcenter' })
        }

        $(document).on('ajaxError', onAjaxError)
        return () => {
            $(document).off('ajaxError', onAjaxError)
        }
    }, [])

    React.useEffect(() => {
        setOldpath(location.pathname + location.search + location.hash)
        setNavigate('/refresh')
    }, [window.jwtTokenExists])

    const [ sidebarStatus, setSidebarStatus ] = React.useState<number>(parseInt(window.localStorage.getItem('sidebar_state')))
    React.useEffect(() => {
        function onStorageUpdate() {
            let status: number = parseInt(window.localStorage.getItem('sidebar_state'))
            if(status === undefined || isNaN(status)) status = 0
            
            setSidebarStatus(status)
        }

        window.addEventListener('storage', onStorageUpdate)
        return () => {
            window.removeEventListener('storage', onStorageUpdate)
        }
    }, [])


    function LastUpdateBtn() {
        return (
            <Link to="#whatnew" className="lastupdatebtn">
                <button className="btn btn-icon">
                    <MdBrowserUpdated />
                </button>
                <div>
                    <h1>Последнее обновление</h1>
                    <span>Узнайте, что нового мы добавили</span>
                </div>
            </Link>
        )
    }

    let bodyLocationStyle: React.CSSProperties = {
        padding: null,
        overflow: null
    }
    
    if(window.isPhone) {
        if(location.pathname === '/placead'
            || location.pathname === '/categories'
            || location.pathname === '/menu'
            || location.pathname === '/menu/about'
            || location.pathname.indexOf('/account/messages') !== -1
            || location.pathname.indexOf('/account/support/') !== -1
            || location.pathname.indexOf('/account/reports/') !== -1) {
            bodyLocationStyle.padding = 0
            bodyLocationStyle.overflow = 'hidden'
        }
    }
    
    if(location.pathname === '/feed') {
        bodyLocationStyle.padding = 0
        bodyLocationStyle.overflow = 'hidden'
    }

    const [ rootFlexHeight, setRootFlexHeight ] = React.useState(window.isPhone && `calc(100% - 7vh - ${(window.screen.height - window.innerHeight) / 2}px)`)
    // React.useEffect(() => {
    //     if(window.isEmailVerifyBlock) {
    //         if(window.isPhone) setRootFlexHeight(`calc(100% - 7vh - ${(window.screen.height - window.innerHeight) / 2}px - 85px)`)
    //     }
    // }, [window.isEmailVerifyBlock])
    
    if(loadLanguage || loadInit)return (<LoaderLanding />)
    if(errorcode.code !== 0)return (<RouteErrorCode {...errorcode} fixed={true} classes='flexcenter' />)

    return (
        <>
            <section id='rootWrapper' className={`${window.isPhone && 'isPhone'} ${sidebarStatus ? 'sidebarhidden' : 'sidebarshowed'}`}>
                {/* <LastUpdateBtn /> */}

                <Layout />
                <section id="rootFlex">
                    <Sidebar />

                    <section id="body" style={bodyLocationStyle}>
                        <Routes>
                            <Route path='/' element={<Navigate to={"/feed"} />}></Route>
                            <Route path='/feed' element={<RouteFeed />}></Route>

                            <Route path='/search/notfound' element={<RouteSearchNotfound />}></Route>

                            <Route path='/placead' element={<RoutePlacead />}></Route>
                            <Route path='/account/*' element={<RouteAccount />}></Route>
                            <Route path='/profile/:id' element={<RouteProfile />}></Route>

                            <Route path='/ad/:id/*' element={<ProductLinkRedirect />}></Route>

                            <Route path='/email-verify/:hash?' element={<RouteEmailVerify />}></Route>
                            <Route path='/change-email-verify/:hash?' element={<RouteChangeEmailVerify />}></Route>

                            <Route path='/refresh' element={<></>}></Route>

                            {window.isPhone ? (<Route path='/categories' element={<RouteCategoryPhone />}></Route>) : ''}

                            {window.isPhone ? (<Route path='/menu' element={<RoutePhoneMenu />}></Route>) : ''}
                            {window.isPhone ? (<Route path='/search' element={<GlobalSearch />}></Route>) : ''}

                            <Route path='/:firstid/:secondid?' element={<RouteCategory />}></Route>

                            <Route path='/*' element={<RouteErrorCode style={{margin: "84px 0"}} code={404} text={Language('404PAGE_TEXT', 'ошибка')} />}></Route>
                        </Routes>
                    </section>
                </section>

                <BottomNavigate />
            </section>

            {navigate ? (<Navigate to={navigate} />) : ''}
        </>
    )
}


function ProductLinkRedirect() {
    const params = useParams()
    return (<Navigate to={"/feed?ad=" + params.id} />)
}


function LoaderLanding() {
    return (
        <div id="rootLoaderLanding">
            {!window.isPhone && (
                <header>
                    <section>
                        <div className="_loaderdiv" style={{ height: '55px', width: '55px' }}></div>
                        <div className="_loaderdiv" style={{ height: '55px', width: '180px', borderRadius: '4px' }}></div>
                    </section>
                    <section>
                        <div className="_loaderdiv" style={{ height: '55px', width: '100%', borderRadius: '4px' }}></div>
                    </section>
                    <section>
                        <div className="_loaderdiv" style={{ height: '55px', width: '55px' }}></div>
                        <div className="_loaderdiv" style={{ height: '55px', width: '120px' }}></div>
                        <div className="_loaderdiv" style={{ height: '55px', width: '220px' }}></div>
                    </section>
                </header>
            )}

            <div className="body" style={{ height: window.isPhone && `calc(100% - 9vh - ${(window.screen.height - window.innerHeight) / 2}px)` }}>
                {!window.isPhone && (
                    <nav className="sidebar">
                        <section>
                            <div className="_loaderdiv" style={{ height: '55px', width: '100%', borderRadius: '4px' }}></div>
                            <div className="_loaderdiv" style={{ height: '20px', width: '70%', marginTop: '22px' }}></div>

                            <div className="_loaderdiv" style={{ height: '40px', width: '100%', marginTop: '4px', borderRadius: '8px' }}></div>
                            <div className="_loaderdiv" style={{ height: '40px', width: '100%', marginTop: '4px', borderRadius: '8px' }}></div>
                            <div className="_loaderdiv" style={{ height: '40px', width: '100%', marginTop: '4px', borderRadius: '8px' }}></div>
                            <div className="_loaderdiv" style={{ height: '40px', width: '100%', marginTop: '4px', borderRadius: '8px' }}></div>
                            <div className="_loaderdiv" style={{ height: '40px', width: '100%', marginTop: '4px', borderRadius: '8px' }}></div>
                        </section>

                        <section>
                            <div className="_loaderdiv" style={{ height: '20px', width: '100%', borderRadius: '4px' }}></div>
                            <div className="_loaderdiv" style={{ height: '20px', width: '100%', marginTop: '4px', borderRadius: '4px' }}></div>
                            <div className="_loaderdiv" style={{ height: '20px', width: '100%', marginTop: '4px', borderRadius: '4px' }}></div>
                            <div className="_loaderdiv" style={{ height: '20px', width: '100%', marginTop: '4px', borderRadius: '4px' }}></div>
                            <div className="_loaderdiv" style={{ height: '20px', width: '100%', marginTop: '4px', borderRadius: '4px' }}></div>
                            <div className="_loaderdiv" style={{ height: '20px', width: '100%', marginTop: '4px', borderRadius: '4px' }}></div>

                            <div className="_loaderdiv" style={{ height: '20px', width: '50%', marginTop: '8px', borderRadius: '4px' }}></div>
                        </section>
                    </nav>
                )}

                <div className="page">
                    <DotsLoader size={"big"} />
                </div>
            </div>

            {window.isPhone && (
                <nav className="bottomnav">
                    <div className="_loaderdiv"></div>
                    <div className="_loaderdiv"></div>
                    <div className="_loaderdiv"></div>
                    <div className="_loaderdiv"></div>
                    <div className="_loaderdiv"></div>
                </nav>
            )}
        </div>
    )
}