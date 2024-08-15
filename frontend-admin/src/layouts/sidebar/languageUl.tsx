import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Language } from '@modules/Language'
import { IoLanguage } from 'react-icons/io5'
import { FaListUl } from 'react-icons/fa6'
import { RiAddLine } from 'react-icons/ri'
import { AiFillEdit } from 'react-icons/ai'
import { RolePrivilegesVerifyIndexOf } from '@modules/RolePrivilegesVerify'

export default function Sidebar_LanguageUl() {
    const location = useLocation()
    const [ path, setPath ] = React.useState('')

    React.useEffect(() => {
        setPath(location.pathname)
    }, [location])

    if(!RolePrivilegesVerifyIndexOf("/service/language", window.userdata.roles))return
    return (
        <ul className="ul">
            <Link to="/language" className="li title">
                <IoLanguage />
                <span>{Language("NAV_NAVIGATION_TITLE_LANGUAGE")}</span>
            </Link>

            <ul className={`ul dropdown ${
                !path.indexOf('/language') ? 'show' : ''
            }`}>
                <Link to="/language" className={`li ${path === '/language' && 'selected'}`}>
                    <FaListUl />
                    <span>{Language("NAV_NAVIGATION_TITLE_LANGUAGE_LIST")}</span>
                </Link>
                {!RolePrivilegesVerifyIndexOf("/service/language/new", window.userdata.roles) ? null : (
                    <Link to="/language/new" className={`li ${!path.indexOf('/language/new') && 'selected'}`}>
                        <RiAddLine />
                        <span>{Language("NAV_NAVIGATION_TITLE_LANGUAGE_NEW")}</span>
                    </Link>
                )}
                <li className={`li hidden ${!path.indexOf('/language/edit') && 'selected'}`}>
                    <AiFillEdit />
                    <span>{Language("NAV_NAVIGATION_TITLE_LANGUAGE_EDIT")}</span>
                </li>
            </ul>
        </ul>
    )
}