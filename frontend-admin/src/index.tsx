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
import Cookies from 'universal-cookie'

import { languageInit } from './lang/_init';

import './default'
import './index.scss'

import { RouteErrorCode, RouteErrorCodeProps } from '@routes/errorcodes/index';
import { Language } from '@modules/Language';

import CONFIG from '@config'
import CONFIG_SERVER from '@config.server'

import RouteDashboard from '@routes/dashboard'
import RouteLanguageList from '@routes/language/index';
import RouteLanguageNew from '@routes/language/newlanguage/index';
import RouteLanguageEditor from '@routes/language/editor/index';
import RouteSign from '@routes/sign/sign';
import { API } from '@modules/API';
import { notify } from '@modules/Notify';
import RouteCategoriesList from '@routes/categories/index';
import RouteRoles from '@routes/roles/index';
import RouteNewRole from '@routes/roles/newrole/index';
import RouteEditRole from '@routes/roles/editrole/index';
import RouteContentUpdates from '@routes/content/updates/index';
import RoleDTO from '@dto/role.dto';
import LanguageDTO from '@dto/language.dto';
import _init_ from '@src/init';
import Layout from '@layouts/index';
import Header from '@layouts/header';
import SideBar from '@layouts/sidebar';
import RouteCategories_Management from '@routes/categories/_management';
import RouteContentStorage from '@routes/content/storage';
import RouteContentMailtemplate from '@routes/content/mailtemplate';
import RouteContentMailtemplateManagement from '@routes/content/mailtemplate/_management';
import RouteContentNotifications from '@routes/content/notifications';
import { AuthTokens } from '@modules/AuthTokens';
import GeolocationDTO from '@dto/geolocation.dto';

declare global {
    interface Window {
        userdata?: {
            uid?: number,
            geolocation?: GeolocationDTO,
            roles?: Array<RoleDTO>
        },

        languageList?: Array<LanguageDTO>,
        language?: string,
        languageChoiceModal?: boolean,

        lastUpdateBtnView?: boolean,
        isPhone?: boolean,

        isAccountInfoLoaded?: boolean,
        isAccountInfoLoadedError?: boolean,

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
    const cookies = new Cookies()

    const [ loadInit, setLoadInit ] = React.useState(true)
    const [ loadLanguage, setLoadLanguage ] = React.useState(true)

    const [ navigate, setNavigate ] = React.useState(null)
    React.useEffect(() => {
        if(navigate !== null) setNavigate(null)

        if(navigate === '/refresh') {
            setNavigate(oldpath)
            setOldpath('/')
        }
    }, [navigate])

    const [ oldpath, setOldpath ] = React.useState('/')

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

        $(document).on('ajaxError', (event, jqXHR) => {
            setLoadLanguage(false)
            console.log(jqXHR.status)
            
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

    React.useEffect(() => {
        setOldpath(location.pathname + location.search + location.hash)
        setNavigate('/refresh')
    }, [window.jwtTokenExists])
    
    if(loadLanguage || loadInit)return
    return (
        <>
            {errorcode.code !== 0 ? (
                <RouteErrorCode code={errorcode.code} classes='flexcenter' text={errorcode.text} fixed={true} />
            ) : ''}

            <section id='rootWrapper' className={`${location.pathname === '/sign' && 'signin'}`}>
                <Layout />

                {location.pathname !== '/sign' ? (<SideBar />) : ''}
                <section className="sectionwidth">
                    {location.pathname !== '/sign' ? (<Header />) : ''}

                    <section id="body">
                        <Routes>
                            <Route path='/' element={<Navigate to="/dashboard" />}></Route>

                            <Route path='/dashboard' element={<RouteDashboard />}></Route>

                            <Route path='/content/storage/:id?' element={<RouteContentStorage />}></Route>

                            <Route path='/content/mailtemplate' element={<RouteContentMailtemplate />}></Route>
                            <Route path='/content/mailtemplate/create' element={<RouteContentMailtemplateManagement type={"create"} />}></Route>
                            <Route path='/content/mailtemplate/edit/:id' element={<RouteContentMailtemplateManagement type={"edit"} />}></Route>

                            <Route path='/content/updates/:id?' element={<RouteContentUpdates />}></Route>

                            <Route path='/content/notifications/:id?' element={<RouteContentNotifications />}></Route>
                            <Route path='/content/notifications/create' element={<RouteContentNotifications isCreate={true} />}></Route>

                            <Route path='/language' element={<RouteLanguageList />}></Route>
                            <Route path='/language/new' element={<RouteLanguageNew />}></Route>
                            <Route path='/language/edit/:id' element={<RouteLanguageEditor />}></Route>

                            <Route path='/categories' element={<RouteCategoriesList />}></Route>
                            <Route path='/categories/new/:id?' element={<RouteCategories_Management type="add" />}></Route>
                            <Route path='/categories/edit/:id' element={<RouteCategories_Management type="edit" />}></Route>

                            <Route path='/roles' element={<RouteRoles />}></Route>
                            <Route path='/roles/new' element={<RouteNewRole />}></Route>
                            <Route path='/roles/edit/:key' element={<RouteEditRole />}></Route>

                            <Route path='/sign' element={<RouteSign />}></Route>

                            <Route path='/*' element={<RouteErrorCode code={404} text={Language('404PAGE_TEXT', 'ошибка')} />}></Route>
                        </Routes>
                    </section>
                </section>
            </section>

            {navigate ? (<Navigate to={navigate} />) : ''}
        </>
    )
}
