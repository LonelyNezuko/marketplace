import { Language } from '@modules/Language'
import { RolePrivilegesVerifyIndexOf } from '@modules/RolePrivilegesVerify'
import React from 'react'
import { MdSupportAgent } from 'react-icons/md'
import { Link, useLocation } from 'react-router-dom'

export default function SidebarSupport() {
    const location = useLocation()

    if(!RolePrivilegesVerifyIndexOf('/moderation/support', window.userdata.roles))return
    return (
        <section className={`elem ${location.pathname.indexOf('/support') === 0 ? "selected" : ""}`}>
            <Link to="/support" className="title">
                <MdSupportAgent />
                <span>{Language("NAV_NAVIGATION_TITLE_SUPPORT")}</span>
            </Link>
            
            <ul>
                <Link to="/support" className={`li ${location.pathname.indexOf('/support') !== -1 ? "selected" : ""}`}>{Language("NAV_NAVIGATION_TITLE_SUPPORT_VERIFYING")}</Link>
                {/* {RolePrivilegesVerifyIndexOf('/moderation/reports/list', window.userdata.roles) ? (
                    <>
                        <Link to="/reports" className={`li ${location.pathname === '/reports' ? "selected" : ""}`}>{Language("NAV_NAVIGATION_TITLE_REPORTS_VERIFYING", "Ожидают проверки")}</Link>
                        <Link to="/reports/you" className={`li ${location.pathname.indexOf('/reports/you') === 0 ? "selected" : ""}`}>{Language("NAV_NAVIGATION_TITLE_REPORTS_YOURS", "Мои жалобы")}</Link>
                    </>
                ) : ''} */}
            </ul>
        </section>
    )
}