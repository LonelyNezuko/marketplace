import React from 'react'
import { Link } from 'react-router-dom'
import $ from 'jquery'

import AdCart, { AdCartLoaderDiv } from '@components/adcart'
import { CircleLoader } from '@components/circleLoader/circleLoader'
import _MarketingBlock from '@components/_marketingblock'

import { Language } from '@modules/Language'
import { API } from '@modules/API'
import { notify } from '@modules/Notify'

import './index.scss'
import CategoryDTO from '@dto/category.dto'
import ProductDTO from '@dto/product.dto'

export default function RouteHome() {
    const [ loaderPopularCategories, setLoaderPopularCategories ] = React.useState(true)
    const [ popularCategories, setPopularCategories ] = React.useState<Array<CategoryDTO>>([])

    React.useMemo(() => {
        setLoaderPopularCategories(true)

        // popular categories
        API({
            url: "/defaultapi/category/popular",
            type: 'get'
        }).done(result => {
            if(result.statusCode === 200) {
                setPopularCategories(result.message)
                setLoaderPopularCategories(false)
            }
            else notify("(home, popular categories) /category/popular: " + result.message, { debug: true })
        })
    }, [])

    return (
        <div className="route" id="home">
            <section className="block">
                <div className="hightop">
                    <div className="popularcategories">
                        <h1 className="blocktitle">{Language("HOME_TITLES_POPULAR_CATEGORIES")}</h1>
                        <div className="list">
                            {loaderPopularCategories ? (
                                <section style={{display: 'flex', alignItems: "center", justifyContent: "center", padding: '64px 0'}}>
                                    <CircleLoader type={"big"} color={"var(--tm-color)"} />
                                </section>
                            ) : ''}

                            {!loaderPopularCategories && popularCategories.map((item, i) => {
                                return (
                                    <Link key={i} className="elem" to={`/${item.categoryLink}`}>
                                        <h1>{item.categoryNameTranslate[window.language] || item.categoryName}</h1>
                                        <span>{item.productsCount.toLocaleString()} {Language('ADS')}</span>
                                    </Link>
                                )
                            })}
                        </div>
                    </div>

                    <AttentionProducts />
                </div>
            </section>

            <_MarketingBlock id="home1" type={"banner"} size={{width: "100%", height: "150px"}} style={"horizontal"} />

            <section className="block">
                <NewestProducts />
                <RecommendedProducts />
            </section>
        </div>
    )
}


function RecommendedProducts() {
    const [ loader, setLoader ] = React.useState(true)
    const [ products, setProducts ] = React.useState<Array<ProductDTO>>([])

    React.useMemo(() => {
        // newest products
        setLoader(true)
        // API({
        //     url: "/defaultapi/product/list",
        //     type: 'get',
        //     data: {
        //         pagination: { page: 1, limit: 6 },
        //         order: { prodCreateAt: 'desc' }
        //     }
        // }).done(result => {
        //     if(result.statusCode === 200) {
        //         setNewestProducts(result.message)
        //         setLoaderNewestProducts(false)
        //     }
        //     else notify(result.message)
        // })
    }, [])

    // добавить сюда прогруз по прокрутке до 5 раз по 20 штук

    return (
        <div className="blockads column transparent recommendads">
            <h1 className="blocktitle">{Language("HOME_TITLES_RECOMENDED_PRODUCTS")}</h1>
            <div className="list">
                {products.map((item, i) => {
                    return (<AdCart key={i} product={item} type="horizontal" />)
                })}
                
                {loader ? (
                    <section style={{display: 'flex', width: '100%', alignItems: "center", justifyContent: "center", marginTop: products.length ? '28px' : '0'}}>
                        <CircleLoader type={"big"} color={"var(--tm-color)"} />
                    </section>
                ) : ''}
            </div>
        </div>
    )
}
function NewestProducts() {
    const [ loaderNewestProducts, setLoaderNewestProducts ] = React.useState(true)
    const [ newestProducts, setNewestProducts ] = React.useState<Array<ProductDTO>>([])

    React.useMemo(() => {
        // newest products
        setLoaderNewestProducts(true)
        API({
            url: "/defaultapi/product/list",
            type: 'get',
            data: {
                pagination: { page: 1, limit: 6 },
                order: { prodCreateAt: 'desc' }
            }
        }).done(result => {
            if(result.statusCode === 200) {
                setNewestProducts(result.message)
                setLoaderNewestProducts(false)
            }
            else notify("(home, newest) /product/list: " + result.message, { debug: true })
        })
    }, [])

    return (
        <div className="blockads horizontal newestads">
            <h1 className="blocktitle">{Language("HOME_TITLES_NEWEST_PRODUCTS")}</h1>
            <div className="list">
                {loaderNewestProducts ? (
                    <section style={{display: 'flex', width: '100%', alignItems: "center", justifyContent: "center", padding: '64px 0'}}>
                        <CircleLoader type={"big"} color={"var(--tm-color)"} />
                    </section>
                ) : ''}

                {!loaderNewestProducts && newestProducts.map((item, i) => {
                    return (<AdCart key={i} product={item} type={"vertical"} />)
                })}
            </div>
        </div>
    )
}
function AttentionProducts() {
    const [ loaderAttentionProducts, setLoaderAttentionProducts ] = React.useState(true)
    const [ attentionProducts, setAttentionProducts ] = React.useState([])

    React.useMemo(() => {
        // attention products
        setLoaderAttentionProducts(true)
        API({
            url: "/defaultapi/product/list",
            type: 'get',
            data: {
                attention: 1,
                pagination: { page: 1, limit: 4 }
            }
        }).done(result => {
            if(result.statusCode === 200) {
                setAttentionProducts(result.message)
                setLoaderAttentionProducts(false)
            }
            else notify("(home, attention) /product/list: " + result.message, { debug: true })
        })
    }, [])

    if(loaderAttentionProducts)return (
        <div className="blockads column bestads">
            <h1 className="blocktitle">{Language("HOME_TITLES_BEST_PRODUCTS")}</h1>
            <div className="list">
                <AdCartLoaderDiv type={"vertical"} />
                <AdCartLoaderDiv type={"vertical"} />
                <AdCartLoaderDiv type={"vertical"} />
                <AdCartLoaderDiv type={"vertical"} />
            </div>
        </div>
    )
    return (
        <div className="blockads column bestads">
            <h1 className="blocktitle">{Language("HOME_TITLES_BEST_PRODUCTS")}</h1>
            <div className="list">
                {attentionProducts.map((item, i) => {
                    return (<AdCart key={i} product={item} type={"vertical"} />)
                })}

                {!attentionProducts.length ? (
                    <span className="notfond">Ничего нет</span>
                ) : ''}
            </div>
        </div>
    )
}