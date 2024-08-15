import React from 'react'
import $ from 'jquery'

import './select.scss'

import { FcFeedback } from 'react-icons/fc'
import { Language } from '@modules/Language'

type SelectList = Array<any[] | SelectListObject>
export type SelectListObject<K = string | number> = {
    content: any,
    key: K,

    hidden?: boolean,
    parent?: string | number,
    icon?: React.JSX.Element | string,
    checked?: boolean
}

interface SelectProps {
    _type: any,
    _list: SelectList,

    id?: string,
    disabled?: boolean,

    title?: string,
    titleHoverinfo?: string,

    style?: React.CSSProperties,
    classes?: string,

    search?: boolean,

    onChange?(value: SelectListObject | Array<SelectListObject>): void,

    version?: number,
    checkboxes?: boolean
}
export function Select({
    _type,
    _list = [],

    id,
    disabled,

    title,
    titleHoverinfo,

    style,
    classes,

    search,

    onChange,

    version = 1,
    checkboxes = false
}: SelectProps) {
    const [ toggle, setToggle ] = React.useState(false)
    
    const selectRef = React.useRef<HTMLDivElement>()
    const [ selectRefInit, setSelectRefInit ] = React.useState(false)

    React.useEffect(() => {
        if(selectRefInit === true) {
            const element = selectRef.current

            const target = $(element).find('.selectWrapper')
            const ulElement = $(element).find('ul')
            const inputElement = $(element).find('input')

            if(!toggle) {
                target.removeClass('show')
                ulElement.fadeOut({ duration: 200, easing: 'linear' })

                if(search) setTimeout(() => inputElement.blur(), 100)
            }
            else {
                const
                    windowWidth = $(window).width(),
                    windowHeight = $(window).height(),
    
                    targetPosition = target.offset()
    
                if(targetPosition.top > windowHeight / 2) {
                    target.removeClass('ulbottom')
                    target.addClass('ultop')
                }
                else {
                    target.addClass('ulbottom')
                    target.removeClass('ultop')
                }
    
                if(targetPosition.left > windowWidth / 2) {
                    target.removeClass('ulleft')
                    target.addClass('ulright')
                }
                else {
                    target.addClass('ulleft')
                    target.removeClass('ulright')
                }

                target.addClass('show')
                $(selectRef.current).find('.searchNotfound').removeClass('show')

                ulElement.find('li').show()
                ulElement.fadeIn({ duration: 200, easing: 'linear' })

                if(search) setTimeout(() => inputElement.focus(), 100)
            }
        }
    }, [selectRefInit, toggle])

    React.useEffect(() => {
        if(selectRefInit === true) {
            function onSelectClosed(event) {
                if($(selectRef.current).attr('data-toggle') !== 'true')return
                if(checkboxes && ($(event.target).is(selectRef.current)
                    || $(selectRef.current).find('.selectValue').has(event.target).length
                    || $(selectRef.current).find('ul').has(event.target).length))return

                setTimeout(() => {
                    setToggle(false)
                }, 100)
            }

            if(selectRef.current) {
                $(document).on('mousedown', onSelectClosed)
            }
            return () => {
                if(selectRef.current) {
                    $(document).off('mousedown', onSelectClosed)
                }
            }
        }
    }, [selectRefInit])
    React.useEffect(() => {
        if(selectRef.current
            && !selectRefInit) setSelectRefInit(true)
    }, [selectRef])
    
    const [ selected, setSelected ] = React.useState<any>(version === 2 ? {} : [])
    const [ searchText, setSearchText ] = React.useState('')
    const [ searchFocus, setSearchFocus ] = React.useState(false)

    React.useEffect(() => {
        if(!toggle && selected) setSearchText(version === 2 ? selected.content : selected[1])
    }, [toggle])
    React.useEffect(() => {
        setTimeout(() => {
            setSearchText('')
            onSearch('')
        }, 100)
    }, [searchFocus])
    function onSearch(text) {
        if(!selectRef.current)return
        if(!text.length) {
            $(selectRef.current).find('.searchNotfound').removeClass('show')
            return $(selectRef.current).find('ul li').show()
        }

        let hideCount = 0
        list.map((item, i) => {
            if((version !== 2 && item[0].indexOf(text) === -1 && item[1].indexOf(text) === -1)
                || (version === 2 && item.key.indexOf(text) === -1 && item.content.indexOf(text) === -1)) {
                hideCount ++
                $(selectRef.current).find(`ul li:nth-child(${i + 1})`).hide()
            }
            else $(selectRef.current).find(`ul li:nth-child(${i + 1})`).show()
        })

        if(hideCount >= list.length) {
            $(selectRef.current).find('.searchNotfound').addClass('show')
        }
        else $(selectRef.current).find('.searchNotfound').removeClass('show')
    }
    
    const [ list, setList ] = React.useState([])
    const [ type, setType ] = React.useState('')

    React.useEffect(() => {
        if(!checkboxes) {
            list.map(item => {
                if((version === 2 && item.key === type)
                    || (version !== 2 && item[0] === type)) {
                    setSelected(item)
                }
            })
        }
        else {
            let tmpSelected = ''
            list.map(item => {
                if(item.checked && !item.selectedHide) tmpSelected += `${item.content}, `
            })

            tmpSelected = tmpSelected.slice(0, tmpSelected.length - 2)
            setSelected(tmpSelected)
        }
    }, [type, list])
    
    React.useEffect(() => {
        setType(_type)
    }, [_type])
    React.useEffect(() => {
        setList(_list)
    }, [_list])

    return (
        <div id={id} className={`select ${disabled && 'disabled'} ${classes}`} style={{...style}} ref={selectRef} data-toggle={toggle}>
            {title ? (
                <h5 className="selectTitle">
                    {title}
                    {titleHoverinfo ? (<span className="hoverinfo" data-info={titleHoverinfo}></span>) : ''}
                </h5>
            ) : ''}

            <div className="selectWrapper" data-value={type} data-title={version === 2 ? selected.content : selected[1]} onClick={() => {
                if(disabled)return
                setToggle(true)
            }}>
                {!checkboxes ? (
                    <>
                        {/* title icon */}
                        {((version === 2 ? selected.icon : selected[2])
                            && typeof (version === 2 ? selected.icon : selected[2]) !== 'string') ? (
                            <div className="icon">{version === 2 ? selected.icon : selected[2]}</div>
                        ) : ''}

                        {/* title plain text */}
                        {((version === 2 ? selected.icon : selected[2])
                            && typeof (version === 2 ? selected.icon : selected[2]) === 'string') ? (
                            <h6>{version === 2 ? selected.icon : selected[2]}</h6>
                        ) : ''}
                    </>
                ) : ''}

                <div className="selectValue">
                    {search ? (
                        <input type="text" value={searchFocus ? searchText : (version === 2 ? (checkboxes ? selected : selected.content) : (checkboxes ? selected : selected[1]))}
                            placeholder={toggle ? Language("SEARCH") : Language("NOT_INSTALL")}
                            onChange={event => {
                                if(!toggle) {
                                    setSearchText(version === 2 ? selected.content : selected[1])
                                    return event.preventDefault()
                                }

                                setSearchText(event.target.value)
                                onSearch(event.target.value)
                            }}
                            onFocus={() => setSearchFocus(true)} onBlur={() => setSearchFocus(false)} />
                    ) : (
                        <span>{version === 2 ? (checkboxes ? selected : selected.content) : (checkboxes ? selected : selected[1])}</span>
                    )}
                </div>

                <ul>
                    {list.map((item: SelectListObject, i) => {
                        if((version === 2 && item.hidden)
                            || (version !== 2 && item[3] === true))return // скрыть ли элемент из отрисовки

                        return (
                            <li onClick={event => {
                                if(onChange) {
                                    if(checkboxes) {
                                        const tmpList = [...list]

                                        tmpList[i].checked = !tmpList[i].checked
                                        tmpList.map(l => {
                                            if(l.parent === item.key) {
                                                l.checked = tmpList[i].checked
                                            }
                                        })

                                        if(item.parent && !tmpList[i].checked) {
                                            const parentIndex = tmpList.findIndex(l => l.key === item.parent)
                                            if(parentIndex !== -1) tmpList[parentIndex].checked = false
                                        }
                                        else if(item.parent && tmpList[i].checked) {
                                            let trueCounter = 0
                                            let trueLength = 0

                                            tmpList.map(l => {
                                                if(l.parent === item.parent) {
                                                    trueLength ++
                                                    if(l.checked === true) trueCounter ++
                                                }
                                            })

                                            const parentIndex = tmpList.findIndex(l => l.key === item.parent)
                                            if(trueCounter === trueLength && parentIndex !== -1) {
                                                tmpList[parentIndex].checked = true
                                            }
                                        }

                                        onChange(tmpList)
                                    }
                                    else onChange(item)
                                }
                            }} className={(version === 2 ? item.key : item[0]) === type ? 'selected' : ''} key={i} data-value={version === 2 ? item.key : item[0]}
                                style={{ paddingLeft: item.parent ? '38px' : null }}
                            >
                                {/* checkbox */}
                                {checkboxes ? (
                                    <div className="inputcheckbox" style={{ marginRight: '12px' }}>
                                        <input type="checkbox" checked={item.checked} onChange={() => {}} />
                                    </div>
                                ) : ''}

                                {/* icon */}
                                {((version === 2 ? item.icon : item[2]) && typeof (version === 2 ? item.icon : item[2]) !== 'string') ? (version === 2 ? item.icon : item[2]) : ''}

                                {/* plain text */}
                                {((version === 2 ? item.icon : item[2]) && typeof (version === 2 ? item.icon : item[2]) === 'string') ? (<h6>{(version === 2 ? item.icon : item[2])}</h6>) : ''}

                                {/* element */}
                                <span>{version === 2 ? item.content : item[1]}</span>
                            </li>
                        )
                    })}

                    <li className="searchNotfound">{Language("NOTHING_NOT_FOUND")}</li>
                </ul>
            </div>
        </div>
    )
}