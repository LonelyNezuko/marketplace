import React from 'react'
import $ from 'jquery'
import { Link } from 'react-router-dom'

import Input from '../input'
import { Language } from '@modules/Language'

import './index.scss'

import { IoSearchSharp } from "react-icons/io5";
import { BiDotsHorizontalRounded } from "react-icons/bi";
import DropdownMenu, { DropdownMenuListElement } from '@components/dropdownmenu'
import Button from '@components/button'

export type TableProperties = {
    id?: string,
    content?: React.JSX.Element | string | number,
    value?: string,
    width?: string | number,
    style?: React.CSSProperties,
    link?: string,
    bottom?: boolean,
    color?: string,
    dropdown?: Array<DropdownMenuListElement>,
    dropdownName?: React.JSX.Element | string
}

interface TableProps {
    id?: string,

    title?: string,
    titleHoverInfo?: string,
    titleDescription?: string,

    actions?: any,

    ths: Array<TableProperties>,
    list: Array<Array<TableProperties>>,

    searchBy?: string,

    hiddentop?: boolean,
    hiddenth?: boolean,

    design?: 'new'
}
export default function Table({
    id,

    title,
    titleHoverInfo,
    titleDescription,

    actions = [],

    ths = [],
    list = [],

    searchBy,

    hiddentop,
    hiddenth,

    design
}: TableProps) {
    function onSearch(text) {
        if(!searchBy)return

        text = text.toLowerCase()

        if(!text.length) $(`.table#${id} table td[data-id="${searchBy}"]`).parent().show()
        else $(`.table#${id} table td[data-id="${searchBy}"]`).each((i, item) => {
            const value = $(item).attr('data-value')
            
            if(value.toLowerCase().indexOf(text) !== -1) $(item).parent().show()
            else $(item).parent().hide()
        })
    }

    return (
        <div className={`table design-${design}`} id={id}>
            {!hiddentop ? (
                <header>
                    <div className="title">
                        <h1>
                            {title}
                            {titleHoverInfo ? (
                                <span className="hoverinfo" data-info={titleHoverInfo}></span>
                            ) : ''}
                        </h1>
                        {titleDescription ? (
                            <span className="description">{titleDescription}</span>
                        ) : ''}
                    </div>
                    <div className="rightblock">
                        <div className="search">
                            <Input deleteLabel={true} id={id + '-search'} type="text" name={id + '-search'} data={{
                                placeholder: Language("SEARCH")
                            }} icon={(<IoSearchSharp />)} onInput={event => {
                                onSearch((event.target as HTMLInputElement).value)
                            }} />
                        </div>
                        <div className="actions">
                            {actions.map((item, i) => {
                                return (<div key={i}>{item}</div>)
                            })}
                        </div>
                    </div>
                </header>
            ) : ''}
            
            <PhoneVersion hiddenth={hiddenth} ths={ths} list={list} design={design} id={id} />
            <DesktopVersion hiddenth={hiddenth} ths={ths} list={list} design={design} id={id} />
        </div>
    )
}


interface VersionsProps {
    hiddenth: boolean,
    ths: Array<TableProperties>,
    list: Array<Array<TableProperties>>,

    design: '' | 'new'
    id: string
}


function PhoneVersion({
    hiddenth,
    ths,
    list,

    design,
    id
}: VersionsProps) {
    if(!window.isPhone)return
    return (
        <div className="tableblock">
            {list.map((item, i) => {
                return (
                    <div key={i} className="tableblock-element">
                        {item.map((element, i) => {
                            return (
                                <div key={i} className="tableblock-element-item" data-id={element.id || ''} data-value={element.value || element.content}>
                                    <div className="tableblock-element-item-values">
                                        <h6 className="tableblock-element-item-title">{ths[i].content}</h6>
                                        <span className="tableblock-element-item-values-value">{element.content}</span>
                                    </div>

                                    {element.dropdown ? (
                                        <div className="tableblock-element-item-actions">
                                            {element.dropdown.map((action, i) => {
                                                return (
                                                    <Button name={action.content} />
                                                )
                                            })}
                                        </div>
                                    ) : ''}
                                </div>
                            )
                        })}
                    </div>
                )
            })}
        </div>
    )
}

function DesktopVersion({
    hiddenth,
    ths,
    list,

    design,
    id
}: VersionsProps) {
    if(window.isPhone)return
    return (
        <table>
            {!hiddenth ? (
                <tr>
                    {ths.map((item: TableProperties, i) => {
                        return (<th style={item.style || {}} key={i}>{item.content}</th>)
                    })}
                </tr>
            ) : ''}

            <tbody>
                {list.map((item, i) => {
                    return (
                        <>
                            {(design === 'new' && i % list.length) ? (
                                <tr className="margin"></tr>
                            ) : ''}
                            <tr key={i}>
                                {item.map((item: TableProperties, i) => {
                                    return (<TD element={item} key={i} id={id} />)
                                })}
                            </tr>
                        </>
                    )
                })}
            </tbody>
        </table>
    )
}


interface TDProps {
    element: TableProperties,
    key: React.Key,
    id: string
}
function TD({
    element,
    key,
    id
}: TDProps) {
    const [ dropdownMenuShow, setDropdownMenuShow ] = React.useState(false)

    if(element.dropdown)return (
        <td width={element.width || null} data-id={element.id || ''} data-value={element.value || element.content} data-key={key} style={element.style || {}}>

            <div className="td-dropdown">
                <button style={{background: 'transparent'}} onClick={() => setDropdownMenuShow(!dropdownMenuShow)}>
                    {element.dropdownName ? element.dropdownName : (<BiDotsHorizontalRounded />)}
                </button>

                <DropdownMenu list={element.dropdown} />
            </div>
        </td>
    )
    return (<td width={element.width || null} data-id={element.id || ''} data-value={element.value || element.content} data-key={key} style={element.style || {}}>{element.content}</td>)
}