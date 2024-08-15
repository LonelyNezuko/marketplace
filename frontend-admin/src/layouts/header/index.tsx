import React from 'react'
import { Link } from 'react-router-dom'
import $ from 'jquery'

import { Avatar } from '@components/avatar/avatar'

import './index.scss'

import { HiUser } from "react-icons/hi2";
import { IoMdSettings } from "react-icons/io";
import { GoTasklist } from "react-icons/go";

import { API } from '@modules/API'
import { notify } from '@modules/Notify'
import Roletag from '@components/roletag'
import { RoleGetHighIndex } from '@modules/RolePrivilegesVerify'
import ContextMenu from '@components/contextmenu'
import DropdownMenu from '@components/dropdownmenu'

import { MdBrowserUpdated } from "react-icons/md";
import UserDTO from '@dto/user.dto'

export default function Header() {
    const [ loaderAccount, setLoaderAccount ] = React.useState(true)
    const [ account, setAccount ] = React.useState<UserDTO>(null)
    
    React.useMemo(() => {
        setLoaderAccount(true)

        API({
            url: "/defaultapi/user/",
            type: 'get'
        }).done(result => {
            if(result.statusCode === 200) {
                setAccount(result.message)
                setLoaderAccount(false)
            }
            else notify('(header) /user: ' + result.message, { debug: true })
        })
    }, [])

    const [ lastUpdateBtnView, setLastUpdateBtnView ] = React.useState(false)
    React.useEffect(() => {
        if(window.lastUpdateBtnView) setLastUpdateBtnView(true)
    }, [window.lastUpdateBtnView])

    return (
        <header id="header">
            <section className="section"></section>
            <section className="section">
                {lastUpdateBtnView ? (
                    <Link to="#whatnew" className="lastupdatebtn">
                        <button className="btn btn-icon">
                            <MdBrowserUpdated />
                        </button>
                        <div>
                            <h1>Последнее обновление</h1>
                            <span>Узнайте, что нового мы добавили</span>
                        </div>
                    </Link>
                ) : ''}
                <div className="account" id='headerAccountDropdown'>
                    {!account || loaderAccount ? (
                        <div className="wrap" style={{gap: "8px"}}>
                            <div className="username">
                                <div className="_loaderdiv" style={{width: "120px", height: "20px"}}></div>
                                <div className="_loaderdiv" style={{width: "100px", height: "16px", marginTop: "6px"}}></div>
                            </div>
                            <div className="_loaderdiv" style={{width: "50px", height: "50px", borderRadius: "50%"}}></div>
                        </div>
                    ) : (
                        <>
                            <div className="wrap">
                                <div className="username">
                                    <h1>{account.name[0] + " " + account.name[1]}</h1>
                                    <Roletag role={RoleGetHighIndex(account.roles)} styles={{marginTop: "6px"}} />
                                </div>
                                <Avatar circle={true} image={account.avatar.image} size={account.avatar.size} position={account.avatar.position} />
                            </div>

                            <DropdownMenu list={[
                                { link: '/account', content: "Мой аккаунт" },
                                { link: '/account/settings', content: "Настройки" },
                                { link: '/account/tasks', content: "Задачи" },
                                { link: '#logout', content: "Выйти", bottom: true },
                            ]} />
                        </>
                    )}
                </div>
            </section>
        </header>
    )
}