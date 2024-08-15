import { Language } from '@modules/Language'
import React from 'react'
import { FaUsers } from 'react-icons/fa'
import { Link, useLocation } from 'react-router-dom'

export default function SidebarUsers() {
    const location = useLocation()

    return (
        <section className={`elem ${location.pathname.indexOf('/users') === 0 ? "selected" : ""}`}>
            <Link to="/users" className="title">
                <FaUsers />
                <span>{Language("NAV_NAVIGATION_TITLE_USERS", "Статистика")}</span>
            </Link>
            
            <ul>
                <Link to="/users" className={`li ${location.pathname.indexOf('/users') !== -1 ? "selected" : ""}`}>{Language("NAV_NAVIGATION_TITLE_USERS_ALL", "Все пользователи")}</Link>
            </ul>
        </section>
    )
}