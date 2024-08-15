import React from 'react'
import $ from 'jquery'
import { Link, useLocation } from 'react-router-dom'

import { Language } from '@modules/Language'

import './index.scss'

import { MdDashboardCustomize } from "react-icons/md";
import { IoStatsChartSharp } from "react-icons/io5";
import { RiAdminFill } from "react-icons/ri";
import { FaUsers } from "react-icons/fa6";
import { FaBuysellads } from "react-icons/fa6";
import { FaAdversal } from "react-icons/fa6";
import { BiSolidCategory } from "react-icons/bi";

import { BiSolidBookContent } from "react-icons/bi";
import { GrDomain } from "react-icons/gr";

import { IoLanguage } from "react-icons/io5";
import { FaListUl } from "react-icons/fa6";
import { RiAddLine } from "react-icons/ri";
import { AiFillEdit } from "react-icons/ai";

import { PiPentagramBold } from "react-icons/pi";
import { GrDocumentUpdate } from "react-icons/gr";
import Sidebar_DashboardUl from './dashboardUl';
import Sidebar_ContentUl from './contentUl';
import Sidebar_CategoriesUl from './categoriesUl';
import Sidebar_LanguageUl from './languageUl';
import Sidebar_RolesUl from './rolesUl';
import { CircleLoader } from '@components/circleLoader/circleLoader';

let loaderInterval: NodeJS.Timeout = null
export default function SideBar() {
    const location = useLocation()
    const [ path, setPath ] = React.useState('')

    React.useEffect(() => {
        setPath(location.pathname)
    }, [location])

    const [ loader, setLoader ] = React.useState(true)
    React.useMemo(() => {
        if(loaderInterval) clearInterval(loaderInterval)
        loaderInterval = setInterval(() => {
            if(window.userdata.roles) {
                setLoader(false)
                clearInterval(loaderInterval)
            }
        }, 100)
    }, [])

    return (
        <div id="sidebar">
            <section className="header">
                <Link to={"/"} className="logo">
                    <img src="/assets/logo/128x.png" className="logoicon" />
                    {/* <div className="logotext center">24sell - Admin Panel</div> */}
                </Link>
            </section>
            <nav className="nav">
                {loader ? (
                    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '64px 0'}}>
                        <CircleLoader type={"big"} color={"var(--tm-color)"} />
                    </div>
                ) : (
                    <>
                        <Sidebar_DashboardUl />
                        <Sidebar_ContentUl />
                        <Sidebar_CategoriesUl />
                        <Sidebar_LanguageUl />
                        <Sidebar_RolesUl />
                    </>
                )}
            </nav>
        </div>
    )
}