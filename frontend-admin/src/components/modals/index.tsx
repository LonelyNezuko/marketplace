import React from 'react'
import $ from 'jquery'
import { Link } from 'react-router-dom'

import './index.scss'

import { IoClose } from 'react-icons/io5'

import { ImPencil } from 'react-icons/im'

import { BsFlagFill } from 'react-icons/bs'
import { FaCashRegister } from 'react-icons/fa'
import { GiTeapot } from 'react-icons/gi'
import { Language } from '@modules/Language'
import internal from 'stream'
import PhoneTopHide from '@components/phoneTopHide'
import Button from '@components/button'

interface ModalProps {
    id?: string,
    classes?: string,

    toggle: boolean,
    style?: React.CSSProperties,
    
    title?: string,
    desciption?: React.JSX.Element | string,
    icon?: React.JSX.Element,

    nav?: Array<React.JSX.Element> | Array<string>,
    body: any,

    buttons?: any,
    buttonsBlock?: boolean,
    buttonsHref?: [ string?, string? ],

    navButtons?: Array<any>,
    navButtonsBlock?: Array<boolean>,

    onClose?(navPage?: number, setNavPage?: React.Dispatch<React.SetStateAction<number>>): void,
    onClick?(navPage?: number, setNavPage?: React.Dispatch<React.SetStateAction<number>>): void,

    modalBodyOverflow?: 'auto' | 'hidden' | 'scroll' | 'visible',
    
    hideCloseBtn?: boolean,
    phoneHideBtn?: boolean,

    phoneVersion?: boolean
}
export function Modal({
    id,
    classes,
    
    toggle = false,
    style,
    
    title,
    desciption,
    icon,

    nav,
    body,

    buttons = [],
    buttonsBlock,
    buttonsHref = [],

    navButtons,
    navButtonsBlock = [],

    onClose = () => {},
    onClick = () => {},

    modalBodyOverflow = 'auto',

    hideCloseBtn = false,
    phoneHideBtn = false,

    phoneVersion
}: ModalProps) {
    const [ navPage, setNavPage ] = React.useState(0)
    React.useEffect(() => {
        setNavPage(0)
    }, [toggle])

    const elementRef = React.useRef()

    const [ _body, _setBody ] = React.useState<any>(body)
    React.useEffect(() => {
        _setBody(body)
    }, [body])

    return (
        <div id={id} className={`modalindex ${classes} ${toggle && 'show'} ${(window.isPhone && phoneVersion) && 'modalindex-phoneVersion'}`} style={{display: !toggle ? 'none' : 'flex'}} onClick={event => {
            if(!$(event.target).is(elementRef.current)
                && !$(event.target).closest(elementRef.current).length
                && onClose) onClose()
        }}>
            <div className={`modalWrapper ${(phoneHideBtn && window.isPhone) ? 'phoneHideBtn' : ''}`} style={style} ref={elementRef}>
                {(phoneHideBtn && window.isPhone) ? (
                    <PhoneTopHide onHide={() => onClose()} />
                ) : ''}

                <header className="modalHeader">
                    {icon ? (
                        <div className="icon">
                            {icon}
                        </div>
                    ) : ''}
                    <div className="title">
                        <h1>{title}</h1>
                        {desciption ? (<span>{desciption}</span>) : ''}
                    </div>
                    {!hideCloseBtn &&
                        buttonsHref[0] ? (
                            <Link to={buttonsHref[0]} onClick={() => onClose()} className="close">
                                <IoClose />
                            </Link>
                        ) : (
                            <div onClick={() => onClose()} className="close">
                                <IoClose />
                            </div>
                        )}
                </header>
                {typeof nav === 'object' ? (
                    <div className="nav">
                        {nav.map((item, i) => {
                            return (<button onClick={() => setNavPage(i)} key={i} className={navPage === i ? 'selected' : ''}>{item}</button>)
                        })}
                    </div>
                ) : ''}
                {(_body && _body.map) ? (
                    _body.map((item, i) => {
                        return (
                            <div key={i} style={{ overflow: modalBodyOverflow, display: navPage !== i ? 'none' : 'block' }} className="modalindexbody">{item}</div>
                        )
                    })
                ) : (
                    !_body ? '' : (
                        <div style={{ overflow: modalBodyOverflow }} className="modalindexbody">{_body}</div> 
                    )
                )}
                {navButtons ? 
                    navButtons.map((item, i) => {
                        return (
                            <div key={i} className="buttons" style={{display: navPage !== i ? 'none' : 'flex'}}>
                                <Button name={item[0] || Language('CANCEL')} type={"transparent"} classname='modalbtncancel' onClick={() => onClose(navPage, setNavPage)} />
                                {item[1] ? (
                                    <Button name={item[1]} disabled={navButtonsBlock[i]} onClick={() => onClick(navPage, setNavPage)} />
                                ) : ''}
                            </div>
                        )
                    }) : 
                    buttons ? (
                        <div className="buttons">
                            {buttonsHref[0] ? (
                                <Link to={buttonsHref[0]} onClick={() => onClose(navPage, setNavPage)}>
                                    <Button name={buttons[0] || Language('CANCEL')} type={"transparent"} classname='modalbtncancel' onClick={() => onClose(navPage, setNavPage)} />
                                </Link>
                            ) : (
                                <Button name={buttons[0] || Language('CANCEL')} type={"transparent"} classname='modalbtncancel' onClick={() => onClose(navPage, setNavPage)} />
                            )}

                            {buttons[1] ? buttonsHref[1] ? (
                                <Link to={buttonsHref[1]} onClick={() => onClick(navPage, setNavPage)} className={`btn`}>
                                    <Button name={buttons[1]} disabled={buttonsBlock} onClick={() => onClick(navPage, setNavPage)} />
                                </Link>
                            ) :
                                (<Button name={buttons[1]} disabled={buttonsBlock} onClick={() => onClick(navPage, setNavPage)} />)
                            : ''}
                        </div>
                    ) : ''}
            </div>
        </div>
    )
}