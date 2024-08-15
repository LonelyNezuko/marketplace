import React from 'react'
import { Link, useParams, Navigate, useLocation } from 'react-router-dom'
import $ from 'jquery'

import Moment from 'moment'
import 'moment/min/locales'

import { AiFillCaretLeft } from 'react-icons/ai'
import { AiFillCaretRight } from 'react-icons/ai'

import './index.scss'

import { Avatar } from '@components/avatar/avatar'
import { Language } from '@modules/Language'
import { CircleLoader } from '@components/circleLoader/circleLoader'
import _MarketingBlock from '@components/_marketingblock'

import CONFIG from '@config'
import Input from '@components/input'
import { Modal } from '@components/modals'
import { notify } from '@modules/Notify'

import { API, APISync } from '@modules/API'
import { RouteErrorCode, RouteErrorCodeProps } from '../errorcodes'

import AdCart, { AdCartLoaderDiv } from '@components/adcart'
import RatingStars from '@components/ratingstars'
import { isValidJSON } from '@functions/isValidJSON'
import Username from '@components/username'
import Address from '@components/address'
import { Alert } from '@components/alert'
import Cookies from 'universal-cookie'
import { parseQuery } from '@functions/parseQuery'
import ProductDTO from '@dto/product.dto'
import RouteProductCharacteristics from './characteristics'
import RouteProductDescription from './description'
import RouteProductOwnerData from './ownerData'
import SetRouteTitle from '@modules/SetRouteTitle'
import Button from '@components/button'
import { useSwipeable } from 'react-swipeable'
import EmailVerify from '@components/emailVerify'
import { formatImage } from '@modules/functions/formatImage'
import MapLeaflet from '@components/mapLeaflet'
import { LatLng } from 'leaflet'
import PhoneTopHide from '@components/phoneTopHide'
import { IoClose } from 'react-icons/io5'
import ModalLoader from '@components/modals/loader'
import { CustomStorage } from '@modules/CustomStorage'
import Image from '@components/Image'
import UserHistory from '@modules/UserHistory'
import getRecommendationProducts from '@modules/GetRecommendationProducts'
import getSimilarProducts from '@modules/GetSimilarProducts'
import floatToInt from '@modules/functions/floatToInt'
import isScrolledIntoView from '@modules/functions/isScrolledIntoView'
import { reportModalShow } from '@src/store/reportModal'
import store from '@src/store'

interface RouteProductProps {
    prodID?: number,
    modal?: boolean,

    onModalClose?: () => void
}
export default function RouteProduct({
    prodID,

    modal,
    onModalClose
}: RouteProductProps) {
    const [ toggle, setToggle ] = React.useState(false)
    const [ prevRouteTitle, setPrevRouteTitle ] = React.useState<string>(null)
    
    const [ loader, setLoader ] = React.useState(true)
    const [ errorPage, setErrorPage ] = React.useState<RouteErrorCodeProps>({ code: 0, text: '', showbtn: false })

    const [ navigate, setNavigate ] = React.useState(null)
    React.useEffect(() => { if(navigate !== null) setNavigate(null) }, [navigate])

    Moment.locale(window.language)

    const params = useParams()
    const location = useLocation()

    const [ product, setProduct ] = React.useState<ProductDTO>(null)

    React.useEffect(() => {
        // api
        const id: number = parseInt(params.id) || prodID
        if(!id || isNaN(id)) {
            if(onModalClose) onModalClose()
            // setErrorPage({ code: 400, text: Language("400PAGE_TEXT", "ошибка"), showbtn: true, btnurl: '/', btnname: Language('404PAGE_BTN', 'главная') })
            return
        }

        setLoader(true)
        API({
            url: '/defaultapi/product',
            type: 'get',
            data: {
                prodID: id,
                isNotBanned: true
            }
        }).done(result => {
            if(result.statusCode === 200) {
                setProduct(result.message)
                setLoader(false)

                UserHistory.add('product-view', null, result.message)
            }
            else {
                if(result.statusCode === 404 && result.message === 'Product with this ProdID not found') {
                    Alert(Language("PRODUCT_NOT_FOUND_ALERT"), "error", null, 10000)
                    if(onModalClose) onModalClose()
                    // setErrorPage({ code: 404, text: Language("PRODUCT_ID_404ERROR_ID", "ошибка"), showbtn: true, btnurl: '/', btnname: Language('404PAGE_BTN', 'главная') })
                }
                else if(result.statusCode === 403) {
                    if(onModalClose) onModalClose()
                    // setErrorPage({ code: 403, text: Language("403PAGE_TEXT", "forbidden"), showbtn: false })
                }
                else notify("(product) /product: " + result.message, { debug: true })
            }
        })

        if(modal) setPrevRouteTitle(document.title)
    }, [prodID])

    React.useEffect(() => {
        if(loader === false) {
            setToggle(true)
        }
    }, [loader])
    function onClose() {
        setToggle(false)
        if(modal && prevRouteTitle) SetRouteTitle(prevRouteTitle)

        if(window.isPhone) {
            setTimeout(() => {
                if(onModalClose) onModalClose()
            }, 300)
        }
        else if(onModalClose) onModalClose()
    }

    React.useEffect(() => {
        if(!loader
            && product) {
            setViews()

            let placeName = product.prodGeo.city || product.prodGeo.state || product.prodGeo.country || ''

            if(placeName) SetRouteTitle(`${Language("BUY")} ${product.prodTitle} ${Language("IN")} ${placeName} | ${product.prodCategory.categoryName}`)
            else SetRouteTitle(`${Language("BUY")} ${product.prodTitle} | ${product.prodCategory.categoryName}`)
        }
    }, [product, loader])
    function setViews() {
        let viewsProducts: number[] = new CustomStorage().get('views_ads')
        if(!viewsProducts) viewsProducts = []

        if(product
            && !isNaN(product.prodID)
            && viewsProducts.indexOf(product.prodID) === -1) {
            API({
                url: '/defaultapi/product/set/views',
                type: 'post',
                data: {
                    prodID: product.prodID
                }
            }).done(result => {
                if(result.statusCode === 200) {
                    if(result.message === '') setProduct({...product, prodViews: product.prodViews + 1})
                }
                else notify('(product) /product/set/views: ' + result.message, { debug: true })
            })
        }
    }

    if(errorPage.code !== 0)return (
        <RouteErrorCode style={{marginTop: "128px"}} code={errorPage.code} text={errorPage.text}
            showbtn={errorPage.showbtn} btnurl={errorPage.btnurl} btnname={errorPage.btnname}
            icon={errorPage.icon} />
    )
    if(loader && !modal)return (
        <section style={{display: 'flex', justifyContent: 'center', marginTop: '128px'}}>
            <CircleLoader id="productIDMainLoader" type="big" color={`var(--tm-color)`} />
        </section>
    )

    if(loader && modal)return (
        <ModalLoader />
    )
    return (
        <div className={`route ${modal && 'isroutemodal'} ${toggle && 'show'}`} id="routeProduct" onClick={(event: any) => {
            if($('.route#routeProduct').has(event.target).length)return
            onClose()
        }}>
            <div className="routeProductWrapper">
                {modal && window.isPhone ? (
                    <PhoneTopHide onHide={onClose} />
                ) : ''}

                <div className="routeProductWrapperBlock">
                    <HeaderBlock product={product} setNavigate={setNavigate} setErrorPage={setErrorPage} />

                    <BodyBlock product={product} setNavigate={setNavigate} setErrorPage={setErrorPage} />
                    <BottomBlock product={product} />

                    {product ? (<RecommendatedAdsBlock product={product} />) : ''}
                </div>
            </div>
            {!window.isPhone || !modal ? (
                <div className="closebtn" onClick={onClose}>
                    <IoClose />
                </div>
            ) : ''}

            {navigate ? (<Navigate to={navigate} />) : ''}
        </div>
    )
}

interface BlockProps {
    product: ProductDTO,

    emailVerify?: boolean

    setNavigate?: React.Dispatch<any>,
    setErrorPage?: React.Dispatch<React.SetStateAction<RouteErrorCodeProps>>
}


function BottomBlock({
    product
}: BlockProps) {
    const location = useLocation()
    const accountID = window.userdata.uid

    return (
        <div className="body bottom">
            <div className="wrap" style={{width: '100%'}}>
            {accountID !== product.prodOwner.id ? (
                <div className="block warninginfo">
                    <section>
                        <h1>{Language("PLACEAD_WARNINGINFO_1")}</h1>
                        <h2>{Language("PLACEAD_WARNINGINFO_2")}</h2>
                    </section>
                </div>
            ) : ''}
            
            <div className="block otherinfo" style={{marginTop: "24px"}}>
                <section>
                    <h2>{Language("PLACEAD_OTHERINFO_ADNUMBER", null, null, product.prodID)}</h2>
                    <h2>{Language("PLACEAD_OTHERINFO_CREATEAT", null, null, Moment(product.prodCreateAt).calendar())}</h2>
                    <h2>{Language("PLACEAD_OTHERINFO_VIEWS", null, null, product.prodViews)}</h2>
                </section>
                {accountID !== product.prodOwner.id ? (
                    <section>
                        <Button name={Language("REPORTING")} id={"reportProduct"} type={"hover"} onClick={() => {
                            store.dispatch(reportModalShow({ toggle: true, type: 'product', suspectID: product.prodID }))
                        }} />
                    </section>
                ) : ''}
            </div>
            </div>
        </div>
    )
}

function RecommendatedAdsBlock({
    product
}: BlockProps) {
    const [ adsLoadMaxWidth, setAdsLoadMaxWidth ] = React.useState(5)
    const [ adsLoadMaxWidthCount, setAdsLoadMaxWidthCount ] = React.useState(5)

    React.useState(() => {
        function onResize(event) {
            if(event.target.innerWidth <= 450) {
                setAdsLoadMaxWidth(1)
                setAdsLoadMaxWidthCount(3)
            }
            else if(event.target.innerWidth <= 640) {
                setAdsLoadMaxWidth(2)
                setAdsLoadMaxWidthCount(4)
            }
            else if(event.target.innerWidth <= 880) {
                setAdsLoadMaxWidth(3)
                setAdsLoadMaxWidthCount(6)
            }
            else if(event.target.innerWidth <= 1150) {
                setAdsLoadMaxWidth(4)
                setAdsLoadMaxWidthCount(8)
            }
            else {
                setAdsLoadMaxWidth(5)
                setAdsLoadMaxWidthCount(10)
            }
        }

        onResize({ target: window })
        window.addEventListener('resize', onResize)

        return () => {
            window.removeEventListener('resize', onResize)
        }
    })

    const [ loaderSimilarProducts, setLoaderSimilarProducts ] = React.useState(true)
    const [ loaderRecommendedProducts, setLoaderRecommendedProducts ] = React.useState(true)

    const [ similarProducts, setSimilarProducts ] = React.useState<ProductDTO[]>([])
    const [ recommendedProducts, setRecommendedProducts ] = React.useState<ProductDTO[]>([])

    const [ lastSimilarProduct, setLastSimilarProduct ] = React.useState(false)
    const [ lastRecommendatedProduct, setLastRecommendatedProduct ] = React.useState(false)

    React.useMemo(() => {
        // related ads
        getSimilarProd()

        // recommended ads
        getRecommendationProd()
    }, [])

    async function getRecommendationProd() {
        if(recommendedProducts && recommendedProducts.length >= CONFIG.maxRecommendatedProductsOnProductPage)return
        if(lastRecommendatedProduct)return

        setLoaderRecommendedProducts(true)
        const result = await getRecommendationProducts(recommendedProducts, adsLoadMaxWidthCount, [ product.prodID ])

        if(result.length < adsLoadMaxWidthCount) setLastRecommendatedProduct(true)
        
        setRecommendedProducts(old => {
            return [...old, ...result]
        })
        setLoaderRecommendedProducts(false)
    }
    async function getSimilarProd() {
        if(similarProducts && similarProducts.length >= CONFIG.maxSimilarProductsOnProductPage)return
        if(lastSimilarProduct)return

        if(!product)return

        setLoaderSimilarProducts(true)
        const result = await getSimilarProducts(product, similarProducts, adsLoadMaxWidthCount)

        if(result.length < adsLoadMaxWidthCount) setLastSimilarProduct(true)

        setSimilarProducts(old => {
            return [...old, ...result]
        })
        setLoaderSimilarProducts(false)
    }

    React.useEffect(() => {
        const page = document.getElementById('routeProduct')
        if(page) {
            if(!window.isPhone) page.getElementsByClassName('routeProductWrapper')[0].addEventListener('scroll', onPageScroll)
            else page.getElementsByClassName('routeProductWrapperBlock')[0].addEventListener('scroll', onPageScroll)
        }

        return () => {
            if(page) {
                if(!window.isPhone) page.getElementsByClassName('routeProductWrapper')[0].removeEventListener('scroll', onPageScroll)
                else page.getElementsByClassName('routeProductWrapperBlock')[0].removeEventListener('scroll', onPageScroll)
            }
        }
    })
    
    function onPageScroll() {
        if(loaderSimilarProducts || loaderRecommendedProducts)return
        
        if(!lastSimilarProduct && similarProducts.length < CONFIG.maxSimilarProductsOnProductPage) {
            let nthchild = similarProducts.length - (18 / 2)
            if(nthchild < 0 || isNaN(nthchild)) nthchild = floatToInt(similarProducts.length / 2)
        
            const pageElement = $('#routeProduct .routeProductWrapper #productBlockSimilarList')
            const containerElement = pageElement.find(`.list .adcart:nth-child(${nthchild})`)

            if(isScrolledIntoView(containerElement)) getSimilarProd()
        }

        if(!lastRecommendatedProduct && recommendedProducts.length < CONFIG.maxRecommendatedProductsOnProductPage) {
            let nthchild = recommendedProducts.length - (18 / 2)
            if(nthchild < 0 || isNaN(nthchild)) nthchild = floatToInt(recommendedProducts.length / 2)
        
            const pageElement = $('#routeProduct .routeProductWrapper #productBlockRecommendatedList')
            const containerElement = pageElement.find(`.list .adcart:nth-child(${nthchild})`)

            if(isScrolledIntoView(containerElement)) getRecommendationProd()
        }
    }

    return (
        <div className="body bottom">
            <div className="wrap" style={{width: '100%'}}>
                <div className="block relatedads" id='productBlockSimilarList'>
                    <h1 className="title">{Language('PRODUCT_ID_ADS_RELATED')}</h1>
                    <div className="blockads">
                        <div className="list">
                            {similarProducts.map((product, i) => {
                                return (<AdCart key={i} product={product} type={"vertical"} size={"min"}
                                    style={{ width: `calc(100% / ${adsLoadMaxWidth} - 6.4px)`, minWidth: `calc(100% / ${adsLoadMaxWidth} - 6.4px)` }}
                                />)
                            })}

                            {loaderSimilarProducts ? (
                                <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 0' }}>
                                    <CircleLoader color={'var(--tm-color)'} />
                                </div>
                            ) : ''}
                        </div>
                    </div>
                </div>
                <div className="block relatedads" id='productBlockRecommendatedList'>
                    <h1 className="title">{Language('HOME_TITLES_RECOMENDED_PRODUCTS')}</h1>
                    <div className="blockads">
                        <div className="list">
                            {recommendedProducts.map((product, i) => {
                                return (<AdCart key={i} product={product} type={"vertical"} size={"min"}
                                    style={{ width: `calc(100% / ${adsLoadMaxWidth} - 6.4px)`, minWidth: `calc(100% / ${adsLoadMaxWidth} - 6.4px)` }}
                                />)
                            })}

                            {loaderRecommendedProducts ? (
                                <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 0' }}>
                                    <CircleLoader color={'var(--tm-color)'} />
                                </div>
                            ) : ''}
                        </div>
                    </div>
                </div>
            </div>

            <_MarketingBlock id={"product1"} size={{width: "300px", height: "700px"}} type="banner" style={"vertical"} />
        </div>
    )
}

function BodyBlock({
    product,

    setNavigate,
    setErrorPage
}: BlockProps) {
    const accountID = window.userdata.uid

    return (
        <div className="body" style={{marginBottom: "132px"}}>
            <div className="wrap" style={{width: '100%'}}>
                <MainInfo product={product} />

                <RouteProductCharacteristics product={product} classes='block' />
                <RouteProductDescription product={product} classes='block' />
            </div>
            <div className="wrap" style={{ width: '400px', minWidth: '400px' }}>
                {accountID !== product.prodOwner.id ? (
                    <AskedBlock product={product} setErrorPage={setErrorPage} setNavigate={setNavigate} />
                ) : ''}
            </div>
        </div>
    )
}
function HeaderBlock({
    product,
    
    setNavigate,
    setErrorPage
}: BlockProps) {
    const [ imageSelected, setImageSelected ] = React.useState(0)
    const swipeImages = useSwipeable({
        onSwiped: event => {
            if(event.dir === 'Left') {
                setImageSelected(old => {
                    if(old < product.prodImages.length - 1) old += 1
                    return old
                })
            }
            else if(event.dir === 'Right') {
                setImageSelected(old => {
                    if(old > 0) old -= 1
                    return old
                })
            }
        },
        delta: 15
    })

    return (
        <div className="header">
            <div className="preview">
                <div className="wrap">
                    {!window.isPhone ? (
                        <div className={`arrow left ${!imageSelected && 'hide'}`} onClick={() => {
                            if(imageSelected > 0) setImageSelected(old => old - 1)
                        }}>
                            <AiFillCaretLeft />
                        </div>
                    ) : ''}
                    
                    <div className="wrapper" {...swipeImages}>
                        {!product.prodImages.length ? (
                            <div className="imagenotfound">
                                <section>
                                    <img src="/assets/image.png" />
                                    <h6>{Language('IMAGE_NOT_FOUND', "Нет изображения")}</h6>
                                </section>
                            </div>
                        ) : (
                            <div className="imageswrap" style={{transform: `translateX(-${imageSelected * 100}%)`}}>
                                {product.prodImages.map((item, i) => {
                                    return (<div key={i} className="image" style={{ background: null }}>
                                        <img src={item} className="blur" />
                                        <Image src={item} />
                                    </div>)
                                })}
                            </div>
                        )}
                    </div>

                    {!window.isPhone ? (
                        <div className={`arrow right ${(imageSelected === product.prodImages.length - 1 || !product.prodImages.length) && 'hide'}`} onClick={() => {
                            if(imageSelected < product.prodImages.length - 1) setImageSelected(old => old + 1)
                        }}>
                            <AiFillCaretRight />
                        </div>
                    ) : ''}
                </div>

                {product.prodImages.length ? (
                    <div className="imageslist">
                        {product.prodImages.map((item, i) => {
                            if(window.isPhone)return (
                                <button className={`elem ${imageSelected === i && 'selected'}`} key={i}
                                    onClick={() => setImageSelected(i)}
                                ></button>
                            )
                            return (
                                <div className={`image ${imageSelected === i && 'selected'}`} key={i} onClick={() => setImageSelected(i)}>
                                    <img src={formatImage(item, 180)} />
                                </div>
                            )
                        })}
                    </div>
                ) : ''}
            </div>

            <RouteProductOwnerData product={product} setNavigate={setNavigate} setErrorPage={setErrorPage} />
        </div>
    )
}


function MainInfo({
    product
}: BlockProps) {
    return (
        <div className="maininfo">
            <h1 className="price">
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
            </h1>

            <h1 className="title">{product.prodTitle}</h1>
            <div className="address">
                <span className="address_text">
                    {Address(product.prodGeo, product.prodOnlyCity)}
                </span>
            </div>
        </div>
    )
}


function AskedBlock({
    product,

    setNavigate,
    setErrorPage
}: BlockProps) {
    const location = useLocation()
    const defaultText = Language('PRODUCT_ID_ASKED_FORM_AUTO_ASK')

    const [ text, setText ] = React.useState(defaultText)
    const [ variantsList, setVariantsList ] = React.useState([ "PRODUCT_ID_ASKED_ASK_1", "PRODUCT_ID_ASKED_ASK_2", "PRODUCT_ID_ASKED_ASK_3" ])

    const [ messageSent, setMessageSent ] = React.useState(-1)
    const [ messageSendingLoader, setMessageSendingLoader ] = React.useState(false)

    const [ emailVerify, setEmailVerify ] = React.useState(store.getState().emailVerifyReducer || null)
    const [ emailVerifyShow, setEmailVerifyShow ] = React.useState(false)

    React.useEffect(() => {
        const storeUnsubscribe = store.subscribe(() => {
            const emailVerifyState = store.getState().emailVerifyReducer
            if(emailVerifyState) setEmailVerify(emailVerifyState)
        })

        return () => {
            storeUnsubscribe()
        }
    }, [])

    React.useEffect(() => {
        const query: any = parseQuery(location.search)
        if(query.asktext) {
            setText(query.asktext)
        }
    }, [location])

    function onSubmit() {
        if(!emailVerify && window.userdata.uid !== -1)return setEmailVerifyShow(true)

        if(!text.length)return
        const accountID = window.userdata.uid

        if(!accountID)return setNavigate(`#signin?redirect=/ad/${product.prodID}?asktext=${text}&desc=ad`)

        const user = product.prodOwner
        setMessageSendingLoader(true)
        API({
            url: '/defaultapi/user/dialogs/message',
            type: 'post',
            data: {
                text,
                attachments: JSON.stringify([]),
                usersid: JSON.stringify([ user.id ])
            }
        }).done(result => {
            if(result.statusCode === 200) {
                setMessageSendingLoader(false)
                setMessageSent(result.message.dialogid)

                UserHistory.add('product-message', null, product)
            }
            else if(result.message === 'You do not have access to this dialog') {
                Alert(Language("CANT_SEND_MESSAGE"))
            }
            else if(result.message === "The user's email has not been verified") {
                Alert("Для отправки сообщений подтвердите почту")
            }
            else {
                setErrorPage({ code: result.statusCode })
                notify("(product submit message) /user/dialogs/message: " + result.message, { debug: true })
            }
        })
    }

    return (
        <div className="askowner block">
            {(emailVerifyShow && !emailVerify && window.userdata.uid !== -1) ? (
                <EmailVerify type={"messages"} modal={true} onModalClose={() => setEmailVerifyShow(false)} />
            ) : ''}

            <h1 className="title">{Language('PRODUCT_ID_ASKED_TITLE', "Ask seller")}</h1>
            {messageSent === -1 ? (
                <>
                    <div className="list">
                        {variantsList.map((item, i) => {
                            return (
                                <button className="btn border" key={i} onClick={() => {
                                    setText(defaultText + ' ' + Language(item))
                                }}>
                                    <span>{Language(item)}</span>
                                </button>
                            )
                        })}
                    </div>
                    <div className="form">
                        <Input id="routeProductAskOwnerInput" type="textarea" sendBtn={true} deleteLabel={true}
                            value={text}
                            onInput={event => setText(event.target.value.trim())}
                            onKeyDown={event => {
                                if(event.key === 'Enter'
                                    && event.shiftKey) {
                                    event.preventDefault()
                                    onSubmit()
                                }
                            }}
                            onSendClick={onSubmit}

                            disabled={messageSendingLoader}
                            sendBtnIcon={messageSendingLoader && (<CircleLoader color={"var(--tm-color)"} />)}
                        />
                    </div>
                </>
            ) : ''}

            {messageSent !== -1 ? (
                <div className="messageSent">
                    <h6>{Language("PRODUCT_ID_MESSAGE_SENT")}</h6>
                    <Link className="btn big border" to={`/account/messages/${messageSent}`}>
                        <span>{Language("PRODUCT_ID_MESSAGE_SENT_LINK")}</span>
                    </Link>
                </div>
            ) : ''}
        </div>
    )
}