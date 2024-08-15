import React from "react";
import { useSwipeable } from 'react-swipeable'
import $ from 'jquery'
import 'jquery.scrollto'

import CONFIG from "@config"

import './index.scss'
import ProductDTO from "@dto/product.dto";
import { API } from "@modules/API";
import { notify } from "@modules/Notify";
import { CircleLoader } from "@components/circleLoader/circleLoader";
import FeedContainer from "@components/feedcontainer";

import { IoImageSharp } from "react-icons/io5";

import Button from "@components/button";
import { Language } from "@modules/Language";
import SetRouteTitle from "@modules/SetRouteTitle";
import GeolocationDTO from "@dto/geolocation.dto";
import UserInfoDTO from "@dto/userInfo.dto";
import { isValidJSON } from "@modules/functions/isValidJSON";
import floatToInt from "@modules/functions/floatToInt";
import isScrolledIntoView from "@modules/functions/isScrolledIntoView";
import { CustomStorage } from "@modules/CustomStorage";
import UserHistory from "@modules/UserHistory";

export default function RouteFeed() {
    const pageRef = React.useRef(null)

    const [ loader, setLoader ] = React.useState(false)

    const [ products, setProducts ] = React.useState<ProductDTO[]>([])
    const [ lastProduct, setLastProduct ] = React.useState(false)

    const [ productsPagination, setProductsPagination ] = React.useState(1)

    const [ searchGeo, setSearchGeo ] = React.useState<GeolocationDTO>(null)
    const [ searchGeoRadius, setSearchGeoRadius ] = React.useState(null)
    React.useEffect(() => {
        if(!searchGeo) {
            setSearchGeo(window.userdata.geolocation)
            setSearchGeoRadius(window.userdata.mapRadius)
        }
    }, [window.userdata.geolocation, ''])

    function loadProducts() {
        if(loader)return

        let loadedProducts: ProductDTO[] = []

        let findStep = 0

        let city: string = null
        if(searchGeo
            && searchGeo.cityUniqueID) {
            city = searchGeo.cityUniqueID
        }

        let radius = null
        if(searchGeo
            && searchGeo.lat
            && searchGeo.lng) {
            radius = {
                latlng: {
                    lat: searchGeo.lat,
                    lng: searchGeo.lng
                },
                radius: searchGeoRadius || 1
            }
        }

        let doNotTake: number[] = []

        products.map(item => doNotTake.push(item.prodID))
        doNotTake = [...new Set(doNotTake)]

        function api(resolve) {
            if(lastProduct) {
                // let slicecount = CONFIG.feedPaginationProductsLength
                // if(doNotTake.length < CONFIG.feedPaginationProductsLength * 2) slicecount = floatToInt(doNotTake.length / 2)

                // doNotTake = doNotTake.splice(doNotTake.length - slicecount, slicecount)
                doNotTake = []
            }

            loadedProducts.map(item => doNotTake.push(item.prodID))
            doNotTake = [...new Set(doNotTake)]

            const customStorage = new CustomStorage()
            const historyData = UserHistory.get

            const data = {
                doNotTake,

                client_geolocation: customStorage.get('userGeolocation'),
                client_productViews: historyData.productViews,
                client_productFavorites: historyData.productFavorites,
                client_categoryViews: historyData.categoryViews,
                client_searchTexts: historyData.searchTexts,
                paginationTake: CONFIG.feedPaginationProductsLength - loadedProducts.length
            }

            API({
                url: "/defaultapi/user/recommendation",
                type: 'get',
                data
            }).done(result => {
                if(result.statusCode === 200) {
                    const list: ProductDTO[] = result.message
                    if(list.length) {
                        loadedProducts = [...loadedProducts, ...list]
                    }

                    resolve(list.length)
                }
                else notify("(feed) /user/recommendation: " + result.message, { debug: true })
            })
        }
        function showLoaded(last: boolean = false) {
            setProducts(old => {
                return [...old, ...loadedProducts]
            })
            setLoader(false)

            setLastProduct(last)
        }

        setLoader(true)

        // поиск по горду
        new Promise(api)
            .then((count: number) => {
                if(loadedProducts.length !== CONFIG.feedPaginationProductsLength) {
                    findStep = 1

                    // поиск по радиусу
                    new Promise(api)
                        .then((count: number) => {
                            if(loadedProducts.length !== CONFIG.feedPaginationProductsLength) {
                                findStep = 2

                                // остальной поиск
                                new Promise(api)
                                    .then((count: number) => {
                                        showLoaded(!count && true)
                                    })
                            }
                            else showLoaded()
                        })
                }
                else showLoaded()
            })
    }

    React.useMemo(() => {
        SetRouteTitle(Language("ROUTE_TITLE_FEED"))
        // loadProducts()
    }, [])

    React.useEffect(() => {
        if(searchGeo) loadProducts()
    }, [searchGeo])
    React.useEffect(() => {
        // if(products.length > CONFIG.feedMaxProductsLengthInPage + 20) {
        //     setProducts(old => {
        //         old = old.splice(products.length - CONFIG.feedPaginationProductsLength, CONFIG.feedPaginationProductsLength)
        //         return [...old]
        //     })
        // }
    }, [products])
    
    function onPageScroll() {
        if(!pageRef || !products.length || products.length < 4 || loader || products.length >= CONFIG.feedPaginationProductsLength * 10)return

        let nthchild = products.length - (CONFIG.feedPaginationProductsLength / 2)
        if(nthchild < 0 || isNaN(nthchild)) nthchild = floatToInt(products.length / 2)

        const pageElement = $(pageRef.current)
        const containerElement = pageElement.find(`.feedcontainer:nth-child(${nthchild})`)

        if(isScrolledIntoView(containerElement)) {
            if(!lastProduct) setProductsPagination(old => old + 1)
            else setProductsPagination(1)

            loadProducts()
        }
    }

    return (
        <div className="route" id="routeFeed" onScroll={onPageScroll} ref={pageRef}>
            <div className="routeFeedWrapper">
                {products && products.map((product: ProductDTO, i: number) => {
                    return (<FeedContainer product={product} key={i} />)
                })}

                {loader ? (
                    <div style={{ width: '100%', padding: '144px 0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <CircleLoader color={"var(--tm-color)"} type={"big"} />
                    </div>
                ) : ''}
            </div>
        </div>
    )
}