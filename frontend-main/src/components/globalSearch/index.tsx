import React, { CSSProperties } from 'react'
import $ from 'jquery'
import parseQuery from 'parse-query'

import './index.scss'
import Input from '@components/input'
import { IoClose, IoSearchSharp } from 'react-icons/io5'
import { Language } from '@modules/Language'
import Button from '@components/button'
import AdCart, { AdCartLoaderDiv } from '@components/adcart'
import { API, APISync } from '@modules/API'
import { Navigate, useLocation } from 'react-router-dom'
import { Alert } from '@components/alert'
import { notify } from '@modules/Notify'
import CategoryDTO from '@dto/category.dto'
import { categoryGenerateLink } from '@modules/functions/categoryGenerateLink'
import UserHistory from '@modules/UserHistory'
import { CustomStorage } from '@modules/CustomStorage'
import ProductDTO from '@dto/product.dto'
import getRecommendationProducts from '@modules/GetRecommendationProducts'
import CONFIG from '@config'

let inputValueTimer: NodeJS.Timeout = null

export default function GlobalSearch() {
    const ref = React.useRef(null)
    const location = useLocation()

    const [ navigate, setNavigate ] = React.useState(null)
    React.useEffect(() => { if(navigate !== null) setNavigate(null) }, [navigate])

    const [ active, setActive ] = React.useState(false)
    const [ searchLoader, setSearchLoader ] = React.useState(false)

    const [ modalStyle, setModalStyle ] = React.useState<CSSProperties>({
        width: null,
        left: null,
        top: null
    })

    const [ searchHistory, setSearchHistory ] = React.useState<string[]>([])
    React.useEffect(() => {
        function customStorageUpdate(event: Event) {
            const storage = (event as any).detail.storage
            const storageRemoved = (event as any).detail.storageRemoved
        
            if(storage && storage.key === 'userSearchHistory') setSearchHistory(storage.value)
            else if(storageRemoved && storageRemoved.key === 'userSearchHistory') setSearchHistory([])
        }

        window.addEventListener('customStorageUpdate', customStorageUpdate)
        return () => {
            window.removeEventListener('customStorageUpdate', customStorageUpdate)
        }
    }, [])

    React.useMemo(() => {
        const customStorage = new CustomStorage()
        const searchHistoryTexts = customStorage.get('userSearchHistory')

        if(searchHistoryTexts) setSearchHistory(searchHistoryTexts)
        else setSearchHistory([])

        if(window.isPhone) setActive(true)
    }, [])

    const [ value, setValue ] = React.useState('')
    const [ searchValue, setSearchValue ] = React.useState<string[]>([])

    const [ recommendationProducts, setRecommendedProducts ] = React.useState<ProductDTO[]>(null)

    React.useEffect(() => {
        function modalStyle() {
            if(!ref.current)return
            setModalStyle({
                width: $(ref.current).width() + 'px',
                left: $(ref.current).offset().left + 'px',
                top: $(ref.current).offset().top + $(ref.current).height() - 4 + 'px'
            })
        }
        function onActiveFalse(event) {
            if(window.isPhone)return
            if(!active || !ref.current)return

            const element = $(ref.current)
            if(element.find('#globalSearchInput').is(event.target) || element.find('#globalSearchInput').has(event.target).length
                || element.find('#globalSearchModal .modalWrapper').is(event.target) || element.find('#globalSearchModal .modalWrapper').has(event.target).length)return
            
            setActive(false)
        }
        if(ref.current) modalStyle()

        window.addEventListener('resize', modalStyle)
        window.addEventListener('click', onActiveFalse)
        window.addEventListener('touchstart', onActiveFalse)

        return () => {
            window.removeEventListener('resize', modalStyle)
            window.removeEventListener('click', onActiveFalse)
            window.removeEventListener('touchstart', onActiveFalse)
        }
    }, ['', ref, active])
    React.useEffect(() => {
        if(value.length) {
            if(inputValueTimer) {
                clearTimeout(inputValueTimer)
                inputValueTimer = null
            }

            inputValueTimer = setTimeout(async () => {
                const result = await APISync({
                    url: '/defaultapi/search/possiblevalues',
                    type: 'get',
                    data: {
                        value
                    }
                })

                if(result.statusCode === 200) setSearchValue(result.message)
                else notify("(globalSearch) /search/possiblevalues: " + result.message, { debug: true })
            }, 300)
        }
    }, [value])
    React.useEffect(() => {
        const query = parseQuery(location.search)
        if(query.search) setValue(query.search)

        setRecommendedProducts(null);
        (async function() {
            const result = await getRecommendationProducts([], CONFIG.takeRecommendatedProductsOnGlobalSearch)
            if(result.length) setRecommendedProducts(result)
        }())
    }, [location])

    async function onSubmit(_value?: string) {
        if(!_value) _value = value
        else setValue(_value)

        if(searchLoader || !_value.length)return

        setSearchLoader(true)
        const result = await APISync({
            url: '/defaultapi/search/possiblecategory',
            type: 'get',
            data: {
                value: _value
            }
        })

        if(!window.isPhone) setActive(false)
        setSearchLoader(false)

        if(result.statusCode === 200) {
            const category: CategoryDTO = result.message
            setNavigate(categoryGenerateLink(category) + "?search=" + _value)

            UserHistory.add('search', null, null, _value)
            
            const customStorage = new CustomStorage()
            let searchHistory = customStorage.get('userSearchHistory')

            if(searchHistory) {
                if(searchHistory.indexOf(_value) === -1) searchHistory.push(_value)
            }
            else searchHistory = [ _value ]

            customStorage.set('userSearchHistory', searchHistory)
        }
        else {
            if(result.statusCode === 404) setNavigate('/search/notfound?s=' + _value)
            else notify("(globalSearch) /search/possiblecategory: " + result.message, { debug: true })
        }
    }

    function onDeleteSearchHistory(text: string) {
        if(!text || !text.length)return

        const customStorage = new CustomStorage()
        let searchHistory = customStorage.get('userSearchHistory')

        if(searchHistory) {
            const index = searchHistory.indexOf(text)
            if(index !== -1) searchHistory.splice(index, 1)
        }
        else searchHistory = []

        customStorage.set('userSearchHistory', searchHistory)

        if(window.jwtTokenExists) {
            API({
                url: '/defaultapi/user/searchHistory/remove',
                type: 'delete',
                data: {
                    text
                }
            }).done(result => {
                if(result.statusCode !== 200) notify("(globalSearch) /user/searchHistory/remove: " + result.message, { debug: true })
            })
        }
    }

    if(window.isPhone)return
    return (
        <div id='globalSearch' className={`${(active && ((!value.length && searchHistory.length) || (value.length && searchValue.length))) && 'active'}`} ref={ref}>
            <Input
                type={'text'}

                isLight={true}
                deleteLabel={true}

                icon={(<IoSearchSharp />)} id="globalSearchInput"
                iconAlign={'center'}

                data={{placeholder: Language("GLOBALSEARCH_SEND_PLACEHOLDER", "поиск")}}

                sendBtn={!window.isPhone}
                sendBtnName={searchLoader ? "Ищем..." : Language("GLOBALSEARCH_SEND_BTN", "поиск")}
                onSendClick={onSubmit}

                autoComplete='off'
                disabled={searchLoader}

                value={value}
                onInput={event => {
                    setValue((event.target as HTMLInputElement).value)
                }}
                
                onFocus={() => {
                    if(window.isPhone) setActive(true)
                }}
                onBlur={() => {
                    if(!window.isPhone) setActive(false)
                }}
            />

            {(active && ((!value.length && searchHistory.length) || (value.length && searchValue.length) || (!value.length && recommendationProducts))) ? (
                <div className="modal" id="globalSearchModal">
                    <div className="modalWrapper" style={modalStyle}>
                        {!value.length ? (
                            <div className="searchHistory blockListText">
                                <h6 className="blockTitle">История поиска</h6>
                                <div className="blockList_List">
                                    {searchHistory.map((item, i) => {
                                        return (
                                            <div className="blockListElem" key={i}>
                                                <span onClick={() => {
                                                    onSubmit(item)
                                                }}>{item}</span>
                                                <div className="delete">
                                                    <Button icon={(<IoClose />)} type={"transparent"} onClick={() => onDeleteSearchHistory(item)} />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ) : ''}

                        {value.length && searchValue.length ? (
                            <div className="searchValues blockListText">
                                <h6 className="blockTitle">Возможно Вы ищете...</h6>
                                <div className="blockList_List">
                                    {searchValue.map((item, i) => {
                                        return (
                                            <div className="blockListElem" key={i} onClick={() => onSubmit(item)}>
                                                <span dangerouslySetInnerHTML={{__html: item.replace(value.replace(/[^a-zA-Z0-9\s!?]+/g, '').trim(), `<span>` + value.replace(/[^a-zA-Z0-9\s!?]+/g, '').trim() + '</span>')}}></span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ) : ''}

                        {!value.length && recommendationProducts ? (
                            <div className="recomendationProducts blockList">
                                <div className="blockTitle">Возможно Вам понравится</div>
                                <div className="blockList_List">
                                    {recommendationProducts.map((item, i) => {
                                        return (<AdCart type={'vertical'} product={item} key={i}
                                            style={{
                                                width: `calc(100% / ${parseInt((modalStyle.width as any).replace('px', '')) < 700 ? 2 : parseInt((modalStyle.width as any).replace('px', '')) > 900 ? 4 : 3} - 9.2px)`,
                                                minWidth: `calc(100% / ${parseInt((modalStyle.width as any).replace('px', '')) < 700 ? 2 : parseInt((modalStyle.width as any).replace('px', '')) > 900 ? 4 : 3} - 9.2px)`
                                            }}
                                        />)
                                    })}
                                </div>
                            </div>
                        ) : ''}
                    </div>
                </div>
            ) : ''}


            {navigate ? (<Navigate to={navigate} />) : ''}
        </div>
    )
}