import React from 'react'
import { useLocation, Navigate } from "react-router-dom";
import Cookies from 'universal-cookie'
import parseQuery from 'parse-query'

import CONFIG from '@config'

import { ModalSetLanguage } from "@components/modals/setLanguage/setLanguage";
import { isValidJSON } from '@functions/isValidJSON';
import { API } from '@modules/API';
import { notify } from '@modules/Notify';
import { Language } from '@modules/Language';
import AlertIndex from '@components/alert';
import LastUpdate from '@components/lastUpdate';
import { AuthTokens } from '@modules/AuthTokens';

export default function Layout()
{
    const [ navigate, setNavigate ] = React.useState(null)
    const [ oldpath, setOldpath ] = React.useState('/')
    React.useEffect(() => {
        if(navigate !== null) setNavigate(null)
        if(navigate === '/refresh') {
            setNavigate(oldpath)
            setOldpath('/')
        }
    }, [navigate])

    const cookies = new Cookies()
    const location = useLocation()

    const [ modalLanguage, setModalLanguage ] = React.useState(false)
    const [ language, setLanguage ] = React.useState('')

    const [ lastUpdate, setLastUpdate ] = React.useState({})
    const [ whatnew, setWhatnew ] = React.useState(false)

    React.useMemo(() => {
        setLanguage(window.language)
        if(window.languageChoiceModal) setModalLanguage(true)

        if(location.pathname !== '/sign') {
            API({
                url: '/defaultapi/updates/last',
                type: 'get',
                data: {
                    where: 'admin'
                }
            }).done(result => {
                if(result.statusCode === 200) {
                    const lastUpdateViewID = parseInt(window.localStorage.getItem('lastUpdateView'))
                    setLastUpdate(result.message)

                    if(!lastUpdateViewID || isNaN(lastUpdateViewID)
                        || lastUpdateViewID !== result.message.id) {
                        setNavigate('#whatnew')
                        window.localStorage.setItem('lastUpdateView', result.message.id)
                    }

                    window.lastUpdateBtnView = true
                }
                else if(result.statusCode !== 404) notify("(lastUpdate) /updates/last: " + result.message, { debug: true })
            })
        }
    }, [])
    function onChangeLanguage(language) {
        if(language) {
            cookies.remove('lang', { path: '/' })
            cookies.set('lang', language[0], {
                expires: new Date(+new Date + ((86400 * 3) * 1000)),
                path: '/'
            })
            window.location = window.location
        }

        setModalLanguage(false)
    }
    
    React.useEffect(() => {
        if(location.hash.indexOf('#refresh') !== -1) {
            setOldpath(location.pathname)
            setNavigate('/refresh')
        }

        if(location.hash.indexOf('#logout') !== -1) {
            AuthTokens.clear()
            window.location.href = '/sign'
        }

        if(location.hash.indexOf('#whatnew') !== -1) {
            setWhatnew(true)
        }
        
        const query = parseQuery(location.search)
    }, [location])

    React.useEffect(() => {
        if(whatnew === false) setNavigate(location.pathname + location.search)
    }, [whatnew])

    return (
        <>
            {modalLanguage ? (<ModalSetLanguage defaultLang={language} onChange={onChangeLanguage} />) : ''}

            <div id="notify"></div>
            <AlertIndex />

            {navigate ? (<Navigate to={navigate} />) : ''}

            {/* {whatnew ? (<LastUpdate updates={lastUpdate} onClose={() => setWhatnew(false)} />) : ''} */}
        </>
    );
}