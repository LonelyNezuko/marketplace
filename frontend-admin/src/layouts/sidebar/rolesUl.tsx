import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Language } from '@modules/Language'
import { IoLanguage } from 'react-icons/io5'
import { FaListUl } from 'react-icons/fa6'
import { RiAddLine } from 'react-icons/ri'
import { AiFillEdit } from 'react-icons/ai'
import { PiPentagramBold } from 'react-icons/pi'
import { RolePrivilegesVerifyIndexOf } from '@modules/RolePrivilegesVerify'

export default function Sidebar_RolesUl() {
    const location = useLocation()
    const [ path, setPath ] = React.useState('')

    React.useEffect(() => {
        setPath(location.pathname)
    }, [location])

    if(!RolePrivilegesVerifyIndexOf("/role", window.userdata.roles))return
    return (
        <ul className="ul">
            <Link to="/roles" className="li title">
                <PiPentagramBold />
                <span>{Language("NAV_NAVIGATION_TITLE_ROLES")}</span>
            </Link>

            <ul className={`ul dropdown ${
                !path.indexOf('/roles') ? 'show' : ''
            }`}>
                <Link to="/roles" className={`li ${path === '/roles' && 'selected'}`}>
                    <FaListUl />
                    <span>{Language("NAV_NAVIGATION_TITLE_ROLES_LIST")}</span>
                </Link>
                {!RolePrivilegesVerifyIndexOf("/role/create", window.userdata.roles) ? null : (
                    <Link to="/roles/new" className={`li ${!path.indexOf('/roles/new') && 'selected'}`}>
                        <RiAddLine />
                        <span>{Language("NAV_NAVIGATION_TITLE_ROLES_NEW")}</span>
                    </Link>
                )}
                <li className={`li hidden ${!path.indexOf('/roles/edit') && 'selected'}`}>
                    <AiFillEdit />
                    <span>{Language("NAV_NAVIGATION_TITLE_ROLES_EDIT")}</span>
                </li>
            </ul>
        </ul>
    )
}