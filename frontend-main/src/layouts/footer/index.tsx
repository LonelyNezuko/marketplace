import React from 'react'

import './index.scss'

import CONFIG from '@config'
import { Link } from 'react-router-dom'
import { Language } from '@modules/Language'

export default function Footer() {
    return (
        <footer id="footer">
            <div className="links">
                <Link to={"/about"} className='link' target={"_blank"}>{Language("FOOTER_LINKS_ABOUT")}</Link>
                <Link to={"#contactus"} className='link'>{Language("FOOTER_LINKS_CONTACT")}</Link>
                <Link to={"/advertisement"} className='link' target={"_blank"}>{Language('FOOTER_LINKS_SERVICE_ADV')}</Link>
                <Link to={"/copyright"} className='link' target={"_blank"}>{Language("FOOTER_LINKS_COPYRIGHT_HREF")}</Link>
            </div>
            <div className="links">
                <Link to={"/article/privacy-policy"} className='link' target={"_blank"}>{Language("FOOTER_LINKS_PRIVACY_POLICY")}</Link>
                <Link to={"/article/terms-and-conditions"} className='link' target={"_blank"}>{Language("FOOTER_LINKS_TERMS_OF_USE")}</Link>
                <Link to={"/article/service-rules"} className='link' target={"_blank"}>{Language("FOOTER_LINKS_SERVICE_RULES")}</Link>
            </div>
            <div className="copyright">
                &copy; {new Date().getFullYear()} {CONFIG.companyName}
            </div>
        </footer>
    )
}