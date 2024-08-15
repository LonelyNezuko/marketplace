import React from 'react'

import './index.scss'
import UserDTO, { UserDialogDTO, UserMessageDTO } from '@dto/user.dto'
import Cookies from 'universal-cookie'
import { API } from '@modules/API'
import { notify } from '@modules/Notify'
import Gateway from '@modules/Gateway'
import { Link, useLocation } from 'react-router-dom'
import { Avatar } from '@components/avatar/avatar'
import Username from '@components/username'
import { Language } from '@modules/Language'

import Moment from 'moment'
import 'moment/min/locales'
import RatingStars from '@components/ratingstars'
import { FaSignature } from 'react-icons/fa6'
import { AccountInfo, AccountMenu } from '@routes/account'
import Button from '@components/button'
import { MdOutlineKeyboardArrowRight } from 'react-icons/md'
import Footer from '@layouts/footer'
import LanguageDTO from '@dto/language.dto'
import Address from '@components/address'
import GeolocationDTO from '@dto/geolocation.dto'
import { isValidJSON } from '@modules/functions/isValidJSON'
import UserInfoDTO from '@dto/userInfo.dto'
import SetRouteTitle from '@modules/SetRouteTitle'
import { ModalFirstSettings } from '@components/modals/firstSettings'
import { onChangeFirstSettings } from '@layouts/sidebar'
import { CustomStorage } from '@modules/CustomStorage'
import { AuthTokens } from '@modules/AuthTokens'

interface AccountProps {
    account: UserDTO,
    loader: boolean
}


export default function RoutePhoneMenu() {
    Moment.locale(window.language)
    const location = useLocation()

    const [ loader, setLoader ] = React.useState(false)

    const [ account, setAccount ] = React.useState<UserDTO>(null)
    const [ btnCounter, setBtnCounter ] = React.useState({
        messages: 0,
        notifications: 0
    })

    const [ language, setLanguage ] = React.useState({
        code: '',
        name: ''
    })
    
    const [ geolocation, setGeolocation ] = React.useState<GeolocationDTO>(null)
    React.useEffect(() => {
        setGeolocation(window.userdata.geolocation)
    }, [window.userdata.geolocation])

    const [ changeLanguageModal, setChangeLanguageModal ] = React.useState(false)

    React.useEffect(() => {
        load()
    }, [window.jwtTokenExists])
    React.useMemo(() => {
        load()
        SetRouteTitle(Language("ROUTE_TITLE_PHONEMENU"))
    
        Gateway.on('user', 'onMessageIncoming', (message: UserMessageDTO, dialog: UserDialogDTO) => {
            if(location.pathname.indexOf(`/account/messages/${dialog.dialogID}`) === -1) {
                setBtnCounter(old => {
                    old.messages += 1
                    return {...old}
                })
            }
        })
        Gateway.on('user', 'onMessagesReadIt', (count: number) => {
            setBtnCounter(old => {
                old.messages -= count
                if(old.messages < 0) old.messages = 0
    
                return {...old}
            })
        })

        window.languageList.map((lang: LanguageDTO) => {
            if(lang.code === window.language) setLanguage({
                code: lang.code,
                name: lang.name
            })
        })
    }, [])

    function load() {
        setLoader(true)

        if(window.jwtTokenExists) {
            API({
                url: '/defaultapi/user',
                type: 'get'
            }).done(result => {
                if(result.statusCode === 200) {
                    setAccount(result.message)
                    setLoader(false)
                }
                else {
                    AuthTokens.clear()
                    window.location.href = '/'
                }
            })

            API({
                url: '/defaultapi/user/dialogs/message/allunreadcounts',
                type: 'get'
            }).done(result => {
                if(result.statusCode === 200) {
                    setBtnCounter(old => {
                        return {...old, messages: result.message}
                    })
                }
                else notify("(phoneMenu) /user/dialogs/message/allunreadcounts: " + result.message, { debug: true })
            })
        }
        else setLoader(false)
    }


    if(!window.isPhone)return
    if(loader)return

    return (
        <div className="route" id="routePhoneMenu">
            <Account account={account} loader={loader} />
            
            <div className="accountMenu" style={{ marginTop: '14px' }}>
                <ul className="nav main">
                    <Link to="#geolocation" className="li flex">
                        {Language("PHONEMENU_NAV_TITLE_GEOLOCATION")}
                        <span>{Address(geolocation, true)}</span>
                    </Link>
                    <li className="li flex" onClick={() => setChangeLanguageModal(true)}>
                        {Language("PHONEMENU_NAV_TITLE_LANGUAGE")}
                        <span>{language.name}</span>
                    </li>
                    <li className="li flex" onClick={() => setChangeLanguageModal(true)}>
                        {Language("PHONEMENU_NAV_TITLE_CURRENCY")}
                        <span>{window.userdata.currency.toUpperCase()}</span>
                    </li>
                </ul>
            </div>

            <AccountNav account={account} loader={loader} />
            <Footer />

            {changeLanguageModal ? (<ModalFirstSettings isMenu={true} defaultLang={window.language} defaultCurrency={window.userdata.currency} onChange={(language, currency, changeGeolocation) => {
                onChangeFirstSettings(language, currency, changeGeolocation)
                setChangeLanguageModal(false)
            }} />) : ''}
        </div>
    )
}


function AccountNav({
    account,
    loader
}: AccountProps) {
    if(loader)return

    if(!account)return
    return (
        <div className="accountNav">
            <AccountMenu isMenu={true} />
        </div>
    )
}

function Account({
    account,
    loader
}: AccountProps) {
    if(loader)return

    if(!account)return (
        <Link to="#signin?redirect=/menu" className="accountsignin">
            <section className="section">
                <Avatar image={"/assets/avatars/default.png"} size={100} position={{ x: 0, y: 0 }} circle={true} type={"medium"} />
                <section>
                    <h5>Не авторизован</h5>
                    <span>Авторизуйтесь, чтобы получить больше функций</span>
                </section>
            </section>
            <section className="section">
                <Button icon={(<MdOutlineKeyboardArrowRight />)} type={"transparent"} />
            </section>
        </Link>
    )
    return (
        <div className="account">
            <AccountInfo accountInfo={account} loader={loader} isMenu={true} />
        </div>
    )
}