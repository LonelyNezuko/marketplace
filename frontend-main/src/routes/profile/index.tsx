import React from 'react'
import { Link, Navigate, useParams, useLocation } from 'react-router-dom'

import './index.scss'
// import '@routes/account/index.scss'

import { Language } from '@modules/Language'
import { RouteErrorCode, RouteErrorCodeProps } from '../errorcodes'
import { CircleLoader } from '@components/circleLoader/circleLoader'
import { API } from '@modules/API'
import { notify } from '@modules/Notify'
import { AccountInfo } from '../account'

import { ActiveAds, Reactions } from '@routes/account/index/index'

import CONFIG from '@config'
import AdCart, { AdCartLoaderDiv } from '@components/adcart'
import { Modal } from '@components/modals'
import Input from '@components/input'

import { MdTextsms } from "react-icons/md";
import { GoBlocked } from "react-icons/go";
import { VscReport } from "react-icons/vsc";
import { CgUnblock } from "react-icons/cg";
import Cookies from 'universal-cookie'
import ModalLoader from '@components/modals/loader'
import { Alert } from '@components/alert'
import UserDTO from '@dto/user.dto'
import SetRouteTitle from '@modules/SetRouteTitle'
import EmailVerify from '@components/emailVerify'
import PhoneHeaderTitle from '@components/phoneHeaderTitle'
import Button from '@components/button'
import { reportModalShow } from '@src/store/reportModal'
import store from '@src/store'

export default function RouteProfile() {
    const params = useParams()
    const location = useLocation()

    const [ loader, setLoader ] = React.useState(true)
    const [ errorPage, setErrorPage ] = React.useState<RouteErrorCodeProps>({ code: 0, text: '', showbtn: false })

    const [ navigate, setNavigate ] = React.useState(null)
    React.useEffect(() => { if(navigate !== null) setNavigate(null) }, [navigate])

    const [ sendMessageModal, setSendMessageModal ] = React.useState(false)

    const [ accountInfo, setAccountInfo ] = React.useState<UserDTO>(null)
    React.useMemo(() => {
        setLoader(true)

        const id = parseInt(params.id)
        if(!id || id < 1 || isNaN(id)) {
            setErrorPage({ code: 400, text: Language("400PAGE_TEXT", "ошибка"), showbtn: true, btnurl: '/', btnname: Language('404PAGE_BTN', 'главная') })
            return
        }

        API({
            url: '/defaultapi/user/profile',
            type: 'get',
            data: {
                userid: id
            }
        }).done(result => {
            if(result.statusCode === 200) {
                setAccountInfo(result.message)
                setLoader(false)
            }
            else {
                if(result.statusCode === 401) setErrorPage({ code: 401 })
                else if(result.statusCode === 404) setErrorPage({ code: 404 })
                else if(result.statusCode === 400) setErrorPage({ code: 400 })
                else notify("(profile) /user: " + result.message, { debug: true })
            }
        })
    }, [])

    React.useEffect(() => {
        if(accountInfo) {
            if(location.hash.indexOf('#message') !== -1
                && location.hash.indexOf('#signin') === -1) {
                if(!window.jwtTokenExists)return setNavigate(`#signin?redirect=/profile/${accountInfo.id}#message`)
                if(window.userdata.uid == accountInfo.id || window.userdata.banned)return setNavigate(location.pathname + location.search)

                setSendMessageModal(true)
            }
            else setSendMessageModal(false)
        }
    }, [location])

    React.useEffect(() => {
        if(accountInfo) {
            SetRouteTitle(Language("ROUTE_TITLE_PROFILE", null, null, accountInfo.name[0] + ' ' + accountInfo.name[1], accountInfo.productsCount))
        }
    }, [accountInfo])

    if(errorPage.code !== 0)return (
        <RouteErrorCode style={{marginTop: "128px"}} code={errorPage.code} text={errorPage.text}
            showbtn={errorPage.showbtn} btnurl={errorPage.btnurl} btnname={errorPage.btnname}
            icon={errorPage.icon} />
    )
    if(loader)return (
        <section style={{display: 'flex', justifyContent: 'center', marginTop: '128px'}}>
            <CircleLoader type="big" color={`var(--tm-color)`} />
        </section>
    )

    if(!accountInfo)return
    return (
        <div className="route" id="routeProfile">
            {sendMessageModal ? (
                <SendMessageModal
                    accountInfo={accountInfo}

                    setNavigate={setNavigate}
                    setErrorPage={setErrorPage}
                />
            ) : ''}

            {window.isPhone ? (
                <PhoneHeaderTitle text={Language("PROFILE_PHONE_TITLE")}
                    description={Language("PROFILE_PHONE_TITLE_DESCRIPTION", null, null, accountInfo.name[0] + ' ' + accountInfo.name[1], accountInfo.productsActiveCount)}
                    outBodyPadding={true}
                />
            ) : ''}

            <div className="profileWrapper">
                <div className="profileBody">
                    <ActiveAds account={accountInfo} loader={loader} profile={true} />
                    <RecentlyClosedAds account={accountInfo} loader={loader} />
                    {/* <Reactions account={accountInfo} loader={loader} /> */}
                </div>
                <div className="profileRight">
                    <AccountInfo loader={loader} accountInfo={accountInfo} profileJSX={(
                        <div className="actions">
                            {/* <button className="btn unblock">
                                <span>{Language("PROFILE_ACCOUNT_ACTION_UNBLOCK")}</span>
                            </button> */}

                            <Link to="#message">
                                <Button name={Language("PROFILE_ACCOUNT_ACTION_SENDMESSAGE")} icon={<MdTextsms />} />
                            </Link>

                            {window.userdata.uid !== accountInfo.id ? (
                                <Button name={Language("PROFILE_ACCOUNT_ACTION_BLOCK")} icon={<GoBlocked />} classname='block' />
                            ) : ''}

                            {window.userdata.uid !== accountInfo.id ? (
                                <Button name={Language("REPORTING")} icon={<VscReport />} classname='report' onClick={() => {
                                    store.dispatch(reportModalShow({ toggle: true, type: 'user', suspectID: accountInfo.id }))
                                }} />
                            ) : ''}
                        </div>
                    )} />
                </div>
            </div>


            {navigate ? (<Navigate to={navigate} />) : ''}
        </div>
    )
}


function SendMessageModal({
    accountInfo,

    setNavigate,
    setErrorPage
}) {
    const location = useLocation()

    const [ loader, setLoader ] = React.useState(false)

    const [ emailVerify, setEmailVerify ] = React.useState(store.getState().emailVerifyReducer || null)
    React.useEffect(() => {
        const storeUnsubscribe = store.subscribe(() => {
            const emailVerifyState = store.getState().emailVerifyReducer
            if(emailVerifyState) setEmailVerify(emailVerifyState)
        })

        return () => {
            storeUnsubscribe()
        }
    }, [])

    const [ value, setValue ] = React.useState('')
    function onSubmit() {
        if(!value.length || loader)return

        setLoader(true)
        API({
            url: '/defaultapi/user/dialogs/message',
            type: 'post',
            data: {
                text: value,
                attachments: JSON.stringify([]),
                usersid: JSON.stringify([ accountInfo.id ])
            }
        }).done(result => {
            setLoader(false)
            setNavigate(location.pathname + location.search)

            if(result.statusCode === 200) {
                setNavigate(`/account/messages/${result.message.dialogid}`)
            }
            else if(result.message === 'You do not have access to this dialog') {
                Alert(Language("CANT_SEND_MESSAGE"))
            }
            else {
                setErrorPage({ code: result.statusCode })
                notify("(product submit message) /user/dialogs/message: " + result.message, { debug: true })
            }
        })
    }
    
    if(!emailVerify && window.userdata.uid !== -1)return (<EmailVerify type={"messages"} modal={true} onModalClose={() => {
        setNavigate(location.pathname + location.search)
    }} />)
    if(loader)return (<ModalLoader text={Language("MESSAGE_SENDING")} />)
    
    return (
        <Modal toggle={true} title={Language("SEND_MESSAGE")} desciption={Language('PROFILE_SEND_MESSAGE_DESC')}
            id={"profileSendMessageModal"}
            phoneVersion={true}
            phoneHideBtn={true}
            style={{ width: '650px' }}

            body={(
                <Input type={"textarea"}
                    deleteLabel={true}

                    value={value}
                    onInput={event => setValue(event.target.value)}

                    textareaMaxRows={8}
                    textareaDefaultRows={4}
                />
            )}

            buttons={[ Language("CANCEL"), Language("SEND") ]}
            buttonsBlock={!value.length}

            onClick={onSubmit}
            onClose={() => setNavigate(location.pathname + location.search)}
        />
    )
}


function RecentlyClosedAds({
    loader,
    account
}) {
    const [ loaderAds, setLoaderAds ] = React.useState(true)
    const [ products, setProducts ] = React.useState([])

    React.useMemo(() => {
        setLoaderAds(true)
    }, [])

    React.useEffect(() => {
        setLoaderAds(true)
        if(!loader) load()
    }, [loader, ''])

    function load() {
        API({
            url: '/defaultapi/product/list',
            type: 'get',
            data: {
                ownerID: account.id,
                pagination: { page: 1, limit: 4 },
                status: CONFIG.enumProductStatus.PRODUCT_STATUS_CLOSED,
                between: {
                    where: 'prodStatusUpdateAt',
                    from: new Date(+new Date - ((86400 * 3) * 1000)).toISOString(),
                    to: new Date().toISOString()
                }
            }
        }).done(result => {
            if(result.statusCode === 200) {
                setProducts(result.message)
                setLoaderAds(false)
            }
            else notify("(accountPageIndex) /products/list: " + result.message, { debug: true })
        })
    }

    return (
        <div className="block activeads blockads" style={{display: loader && !products.length ? 'none' : 'block'}}>
            <h1 className="blocktitle">{Language("ACCOUNT_PAGEINDEX_RECENLTYCLOSEDADS_TITLE")}</h1>
            {(!loaderAds && !products.length) ? (
                <div className="noelems actions">
                    <h1>{Language("ACCOUNT_PAGEINDEX_RECENLTYCLOSEDADS_NO")}</h1>
                </div>
            ) : ''}
            {(loaderAds || products.length) ? (
                <div className="list">
                    {!loaderAds ? (
                        <>
                            <AdCartLoaderDiv size={"min"} type={"vertical"} />
                            <AdCartLoaderDiv size={"min"} type={"vertical"} />
                            <AdCartLoaderDiv size={"min"} type={"vertical"} />
                            <AdCartLoaderDiv size={"min"} type={"vertical"} />
                            <AdCartLoaderDiv size={"min"} type={"vertical"} />
                        </>
                    ) : ''}
                    {products.map((item, i) => {
                        if(loaderAds)return
                        return (<AdCart product={item} key={i} type={"vertical"} size={"min"} />)
                    })}

                    {(account.productsActiveCount > 4 && !loaderAds) ? (
                        <Link to="/account/ads" className="moreads">
                            <section>
                                <h1>{Language("ACCOUNT_PAGEINDEX_ACTIVEADS_MORE", null, {}, account.productsActiveCount - 4)}</h1>
                            </section>
                        </Link>
                    ) : ''}
                </div>
            ) : ''}
        </div>
    )
}