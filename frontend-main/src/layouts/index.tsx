import React from 'react'
import { useLocation, Navigate } from "react-router-dom";
import Cookies from 'universal-cookie'

import CONFIG from '@config'

import Header from '@layouts/header';
import ModalSignin from '@components/modals/signin';
import ModalSignup from '@components/modals/signin/signup';
import { parseQuery } from '@functions/parseQuery';
import { isValidJSON } from '@functions/isValidJSON';
import { API, APISync } from '@modules/API';
import { notify } from '@modules/Notify';
import { Language } from '@modules/Language';
import AlertIndex, { Alert } from '@components/alert';
import LastUpdate from '@components/lastUpdate';
import MapleafletModal from '@components/mapLeaflet/modal';
import { LatLng } from 'leaflet';
import Address from '@components/address';
import UpdatesDTO from '@dto/updates.dto';
import UserInfoDTO from '@dto/userInfo.dto';
import GeolocationDTO from '@dto/geolocation.dto';
import StaffHeader from '@layouts/staffheader';
import RouteProduct from '@routes/product';
import ModalContactUs from '@components/modals/contactus';
import NotificationPage from './notificationPage';
import { CustomStorage } from '@modules/CustomStorage';
import { AuthTokens } from '@modules/AuthTokens';
import ModalAlbumImages from '@components/modals/albumImages';
import ModalReport from '@components/modals/report';

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

    const location = useLocation()

    const [ lastUpdate, setLastUpdate ] = React.useState<UpdatesDTO>(null)
    const [ whatnew, setWhatnew ] = React.useState(false)
    const [ contactUs, setContactUs ] = React.useState(false)

    const [ productPage, setProductPage ] = React.useState<number>(null)
    const [ albumImageModal, setAlbumImageModal ] = React.useState<string>(null)

    
    React.useMemo(() => {
        API({
            url: '/defaultapi/updates/last',
            type: 'get',
            data: {
                where: 'main'
            }
        }).done(result => {
            if(result.statusCode === 200) {
                const lastUpdateViewID = parseInt(window.localStorage.getItem('lastUpdateView'))
                setLastUpdate(result.message)
    
                if(!lastUpdateViewID || isNaN(lastUpdateViewID)
                    || lastUpdateViewID !== result.message.id) {
                    if(window.jwtTokenExists) setNavigate('#whatnew')
                    window.localStorage.setItem('lastUpdateView', result.message.id)
                }
    
                if(window.jwtTokenExists) window.lastUpdateBtnView = true
            }
            else if(result.statusCode !== 404) notify("(lastUpdate) /updates/last: " + result.message, { debug: true })
        })
    }, [])
    
    React.useEffect(() => {
        if(location.hash.indexOf('#refresh') !== -1) {
            setOldpath(location.pathname)
            setNavigate('/refresh')
        }

        if(location.hash.indexOf('#logout') !== -1) {
            AuthTokens.clear()
            window.location.href = '/'
        }

        if(location.hash.indexOf('#whatnew') !== -1) {
            setWhatnew(true)
        }

        if(location.hash.indexOf('#contactus') !== -1) {
            setContactUs(true)
        }
        else setContactUs(false)
        
        const query: Record<string, any> = parseQuery(location.search)
        if(query.ad) {
            const id: number = parseInt(query.ad)
            if(!id || isNaN(id))return setNavigate(location.pathname)

            setProductPage(id)
        }
        else setProductPage(null)

        if(query.image) {
            const key: string = query.image
            if(!key || key.length < 32)return setNavigate(location.pathname)

            setAlbumImageModal(key)
        }
        else setAlbumImageModal(null)
    }, [location])

    React.useEffect(() => {
        if(whatnew === false) setNavigate(location.pathname + location.search)
    }, [whatnew])

    const [ geolocation, setGeolocation ] = React.useState<GeolocationDTO>(null)
    React.useEffect(() => {
        setGeolocation(window.userdata.geolocation)
    }, [window.userdata.geolocation])

    return (
        <section id="layoutTop">
            <div id="notify"></div>

            <ModalReport />
            <AlertIndex />
            <NotificationPage />

            {location.hash.indexOf('#signin') != -1 ? (<ModalSignin />) : ''}
            {location.hash.indexOf('#signup') != -1 ? (<ModalSignup />) : ''}
            
            {/* <StaffHeader /> */}
            <Header />

            {navigate ? (<Navigate to={navigate} />) : ''}

            {whatnew ? (<LastUpdate updates={lastUpdate} onClose={() => setWhatnew(false)} />) : ''}
            {contactUs ? (<ModalContactUs />) : ''}

            {productPage ? (<RouteProduct prodID={productPage} modal={true} onModalClose={() => {
                setNavigate(location.pathname + location.search.replace('?ad=' + productPage, '').replace('&ad=' + productPage, '') + location.hash)
            }} />) : ''}
            {albumImageModal ? (<ModalAlbumImages fileKey={albumImageModal} onModalClose={() => {
                setNavigate(location.pathname + location.search.replace('?image=' + albumImageModal, '').replace('&image=' + albumImageModal, '') + location.hash)
            }} />) : ''}

            {((location.hash.indexOf('#geolocation') !== -1) && geolocation) ? (
                <MapleafletModal
                    startPosition={new LatLng(geolocation.lat || 0, geolocation.lng || 0)}
                    startAddress={Address(geolocation, true)}

                    onClose={() => {
                        if(location.hash.indexOf('#geolocation_m') !== -1) window.location.href = window.location.pathname + window.location.search
                        else setNavigate(location.pathname + location.search)
                    }}
                    onSubmit={async (mapPosition, addressData, mapRadius) => {
                        function close(reload?: boolean) {
                            if(location.hash.indexOf('#geolocation_m')) reload = true

                            setNavigate(location.pathname + location.search)
                            if(reload) {
                                setTimeout(() => {
                                    window.location.reload()
                                }, 500)
                            }
                        }

                        if(!mapPosition
                            || !addressData
                            || !mapRadius) {
                            Alert(Language("MAP_MODAL_ERROR_SUBMIT_1"))
                            return close()
                        }

                        if(!mapPosition.lat
                            || !mapPosition.lng
                            || isNaN(mapPosition.lat)
                            || isNaN(mapPosition.lng)) {
                            return Alert(Language("MAP_MODAL_ERROR_SUBMIT_1"))
                        }
                        if(!addressData.country
                            || !addressData.city
                            || !addressData.cityUniqueID) {
                            return Alert(Language("MAP_MODAL_ERROR_SUBMIT_1"))
                        }
                        if(mapRadius < 1 || mapRadius > 200)return Alert(Language("MAP_MODAL_ERROR_SUBMIT_1"))

                        window.userdata.geolocation = mapPosition
                        window.userdata.geolocation = { ...mapPosition, ...addressData }
                        window.userdata.mapRadius = mapRadius

                        new CustomStorage().set('userGeolocation', window.userdata.geolocation)
                        new CustomStorage().set('userMapRadius', window.userdata.mapRadius)

                        setGeolocation(window.userdata.geolocation)
                        close(true)

                        if(window.jwtTokenExists) {
                            API({
                                url: '/defaultapi/user/settings/geolocation',
                                type: 'put',
                                data: {
                                    geolocation: window.userdata.geolocation
                                }
                            }).done(result => {
                                if(result.statusCode !== 200) {
                                    notify("(layout) /user/geolocation: " + result.message, { debug: true })
                                    console.log(window.userdata.geolocation)
                                }
                            })
                        }
                    }}

                    _changeonlycity={false}
                    _onlycity={true}
                />
            ) : ''}
        </section>
    );
}