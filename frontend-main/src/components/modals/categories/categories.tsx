import React from 'react'
import $ from 'jquery'
import { Link } from 'react-router-dom'

import './categories.scss'

import { CircleLoader } from '../../circleLoader/circleLoader'

import { IoMdClose } from 'react-icons/io'
import { Language } from '../../../modules/Language'

import { API, APISync } from '../../../modules/API'
import { notify } from '../../../modules/Notify'

import { isValidJSON } from '../../../modules/functions/isValidJSON'
import CategoryDTO from '@dto/category.dto'

interface ModalCategoriesProps {
    onChoiceCategory?(category: CategoryDTO | object): void,
    onClose?(): void,

    allBtn?: boolean,
    linkTarget?: boolean,

    openElement?: any
}
export function ModalCategories({
    onChoiceCategory,
    onClose,

    allBtn = true,
    linkTarget = false,

    openElement
}: ModalCategoriesProps) {
    const [ loader, setLoader ] = React.useState(true)

    const [ categories, setCategories ] = React.useState([])
    const [ categorySelected, setCategorySelected ] = React.useState(0)

    function onEnterLink(event, category, parent?) {
        if(event.ctrlKey)return window.open(event.target.href, "_blank")

        if(!linkTarget) event.preventDefault()

        if(parent) category.parent = parent
        if(onChoiceCategory) onChoiceCategory(category)
    }

    React.useMemo(() => {
        // api
        let storagelist: any = window.localStorage.getItem('modals_categories_list') || null
        if(process.env.REACT_APP_DEVELOPMENT_MODE === '1') storagelist = null

        if(storagelist) {
            if(isValidJSON(storagelist)) storagelist = JSON.parse(storagelist)
            else storagelist = null

            if(storagelist.expires
                && new Date(storagelist.expires) > new Date()
                && storagelist.list) {
                setCategorySelected(0)
                setCategories(storagelist.list)
                setLoader(false)
            }
            else storagelist = null
        }

        if(storagelist === null) {
            API({
                url: '/defaultapi/category/all',
                type: 'get'
            }).done(result => {
                if(result.statusCode === 200) {
                    setCategorySelected(0)
                    setCategories(result.message)
                    setLoader(false)

                    window.localStorage.setItem('modals_categories_list', JSON.stringify({
                        expires: new Date(+new Date + ((3600 * 3) * 1000)),
                        list: result.message
                    }))
                }
                else notify("(categories) /category/all: " + result.message, { debug: true })
            })
        }
    }, [])

    return (
        <div className="modal categories" onClick={event => {
            if(!$(event.target).is('.modal.categories .wrapper')
                && !$(event.target).closest('.modal.categories .wrapper').length
                && onClose) onClose()
        }}>
            <div className="wrapper">
                <div className="close" onClick={() => {
                    if(onClose) onClose()
                }}>
                    <IoMdClose />
                </div>

                <div className="listcategories">
                    <h1 className="title">{Language('CATEGORIES', "Категории")}</h1>
                    <div className="list" style={loader ? {height: "216px"} : {}}>
                        {loader ? (
                            <div style={{transform: 'translateY(-33px)'}}>
                                <CircleLoader type="big" color={'var(--tm-color)'} />
                            </div>
                        ) : ''}
                        {(!loader && allBtn) ? (
                            <section onClick={() => onChoiceCategory({})} className="elem">
                                <div className="icon">
                                    <img src="/assets/category/all.png" />
                                </div>
                                <div className="name">
                                    <h1>{Language('PRODUCTS_FILTERS_CATEGORY_ALL', "Все")}</h1>
                                </div>
                            </section>
                        ) : ''}
                        {categories.map((item, i) => {
                            if(loader)return (<></>)
                            return (
                                <Link to={`/${item.categoryLink}`} onClick={event => onEnterLink(event, item)} onMouseEnter={() => setCategorySelected(i)} key={i} className={`elem ${categorySelected === i && 'selected'}`}>
                                    <div className="icon">
                                        <img src={item.categoryIcon} />
                                    </div>
                                    <div className="name">
                                        <h1>{item.categoryNameTranslate[window.language] || item.categoryName}</h1>
                                        <span>{item.productsCount.toLocaleString()} {Language('ADS', 'Объявлений').toLowerCase()}</span>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                </div>
                <div className="subcategories">
                    <div className="wrap">
                        {(!loader && categories[categorySelected] && categories[categorySelected].categorySubcategories) ? 
                            categories[categorySelected].categorySubcategories.map((item, i) => {
                                return (
                                    <div key={i} className="subcategory">
                                        <Link onClick={event => onEnterLink(event, item)} to={`/${item.categoryLink}`} className="title link hover">
                                            {item.categoryNameTranslate[window.language] || item.categoryName}
                                        </Link>
                                        <div className="subslist">
                                            {item.categorySubcategories.map((category, i) => {
                                                return (
                                                    <section key={i} className="elem">
                                                        <Link onClick={event => onEnterLink(event, category, item)} to={`/${category.categoryLink}`} className="link hover">
                                                            {category.categoryNameTranslate[window.language] || category.categoryName}
                                                        </Link>
                                                    </section>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )
                            })
                        : ''}
                    </div>
                </div>
            </div>
        </div>
    )
}