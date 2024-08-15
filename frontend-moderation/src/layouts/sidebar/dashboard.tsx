import { Language } from '@modules/Language'
import React from 'react'
import { MdOutlineDashboard } from 'react-icons/md'
import { Link, useLocation } from 'react-router-dom'

export default function SidebarDashboard() {
    const location = useLocation()

    // if(!RolePrivilegesVerifyIndexOf('/moderation/product', user.roles))return
    return (
        <section className=
            {`elem ${(location.pathname === '/dashboard'
                || location.pathname.indexOf('/dashboard/myaccount') === 0
                || location.pathname.indexOf('/dashboard/settings') === 0) ? "selected" : ""}
            `}>
            <Link to="/dashboard" className="title">
                <MdOutlineDashboard />
                <span>{Language("NAV_NAVIGATION_TITLE_DASHBOARD", "Главная")}</span>
            </Link>
            
            <ul>
                <Link to="/dashboard" className={`li ${location.pathname === '/dashboard' ? "selected" : ""}`}>{Language("NAV_NAVIGATION_TITLE_DASHBOARD_STATISTICS", "Статистика")}</Link>
                <Link to="/dashboard/myaccount" className={`li ${location.pathname.indexOf('/dashboard/myaccount') === 0 ? "selected" : ""}`}>{Language("NAV_ACCOUNT_LINK_MYACCOUNT", "Мой аккаунт")}</Link>
                <Link to="/dashboard/settings" className={`li ${location.pathname.indexOf('/dashboard/settings') === 0 ? "selected" : ""}`}>{Language("NAV_NAVIGATION_TITLE_DASHBOARD_SETTINGS", "Настройки")}</Link>
            </ul>
        </section>
    )
}