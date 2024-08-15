import React from 'react'
import $ from 'jquery'
import Cookies from 'universal-cookie'

import _MarketingBlock from '@components/_marketingblock'
import Input from '@components/input'
import { Select } from '@components/select/select'

import CONFIG from '@config'

import './index.scss'

import { TiArrowUpThick } from "react-icons/ti";
import { IoImageSharp } from "react-icons/io5";

import { SiSubtitleedit } from "react-icons/si";
import { MdDescription } from "react-icons/md";
import { IoPricetag } from "react-icons/io5";
import { renderCurrencyIcon } from '@functions/renderCurrencyIcon';
import { RouteErrorCode, RouteErrorCodeProps } from '../errorcodes'
import UploadDropFile from '@components/uploadDropFile'
import { API } from '@modules/API'
import { notify } from '@modules/Notify'
import { Language } from '@modules/Language'
import InputRange from '@components/inputrange'
import PreviewFiles, { PreviewFilesFile } from '@components/previewFiles'
import { Alert } from '@components/alert'
import MapLeaflet from '@components/mapLeaflet'
import Address from '@components/address'
import { isValidJSON } from '@functions/isValidJSON'
import { LatLng } from 'leaflet'
import ModalLoader from '@components/modals/loader'
import { Navigate } from 'react-router-dom'
import CategoryDTO, { CategoryForm } from '@dto/category.dto'
import UserInfoDTO from '@dto/userInfo.dto'
import GeolocationDTO from '@dto/geolocation.dto'
import SetRouteTitle from '@modules/SetRouteTitle'
import Button from '@components/button'
import GetGeolocation from '@modules/GetGeolocation'
import CircleLoaderFullSize from '@components/circleLoader/fullsize'
import ErrorInnerBlock from '@components/errorInnerBlock'
import { useSwipeable } from 'react-swipeable'
import PhoneHeaderTitle from '@components/phoneHeaderTitle'
import EmailVerify from '@components/emailVerify'
import store from '@src/store'


interface RoutePlaceadImage extends PreviewFilesFile {
    _productBackground?: number
}
interface AdData {
    images: Array<RoutePlaceadImage>,
    name: string,
    category: CategoryDTO,
    description: string,
    price: string | number,
    priceCurrency: string
}
interface PropsChildren {
    adData: AdData,
    setAdData: React.Dispatch<React.SetStateAction<AdData>>,

    setErrorcode?: React.Dispatch<React.SetStateAction<RouteErrorCodeProps>>
}

export default function RoutePlacead() {
    const [ navigate, setNavigate ] = React.useState(null)
    React.useEffect(() => { if(navigate !== null) setNavigate(null) }, [navigate])
    
    const [ errorcode, setErrorcode ] = React.useState<RouteErrorCodeProps>({
        code: 0,
        text: ''
    })

    const [ loader, setLoader ] = React.useState(false)
    const [ loaderText, setLoaderText ] = React.useState<string>(null)

    const [ adData, setAdData ] = React.useState<AdData>({
        images: [],
        name: '',
        category: null,
        description: '',
        price: '',
        priceCurrency: window.userdata.currency
    })
    const [ categoryFormsValues, setCategoryFormsValues ] = React.useState<Record<string, any>>(null)

    const [ mapLocation, setMapLocation ] = React.useState<GeolocationDTO>()
    const [ mapOnlyCity, setMapOnlyCity ] = React.useState(false)

    const [ btnDisabled, setBtnDisabled ] = React.useState(false)
    
    const [ emailVerify, setEmailVerify ] = React.useState(store.getState().emailVerifyReducer || null)
    React.useEffect(() => {
        const storeUnsubscribe = store.subscribe(() => {
            const emailVerifyState = store.getState().emailVerifyReducer
            if(emailVerifyState) setEmailVerify(emailVerifyState)
        })

        return () => {
            storeUnsubscribe()
        }
    }, [])

    function onSubmit() {
        if(btnDisabled || loader)return

        const formsValues = { ...categoryFormsValues }
        delete formsValues.__categoryid__

        function loadImages(resolve, reject) {
            setLoaderText(Language("PLACEAD_LOADER_TEXT_1"))
            let formData = new FormData()

            const images = [ ...adData.images ]
            images.map(item => {
                if(item._productBackground) item._productBackground = 1
                else item._productBackground = 0
            })

            images.sort((a, b) => b._productBackground - a._productBackground)
            
            images.map(image => {
                formData.append('files[]', image, image.name)
            })
            formData.append('access', 'default')
    
            API({
                url: '/defaultapi/service/storage/upload',
                type: 'post',
                data: formData,
                contentType: false,
                processData: false
            }).done(result => {
                if(result.statusCode === 200) {
                    const images = []
                    result.message.map(item => {
                        images.push(item.link)
                    })

                    resolve(images)
                }
                else {
                    notify('(placead) /service/storage/upload: ' + result.message, { debug: true })
                    reject()
                }
            })
        }

        setLoader(true)
        setLoaderText(Language("PLACEAD_LOADER_TEXT_2"))

        new Promise(loadImages)
            .then(images => {
                setLoaderText(Language("PLACEAD_LOADER_TEXT_3"))

                if(mapOnlyCity) {
                    delete mapLocation.street
                    delete mapLocation.housenumber
                }

                API({
                    url: '/defaultapi/product/create',
                    type: 'post',
                    data: {
                        categoryID: adData.category.categoryID,
                        forms: formsValues,
                        images: JSON.stringify(images),
                        name: adData.name,
                        description: adData.description,
                        price: adData.price,
                        priceCurrency: adData.priceCurrency,
                        location: mapLocation,
                        onlycity: mapOnlyCity === true ? 1 : 0
                    }
                }).done(result => {
                    setLoader(false)
                    if(result.statusCode === 200) {
                        setNavigate('/ad/' + result.message)
                    }
                    else {
                        setErrorcode({ code: result.statusCode })
                        notify("(placead) /product/create: " + result.message, { debug: true })
                    }
                })
            })
            .catch(() => {
                setLoader(false)
                setLoaderText("")

                Alert(Language("PLACEAD_ERROR_7"))
            })
    }

    React.useEffect(() => {
        if(!emailVerify && window.userdata.uid !== -1) setBtnDisabled(true)
        else {
            let status: boolean = false

            if(!adData.images.length) status = true
            if(!adData.category) status = true
            if(!adData.category || !adData.category.categoryParent) status = true

            if(!adData.name || !adData.name.length
                || adData.name.length > 50) status = true
            if(!adData.description || !adData.description.length
                || adData.description.length > 2000) status = true

            if(adData.category) {
                const categoryForms = adData.category.categoryForms
                if(categoryForms && categoryForms.length && categoryFormsValues) {
                    let formError
                    categoryForms.map(form => {
                        if(form.important) {
                            if(form.type === 'input') {
                                if(form.params.type === 'number'
                                    && (isNaN(categoryFormsValues[form.key])
                                        || categoryFormsValues[form.key] < form.params.minLength
                                        || categoryFormsValues[form.key] > form.params.maxLength)) formError = 'null'
                                
                                if(form.params.type !== 'number'
                                    && (!categoryFormsValues[form.key]
                                        || !categoryFormsValues[form.key].length)) formError = 'null'
                            }
                            else if(form.type === 'select'
                                && (!categoryFormsValues[form.key]
                                    || !categoryFormsValues[form.key].length)) formError = 'null'
                        }
                    })

                    if(formError === 'null') status = true
                }
            }

            if(!mapLocation || !mapLocation.lat || !mapLocation.lng
                || isNaN(mapLocation.lat) || isNaN(mapLocation.lng)) status = true

            setBtnDisabled(status)
        }
    }, [emailVerify, adData, mapLocation])

    React.useMemo(() => {
        if(window.userdata.banned) setErrorcode({ code: 423 })
    }, [])

    if(errorcode.code !== 0)return (<RouteErrorCode code={errorcode.code} text={errorcode.text} />)

    if(window.isPhone)return (
        <PhoneVersion adData={adData} setAdData={setAdData}
            loader={loader} loaderText={loaderText}
            navigate={navigate}
            categoryFormsValues={categoryFormsValues} setCategoryFormsValues={setCategoryFormsValues}
            mapLocation={mapLocation} mapOnlyCity={mapOnlyCity}
            setMapLocation={setMapLocation} setMapOnlyCity={setMapOnlyCity}
            btnDisabled={btnDisabled}
            emailVerify={emailVerify} setEmailVerify={setEmailVerify}
            onSubmit={onSubmit}
            setErrorcode={setErrorcode}
        />
    )
    return (
        <div className="route" id="placead">
            {loader && <ModalLoader text={loaderText} />}

            <div className="placeadbody">
                <EmailVerify type={"placead"} />

                <div className="headertitle">
                    <h1 className="title">{Language("PLACEAD_TITLE")}</h1>
                </div>
                
                <BlockPhoto adData={adData} setAdData={setAdData} />
                <section className="block maininfo">
                    <FormProductName adData={adData} setAdData={setAdData} />
                    <BlockCategories adData={adData} setAdData={setAdData}
                        categoryFormsValues={categoryFormsValues} setCategoryFormsValues={setCategoryFormsValues}
                        setErrorcode={setErrorcode}
                    />
                    <FormProductDescription adData={adData} setAdData={setAdData} />
                </section>

                <BlockPrice adData={adData} setAdData={setAdData} />
                <BlockLocation adData={adData} setAdData={setAdData} mapLocation={mapLocation} mapOnlyCity={mapOnlyCity}
                    setMapLocation={setMapLocation}
                    setMapOnlyCity={setMapOnlyCity}
                />

                <section className="block actions dash">
                    <div className="form">
                        <Button disabled={btnDisabled} name={Language("PLACEAD_BTN_SUBMIT")} type={"fill"} size={"big"}
                            onClick={() => {
                                onSubmit()
                            }}
                        />
                    </div>
                </section>
            </div>

            <_MarketingBlock size={{width: "330px", height: "570px"}} id={"placead1"} type={"banner"} style={"vertical"} />

            {navigate ? (<Navigate to={navigate} />) : ''}
        </div>
    )
}


interface PhoneVersionProps extends PropsChildren {
    loader: boolean,
    loaderText: string,

    navigate: any,

    categoryFormsValues: Record<string, any>,
    setCategoryFormsValues: React.Dispatch<React.SetStateAction<Record<string, any>>>,

    mapLocation: GeolocationDTO,
    mapOnlyCity: boolean,

    btnDisabled: boolean,

    emailVerify: boolean,
    setEmailVerify: React.Dispatch<React.SetStateAction<boolean>>,

    setMapLocation: React.Dispatch<React.SetStateAction<GeolocationDTO>>,
    setMapOnlyCity: React.Dispatch<React.SetStateAction<boolean>>,

    onSubmit: () => void
}
function PhoneVersion({
    adData,
    setAdData,

    loader,
    loaderText,

    navigate,

    mapLocation,
    mapOnlyCity,

    btnDisabled,

    categoryFormsValues,
    setCategoryFormsValues,

    setMapLocation,
    setMapOnlyCity,

    emailVerify,
    setEmailVerify,
    
    onSubmit,
    setErrorcode
}: PhoneVersionProps) {
    const [ phoneStep, setPhoneStep ] = React.useState(0)
    const swipeSteps = useSwipeable({
        onSwiped: event => {
            const target = $(event.event.target)
            if(target.is('.nonswiped') || $('.nonswiped').has(target as any).length)return

            if(event.dir === 'Left') {
                setPhoneStep(old => {
                    if(old < 3) old += 1
                    return old
                })
            }
            else if(event.dir === 'Right') {
                setPhoneStep(old => {
                    if(old > 0) old -= 1
                    return old
                })
            }
        },
        delta: 15
    })

    return (
        <div className="route" id="placead" {...swipeSteps}>
            {loader && <ModalLoader text={loaderText} />}

            <div className="placeadbody">
                <PhoneHeaderTitle text={Language("PLACEAD_TITLE")} />

                <EmailVerify type={"placead"} />

                <div className="placeadbodywrapper" style={{ height: `calc(100% - 56px - ${(!emailVerify && window.userdata.uid !== -1) ? '167px - 24px' : '0px'})` }}>
                    <div className="stepList" style={{ transform: `translateX(-${phoneStep * 100}%)` }}>
                        <section className="stepSection stepSection-photo"> {/* 0 */}
                            <div className="stepBody">
                                <BlockPhoto adData={adData} setAdData={setAdData} />
                            </div>
                            <div className="stepBottom">
                                <Button type={"fill"} size={"big"} name={"Далее"} onClick={() => setPhoneStep(1)} />
                            </div>
                        </section>

                        <section className="stepSection stepSection-maininfo"> {/* 1 */}
                            <div className="stepBody">
                                <div className="block">
                                    <div className="title">Основная информация</div>

                                    <FormProductName adData={adData} setAdData={setAdData} />
                                    <FormProductDescription adData={adData} setAdData={setAdData} />
                                    <BlockPrice adData={adData} setAdData={setAdData} />
                                </div>
                            </div>
                            <div className="stepBottom">
                                <Button type={"fill"} size={"big"} name={"Далее"} onClick={() => setPhoneStep(2)} />
                                <Button classname={"back"} type={"border"} size={"medium"} name={"Назад"} onClick={() => setPhoneStep(0)} />
                            </div>
                        </section>

                        <section className="stepSection stepSection-category"> {/* 2 */}
                            <div className="stepBody">
                                <section className="block maininfo">
                                    <div className="title">{Language("PLACEAD_BLOCK_CATEGORY_TITLE")}</div>

                                    <BlockCategories adData={adData} setAdData={setAdData}
                                        categoryFormsValues={categoryFormsValues} setCategoryFormsValues={setCategoryFormsValues}
                                        setErrorcode={setErrorcode}
                                    />
                                </section>
                            </div>
                            <div className="stepBottom">
                                <Button type={"fill"} size={"big"} name={"Далее"} onClick={() => setPhoneStep(3)} />
                                <Button classname={"back"} type={"border"} size={"medium"} name={"Назад"} onClick={() => setPhoneStep(1)} />
                            </div>
                        </section>

                        <section className="stepSection stepSection-map"> {/* 3 */}
                            <div className="stepBody">
                                <BlockLocation adData={adData} setAdData={setAdData} mapLocation={mapLocation} mapOnlyCity={mapOnlyCity}
                                    setMapLocation={setMapLocation}
                                    setMapOnlyCity={setMapOnlyCity}
                                />
                            </div>
                            <div className="stepBottom">
                                {/* <Button type={"fill"} size={"big"} name={"Далее"} onClick={() => setPhoneStep(4)} /> */}
                                
                                <Button disabled={btnDisabled} type={"fill"} size={"big"} name={Language("PLACEAD_BTN_SUBMIT")} onClick={() => onSubmit()} />
                                <Button classname={"back"} type={"border"} size={"medium"} name={"Назад"} onClick={() => setPhoneStep(2)} />
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            {navigate ? (<Navigate to={navigate} />) : ''}
        </div>
    )
}


interface BlockCategoriesProps extends PropsChildren {
    categoryFormsValues: Record<string, any>,
    setCategoryFormsValues: React.Dispatch<React.SetStateAction<Record<string, any>>>
}
function BlockCategories({
    adData,
    setAdData,

    setErrorcode,

    categoryFormsValues,
    setCategoryFormsValues
}: BlockCategoriesProps) {
    const [ loaderCategories, setLoaderCategories ] = React.useState(true)

    const [ categories, setCategories ] = React.useState<Array<CategoryDTO>>(null)
    const [ categoriesSelect, setCategoriesSelect ] = React.useState([ -1, -1, -1 ])
    const [ categoryChoice, setCategoryChoice ] = React.useState<CategoryDTO>(null)

    React.useMemo(() => {
        if(!window.jwtTokenExists)return setErrorcode({ code: 401 })

        setLoaderCategories(true)
        API({
            url: '/defaultapi/category/all',
            type: 'get'
        }).done(result => {
            if(result.statusCode === 200) {
                setCategories(result.message)
                setLoaderCategories(false)
            }
            else {
                notify("(placead) /category/all: " + result.message, { debug: true })
            }
        })
    }, [])
    React.useEffect(() => {
        if(categoryChoice && categoryChoice.categoryID && categoryChoice.categoryForms.length) {
            let tmp = {}
            const forms = categoryChoice.categoryForms

            for(let key in forms) {
                const type = forms[key].type
                const keyname = forms[key].key

                let value

                if(type === 'input') {
                    if(forms[key].params.type === 'text' || forms[key].params.type === 'textarea') value = ''
                    else if(forms[key].params.type === 'number' && forms[key].params.minLength) value = forms[key].params.minLength
                }
                else if(type === 'select') value = -1
                else if(type === 'range') value = forms[key].params.min
                else if(type === 'rangemulti') value = [ forms[key].params.min, forms[key].params.max ]
                
                tmp[keyname] = value
            }

            tmp[`__categoryid__`] = categoryChoice.categoryID
            setCategoryFormsValues(tmp)
        }
        else setCategoryFormsValues(null)
    }, [categoryChoice])

    return (
        <>
            <div className="categorieschoice">
                {!window.isPhone && (<div className="subtitle">{Language("PLACEAD_BLOCK_CATEGORY_TITLE")} *</div>)}
                <div className="categorieschoicemenu">
                    {loaderCategories && (
                        <>
                            <CategoriesLoader />
                            <CategoriesLoader />
                            <CategoriesLoader />
                        </>
                    )}

                    {!loaderCategories && categories ? (
                        <div className="categorieschoicemenu-wrapper">
                            {categories.map((item, i) => {
                                return (<CategoryDiv category={item} key={i} id={i} selectkey={0}
                                    categoriesSelect={categoriesSelect} setCategoriesSelect={setCategoriesSelect}
                                    setCategoryChoice={setCategoryChoice} setAdData={setAdData}
                                />)
                            })}
                        </div>
                    ) : ''}

                    {!loaderCategories && categories && categoriesSelect[0] !== -1
                        && categories[categoriesSelect[0]].categorySubcategories.length ? (
                        <div className="categorieschoicemenu-wrapper">
                            {categories[categoriesSelect[0]].categorySubcategories.map((item, i) => {
                                return (<CategoryDiv category={item} key={i} id={i} selectkey={1}
                                    categoriesSelect={categoriesSelect} setCategoriesSelect={setCategoriesSelect}
                                    setCategoryChoice={setCategoryChoice} setAdData={setAdData}
                                />) 
                            })}
                        </div>
                    ) : ''}

                    {!loaderCategories && categories && categoriesSelect[0] !== -1 && categoriesSelect[1] !== -1
                        && categories[categoriesSelect[0]].categorySubcategories[categoriesSelect[1]].categorySubcategories.length ? (
                        <div className="categorieschoicemenu-wrapper">
                            {categories[categoriesSelect[0]].categorySubcategories[categoriesSelect[1]].categorySubcategories.map((item, i) => {
                                return (<CategoryDiv category={item} key={i} id={i} selectkey={2}
                                    categoriesSelect={categoriesSelect} setCategoriesSelect={setCategoriesSelect}
                                    setCategoryChoice={setCategoryChoice} setAdData={setAdData}
                                />)
                            })}
                        </div>
                    ) : ''}
                </div>
            </div>

            {categoryChoice
                && categoryChoice.categoryID 
                && categoryFormsValues
                && categoryChoice.categoryID == categoryFormsValues['__categoryid__']
                && categoryChoice.categoryForms.length ? (
                <div className="productforms">
                    <div className="form">
                        {categoryChoice.categoryForms.map((item, i) => {
                            return (
                                <div className={`item ${item.type === 'input' && item.params.type} ${(item.type === 'range' || item.type === 'rangemulti') && 'nonswiped'}`} key={i}>
                                    <CategoryFormsListTypes formdata={item} categoryFormsValues={categoryFormsValues} setCategoryFormsValues={setCategoryFormsValues} />
                                </div>
                            )
                        })}
                    </div>
                </div>     
            ) : ''}
        </>
    )
}

function FormProductDescription({
    adData,
    setAdData
}: PropsChildren) {
    return (
        <div className="form" style={{ marginTop: window.isPhone ? "24px" : "42px", width: '100%' }}>
            <Input style={{ width: '100%' }} id="placeadProductDescTextarea" title={Language("PLACEAD_BLOCK_DESCRIPTION_TITLE") + " *"} type="textarea" icon={(<MdDescription />)}
                data={{hint: (
                    <span style={{ color: adData.description.length > 2000 ? 'var(--tm-color-red)' : null }}>
                        {Language("PLACEAD_BLOCK_DESCRIPTION_HINT", null, null, adData.description.length)}
                    </span>
                )}}
                onInput={event => setAdData({ ...adData, description: event.target.value })}
            />
        </div>
    )
}
function FormProductName({
    adData,
    setAdData
}: PropsChildren) {
    return (
        <div className="form">
            <Input id="placeadProductTitleInput" title={Language("PLACEAD_BLOCK_MAININFO_TITLE") + " *"} type="text" icon={(<SiSubtitleedit />)}
                data={{hint: (
                    <span style={{ color: adData.name.length > 50 ? 'var(--tm-color-red)' : null }}>
                        {Language("PLACEAD_BLOCK_MAININFO_HINT", null, null, adData.name.length)}
                    </span>
                )}}
                value={adData.name} onInput={event => setAdData({ ...adData, name: (event.target as HTMLInputElement).value })}
            />
        </div>
    )
}

let mapLoaderTimer = null
let mapUpdateTimer = null

interface BlockLocationProps extends PropsChildren {
    mapLocation: GeolocationDTO,
    mapOnlyCity: boolean,

    setMapLocation: React.Dispatch<React.SetStateAction<GeolocationDTO>>,
    setMapOnlyCity: React.Dispatch<React.SetStateAction<boolean>>
}
function BlockLocation({
    adData,
    setAdData,

    mapLocation,
    mapOnlyCity,

    setMapLocation,
    setMapOnlyCity
}: BlockLocationProps) {
    const [ mapFindMe, setMapFindMe ] = React.useState(false)

    const [ error, setError ] = React.useState(null)
    const [ warning, setWarning ] = React.useState(false)

    React.useEffect(() => {
        if(!error) setWarning(false)
    }, [error])

    const [ loader, setLoader ] = React.useState(false)
    React.useEffect(() => {
        if(loader === true) {
            if(mapLoaderTimer) clearTimeout(mapLoaderTimer)
            mapLoaderTimer = setTimeout(() => {
                setError(Language("MAP_MODAL_WARNING_1"))
                setWarning(true)
            }, 4000)
        }
        else {
            clearTimeout(mapLoaderTimer)
            setError(null)
        }
    }, [loader])

    React.useEffect(() => {
        if(mapFindMe === true) setMapFindMe(false)
    }, [mapFindMe])

    React.useEffect(() => {
        setMapLocation(window.userdata.geolocation)
    }, [window.userdata.geolocation])

    React.useEffect(() => {
        if(!mapLocation) SetRouteTitle(Language("ROUTE_TITLE_PLACEAD_NON_PLACE"))
        else {
            if(mapLocation.city) SetRouteTitle(Language("ROUTE_TITLE_PLACEAD", null, null, mapLocation.city))
            else if(mapLocation.state) SetRouteTitle(Language("ROUTE_TITLE_PLACEAD", null, null, mapLocation.state))
            else if(mapLocation.country) SetRouteTitle(Language("ROUTE_TITLE_PLACEAD", null, null, mapLocation.country))
            else SetRouteTitle(Language("ROUTE_TITLE_PLACEAD_NON_PLACE"))
        }
    }, ['', mapLocation])

    React.useEffect(() => {
        if(mapLocation) {
            if(!mapLocation.country
                || !mapLocation.city
                || !mapLocation.cityUniqueID) setError(Language("MAP_MODAL_ERROR_1"))
        }
    }, [mapLocation])

    return (
        <section className={`block location ${!window.isPhone && 'dash'}`}>
            <div className="title">{Language("PLACEAD_BLOCK_LOCATION_TITLE")}</div>

            <div className="locationname">
                <h1>{Address(mapLocation, mapOnlyCity)}</h1>
                <section>
                    <Button selected={mapOnlyCity} name={Language("PLACEAD_BLOCK_LOCATION_BTN_ONLYCITY")} type={"border"}
                        onClick={() => setMapOnlyCity(!mapOnlyCity)}
                    />
                    <Button name={Language("PLACEAD_BLOCK_LOCATION_BTN_FINDME")} type={"border"}
                        onClick={() => {
                            if(loader)return
                            setMapFindMe(true)
                        }}
                    />
                </section>
            </div>

            {(mapLocation && mapLocation.lat && mapLocation.lng) ? (
                <div className={`mapblock nonswiped`}>
                    <MapLeaflet autoGeo={mapFindMe} position={new LatLng(mapLocation.lat, mapLocation.lng)} onChange={position => {
                        setError(null)

                        if(mapUpdateTimer) clearTimeout(mapUpdateTimer)
                        mapUpdateTimer = setTimeout(async () => {
                            setLoader(true)

                            const data: GeolocationDTO = await GetGeolocation(position)

                            setMapLocation(data)
                            setLoader(false)
                        }, 300)
                    }} />

                    {loader && (<CircleLoaderFullSize />)}
                    <ErrorInnerBlock toggle={!!error} text={error} warning={warning} />
                </div>
            ) : ''}
        </section>
    )
}

function BlockPrice({
    adData,
    setAdData
}: PropsChildren) {
    return (
        <section className={`block price ${!window.isPhone && 'dash'}`}>
            {!window.isPhone && (<div className="title">{Language("PLACEAD_BLOCK_PRICE_TITLE")}</div>)}

            <div className="form">

                <Input id="placeadProductPriceInput" type="number" icon={(<IoPricetag />)} title={window.isPhone && Language("PLACEAD_BLOCK_PRICE_TITLE")}
                    data={{hint: Language("PLACEAD_BLOCK_PRICE_HINT")}}
                    choiceMenu={{ selected: renderCurrencyIcon(adData.priceCurrency), list: CONFIG.currencyList.map(item => {
                        return [ (
                            <>
                                <span>{item.code}</span>
                                {item.name}
                            </>
                        ), item.code ]
                    }) }}
                    choiceMenuSearch={true}
                    onChoiceMenu={elem => setAdData({ ...adData, priceCurrency: elem[1] })}
                    value={adData.price} onInput={event => setAdData({ ...adData, price: parseInt((event.target as HTMLInputElement).value) })}
                />
            </div>
        </section>
    )
}
function BlockPhoto({
    adData,
    setAdData
}: PropsChildren) {
    function imagesSetProductBackground(image) {
        setAdData(old => {
            let index = old.images.findIndex(item => item === image)
            if(index === -1 && old.images.length) index = 0

            const removeIndex = old.images.findIndex(item => item._productBackground)
            if(removeIndex !== -1) {
                delete old.images[removeIndex]._productBackground
                delete old.images[removeIndex].className
            }

            if(index !== -1) {
                old.images[index]._productBackground = 1
                old.images[index].className = '_productBackground'
            }

            return {...old}
        })
    }

    return (
        <section className="block photo">
            <h1 className="title">{Language("PLACEAD_BLOCK_PHOTO_TITLE")}</h1>
            <div className="dragdropphoto">
                {adData.images.length < 10 ? (
                    <UploadDropFile id={"placead"} maxFiles={CONFIG.placeAdMaxImages} filesLoaded={adData.images.length}
                        types={[ "image/jpeg", "image/png", "image/jpg" ]}
                        typesErrorMsg={Language("PLACEAD_UPLOADFILES_TYPES_ERROR")}
                        onLoad={(acceptedFiles: Array<RoutePlaceadImage>) => {
                        setAdData(old => {
                            if(old.images.length < 10) {
                                if(!old.images.length) {
                                    acceptedFiles[0]._productBackground = 1
                                    acceptedFiles[0].className = '_productBackground'
                                }
                                old.images = [...old.images, ...acceptedFiles]
                            }

                            return {...old}
                        })
                    }} />
                ) : ''}

                <PreviewFiles files={adData.images}
                    context={[
                        { content: Language("PLACEAD_BLOCK_PHOTO_CONTEXT_MENU_ELEM_1"), onSubmit: (file: RoutePlaceadImage, index) => {
                            if(file._productBackground)return Alert(Language("PLACEAD_BLOCK_PHOTO_CONTEXT_MENU_ELEM_1_ERROR"))
                            imagesSetProductBackground(file)
                        } }
                    ]}
                    
                    onDeleteFile={(file, index) => {
                        setAdData(old => {
                            const image = old.images[index]
                            if(image) {
                                old.images.splice(index, 1)
                                if(image._productBackground) imagesSetProductBackground(old.images[0])
                            }

                            return {...old}
                        })
                    }}
                />

                <div className="desc">
                    <section>
                        <h1>{Language("PLACEAD_BLOCK_PHOTO_DESC_1")}</h1>
                        <h1>{Language("PLACEAD_BLOCK_PHOTO_DESC_2" + (window.isPhone ? '_PHONE' : ''))}</h1>
                    </section>
                </div>
            </div>
        </section>
    )
}





interface CategoryFormsListTypesProps {
    formdata: CategoryForm,

    categoryFormsValues: Record<string, any>,
    setCategoryFormsValues: React.Dispatch<React.SetStateAction<Record<string, any>>>
}
function CategoryFormsListTypes({
    formdata,

    categoryFormsValues,
    setCategoryFormsValues
}: CategoryFormsListTypesProps) {
    if(!categoryFormsValues || !formdata || !formdata.params)return

    let formname = formdata.nameTranslate[window.language] || formdata.name
    if(formdata.important) formname += ' *'

    if(formdata.type === 'rangemulti') {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <h1 style={{ fontSize: '16px', fontWeight: '600' }}>{formname}</h1>
                <InputRange multi={true}
                    min={formdata.params.min} max={formdata.params.max} step={formdata.params.step}
                    value={categoryFormsValues[formdata.key][0]}
                    value2={categoryFormsValues[formdata.key][1]}
                    onInput={values => {
                        setCategoryFormsValues(old => {
                            old[formdata.key][0] = values[0]
                            old[formdata.key][1] = values[1]

                            return {...old}
                        })
                    }}
                    top={true}
                />
            </div>
        )
    }
    if(formdata.type === 'range') {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <h1 style={{ fontSize: '16px', fontWeight: '600' }}>{formname}</h1>
                <InputRange min={formdata.params.min} max={formdata.params.max} step={formdata.params.step}
                    value={categoryFormsValues[formdata.key]}
                    onInput={values => {
                        setCategoryFormsValues(old => {
                            old[formdata.key] = values[0]
                            return {...old}
                        })
                    }}
                />
            </div>
        )
    }
    if(formdata.type === 'select') {
        const list = [[ -1, Language("NOT_INSTALL"), null, true ]]
        formdata.params.list.map((item, i) => {
            list.push([ i, item.translate[window.language] || item.title ])
        })

        return (
            <Select _type={categoryFormsValues[formdata.key]} _list={list}
                title={formname}
                onChange={item => {
                    setCategoryFormsValues(old => {
                        old[formdata.key] = item[0]
                        return {...old}
                    })
                }}
            />
        )
    }
    if(formdata.type === 'input') {
        let hint: React.JSX.Element | string = ''

        if(formdata.params.type === 'text'
            || formdata.params.type === 'textarea') {
            if(!formdata.params.minLength && !formdata.params.maxLength)return
            hint = (
                <>
                    {formdata.params.minLength ? (
                        <span style={{ color: categoryFormsValues[formdata.key].length < formdata.params.minLength ? 'var(--tm-color-red)' : null }}>
                            {Language("PLACEAD_BLOCK_CATEGORY_FORM_INPUT_TEXT_DESC_1", null, null, formdata.params.minLength)}
                        </span>
                    ) : ''}
                    {formdata.params.maxLength ? (
                        <span style={{ color: categoryFormsValues[formdata.key].length > formdata.params.maxLength ? 'var(--tm-color-red)' : null}}>
                            {Language("PLACEAD_BLOCK_CATEGORY_FORM_INPUT_TEXT_DESC_2", null, null, categoryFormsValues[formdata.key].length, formdata.params.maxLength)}
                        </span>
                    ) : ''}
                </>
            )
        }
        if(formdata.params.type === 'number') {
            if(!formdata.params.minLength && !formdata.params.maxLength)return
            hint = (
                <>
                    {formdata.params.minLength ? (
                        <span style={{ color: categoryFormsValues[formdata.key] < formdata.params.minLength ? 'var(--tm-color-red)' : null }}>
                            {Language("PLACEAD_BLOCK_CATEGORY_FORM_INPUT_NUMBER_DESC_1", null, null, formdata.params.minLength)}
                        </span>
                    ) : ''}
                    {formdata.params.maxLength ? (
                        <span style={{ color: categoryFormsValues[formdata.key] > formdata.params.maxLength ? 'var(--tm-color-red)' : null}}>
                            {Language("PLACEAD_BLOCK_CATEGORY_FORM_INPUT_NUMBER_DESC_2", null, null, formdata.params.maxLength)}
                        </span>
                    ) : ''}
                </>
            )
        }

        return (
            <Input
                value={formdata.params.type === 'textarea' ? null : categoryFormsValues[formdata.key]} type={formdata.params.type}
                onInput={event => {
                    let value: string | number = event.target.value

                    if(formdata.params.type === 'number'
                        && value.length) {
                        value = parseInt(value)

                        if(isNaN(value)) value = formdata.params.minLength
                    }

                    setCategoryFormsValues(old => {
                        old[formdata.key] = value
                        return {...old}
                    })
                }}

                title={formname}
                data={{
                    hint: hint
                }}
            />
        )
    }
    return
}




interface CategoryDivProps {
    category: CategoryDTO,
    id: number,
    selectkey: number,

    categoriesSelect: number[],
    setCategoriesSelect: React.Dispatch<React.SetStateAction<number[]>>,

    setCategoryChoice: React.Dispatch<React.SetStateAction<CategoryDTO>>,
    setAdData: React.Dispatch<React.SetStateAction<AdData>>
}
function CategoryDiv({
    category,
    id,
    selectkey,

    categoriesSelect,
    setCategoriesSelect,

    setCategoryChoice,
    setAdData
}: CategoryDivProps) {
    if(!category || selectkey < 0 || selectkey >= 3)return
    return (
        <div className={`categoryname ${categoriesSelect[selectkey] === id && 'selected'}`}
            onClick={event => {
                setCategoriesSelect(old => {
                    old[selectkey] = id

                    if(selectkey === 0) old[1] = old[2] = -1
                    if(selectkey === 1) old[2] = -1

                    return [...old]
                })

                setCategoryChoice(category)
                setAdData(old => {
                    return {...old, category}
                })
            }}
        >
            {category.categoryName}
            <span>{category.productsCount.toLocaleString()} {Language('ADS')}</span>
        </div>
    )
}













function CategoriesLoader() {
    return (
        <div className="categorieschoicemenu-wrapper loader">
            <div className="_loaderdiv" style={{ width: '100%', height: '26px' }}></div>
            <div className="_loaderdiv" style={{ width: '100%', height: '26px' }}></div>
            <div className="_loaderdiv" style={{ width: '100%', height: '26px' }}></div>
            <div className="_loaderdiv" style={{ width: '100%', height: '26px' }}></div>
            <div className="_loaderdiv" style={{ width: '100%', height: '26px' }}></div>
            <div className="_loaderdiv" style={{ width: '100%', height: '26px' }}></div>
        </div>
    )
}