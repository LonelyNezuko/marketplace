import React from 'react'
import { useLocation, Navigate } from "react-router-dom";
import Cookies from 'universal-cookie'

import CONFIG from '@config'

import { ModalSetLanguage } from "@components/modals/setLanguage/setLanguage";
import LastUpdate from '@components/lastUpdate';
import { notify } from '@modules/Notify';
import { AuthTokens } from '@modules/AuthTokens';
import { API } from '@modules/API';
import AlertIndex from '@components/alert';

export default function Layout()
{
    const cookies = new Cookies()
    const location = useLocation()

    const [ navigate, setNavigate ] = React.useState(null)
    const [ oldpath, setOldpath ] = React.useState('/')
    React.useEffect(() => {
        if(navigate !== null) setNavigate(null)
        if(navigate === '/refresh') {
            setNavigate(oldpath)
            setOldpath('/')
        }
    }, [navigate])

    const [ modalLanguage, setModalLanguage ] = React.useState(false)
    const [ language, setLanguage ] = React.useState('')

    const [ lastUpdate, setLastUpdate ] = React.useState({})
    const [ whatnew, setWhatnew ] = React.useState(false)

    React.useMemo(() => {
        setLanguage(window.language)

        if(location.pathname !== '/sign') {
            API({
                url: '/defaultapi/updates/last',
                type: 'get',
                data: {
                    where: 'moderation'
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
        if(location.hash.indexOf('#logout') !== -1) {
            AuthTokens.clear()
            window.location.href = '/sign'
        }

        if(location.hash.indexOf('#whatnew') !== -1) {
            setWhatnew(true)
        }
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
            {whatnew ? (<LastUpdate updates={lastUpdate} onClose={() => setWhatnew(false)} />) : ''}
        </>
    );
}