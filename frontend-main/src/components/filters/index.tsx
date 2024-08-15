import React from 'react'
import $ from 'jquery'
import parseQuery from 'parse-query'

import './index.scss'
import { Select, SelectListObject } from '../select/select'
import { renderCurrencyIcon } from '../../modules/functions/renderCurrencyIcon'

import Input from '../input';
import { Language } from '../../modules/Language';
import RatingStars from '../ratingstars';

import { CgClose } from "react-icons/cg";
import Button from '@components/button';
import { IoClose } from 'react-icons/io5';
import PhoneTopHide from '@components/phoneTopHide';
import CategoryDTO, { CategoryForm } from '@dto/category.dto'
import InputRange from '@components/inputrange'
import { API, APISync } from '@modules/API'
import { ProductFilters, enumProductModerationStatus, enumProductStatus } from '@dto/product.dto'
import { notify } from '@modules/Notify'
import { Alert } from '@components/alert'
import { Link, Navigate, useLocation } from 'react-router-dom'
import CategoryFiltersSearchFind from '@routes/category/filtersSearchFind'

import { MdOutlineKeyboardArrowLeft, MdOutlineKeyboardArrowRight } from "react-icons/md";
import { categoryGenerateLink } from '@modules/functions/categoryGenerateLink'

let changesSaveTimeout = null
interface FiltersProps {
    loader?: boolean,

    category: CategoryDTO,
    
    toggle?: boolean,
    onClose?: () => void
}
export default function Filters({
    loader,

    category,

    toggle,
    onClose
}: FiltersProps) {
    const location = useLocation()

    const [ navigate, setNavigate ] = React.useState(null)
    React.useEffect(() => { if(navigate !== null) setNavigate(null) }, [navigate])

    const filtersRef = React.useRef()
    const [ show, setShow ] = React.useState(false)

    const [ foundProductsCount, setFoundProductCount ] = React.useState(-1)

    const [ clearBtnShow, setClearBtnShow ] = React.useState(false)
    const [ submitBtnLoader, setSubmitBtnLoader ] = React.useState(false)
    
    const [ searchValues, setSearchValues ] = React.useState<ProductFilters>(null)
    const [ defaultValues, setDefaultValues ] = React.useState<ProductFilters>({
        price: ['', ''],
        sellerRating: -1
    })
    const [ values, setValues ] = React.useState<ProductFilters>({
        price: ['', ''],
        sellerRating: -1
    })


    async function getProductCount() {
        if(!category)return

        const tmpvalues = {...values}
        category.categoryForms.map(item => {
            if(item.type === 'range'
                && tmpvalues[item.key]) tmpvalues[item.key] = tmpvalues[item.key][0]
        })

        const result = await APISync({
            url: '/defaultapi/product/list/category',
            type: 'get',
            data: {
                categoryID: category.categoryID,
                filters: tmpvalues,
                onlycount: true
            }
        })

        if(result.statusCode === 200) {
            setSubmitBtnLoader(false)
            
            let count = parseInt(result.message)
            if(isNaN(count)) count = 0

            setFoundProductCount(count)
        }
        else notify('(filters) /product/list/category count: ' + result.message, { debug: true })
    }
    function onSubmit() {
        if(!category)return
        
        if(submitBtnLoader)return
        if(!foundProductsCount)return
        if(foundProductsCount === -1)return

        const tmpvalues = {...values}
        category.categoryForms.map((item: CategoryForm) => {
            if(tmpvalues[item.key]) {
                if(item.type === 'input'
                    && item.params.type === 'number'
                    && (tmpvalues[item.key] == '0' || tmpvalues[item.key] == 0)) delete tmpvalues[item.key]
                else if(item.type === 'select'
                    && !tmpvalues[item.key].length) delete tmpvalues[item.key]
                else if(item.type === 'range') {
                    if(tmpvalues[item.key][0] == '0' || tmpvalues[item.key][0] == 0) delete tmpvalues[item.key]
                    else tmpvalues[item.key] = tmpvalues[item.key][0]
                }
                else if(item.type === 'rangemulti'
                    && (parseInt(tmpvalues[item.key][0]) == item.params.min
                        && parseInt(tmpvalues[item.key][1]) == item.params.max)) delete tmpvalues[item.key]
            }
        })

        if(tmpvalues.sellerRating === -1) delete tmpvalues.sellerRating

        if(tmpvalues.price[0] != '' && tmpvalues.price[0] != '0') (tmpvalues as any).price_from = tmpvalues.price[0]
        if(tmpvalues.price[1] != '' && tmpvalues.price[1] != '0') (tmpvalues as any).price_to = tmpvalues.price[1]

        if(tmpvalues.searchText) tmpvalues.search = tmpvalues.searchText

        delete tmpvalues.price
        delete tmpvalues.searchText
        
        setNavigate(location.pathname + "?" + new URLSearchParams(tmpvalues as any).toString())
    }

    React.useEffect(() => {
        if(toggle === true) {
            setShow(true)

            if(window.innerWidth <= 670) {
                $(filtersRef.current).find('.filtersWrapper').css({ transform: 'translateY(100%)' })
                setTimeout(() => {
                    $(filtersRef.current).find('.filtersWrapper').css({ transform: 'none' })
                }, 50)
            }
        }
        else {
            if(window.innerWidth <= 670) {
                $(filtersRef.current).find('.filtersWrapper').css({ transform: 'translateY(100%)' })
                setTimeout(() => {
                    setShow(false)
                }, 300)
            }
            else setShow(false)
        }
    }, [toggle])

    React.useEffect(() => {
        if(category) {
            let tmp: ProductFilters = {
                price: ['', ''],
                sellerRating: -1
            }
            let tmpDefault: ProductFilters = {
                price: ['', ''],
                sellerRating: -1
            }

            category.categoryForms.map(item => {
                if(item.type === 'input'
                    && item.params.type === 'number') {
                    tmp[item.key] = item.params.minLength
                    tmpDefault[item.key] = item.params.minLength
                }
                else if(item.type === 'select') {
                    tmp[item.key] = []
                    tmpDefault[item.key] = []
                }
                else if(item.type === 'range'
                    || item.type === 'rangemulti') {
                    tmp[item.key] = [item.params.min, item.params.max]
                    tmpDefault[item.key] = [item.params.min, item.params.max]
                }
            })
            setDefaultValues({...tmpDefault})

            if(location.search) {
                tmp = {...CategoryFiltersSearchFind(parseQuery(location.search), category.categoryForms)}
                if(tmp.searchText) delete tmp.searchText

                if(parseQuery(location.search).search) tmp.searchText = parseQuery(location.search).search
                
                setSearchValues({...tmp})
            }
            else setSearchValues(null)

            setValues({...tmp})
        }
    }, [category])

    React.useEffect(() => {
        if(JSON.stringify(values) == JSON.stringify(defaultValues)) {
            setClearBtnShow(false)
            setFoundProductCount(-1)
        }
        else setClearBtnShow(true)

        if(searchValues
            && JSON.stringify(values) == JSON.stringify(searchValues)) setFoundProductCount(-1)

        if(changesSaveTimeout) {
            clearTimeout(changesSaveTimeout)
            setSubmitBtnLoader(false)
        }

        if(JSON.stringify(values) != JSON.stringify(defaultValues)
            || (searchValues && JSON.stringify(values) != JSON.stringify(searchValues))) {
            setSubmitBtnLoader(true)
            changesSaveTimeout = setTimeout(() => {
                getProductCount()
            }, 500)
        }
    }, [values])

    if(loader)return (<FiltersLoader />)
    return (
        <div className={`filters ${show && 'show'}`} ref={filtersRef}>
            <div className="filtersWrapper">
                {show && (
                    <div className="filtersTitle">
                        {window.innerWidth <= 670 && (
                            <PhoneTopHide onHide={() => {
                                if(onClose) onClose()
                            }} />
                        )}

                        <h6>{Language("FILTERS")}</h6>

                        {window.innerWidth > 670 && (
                            <div className="filtersCloseBtn">
                                <Button size={"medium"} icon={(<IoClose />)} type={"transparent"} onClick={() => {
                                    if(onClose) onClose()
                                }} />
                            </div>
                        )}
                    </div>
                )}

                <FiltersCategoryNav category={category} />

                {values.searchText ? (
                    <section className="filtersSection" id='filters-section-price'>
                        <div className="filtersSectionHeader">
                            <h3 className="filtersSectionTitle">{"Поисковой запрос"}</h3>
                        </div>
                        <div className="filtersOption">
                            <span className="filterOptionSearchText">{values.searchText}</span>
                        </div>
                    </section>
                ) : ''}

                <section className="filtersSection" id='filters-section-price'>
                    <div className="filtersSectionHeader">
                        <h3 className="filtersSectionTitle">{Language("CATEGORY_FILTERS_TITLE_PRICE")}</h3>
                    </div>
                    <div className="filtersOption twoinput">
                        <Input value={values.price[0]} type={"number"} deleteLabel={true} data={{ placeholder: `${Language("BY")}, ${renderCurrencyIcon(window.userdata.currency)}` }}
                            onInput={event => setValues({...values, price: [(event.target as HTMLInputElement).value, values.price[1]]})}
                        />
                        <Input value={values.price[1]} type={"number"} deleteLabel={true} data={{ placeholder: `${Language("ERE")}, ${renderCurrencyIcon(window.userdata.currency)}` }}
                            onInput={event => setValues({...values, price: [values.price[0], (event.target as HTMLInputElement).value]})}
                        />
                    </div>
                </section>

                {/* <section className="filtersSection">
                    <div className="filtersSectionHeader">
                        <h3 className="filtersSectionTitle">{Language("CATEGORY_FILTERS_TITLE_SELLER_RATING")}</h3>
                    </div>
                    <div className="filtersOption">
                        <Select version={2} _type={values.sellerRating} _list={[
                            { key: -1, content: Language("CATEGORY_FILTERS_TITLE_SELLER_RATING_NULL") },
                            { key: 5, content: (<RatingStars hidecount={true} size={"min"} stars={5} />) },
                            { key: 4, content: (<div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><RatingStars hidecount={true} size={"min"} stars={4} />{Language("CATEGORY_FILTERS_TITLE_SELLER_RATING_ANDUP")}</div>) },
                            { key: 3, content: (<div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><RatingStars hidecount={true} size={"min"} stars={3} />{Language("CATEGORY_FILTERS_TITLE_SELLER_RATING_ANDUP")}</div>) },
                            { key: 2, content: (<div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><RatingStars hidecount={true} size={"min"} stars={2} />{Language("CATEGORY_FILTERS_TITLE_SELLER_RATING_ANDUP")}</div>) },
                            { key: 1, content: (<div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><RatingStars hidecount={true} size={"min"} stars={1} />{Language("CATEGORY_FILTERS_TITLE_SELLER_RATING_ANDUP")}</div>) }
                        ]} onChange={(value: SelectListObject<number>) => setValues({...values, sellerRating: value.key})} />
                    </div>
                </section> */}

                {category ? category.categoryForms.map((form: CategoryForm, i) => {
                    if(values[form.key] === undefined)return

                    if(form.type === 'select') {
                        return (<FilterSelect key={i} name={form.name} list={form.params.list} value={values[form.key]} onChange={value => {
                            setValues(old => {
                                old[form.key] = [...value]
                                return {...old}
                            })
                        }} />)
                    }
                    else if(form.type === 'input'
                        && form.params.type === 'number') {
                        return (<FilterRange key={i} name={form.name} min={form.params.minLength} max={form.params.maxLength} step={1}
                            value={values[form.key]}
                            onChange={value => {
                                setValues(old => {
                                    old[form.key] = value[0]
                                    return {...old}
                                })
                            }} />)
                    }
                    else if(form.type === 'range'
                        || form.type === 'rangemulti') {
                        return (<FilterRange key={i} multi={form.type === 'rangemulti'} name={form.name} min={form.params.min} max={form.params.max} step={form.params.step}
                            value={values[form.key][0]}
                            value2={values[form.key][1]}
                            onChange={value => {
                                setValues(old => {
                                    if(form.type === 'range') value = [value[0], form.params.max]

                                    old[form.key] = value
                                    return {...old}
                                })
                            }}
                        />)
                    }
                    return
                }) : ''}

                <div className="filtersBottom">
                    {(foundProductsCount !== -1 || submitBtnLoader) && (
                        <Button size={"big"}    
                            name={foundProductsCount === -1 ?
                                Language("CATEGORY_FILTERS_SUBMIT_BTN_TITLE")
                                : foundProductsCount > 0 ?
                                Language("CATEGORY_FILTERS_SUBMIT_BTN_TITLE_COUNT", null, null, foundProductsCount)
                                : Language("CATEGORY_FILTERS_SUBMIT_BTN_TITLE_NONE")}
                            
                            description={foundProductsCount === 0 && Language("CATEGORY_FILTERS_SUBMIT_BTN_TITLE_DESC")}
                            type={"border"} id={"filters-submit"} loader={submitBtnLoader}
                            onClick={onSubmit}
                        />
                    )}
                    {clearBtnShow ? (
                        <Button size={"big"} name={Language("CATEGORY_FILTERS_SUBMIT_BTN_CLEAR")} type={"transparent"} icon={(<CgClose />)} id={"filters-clear"}
                            onClick={() => {
                                setValues({...defaultValues})
                            }}
                        />
                    ) : ''}
                </div>
            </div>

            {navigate ? (<Navigate to={navigate} />) : ''}
        </div>
    )
}


function FilterSelect({
    name,
    list,

    value,
    onChange
}) {
    const [ _list, _setList ] = React.useState<Array<SelectListObject>>([])

    React.useEffect(() => {
        const tmp = []

        list.map(item => {
            tmp.push({
                key: item.translate[window.language] || item.title,
                content: item.translate[window.language] || item.title,
                checked: value.indexOf(item.translate[window.language] || item.title) !== -1
            })
        })
        _setList([...tmp])
    }, [list, value])

    return (
        <section className="filtersSection">
            <div className="filtersSectionHeader">
                <h3 className="filtersSectionTitle">{name}</h3>
            </div>
            <div className="filtersOption">
                <Select version={2} _type={value} _list={_list} checkboxes={true} onChange={(val: Array<SelectListObject>) => {
                    const output = []

                    val.map(item => {
                        if(item.checked) output.push(item.content)
                    })

                    onChange(output)
                }} search={true} />
            </div>
        </section>
    )
}

interface FilterRangeProps {
    name: string,
    multi?: boolean,

    value: number,
    value2?: number,

    min: number,
    max: number,
    step: number,

    onChange: (value: [number, number]) => void
}
function FilterRange({
    name,
    multi,

    value,
    value2,

    min,
    max,
    step,

    onChange
}: FilterRangeProps) {
    return (
        <section className="filtersSection">
            <div className="filtersSectionHeader">
                <h3 className="filtersSectionTitle">{name}</h3>
            </div>
            <div className="filtersOption">
                <InputRange multi={multi} min={min} max={max} step={step} value2={value2} value={value} onInput={onChange} top={true} />
            </div>
        </section>
    )
}



function FiltersLoader() {
    return (
        <div className="filters _loader">
            {new Array(5).fill(0).map((item, i) => {
                return (
                    <section className="filtersSection" key={i}>
                        <div className="filtersSectionHeader">
                            <div className="_loaderdiv" style={{ width: '60%', height: '22px' }}></div>
                        </div>
                        <div className="filtersOption">
                            <div className="_loaderdiv" style={{ width: '100%', height: '50px', borderRadius: "6px" }}></div>
                        </div>
                    </section>
                )
            })}

            <div className="filtersBottom" style={{ background: 'transparent' }}>
                <div className="_loaderdiv" style={{ width: '100%', height: '56px', borderRadius: "6px", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="_loaderdiv" style={{ width: '70%', height: '20px' }}></div>
                </div>
            </div>
        </div>
    )
}


interface FiltersCategoryNavProps {
    category: CategoryDTO
}
function FiltersCategoryNav({
    category
}: FiltersCategoryNavProps) {
    const [ showAll, setShowAll ] = React.useState(false)

    return (
        <ul className="filtersCategoryNav">
            {category.categoryParent && (
                <Link to={categoryGenerateLink(category.categoryParent)} className="filtersCategoryNavElem back">
                    <section>
                        <MdOutlineKeyboardArrowLeft />
                        <span>{category.categoryParent.categoryNameTranslate[window.language] || category.categoryParent.categoryName}</span>
                    </section>
                </Link>
            )}

            <li className="filtersCategoryNavElem selected">
                <section>
                    <span>{category.categoryNameTranslate[window.language] || category.categoryName}</span>
                </section>
            </li>

            {category.categorySubcategories ? category.categorySubcategories.map((cat: CategoryDTO, i: number) => {
                if(i >= 6 && !showAll)return
                if(i >= 5 && !showAll)return (
                    <li className="filtersCategoryNavElem more" onClick={() => setShowAll(true)}>
                        <section>
                            <span>...{Language("MORE").toLowerCase()}</span>
                        </section>
                    </li>
                )
                return (<Link to={categoryGenerateLink(cat)} className="filtersCategoryNavElem forward" style={{ paddingLeft: !category.categoryParent ? '10px' : '28px' }}>
                    <section>
                        <span>{cat.categoryNameTranslate[window.language] || cat.categoryName}</span>
                        <MdOutlineKeyboardArrowRight />
                    </section>
                </Link>)    
            }) : ''}
        </ul>
    )
}