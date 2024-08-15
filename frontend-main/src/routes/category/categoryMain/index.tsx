import React from 'react'
import $ from 'jquery'

import './index.scss'
import CategoryDTO from '@dto/category.dto'
import { formatImage } from '@modules/functions/formatImage'
import { Link } from 'react-router-dom'
import { categoryGenerateLink } from '@modules/functions/categoryGenerateLink'
import { Language } from '@modules/Language'
import ProductDTO from '@dto/product.dto'
import AdCart, { AdCartLoaderDiv } from '@components/adcart'
import { CircleLoader } from '@components/circleLoader/circleLoader'
import { API } from '@modules/API'
import { notify } from '@modules/Notify'
import PhoneHeaderTitle from '@components/phoneHeaderTitle'
import getRecommendationProducts from '@modules/GetRecommendationProducts'
import floatToInt from '@modules/functions/floatToInt'
import isScrolledIntoView from '@modules/functions/isScrolledIntoView'

interface RouteCategoryMainProps {
    category: CategoryDTO,
    routeTitle?: string
}
export default function RouteCategoryMain({
    category,
    routeTitle
}: RouteCategoryMainProps) {
    return (
        <div className="route" id="routeCategoryMain">
            {window.isPhone ? (
                <PhoneHeaderTitle text={routeTitle || category.categoryNameTranslate[window.language] || category.categoryName}
                    description={category.productsCount + ' ' + Language("ADS")}
                />
            ) : (
                <h6 className="mainTitle">
                    {routeTitle || category.categoryNameTranslate[window.language] || category.categoryName}
                    <span>{category.productsCount} {Language("ADS")}</span>
                </h6>
            )}

            <div className="routeCategoryMainWrapper">
                <div className="subcategories">
                    <div className="list">
                        {category.categorySubcategories.map((cat: CategoryDTO, i: number) => {
                            return (
                                <Link to={categoryGenerateLink(cat)} className="elem subcategory" key={i}>
                                    <h6 className="subcategoryTitle">
                                        {cat.categoryNameTranslate[window.language] || cat.categoryName}
                                        <span>{cat.productsCount} {Language("ADS")}</span>
                                    </h6>
                                    <div className="subcategoryImage">
                                        <section>
                                            <img src={formatImage(cat.categoryIcon, 90)} alt={cat.categoryNameTranslate[window.language] || cat.categoryName} />
                                        </section>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                </div>

                <AttentionProducts />

                <div className="subcategoriesPreview">
                    <div className="list">
                        {category.categorySubcategories.map((cat: CategoryDTO, i: number) => {
                            return (
                                <div className="elem subcategoryPreview" key={i}>
                                    <Link to={categoryGenerateLink(cat)} className="subcategoryHeader">
                                        <h6 className="subcategoryPreviewTitle">
                                            {cat.categoryNameTranslate[window.language] || cat.categoryName}
                                        </h6>

                                        <div className="subcategoryPreviewImage">
                                            <section>
                                                <img className='imagecover' src={formatImage(cat.categoryBackground, 720)} alt={cat.categoryNameTranslate[window.language] || cat.categoryName} />
                                            </section>
                                        </div>
                                    </Link>
                                    <div className="subcategoryList">
                                        {cat.categorySubcategories ? cat.categorySubcategories.map((cat: CategoryDTO, i: number) => {
                                            return (
                                                <Link to={categoryGenerateLink(cat)} className="subcategoryListElem" key={i}>
                                                    <h6>{cat.categoryNameTranslate[window.language] || cat.categoryName}</h6>
                                                    <span>{cat.productsCount} {Language("ADS")}</span>
                                                </Link>
                                            )
                                        }) : ''}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <RecommendedProducts />
            </div>
        </div>
    )
}




function RecommendedProducts() {
    const [ loader, setLoader ] = React.useState(true)
    const [ products, setProducts ] = React.useState<Array<ProductDTO>>([])

    const [ productsLast, setProductsLast ] = React.useState(false)

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

    React.useMemo(() => {
        loadProducts()
    }, [])

    async function loadProducts() {
        if(productsLast)return
        setLoader(true)

        const list = await getRecommendationProducts(products, adsLoadMaxWidthCount * 2, products.map(prod => prod.prodID))
        if(list.length < adsLoadMaxWidthCount * 2) {
            setProductsLast(true)
        }

        setProducts(old => {
            return [...old, ...list]
        })
        setLoader(false)
    }

    // добавить сюда прогруз по прокрутке до 5 раз по 20 штук
    React.useEffect(() => {
        const element = $('#body')

        if(element) element.on('scroll', onPageScroll)
        return () => {
            if(element) element.on('scroll', onPageScroll)
        }
    })

    const pageRef = React.useRef()
    function onPageScroll() {
        if(!pageRef.current)return
        if(loader || productsLast || !products.length || products.length >= adsLoadMaxWidthCount * 2)return

        const pageElement = $(pageRef.current)

        let nthchild = products.length - (18 / 2)
        if(nthchild < 0 || isNaN(nthchild)) nthchild = floatToInt(products.length / 2)
        
        const containerElement = pageElement.find(`.list .adcart:nth-child(${nthchild})`)
        if(isScrolledIntoView(containerElement)) loadProducts()
    }

    return (
        <div className="blockads column transparent recommendads" style={{ marginTop: '64px' }} ref={pageRef}>
            <h6 className="mainTitle simpleTitle">{Language("HOME_TITLES_RECOMENDED_PRODUCTS")}</h6>

            <div className="list">
                {products.map((item, i) => {
                    return (<AdCart key={i} product={item} type="vertical" style={{ width: `calc(100% / ${adsLoadMaxWidth} - 9.6px)`, minWidth: `calc(100% / ${adsLoadMaxWidth} - 9.6px)` }} />)
                })}
                
                {loader ? (
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '144px 0' }}>
                        <CircleLoader color={'var(--tm-color)'} />
                    </div>
                ) : ''}
            </div>
        </div>
    )
}


function AttentionProducts() {
    const [ loader, setLoader ] = React.useState(true)
    const [ products, setProducts ] = React.useState<Array<ProductDTO>>([])

    const [ adsLoadMaxWidth, setAdsLoadMaxWidth ] = React.useState(5)
    const [ adsLoadMaxWidthCount, setAdsLoadMaxWidthCount ] = React.useState(5)
    const [ adsLoadMaxWidthLoader, setAdsLoadMaxWidthLoader ] = React.useState(false)

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
                setAdsLoadMaxWidthCount(3)
            }
            else if(event.target.innerWidth <= 1150) {
                setAdsLoadMaxWidth(4)
                setAdsLoadMaxWidthCount(4)
            }
            else {
                setAdsLoadMaxWidth(5)
                setAdsLoadMaxWidthCount(5)
            }

            if(!adsLoadMaxWidthLoader) setAdsLoadMaxWidthLoader(true)
        }

        onResize({ target: window })
        window.addEventListener('resize', onResize)

        return () => {
            window.removeEventListener('resize', onResize)
        }
    })

    React.useEffect(() => {
        if(adsLoadMaxWidthLoader === true) {
            setLoader(true)
            API({
                url: "/defaultapi/product/list",
                type: 'get',
                data: {
                    attention: 1,
                    pagination: { page: 1, limit: adsLoadMaxWidthCount }
                }
            }).done(result => {
                if(result.statusCode === 200) {
                    setProducts(result.message)
                    setLoader(false)

                    console.log(result.message)
                }
                else notify("(categoryMain, attention) /product/list: " + result.message, { debug: true })
            })
        }
    }, [adsLoadMaxWidthLoader])

    return (
        <div className="blockads column transparent attention" style={{ marginTop: '48px' }}>
            <h6 className="mainTitle simpleTitle">{Language("HOME_TITLES_BEST_PRODUCTS")}</h6>

            <div className="list">
                {products.map((item, i) => {
                    return (<AdCart key={i} product={item} type="vertical" style={{ width: `calc(100% / ${adsLoadMaxWidth} - 10px)`, minWidth: `calc(100% / ${adsLoadMaxWidth} - 10px)` }} />)
                })}
                
                {loader ? new Array(adsLoadMaxWidthCount).fill(0).map((_, i) => {
                    return (<AdCartLoaderDiv type={"vertical"} style={{ width: `calc(100% / ${adsLoadMaxWidth} - 10px)`, minWidth: `calc(100% / ${adsLoadMaxWidth} - 10px)` }} />)
                }) : ''}
            </div>
        </div>
    )
}



























export function RouteCategoryMainLoader() {
    return (
        <div className="route" id="routeCategoryMain">

        </div>
    )
}