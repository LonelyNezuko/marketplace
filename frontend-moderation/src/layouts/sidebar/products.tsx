import { Language } from '@modules/Language'
import { RolePrivilegesVerifyIndexOf } from '@modules/RolePrivilegesVerify'
import React from 'react'
import { FaAdversal } from 'react-icons/fa'
import { Link, useLocation } from 'react-router-dom'

export default function SidebarProducts() {
    const location = useLocation()

    if(!RolePrivilegesVerifyIndexOf('/moderation/product', window.userdata.roles))return
    return (
        <section className={`elem ${location.pathname.indexOf('/products') === 0 ? "selected" : ""}`}>
            <Link to="/products" className="title">
                <FaAdversal />
                <span>{Language("NAV_NAVIGATION_TITLE_PRODUCTS", "Объявления")}</span>
            </Link>
            
            <ul>
                <Link to="/products" className={`li ${location.pathname.indexOf('/products') !== -1 ? "selected" : ""}`}>{Language("NAV_NAVIGATION_TITLE_PRODUCTS_VERIFYING", "Проверяются")}</Link>

                {/* {RolePrivilegesVerifyIndexOf('/moderation/product/list', window.userdata.roles) ? (
                    <>
                        <Link to="/products" className={`li ${location.pathname === '/products' ? "selected" : ""}`}>{Language("NAV_NAVIGATION_TITLE_PRODUCTS_VERIFYING", "Ожидают проверки")}</Link>
                        <Link to="/products/checkeds" className={`li ${location.pathname.indexOf('/products/checkeds') === 0 ? "selected" : ""}`}>{Language("NAV_NAVIGATION_TITLE_PRODUCTS_CHECKEDS", "Проверяются")}</Link>
                        <Link to="/products/problems" className={`li ${location.pathname.indexOf('/products/problems') === 0 ? "selected" : ""}`}>{Language("NAV_NAVIGATION_TITLE_PRODUCTS_PROBLEMS", "Проблемные")}</Link>
                    </>
                ) : ''}
                {(RolePrivilegesVerifyIndexOf('/moderation/product/list', window.userdata.roles)
                    && RolePrivilegesVerifyIndexOf('/moderation/product/ban', window.userdata.roles)) ? (
                    <Link to="/products/banneds" className={`li ${location.pathname.indexOf('/products/banneds') === 0 ? "selected" : ""}`}>{Language("NAV_NAVIGATION_TITLE_PRODUCTS_BANNEDS", "Заблокированные")}</Link>
                ) : ''}
                {(RolePrivilegesVerifyIndexOf('/moderation/product/list', window.userdata.roles)
                    && RolePrivilegesVerifyIndexOf('/moderation/product/deleted', window.userdata.roles)) ? (
                    <Link to="/products/deleted" className={`li ${location.pathname.indexOf('/products/deleted') === 0 ? "selected" : ""}`}>{Language("NAV_NAVIGATION_TITLE_PRODUCTS_DELETED", "Удаленные")}</Link>
                ) : ''} */}
            </ul>
        </section>
    )
}