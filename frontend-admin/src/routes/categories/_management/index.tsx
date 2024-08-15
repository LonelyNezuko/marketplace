import React from 'react'
import $ from 'jquery'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import parseQuery from 'parse-query'

import Moment from 'moment'
import 'moment/min/locales'

import CONFIG from '@config'

import { Language } from '@modules/Language'
import Input from '@components/input'
import { CircleLoader } from '@components/circleLoader/circleLoader'
import { Select } from '@components/select/select'
import { Modal } from '@components/modals'
import { API, APISync } from '@modules/API'

import './index.scss'
import Table from '@components/table'

import { IoIosArrowDown } from "react-icons/io";
import InputRange from '@components/inputrange'

import { MdDeleteOutline, MdEdit, MdOutlinePlaylistAdd } from "react-icons/md";
import { MdOutlinePlaylistAddCheck } from "react-icons/md";

import { MdDelete } from "react-icons/md";
import { RouteErrorCode, RouteErrorCodeProps } from '@routes/errorcodes'
import { notify } from '@modules/Notify'

import { PiSealWarningFill } from "react-icons/pi";
import { MdBookmarkAdded } from "react-icons/md";
import { ModalCategories } from '@components/modals/categories/categories'
import { Alert } from '@components/alert'
import CategoryDTO, { CategoryForm, CategoryFormParams, CategoryFormTypes } from '@dto/category.dto'
import SetRouteTitle from '@modules/SetRouteTitle'
import DotsLoader from '@components/dotsloader'
import Button from '@components/button'
import UploadDropFile from '@components/uploadDropFile'
import { StorageDTO } from '@dto/storage.dto'
import { AiFillDelete } from 'react-icons/ai'

interface _CategoryFormParams extends CategoryFormParams {
    listValue?: Array<string>
}
interface _CategoryForm extends CategoryForm {
    __parent__?: boolean,
    __exists?: boolean
}
interface _CategoryDTO extends CategoryDTO {
    categoryDefaultIcon?: string
    categoryDefaultBackground?: string
}

const defaultFormParams: Record<string, _CategoryFormParams> = {
    input: {
        type: 'text',
        minLength: 0,
        maxLength: 255
    },
    select: {
        list: [],
        listValue: []
    },
    range: {
        min: 1,
        max: 2,
        step: 1
    },
    rangemulti: {
        min: 1,
        max: 2,
        step: 1
    }
}

interface RouteCategories_ManagementProps {
    type: 'add' | 'edit'
}
export default function RouteCategories_Management({
    type
}: RouteCategories_ManagementProps) {
    const location = useLocation()
    const params = useParams()

    SetRouteTitle(Language(type === 'add' ? "ADMIN_ROUTE_TITLE_CATEGORIES_ADD" : "ADMIN_ROUTE_TITLE_CATEGORIES_EDIT"))
    Moment.locale(window.language)

    const [ loader, setLoader ] = React.useState(true)
    const [ errorPage, setErrorPage ] = React.useState<RouteErrorCodeProps>({ code: 0, text: '', showbtn: false })

    const [ navigate, setNavigate ] = React.useState(null)
    React.useEffect(() => { if(navigate !== null) setNavigate(null) }, [navigate])

    const formTypes: Array<[ CategoryFormTypes, string ]> = [
        [ "input", "Поле ввода" ],
        [ "select", "Выбор из списка" ],
        [ "range", "Поле диапазон" ],
        [ "rangemulti", "Поле диапазона мин/макс" ]
    ]

    const [ categoryData, setCategoryData ] = React.useState<_CategoryDTO>(null)
    const [ formaList, setFormaList ] = React.useState<Array<_CategoryForm>>([])

    const [ disabled, setDisabled ] = React.useState(false)
    const [ btnDisabled, setBtnDisabled ] = React.useState(false)
    const [ btnLoader, setBtnLoader ] = React.useState(false)
    const [ btnLoadFormsDisabled, setBtnLoadFormsDisabled ] = React.useState(false)

    const [ iconLoader, setIconLoader ] = React.useState(false)
    const [ iconFile, setIconFile ] = React.useState<File>(null)

    const [ backgroundLoader, setBackgroundLoader ] = React.useState(false)
    const [ backgroundFile, setBackgroundFile ] = React.useState<File>(null)

    const [ deleteParentFormWarning, setDeleteParentWarning ] = React.useState(-1)
    const [ successModal, setSuccessModal ] = React.useState(false)


    const [ changeParentModal, setChangeParentModal ] = React.useState(false)
    function changeParent(category: CategoryDTO) {
        if(category && !category.categorySubcategories) {
            setLoader(false)
            return setErrorPage({ code: 400 })
        }
        setCategoryData({ ...categoryData, categoryParent: category })

        setBtnLoadFormsDisabled(false)
        setChangeParentModal(false)
    }


    async function loadImage(): Promise<string> {
        if(categoryData.categoryIcon === '/assets/category/default.png') {
            return '/assets/category/default.png'
        }
        if(categoryData.categoryIcon === categoryData.categoryDefaultIcon) {
            return categoryData.categoryIcon
        }

        setIconLoader(true)
        let formData = new FormData()
        
        formData.append('files[]', iconFile, iconFile.name)
        formData.append('access', 'default')

        const results = await APISync({
            url: '/defaultapi/service/storage/upload',
            type: 'post',
            data: formData,
            contentType: false,
            processData: false
        })

        if(results.statusCode === 200) {
            setIconLoader(false)

            const storageFile: StorageDTO = results.message[0]
            return storageFile.link
        }
        else {
            setIconLoader(false)
            notify("(categories._management.loadImage) /service/storage/upload: " + results.message, { debug: true })

            Alert('Err to load icon')
        }
        return
    }

    async function loadBackground(): Promise<string> {
        if(categoryData.categoryBackground === '/assets/category/default_background.jpg'){
            return '/assets/category/default_background.jpg'
        }
        if(categoryData.categoryBackground === categoryData.categoryDefaultBackground) {
            return categoryData.categoryBackground
        }

        setBackgroundLoader(true)
        let formData = new FormData()
        
        formData.append('files[]', backgroundFile, backgroundFile.name)
        formData.append('access', 'default')

        const results = await APISync({
            url: '/defaultapi/service/storage/upload',
            type: 'post',
            data: formData,
            contentType: false,
            processData: false
        })

        if(results.statusCode === 200) {
            setBackgroundLoader(false)

            const storageFile: StorageDTO = results.message[0]
            return storageFile.link
        }
        else {
            setIconLoader(false)
            notify("(categories._management.loadImage) /service/storage/upload: " + results.message, { debug: true })

            Alert("Err to load background")
        }

        return
    }


    async function onSubmit() {
        if(disabled || btnDisabled || btnLoader)return

        setBtnLoader(true)
        setDisabled(true)

        formaList.map(form => {
            delete form.__parent__
            delete (form.params as _CategoryFormParams).listValue
        })

        const iconLink = await loadImage()
        const backgroundLink = await loadBackground()

        if(!iconLink || !backgroundLink) {
            setBtnLoader(false)
            setDisabled(false)

            return
        }

        const result = await APISync({
            url: '/defaultapi/admin/category/' + (type === 'edit' ? 'update' : 'create'),
            type: type === 'edit' ? 'put' : 'post',
            data: {
                id: type === 'edit' && categoryData.categoryID,
                name: categoryData.categoryName,
                nameTranslate: JSON.stringify(categoryData.categoryNameTranslate),
                icon: iconLink,
                background: backgroundLink,
                parentID: categoryData.categoryParent && categoryData.categoryParent.categoryID,
                link: categoryData.categoryLink,
                forms: JSON.stringify(formaList)
            }
        })

        setDisabled(false)
        setBtnLoader(false)

        if(result.statusCode === 200) {
            setSuccessModal(true)
        }
        else if(result.statusCode === 403) setErrorPage({ code: 403 })
        else notify('(addcategory) /admin/category/create: ' + result.message, { debug: true })
    }



    function onAddForma() {
        setFormaList(old => {
            old.push({
                key: '',
                type: 'input',
                name: 'Sample',
                nameTranslate: {},

                important: false,
                params: defaultFormParams['input']
            })
            return [...old]
        })
    }
    function onDeleteForma(id, warningoff = false) {
        if(id < 0 || id >= formaList.length)return

        if(formaList[id].__parent__
            && !warningoff) {
            return setDeleteParentWarning(id)
        }

        formaList.splice(id, 1)
        setFormaList([...formaList])
    }
    function onChangeFormaType(id: number, type: CategoryFormTypes) {
        if(!formTypes.find(elem => elem[0] === type))return
        if(id < 0 || id >= formaList.length)return

        const old = formaList[id]
        formaList[id] = {
            key: old.key,
            type,
            name: old.name,
            nameTranslate: old.nameTranslate,
            params: defaultFormParams[type]
        }

        setFormaList([...formaList])
    }

    React.useEffect(() => {
        if(!categoryData)return setBtnDisabled(true)

        if(categoryData.categoryName.length < 4
            || categoryData.categoryName.length > 24
            || (categoryData.categoryParent && !categoryData.categoryParent.categoryID)
            || !formaList.length
            || (categoryData.categoryLink && (categoryData.categoryLink.length < 4 || categoryData.categoryLink.length > 20))) {
            setBtnDisabled(true)
        }
        else {
            let status: string | boolean = false

            formaList.map((item, i) => {
                if(!item.name.length) status = 'namelength'

                if(item.key && item.key.length) {
                    if(item.key.length < 2 || item.key.length > 16) status = 'keylength'
                    if(!/^[a-z]*$/.test(item.key)) status = 'keytest'
                    
                    if(formaList.find((elem, index) => elem.key === item.key && i !== index)) status = 'keymatch'
                }
                else status = 'keynone'

                if(item.type === 'select') {
                    if(!item.params.list.length) status = 'selectlistlength'
                    else {
                        item.params.list.map(item => {
                            if(!item.title.length) status = 'selectlisttitlelength'
                        })
                    }
                }
                if(item.type === 'range' || item.type === 'rangemulti') {
                    if(isNaN(item.params.max)
                        || isNaN(item.params.min)
                        || isNaN(item.params.step)) status = 'rangenan'
                    else {
                        if(item.params.max < 0 || item.params.max < item.params.min
                            || item.params.min < 0 || item.params.min > item.params.max
                            || item.params.step < 0 || item.params.step > item.params.max) status = 'rangelength'
                    }
                }
                if(item.type === 'input') {
                    if(isNaN(item.params.maxLength)
                        || isNaN(item.params.minLength)) status = 'inputmaxminnan'
                    else {
                        if(item.params.maxLength < 0 || item.params.maxLength < item.params.minLength
                            || item.params.minLength < 0 || item.params.minLength > item.params.maxLength) status = 'inputmaxminlength'
                    }
                }
            })

            if(status === false) setBtnDisabled(status)
            else {
                setBtnDisabled(true)
                console.log(status)
            }
        }
    }, [categoryData, formaList])

    React.useMemo(() => {
        setLoader(true)
        setBtnLoadFormsDisabled(false)

        let parentID = parseInt(params.id)
        if((type === 'edit' || (type === 'add' && parentID))
            && (parentID < 1 || isNaN(parentID))) {
            setLoader(false)
            return setErrorPage({ code: 400 })
        }

        let categoryData: _CategoryDTO = {
            categoryID: -1,
            categoryName: 'Sample',
            categoryNameTranslate: {},
            categoryParent: null,
            categoryForms: [],
            categoryLink: '',
            categoryIcon: '/assets/category/default.png',
            categoryBackground: '/assets/category/default_background.jpg',
        }

        categoryData.categoryDefaultIcon = categoryData.categoryIcon
        categoryData.categoryDefaultBackground = categoryData.categoryBackground

        setCategoryData(categoryData)
        setFormaList([])

        if(parentID || type === 'edit') {
            console.log('load')
            API({
                url: '/defaultapi/category',
                type: 'get',
                data: {
                    id: parentID
                }
            }).done(result => {
                if(result.statusCode === 200) {
                    if(type === 'add' && !result.message.categorySubcategories) {
                        setLoader(false)
                        return setErrorPage({ code: 400 })
                    }

                    if(type === 'edit') categoryData = result.message
                    else categoryData.categoryParent = result.message

                    categoryData.categoryDefaultIcon = categoryData.categoryIcon
                    categoryData.categoryDefaultBackground = categoryData.categoryBackground

                    const formalist = categoryData.categoryForms.map((form: _CategoryForm) => {
                        form.__exists = true

                        if(form.type === 'select') {
                            let listValue: string[] = []

                            form.params.list.map(item => {
                                let traslates = ''

                                for(var key in item.translate) {
                                    traslates += key + ':' + item.translate[key] + ','
                                }
                                traslates = traslates.slice(0, traslates.length - 1)

                                if(traslates.length) listValue.push(item.title + ' / ' + traslates)
                                else listValue.push(item.title)
                            });
                            (form.params as _CategoryFormParams).listValue = listValue
                        }

                        return form
                    })

                    setCategoryData(categoryData)
                    setFormaList(formalist)

                    setLoader(false)
                }
                else {
                    if(result.statusCode === 404) {
                        setLoader(false)
                        setErrorPage({ code: 404 })
                    }
                    else notify(`(addcategories) /category: ` + result.message, { debug: true })
                }
            })
        }
        else setLoader(false)
    }, [])

    if(!loader && errorPage.code !== 0)return (
        <RouteErrorCode style={{marginTop: "128px"}} code={errorPage.code} text={errorPage.text}
            showbtn={errorPage.showbtn} btnurl={errorPage.btnurl} btnname={errorPage.btnname}
            icon={errorPage.icon} />
    )
    if(loader)return (
        <div style={{display: 'flex', justifyContent: 'center', padding: '124px 0'}}>
            <DotsLoader size={"medium"} />
        </div>
    )

    return (
        <div className={`route routeCategoriesManagement-${type}`} id="routeCategoriesManagement">
            {changeParentModal ? (
                <ModalCategories
                    onChoiceCategory={changeParent}
                    onClose={() => setChangeParentModal(false)}

                    allBtnName={Language("WITHOUT_CATEGORY")}

                    hide3thlevel={true}
                    hideChild={type === 'edit' && categoryData.categoryID}
                    hideID={type === 'edit' && categoryData.categoryID}
                />
            ) : ''}
            
            {deleteParentFormWarning != -1 ? (
                <Modal toggle={true} title={Language("WARNING")} icon={(<PiSealWarningFill />)}
                    body={Language("CATEGORY_ADD_WARNING_DELETE_PARENT_FORMA")}
                    buttons={[ Language("CANCEL"), Language("DELETE") ]}

                    onClick={() => {
                        setDeleteParentWarning(-1)
                        onDeleteForma(deleteParentFormWarning, true)
                    }}
                    onClose={() => setDeleteParentWarning(-1)}
                />
            ) : ''}

            {successModal ? (
                <Modal toggle={true} title={Language("SUCCESS")} icon={(<MdBookmarkAdded />)}
                    desciption={Language(type === 'add' ? "CATEGORY_ADD_SUCCESS_MODAL_DESC" : "CATEGORY_EDIT_SUCCESS_MODAL_DESC")}
                    body={Language("CATEGORY_ADD_SUCCESS_MODAL_BODY")}
                    buttons={[ Language("REFRESH") ]}

                    onClose={() => {
                        setNavigate("/categories")
                    }}
                    modalBodyOverflow={"visible"}
                />
            ) : ''}

            <header className="header">
                <div className="title">
                    <h1 className="routetitle">{Language(type === 'add' ? "ADMIN_CATEGORIES_CREATING" : "ADMIN_CATEGORIES_EDITING")}</h1>
                </div>
                <div className="actions">
                    <Button name={Language(type.toUpperCase())} disabled={disabled || btnDisabled} size={"medium"} classname='add' loader={btnLoader}
                        onClick={onSubmit}
                    />
                    <Link to="/categories">
                        <Button name={Language("CANCEL")} size={"medium"} classname='cancel' />
                    </Link>
                </div>
            </header>

            <div className="body">
                <div className="sectionblock block-name">
                    <div className="sectionblock-wrap">
                        <div className="backgroundwrap">
                            <div className="background">
                                <h1 className="title">Обложка</h1>
                                <div className={`backgroundImage ${backgroundLoader && 'loaderOn'}`}>
                                    <img className='imagecover' src={categoryData.categoryBackground} />

                                    <div className="actionPanel">
                                        <UploadDropFile id='categoriesEditBackground' types={"image/*"} onlyButton={true} onLoad={files => {
                                                const file: File = files[0]
                                                if(file.size > CONFIG.categoryBackgroundMaxSizeMB * CONFIG.mbtobyte)return notify(Language("CATEGORY_ADD_FORM_ICON_CATEGORY_ERROR_MAXSIZE", null, {}, CONFIG.categoryBackgroundMaxSizeMB))

                                                setBackgroundFile(file)
                                                setCategoryData({...categoryData, categoryBackground: URL.createObjectURL(file)})
                                            }}
                                            typesErrorMsg={Language("CATEGORY_ADD_FORM_ICON_CATEGORY_ERROR_MAXSIZE", null, {}, CONFIG.categoryBackgroundMaxSizeMB)}
                                            inputTitle={Language("CHANGE")}
                                        />

                                        {categoryData.categoryDefaultBackground !== categoryData.categoryBackground ? (
                                            <Button name={"Удалить"} icon={<MdDelete />} classname='deletecover'
                                                onClick={() => {
                                                    setBackgroundFile(null)
                                                    setCategoryData({...categoryData, categoryBackground: categoryData.categoryDefaultBackground})
                                                }}
                                            />
                                        ) : ''}
                                    </div>

                                    {backgroundLoader ? (
                                        <div className="loading">
                                            <CircleLoader type="big" />
                                            <h1>{Language("CATEGORY_ADD_FORM_ICON_CATEGORY_LOADING")}</h1>
                                        </div>
                                    ) : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="sectionblock-wrap">
                        <div className="namewrap">
                            <div className="name">
                                <Input type={"text"} value={categoryData.categoryName} title={Language("CATEGORY_ADD_FORM_NAME_CATEGORY")}
                                    data={{hint: (
                                        <span style={{ color: (categoryData.categoryName.length < 4 || categoryData.categoryName.length > 24) && 'var(--tm-color-red)'  }}>
                                            {Language("CATEGORY_ADD_FORM_NAME_CATEGORY_HINT")}
                                        </span>
                                    )}}
                                    onInput={event => {
                                        setCategoryData({...categoryData, categoryName: (event.target as HTMLInputElement).value})
                                    }}
                                />
                            </div>
                            <div className="translatename">
                                <div className="translatename-title">
                                    {Language("CATEGORY_ADD_FORM_TRANSLATE_NAME_CATEGORY")}
                                    <div className="hoverinfo" data-info={Language("CATEGORY_ADD_FORM_TRANSLATE_NAME_CATEGORY_HOVERINFO")}></div>
                                </div>
                                <div className="translatename-list">
                                    {window.languageList.map((item, i) => {
                                        return (
                                            <div key={i} className={`translatename-elem ${categoryData.categoryNameTranslate[item.code] && 'selected'}`}>
                                                <h1>{item.name}</h1>
                                                <Input type={'text'} value={categoryData.categoryNameTranslate[item.code] || ''} deleteLabel={true} data={{placeholder: "Имя"}}
                                                    onInput={event => {
                                                        let names = categoryData.categoryNameTranslate
                                                        const value: string = (event.target as HTMLInputElement).value

                                                        if(!value.length && names[item.code]) delete names[item.code]
                                                        else names[item.code] = value

                                                        setCategoryData({...categoryData, categoryNameTranslate: names})
                                                    }}
                                                />
                                            </div>
                                        )
                                    })}
                                </div>
                                <div className="translatename-desc">
                                    <span>
                                        {Language("CATEGORY_ADD_FORM_TRANSLATE_NAME_CATEGORY_HINT")}
                                    </span>
                                </div>
                            </div>
                            <div className="parentwrap">
                                <div className="sectionblock-title">
                                    {Language("CATEGORY_ADD_FORM_PARENT_CATEGORY")}
                                    <div className="hoverinfo" data-info={Language("CATEGORY_ADD_FORM_PARENT_CATEGORY_HOVERINFO")}></div>
                                </div>
                                <div className="parent">
                                    {(categoryData && !categoryData.categoryParent) ? (
                                        <div className="noparent">
                                            <h1>{Language("ADMIN_CATEGORIES_MANAGEMENT_PARENT_NONE_TITLE")}</h1>
                                            <Button name={Language("ADMIN_CATEGORIES_MANAGEMENT_PARENT_ADD_BTN")} onClick={() => setChangeParentModal(true)} />
                                        </div>
                                    ) : (
                                        <Table id="categoryManagementParentCategory" hiddentop={true} hiddenth={true}
                                            ths={[]}
                                            list={[
                                                [
                                                    { content: (<img style={{ borderRadius: '4px' }} src={categoryData.categoryParent.categoryIcon} />), width: "20px" },
                                                    { content: categoryData.categoryParent.categoryName },
                                                    { content: (<Link to={CONFIG.mainLink + '/' + categoryData.categoryParent.categoryLink} target='_blank' className='link'>{categoryData.categoryParent.categoryLink}</Link>) },
                                                    { dropdown: [
                                                        { content: Language("CATEGORY_ADD_FORM_PARENT_CATEGORY_ACTION_CHANGE"), onClick: () => setChangeParentModal(true) }
                                                    ], dropdownName: (
                                                        <Button name={Language("MANAGEMENT")} size={"min"} icon={(<IoIosArrowDown />)} />
                                                    ), width: "40px" }
                                                ]
                                            ]}
                                            searchBy={"name"} />
                                    )}
                                </div>
                            </div>
                            <div className="linkparent">
                                <div className="sectionblock-title">
                                    {Language("CATEGORY_ADD_FORM_LINK_CATEGORY")}
                                    <div className="hoverinfo" data-info={Language("CATEGORY_ADD_FORM_LINK_CATEGORY_HOVERINFO")}></div>
                                </div>
                                <Input type={'text'} value={categoryData.categoryLink} data={{hint: Language("CATEGORY_ADD_FORM_LINK_CATEGORY_HINT")}}
                                    onInput={event => {
                                        setCategoryData({...categoryData, categoryLink: (event.target as HTMLInputElement).value})
                                    }}
                                />
                            </div>
                        </div>
                        <div className="iconwrap">
                            <div className="icon">
                                <div className="image">
                                    <img src={categoryData.categoryIcon} />
                                </div>

                                {iconLoader ? (
                                    <div className="loading">
                                        <CircleLoader type="big" />
                                        <h1>{Language("CATEGORY_ADD_FORM_ICON_CATEGORY_LOADING")}</h1>
                                    </div>
                                ) : ''}
                            </div>

                            <div className="action">
                                <UploadDropFile id='categoriesEditIcon' types={"image/*"} onlyButton={true} onLoad={files => {
                                        const file: File = files[0]
                                        if(file.size > CONFIG.categoryIconMaxSizeMB * CONFIG.mbtobyte)return notify(Language("CATEGORY_ADD_FORM_ICON_CATEGORY_ERROR_MAXSIZE", null, {}, CONFIG.categoryIconMaxSizeMB))

                                        setIconFile(file)
                                        setCategoryData({...categoryData, categoryIcon: URL.createObjectURL(file)})
                                    }}
                                    typesErrorMsg={Language("CATEGORY_ADD_FORM_ICON_CATEGORY_ERROR_MAXSIZE", null, {}, CONFIG.categoryIconMaxSizeMB)}
                                    inputTitle={Language("LOAD")}
                                />

                                {categoryData.categoryIcon !== categoryData.categoryDefaultIcon ? (
                                    <Button name={Language("DELETE")} classname='delete' onClick={() => {
                                        setIconFile(null)
                                        setCategoryData({...categoryData, categoryIcon: categoryData.categoryDefaultIcon})
                                    }} />
                                ) : ''}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="sectionblock block-forms">
                    <div className="title">
                        <h1 className="routetitle">
                            {Language("CATEGORY_ADD_FORM_FORMALIST")}
                            <div className="hoverinfo" data-info={Language("CATEGORY_ADD_FORM_FORMALIST_HOVERINFO")}></div>
                        </h1>
                        <div className="actions">
                            {categoryData && categoryData.categoryParent && categoryData.categoryParent.categoryID ? (
                                <>
                                    <Button name={
                                            btnLoadFormsDisabled ? Language("ADMIN_CATEGORIES_MANAGEMENT_FORMS_BTN_PARENTLOAD_SUCCESS") :
                                            !categoryData.categoryParent.categoryForms.length ? Language("ADMIN_CATEGORIES_MANAGEMENT_FORMS_BTN_PARENTLOAD_NULL") :
                                            Language("Загрузить формы родителя")
                                        } disabled={!categoryData.categoryParent.categoryForms.length || btnLoadFormsDisabled} size={"medium"} type={"border"}
                                        onClick={() => {
                                            if(!categoryData.categoryParent.categoryForms.length
                                                || btnLoadFormsDisabled)return
            
                                            const forms: Array<Omit<CategoryForm, '__parent__'> & { __parent__?: boolean }> = [...categoryData.categoryParent.categoryForms]
                                            forms.map((item, i) => {
                                                forms[i].__parent__ = true
                                            })
            
                                            setBtnLoadFormsDisabled(true)
                                            setFormaList([...forms, ...formaList])
                                        }}
                                    />

                                    {categoryData.categoryParent.categoryForms.length ? (
                                        <div className="hoverinfo" data-info={Language("CATEGORY_ADD_FORM_FORMALIST_PARENT_EDIT_WARNING")}></div>
                                    ) : ''}
                                </>
                            ) : ''}
                        </div>
                    </div>
                    <div className="sectionblock-wrap">
                        <div className="list">
                            {formaList.map((item, i) => {
                                return (
                                    <div className="elem" key={i}>
                                        <div className={`forma forma-${item.type}`}>
                                            <div className="type">
                                                <h1>
                                                    {Language("CATEGORY_ADD_FORM_FORMALIST_FORMA_TYPE")}
                                                    {item.__parent__ ? (<span className="parentform">{Language("CATEGORY_ADD_FORM_FORMALIST_PARENT_INFO")}</span>) : ''}
                                                </h1>
                                                <div className="wrap">
                                                    <Select _type={item.type} _list={formTypes} onChange={event => {
                                                        onChangeFormaType(i, event[0])
                                                    }} />
                                                    <button className="delete" onClick={() => onDeleteForma(i)}>
                                                        <MdDelete />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="params">
                                                <RenderFormTitle element={item} setFormaList={setFormaList} id={i} categoryData={categoryData} />
                                                {item.type === 'input'? (<RenderFormInput element={item} setFormaList={setFormaList} id={i} />)
                                                    : item.type === 'select' ? (<RenderFormSelect element={item} setFormaList={setFormaList} id={i} />)
                                                    : item.type === 'range' ? (<RenderFormRange element={item} setFormaList={setFormaList} id={i} />)
                                                    : item.type === 'rangemulti' ? (<RenderFormRangeMulti element={item} setFormaList={setFormaList} id={i} />)
                                                    : ''}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}

                            <div className="elem null">
                                <Button name={Language("CATEGORY_ADD_FORM_FORMALIST_FORMA_ADD")} type={"hover"} onClick={onAddForma} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="sectionblock block-actions">
                    <div className="sectionblock-wrap">
                        <Button name={Language(type.toUpperCase())} disabled={disabled || btnDisabled} size={"big"} classname='add' loader={btnLoader}
                            onClick={onSubmit}
                        />
                        <Link to="/categories">
                            <Button name={Language("CANCEL")} size={"big"} classname='cancel' />
                        </Link>
                    </div>
                </div>
            </div>

            {navigate ? (<Navigate to={navigate} />) : ''}
        </div>
    )
}

interface RenderFormProps {
    element: _CategoryForm,
    id: number,

    type?: 'add' | 'edit',
    categoryData?: CategoryDTO,

    setFormaList: React.Dispatch<React.SetStateAction<_CategoryForm[]>>
}

function RenderFormTitle({
    element,
    id,

    type,
    categoryData,

    setFormaList
}: RenderFormProps) {
    return (
        <>
            {!element.__exists ? (
                <div className="param-elem flexstart">
                    <h1>{Language("CATEGORY_ADD_FORM_FORMALIST_FORMA_ELEM_KEY")}</h1>
                    <Input type={'text'} value={element.key} data={{hint: Language("CATEGORY_ADD_FORM_FORMALIST_FORMA_ELEM_KEY_HINT")}} deleteLabel={true}
                        onInput={event => {
                            setFormaList(old => {
                                old[id].key = (event.target as HTMLInputElement).value
                                return [...old]
                            })
                        }}
                    />
                </div>
            ) : ''}
            <div className="param-elem flexstart">
                <h1>{Language("CATEGORY_ADD_FORM_FORMALIST_FORMA_ELEM_NAME")}</h1>
                <Input type={"text"} value={element.name} data={{hint: (
                    <span style={{ color: (element.name.length < 4 || element.name.length > 20) && 'var(--tm-color-red)'  }}>
                        {Language("CATEGORY_ADD_FORM_FORMALIST_FORMA_ELEM_NAME_HINT")}
                    </span>
                )}} deleteLabel={true}
                    onInput={event => {
                        setFormaList(old => {
                            old[id].name = (event.target as HTMLInputElement).value
                            return [...old]
                        })
                    }}
                />
            </div>
            <div className="param-elem" style={{ justifyContent: 'flex-start', gap: "16px" }}>
                <h1>
                    {Language("CATEGORY_ADD_FORM_FORMALIST_FORMA_ELEM_IMPORTANT")}
                    <div className="hoverinfo" data-info={Language("CATEGORY_ADD_FORM_FORMALIST_FORMA_ELEM_IMPORTANT_HOVERINFO")}></div>
                </h1>
                <div className="inputcheckbox">
                    <input type='checkbox' className='medium' checked={element.important}
                        onChange={event => {
                            setFormaList(old => {
                                old[id].important = event.target.checked
                                return [...old]
                            })
                        }}
                    />
                </div>
            </div>
            <div className="translatename">
                <h1>
                    {Language("CATEGORY_ADD_FORM_FORMALIST_FORMA_ELEM_NAME_TRANSLATE")}
                    <div className="hoverinfo" data-info={Language("CATEGORY_ADD_FORM_FORMALIST_FORMA_ELEM_NAME_TRANSLATE_HOVERINFO")}></div>
                </h1>
                <div className="translatename-list">
                    {window.languageList.map((item, i) => {
                        return (
                            <div key={i} className={`translatename-elem ${element.nameTranslate[item.code] && 'selected'}`}>
                                <h1>{item.name}</h1>
                                <Input type={'text'} value={element.nameTranslate[item.code] || ''} deleteLabel={true} data={{placeholder: "Имя"}}
                                    onInput={event => {
                                        setFormaList(old => {
                                            const value: string = (event.target as HTMLInputElement).value

                                            if(!value.length) delete old[id].nameTranslate[item.code]
                                            else old[id].nameTranslate[item.code] = value

                                            return [...old]
                                        })
                                    }}
                                />
                            </div>
                        )
                    })}
                </div>
                <div className="translatename-desc">
                    <span>{Language("CATEGORY_ADD_FORM_FORMALIST_FORMA_ELEM_NAME_TRANSLATE_HINT")}</span>
                </div>
            </div>
        </>
    )
}
function RenderFormRangeMulti({
    element,
    id,

    setFormaList
}: RenderFormProps) {
    return (
        <>
            <div className="param-elem">
                <h1>{Language("CATEGORY_ADD_FORM_FORMALIST_FORMA_ELEM_RANGE_MIN")}</h1>
                <Input value={element.params.min} type={"number"} onInput={event => {
                    setFormaList(old => {
                        const value = parseInt((event.target as HTMLInputElement).value)

                        if(isNaN(value)) old[id].params.min = 1
                        else old[id].params.min = value

                        return [...old]
                    })
                }} />
            </div>
            <div className="param-elem">
                <h1>{Language("CATEGORY_ADD_FORM_FORMALIST_FORMA_ELEM_RANGE_MAX")}</h1>
                <Input value={element.params.max} type={"number"} onInput={event => {
                    setFormaList(old => {
                        const value = parseInt((event.target as HTMLInputElement).value)

                        if(isNaN(value)) old[id].params.max = 2
                        else old[id].params.max = value

                        return [...old]
                    })
                }} />
            </div>
            <div className="param-elem">
                <h1>
                    {Language("CATEGORY_ADD_FORM_FORMALIST_FORMA_ELEM_RANGE_STEP")}
                    <div className="hoverinfo" data-info={Language("CATEGORY_ADD_FORM_FORMALIST_FORMA_ELEM_RANGE_STEP_HOVERINFO")}></div>
                </h1>
                <Input value={element.params.step} type={"number"} onInput={event => {
                    setFormaList(old => {
                        const value = parseInt((event.target as HTMLInputElement).value)

                        if(isNaN(value)) old[id].params.step = 1
                        else old[id].params.step = value

                        return [...old]
                    })
                }} />
            </div>
        </>
    )
}
function RenderFormRange({
    element,
    id,

    setFormaList
}: RenderFormProps) {
    return (
        <>
            <div className="param-elem">
                <h1>{Language("CATEGORY_ADD_FORM_FORMALIST_FORMA_ELEM_RANGE_MIN")}</h1>
                <Input value={element.params.min} type={"number"} onInput={event => {
                    setFormaList(old => {
                        const value = parseInt((event.target as HTMLInputElement).value)

                        if(isNaN(value)) old[id].params.min = 1
                        else old[id].params.min = value

                        return [...old]
                    })
                }} />
            </div>
            <div className="param-elem">
                <h1>{Language("CATEGORY_ADD_FORM_FORMALIST_FORMA_ELEM_RANGE_MAX")}</h1>
                <Input value={element.params.max} type={"number"} onInput={event => {
                    setFormaList(old => {
                        const value = parseInt((event.target as HTMLInputElement).value)

                        if(isNaN(value)) old[id].params.max = 2
                        else old[id].params.max = value

                        return [...old]
                    })
                }} />
            </div>
            <div className="param-elem">
                <h1>
                    {Language("CATEGORY_ADD_FORM_FORMALIST_FORMA_ELEM_RANGE_STEP")}
                    <div className="hoverinfo" data-info={Language("CATEGORY_ADD_FORM_FORMALIST_FORMA_ELEM_RANGE_STEP_HOVERINFO")}></div>
                </h1>
                <Input value={element.params.step} type={"number"} onInput={event => {
                    setFormaList(old => {
                        const value = parseInt((event.target as HTMLInputElement).value)

                        if(isNaN(value)) old[id].params.step = 1
                        else old[id].params.step = value

                        return [...old]
                    })
                }} />
            </div>
        </>
    )
}
function RenderFormSelect({
    element,
    id,

    setFormaList
}: RenderFormProps) {
    function onAddList(value: string, key: number) {
        const nameTranslate = {}
        let [name, translate] = value.split('/')

        name = name.trim()
        if(translate) {
            translate = translate.trim()
            const translateArray = translate.split(',')

            translateArray.map(item => {
                let [lang, value] = item.split(':')
                if(lang && value) nameTranslate[lang] = value
            })
        }

        setFormaList(old => {
            old[id].params.list[key] = {
                title: name,
                translate: nameTranslate
            }

            return [...old]
        })
    }
    
    return (
        <>
            <div className="param-elem" style={{display: 'block'}}>
                <div className="param-elem-wrap flexstart" style={{justifyContent: 'flex-start'}}>
                    <h1>{Language("CATEGORY_ADD_FORM_FORMALIST_FORMA_ELEM_LIST_TITLE")}</h1>
                    <div className="listenter">
                        {(element.params as _CategoryFormParams).listValue ? (element.params as _CategoryFormParams).listValue.map((item, i) => {
                            return (
                                <Input key={i} value={item} type={'text'} deleteLabel={true} sendBtn={true} sendBtnIcon={(<AiFillDelete />)}
                                    onSendClick={() => {
                                        setFormaList(old => {
                                            (old[id].params as _CategoryFormParams).listValue.splice(i, 1)
                                            old[id].params.list.splice(i, 1)

                                            return [...old]
                                        })
                                    }}
                                    onInput={event => onAddList((event.target as HTMLInputElement).value, i)}
                                />
                            )
                        }) : ''}

                        <button className="add" onClick={() => {
                            setFormaList(old => {
                                (old[id].params as _CategoryFormParams).listValue.push('')
                                old[id].params.list.push({ title: '', translate: {} })

                                return [...old]
                            })
                        }}>
                            <MdOutlinePlaylistAdd />
                        </button>
                        <button className="add add-made">
                            <MdOutlinePlaylistAddCheck />
                        </button>
                    </div>
                </div>
                <span className="param-elem-desc">
                    {Language("CATEGORY_ADD_FORM_FORMALIST_FORMA_ELEM_LIST_HINT")}
                </span>
            </div>
        </>
    )
}
function RenderFormInput({
    element,
    id,

    setFormaList
}: RenderFormProps) {
    return (
        <>
            <div className="param-elem">
                <h1>{Language("CATEGORY_ADD_FORM_FORMALIST_FORMA_ELEM_INPUT_TITLE")}</h1>
                <Select _type={element.params.type} _list={[
                    ["text", Language("CATEGORY_ADD_FORM_FORMALIST_FORMA_ELEM_INPUT_SELECT_ELEM_TEXT")],
                    ["number", Language("CATEGORY_ADD_FORM_FORMALIST_FORMA_ELEM_INPUT_SELECT_ELEM_NUMBER")],
                    ["textarea", Language("CATEGORY_ADD_FORM_FORMALIST_FORMA_ELEM_INPUT_SELECT_ELEM_TEXTAREA")] ]}
                    onChange={event => {
                        setFormaList(old => {
                            old[id].params.type = event[0]
                            old[id].params.minLength = 0

                            if(event[0] === 'text') old[id].params.maxLength = defaultFormParams.input.maxLength
                            if(event[0] === 'textarea') old[id].params.maxLength = 1024

                            return [...old]
                        })
                    }}
                />
            </div>
            {element.params.type === 'number' ? (
                <>
                    <div className="param-elem">
                        <h1>{Language("CATEGORY_ADD_FORM_FORMALIST_FORMA_ELEM_INPUT_MIN")}</h1>
                        <Input value={element.params.minLength} type={"number"} onInput={event => {
                            setFormaList(old => {
                                old[id].params.minLength = parseInt((event.target as HTMLInputElement).value)
                                return [...old]
                            })
                        }} />
                    </div>
                    <div className="param-elem">
                        <h1>{Language("CATEGORY_ADD_FORM_FORMALIST_FORMA_ELEM_INPUT_MAX")}</h1>
                        <Input value={element.params.maxLength} type={"number"} onInput={event => {
                            setFormaList(old => {
                                old[id].params.maxLength = parseInt((event.target as HTMLInputElement).value)
                                return [...old]
                            })
                        }} />
                    </div>
                </>
            ) : (
                <div className="param-elem">
                    <h1>{Language("CATEGORY_ADD_FORM_FORMALIST_FORMA_ELEM_INPUT_LENGTH")}</h1>
                    <InputRange min={0} max={element.params.type === 'text' ? 255 : 1024} step={1} value={element.params.minLength} value2={element.params.maxLength} multi={true} onInput={values => {
                        setFormaList(old => {
                            old[id].params.minLength = values[0]
                            old[id].params.maxLength = values[1]

                            return [...old]
                        })
                    }} />
                </div>
            )}
        </>
    )
}