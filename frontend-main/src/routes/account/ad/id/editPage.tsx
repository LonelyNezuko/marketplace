import { Alert } from "@components/alert"
import ContextMenu from "@components/contextmenu"
import UploadDropFile, { UploadDropFile_File } from "@components/uploadDropFile"
import { Language } from "@modules/Language"
import { copyToClipBoard } from "@modules/functions/copyToClipBoard"
import { formatImage } from "@modules/functions/formatImage"
import React from "react"
import { AiFillCaretLeft, AiFillCaretRight } from "react-icons/ai"
import CONFIG from '@config'
import Input from "@components/input"
import Address from "@components/address"
import { BlockProps } from "./id"
import GeolocationDTO from "@dto/geolocation.dto"
import Button from "@components/button"
import MapLeaflet from "@components/mapLeaflet"
import { LatLng } from "leaflet"
import GetGeolocation from "@modules/GetGeolocation"
import CircleLoaderFullSize from "@components/circleLoader/fullsize"
import ErrorInnerBlock from "@components/errorInnerBlock"
import { SiGooglemaps } from "react-icons/si"
import { CategoryForm } from "@dto/category.dto"
import $ from 'jquery'
import 'jquery.scrollto'
import { Select, SelectListObject } from "@components/select/select"
import InputRange from "@components/inputrange"
import { FaSave } from "react-icons/fa"
import { enumProductModerationStatus, enumProductStatus } from "@dto/product.dto"
import { MdDescription, MdOutlineSubtitles } from "react-icons/md"
import { IoMdPricetags } from "react-icons/io"
import { renderCurrencyIcon } from "@modules/functions/renderCurrencyIcon"
import { API, APISync } from "@modules/API"
import { notify } from "@modules/Notify"
import { useSwipeable } from "react-swipeable"


export function EditPage({
    loader,
    account,

    product,
    setProduct,

    setNavigate,

    loaderModal,
    setLoaderModal
}: BlockProps) {
    const [ imageBackgroundIndex, setImageBackgroundIndex ] = React.useState(0)

    const [ previewFiles, setPreviewFiles ] = React.useState<string[]>([])
    const [ loadedFiles, setLoadedFiles ] = React.useState<UploadDropFile_File[]>([])

    const [ form, setForm ] = React.useState({
        price: {
            edited: false,
            error: null,
            mark: 'accept'
        },
        title: {
            edited: false,
            error: null,
            mark: 'accept'
        },
        description: {
            edited: false,
            error: null,
            mark: 'accept'
        },
        address: {
            edited: false
        }
    })

    React.useEffect(() => {
        if(!loader && product && !previewFiles.length) {
            setPreviewFiles([...product.prodImages])
        }
    }, [loader])

    
    async function onSubmit() {
        if(loaderModal.toggle)return

        if(!previewFiles.length)return Alert(Language("ACCOUNT_AD_EDIT_SUBMIT_ERROR_1"))
        if(form.price.mark !== 'accept'
            || form.title.mark !== 'accept')return Alert(Language("ACCOUNT_AD_EDIT_SUBMIT_ERROR_2"))

        setLoaderModal({
            toggle: true,
            text: "Сохраняем..."
        })

        let formData = new FormData()
        
        loadedFiles.map(item => {
            formData.append('imagesLoaded[]', item, item.name)
        })

        formData.append('prodID', product.prodID as any)
        formData.append('forms', JSON.stringify(product.prodForms))
        formData.append('images', JSON.stringify(product.prodImages))
        if(JSON.stringify((product as any).__deleteImages)) formData.append('imagesDelete', JSON.stringify((product as any).__deleteImages))
        formData.append('imageBackgroundIndex', imageBackgroundIndex as any)
        formData.append('name', product.prodTitle)
        formData.append('description', product.prodDescription)
        formData.append('price', product.prodPrice as any)
        formData.append('priceCurrency', product.prodCurrency)
        formData.append('location', JSON.stringify(product.prodGeo))
        formData.append('onlycity', product.prodOnlyCity as any)

        const result = await APISync({
            url: '/defaultapi/product/update',
            type: 'put',
            data: formData,
            contentType: false,
            processData: false
        })

        setLoaderModal({
            toggle: false,
            text: null
        })

        if(result.statusCode === 200) {
            Alert(Language("ACCOUNT_AD_EDIT_SUBMIT_SUCCESS"), "success")
            setNavigate('/account/ad/' + product.prodID + '/edit')
        }
        else {
            if(result.message === 'Incorrect data [forms]') Alert(Language("ACCOUNT_AD_EDIT_SUBMIT_ERROR_3"))
            else if(result.message === 'Incorrect data [images]') Alert(Language("ACCOUNT_AD_EDIT_SUBMIT_ERROR_4"))
            else if(result.message === 'Incorrect data [location]') Alert(Language("ACCOUNT_AD_EDIT_SUBMIT_ERROR_5"))
            else if(result.message === 'Failed to upload files') Alert(Language("ACCOUNT_AD_EDIT_SUBMIT_ERROR_6"))
            else if(result.message === 'Product with this ProdID not found'
                || result.message === 'You are not the owner of this product'
                || result.message === 'You cannot edit this product') setNavigate('/account/ad')
            else {
                Alert(Language("ACCOUNT_AD_EDIT_SUBMIT_ERROR_7"))
                notify("(account.ad.id) /product/update: " + result.message, { debug: true })
            }
        }
    }

    if(loader || !account || !product)return
    return (
        <div className="editpage">
            <Images loader={loader} account={account} product={product} setProduct={setProduct}
                imageBackgroundIndex={imageBackgroundIndex}
                setImageBackgroundIndex={setImageBackgroundIndex}

                previewFiles={previewFiles}
                setPreviewFiles={setPreviewFiles}

                loadedFiles={loadedFiles}
                setLoadedFiles={setLoadedFiles}
            />

            <div className="mainInfo">
                <div className="editInformation">
                    <span>{Language("ACCOUNT_AD_EDIT_INFORMATION")}</span>
                </div>

                <div className="priceBlock">
                    {form.price.edited ? (
                        <Input id='accountADEditForm_priceEdit' type={"number"} icon={<IoMdPricetags />}
                            data={{ mark: form.price.mark as any, error: form.price.error }}
                            value={product.prodPrice}
                            onInput={event => {
                                if(!form.price.edited)return

                                const value = parseInt((event.target as HTMLInputElement).value)
                                const result = { edited: true, mark: 'accept', error: null }
                                
                                if(isNaN(value) || value < 0) {
                                    result.mark = 'error'
                                    result.error = Language("ACCOUNT_AD_EDIT_FORM_PRICE_ERROR")
                                }
                                
                                setForm({ ...form, price: result })
                                if(result.mark === 'accept') {
                                    setProduct(old => {
                                        old.prodPrice = value
                                        return {...old}
                                    })
                                }
                            }}

                            choiceMenu={{ selected: renderCurrencyIcon(product.prodCurrency), list: CONFIG.currencyList.map(item => {
                                return [ (
                                    <>
                                        <span style={{ background: 'var(--tm-bg-footer)', padding: '4px 6px', marginRight: '4px', borderRadius: '4px', display: 'inline-block' }}>{item.code}</span>
                                        {item.name}
                                    </>
                                ), item.code ]
                            }) }}
                            choiceMenuSearch={true}
                            onChoiceMenu={elem => setProduct({ ...product, prodCurrency: elem[1] })}

                            autoFocus={true}
                            // onBlur={() => setForm({ ...form, price: { ...form.price, edited: false, mark: 'accept', error: null } })}
                        />
                    ) : (
                        <span className="price" onClick={() => setForm({ ...form, price: { ...form.price, edited: true } })}>
                            {!product.prodPrice ? Language("PRICE_ZERO") : 
                                new Intl.NumberFormat(window.language, {
                                    style: "currency",
                                    currency: product.prodCurrency
                                }).format(product.prodPrice)}
                        </span>
                    )}
                </div>
                <div className="titleBlock">
                    {form.title.edited ? (
                        <Input id='accountADEditForm_titleEdit' type={"text"} icon={<MdOutlineSubtitles />}
                            data={{ mark: form.title.mark as any, error: form.title.error }}
                            value={product.prodTitle}
                            onInput={event => {
                                if(!form.title.edited)return

                                const value = (event.target as HTMLInputElement).value
                                const result = { edited: true, mark: 'accept', error: null }
                                
                                if(value.length < 4 || value.length > 50) {
                                    result.mark = 'error'
                                    result.error = Language("ACCOUNT_AD_EDIT_FORM_TITLE_ERROR")
                                }
                                
                                setForm({ ...form, title: result })
                                if(result.mark === 'accept') {
                                    setProduct(old => {
                                        old.prodTitle = value
                                        return {...old}
                                    })
                                }
                            }}

                            autoFocus={true}
                            onBlur={() => setForm({ ...form, title: { ...form.title, edited: false, mark: 'accept', error: null } })}
                        />
                    ) : (
                        <span className="prodTitle" onClick={() => setForm({ ...form, title: { ...form.title, edited: true } })}>{product.prodTitle}</span>  
                    )}

                    {form.address.edited ? (
                        <AddressMap loader={loader} account={account} product={product} setProduct={setProduct} form={form} setForm={setForm} />
                    ) : (
                        <span className="address" onClick={() => setForm({ ...form, address: { ...form.address, edited: true } })}>{Address(product.prodGeo, product.prodOnlyCity)}</span>
                    )}
                </div>
            </div>

            <FormsBlock loader={loader} account={account} product={product} setProduct={setProduct} />

            <div className="descriptionBlock">
                <h6 className="blockTitle">{Language("PRODUCT_ID_DESCRIPTION")}</h6>

                {form.description.edited ? (
                    <Input id="accountADEditForm_descriptioEdit" type={"textarea"} icon={<MdDescription />}
                        data={{ mark: form.description.mark as any, error: form.description.error }}
                        value={product.prodDescription}
                        onInput={event => {
                            if(!form.description.edited)return

                            const value = (event.target as HTMLInputElement).value
                            const result = { edited: true, mark: 'accept', error: null }
                            
                            if(value.length < 4 || value.length > 2000) {
                                result.mark = 'error'
                                result.error = Language("ACCOUNT_AD_EDIT_FORM_DESCRIPTION_ERROR")
                            }
                            
                            setForm({ ...form, description: result })
                            if(result.mark === 'accept') {
                                setProduct(old => {
                                    old.prodDescription = value
                                    return {...old}
                                })
                            }
                        }}

                        autoFocus={true}
                        onBlur={() => {
                            setForm({...form, description: { ...form.description, edited: false, mark: 'accept', error: null }})
                        }}
                    />
                ) : (
                    <span className="descriptionValue" onClick={() => setForm({...form, description: { ...form.description, edited: true }})}>{product.prodDescription}</span>
                )}
            </div>

            <div className="submitBlock">
                <div className="info">
                    {product.prodStatus === enumProductStatus.PRODUCT_STATUS_ACTIVE
                        && product.prodModerationStatus === enumProductModerationStatus.PRODUCT_MODERATION_STATUS_PROBLEM ? (
                        <span>{Language("ACCOUNT_AD_EDIT_PRODUCT_PROBLEM_HINT")}</span>
                    ) : ''}
                </div>
                <div className="actions">
                    <Button name={Language("SAVE")} icon={<FaSave />}
                        size={"big"} type={"border"}
                        loader={loaderModal.toggle}
                        onClick={onSubmit}
                    />
                </div>
            </div>
        </div>
    )
}


interface ImagesProps extends BlockProps {
    imageBackgroundIndex: number,
    setImageBackgroundIndex: React.Dispatch<React.SetStateAction<number>>,

    previewFiles: string[],
    setPreviewFiles: React.Dispatch<React.SetStateAction<string[]>>,

    loadedFiles: UploadDropFile_File[],
    setLoadedFiles: React.Dispatch<React.SetStateAction<UploadDropFile_File[]>>
}
function Images({
    loader,
    account,

    product,
    setProduct,
    
    imageBackgroundIndex,
    setImageBackgroundIndex,

    previewFiles,
    setPreviewFiles,

    loadedFiles,
    setLoadedFiles
}: ImagesProps) {
    const imagesRef = React.useRef(null)

    const [ imageSelected, setImageSelected ] = React.useState(0)
    const swipeImages = useSwipeable({
        onSwiped: event => {
            if(event.dir === 'Left') {
                setImageSelected(old => {
                    if(old < previewFiles.length - 1) old += 1
                    onImageSwiped(old)

                    return old
                })
            }
            else if(event.dir === 'Right') {
                setImageSelected(old => {
                    if(old > 0) old -= 1

                    onImageSwiped(old)
                    return old
                })
            }
        },
        delta: 15
    })

    function onImageSwiped(index: number) {
        if(!imagesRef.current)return

        const element = $(imagesRef.current)
        element.find('.imagesList').scrollTo(`.imageElem:nth-child(${index + 1})`, {
            duration: 100
        })
    }

    return (
        <div className="images" ref={imagesRef}>
            <div className="imagesWrapper">
                <div className="imagePreview" {...swipeImages}>
                    <div className="wrapper" style={{ transform: `translateX(-${imageSelected * 100}%)` }}>
                        {previewFiles.map((item, i) => {
                            return (
                                <div className="image" key={i}>
                                    <img src={item} />
                                    <img src={item} className='blured' />
                                </div>
                            )
                        })}
                    </div>

                    {!window.isPhone && imageSelected > 0 ? (
                        <div className="arrow left" onClick={() => setImageSelected(old => {
                            old -= 1
                            onImageSwiped(old)

                            return old
                        })}>
                            <AiFillCaretLeft />
                        </div>
                    ) : ''}
                    {!window.isPhone && imageSelected < previewFiles.length - 1 ? (
                        <div className="arrow right" onClick={() => setImageSelected(old => {
                            old += 1
                            onImageSwiped(old)

                            return old
                        })}>
                            <AiFillCaretRight />
                        </div>
                    ) : ''}
                </div>

                <div className="imagesList">
                    {previewFiles.map((image, i) => {
                        return (
                            <div className={`imageElem ${imageSelected === i && 'selected'} ${imageBackgroundIndex === i && 'background'}`} key={i}>
                                {imageBackgroundIndex === i ? (<span className="backgroundText">{Language("SELECTED")}</span>) : ''}
                                <img src={formatImage(image, 360)} onClick={() => setImageSelected(i)} />

                                <ContextMenu list={[
                                    { content: Language("PLACEAD_BLOCK_PHOTO_CONTEXT_MENU_ELEM_1"), onClick: () => {
                                        setImageBackgroundIndex(i)
                                    } },
                                    { content: Language("OPEN_NEW_TAB"), bottom: true, onClick: () => {
                                        window.open(image, "_blank")
                                    } },
                                    { content: Language("COPY_LINK"), onClick: () => {
                                        copyToClipBoard(image)
                                    } },
                                    { content: Language("DELETE"), bottom: true, color: 'var(--tm-color-red)', onClick: () => {
                                        if(previewFiles.length <= 1)return Alert("Необходимо как минимум одна фотография")
                                        
                                        if(image.indexOf('http') === 0) {
                                            setProduct(old => {
                                                if(!(old as any).__deleteImages) (old as any).__deleteImages = [];
                                                (old as any).__deleteImages.push(image)

                                                old.prodImages = old.prodImages.filter(item => item !== image)
                                                return {...old}
                                            })
                                        }

                                        setPreviewFiles(old => {
                                            old.splice(i, 1)
                                            return [...old]
                                        })

                                        if(imageBackgroundIndex === i
                                            && imageBackgroundIndex !== 0) setImageBackgroundIndex(0)
                                        if(imageSelected === i
                                            && imageSelected !== 0) setImageSelected(0)
                                    } }
                                ]} />
                            </div>
                        )
                    })}
                </div>
            </div>

            {previewFiles.length < CONFIG.placeAdMaxImages ? (
                <div className="imagesAdd">
                    <UploadDropFile
                        id={"accountADIDEditImages"}
                        maxFiles={CONFIG.placeAdMaxImages}
                        filesLoaded={previewFiles.length}

                        types={"image/*"}
                        typesErrorMsg={Language("ACCOUNT_AD_EDIT_IMAGES_UPLOAD_TYPES_ERROR", null, null, CONFIG.maxFileSizeToUpload / CONFIG.mbtobyte)}

                        onLoad={acceptedFiles => {
                            setLoadedFiles(old => {
                                return [...old, ...acceptedFiles]
                            })
                            setPreviewFiles(old => {
                                return [...old, ...acceptedFiles.map((item) => {
                                    const url: string = URL.createObjectURL(item)
                                    return url
                                })]
                            })
                        }}
                    />
                </div>
            ) : ''}
        </div>
    )
}


let mapLoaderTimer: NodeJS.Timeout = null
let mapUpdateTimer: NodeJS.Timeout = null

interface AddressMapProps extends BlockProps {
    form: any,
    setForm: any
}
function AddressMap({
    loader,
    account,

    product,
    setProduct,

    form,
    setForm
}: AddressMapProps) {
    const [ mapLocation, setMapLocation ] = React.useState<GeolocationDTO>(null)
    const [ mapOnlyCity, setMapOnlyCity ] = React.useState(false)

    const [ mapFindMe, setMapFindMe ] = React.useState(false)

    const [ error, setError ] = React.useState(null)
    const [ warning, setWarning ] = React.useState(false)

    React.useEffect(() => {
        if(product) {
            setMapLocation(product.prodGeo)
            setMapOnlyCity(!product.prodOnlyCity ? false : true)
        }
    }, [product])
    React.useEffect(() => {
        if(!error) setWarning(false)
    }, [error])

    const [ loaderMap, setLoaderMap ] = React.useState(false)
    React.useEffect(() => {
        if(loaderMap === true) {
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
    }, [loaderMap])

    React.useEffect(() => {
        if(mapFindMe === true) setMapFindMe(false)
    }, [mapFindMe])

    React.useEffect(() => {
        if(mapLocation) {
            if(!mapLocation.country
                || !mapLocation.city
                || !mapLocation.cityUniqueID) setError(Language("MAP_MODAL_ERROR_1"))
        }
    }, [mapLocation])

    function onSubmit() {
        if(loaderMap || error)return

        setForm({ ...form, address: { ...form.address, edited: false } })
        setProduct(old => {
            old.prodGeo = mapLocation
            old.prodOnlyCity = !mapOnlyCity ? 0 : 1

            return {...old}
        })
    }

    if(!account || loader || !product || !mapLocation)return
    return (
        <div className="addressMap">
            <div className="locationname">
                <h1>{Address(mapLocation, mapOnlyCity)}</h1>
                <section>
                    <Button selected={mapOnlyCity} name={Language("PLACEAD_BLOCK_LOCATION_BTN_ONLYCITY")} type={"border"}
                        onClick={() => setMapOnlyCity(!mapOnlyCity)}
                    />
                    <Button name={Language("PLACEAD_BLOCK_LOCATION_BTN_FINDME")} type={"border"}
                        onClick={() => {
                            if(loaderMap)return
                            setMapFindMe(true)
                        }}
                    />
                </section>
            </div>

            <div className="map">
                <MapLeaflet autoGeo={mapFindMe} position={new LatLng(mapLocation.lat, mapLocation.lng)} onChange={position => {
                    setError(null)

                    if(mapUpdateTimer) clearTimeout(mapUpdateTimer)
                    mapUpdateTimer = setTimeout(async () => {
                        setLoaderMap(true)

                        const data: GeolocationDTO = await GetGeolocation(position)

                        setMapLocation(data)
                        setLoaderMap(false)
                    }, 300)
                }} />
                
                {loaderMap && (<CircleLoaderFullSize />)}
                <ErrorInnerBlock toggle={!!error} text={error} warning={warning} />
            </div>

            <div className="actions">
                <Button name={Language("SUBMIT")} icon={<SiGooglemaps />} size={"medium"}
                    disabled={loaderMap || error}
                    onClick={onSubmit}
                />
            </div>
        </div>
    )
}


function FormsBlock({
    loader,
    account,

    product,
    setProduct
}: BlockProps) {
    interface FormProps {
        [key: string]: {
            title: string,
            value: string,

            categoryForm: CategoryForm,

            formMark?: '' | 'accept' | 'error',
            formError?: string,

            inputHint?: React.JSX.Element | string
        }
    }

    const [ form, setForm ] = React.useState<FormProps>(null)
    const [ formEdited, setFormEdited ] = React.useState<{ [key: string]: boolean }>({})

    const [ somethingEdited, setSomethingEdited ] = React.useState(false)

    React.useEffect(() => {
        if(product
            && product.prodCategory.categoryForms && product.prodCategory.categoryForms.length) {
            let tmpForms: FormProps = {}
            product.prodCategory.categoryForms.map((item, i) => {
                if(product.prodForms[item.key] === undefined)return
                tmpForms[item.key] = {
                    title: item.nameTranslate[window.language] || item.name,
                    value: item.type === 'select'
                        ? parseInt(product.prodForms[item.key]) === -1 ? Language("NOT_INSTALL") : item.params.list[product.prodForms[item.key]].translate[window.language] || item.params.list[product.prodForms[item.key]].title
                        : item.type === 'rangemulti' ? product.prodForms[item.key][0] + ' - ' + product.prodForms[item.key][1] : product.prodForms[item.key],
                    categoryForm: item,

                    inputHint: getInputHint(item, product.prodForms[item.key])
                }

                if(!formEdited[item.key]) formEdited[item.key] = false
            })

            setForm(tmpForms)
        }
    }, [product])

    function getInputHint(formdata: CategoryForm, value: string | number): React.JSX.Element | string {
        let hint: React.JSX.Element | string = ''

        if(formdata.params.type === 'text'
            || formdata.params.type === 'textarea') {
            if(!formdata.params.minLength && !formdata.params.maxLength)return
            hint = (
                <>
                    {formdata.params.minLength ? (
                        <span style={{ color: (value as string).length < formdata.params.minLength ? 'var(--tm-color-red)' : null }}>
                            {Language("PLACEAD_BLOCK_CATEGORY_FORM_INPUT_TEXT_DESC_1", null, null, formdata.params.minLength)}
                        </span>
                    ) : ''}
                    {formdata.params.maxLength ? (
                        <span style={{ color: (value as string).length > formdata.params.maxLength ? 'var(--tm-color-red)' : null}}>
                            {Language("PLACEAD_BLOCK_CATEGORY_FORM_INPUT_TEXT_DESC_2", null, null, (value as string).length, formdata.params.maxLength)}
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
                        <span style={{ color: (value as number) < formdata.params.minLength ? 'var(--tm-color-red)' : null }}>
                            {Language("PLACEAD_BLOCK_CATEGORY_FORM_INPUT_NUMBER_DESC_1", null, null, formdata.params.minLength)}
                        </span>
                    ) : ''}
                    {formdata.params.maxLength ? (
                        <span style={{ color: (value as number) > formdata.params.maxLength ? 'var(--tm-color-red)' : null}}>
                            {Language("PLACEAD_BLOCK_CATEGORY_FORM_INPUT_NUMBER_DESC_2", null, null, formdata.params.maxLength)}
                        </span>
                    ) : ''}
                </>
            )
        }

        return hint
    }

    // React.useEffect(() => {
    //     function onStopEdited(event) {
    //         // const element = $('#accountADIDEditFormsBlock')
    //         // const target = $(event.target)

    //         // if(!somethingEdited)return
    //         // if(element.is(target) || element.has(target as any).length)return

    //         // setSomethingEdited(false)
    //         // setFormEdited(old => {
    //         //     for(var key in old) old[key] = false
    //         //     return {...old}
    //         // })
    //     }

    //     document.addEventListener('click', onStopEdited)
    //     document.addEventListener('touchstart', onStopEdited)
    //     document.addEventListener('wheel', onStopEdited)

    //     return () => {
    //         document.removeEventListener('click', onStopEdited)
    //         document.removeEventListener('touchstart', onStopEdited)
    //         document.removeEventListener('wheel', onStopEdited)
    //     }
    // }, ['', somethingEdited])

    if(loader || !account || !product || !form)return
    return (
        <div className="formsBlock" id="accountADIDEditFormsBlock">
            <h6 className="blockTitle">{Language("PRODUCT_ID_CHARACTERISTICS")}</h6>

            <div className="list">
                {(!product.prodCategory.categoryForms || !product.prodCategory.categoryForms.length || !product.prodForms) ? (
                    <div className="null">{Language("PRODUCT_ID_CHARACTERISTICS_NULL")}</div>
                ) : ''}
                {product.prodCategory.categoryForms && product.prodCategory.categoryForms.length ? product.prodCategory.categoryForms.map((item, i) => {
                    if(form[item.key] === undefined)return
                    return (
                        <section className={`elem _${item.type === 'input' ? item.params.type : item.type}`} key={i}>
                            <h3 className="elemTitle">{form[item.key].title} {item.important && '*'}</h3>

                            {formEdited[item.key] ? (
                                <div className="elemEdit">
                                    {item.type === 'input' ? (
                                        <Input type={item.params.type}
                                            data={{
                                                hint: form[item.key].inputHint
                                            }}
                                            deleteLabel={true}
                                            value={form[item.key].value}
                                            onInput={event => {
                                                let value = ''

                                                if(item.params.type === 'textarea') value = event.target.value
                                                else value = (event.target as HTMLInputElement).value

                                                setProduct(old => {
                                                    old.prodForms[item.key] = value
                                                    return {...old}
                                                })
                                            }}

                                            autoFocus={true}
                                            onBlur={() => {
                                                setFormEdited(old => {
                                                    for(var key in old) old[key] = false
                                                    setSomethingEdited(false)
                
                                                    return {...old}
                                                })
                                            }}
                                        />
                                    ) : item.type === 'select' ? (
                                        <Select autoOpened={true}
                                            _type={parseInt(product.prodForms[item.key])}
                                            _list={item.params.list.map((elem, s): SelectListObject => {
                                                return { content: elem.translate[window.language] || elem.title, key: s }
                                            })} version={2}

                                            onChange={(elem: SelectListObject) => {
                                                setProduct(old => {
                                                    old.prodForms[item.key] = elem.key
                                                    return {...old}
                                                })
                                                setFormEdited(old => {
                                                    for(var key in old) old[key] = false
                                                    setSomethingEdited(false)
                
                                                    return {...old}
                                                })
                                            }}
                                            onToggle={toggle => {
                                                if(!toggle) {
                                                    setFormEdited(old => {
                                                        for(var key in old) old[key] = false
                                                        setSomethingEdited(false)
                    
                                                        return {...old}
                                                    }) 
                                                }
                                            }}
                                        />
                                    ) : (item.type === 'range' || item.type === 'rangemulti') ? (
                                        <InputRange min={item.params.min} max={item.params.max}
                                            value={item.type === 'range' ? parseInt(product.prodForms[item.key]) : product.prodForms[item.key][0]}
                                            value2={item.type === 'rangemulti' && product.prodForms[item.key][1]}

                                            multi={item.type === 'rangemulti'}
                                            step={item.params.step}

                                            top={true}
                                            hidePhoneCounter={window.isPhone}

                                            onInput={value => {
                                                setProduct(old => {
                                                    if(item.type === 'rangemulti') product.prodForms[item.key][0] = value[0]
                                                    else product.prodForms[item.key] = value[0]

                                                    if(item.type === 'rangemulti') product.prodForms[item.key][1] = value[1]
                                                    return {...old}
                                                })
                                            }}
                                        />
                                    ) : ''}
                                </div>
                            ) : (
                                <span className="elemValue" onClick={() => setFormEdited(old => {
                                    for(var key in old) old[key] = false

                                    old[item.key] = true
                                    setSomethingEdited(true)

                                    return {...old}
                                })}>{form[item.key].value}</span>
                            )}
                        </section>
                    )
                }) : ''}
            </div>
        </div>
    )
}