import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Language } from '@modules/Language'
import { BiSolidCategory } from 'react-icons/bi'
import { FaListUl } from 'react-icons/fa6'
import { RiAddLine } from 'react-icons/ri'
import { AiFillEdit } from 'react-icons/ai'
import { RolePrivilegesVerifyIndexOf } from '@modules/RolePrivilegesVerify'

export default function Sidebar_CategoriesUl() {
    const location = useLocation()
    const [ path, setPath ] = React.useState('')

    React.useEffect(() => {
        setPath(location.pathname)
    }, [location])

    if(!RolePrivilegesVerifyIndexOf("/admin/category", window.userdata.roles))return
    return (
        <ul className="ul">
            <Link to="/categories" className="li title">
                <BiSolidCategory />
                <span>{Language("NAV_NAVIGATION_TITLE_CATEGORIES")}</span>
            </Link>

            <ul className={`ul dropdown ${
                !path.indexOf('/categories') ? 'show' : ''
            }`}>
                <Link to="/categories" className={`li ${path === '/categories' && 'selected'}`}>
                    <FaListUl />
                    <span>{Language("NAV_NAVIGATION_TITLE_CATEGORIES_LIST")}</span>
                </Link>
                <li className={`li hidden ${!path.indexOf('/categories/new') && 'selected'}`}>
                    <RiAddLine />
                    <span>{Language("NAV_NAVIGATION_TITLE_CATEGORIES_NEW")}</span>
                </li>
                <li className={`li hidden ${!path.indexOf('/categories/edit') && 'selected'}`}>
                    <AiFillEdit />
                    <span>{Language("NAV_NAVIGATION_TITLE_CATEGORIES_EDIT")}</span>
                </li>
            </ul>
        </ul>
    )
}