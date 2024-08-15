import React from "react";
import $ from 'jquery'

import './index.scss'
import { Link, Navigate, useLocation } from "react-router-dom";

import CONFIG from '@config'
import Button from "@components/button";
import { Language } from "@modules/Language";
import { MdCategory } from "react-icons/md";
import CategoryDTO from "@dto/category.dto";
import { API } from "@modules/API";
import { notify } from "@modules/Notify";
import { CircleLoader } from "@components/circleLoader/circleLoader";
import { categoryGenerateLink } from "@modules/functions/categoryGenerateLink";
import { ModalCategories } from "@components/modals/categories/categories";
import GeolocationDTO, { GeolocationAddress } from "@dto/geolocation.dto";
import { LuMapPin } from "react-icons/lu";
import Address from "@components/address";
import Cookies from "universal-cookie";
import { ModalFirstSettings } from "@components/modals/firstSettings";
import Footer from "@layouts/footer";
import { CustomStorage } from "@modules/CustomStorage";

export default function Sidebar() {
    const location = useLocation()

    const sideBarRef = React.useRef()
    const sideBarCategoriesBtnRef = React.useRef()

    const [ navigate, setNavigate ] = React.useState(null)
    React.useEffect(() => {
        if(navigate !== null) setNavigate(null)
    }, [navigate])


    const [ positionAbsolute, setPositionAbsolute ] = React.useState(false)

    const [ isCollaps, setIsCollaps ] = React.useState(false)
    React.useEffect(() => {
        function storageSideBarStateHandle() {
            const state: number = parseInt(window.localStorage.getItem('sidebar_state'))

            if(state) setIsCollaps(!!state)
            else setIsCollaps(false)
        }
        function sideBarMaxWidthHide(event) {
            if(window.innerWidth <= 1500
                && !isCollaps) {
                console.log(sideBarCategoriesBtnRef)
                const element: any = $(sideBarCategoriesBtnRef.current)
                
                if(element.is(event.target) || element.has(event.target).length)return
                if($('#sideBarSwipe').is(event.target) || $('#sideBarSwipe').has(event.target).length > 0)return
                
                setIsCollaps(true)
                window.localStorage.setItem('sidebar_state', '1')
            }
        }

        window.addEventListener('storage', storageSideBarStateHandle)
        document.addEventListener('click', sideBarMaxWidthHide)

        return () => {
            window.removeEventListener('storage', storageSideBarStateHandle)
            document.removeEventListener('click', sideBarMaxWidthHide)
        }
    })
    React.useEffect(() => {
        if(window.localStorage.getItem('sidebar_state') === '1' || window.innerWidth <= 1500) {
            setIsCollaps(true)
            window.localStorage.setItem('sidebar_state', '1')
        }
        else {
            setIsCollaps(false)
            window.localStorage.setItem('sidebar_state', '0')
        }
    }, [])


    React.useEffect(() => {
        if(location.pathname === '/'
            || location.pathname.indexOf('/account') !== -1) setPositionAbsolute(true)
        else setPositionAbsolute(false)

        if(location.pathname.indexOf('/account') !== -1) {
            setIsCollaps(true)
        }

        // if(positionAbsolute && !setIsCollaps) setIsCollaps(true)
    }, [location])

    if(window.isPhone)return
    return (
        <div className={`sidebar ${isCollaps && 'collaps'} ${positionAbsolute && 'positionAbsolute'}`} ref={sideBarRef}>
            <Promotion />
            <CategoriesButton reff={sideBarCategoriesBtnRef} />
            <PopularCategories />
            <LanguageAndGeo />

            <div className="_plug_" style={{ height: '100%', width: '100%' }}></div>

            <Footer />

            {navigate ? (<Navigate to={navigate} />) : ''}
        </div>
    )
}


function Promotion() {
    const [ promotion, setPromotion ] = React.useState<{ image?: string, text?: string, link?: string }>({
        // image: 'https://ir.ozone.ru/s3/cms/53/t3b/wc1450/gf2830.png',
        // text: "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Vel dolorem sed soluta unde quos tenetur labore?",
        link: '/dasdasd'
    })

    React.useMemo(() => {
        // API
    }, [])

    if(!promotion.text && !promotion.image)return
    return (
        <div className="promotion">
            {(promotion.text && !promotion.image) ? (<Link to={promotion.link} className="text link" target={"_blank"}>{promotion.text}</Link>) : ''}
            {promotion.image ? (<Link to={promotion.link} className="image">
                <img src={promotion.image} />
            </Link>) : ''}
        </div>
    )
}
function PopularCategories() {
    const [ loader, setLoader ] = React.useState(true)
    const [ categories, setCategories ] = React.useState<Array<CategoryDTO>>(null)

    React.useMemo(() => {
        API({
            url: "/defaultapi/category/popular",
            type: 'get'
        }).done(result => {
            if(result.statusCode === 200) {
                setCategories(result.message)
                setLoader(false)
            }
            else notify("(home, popular categories) /category/popular: " + result.message, { debug: true })
        })
    }, [])

    if(loader)return (
        <section style={{display: 'flex', alignItems: "center", justifyContent: "center", padding: '64px 0'}}>
            <CircleLoader type={"big"} color={"var(--tm-color)"} />
        </section>
    )
    return (
        <div className="popularcategories">
            <h5 className="sidebar-title">{Language("POPYLAR_CATEGORIES")}</h5>
            <div className="list">
                {categories.map((category: CategoryDTO, i: number) => {
                    return (
                        <Link key={i} to={categoryGenerateLink(category)} className="elem">
                            <h6>{category.categoryName}</h6>
                            <span>{category.productsCount.toLocaleString()} {Language("ADS")}</span>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
function CategoriesButton({
    reff
}) {
    const [ modalToggle, setModalToggle ] = React.useState(false)
    const buttonRef = React.useRef()

    return (
        <div className="categoriesbutton" ref={reff}>
            <Button reff={buttonRef} name={Language("CATEGORIES")} icon={<MdCategory />} size={"big"} type={"border"} onClick={() => setModalToggle(!modalToggle)} />

            {modalToggle && (
                <ModalCategories allBtn={false} linkTarget={true} onChoiceCategory={() => setModalToggle(false)} onClose={() => setModalToggle(false)}
                    openElement={buttonRef}
                />
            )}
        </div>
    )
}
function LanguageAndGeo() {
    const [ totalAds, setTotalAds ] = React.useState(0)

    const [ geolocationLoader, setGeoLocationLoader ] = React.useState(true)
    const [ geolocation, setGeolocation ] = React.useState<GeolocationAddress>(null)

    const [ changeLanguageModal, setChangeLanguageModal ] = React.useState(false)

    React.useMemo(() => {
        API({
            url: '/defaultapi/product/counter',
            type: 'get'
        }).done(result => {
            if(result.statusCode === 200) setTotalAds(result.message)
            else notify("(header) products/counter: " + result.message, { debug: true })
        })

        if(window.languageChoiceModal
            || window.geolocationChoiceModal
            || window.currencyChoiceModal) setChangeLanguageModal(true)
    }, [])

    React.useEffect(() => {
        setGeolocation(window.userdata.geolocation)
        setGeoLocationLoader(false)
    }, [window.userdata.geolocation])
    
    return (
        <div className="languagegeo">
            {geolocationLoader ? (
                <div className="_loaderdiv" style={{ width: '100%', height: '28px', borderRadius: '4px' }}></div>
            ) : (
                <Link to="#geolocation" className="address link" style={{textDecoration: 'none'}}>
                    <LuMapPin />
                    <span>
                        {Address(geolocation, true, true)}
                    </span>
                </Link>
            )}

            <section className="section">
                <Button classname={"languagechoice"} name={window.language.toUpperCase()} type={"hover"} size={"min"}
                    onClick={() => setChangeLanguageModal(!changeLanguageModal)}
                />
                <div className="adscount">{Language("TOTAL_ADS", "total ads", {}, totalAds.toLocaleString())}</div>
            </section>

            {changeLanguageModal ? (<ModalFirstSettings defaultLang={window.language} defaultCurrency={window.userdata.currency} onChange={(language, currency, changeGeolocation) => {
                onChangeFirstSettings(language, currency, changeGeolocation)
                setChangeLanguageModal(false)
            }} />) : ''}
        </div>
    )
}



export function onChangeFirstSettings(language: string, currency: string, changeGeolocation: boolean) {
    if(language) {
        new CustomStorage().set('userLanguage', language)
    }
    if(currency) {
        new CustomStorage().set('userCurrency', currency)
        window.userdata.currency = currency

        if(window.jwtTokenExists) {
            API({
                url: '/defaultapi/user/settings/currency',
                type: 'put',
                data: {
                    currency
                }
            }).done(result => {
                if(result.statusCode !== 200) {
                    notify("(sidebar) /user/settings/currency: " + result.message, { debug: true })
                }
            })
        }
    }

    if(language || currency || changeGeolocation) {
        if(!changeGeolocation) window.location = window.location
        else window.location.href = window.location.pathname + window.location.search + '#geolocation_m'
    }
}