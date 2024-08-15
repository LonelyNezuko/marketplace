import React from 'react'
import $ from 'jquery'
import { Link, useLocation, useParams } from 'react-router-dom'

import './index.scss'
import Filters from '@components/filters'
import ProductDTO, { ProductFilters } from '@dto/product.dto'
import RouteNavigateHeader, { RouteNavigateHeaderLinks, RouteNavigateHeaderLoader } from '@components/routeNavigateHeader'
import { Select, SelectListObject } from '@components/select/select'

import { FaSortAmountUp } from "react-icons/fa";
import { FaArrowDownShortWide } from "react-icons/fa6";

import CONFIG from '@config'

import { ImList2 } from "react-icons/im";
import { BsGridFill } from "react-icons/bs";
import AdCart, { AdCartLoaderDiv } from '@components/adcart'
import { API } from '@modules/API'
import { notify } from '@modules/Notify'
import CategoryDTO from '@dto/category.dto'
import { RouteErrorCode, RouteErrorCodeProps } from '@routes/errorcodes'
import { categoryParentJSONParse } from '@modules/functions/categoryParentJSONParse'
import SetRouteTitle from '@modules/SetRouteTitle'
import { Language } from '@modules/Language'
import GeolocationDTO from '@dto/geolocation.dto'
import { isValidJSON } from '@modules/functions/isValidJSON'
import UserInfoDTO from '@dto/userInfo.dto'
import { Alert } from '@components/alert'
import Button from '@components/button'
import CategoryFiltersSearchFind from './filtersSearchFind'
import { parseQuery } from '@modules/functions/parseQuery'
import InputRange from '@components/inputrange'
import Input from '@components/input'
import PhoneTopHide from '@components/phoneTopHide'
import RouteCategoryMain, { RouteCategoryMainLoader } from './categoryMain'
import PhoneHeaderTitle from '@components/phoneHeaderTitle'
import floatToInt from '@modules/functions/floatToInt'
import isScrolledIntoView from '@modules/functions/isScrolledIntoView'
import UserHistory from '@modules/UserHistory'

interface RouteCategoryPropertiesState {
    sorting: string | number,
    listType: 'grid' | 'list'
}

export default function RouteCategory() {
    const params = useParams()
    const location = useLocation()

    const sortingDefaultList = [
        { content: Language("CATEGORY_PAGE_SORT_ELEM_DEFAULT"), key: "default" },
        { content: Language("CATEGORY_PAGE_SORT_ELEM_NEWEST"), key: "newest" },
        { content: (
            <div className="flex aligncenter gap">
                <span>{Language("CATEGORY_PAGE_SORT_ELEM_PRICE_DOWN")}</span>
                <FaArrowDownShortWide />
            </div>
        ), key: "pricedown" },
        { content: (
            <div className="flex aligncenter gap">
                <span>{Language("CATEGORY_PAGE_SORT_ELEM_PRICE_UP")}</span>
                <FaSortAmountUp />
            </div>
        ), key: "priceup" },
        { content: (
            <div className="flex aligncenter gap">
                <span>{Language("CATEGORY_PAGE_SORT_ELEM_SELLER_RATING_UP")}</span>
                <FaSortAmountUp />
            </div>
        ), key: "ownerratingup" },
        { content: (
            <div className="flex aligncenter gap">
                <span>{Language("CATEGORY_PAGE_SORT_ELEM_SELLER_RATING_DOWN")}</span>
                <FaArrowDownShortWide />
            </div>
        ), key: "ownerratingdown" }
    ]   
    
    const [ loaderCategory, setLoaderCategory ] = React.useState(true)
    const [ loaderCity, setLoaderCity ] = React.useState(true)
    const [ loaderOutCity, setLoaderOutCity ] = React.useState(true)

    const [ errorPage, setErrorPage ] = React.useState<RouteErrorCodeProps>({ code: 0, text: '', showbtn: false })

    const [ loaderCategoryParent, setLoaderCategoryParent ] = React.useState(false)
    const [ routeTitleNonChildrens, setRouteTitleNonChildrens ] = React.useState('')

    const [ category, setCategory ] = React.useState<CategoryDTO>(null)

    const [ productsCity, setProductsCity ] = React.useState<Array<ProductDTO>>(null)
    const [ productsCityLast, setProductsCityLast ] = React.useState(false)

    const [ productsOutCity, setProductsOutCity ] = React.useState<Array<ProductDTO>>(null)
    const [ productsOutCityLast, setProductsOutCityLast ] = React.useState(false)

    const [ properties, setProperies ] = React.useState<RouteCategoryPropertiesState>({
        sorting: 'default',
        listType: 'list'
    })
    React.useEffect(() => {
        if(category) {
            loadProductsCity(category)
            loadProductsOutCity(category, productsCity)
        }
    }, [properties.sorting])

    const [ adCartVerticalCustomWidth, setAdCartVerticalCustomWidth ] = React.useState<string>(null)

    const [ filtersToggle, setFiltersToggle ] = React.useState(false)

    const [ searchGeo, setSearchGeo ] = React.useState<GeolocationDTO>(window.userdata.geolocation)
    const [ searchGeoRadius, setSearchGeoRadius ] = React.useState(window.userdata.mapRadius)

    React.useEffect(() => {
        if(!searchGeo)return
        SetRouteTitle()

        if(window.innerWidth <= 650) setProperies({ ...properties, listType: 'list' })

        setErrorPage({ code: 0 })
        let categoryID: string | number

        if(!params.firstid
            && !params.secondid)return setErrorPage({ code: 400 })

        if(/(c\d)/.test(params.firstid)) categoryID = categoryStringIDParser(params.firstid)
        else categoryID = params.firstid
        
        if(params.secondid) {
            if(/(c\d)/.test(params.secondid)) categoryID = categoryStringIDParser(params.secondid)
            else categoryID = params.secondid
        }

        if(!categoryID)return setErrorPage({ code: 400 })
        if(!params.secondid) setLoaderCategoryParent(true)

        setProductsCity(null)
        setProductsOutCity(null)

        setProductsCityLast(false)
        setProductsOutCityLast(false)

        setLoaderCity(true)
        setLoaderOutCity(true)

        setLoaderCategory(true)
        API({
            url: "/defaultapi/category",
            type: 'get',
            data: {
                nameorid: categoryID
            }
        }).done(result => {
            if(result.statusCode === 200) {
                const category: CategoryDTO = categoryParentJSONParse(result.message as CategoryDTO)

                setLoaderCategory(false)
                setLoaderCategoryParent(false)

                setCategory(category)
                if(category.categoryParent) {
                    loadProductsCity(category)
                    UserHistory.add('category-view', category)
                }
            }
            else {
                setErrorPage({ code: result.statusCode })
                notify("(category) /category: " + result.message, { debug: true })
            }
        })
    }, [location])

    React.useEffect(() => {
        if(category) {
            const categoryName = category.categoryNameTranslate[window.language] || category.categoryName

            let searchPlace = ''
            let categoryChildrens = ''

            category.categorySubcategories && category.categorySubcategories.map((item: CategoryDTO) => {
                categoryChildrens += item.categoryNameTranslate[window.language] || item.categoryName + ', '

                if(item.categorySubcategories) {
                    item.categorySubcategories.map((item2: CategoryDTO) => {
                        categoryChildrens += item2.categoryNameTranslate[window.language] || item2.categoryName + ', '
                        
                        if(item2.categorySubcategories) {
                            item2.categorySubcategories.map((item3: CategoryDTO) => {
                                categoryChildrens += item3.categoryNameTranslate[window.language] || item3.categoryName + ', '
                            })
                        }
                    })
                }
            })
            if(categoryChildrens.length) categoryChildrens = categoryChildrens.slice(0, categoryChildrens.length - 2)

            if(searchGeo) {
                if(searchGeo.city) searchPlace = searchGeo.city
                else if(searchGeo.state) searchPlace = searchGeo.state
                else if(searchGeo.country) searchPlace = searchGeo.country
            }

            let title = ''

            if(searchPlace) {
                if(categoryChildrens.length) title = Language("ROUTE_TITLE_CATEGORY", null, null, categoryName, searchPlace, categoryChildrens)
                else title = Language("ROUTE_TITLE_CATEGORY_NON_CHILDRENS", null, null, categoryName, searchPlace)

                setRouteTitleNonChildrens(Language("ROUTE_TITLE_CATEGORY_NON_CHILDRENS", null, null, categoryName, searchPlace))
            }
            else {
                if(categoryChildrens.length) title = Language("ROUTE_TITLE_CATEGORY_NON_PLACE", null, null, categoryName, categoryChildrens)
                else title = Language("ROUTE_TITLE_CATEGORY_NON_CHILDRENS_AND_PLACE", null, null, categoryName)

                setRouteTitleNonChildrens(Language("ROUTE_TITLE_CATEGORY_NON_CHILDRENS_AND_PLACE", null, null, categoryName))
            }
            
            SetRouteTitle(title)
        }
    }, [category])

    React.useEffect(() => {
        function onAdCartResize(event, nonEvent?: boolean) {
            const width = nonEvent ? event : event.target.innerWidth

            if(width > 1500 && window.localStorage.getItem('sidebar_state') === '0') {
                if(width <= 1630) {
                    setAdCartVerticalCustomWidth('calc(100% / 4 - 9.6px)')
                }
                else if(width <= 1550) {
                    setAdCartVerticalCustomWidth('calc(100% / 3 - 9.6px)')
                }
                else setAdCartVerticalCustomWidth(null)
            }
            else setAdCartVerticalCustomWidth(null)
        }
        onAdCartResize($(window), true)

        window.addEventListener('resize', onAdCartResize)
        return () => {
            window.removeEventListener('resize', onAdCartResize)
        }
    }, ['', window.localStorage.getItem('sidebar_state')])

    React.useEffect(() => {
        if(category) {
            loadProductsOutCity(category, productsCity)
        }
    }, [searchGeoRadius])


    function loadProductsCity(category: CategoryDTO) {
        if(!category)return

        setLoaderCity(true)
        
        let filters: ProductFilters = null
        if(location.search) {
            filters = {...CategoryFiltersSearchFind(parseQuery(location.search), category.categoryForms)}
        }

        let city: string = null
        if(searchGeo
            && searchGeo.cityUniqueID) {
            city = searchGeo.cityUniqueID
        }

        let doNotTake: number[]
        if(productsCity) {
            doNotTake = productsCity.map((prod: ProductDTO) => {
                return prod.prodID
            })
        }

        API({
            url: "/defaultapi/product/list/category",
            type: 'get',
            data: {
                paginationTake: 18,
                categoryID: category.categoryID,
                filters,
                cityUniqueID: city,
                orderType: properties.sorting,
                doNotTake
            }
        }).done(result => {
            if(result.statusCode === 200) {
                if(result.message.length < 18) setProductsCityLast(true)

                setProductsCity(old => {
                    if(!old) old = []
                    return [ ...old, ...result.message ]
                })
                setLoaderCity(false)
            }
            else {
                setErrorPage({ code: result.statusCode })
                notify("(category getProductsCity) /product/list/category: " + result.message, { debug: true })
            }
        })
    }
    function loadProductsOutCity(category: CategoryDTO, productsCity: Array<ProductDTO>) {
        if(!category || !productsCityLast)return

        setLoaderOutCity(true)

        let filters: ProductFilters = null
        if(location.search) {
            filters = {...CategoryFiltersSearchFind(parseQuery(location.search), category.categoryForms)}
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

        let doNotTake: number[]
        if(productsCity) {
            doNotTake = [...productsCity.map((prod: ProductDTO) => {
                return prod.prodID
            })]
        }
        if(productsOutCity) {
            doNotTake = [...doNotTake, ...productsOutCity.map((prod: ProductDTO) => {
                return prod.prodID
            })]
        }

        API({
            url: "/defaultapi/product/list/category",
            type: 'get',
            data: {
                paginationTake: 18,
                categoryID: category.categoryID,
                filters,
                radius,
                doNotTake,
                orderType: properties.sorting
            }
        }).done(result => {
            if(result.statusCode === 200) {
                if(result.message.length < 18) setProductsOutCityLast(true)

                setProductsOutCity(old => {
                    if(!old) old = []
                    return [ ...old, ...result.message ]
                })
                setLoaderOutCity(false)
            }
            else {
                setErrorPage({ code: result.statusCode })
                notify("(category getProductsOutCity) /product/list/category: " + result.message, { debug: true })
            }
        })
    }


    function generateNavigateHeaderList(category: CategoryDTO): Array<RouteNavigateHeaderLinks> {
        const list: Array<RouteNavigateHeaderLinks> = [
            { link: '/', name: "Главная" }
        ]

        if(category) {
            const parents: Array<CategoryDTO> = [category]
            if(category.categoryParent) {
                parents.push(category.categoryParent)
                if(category.categoryParent.categoryParent) parents.push(category.categoryParent.categoryParent)
            }

            parents.reverse()
            parents.map((cat: CategoryDTO, i: number) => {
                let link: string = '/' + cat.categoryLink

                if(i > 0) link = '/' + parents[i - 1].categoryLink + link
                list.push({ link, name: cat.categoryName, bold: cat === category })
            })
        }
        else list[0].bold = true

        return list
    }

    const pageRef = React.useRef<HTMLDivElement>(null)
    function onPageScroll() {
        if(!pageRef.current)return
        if(loaderCity || loaderOutCity)return

        const pageElement = $(pageRef.current)
        if(productsCity && !productsCityLast) {
            let nthchild = productsCity.length - (18 / 2)
            if(nthchild < 0 || isNaN(nthchild)) nthchild = floatToInt(productsCity.length / 2)
            
            const containerElement = pageElement.find(`.productsListCity .adcart:nth-child(${nthchild})`)
            if(isScrolledIntoView(containerElement)) {
                loadProductsCity(category)
            }
        }

        if(productsCityLast && productsOutCity && !productsOutCityLast) {
            let nthchild = productsOutCity.length - (18 / 2)
            if(nthchild < 0 || isNaN(nthchild)) nthchild = floatToInt(productsOutCity.length / 2)
            
            const containerElement = pageElement.find(`.productsListOutCity .adcart:nth-child(${nthchild})`)
            if(isScrolledIntoView(containerElement)) {
                loadProductsOutCity(category, productsCity)
            }
        }
    }

    React.useEffect(() => {
        loadProductsOutCity(category, productsCity)
    }, [productsCityLast])


    const [ changeMapRadiusToggle, setChangeMapRadiusToggle ] = React.useState(false)
    const changeMapRadiusTriggerRef = React.useRef([])


    if(errorPage.code !== 0)return (
        <RouteErrorCode code={errorPage.code} text={errorPage.text}
            showbtn={errorPage.showbtn} btnurl={errorPage.btnurl} btnname={errorPage.btnname}
            icon={errorPage.icon} />
    )

    if(loaderCategoryParent)return (<RouteCategoryMainLoader />)
    if(category && !category.categoryParent)return (<RouteCategoryMain category={category} routeTitle={routeTitleNonChildrens.length && routeTitleNonChildrens} />)

    return (
        <div className="route" id="routeCategory" onScroll={onPageScroll} ref={pageRef}>
            <Filters loader={loaderCategory} toggle={filtersToggle} onClose={() => setFiltersToggle(false)} category={category} />
            <div className="body">
                {window.isPhone && !loaderCategory ? (
                    <PhoneHeaderTitle text={category.categoryName + ': ' +  Language("AD")} outBodyPadding={true} />
                ) : ''}

                {loaderCategory && (<RouteNavigateHeaderLoader />)}
                {!loaderCategory && (
                    <RouteNavigateHeader linkList={generateNavigateHeaderList(category)} />
                )}

                {loaderCategory && (<LoaderHeader />)}
                {!loaderCategory && (
                    <header className="header">
                        {!window.isPhone ? (
                            <div className="headerTitle">
                                <h4 className='routetitle'>{category.categoryName}: {Language("AD")}</h4>
                            </div>
                        ) : ''}
                        <div className="properties">
                            <section className="sorting">
                                <Select id={"routeCategorySorting"} _type={properties.sorting} _list={sortingDefaultList}
                                    version={2} classes={'hidebg ulnonwidth'}
                                    onChange={(value: SelectListObject) => {
                                        setProperies({ ...properties, sorting: value.key })
                                    }}
                                />
                            </section>
                            <section className="productViewType">
                                <Button type={"hovertransparent"} icon={(<ImList2 />)} selected={properties.listType === 'list'}
                                    onClick={() => setProperies({ ...properties, listType: 'list' })}
                                />
                                <Button type={"hovertransparent"} icon={(<BsGridFill />)} selected={properties.listType === 'grid'}
                                    onClick={() => setProperies({ ...properties, listType: 'grid' })}
                                />
                            </section>
                            <section className="phoneFiltersBtn" onClick={() => setFiltersToggle(true)}>
                                <Button name={Language("FILTERS")} />
                            </section>
                        </div>
                    </header>
                )}

                {loaderCity && (<LoaderProductsList listType={properties.listType} />)}
                {!loaderCity && (
                    <div className={`productsList productsListCity type-${properties.listType}`}>
                        <div className="productsListTitle">
                            <h4>{Language("CATEGORY_PAGE_BLOCK_CITY_TITLE")}</h4>
                        </div>
                        <div className="list">
                            {productsCity.map((item: ProductDTO, i) => {
                                if(properties.listType === 'grid')return <AdCart key={i} type={"vertical"} product={item} size={"min"} style={{ width: adCartVerticalCustomWidth, minWidth: adCartVerticalCustomWidth }} />
                                return (
                                    <AdCart key={i} type={"horizontal"} product={item} />
                                )
                            })}
                            
                            {!productsCity.length && (
                                <section className="noproducts">
                                    <div className="noproducts-image">
                                        <img src="/assets/other/categoryNotFoundProduct.png" />
                                    </div>
                                    <div className="noproducts-title">
                                        <h6>{Language("CATEGORY_PAGE_BLOCK_CITY_NOTFOUND")}</h6>
                                        <span>{Language("CATEGORY_PAGE_BLOCK_CITY_NOTFOUND_DESC")}</span>
                                    </div>
                                </section>
                            )}
                        </div>
                    </div>
                )}


                {loaderOutCity && (<LoaderProductsList listType={properties.listType} />)}
                {!loaderOutCity && (
                    <div className={`productsList productsListOutCity type-${properties.listType}`}>
                        <div className="productsListTitle">
                            <section className="productsListSection">
                                <h4>{Language("CATEGORY_PAGE_BLOCK_OUTCITY_TITLE")}</h4>
                                <span className="productsListTitleDesc">{Language("CATEGORY_PAGE_BLOCK_OUTCITY_TITLE_DESC", null, null, searchGeoRadius + ' ' + Language("KM"))}</span>
                            </section>
                            <section className="productsListSection">
                                <ChangeMapRadius toggle={changeMapRadiusToggle} searchGeoRadius={searchGeoRadius}
                                    triggerRef={changeMapRadiusTriggerRef}

                                    onClose={() => setChangeMapRadiusToggle(false)}
                                    onSubmit={radius => {
                                        setSearchGeoRadius(radius)
                                    }}
                                />

                                <Button reff={ref => changeMapRadiusTriggerRef.current[0] = ref}
                                    name={Language("CATEGORY_PAGE_BLOCK_OUTCITY_BTN_CHANGE_RADIUS")} type={"border"} onClick={() => setChangeMapRadiusToggle(!changeMapRadiusToggle)} />
                            </section>
                        </div>
                        <div className="list">
                            {productsOutCity.map((item: ProductDTO, i) => {
                                if(properties.listType === 'grid')return <AdCart key={i} type={"vertical"} product={item} size={"min"} style={{ width: adCartVerticalCustomWidth, minWidth: adCartVerticalCustomWidth }} />
                                return (
                                    <AdCart key={i} type={"horizontal"} product={item} />
                                )
                            })}
                            
                            {!productsOutCity.length && (
                                <section className="noproducts">
                                    <div className="noproducts-image">
                                        <img src="/assets/other/categoryNotFoundProduct.png" />
                                    </div>
                                    <div className="noproducts-title">
                                        <h6>{Language("CATEGORY_PAGE_BLOCK_OUTCITY_NOTFOUND")}</h6>
                                        <span>{Language("CATEGORY_PAGE_BLOCK_OUTCITY_NOTFOUND_DESC")}</span>
                                        {/* <span>Попробуйте <button ref={ref => changeMapRadiusTriggerRef.current[1] = ref} onClick={() => setChangeMapRadiusToggle(!changeMapRadiusToggle)}>изменить</button> радиус поиска</span> */}
                                    </div>
                                </section>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}


interface ChangeMapRadiusProps {
    toggle: boolean,
    searchGeoRadius: number,

    triggerRef?: React.MutableRefObject<any>,
    
    onSubmit?: (radius: number) => void,
    onClose?: () => void
}
function ChangeMapRadius({
    toggle,
    searchGeoRadius,

    triggerRef,

    onSubmit,
    onClose
}: ChangeMapRadiusProps) {
    const [ show, setShow ] = React.useState(false)

    const elementRef = React.useRef()
    const [ radius, setRadius ] = React.useState(0)

    React.useEffect(() => {
        function onChangeMapRadiusClose(event) {
            const element = $(elementRef.current)
            
            if(!toggle)return
            if(element.find('.changeMapRadiusInputSection').is(event.target) || element.find('.changeMapRadiusInputSection').has(event.target).length)return

            if(triggerRef) {
                let status: boolean = true

                triggerRef.current.map(item => {
                    if($(item).is(event.target) || $(item).has(event.target).length) status = false
                })
                if(!status)return
            }

            setTimeout(() => {
                if(onClose) onClose()
            }, 80)
        }

        document.addEventListener('click', onChangeMapRadiusClose)
        document.addEventListener('touchstart', onChangeMapRadiusClose)
        document.addEventListener('wheel', onChangeMapRadiusClose)

        return () => {
            document.removeEventListener('click', onChangeMapRadiusClose)
            document.removeEventListener('touchstart', onChangeMapRadiusClose)
            document.removeEventListener('wheel', onChangeMapRadiusClose)
        }
    })
    React.useEffect(() => {
        setRadius(0)

        if(toggle === true) setShow(true)
        else {
            if(window.isPhone) {
                $(elementRef.current).find('.changeMapRadiusWrap').css({ transform: 'translateY(100%)' })
                setTimeout(() => {
                    setShow(false)
                }, 300)
            }
            else setShow(false)
        }
    }, [toggle])
    React.useEffect(() => {
        if(show === true && elementRef) $(elementRef.current).find('.changeMapRadiusWrap').css({ transform: 'none' })
    }, [show, elementRef])

    if(!show)return
    return (
        <div className="changeMapRadius" ref={elementRef}>
            <section className="changeMapRadiusWrap">
                <PhoneTopHide onHide={() => {
                    if(onClose) onClose()
                }} />

                <div className="changeMapRadiusBtns">
                    {CONFIG.mapRadiusList.map((item: number, i) => {
                        return (<Button type={"border"} selected={searchGeoRadius === item} key={i} name={item + ' ' + Language("KM")}
                            onClick={() => {
                                if(onSubmit) onSubmit(item)
                            }}
                        />)
                    })}
                </div>
                <div className="changeMapRadiusInput">
                    <span className="changeMapRadiusInputTitle">{Language("CATEGORY_PAGE_BLOCK_OUTCITY_BTN_CHANGE_RADIUS_DESC")}</span>
                    <section className="changeMapRadiusInputSection">
                        <InputRange value={radius} min={3} max={200} top={true} onInput={value => {
                            setRadius(value[0])
                        }} />
                        <Input type={"number"} value={radius} maxLength={3} onInput={event => {
                            if((event.target as HTMLInputElement).value[0] === '0') 
                                (event.target as HTMLInputElement).value = (event.target as HTMLInputElement).value.slice(1, (event.target as HTMLInputElement).value.length)
                        
                            const value = parseInt((event.target as HTMLInputElement).value)

                            if(isNaN(value))return setRadius(0)
                            if(value > 200)return setRadius(200)
                            if(value < 3 || !(event.target as HTMLInputElement).value.length)return setRadius(3)

                            setRadius(parseInt((event.target as HTMLInputElement).value))
                        }} />
                    </section>
                    {radius > 0 && (
                        <Button name={Language("SUBMIT")} onClick={() => {
                            if(onSubmit) onSubmit(radius)
                        }} />
                    )}
                </div>
            </section>
        </div>
    )
}


function LoaderHeader() {
    return (
        <header className="header">
            <div className="title">
                <div className="_loaderdiv" style={{ width: "280px", height: "32px" }}></div>
            </div>
            <div className="properties">
                <section className="sorting">
                    <div className="_loaderdiv" style={{ width: "220px", height: "46px", borderRadius: "8px" }}></div>
                </section>
                <section className="productViewType">
                    <div className="_loaderdiv" style={{ width: "46px", height: "46px", borderRadius: "8px", marginRight: "4px" }}></div>
                    <div className="_loaderdiv" style={{ width: "46px", height: "46px", borderRadius: "8px" }}></div>
                </section>
            </div>
        </header>
    )
}
function LoaderProductsList({
    listType
}: { listType: string }) {
    return (
        <div className={`productsList type-${listType}`}>
            <div className="productsListTitle">
                <div className="_loaderdiv" style={{ width: "40%", height: "26px" }}></div>
            </div>
            <div className="list">
                {new Array(listType === 'grid' ? 10 : 5).fill(0).map((item, i) => {
                    if(listType === 'grid')return <AdCartLoaderDiv key={i} type={"vertical"} />
                    return (
                        <AdCartLoaderDiv key={i} type={"horizontal"} />
                    )
                })}
            </div>
        </div>
    )
}



function categoryStringIDParser(strid: string): number {
    if(!strid
        || !/(c\d)/.test(strid))return -1
    
    const id: number = parseInt(strid.slice(1))
    return isNaN(id) ? -1 : id
}