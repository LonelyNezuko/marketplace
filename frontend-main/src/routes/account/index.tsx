import React from 'react'
import $ from 'jquery'
import Cookies from 'universal-cookie'
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'

import Moment from 'moment'
import 'moment/min/locales'

import { API } from '@modules/API'
import { notify } from '@modules/Notify'

import '@routes/account/index.scss'
import '@routes/account/accountInfo.scss'
import '@routes/account/accountMenu.scss'

import { RouteErrorCode, RouteErrorCodeProps } from '@routes/errorcodes'
import { Avatar } from '@components/avatar/avatar'
import RatingStars from '@components/ratingstars'

import { FaBan, FaSignature } from "react-icons/fa6";
import { Language } from '@modules/Language'

import RouteAccountIndex from '@routes/account/index/index'
import RouteAccountAds from '@routes/account/ad/index'
import RouteAccountAdsID from '@routes/account/ad/id/id'
import RouteAccountNotifications from '@routes/account/notifications/index'
import RouteAccountFavorites from '@routes/account/favorites/index'
import RouteAccountMessages, { RouteAccountMessagesDialog } from '@routes/account/messages/index'
import Username from '@components/username'
import RouteAccountSettings from '@routes/account/settings/index'
import RouteAccountReports from '@routes/account/reports/index'
import RouteAccountSupport from '@routes/account/support/index'

import OnlineStatus from '@components/useronlinestatus'
import Gateway from '@modules/Gateway'
import UserDTO, { UserDialogDTO, UserMessageDTO } from '@dto/user.dto'
import RouteAccountSavedaccounts from './savedaccounts'
import ModalLoader, { ModalLoaderProps } from '@components/modals/loader'
import UserNotificationsDTO from '@dto/user.notifications.dto'
import RouteAccountSessions from './sessions'
import RouteAccountReportsID from './reports/id'
import RouteAccountSupportID from './support/id'
import Button from '@components/button'

export interface RouteAccountProps {
    loader: boolean,
    account: UserDTO,
    setAccount?: React.Dispatch<React.SetStateAction<UserDTO>>,
    link?: string,
    profile?: boolean,
    loaderModal?: ModalLoaderProps,

    setNavigate?: React.Dispatch<any>,
    setLoaderModal?: React.Dispatch<React.SetStateAction<ModalLoaderProps>>
    setErrorcode?: React.Dispatch<React.SetStateAction<RouteErrorCodeProps>>
}

export default function RouteAccount() {
    Moment.locale(window.language)
    const location = useLocation()

    const [ errorcode, setErrorcode ] = React.useState<RouteErrorCodeProps>({
        code: 0,
        text: ''
    })

    const [ navigate, setNavigate ] = React.useState(null)
    React.useEffect(() => { if(navigate !== null) setNavigate(null) }, [navigate])

    const [ loaderModal, setLoaderModal ] = React.useState<ModalLoaderProps>({
        toggle: false,
        text: null
    })

    const [ loader, setLoader ] = React.useState(true)
    const [ account, setAccount ] = React.useState<UserDTO>()

    React.useMemo(() => {
        if(location.pathname === '/account' && window.isPhone)return setNavigate('/menu')
        setLoader(true)

        if(!window.jwtTokenExists) setErrorcode({ code: 401 })
        else {
            API({
                url: '/defaultapi/user',
                type: 'get'
            }).done(result => {
                if(result.statusCode === 200) {
                    setAccount(result.message)
                    setLoader(false)
                }
                else {
                    if(result.statusCode === 401) setErrorcode({ code: 401 })
                    else notify("(account accountInfo) /user: " + result.message, { debug: true })
                }
            })
        }
    }, [])

    if(location.pathname === '/account' && window.isPhone)return (<>
        {navigate ? (<Navigate to={navigate} />) : ''}
    </>)
    if(errorcode.code !== 0)return (<RouteErrorCode code={errorcode.code} text={errorcode.text} />)

    return (
        <div className="route" id="account" style={{ height: (location.pathname.indexOf('/account/messages') !== -1
            || location.pathname.indexOf('/account/support/') !== -1
            || location.pathname.indexOf('/account/reports/') !== -1) ? '100%' : null }}>
            <div className="accountWrapper">
                {(location.pathname.indexOf('/account/ad/') === -1 && !window.isPhone) ? (
                    <AccountMenu />
                ) : ''}

                <div className="accountBody">
                    <AccountBannedBlock />

                    <Routes>
                        <Route path='/' element={<RouteAccountIndex account={account} loader={loader} />}></Route>

                        <Route path='/ad' element={<RouteAccountAds account={account} loader={loader} />}></Route>
                        <Route path='/ad/:id/*' element={<RouteAccountAdsID account={account} loader={loader} loaderModal={loaderModal} setLoaderModal={setLoaderModal} setNavigate={setNavigate} />}></Route>

                        <Route path='/favorites' element={<RouteAccountFavorites account={account} loader={loader} />}></Route>

                        <Route path='/notifications' element={<RouteAccountNotifications account={account} loader={loader} setNavigate={setNavigate} setLoaderModal={setLoaderModal} />}></Route>

                        <Route path='/messages' element={<RouteAccountMessages account={account} loader={loader} />}></Route>
                        <Route path='/messages/:id' element={<RouteAccountMessagesDialog account={account} loader={loader} />}></Route>
                        
                        <Route path='/settings/:blockname?' element={<RouteAccountSettings account={account} loader={loader} setAccount={setAccount} />}></Route>
                        
                        <Route path='/sessions' element={<RouteAccountSessions account={account} loader={loader} setAccount={setAccount} />}></Route>

                        <Route path='/reports' element={<RouteAccountReports account={account} loader={loader} setAccount={setAccount} setErrorcode={setErrorcode} />}></Route>
                        <Route path='/reports/:id' element={<RouteAccountReportsID account={account} loader={loader} setAccount={setAccount} setNavigate={setNavigate} setErrorcode={setErrorcode} />}></Route>

                        <Route path='/support' element={<RouteAccountSupport account={account} loader={loader} setAccount={setAccount} setErrorcode={setErrorcode} />}></Route>
                        <Route path='/support/:id' element={<RouteAccountSupportID account={account} loader={loader} setAccount={setAccount} setErrorcode={setErrorcode} />}></Route>

                        <Route path='/savedaccounts' element={<RouteAccountSavedaccounts account={account} loader={loader} />}></Route>

                        {/* <Route path='/*'>{setErrorcode({ code: 404 })}</Route> */}
                    </Routes>
                </div>

                {(location.pathname.indexOf('/account/ad/') === -1 && !window.isPhone) ? (
                    <AccountInfo loader={loader} accountInfo={account} />
                ) : ''}
            </div>

            {navigate ? (<Navigate to={navigate} />) : ''}
            {loaderModal.toggle ? (
                <ModalLoader text={loaderModal.text} />
            ) : ''}
        </div>
    )
}

interface AccountInfoProps {
    loader: boolean,
    accountInfo: UserDTO,

    profileJSX?: React.JSX.Element,

    isMenu?: boolean
}
export function AccountInfo({
    loader,
    accountInfo,

    profileJSX,

    isMenu
}: AccountInfoProps) {
    const location = useLocation()

    if(location.pathname.indexOf('/account/reports') !== -1
        || location.pathname.indexOf('/account/support') !== -1)return
    if(loader || !accountInfo)return (
        <div className="accountInfo">
            <div className="_loaderdiv" style={{width: '100%', height: "240px", borderRadius: '0'}}></div>
            <div className="sectionpadding">
                <div className="title">
                    <div className="_loaderdiv" style={{width: "160px", height: "20px"}}></div>
                    <div className="_loaderdiv" style={{width: "67px", height: "20px"}}></div>
                </div>
                <div className="signatureText" style={{display: 'flex', alignItems: 'center', marginTop: '4px'}}>
                    <FaSignature />
                    <div className="_loaderdiv" style={{width: "70%", height: "18px", transform: 'translateY(2.5px)'}}></div>
                </div>
                <div className="descinfo">
                    <div className="info">
                        <section>
                            <h1>
                                <div className="_loaderdiv" style={{width: "85px", height: "14px"}}></div>
                            </h1>
                            <span>
                                <div className="_loaderdiv" style={{width: "135px", height: "14px"}}></div>
                            </span>
                        </section>
                        <section>
                            <h1>
                                <div className="_loaderdiv" style={{width: "110px", height: "14px"}}></div>
                            </h1>
                            <span>
                                <div className="_loaderdiv" style={{width: "75px", height: "14px"}}></div>
                            </span>
                        </section>
                        <section>
                            <h1>
                                <div className="_loaderdiv" style={{width: "65px", height: "14px"}}></div>
                            </h1>
                            <span>
                                <div className="_loaderdiv" style={{width: "160px", height: "14px"}}></div>
                            </span>
                        </section>
                        <section className="rating">
                            <h1>
                                <div className="_loaderdiv" style={{width: "95px", height: "14px"}}></div>
                            </h1>
                            <span>
                                <div className="_loaderdiv" style={{width: "80%", height: "26px", marginTop: "6px"}}></div>
                            </span>
                        </section>
                        <section>
                            <h1>
                                <div className="_loaderdiv" style={{width: "115px", height: "14px"}}></div>
                            </h1>
                            <span>
                                <div className="_loaderdiv" style={{width: "90px", height: "14px"}}></div>
                            </span>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    )

    return (
        <div className={`accountInfo ${isMenu && 'isMenu'}`}>
            {isMenu ? (
                <section className="sectionTop">
                    <Avatar image={accountInfo.avatar.image} sizeImage={90} size={accountInfo.avatar.size} position={accountInfo.avatar.position} type="big" circle={true} />    
                    <section>
                        <div className="title">
                            <Username account={accountInfo} size={"big"} />
                            <OnlineStatus status={accountInfo.onlineStatus} />
                        </div>
                        <div className="signatureText">
                            <FaSignature />
                            <h1 className="text">{!accountInfo.signatureProfileText ? Language("ACCOUNT_NO_SIGNATURETEXT") : accountInfo.signatureProfileText}</h1>
                        </div>
                    </section>
                </section>
            ) : (
                <Avatar image={accountInfo.avatar.image} sizeImage={360} size={accountInfo.avatar.size} position={accountInfo.avatar.position} type="ultrabig" />
            )}

            <div className="sectionpadding">
                {!isMenu ? (
                    <>
                        <div className="title">
                            <Username account={accountInfo} />
                            <OnlineStatus status={accountInfo.onlineStatus} />
                        </div>
                        <div className="signatureText">
                            <FaSignature />
                            <h1 className="text">{!accountInfo.signatureProfileText ? Language("ACCOUNT_NO_SIGNATURETEXT") : accountInfo.signatureProfileText}</h1>
                        </div>
                    </>
                ) : ''}
                
                <div className="descinfo">
                    <div className="info">
                        <section>
                            <h1>{Language("ACCOUNT_INFO_DESC_TITLE_CREATEAT")}</h1>
                            <span>{Moment(accountInfo.createAt).format('DD.MM.YYYY')}</span>
                        </section>
                        <section>
                            <h1>{Language("ACCOUNT_INFO_DESC_TITLE_ACTIVE_ADS")}</h1>
                            <span>{accountInfo.productsActiveCount.toLocaleString()}</span>
                        </section>
                        <section>
                            <h1>{Language("ACCOUNT_INFO_DESC_TITLE_TOTAL_ADS")}</h1>
                            <span>{accountInfo.productsCount.toLocaleString()}</span>
                        </section>

                        {accountInfo.birthDate || accountInfo.birthDateShow ? (
                            <section>
                                <h1>{Language("ACCOUNT_INFO_DESC_TITLE_BIRTHDATE")}</h1>
                                <span>{
                                    (!accountInfo.birthDate && accountInfo.birthDateShow) ? accountInfo.birthDateShow
                                    : !accountInfo.birthDate || !parseInt(accountInfo.birthDate) ? Language("NOT_INSTALL")
                                    : Moment(new Date(parseInt(accountInfo.birthDate))).format('DD.MM.YYYY')
                                }</span>
                            </section>
                        ) : ''}

                        {accountInfo.gender !== undefined && accountInfo.gender !== null ? (
                            <section>
                                <h1>{Language("ACCOUNT_INFO_DESC_TITLE_GENDER")}</h1>
                                <span>{Language("GENDER_" + accountInfo.gender)}</span>
                            </section>
                        ) : ''}
                    </div>
                </div>

                {profileJSX}
            </div>
        </div>
    )
}

interface AccountMenuProps {
    isMenu?: boolean
}
export function AccountMenu({
    isMenu
}: AccountMenuProps) {
    const location = useLocation()

    const [ btnCounter, setBtnCounter ] = React.useState({
        messages: 0,
        notifications: 0
    })

    React.useMemo(() => {
        API({
            url: '/defaultapi/user/dialogs/message/allunreadcounts',
            type: 'get'
        }).done(result => {
            if(result.statusCode === 200) {
                setBtnCounter(old => {
                    return {...old, messages: result.message}
                })
            }
            else notify("(account) /user/dialogs/message/allunreadcounts: " + result.message, { debug: true })
        })

        API({
            url: '/defaultapi/user/notifications/unreadcount',
            type: 'get'
        }).done(result => {
            if(result.statusCode === 200) {
                setBtnCounter(old => {
                    return {...old, notifications: result.message}
                })
            }
            else notify("(account) /user/notifications/unreadcount: " + result.message, { debug: true })
        })

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

        Gateway.on('user', 'onNotificationsRead', (count: number) => {
            setBtnCounter(old => {
                old.notifications -= count
                if(old.notifications < 0) old.notifications = 0
    
                return {...old}
            })
        })
        Gateway.on('user', 'onNotificationsSend', (notification: UserNotificationsDTO) => {
            setBtnCounter(old => {
                old.notifications += 1
                return {...old}
            })
        })
    }, [])

    return (
        <div className="accountMenu">
            <ul className="nav main">
                {!isMenu ? (
                    <Link to="/account" className={`li ${location.pathname === '/account' && 'selected'}`}>{Language("HEADER_ACCOUNT_MENU_ITEM_ACCOUNT", "account menu")}</Link>
                ) : ''}

                <Link to="/account/ad" className={`li ${location.pathname.indexOf('/account/ad') !== -1 && 'selected'}`}>{Language("HEADER_ACCOUNT_MENU_ITEM_ADS", "account menu")}</Link>
                {/* <Link to="/account/reactions" className={`li ${location.pathname.indexOf('/account/reactions') !== -1 && 'selected'}`}>{Language("HEADER_ACCOUNT_MENU_ITEM_REACTIONS", "account menu")}</Link>
                <Link to="/account/rating" className={`li ${location.pathname.indexOf('/account/rating') !== -1 && 'selected'}`}>{Language("HEADER_ACCOUNT_MENU_ITEM_RATING", "account menu")}</Link> */}
            </ul>
            <ul className="nav">
                <Link to="/account/favorites" className={`li ${location.pathname.indexOf('/account/favorites') !== -1 && 'selected'}`}>{Language("HEADER_ACCOUNT_MENU_ITEM_FAVORITES", "account menu")}</Link>
                <Link to="/account/messages" className={`li ${location.pathname.indexOf('/account/messages') !== -1 && 'selected'} blockcount`} data-count={btnCounter.messages}>{Language("HEADER_ACCOUNT_MENU_ITEM_MESSAGES", "account menu")}</Link>
                <Link to="/account/notifications" className={`li ${location.pathname.indexOf('/account/notifications') !== -1 && 'selected'} blockcount`} data-count={btnCounter.notifications}>{Language("HEADER_ACCOUNT_MENU_ITEM_NOTIFICATIONS", "account menu")}</Link>
                <Link to="/account/settings" className={`li ${(location.pathname.indexOf('/account/settings') !== -1) && 'selected'}`}>{Language("HEADER_ACCOUNT_MENU_ITEM_SETTINGS", "account menu")}</Link>
                {/* <Link to="/account/services" className={`li ${location.pathname.indexOf('/account/services') !== -1 && 'selected'}`}>{Language("HEADER_ACCOUNT_MENU_ITEM_SERVICES", "account menu")}</Link> */}
                <Link to="/account/sessions" className={`li ${location.pathname.indexOf('/account/sessions') !== -1 && 'selected'}`}>{Language("HEADER_ACCOUNT_MENU_ITEM_SESSIONS", "account menu")}</Link>
                <Link to="/account/reports" className={`li ${location.pathname.indexOf('/account/reports') !== -1 && 'selected'}`}>{Language("HEADER_ACCOUNT_MENU_ITEM_REPORTS", "account menu")}</Link>
                <Link to="/account/support" className={`li ${location.pathname.indexOf('/account/support') !== -1 && 'selected'}`}>{Language("HEADER_ACCOUNT_MENU_ITEM_SUPPORT", "account menu")}</Link>
            </ul>
            <ul className={`nav ${isMenu && 'center'}`}>
                <Link to="/account/savedaccounts" className={`li ${location.pathname.indexOf('/account/savedaccounts') !== -1 && 'selected'}`}>{Language("HEADER_ACCOUNT_MENU_ITEM_SAVEDACCOUNTS", "account menu")}</Link>
                <Link to="#logout" className="li logout">{Language("HEADER_ACCOUNT_MENU_ITEM_LOGOUT", "account menu")}</Link>
            </ul>
        </div>
    )
}



function AccountBannedBlock() {
    const location = useLocation()

    const [ desc, setDesc ] = React.useState<{
        status: boolean
        comment: string
        expires: Date
    }>(null)
    const [ loader, setLoader ] = React.useState(true)

    React.useMemo(() => {
        setLoader(true)
        if(window.userdata.banned) {
            API({
                url: '/defaultapi/user/getbanned/desc',
                type: 'get'
            }).done(result => {
                if(result.statusCode === 200) setDesc(result.message.banned)
                else {
                    notify("(account.AccountBannedBlock) /user/getbanned/desc: " + result.message, { debug: true })
                }

                setLoader(false)
            })
        }
        else setLoader(false)
    }, [])

    if(location.pathname.indexOf('/account/messages/') !== -1
        || location.pathname.indexOf('/account/reports/') !== -1
        || location.pathname.indexOf('/account/support/') !== -1)return

    if(!window.userdata.banned || loader)return
    if(!desc)return (<>ERROR. CHECK CONSOLE</>)
    
    return (
        <div className={`accountBannedBlock ${
            (location.pathname.indexOf('/account/message') !== -1) ? 'outBodyPadding' : ''
        }`}>
            <div className="icon">
                <FaBan />
            </div>
            <div className="wrapper">
                <h6 className="title">{Language("ACCOUNT_BANNED_BLOCK_TITLE")}</h6>
                <div className="description">
                    <span className="info">{Language("ACCOUNT_BANNED_BLOCK_DESC_INFO")}</span>
                    <span className="comment">{Language("ACCOUNT_BANNED_BLOCK_DESC_COMMENT", null, { isjsx: true }, desc.comment)}</span>
                    <span className="expires">{Language("ACCOUNT_BANNED_BLOCK_DESC_EXPIRES", null, { isjsx: true }, Moment(desc.expires).calendar())}</span>
                </div>

                {location.pathname.indexOf('/account/support') === -1 ? (
                    <div className="help">
                        <span>{Language("ACCOUNT_BANNED_BLOCK_HELP", null, { isjsx: true })}</span>
                        <Link to={"/account/support"}>
                            <Button name={Language("ACCOUNT_BANNED_BLOCK_HELP_ACTION")} size={!window.isPhone ? "normal" : "min"} />
                        </Link>
                    </div>
                ) : ''}
            </div>
        </div>
    )
}