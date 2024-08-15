import React from 'react'
import { BiSolidCategory } from 'react-icons/bi'
import { FaAdversal, FaBuysellads, FaUsers } from 'react-icons/fa6'
import { IoStatsChartSharp } from 'react-icons/io5'
import { RiAdminFill } from 'react-icons/ri'
import { Link, useLocation } from 'react-router-dom'
import { Language } from '@modules/Language'
import { MdDashboardCustomize } from 'react-icons/md'

export default function Sidebar_DashboardUl() {
    const location = useLocation()
    const [ path, setPath ] = React.useState('')

    React.useEffect(() => {
        setPath(location.pathname)
    }, [location])

    return (
        <ul className="ul">
            <Link to="/dashboard" className="li title">
                <MdDashboardCustomize />
                <span>{Language("NAV_NAVIGATION_TITLE_DASHBOARD")}</span>
            </Link>

            <ul className={`ul dropdown ${
                !path.indexOf('/dashboard') ? 'show' : ''
            }`}>
                <Link to="/dashboard" className={`li ${path === '/dashboard' && 'selected'}`}>
                    <IoStatsChartSharp />
                    <span>{Language("NAV_NAVIGATION_TITLE_DASHBOARD_STATISTICS_MAIN")}</span>
                </Link>
                <Link to="/dashboard/moderation" className={`li ${!path.indexOf('/dashboard/moderation') && 'selected'}`}>
                    <RiAdminFill />
                    <span>{Language("NAV_NAVIGATION_TITLE_DASHBOARD_STATISTICS_MODERATION")}</span>
                </Link>
                <Link to="/dashboard/users" className={`li ${!path.indexOf('/dashboard/users') && 'selected'}`}>
                    <FaUsers />
                    <span>{Language("NAV_NAVIGATION_TITLE_DASHBOARD_STATISTICS_USERS")}</span>
                </Link>
                <Link to="/dashboard/marketing" className={`li ${!path.indexOf('/dashboard/marketing') && 'selected'}`}>
                    <FaBuysellads />
                    <span>{Language("NAV_NAVIGATION_TITLE_DASHBOARD_STATISTICS_MARKETING")}</span>
                </Link>
                <Link to="/dashboard/products" className={`li ${!path.indexOf('/dashboard/products') && 'selected'}`}>
                    <FaAdversal />
                    <span>{Language("NAV_NAVIGATION_TITLE_DASHBOARD_STATISTICS_PRODUCTS")}</span>
                </Link>
                <Link to="/dashboard/categories" className={`li ${!path.indexOf('/dashboard/categories') && 'selected'}`}>
                    <BiSolidCategory />
                    <span>{Language("NAV_NAVIGATION_TITLE_DASHBOARD_STATISTICS_CATEGORIES")}</span>
                </Link>
            </ul>
        </ul>
    )
}