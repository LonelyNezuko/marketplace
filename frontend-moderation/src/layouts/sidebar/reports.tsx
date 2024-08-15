import { Language } from '@modules/Language'
import { RolePrivilegesVerifyIndexOf } from '@modules/RolePrivilegesVerify'
import React from 'react'
import { MdReportProblem } from 'react-icons/md'
import { Link, useLocation } from 'react-router-dom'

export default function SidebarReports() {
    const location = useLocation()

    if(!RolePrivilegesVerifyIndexOf('/moderation/reports', window.userdata.roles))return
    return (
        <section className={`elem ${location.pathname.indexOf('/reports') === 0 ? "selected" : ""}`}>
            <Link to="/reports" className="title">
                <MdReportProblem />
                <span>{Language("NAV_NAVIGATION_TITLE_REPORTS", "жалобы")}</span>
            </Link>
            
            <ul>
                <Link to="/reports" className={`li ${location.pathname.indexOf('/reports') !== -1 ? "selected" : ""}`}>{Language("NAV_NAVIGATION_TITLE_REPORTS_VERIFYING")}</Link>
            </ul>
        </section>
    )
}