import React from "react";

import './index.scss'
import { Language } from "@modules/Language";

import { BiSolidNews } from "react-icons/bi";
import { FaSearch } from "react-icons/fa";
import { BiSolidCategory } from "react-icons/bi";
import { HiPlus } from "react-icons/hi";
import { FaPlus } from "react-icons/fa6";
import { BiSolidMessageAlt } from 'react-icons/bi'
import { GoBellFill } from 'react-icons/go'
import { FaUser } from "react-icons/fa";

import { Link, Navigate, useLocation } from "react-router-dom";
import Cookies from "universal-cookie";
import { ModalFirstSettings } from "@components/modals/firstSettings";
import { onChangeFirstSettings } from "@layouts/sidebar";
import UserDTO, { UserDialogDTO, UserMessageDTO } from "@dto/user.dto";
import { API } from "@modules/API";
import Gateway from "@modules/Gateway";
import { Avatar } from "@components/avatar/avatar";
import { notify } from "@modules/Notify";
import AvatarDTO from "@dto/avatar.dto";
import { CustomStorage } from "@modules/CustomStorage";

export default function BottomNavigate() {
    const location = useLocation()

    const [ navigate, setNavigate ] = React.useState(null)
    React.useEffect(() => {
        if(navigate !== null) setNavigate(null)
    }, [navigate])

    const [ account, setAccount ] = React.useState<UserDTO>(null)
    const [ btnCounter, setBtnCounter ] = React.useState({
        messages: 0,
        notifications: 0
    })

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
    }, [])
    React.useEffect(() => {
        load()
    }, [window.jwtTokenExists])

    function load() {
        if(window.jwtTokenExists) {
            API({
                url: '/defaultapi/user/dialogs/message/allunreadcounts',
                type: 'get'
            }).done(result => {
                if(result.statusCode === 200) {
                    setBtnCounter(old => {
                        return {...old, messages: result.message}
                    })
                }
                else notify("(header) /user/dialogs/message/allunreadcounts: " + result.message, { debug: true })
            })
        }
    }

    const [ changeLanguageModal, setChangeLanguageModal ] = React.useState(false)

    React.useMemo(() => {
        if(window.languageChoiceModal
            || window.geolocationChoiceModal
            || window.currencyChoiceModal) setChangeLanguageModal(true)
    }, [])

    const [ categoriesBtnSelected, setCategoriesBtnSelected ] = React.useState(false)
    React.useEffect(() => {
        if(location.pathname === '/categories'
            || (location.pathname !== '/feed'
                && location.pathname.indexOf('/ad/') === -1
                && location.pathname.indexOf('/search') === -1
                && location.pathname !== '/placead'
                && location.pathname.indexOf('/account') === -1)
                && location.pathname.indexOf('/menu') === -1
                && location.pathname !== '/about'
                && location.pathname !== '/advertisement'
                && location.pathname !== '/copyright'
                && location.pathname.indexOf('/article') === -1
                && location.pathname.indexOf('/profile') === -1) setCategoriesBtnSelected(true)
        else setCategoriesBtnSelected(false)
        
    }, [location])

    if(!window.isPhone)return
    return (
        <nav id="bottomNavigate">
            <ul className="list">
                <Link to="/feed" className={`elem feed ${(location.pathname === '/feed' || location.pathname.indexOf('/ad/') !== -1) && 'selected'}`}>
                    <div className="icon">
                        <BiSolidNews />
                    </div>
                    <h6 className="title">{Language("BOTTOM_NAVIGATE_ELEM_FEED_TITLE")}</h6>
                </Link>
                <Link to="/search" className={`elem search ${location.pathname.indexOf('/search') !== -1 && 'selected'}`}>
                    <div className="icon">
                        <FaSearch />
                    </div>
                    <h6 className="title">{Language("BOTTOM_NAVIGATE_ELEM_SEARCH_TITLE")}</h6>
                </Link>
                <Link to="/placead" className={`elem placead ${location.pathname === '/placead' && 'selected'}`} onClick={event => {
                    if(!window.jwtTokenExists) {
                        event.preventDefault()
                        setNavigate(window.location.pathname + '#signin?redirect=/placead&desc=placead')
                    }
                }}>
                    <div className="icon">
                        <FaPlus />
                    </div>
                </Link>
                {/* <Link to="/account/messages" className="elem messages">
                    <div className="icon">
                        <BiSolidMessageAlt />
                    </div>
                    <h6 className="title">{Language("BOTTOM_NAVIGATE_ELEM_MESSAGES_TITLE")}</h6>
                </Link>
                <Link to="/account/notifications" className="elem notifications">
                    <div className="icon">
                        <GoBellFill />
                    </div>
                    <h6 className="title">{Language("BOTTOM_NAVIGATE_ELEM_NOTIFICATIONS_TITLE")}</h6>
                </Link> */}
                <Link to="/categories" className={`elem categories ${categoriesBtnSelected && 'selected'}`}>
                    <div className="icon">
                        <BiSolidCategory />
                    </div>
                    <h6 className="title">{Language("BOTTOM_NAVIGATE_ELEM_CATEGORIES_TITLE")}</h6>
                </Link>
                <Link to="/menu" className={`elem ${account && 'accountyes'} menu ${(location.pathname.indexOf('/account') !== -1 || location.pathname.indexOf('/menu') !== -1) && 'selected'}`}>
                    <div className="icon">
                        {account ? (
                            <Avatar {...account.avatar} circle={true} onlinestatus={btnCounter.messages > 0 || btnCounter.notifications > 0} />
                        ) : (<FaUser />)}
                    </div>
                    <h6 className="title">{Language("BOTTOM_NAVIGATE_ELEM_MENU_TITLE")}</h6>
                </Link>
            </ul>

            {navigate ? (<Navigate to={navigate} />) : ''}
            {changeLanguageModal ? (<ModalFirstSettings defaultLang={window.language} defaultCurrency={window.userdata.currency} onChange={(language, currency, changeGeolocation) => {
                onChangeFirstSettings(language, currency, changeGeolocation)
                setChangeLanguageModal(false)
            }} />) : ''}
        </nav>
    )
}