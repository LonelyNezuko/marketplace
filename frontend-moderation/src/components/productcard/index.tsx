import React from 'react'

import Moment from 'moment'
import 'moment/min/locales'

import CONFIG from '@config'

import './index.scss'
import ProductDTO, { ProductForms, ProductModerationHistoryDTO, enumProductModerationStatus, enumProductStatus } from '@dto/product.dto'
import { RouteErrorCode, RouteErrorCodeProps } from '@routes/errorcodes'
import DotsLoader from '@components/dotsloader'
import { API, APISync } from '@modules/API'
import { APIResult } from '@modules/API/index.dto'
import { notify } from '@modules/Notify'
import { formatImage } from '@modules/functions/formatImage'
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa'
import { Language } from '@modules/Language'
import Address from '@components/address'
import Button from '@components/button'
import { LatLng } from 'leaflet'
import MapLeaflet from '@components/mapLeaflet'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { categoryGenerateLink } from '@modules/functions/categoryGenerateLink'
import Username from '@components/username'
import getProductStatusName from './getProductStatusName'
import getProductModerationStatusName from './getProductModerationStatusName'
import DropdownMenu from '@components/dropdownmenu'
import Input from '@components/input'
import { MdOutlineDescription } from 'react-icons/md'
import { Modal } from '@components/modals'
import { RolePrivilegesVerify } from '@modules/RolePrivilegesVerify'
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io'
import { formatText } from '@modules/functions/formatText'
import { CategoryForm } from '@dto/category.dto'
import { Alert } from '@components/alert'
import ModalLoader from '@components/modals/loader'

interface ProductCardProps {
    productid: number
}
export default function ProductCard({
    productid
}: ProductCardProps) {
    Moment.locale(window.language)

    const [ navigate, setNavigate ] = React.useState(null)
    React.useEffect(() => { if(navigate !== null) setNavigate(null) }, [navigate])

    const [ reload, setReload ] = React.useState(false)

    const [ loader, setLoader ] = React.useState(true)
    const [ errorPage, setErrorPage ] = React.useState<RouteErrorCodeProps>({ code: 0 })

    const [ product, setProduct ] = React.useState<ProductDTO>(null)
    const [ moderationHistory, setModerationHistory ] = React.useState<ProductModerationHistoryDTO[]>([])

    React.useEffect(() => {
        if(reload) setReload(false)
        if(!reload) {
            if(!productid || isNaN(productid)) {
                return setErrorPage({ code: 400 })
            }

            setLoader(true)
            API({
                url: '/defaultapi/moderation/product',
                type: 'get',
                data: {
                    prodID: productid
                }
            }).done((result: APIResult) => {
                if(result.statusCode === 200) {
                    setProduct(result.message.product)
                    setModerationHistory(result.message.moderationHistory)

                    setLoader(false)
                }
                else {
                    if(result.statusCode === 403) setErrorPage({ code: 403 })
                    else if(result.statusCode === 404) setErrorPage({ code: 404 })

                    notify("(productcard) /moderation/product: " + result.message, { debug: true })
                }
            })
        }
    }, [productid, reload])

    if(errorPage.code !== 0)return (<RouteErrorCode {...errorPage} classes={"flexcenter center"} />)
    if(loader)return (
        <div className="productcard flexcenter">
            <DotsLoader color={"colorful"} />
        </div>
    )

    if(!product)return
    return (
        <div className="productcard">
            <ImagesBlock product={product} setProduct={setProduct} />
            <MainInfoBlock product={product} setProduct={setProduct} />
            <FormsBlock product={product} setProduct={setProduct} />
            <DescriptionBlock product={product} setProduct={setProduct} />
            <ModerationInfoBlock product={product} setProduct={setProduct} />
            <HistoryBlock product={product} setProduct={setProduct} moderationHistory={moderationHistory} />
            <ModerationActionsBlock product={product} setProduct={setProduct} setNavigate={setNavigate} setReload={setReload} setErrorPage={setErrorPage} />

            {navigate ? (<Navigate to={navigate} />) : ''}
        </div>
    )
}


interface BlockProps {
    product: ProductDTO,
    setProduct: React.Dispatch<React.SetStateAction<ProductDTO>>,

    setErrorPage?: React.Dispatch<React.SetStateAction<RouteErrorCodeProps>>,
    setNavigate?: React.Dispatch<any>,
    setReload?: React.Dispatch<boolean>,

    moderationHistory?: ProductModerationHistoryDTO[]
}


function HistoryBlock({
    product,
    setProduct,

    moderationHistory
}: BlockProps) {
    const [ snapshotOpened, setSnapshotOpened ] = React.useState(-1)

    return (
        <div className="historyblock block">
            <h1 className="title">{"История модерации"}</h1>
            <div className="list">
                <div className="listHeader">
                    <span className='date'>Дата</span>
                    <span className='user'>Модератор</span>
                    <span className='status'>Статус модерации</span>
                    <span className='comment'>Комментарий</span>
                    <span className='snapshot'></span>
                </div>

                {moderationHistory.map((item, i) => {
                    return (
                        <div className={`elem ${snapshotOpened === i && 'snapshotOpened'}`} key={i} onClick={() => {
                            setSnapshotOpened(old => {
                                if(old === i) old = -1
                                else old = i

                                return old
                            })
                        }}>
                            <div className="flexline">
                                <section className="section date">{Moment(item.createAt).calendar()}</section>
                                <section className="section user">
                                    {item.moderator ? (
                                        <Link target={'_blank'} className='link' to={"/users/" + item.moderator.id}>
                                            <Username account={item.moderator} />
                                        </Link>
                                    ) : (<span className="null">{Language("NO")}</span>)}
                                </section>
                                <section className="section status">
                                    {item.snapshot.productStatus === enumProductStatus.PRODUCT_STATUS_BANNED
                                        || item.snapshot.productStatus === enumProductStatus.PRODUCT_STATUS_DELETED
                                        ? (<span className={`prodModStatusName status-${item.snapshot.productStatus}`}>{getProductStatusName(item.snapshot.productStatus)}</span>)
                                        : (<span className={`prodModStatusName status-${item.moderationStatus}`}>{getProductModerationStatusName(item.moderationStatus)}</span>)}
                                </section>
                                <section className="section comment">
                                    {item.moderationComment ? (<span>{formatText(item.moderationComment, 15)}</span>)
                                    : (<span className="null">{Language("NO")}</span>)}
                                </section>
                                <section className="section snapshot">
                                    <Button icon={snapshotOpened === i ? (<IoIosArrowDown />) : (<IoIosArrowUp />)} type={"transparent"} />
                                </section>
                            </div>

                            <div className="snapshotBlock">
                                <h6 className="snapshotTitle">Снимок #{item.snapshot.id}</h6>
                                <div className="snapshotBody">
                                    <section className="section productStatus">
                                        <h4>Статус объявления</h4>
                                        <div className="sectionBlock">
                                            <span className={`prodStatusName status-${item.snapshot.productStatus}`}>
                                                {getProductStatusName(item.snapshot.productStatus)}
                                            </span>
                                        </div>
                                    </section>
                                    <section className="section productTitle">
                                        <h4>Название объявления</h4>
                                        <div className="sectionBlock">
                                            {item.snapshot.productTitle}
                                        </div>
                                    </section>
                                    <section className="section productGeolocation">
                                        <h4>Местоположение</h4>
                                        <div className="sectionBlock">
                                            {Address(item.snapshot.productGeolocation)}
                                        </div>
                                    </section>
                                    <section className="section productPrice">
                                        <h4>Стоимость</h4>
                                        <div className="sectionBlock">
                                            {!item.snapshot.productPrice ? Language("PRICE_ZERO") : 
                                                new Intl.NumberFormat(window.language, {
                                                    style: "currency",
                                                    currency: item.snapshot.productCurrency
                                                }).format(item.snapshot.productPrice)}
                                            
                                            {item.snapshot.productPrice ? (
                                                <div className="course">
                                                    <span>
                                                        USD:&nbsp;
                                                        {new Intl.NumberFormat(window.language, {style: "currency", currency: "USD"}).format(item.snapshot.productPrice)}
                                                    </span>
                                                    <span>
                                                        {window.userdata.currency.toUpperCase()}:&nbsp;
                                                        {new Intl.NumberFormat(window.language, {style: "currency", currency: window.userdata.currency}).format(item.snapshot.productPrice)}
                                                    </span>
                                                </div>
                                            ) : ''}
                                        </div>
                                    </section>
                                    <section className="section productCharacteristics">
                                        <h4>{Language('PRODUCT_ID_CHARACTERISTICS', "характеристика")}</h4>
                                        <div className="sectionBlock">
                                            <div className="list">
                                                <FormsRender productForms={item.snapshot.productForms} categoryForms={item.snapshot.categoryForms} />
                                            </div>
                                        </div>
                                    </section>
                                    <section className="section productDescription">
                                        <h4>{Language('PRODUCT_ID_DESCRIPTION', "описание")}</h4>
                                        <div className="sectionBlock">
                                            {item.snapshot.productDescription}
                                        </div>
                                    </section>
                                    <section className="section moderationComment">
                                        <h4>Комментарий модератора</h4>
                                        <div className="sectionBlock">
                                            {item.moderationComment ? item.moderationComment : (<span className="null">{Language("NO")}</span>)}
                                        </div>
                                    </section>
                                </div>
                            </div>
                        </div>
                    )
                })}

                {!moderationHistory.length ? (
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                        <span className="null">{Language("NO")}</span>
                    </div>
                ) : ''}
            </div>
        </div>
    )
}


function ModerationActionsBlock({
    product,
    setProduct,

    setNavigate,
    setReload,
    setErrorPage
}: BlockProps) {
    const [ loader, setLoader ] = React.useState(false)

    const [ banModal, setBanModal ] = React.useState(false)
    const [ deleteModal, setDeleteModal ] = React.useState(false)

    const [ commentForm, setCommentForm ] = React.useState({
        value: '',
        mark: null,
        error: null
    })

    async function onBanProduct() {
        setBanModal(false)

        if(loader || !product)return
        if(product.prodStatus === enumProductStatus.PRODUCT_STATUS_DELETED)return

        if(commentForm.mark !== 'accept')return
        if(!commentForm.value.length)return Alert("Напишите комментарий")

        setLoader(true)
        const result = await APISync({
            url: '/defaultapi/moderation/product/ban',
            type: 'put',
            data: {
                prodID: product.prodID,
                comment: commentForm.value
            }
        })

        setLoader(false)
        if(result.statusCode === 200) {
            Alert(`Вы успешно ${product.prodStatus === enumProductStatus.PRODUCT_STATUS_BANNED ? "разблокировали" : "заблокировали"} объявление`, "success")
        }
        else {
            if(result.statusCode === 404) setNavigate('/')
            else if(result.statusCode === 500) {
                setNavigate('/')
                Alert("Не удалось изменить объявление, попробуйте позже")

                notify("(productcard) /moderation/product/ban: " + result.message, { debug: true })
            }
            else if(result.statusCode === 403) setErrorPage({ code: 403 })
            else notify("(productcard) /moderation/product/ban: " + result.message, { debug: true })
            return
        }

        setReload(true)
    }
    async function onDeleteProduct() {
        setDeleteModal(false)
        if(loader || !product)return

        if(commentForm.mark !== 'accept')return
        if(!commentForm.value.length)return Alert("Напишите комментарий")

        setLoader(true)
        const result = await APISync({
            url: '/defaultapi/moderation/product/delete',
            type: 'delete',
            data: {
                prodID: product.prodID,
                comment: commentForm.value
            }
        })

        setLoader(false)
        if(result.statusCode === 200) {
            Alert(`Вы успешно ${product.prodStatus === enumProductStatus.PRODUCT_STATUS_DELETED ? "восстановили" : "удалили"} объявление`, "success")
        }
        else {
            if(result.statusCode === 404) setNavigate('/')
            else if(result.statusCode === 500) {
                setNavigate('/')
                Alert("Не удалось изменить объявление, попробуйте позже")

                notify("(productcard) /moderation/product/delete: " + result.message, { debug: true })
            }
            else if(result.statusCode === 403) setErrorPage({ code: 403 })
            else notify("(productcard) /moderation/product/delete: " + result.message, { debug: true })
            return
        }

        setReload(true)
    }
    async function onChangeModStatus(status: number) {
        if(loader || !product)return
        if(status < 0 || status > 2)return
        if(status === product.prodModerationStatus)return
        if(product.prodStatus !== enumProductStatus.PRODUCT_STATUS_ACTIVE)return
    
        if(commentForm.mark !== 'accept')return
        if(!commentForm.value.length)return Alert("Напишите комментарий")
        
        setLoader(true)
        const result = await APISync({
            url: '/defaultapi/moderation/product/verdict',
            type: 'put',
            data: {
                prodID: product.prodID,
                status,
                comment: commentForm.value
            }
        })

        setLoader(false)
        if(result.statusCode === 200) {
            Alert("Вы успешно изменили модераторский статус объявления", "success")
        }
        else {
            if(result.statusCode === 404) setNavigate('/')
            else if(result.statusCode === 500) {
                setNavigate('/')
                Alert("Не удалось изменить объявление, попробуйте позже")

                notify("(productcard) /moderation/product/verdict: " + result.message, { debug: true })
            }
            else if(result.statusCode === 403) setErrorPage({ code: 403 })
            else notify("(productcard) /moderation/product/verdict: " + result.message, { debug: true })
            return
        }

        setReload(true)
    }

    if(!RolePrivilegesVerify("/moderation/product/ban", window.userdata.roles)
        && !RolePrivilegesVerify("/moderation/product/verdict", window.userdata.roles)
        && !RolePrivilegesVerify("/moderation/product/delete", window.userdata.roles))return (<></>)
    
    return (
        <div className="moderationactionsblock block">
            {loader ? (<ModalLoader toggle={true} />) : ''}

            {banModal ? (
                <Modal toggle={true} title={
                        product.prodStatus === enumProductStatus.PRODUCT_STATUS_BANNED
                        ? Language("PRODUCT_ID_MODERATION_UNBAN_MODAL_TITLE")
                        : Language("PRODUCT_ID_MODERATION_BAN_MODAL_TITLE")
                    }
                    body={
                        product.prodStatus === enumProductStatus.PRODUCT_STATUS_BANNED
                        ? Language("PRODUCT_ID_MODERATION_UNBAN_MODAL_TEXT", null, { isjsx: true })
                        : Language("PRODUCT_ID_MODERATION_BAN_MODAL_TEXT", null, { isjsx: true })
                    }
                    modalBodyOverflow={"visible"}
                    buttons={[ Language("CANCEL"), Language(product.prodStatus === enumProductStatus.PRODUCT_STATUS_BANNED ? "PRODUCT_ID_MODERATION_UNBAN_TITLE" : "PRODUCT_ID_MODERATION_BAN_TITLE") ]}

                    onClose={() => setBanModal(false)}
                    onClick={onBanProduct}
                />
            ) : ''}

            {deleteModal ? (
                <Modal toggle={true} title={
                        product.prodStatus === enumProductStatus.PRODUCT_STATUS_DELETED
                        ? Language("PRODUCT_ID_MODERATION_UNDELETE_MODAL_TITLE")
                        : Language("PRODUCT_ID_MODERATION_DELETE_MODAL_TITLE")
                    }
                    body={
                        product.prodStatus === enumProductStatus.PRODUCT_STATUS_DELETED
                        ? Language("PRODUCT_ID_MODERATION_UNDELETE_MODAL_TEXT", null, { isjsx: true })
                        : Language("PRODUCT_ID_MODERATION_DELETE_MODAL_TEXT", null, { isjsx: true })
                    }
                    modalBodyOverflow={"visible"}
                    buttons={[ Language("CANCEL"), Language(product.prodStatus === enumProductStatus.PRODUCT_STATUS_DELETED ? "PRODUCT_ID_MODERATION_UNDELETE_TITLE" : "PRODUCT_ID_MODERATION_DELETE_TITLE") ]}

                    onClose={() => setDeleteModal(false)}
                    onClick={onDeleteProduct}
                />
            ) : ''}

            <div className="descriptiontext">
                <Input type={"textarea"} title={Language("PRODUCT_ID_MODERATION_RESULT_OTHER")}
                    icon={(<MdOutlineDescription />)}
                    data={{ mark: commentForm.mark, error: commentForm.error }}
                    value={commentForm.value}
                    onInput={event => {
                        const value = (event.target as HTMLDivElement).innerText
                        const result = { value, mark: 'accept', error: null }

                        if(value.length) {
                            if(value.length < 10 || value.length > 512) {
                                result.error = "Длина комментария должна быть 10 - 512 символов"
                                result.mark = 'error'
                            }
                        }
                        else result.mark = null

                        setCommentForm(result)
                    }}
                    disabled={loader}
                />
            </div>

            <div className="list">
                {RolePrivilegesVerify("/moderation/product/verdict", window.userdata.roles)
                    && product.prodStatus === enumProductStatus.PRODUCT_STATUS_ACTIVE ? (
                    <div className="elem modstatuschange">
                        <Button name={"Изменить статус модерации"} type={"border"} loader={loader} disabled={loader || commentForm.mark !== 'accept'} />
                        <DropdownMenu list={[
                            {
                                content: getProductModerationStatusName(enumProductModerationStatus.PRODUCT_MODERATION_STATUS_VERIFYING),
                                disabled: product.prodModerationStatus === enumProductModerationStatus.PRODUCT_MODERATION_STATUS_VERIFYING,
                                onClick: () => onChangeModStatus(enumProductModerationStatus.PRODUCT_MODERATION_STATUS_VERIFYING)
                            },
                            { 
                                content: getProductModerationStatusName(enumProductModerationStatus.PRODUCT_MODERATION_STATUS_VERIFIED),
                                disabled: product.prodModerationStatus === enumProductModerationStatus.PRODUCT_MODERATION_STATUS_VERIFIED,
                                onClick: () => onChangeModStatus(enumProductModerationStatus.PRODUCT_MODERATION_STATUS_VERIFIED)
                            },
                            {
                                content: getProductModerationStatusName(enumProductModerationStatus.PRODUCT_MODERATION_STATUS_PROBLEM),
                                disabled: product.prodModerationStatus === enumProductModerationStatus.PRODUCT_MODERATION_STATUS_PROBLEM,
                                onClick: () => onChangeModStatus(enumProductModerationStatus.PRODUCT_MODERATION_STATUS_PROBLEM)
                            },
                        ]} />
                    </div>
                ) : ''}

                <div className="listWrap">
                    {RolePrivilegesVerify("/moderation/product/ban", window.userdata.roles)
                        && product.prodStatus !== enumProductStatus.PRODUCT_STATUS_DELETED ? (
                        <div className={`elem ${product.prodStatus === enumProductStatus.PRODUCT_STATUS_BANNED ? 'unbanproduct' : 'banproduct'}`}>
                            <Button name={Language(product.prodStatus === enumProductStatus.PRODUCT_STATUS_BANNED ? "PRODUCT_ID_MODERATION_UNBAN_TITLE" : "PRODUCT_ID_MODERATION_BAN_TITLE")}
                                loader={loader} disabled={loader || commentForm.mark !== 'accept'}
                                onClick={() => setBanModal(true)}
                            />
                        </div>
                    ) : ''}

                    {RolePrivilegesVerify("/moderation/product/delete", window.userdata.roles) ? (
                        <div className={`elem ${product.prodStatus === enumProductStatus.PRODUCT_STATUS_DELETED ? 'undelete' : 'delete'}`}>
                            <Button name={Language(product.prodStatus === enumProductStatus.PRODUCT_STATUS_DELETED ? "PRODUCT_ID_MODERATION_UNDELETE_TITLE" : "PRODUCT_ID_MODERATION_DELETE_TITLE")}
                                loader={loader} disabled={loader || commentForm.mark !== 'accept'}
                                onClick={() => setDeleteModal(true)}
                            />
                        </div>
                    ) : ''}
                </div>
            </div>
        </div>
    )
}


function ModerationInfoBlock({
    product,
    setProduct
}: BlockProps) {
    const location = useLocation()

    return (
        <div className="moderationinfoblock block">
            <h1 className="title">{"Информация для модерации"}</h1>
            <div className="list">
                <div className="elem productid">
                    <section className="elemtitle">Номер объявления</section>
                    <section className="elemvalue">
                        {product.prodID.toLocaleString()}
                    </section>
                </div>
                <div className="elem owner">
                    <section className="elemtitle">Создатель</section>
                    <section className="elemvalue">
                        {location.pathname.indexOf(`/users/${product.prodOwner.id}/product/${product.prodID}`) !== -1 ? (
                            <Username account={product.prodOwner} />
                        ) : (
                            <Link target={'_blank'} className='link' to={"/users/" + product.prodOwner.id}>
                                <Username account={product.prodOwner} />
                            </Link>
                        )}
                    </section>
                </div>
                <div className="elem createat">
                    <section className="elemtitle">Создано</section>
                    <section className="elemvalue">
                        {Moment(product.prodCreateAt).calendar()}
                    </section>
                </div>
                <div className={`elem status statusid-${product.prodStatus}`}>
                    <section className="elemtitle">Статус объявления</section>
                    <section className="elemvalue">
                        {getProductStatusName(product.prodStatus)}
                    </section>
                </div>
                <div className={`elem moderationstatus modstatusid-${product.prodModerationStatus}`}>
                    <section className="elemtitle">Статус модерации</section>
                    <section className="elemvalue">
                        {getProductModerationStatusName(product.prodModerationStatus)}
                    </section>
                </div>
                <div className={`elem views`}>
                    <section className="elemtitle">Просмотров</section>
                    <section className="elemvalue">
                        {product.prodViews}
                    </section>
                </div>
                <div className={`elem moderator`}>
                    <section className="elemtitle">Проверил</section>
                    <section className="elemvalue">
                        {product.prodModerator ? (
                            <Link target={'_blank'} className='link' to={"/users/" + 23}>
                                <Username account={product.prodOwner} />
                            </Link>
                        ) : (<span className="null">{Language("NO")}</span>)}
                    </section>
                </div>
                <div className={`elem moderationdate`}>
                    <section className="elemtitle">Дата проверки</section>
                    <section className="elemvalue">
                        {product.prodModerator ? Moment(product.prodModerationDate).calendar() : (<span className="null">{Language("NO")}</span>)}
                    </section>
                </div>
                <div className={`elem moderationcomment`}>
                    <section className="elemtitle">Комментарий модератора</section>
                    <section className="elemvalue">
                        {product.prodModerator ? product.prodModerationComment : (<span className="null">{Language("NO")}</span>)}
                    </section>
                </div>
            </div>
        </div>
    )
}


function DescriptionBlock({
    product,
    setProduct
}: BlockProps) {
    return (
        <div className={`descriptionblock block`}>
            <h1 className="title">{Language('PRODUCT_ID_DESCRIPTION', "описание")}</h1>
            <span className="text" dangerouslySetInnerHTML={{__html: product.prodDescription}}></span>
        </div>
    )
}


function FormsBlock({
    product,
    setProduct
}: BlockProps) {
    return (
        <div className={`formsblock block`}>
            <h1 className="title">{Language('PRODUCT_ID_CHARACTERISTICS', "характеристика")}</h1>
            <div className="categoryinfo">
                <h6>{Language("PRODUCTS_ITEM_TITLE_CATEGORY")}:</h6>
                <Link target={"_blank"} className='link' to={categoryGenerateLink(product.prodCategory)}>
                    {product.prodCategory.categoryNameTranslate[window.language] || product.prodCategory.categoryName}
                </Link>
            </div>
            <div className="list">
                <FormsRender productForms={product.prodForms} categoryForms={product.prodCategory.categoryForms} />
            </div>
        </div>
    )
}

function FormsRender({
    productForms,
    categoryForms
}: { productForms: string | string[] | ProductForms, categoryForms: CategoryForm[] }) {
    if(!categoryForms || !categoryForms.length || !productForms) {
        return (<div className="null">{Language("PRODUCT_ID_CHARACTERISTICS_NULL")}</div>)
    }

    return (
        <>
            {categoryForms.map((item, i) => {
                if(!productForms[item.key])return
                
                return (
                    <section className={`elem _${item.type === 'input' ? item.params.type : item.type}`} key={i}>
                        <h3 className="elemTitle">{item.nameTranslate[window.language] || item.name}:</h3>

                        {item.type === 'select' ? (
                            <span className="elemValue">
                                {parseInt(productForms[item.key]) === -1
                                    ? Language("NOT_INSTALL")
                                    : item.params.list[productForms[item.key]].translate[window.language] || item.params.list[productForms[item.key]].title}
                            </span>
                        ) : (
                            <span className="elemValue">
                                {item.type === 'rangemulti'
                                    ? productForms[item.key][0] + ' - ' + productForms[item.key][1]
                                    : productForms[item.key]}
                            </span>
                        )}
                    </section>
                )
            })}
        </>
    )
}


function MainInfoBlock({
    product,
    setProduct
}: BlockProps) {
    const [ mapToggle, setMapToggle ] = React.useState(false)

    return (
        <div className="maininfoblock block">
            <div className="price">
                {!product.prodPrice ? Language("PRICE_ZERO") : 
                    new Intl.NumberFormat(window.language, {
                        style: "currency",
                        currency: product.prodCurrency
                    }).format(product.prodPrice)}
                
                {product.prodPrice ? (
                    <div className="course">
                        <span>
                            USD:&nbsp;
                            {new Intl.NumberFormat(window.language, {style: "currency", currency: "USD"}).format(product.prodPrice)}
                        </span>
                        <span>
                            {window.userdata.currency.toUpperCase()}:&nbsp;
                            {new Intl.NumberFormat(window.language, {style: "currency", currency: window.userdata.currency}).format(product.prodPrice)}
                        </span>
                    </div>
                ) : ''}
            </div>

            <h1 className="title">{product.prodTitle}</h1>
            <div className="address">
                <span className="address_text">
                    {Address(product.prodGeo, product.prodOnlyCity)}
                </span>
                <Button type={"border"} selected={mapToggle} name={Language(mapToggle ? "PRODUCT_ID_MAP_HIDE" : "PRODUCT_ID_MAP_SHOW")}
                    onClick={() => setMapToggle(!mapToggle)}
                />

                {mapToggle ? (
                    <MapLeaflet position={new LatLng(product.prodGeo.lat, product.prodGeo.lng)} disabled={true} radius={product.prodOnlyCity && 10} hideMarker={product.prodOnlyCity && true} />
                ) : ''}
            </div>
        </div>
    )
}

function ImagesBlock({
    product,
    setProduct
}: BlockProps) {
    const [ selected, setSelected ] = React.useState(0)

    return (
        <div className="imagesblock block">
            <div className="imagesPreview">
                <div className="image blur">
                    <img src={formatImage(product.prodImages[selected], 1920)} />
                </div>

                <div className="image">
                    <img src={formatImage(product.prodImages[selected], 1920)} />
                </div>

                {product.prodImages.length > 1 ? (
                    <div className="imagesswitch">
                        {selected > 0 ? (
                            <div className="arrow left" onClick={() => setSelected(old => old - 1)}>
                                <FaArrowLeft />
                            </div>
                        ) : ''}

                        {selected < product.prodImages.length - 1 ? (
                            <div className="arrow right" onClick={() => setSelected(old => old + 1)}>
                                <FaArrowRight />
                            </div>
                        ) : ''}
                    </div>
                ) : ''}
            </div>

            <div className="imagesList">
                {product.prodImages.map((image, i) => {
                    return (
                        <div className={`elem ${i === selected && 'selected'}`} key={i} onClick={() => setSelected(i)}>
                            <img src={formatImage(image, 360)} />
                        </div>
                    )
                })}
            </div>
        </div>
    )
}