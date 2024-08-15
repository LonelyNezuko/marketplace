import React from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import Cookies from 'universal-cookie'
import $ from 'jquery'

import CONFIG from '@config'

import Input from '@components/input'
import { Avatar } from '@components/avatar/avatar'
import { CircleLoader } from '@components/circleLoader/circleLoader'
import { ModalCategories } from '@components/modals/categories/categories'

import { API, APISync } from '@modules/API'
import { Language } from '@modules/Language'
import { notify } from '@modules/Notify'

import './index.scss'

import { LuMapPin } from 'react-icons/lu'

import { MdCategory } from 'react-icons/md'

import { IoSearchSharp } from 'react-icons/io5'

import { IoCart } from 'react-icons/io5'
import { BiSolidMessageAlt } from 'react-icons/bi'
import { GoBellFill } from 'react-icons/go'

import { IoIosArrowDown } from 'react-icons/io'

import { RiAccountBoxLine } from 'react-icons/ri'
import { RiAdvertisementLine } from 'react-icons/ri'
import { VscReactions } from 'react-icons/vsc'
import { FaRegStar } from 'react-icons/fa6'
import Username from '@components/username'

import CONFIG_SERVER from '@config.server'
import Gateway from '@modules/Gateway'

import Address from '@components/address'
import { RolePrivilegesVerifyIndexOf } from '@modules/RolePrivilegesVerify'
import UserDTO, { UserDialogDTO, UserMessageDTO } from '@dto/user.dto'
import Button from '@components/button'

import { HiMenuAlt2 } from "react-icons/hi";

import { MdCreateNewFolder } from "react-icons/md";
import { PiBookmarkSimpleFill } from 'react-icons/pi'
import UserNotificationsDTO from '@dto/user.notifications.dto'
import AvatarDTO from '@dto/avatar.dto'
import { CustomStorage } from '@modules/CustomStorage'
import GlobalSearch from '@components/globalSearch'

export default function Header() {
    const location = useLocation()

    const [ navigate, setNavigate ] = React.useState(null)
    React.useEffect(() => {
        if(navigate !== null) setNavigate(null)
    }, [navigate])

    const [ totalAds, setTotalAds ] = React.useState(0)
    const [ promotion, setPromotion ] = React.useState<{ image?: string, text?: string, link?: string }>({
        // image: 'https://ir.ozone.ru/s3/cms/53/t3b/wc1450/gf2830.png',
        // text: "АКЦИЯ",
        // link: '/dasdasd'
    })

    const [ geolocationLoader, setGeoLocationLoader ] = React.useState(true)
    const [ geolocation, setGeolocation ] = React.useState(null)

    React.useMemo(() => {
        API({
            url: '/defaultapi/product/counter',
            type: 'get'
        }).done(result => {
            if(result.statusCode === 200) setTotalAds(result.message)
            else notify("(header) products/counter: " + result.message, { debug: true })
        })
    }, [])

    React.useEffect(() => {
        setGeolocation(window.userdata.geolocation)
        setGeoLocationLoader(false)
    }, [window.userdata.geolocation])

    return (
        <header id="header">
            <div className="bottom">
                <div className="logo">
                    <div className="sidebarSwipe" id='sideBarSwipe'>
                        <Button icon={<HiMenuAlt2 />} type={"hovertransparent"} size={"normal"} iconOnly={true} tabIndex={0}
                            onClick={() => {
                                let state: number | boolean = parseInt(window.localStorage.getItem('sidebar_state'))

                                if(state === undefined || isNaN(state) || state === 1) state = 0
                                else state = 1

                                window.localStorage.setItem('sidebar_state', state.toString())
                                window.dispatchEvent(new Event('storage'))
                            }}
                        />
                    </div>
                    <Link className="logotype" to="/feed" onClick={event => {
                        if(location.pathname === '/') {
                            event.preventDefault()
                            setNavigate('#refresh')
                        }
                    }}>
                        <img style={{ transform: 'translateY(4px)' }} src="/assets/logo/uk128x.png" alt={CONFIG.serviceName + " - " + CONFIG.serviceSlogan} className="logoicon" />
                    </Link>
                </div>

                <GlobalSearch />
                <Account setNavigate={setNavigate} />
            </div>

            {navigate ? (<Navigate to={navigate} />) : ''}

        </header>
    )
}

function PopularCategoriesWithoutParent() {
    const [ loader, setLoader ] = React.useState(true)
    const [ categories, setCategories ] = React.useState([])

    React.useMemo(() => {
        API({
            url: '/defaultapi/category/popular/withoutparent',
            type: 'get',
            data: {
                limit: 5
            }
        }).done(result => {
            if(result.statusCode === 200) {
                setCategories(result.message)
                setLoader(false)
            }
            else notify("(header) /category/popular/withoutparent: " + result.message, { debug: true })
        })
    }, [])

    if(loader)return (
        <>
            <div style={{width: "70px"}} className="_loaderdiv"></div>
            <div style={{width: "110px"}} className="_loaderdiv"></div>
            <div style={{width: "80px"}} className="_loaderdiv"></div>
            <div style={{width: "100px"}} className="_loaderdiv"></div>
        </>
    )
    return (
        <>
            {categories.map((item, i) => {
                return (
                    <Link key={i} className="li" to={`/${item.categoryLink}`}>
                        <h1 className="title">{item.categoryNameTranslate[window.language] || item.categoryName}</h1>
                    </Link>
                )
            })}
        </>
    )
}

function Categories() {
    const [ categoriesShow, setCategoriesShow ] = React.useState(false)
    const [ showkd, setShowkd ] = React.useState(0)

    React.useMemo(() => {
        $(document).on('click', event => {
            if(!$(event.target).is('.modal.categories')
                && $(event.target).parents('.modal.categories').length == 0
                && $('#allcategoriesbtn').hasClass('show')
                && !$(event.target).is('#allcategoriesbtn')
                && $(event.target).parents('#allcategoriesbtn').length == 0) {
                setCategoriesShow(false)
            }
        })
    }, [])

    return (
        <>
            <button data-showkd={showkd} id="allcategoriesbtn" className={`btn big allcategories ${categoriesShow ? 'show selected' : ''}`} onClick={() => {
                setCategoriesShow(!categoriesShow)
            }}>
                <MdCategory />
                <span>{Language("CATEGORIES", "categories")}</span>
            </button>

            {categoriesShow ? (
                <ModalCategories allBtn={false} linkTarget={true} onChoiceCategory={() => setCategoriesShow(false)} onClose={() => setCategoriesShow(false)} />
            ) : ''}
        </>
    )
}

function Account({
    setNavigate
}) {
    const location = useLocation()

    const [ loader, setLoader ] = React.useState(true)
    const [ account, setAccount ] = React.useState<UserDTO>(null)

    const [ btnCounter, setBtnCounter ] = React.useState({
        messages: 0,
        notifications: 0
    })

    const [ debugModeBtn, setDebugModeBtn ] = React.useState(false)
    React.useEffect(() => {
        if(window.localStorage.getItem('debugmode')) setDebugModeBtn(true)
        else setDebugModeBtn(false)
    }, [window.localStorage.getItem('debugmode')])

    React.useMemo(() => {
        load()

        Gateway.on('user', 'onUpdateAvatar', (avatar: AvatarDTO) => {
            setAccount(old => {
                return {...old, avatar}
            })
        })
        Gateway.on('user', 'onUpdateName', (name: [string, string]) => {
            setAccount(old => {
                return {...old, name}
            })
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

    React.useEffect(() => {
        load()
    }, [window.jwtTokenExists])

    async function load() {
        setLoader(true)

        if(window.jwtTokenExists) {
            let result = await APISync({
                url: '/defaultapi/user',
                type: 'get'
            })
            if(result.statusCode === 200) {
                setAccount(result.message)
                setLoader(false)
            }
            else window.location.href = window.location.pathname

            result = await APISync({
                url: '/defaultapi/user/dialogs/message/allunreadcounts',
                type: 'get'
            })
            if(result.statusCode === 200) {
                setBtnCounter(old => {
                    return {...old, messages: result.message}
                })
            }
            else notify("(header) /user/dialogs/message/allunreadcounts: " + result.message, { debug: true })

            result = await APISync({
                url: '/defaultapi/user/notifications/unreadcount',
                type: 'get'
            })
            if(result.statusCode === 200) {
                setBtnCounter(old => {
                    return {...old, notifications: result.message}
                })
            }
            else notify("(header) /user/notifications/unreadcount: " + result.message, { debug: true })

            setLoader(false)
        }
        else setLoader(false)
    }

    function onPlaceAdBtn(event) {
        if(!window.jwtTokenExists) {
            event.preventDefault()
            setNavigate(window.location.pathname + '#signin?redirect=/placead&desc=placead')
        }
    }

    if(account && account.id)return (
        <div className="account yes">
            <div className="action">
                <Link to="/account/notifications" className="button blockcount" id="headerAccountActionNotify" data-count={btnCounter.notifications}>
                    <GoBellFill />
                </Link>
                <Link to="/account/messages" className="button blockcount" id="headerAccountActionMessages" data-count={btnCounter.messages}>
                    <BiSolidMessageAlt />
                </Link>
                <Link to="/account/favorites" className="button blockcount" id="headerAccountActionFavorites" /*data-count={1}*/>
                    <PiBookmarkSimpleFill />
                </Link>
                {/* <Link to="/cart" className="button" id="headerAccountActionCart">
                    <IoCart />
                </Link> */}
            </div>
            <div className="name">
                <Avatar image={account.avatar.image} sizeImage={45} circle={true} size={account.avatar.size} position={account.avatar.position} />
                <h1 className="title">
                    <Link to="/account" className="accountlink">
                        <Username account={account} hideStatus={true} />
                        <IoIosArrowDown />
                    </Link>

                    <ul className="menu">
                        <div className="menuwrap">
                            <div className="block">
                                <Link to="/account" className="li main">
                                    <div className="icon">
                                        <RiAccountBoxLine />
                                    </div>
                                    <span>{Language("HEADER_ACCOUNT_MENU_ITEM_ACCOUNT", "account menu")}</span>
                                </Link>
                                <Link to="/account/ad" className="li main">
                                    <div className="icon">
                                        <RiAdvertisementLine />
                                    </div>
                                    <span>{Language("HEADER_ACCOUNT_MENU_ITEM_ADS", "account menu")}</span>
                                </Link>
                                {/* <Link to="/account/reactions" className="li main">
                                    <div className="icon">
                                        <VscReactions />
                                    </div>
                                    <span>{Language("HEADER_ACCOUNT_MENU_ITEM_REACTIONS", "account menu")}</span>
                                </Link>
                                <Link to="/account/rating" className="li main">
                                    <div className="icon">
                                        <FaRegStar />
                                    </div>
                                    <span>{Language("HEADER_ACCOUNT_MENU_ITEM_RATING", "account menu")}</span>
                                </Link> */}
                            </div>
                            <div className="block">
                                <Link to="/account/favorites" className="li regular">
                                    <span>{Language("HEADER_ACCOUNT_MENU_ITEM_FAVORITES", "account menu")}</span>
                                </Link>
                                <Link to="/account/messages" className="li regular blockcount" data-count={btnCounter.messages}>
                                    <span>{Language("HEADER_ACCOUNT_MENU_ITEM_MESSAGES", "account menu")}</span>
                                </Link>
                                <Link to="/account/notifications" className="li regular">
                                    <span>{Language("HEADER_ACCOUNT_MENU_ITEM_NOTIFICATIONS", "account menu")}</span>
                                </Link>
                                <Link to="/account/settings" className="li regular">
                                    <span>{Language("HEADER_ACCOUNT_MENU_ITEM_SETTINGS", "account menu")}</span>
                                </Link>
                                {/* <Link to="/account/settings/security" className="li regular">
                                    <span>{Language("HEADER_ACCOUNT_MENU_ITEM_SECURITY", "account menu")}</span>
                                </Link> */}
                            </div>
                            {RolePrivilegesVerifyIndexOf('/tester/*', window.userdata.roles) ? (
                                <div className="block">
                                    <li className="li regular nothover" style={{ justifyContent: 'space-between', userSelect: 'none' }} onClick={() => {
                                        if(!debugModeBtn) window.localStorage.setItem('debugmode', '1')
                                        else window.localStorage.removeItem('debugmode')

                                        setDebugModeBtn(!debugModeBtn)
                                    }}>
                                        <span>Debug mode</span>
                                        <input type="checkbox" className='switch' checked={debugModeBtn} readOnly={true} />
                                    </li>
                                </div>
                            ) : ''}
                            <div className="block">
                                <Link to="#logout" className="li logout">
                                    <span>{Language("HEADER_ACCOUNT_MENU_ITEM_LOGOUT", "account menu")}</span>
                                </Link>
                            </div>
                        </div>
                    </ul>
                </h1>
            </div>
            <Link to="/placead" className="placead" onClick={onPlaceAdBtn}>
                <Button name={Language("PLACEAD", "PLACEAD")} size={"big"} icon={(<MdCreateNewFolder />)} iconPosition={'right'} />
            </Link>
        </div>
    )

    return (
        <div className="account none">
            {loader ? (
                <div style={{marginRight: '24px'}}>
                    <CircleLoader color={'var(--tm-color)'} />
                </div>) : ''}
            
            {!loader ? (
                <Link to="#signin" className="signin">
                    <Button name={Language("HEADER_ACCOUNT_BTN_SIGNIN", "войти")} type={"transparent"} />
                </Link>
            ) : ''}

            <Link to="/placead" className="placead" onClick={onPlaceAdBtn}>
                <Button name={Language("PLACEAD", "PLACEAD")} size={"big"} />
            </Link>
        </div>
    )
}