import React from 'react'
import { Link, Navigate } from 'react-router-dom'
import Cookies from 'universal-cookie';
import $ from 'jquery'

import Moment from 'moment'
import 'moment/min/locales'

import './index.scss'

import { MdFavorite } from 'react-icons/md'
import { MdFavoriteBorder } from 'react-icons/md'

import { formatText } from '@modules/functions/formatText'
import { Language } from '@modules/Language'

import CONFIG from '@config'
import { notify } from '@modules/Notify';
import { API } from '@modules/API'
import { isValidJSON } from '@modules/functions/isValidJSON';
import { addProductFavorite } from './addProductFavorite';

import { formatImage } from '@modules/functions/formatImage'
import Address from '@components/address';
import ProductDTO from '@dto/product.dto';
import { categoryGenerateLink } from '@modules/functions/categoryGenerateLink';
import { useSwipeable } from 'react-swipeable';
import { renderCurrencyIcon } from '@modules/functions/renderCurrencyIcon';
import { PiBookmarkSimpleBold, PiBookmarkSimpleFill } from 'react-icons/pi';
import { CustomStorage } from '@modules/CustomStorage';

type AdCartType = 'horizontal' | 'vertical'
type AdCartSize = 'min' | 'medium' | 'big'

interface AdCartProps {
    cartLink?: string,
    product: ProductDTO,

    type: AdCartType,
    size?: AdCartSize,

    style?: React.CSSProperties,
    classes?: string,

    onChangeFavorite?(favorite: any, product: ProductDTO): void
}

export default function AdCart({
    cartLink,
    product,

    type,
    size,

    style,
    classes,

    onChangeFavorite
}: AdCartProps) {
    const [ navigate, setNavigate ] = React.useState(null)
    React.useEffect(() => { if(navigate !== null) setNavigate(null) }, [navigate])

    const [ link, setLink ] = React.useState('/')
    Moment.locale(window.language)

    React.useEffect(() => {
        if(!cartLink) setLink(`?ad=${product.prodID}`)
        else setLink(cartLink + '/' + product.prodID)
    }, [product])

    const [ favoriteBtn, setFavoriteBtn ] = React.useState(true)
    const [ favorite, setFavorite ] = React.useState(false)

    React.useEffect(() => {
        if(product.prodModerationStatus !== undefined
            && product.prodModerationStatus !== CONFIG.enumProductModerationStatus.PRODUCT_MODERATION_STATUS_VERIFIED) setFavoriteBtn(false)
        if(product.prodStatus !== CONFIG.enumProductStatus.PRODUCT_STATUS_ACTIVE) setFavoriteBtn(false)
    }, [product])

    React.useMemo(() => {
        checkFavorite()
    }, [])
    React.useEffect(() => {
        if(onChangeFavorite) onChangeFavorite(favorite, product)
    }, [favorite])

    function checkFavorite() {
        let favorites: number[] = new CustomStorage().get('favorites_ads')
        if(!favorites) favorites = []

        if(favorites.indexOf(product.prodID) !== -1) setFavorite(true)
        else setFavorite(false)
    }
    function onFavorite() {
        if(addProductFavorite(product)) setFavorite(!favorite)
    }

    function onLink(event) {
        if($(event.target).is('.favorite')
            || $(event.target).closest('.favorite').length) {
            event.preventDefault()
        }
    }


    // jsx
    function PriceBlock() {
        return (
            <div className="price">
                <h1 className="cash">
                    {!product.prodPrice ? Language('PRICE_ZERO') : 
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
                <FavoriteBlock />
            </div>
        )
    }
    function FavoriteBlock() {
        if(favoriteBtn)return (
            <button className={`favorite ${favorite ? 'on' : ''}`} onClick={() => onFavorite()}>
                {favorite ? (<PiBookmarkSimpleFill />) : (<PiBookmarkSimpleBold />)}
            </button>
        )
        
        return
    }
    function VipBlock() {
        if(vipstatus === 'vip')return (
            <div className="vipstatus">
                <img src="/assets/vipstatus/vip.png" />
            </div>
        )
        return
    }
    //////

    const vipstatus: string = ''
    return (
        <Link to={link} className={`adcart ${type} ${size} vip-${vipstatus} ${classes}`} onClick={onLink} style={style}>
            <div className="preview">
                <PreviewImages product={product} />
                <VipBlock />

                {type === 'vertical' && <Link to={categoryGenerateLink(product.prodCategory)} className="categoryname">{product.prodCategory.categoryName}</Link>}
            </div>

            {type === 'horizontal' ? (
                <div className="rightblock">
                    <section className="topsection">
                        <div className="titleblock">
                            <h1 className="title">{product.prodTitle}</h1>
                            <Link to={categoryGenerateLink(product.prodCategory)} className="categoryname">{product.prodCategory.categoryName}</Link>
                        </div>
                        <PriceBlock />
                        <span className="desc">{formatText(product.prodDescription, 50)}</span>
                    </section>
                    <div className="bottom">
                        <h1 className="address">{Address(product.prodGeo, product.prodOnlyCity)}</h1>
                        <span className="date">
                            {Moment(product.prodCreateAt).calendar()}
                        </span>
                    </div>
                </div>
            ) : (
                <>
                    <h1 className="title">{product.prodTitle}</h1>
                    <PriceBlock />
                    <span className="desc">{formatText(product.prodDescription, 50)}</span>
                    <div className="bottom">
                        <h1 className="address">{Address(product.prodGeo, true)}</h1>
                        <span className="date">
                            {Moment(product.prodCreateAt).calendar()}
                        </span>
                    </div>
                </>
            )}

            {navigate ? (<Navigate to={navigate} />) : ''}
        </Link>
    )
}


function PreviewImages({
    product
}: { product: ProductDTO }) {
    const [ previewSelect, setPreviewSelect ] = React.useState(0)
    const swipeImages = useSwipeable({
        onSwiped: event => {
            if(event.dir === 'Left') {
                setPreviewSelect(old => {
                    if(old < product.prodImages.length - 1) old += 1
                    return old
                })
            }
            else if(event.dir === 'Right') {
                setPreviewSelect(old => {
                    if(old > 0) old -= 1
                    return old
                })
            }
        },
        delta: 15
    })

    return (
        <section className="previewWrapper" onMouseLeave={() => setPreviewSelect(0)} {...swipeImages}>
            <div className="previewImages" style={{transform: `translateX(-${previewSelect * 100}%)`}}>
                {product.prodImages.map((item, i) => {
                    if(i >= CONFIG.maxProductCartPreviewImages)return
                    return (
                        <section key={i}>
                            <img className="privewimage" src={formatImage(item, 1366)} />
                            {(product.prodImages.length > CONFIG.maxProductCartPreviewImages
                                && i === CONFIG.maxProductCartPreviewImages - 1) ? (
                                <div className="previewImagesMore">
                                    <h1>{Language("MORE_IMAGES", "еще %n изображения", {}, product.prodImages.length - CONFIG.maxProductCartPreviewImages)}</h1>
                                    {/* <h1>Еще {product.prodImages.length - CONFIG.maxProductCartPreviewImages} изображений</h1> */}
                                </div>
                            ) : ''}
                        </section>
                    )
                })}
            </div>

            {!product.prodImages.length ? (
                <div className="imagenotfound">
                    <section className="imagenotfound-wrapper">
                        <img className="imagenotfound-img" src="/assets/image.png" />
                        <h6 className="imagenotfound-title">{Language('IMAGE_NOT_FOUND', "Нет изображения")}</h6>
                    </section>
                </div>
            ) : ''}

            {product.prodImages.length > 1 ? (
                <>
                    <div className="listcount">
                        {product.prodImages.map((_, i) => {
                            if(i >= CONFIG.maxProductCartPreviewImages)return
                            return (<div className={previewSelect === i ? 'selected' : ''} key={i} onClick={event => {
                                event.preventDefault()
                                setPreviewSelect(i)
                            }}></div>)
                        })}
                    </div>
                    <div className="listmovecount">
                        {product.prodImages.map((_, i) => {
                            if(i >= CONFIG.maxProductCartPreviewImages)return
                            return (<div onMouseEnter={() => {
                                if(previewSelect !== i) setPreviewSelect(i)
                            }} key={i}></div>)
                        })}
                    </div>
                </>
            ) : ''}
        </section>
    )
}




export function AdCartLoaderDiv({
    type,
    size,
    style,
}: { type: AdCartType, size?: AdCartSize, style?: React.CSSProperties }) {
    if(type === 'horizontal') {
        return (
            <div className={`adcart _loaderdiv_ ${type} ${size}`} style={style}>
                <div className="preview _loaderdiv"></div>
                
                <div className="rightblock">
                    <section className="topsection">
                        <div className="titleblock">
                            <div className="_loaderdiv" style={{ width: "60%", height: "26px", borderRadius: "6px" }}></div>
                            <div className="_loaderdiv" style={{ width: "36px", height: "36px", borderRadius: "50%" }}></div>
                        </div>
                        <div className="_loaderdiv" style={{ width: "86px", height: "24px", borderRadius: "6px" }}></div>
                        <div className="_loaderdiv" style={{ width: "100%", height: "100%", borderRadius: "6px", marginTop: "12px" }}></div>
                    </section>
                    <div className="bottom">
                        <div className="_loaderdiv" style={{ width: "20%", height: "22px", borderRadius: "6px" }}></div>
                        <div className="_loaderdiv" style={{ width: "10%", height: "18px", borderRadius: "6px" }}></div>
                    </div>
                </div>
            </div>
        )
    }
    return (
        <div className={`adcart _loaderdiv_ ${type} ${size}`} style={style}>
            <div className="preview _loaderdiv"></div>
            <div className="title _loaderdiv" style={{width: "100%", height: "24px"}}></div>
            <div className="price" style={{ marginTop: "6px" }}>
                <div className="cash _loaderdiv" style={{width: "120px", height: "20px"}}></div>
            </div>
            <div className="desc _loaderdiv" style={{width: "100%", height: "40px", borderRadius: "8px"}}></div>
            <div className="bottom">
                <h1 className="address _loaderdiv" style={{width: "80px", height: "16px"}}></h1>
                <span className="date _loaderdiv" style={{width: "60px", height: "12px"}}></span>
            </div>
        </div>
    )
}