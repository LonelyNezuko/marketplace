import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Language } from '@modules/Language'
import { BiSolidBookContent } from 'react-icons/bi'
import { GrDocumentUpdate, GrDomain } from 'react-icons/gr'
import { RolePrivilegesVerifyIndexOf } from '@modules/RolePrivilegesVerify'
import { TiCloudStorage } from 'react-icons/ti'
import { IoMailUnread } from 'react-icons/io5'
import { IoIosNotifications } from 'react-icons/io'

export default function Sidebar_ContentUl() {
    const location = useLocation()
    const [ path, setPath ] = React.useState('')

    React.useEffect(() => {
        setPath(location.pathname)
    }, [location])

    return (
        <ul className="ul">
            <Link to="/content/storage" className="li title">
                <BiSolidBookContent />
                <span>{Language("NAV_NAVIGATION_TITLE_CONTENT")}</span>
            </Link>

            <ul className={`ul dropdown ${
                path.indexOf('/content') !== -1 ? 'show' : ''
            }`}>
                {/* <Link to="/content" className={`li ${path === '/content' && 'selected'}`}>
                    <GrDomain />
                    <span>{Language("NAV_NAVIGATION_TITLE_DASHBOARD_CONTENT_MAINPAGE")}</span>
                </Link> */}
                {!RolePrivilegesVerifyIndexOf("/admin/storage", window.userdata.roles) ? null : (
                    <Link to="/content/storage" className={`li ${!path.indexOf('/content/storage') && 'selected'}`}>
                        <TiCloudStorage />
                        <span>{Language("NAV_NAVIGATION_TITLE_DASHBOARD_CONTENT_STORAGE")}</span>
                    </Link>
                )}
                {/* {!RolePrivilegesVerifyIndexOf("/updates/get", window.userdata.roles) ? null : (
                    <Link to="/content/updates" className={`li ${!path.indexOf('/content/updates') && 'selected'}`}>
                        <GrDocumentUpdate />
                        <span>{Language("NAV_NAVIGATION_TITLE_DASHBOARD_CONTENT_UPDATES")}</span>
                    </Link>
                )} */}
                {!RolePrivilegesVerifyIndexOf("/admin/mailtemplate", window.userdata.roles) ? null : (
                    <Link to="/content/mailtemplate" className={`li ${!path.indexOf('/content/mailtemplate') && 'selected'}`}>
                        <IoMailUnread />
                        <span>{Language("NAV_NAVIGATION_TITLE_DASHBOARD_CONTENT_MAILTEMPLATE")}</span>
                    </Link>
                )}
                {!RolePrivilegesVerifyIndexOf("/admin/notifications", window.userdata.roles) ? null : (
                    <Link to="/content/notifications" className={`li ${!path.indexOf('/content/notifications') && 'selected'}`}>
                        <IoIosNotifications />
                        <span>{Language("NAV_NAVIGATION_TITLE_DASHBOARD_CONTENT_NOTICATIONS")}</span>
                    </Link>
                )}
            </ul>
        </ul>
    )
}