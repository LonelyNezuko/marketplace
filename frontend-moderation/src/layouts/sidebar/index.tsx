import React from 'react'
import $ from 'jquery'
import { Link, useLocation } from "react-router-dom";
import Cookies from 'universal-cookie';

import './index.scss'

import { Avatar } from '@components/avatar/avatar'
import {Select} from '@components/select/select';

import { Language } from '@modules/Language';

import { IoLogOut } from 'react-icons/io5'

import { MdOutlineDashboard } from 'react-icons/md'
import { MdReportProblem } from 'react-icons/md'
import { FaAdversal } from 'react-icons/fa6'
import { FaUsers } from 'react-icons/fa'
import { API } from '@modules/API';
import { notify } from '@modules/Notify';
import { RolePrivilegesVerify, RolePrivilegesVerifyIndexOf } from '@modules/RolePrivilegesVerify';

import { MdBrowserUpdated } from "react-icons/md";
import SidebarDashboard from './dashboard';
import SidebarProducts from './products';
import SidebarReports from './reports';
import SidebarUsers from './users';
import SidebarSupport from './support';

export default function Sidebar() {
    const cookies = new Cookies()
    const location = useLocation()

    const [ user, setUser ] = React.useState({
        name: ['', ''],
        avatar: { image: '/assets/avatars/default.png', size: 100, position: { x: 0, y: 0 } },
        roles: []
    })

    const [ loaded, setLoaded ] = React.useState(false)
    React.useMemo(() => {
        // api
        API({
            url: '/defaultapi/user',
            type: 'get'
        }).done(result => {
            if(result.statusCode === 200) {
                setUser(result.message)
                setLoaded(true)
            }
            else notify(result.message)
        })
    }, [])

    const [ lastUpdateBtnView, setLastUpdateBtnView ] = React.useState(false)
    React.useEffect(() => {
        if(window.lastUpdateBtnView) setLastUpdateBtnView(true)
    }, [window.lastUpdateBtnView])

    return (
        <header id="nav" className={loaded ? "loaded" : ""}>
            <div className="account">
                <div className="wrap">
                    <Avatar circle type="medium" image={user.avatar.image} size={user.avatar.size} position={user.avatar.position} />
                    <div className="title">
                        <h1 className="name">{user.name[0] + " " + user.name[1]}</h1>
                        <Link to="/dashboard/myaccount" className="btn myaccount">{Language("NAV_ACCOUNT_LINK_MYACCOUNT", "Мой аккаунт")}</Link>
                    </div>
                </div>
                <div className="wrap">
                    <Link to="#logout" className="btn btn-icon transparent hover exit">
                        <IoLogOut />
                    </Link>
                </div>
            </div>
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
            <nav>
                <SidebarDashboard />
                <SidebarProducts />
                <SidebarReports />
                <SidebarSupport />
                <SidebarUsers />
            </nav>
        </header>
    )
}