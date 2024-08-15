import React from 'react'
import $ from 'jquery'
import { Link } from 'react-router-dom'

import Moment from 'moment'
import 'moment/min/locales'

import CONFIG from '@config'

import './index.scss'
import { RouteErrorCode, RouteErrorCodeProps } from '@routes/errorcodes'
import { CircleLoader } from '@components/circleLoader/circleLoader'
import { API } from '@modules/API'
import { notify } from '@modules/Notify'
import Input from '@components/input'
import { Language } from '@modules/Language'
import { Modal } from '@components/modals'

import { IoSearchSharp } from "react-icons/io5";
import Table, { TableProperties } from '@components/table'

import { IoIosArrowDown } from "react-icons/io";
import { MdDeleteSweep } from "react-icons/md";
import ModalLoader from '@components/modals/loader'
import { Alert } from '@components/alert'
import { formatImage } from '@functions/formatImage'
import CategoryDTO from '@dto/category.dto'
import { DropdownMenuListElement } from '@components/dropdownmenu'
import SetRouteTitle from '@modules/SetRouteTitle'
import Button from '@components/button'

export default function RouteCategoriesList() {
    SetRouteTitle(Language("ADMIN_ROUTE_TITLE_CATEGORIES_LIST"))
    Moment.locale(window.language)

    const [ loader, setLoader ] = React.useState(true)
    const [ errorPage, setErrorPage ] = React.useState<RouteErrorCodeProps>({ code: 0, text: '', showbtn: false })

    const [ categories, setCategories ] = React.useState<Array<CategoryDTO>>([])

    function load() {
        setLoader(true)
        API({
            url: '/defaultapi/category/all',
            type: 'get'
        }).done(result => {
            if(result.statusCode === 200) {
                setCategories(result.message)
                setLoader(false)
            }
            else {
                if(result.statusCode === 403) setErrorPage({ code: 403 })
                else notify("(categoriesList) /categories: " + result.message, { debug: true })
            }
        })
    }
    React.useMemo(() => {
        load()
    }, [])

    function sortToTable() {
        const output: Array<Array<TableProperties>> = []
        function set(category: CategoryDTO, sub = 0) {
            let creator: string | React.JSX.Element = 'System'
            let updator: string | React.JSX.Element = Language("NO")

            if(category.categoryCreator) creator = (<Link target="_blank" className='link' to={CONFIG.moderationPanelLink + '/users/' + category.categoryCreator.id}>{category.categoryCreator.name[0] + ' ' + category.categoryCreator.name[1]}</Link>)
            if(category.categoryUpdator) updator = (<Link target="_blank" className='link' to={CONFIG.moderationPanelLink + '/users/' + category.categoryUpdator.id}>{category.categoryUpdator.name[0] + ' ' + category.categoryUpdator.name[1]}</Link>)

            output.push([
                { content: (<img style={{ borderRadius: '4px', objectFit: 'cover' }} src={formatImage(category.categoryIcon, 45)} />) },
                { content: (<span style={{marginLeft: sub * 32 + 'px'}}>{category.categoryName}</span>), id: "name", value: category.categoryName },
                { content: category.productsCount },
                { content: (<Link to={CONFIG.mainLink + '/' + category.categoryLink} target='_blank' className='link'>{category.categoryLink}</Link>) },
                { content: Moment(category.categoryCreateAt).calendar() },
                { content: !category.categoryUpdateAt ? (<span className='color-grey'>{Language("CATEGORIES_LIST_TABLE_NOT_UPDATED")}</span>) : Moment(new Date(category.categoryUpdateAt)).calendar() },
                { content: (<>{creator} / {updator}</>) },
                { dropdown: [
                        category.categorySubcategories ? { content: Language("CATEGORIES_LIST_TABLE_DROPDOWN_ACTION_CREATE"), link: '/categories/new/' + category.categoryID } : null,
                        { content: Language("EDIT"), link: '/categories/edit/' + category.categoryID },
                        { content: Language("DELETE"), bottom: true, color: 'var(--tm-color-darkred)', onClick: () => setIsDelete(category.categoryID) }
                    ],
                    dropdownName: (
                        <Button name={Language("MANAGEMENT")} icon={(<IoIosArrowDown />)} size={"min"} />
                    )
                }
            ])
        }

        categories.map((item, i) => {
            set(item)
            if(item.categorySubcategories.length > 0) {
                item.categorySubcategories.map((item, i) => {
                    set(item, 1)
                    if(item.categorySubcategories.length > 0) {
                        item.categorySubcategories.map((item, i) => set(item, 2))
                    }
                })
            }
        })
        return output
    }

    const [ isDelete, setIsDelete ] = React.useState(null)
    const [ isDeleteLoader, setIsDeleteLoader ] = React.useState(false)

    return (
        <div className="route" id="categorieslist">
            {(!loader && errorPage.code !== 0) ? (
                <RouteErrorCode style={{marginTop: "128px"}} code={errorPage.code} text={errorPage.text}
                    showbtn={errorPage.showbtn} btnurl={errorPage.btnurl} btnname={errorPage.btnname}
                    icon={errorPage.icon} />
            ) : ''}

            {loader ? (
                <div style={{display: 'flex', justifyContent: 'center', padding: '124px 0'}}>
                    <CircleLoader type="megabig" color={'var(--tm-color)'} />
                </div>
            ) : ''}

            {(!loader && !errorPage.code && isDelete) ? (
                <Modal toggle={true} title={"Удаление категории"} icon={(<MdDeleteSweep />)}
                    body={`Вы действительно жалаете удалить эту категорию?\nПри удалении все дочерние категории станут глобальными`}
                    buttons={[ Language("CANCEL"), Language("DELETE") ]}

                    onClose={() => setIsDelete(false)}
                    onClick={() => {
                        setIsDelete(false)
                        setIsDeleteLoader(true)

                        API({
                            url: '/defaultapi/admin/category/delete',
                            type: 'delete',
                            data: {
                                id: isDelete
                            }
                        }).done(result => {
                            setIsDeleteLoader(false)

                            if(result.statusCode === 200) {
                                Alert("Категория была успешно удалена. Все дочерние категории стали глобальными")
                                load()
                            }
                            else if(result.statusCode === 403) setErrorPage({ code: 403 })
                            else notify(`(categories) /admin/category/delete: ` + result.message, { debug: true })
                        })
                    }}
                />
            ) : ''}
            {(!loader && !errorPage.code && isDeleteLoader) ? (
                <ModalLoader />
            ) : ''}

            {(!loader && !errorPage.code) ? (
                <section className="wrap">  
                    <div className="list">
                        <Table id="categoriesListTable" title={Language("NAV_NAVIGATION_TITLE_CATEGORIES")}
                            ths={[
                                { content: "", width: "20px" },
                                { content: Language("NAME") },
                                { content: Language("ADS") },
                                { content: Language("LINK") },
                                { content: Language("CATEGORIES_LIST_TABLE_HEADER_CREATEAT") },
                                { content: Language("CATEGORIES_LIST_TABLE_HEADER_UPDATEAT") },
                                { content: Language("CATEGORIES_LIST_TABLE_HEADER_CREATORUPDATOR") },
                                { content: "" }
                            ]}
                            list={sortToTable()}
                            searchBy={"name"}
                            actions={[ (<Link to="/categories/new">
                                <Button style={{ height: '100%' }} name={Language("CATEGORIES_LIST_TABLE_DROPDOWN_ACTION_CREATE")} type={"border"} />
                            </Link>) ]}
                        />
                    </div>
                </section>
            ) : ''}
        </div>
    )
}