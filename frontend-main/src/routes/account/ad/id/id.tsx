import React, { FormEvent } from 'react'
import { useParams, Link, useLocation, Routes, Route } from 'react-router-dom'

import './id.scss'
import { Language } from '@modules/Language'

import CONFIG from '@config'

import { FaArrowLeft, FaBandage } from "react-icons/fa6";
import { RouteErrorCode, RouteErrorCodeProps } from '@routes/errorcodes';
import { RouteAccountProps } from '@routes/account';
import SetRouteTitle from '@modules/SetRouteTitle';
import ProductDTO, { enumProductModerationStatus, enumProductStatus } from '@dto/product.dto';
import DotsLoader from '@components/dotsloader';
import { API } from '@modules/API';
import { APIResult } from '@modules/API/index.dto';
import { notify } from '@modules/Notify';
import { MdAddModerator, MdOutlineAdd, MdOutlineBlock, MdOutlineSupportAgent, MdRadioButtonUnchecked, MdReportProblem } from 'react-icons/md';
import Button from '@components/button';
import { IoCloseCircleOutline, IoCloseCircleSharp } from 'react-icons/io5';
import { GoIssueReopened } from 'react-icons/go';
import { formatImage } from '@modules/functions/formatImage';
import ContextMenu from '@components/contextmenu'
import PreviewFiles, { PreviewFilesFile } from '@components/previewFiles'
import { StorageDTO } from '@dto/storage.dto'
import { copyToClipBoard } from '@modules/functions/copyToClipBoard'
import { Alert } from '@components/alert'
import UploadDropFile, { UploadDropFile_File } from '@components/uploadDropFile'
import { AiFillCaretLeft, AiFillCaretRight } from 'react-icons/ai'
import Address from '@components/address'
import Input from '@components/input'
import MapLeaflet from '@components/mapLeaflet'
import { LatLng } from 'leaflet'
import CircleLoaderFullSize from '@components/circleLoader/fullsize'
import ErrorInnerBlock from '@components/errorInnerBlock'
import GeolocationDTO from '@dto/geolocation.dto'
import GetGeolocation from '@modules/GetGeolocation'
import { SiGooglemaps } from 'react-icons/si'
import { EditPage } from './editPage'

export interface BlockProps extends RouteAccountProps {
    product: ProductDTO,
    setProduct: React.Dispatch<React.SetStateAction<ProductDTO>>
}

export default function RouteAccountAdsID({
    loader,
    account,

    loaderModal,
    setLoaderModal,

    setNavigate
}: RouteAccountProps) {
    SetRouteTitle(Language("ROUTE_TITLE_ACCOUNT_ADS_ID"))
    const [ errorPage, setErrorPage ] = React.useState<RouteErrorCodeProps>({ code: 0, text: '', showbtn: false })

    const [ loaderProduct, setLoaderProduct ] = React.useState(true)

    const params = useParams()
    const location = useLocation()

    const [ product, setProduct ] = React.useState<ProductDTO>(null)

    const [ link, setLink ] = React.useState('/')

    React.useEffect(() => {
        const id: number = parseInt(params.id)
        if(!id || isNaN(id)) {
            setErrorPage({ code: 400, text: Language("400PAGE_TEXT", "ошибка"), showbtn: true, btnurl: '/', btnname: Language('404PAGE_BTN', 'главная') })
            return
        }

        setLoaderProduct(true)
        setLink('/account/ad/' + id)
        
        API({
            url: '/defaultapi/product/',
            type: 'get',
            data: {
                prodID: id
            }
        }).done((result: APIResult) => {
            if(result.statusCode === 200) {
                setLoaderProduct(false)
                setProduct(result.message)
            }
            else {
                setErrorPage({ code: result.statusCode })
                notify("(account.ad.id) /product: " + result.message, { debug: true })
            }
        })
    }, [location])

    if(errorPage.code !== 0)return (
        <RouteErrorCode style={{marginTop: "128px"}} code={errorPage.code} text={errorPage.text}
            showbtn={errorPage.showbtn} btnurl={errorPage.btnurl} btnname={errorPage.btnname}
            icon={errorPage.icon} />
    )
    if(loaderProduct)return (
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '144px 0' }}>
            <DotsLoader color={"colorful"} />
        </div>
    )
    return (
        <div className="route" id="accountPageAdsID">
            <Nav product={product} link={link} />

            <div className="pagewrapper">
                <WarningContainerBanned account={account} loader={loader} product={product} setProduct={setProduct} />
                <WarningContainerProblems account={account} loader={loader} product={product} setProduct={setProduct} />
                <WarningContainerVerifying account={account} loader={loader} product={product} setProduct={setProduct} />
                <WarningContainerClosed account={account} loader={loader} product={product} setProduct={setProduct} />
                <WarningContainerForgot account={account} loader={loader} product={product} setProduct={setProduct} />

                <Routes>
                    <Route path='/*' element={<IndexPage account={account} product={product} setProduct={setProduct} loader={loader} link={link} />}></Route>
                    <Route path='/edit' element={<EditPage account={account} product={product} setProduct={setProduct} loader={loader} link={link} setLoaderModal={setLoaderModal} loaderModal={loaderModal} setNavigate={setNavigate} />}></Route>
                </Routes>
            </div>
        </div>
    )
}


interface NavProps {
    link: string,
    product: ProductDTO
}
function Nav({
    link,
    product
}: NavProps) {
    const location = useLocation()

    return (
        <div className="accountMenu">
            <ul className="nav main">
                <Link to="/account/ad" className={`li`}>
                    <FaArrowLeft />
                    {Language("HEADER_ACCOUNT_ADSID_MENU_ITEM_BACK")}
                </Link>
            </ul>
            <ul className="nav">
                <Link to={link} className={`li ${(location.pathname === link || location.pathname.indexOf(link + '/analytics') !== -1) && 'selected'}`}>{Language("HEADER_ACCOUNT_ADSID_MENU_ITEM_INFO")}</Link>
                <Link to={link + '/edit'} className={`li ${location.pathname === (link + '/edit') && 'selected'}`}>{Language("HEADER_ACCOUNT_ADSID_MENU_ITEM_EDIT")}</Link>

                {product.prodStatus === enumProductStatus.PRODUCT_STATUS_ACTIVE
                    && product.prodModerationStatus === enumProductModerationStatus.PRODUCT_MODERATION_STATUS_VERIFIED ? (
                    <Link to={'#delete'} className={`li bottom colorred`}>{Language("HEADER_ACCOUNT_ADSID_MENU_ITEM_ACTION_CLOSED")}</Link>
                ) : ''}
                {product.prodModerationStatus === enumProductModerationStatus.PRODUCT_MODERATION_STATUS_PROBLEM ? (
                    <Link to={'#'} className={`li bottom colorred`}>{Language("HEADER_ACCOUNT_ADSID_MENU_ITEM_ACTION_GOTOVERIFING")}</Link>
                ) : ''}
                {product.prodStatus === enumProductStatus.PRODUCT_STATUS_FORGOT ? (
                    <Link to={'#'} className={`li bottom`}>{Language("HEADER_ACCOUNT_ADSID_MENU_ITEM_ACTION_REOPEN")}</Link>
                ) : ''}
            </ul>
        </div>
    )
}





function IndexPage({
    loader,
    account,

    product,

    link
}: BlockProps) {
    const location = useLocation()

    if(loader || !account)return
    return (
        <div className="indexpage">
            <div className="pageheader">
                <h1 className="pagetitle">{Language("HEADER_ACCOUNT_ADSID_MENU_ITEM_INFO")}</h1>
                <ul className="pagenav">
                    <Link to={link} className={`li ${location.pathname === link && 'selected'}`}>Статус</Link>
                    <Link to={link + '/analytics'} className={`li ${location.pathname === link + '/analytics' && 'selected'}`}>Просмотры</Link>
                    <Link to={link + '/analytics/actions'} className={`li ${location.pathname === link + '/analytics/actions' && 'selected'}`}>Взаимодействие</Link>
                </ul>
            </div>
            <div className="pagebody">
                
            </div>
        </div>
    )
}








function WarningContainerBanned({
    account,
    loader,

    product
}: BlockProps) {
    if(loader || !product)return

    if(product.prodStatus !== enumProductStatus.PRODUCT_STATUS_BANNED)return
    return (
        <div className="warningCointainer banned">
            <div className="warningCointainerHeader">
                <div className="icon">
                    <MdOutlineBlock />
                </div>
                <span className="title">{Language("ACCOUNT_AD_WARNING_BANNED_TITLE")}</span>
            </div>
            <div className="warningCointainerBody">
                <span className="text">{Language("ACCOUNT_AD_WARNING_BANNED_TEXT")}</span>
                <div className="moderationComment">
                    <span>{Language("ACCOUNT_AD_WARNING_BANNED_REASON")}</span>
                    <section>
                        {`Оскорбление чувств верующих.`}
                    </section>
                </div>
            </div>
            <div className="warningCointainerAction">
                <Link to={"/account/support/new"}>
                    <Button name={Language("ACCOUNT_AD_WARNING_BANNED_ACTION")} icon={<MdOutlineSupportAgent />} />
                </Link>
            </div>
        </div>
    )
}
function WarningContainerProblems({
    account,
    loader,

    product
}: BlockProps) {
    if(loader || !product)return

    if(product.prodModerationStatus !== enumProductModerationStatus.PRODUCT_MODERATION_STATUS_PROBLEM)return
    return (
        <div className="warningCointainer problems">
            <div className="warningCointainerHeader">
                <div className="icon">
                    <MdReportProblem />
                </div>
                <span className="title">{Language("ACCOUNT_AD_WARNING_PROBLEM_TITLE")}</span>
            </div>
            <div className="warningCointainerBody">
                <span className="text">
                    {Language("ACCOUNT_AD_WARNING_PROBLEM_TEXT")}
                </span>
                <div className="moderationComment">
                    <span>{Language("ACCOUNT_AD_WARNING_PROBLEM_REASON")}</span>
                    <section>
                        {`Описание должно соответствовать стандарту ISO-2395.\nВ описании не должна присутствовать ненормативная лексика и оскорбления`}
                    </section>
                </div>
            </div>
            <div className="warningCointainerNotify">
                <span className="text">{Language("ACCOUNT_AD_WARNING_PROBLEM_NOTIFY")}</span>
            </div>
            <div className="warningCointainerAction">
                <Button name={Language("ACCOUNT_AD_WARNING_PROBLEM_ACTION")} icon={<MdAddModerator />} />
            </div>
        </div>
    )
}
function WarningContainerVerifying({
    account,
    loader,

    product
}: BlockProps) {
    if(loader || !product)return

    if(product.prodModerationStatus !== enumProductModerationStatus.PRODUCT_MODERATION_STATUS_VERIFYING)return
    return (
        <div className="warningCointainer verifying">
            <div className="warningCointainerHeader">
                <div className="icon">
                    <MdRadioButtonUnchecked />
                </div>
                <span className="title">{Language("ACCOUNT_AD_WARNING_VERIFYING_TITLE")}</span>
            </div>
            <div className="warningCointainerBody">
                <span className="text">
                    {Language("ACCOUNT_AD_WARNING_VERIFYING_TEXT")}
                </span>
                <div className="moderationComment">
                    <span>{Language("ACCOUNT_AD_WARNING_VERIFYING_REASON")}</span>
                    <section>{Language("ACCOUNT_AD_WARNING_VERIFYING_REASON_DESC")}</section>
                </div>
            </div>
            <div className="warningCointainerNotify">
                <span className="text">{Language("ACCOUNT_AD_WARNING_VERIFYING_NOTIFY")}</span>
            </div>
        </div>
    )
}

function WarningContainerClosed({
    account,
    loader,

    product
}: BlockProps) {
    if(loader || !product)return

    if(product.prodStatus !== enumProductStatus.PRODUCT_STATUS_CLOSED)return
    return (
        <div className="warningCointainer closed">
            <div className="warningCointainerHeader">
                <div className="icon">
                    <IoCloseCircleOutline />
                </div>
                <span className="title">{Language("ACCOUNT_AD_WARNING_CLOSED_TITLE")}</span>
            </div>
            <div className="warningCointainerBody">
                <span className="text">
                    {Language("ACCOUNT_AD_WARNING_CLOSED_TEXT")}
                </span>
            </div>
        </div>
    )
}

function WarningContainerForgot({
    account,
    loader,

    product
}: BlockProps) {
    if(loader || !product)return

    if(product.prodStatus !== enumProductStatus.PRODUCT_STATUS_FORGOT)return
    return (
        <div className="warningCointainer closed">
            <div className="warningCointainerHeader">
                <div className="icon">
                    <FaBandage />
                </div>
                <span className="title">{Language("ACCOUNT_AD_WARNING_FORGOT_TITLE")}</span>
            </div>
            <div className="warningCointainerBody">
                <span className="text">{Language("ACCOUNT_AD_WARNING_FORGOT_TEXT")}</span>
                <div className="moderationComment">
                    <section>
                        {Language("ACCOUNT_AD_WARNING_FORGOT_REASON_DESC")}
                    </section>
                </div>
            </div>
            <div className="warningCointainerAction">
                <Button name={Language("ACCOUNT_AD_WARNING_FORGOT_ACTION")} icon={<GoIssueReopened />} />
            </div>
        </div>
    )
}