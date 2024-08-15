import React from 'react'
import $ from 'jquery'

import './index.scss'

import { IoEyeOutline } from 'react-icons/io5'
import { IoEyeOffOutline } from 'react-icons/io5'

import { BiSend } from 'react-icons/bi'
import { ImAttachment } from 'react-icons/im'

import { MdKeyboardArrowDown } from "react-icons/md";
import { Language } from '@modules/Language'

type InputData = {
    placeholder?: string,
    mark?: 'error' | 'accept' | '',
    error?: string,
    hint?: React.JSX.Element | string
}
export type InputAutoCompleteList = {
    content: React.JSX.Element,
    icon?: React.JSX.Element,
    description?: React.JSX.Element,
    onClick?(): void
}

interface InputProps {
    id?: string,
    type: 'text' | 'number' | 'textarea' | 'password' | 'email',
    title?: string,
    name?: string,

    data?: InputData,
    value?: string | number,

    maxLength?: number

    autoComplete?: string,
    autoFocus?: boolean,

    disabled?: boolean,
    inputDisabled?: boolean

    isLight?: boolean,

    style?: React.CSSProperties,
    deleteLabel?: boolean,

    icon?: React.JSX.Element,
    iconAlign?: string,
    iconOnClick?: Function | null,

    sendBtn?: boolean,
    sendBtnName?: string,
    sendBtnIcon?: React.JSX.Element,
    
    attachmentBtn?: boolean,

    choiceMenu?: { selected: any, list: Array<any> },
    choiceMenuSearch?: boolean,

    onChoiceMenu?(item: Array<any>): void,

    onInput?(event: React.FormEvent<HTMLDivElement>): void,
    onClick?(event: React.MouseEvent<HTMLDivElement, MouseEvent>): void
    onKeyDown?(event: React.KeyboardEvent<HTMLDivElement>): void,

    onSendClick?(): void,

    autoCompleteList?: Array<InputAutoCompleteList>,
    autoCompleteListLoader?: boolean
}
export default function Input({ id, type, title, name,
    data = {
        placeholder: null,
        mark: null,
        error: null,
        hint: null
    },
    
    value,
    maxLength,

    autoComplete,
    autoFocus,

    disabled,
    inputDisabled,

    isLight = false,
    
    style,
    deleteLabel = false,

    icon,
    iconAlign,
    iconOnClick,

    sendBtn = false,
    sendBtnName = null,
    sendBtnIcon = null,
    
    attachmentBtn = false,

    choiceMenu = null,
    choiceMenuSearch,

    onChoiceMenu,

    onInput,
    onClick,
    onKeyDown,

    onSendClick,

    autoCompleteList = [],
    autoCompleteListLoader = false
}: InputProps) {
    const elementRef = React.useRef()

    const [ _error, _setError ] = React.useState(data.error)
    const [ viewpassword, setViewpassword ] = React.useState(false)

    const [ _value, _setValue ] = React.useState(value)

    React.useEffect(() => {
        _setValue(value)
    }, [value])
    React.useEffect(() => {
        _setError(data.error)
    }, [data.error])

    const [ _choiceMenu, _setChoiceMenu ] = React.useState<{ selected: any, list: Array<any> }>(choiceMenu)
    const [ choiceMenuToggle, setChoiceMenuToggle ] = React.useState(false)
    const choiceMenuRef = React.useRef()

    const [ inputFocused, setInputFocused ] = React.useState(false)

    React.useEffect(() => {
        _setChoiceMenu(choiceMenu)
    }, [choiceMenu])
    React.useEffect(() => {
        function onChoicemenuClosed(event) {
            if(!choiceMenuToggle)return
            if(!choiceMenuRef || !choiceMenuRef.current)return

            const element = $(choiceMenuRef.current)
            if(element.is(event.target) || element.has(event.target).length)return

            setChoiceMenuToggle(false)
        }

        document.addEventListener('click', onChoicemenuClosed)
        document.addEventListener('touchstart', onChoicemenuClosed)
        document.addEventListener('wheel', onChoicemenuClosed)

        return () => {
            document.removeEventListener('click', onChoicemenuClosed)
            document.removeEventListener('touchstart', onChoicemenuClosed)
            document.removeEventListener('wheel', onChoicemenuClosed)
        }
    })


    const [ autoCompleteListPosition, setAutoCompleteListPosition ] = React.useState<'bottom' | 'top'>('bottom')
    React.useEffect(() => {
        if(elementRef.current) {
            const element = $(elementRef.current)
            const
                windowWidth = $(window).width(),
                windowHeight = $(window).height(),

                targetPosition = element.offset()

            if(targetPosition.top > windowHeight / 2) setAutoCompleteListPosition('top')
            else setAutoCompleteListPosition('bottom')
        }
    }, [elementRef])


    const contentEditableRef = React.useRef(null)
    React.useEffect(() => {
        if(contentEditableRef.current
            && value
            && contentEditableRef.current.innerText !== value) {
            contentEditableRef.current.innerText = value
        }
    }, [contentEditableRef, value])

    return (
        <div style={style || {}} className={`
                ${type === 'textarea' ? '' : 'input'}
                ${type}
                ${disabled ? 'disabled' : ''}
                ${(autoCompleteList.length || autoCompleteListLoader) && inputFocused ? 'autoCompleteListWrapper' : ''}
                autoCompleteListPosition-${autoCompleteListPosition}
            `}
            ref={elementRef}

            onClick={event => {
                if(onClick) onClick(event)
            }}
        >

            {!deleteLabel ? (
                <label htmlFor={id}>
                    <h1>{title}</h1>
                    {_error ? (<span className="error">{_error}</span>) : ''}
                </label>
            ) : ''}
            <div className={`
                inputGlobalWrapper
                ${(choiceMenu && type !== 'textarea') ? "choicemenu-enable" : ''}
                ${(_value || isLight) ? 'value' : ''}
                ${data.mark ? 'global-mark-' + data.mark : ''}`}>
                <div className={`
                    inputWrapper
                    ${data.mark ? 'mark-' + data.mark : ''}
                    ${(_value || isLight) ? 'value' : ''}
                    ${(sendBtn && sendBtnName) ? 'issendbtn' : ''}`}>
                    {icon ? (
                        <div style={iconAlign ? {alignSelf: iconAlign} : {}} className="icon" onClick={() => {
                            if(iconOnClick) iconOnClick()
                        }}>
                            {icon}
                        </div>
                    ) : ''}

                    {attachmentBtn ? (
                        <ImAttachment className="attachment" />
                    ) : ''}

                    {type === 'textarea' ? (
                        <div contentEditable={true} aria-multiline={true} className={`textareainput ${disabled || inputDisabled ? 'disabled' : ''}`} id={id} placeholder={data.placeholder || ' '}
                            onInput={event => {
                                if(disabled || inputDisabled)return

                                if(onInput) onInput(event)
                                _setValue((event.target as HTMLInputElement).innerText)
                            }}
                            onKeyDown={event => {
                                if(onKeyDown) onKeyDown(event)
                            }}

                            suppressContentEditableWarning={true}
                            ref={contentEditableRef}
                        >
                        </div>
                    ) : (
                        <input maxLength={maxLength} autoFocus={autoFocus} autoComplete={autoComplete} name={name || ''} value={_value} type={viewpassword ? 'text' : type} id={id} placeholder={data.placeholder || ' '}
                            disabled={disabled || inputDisabled}
                            onChange={event => {
                                if(disabled || inputDisabled)return

                                if(maxLength && event.target.value.length > maxLength) {
                                    event.target.value = event.target.value.slice(0, maxLength)
                                }

                                if(onInput) onInput(event)
                                _setValue(event.target.value)
                            }}

                            readOnly={autoComplete === 'off'}

                            onFocus={event => {
                                setInputFocused(true)
                                event.target.removeAttribute('readonly')
                            }}
                            onBlur={() => {
                                setTimeout(() => setInputFocused(false), 100)
                            }}
                        />
                    )}

                    {(sendBtn && (!sendBtnName && !sendBtnIcon)) ? (
                        <BiSend className="send" onClick={() => {
                            if(onSendClick) onSendClick()
                        }} />
                    ) : ''}
                    {(sendBtn && (sendBtnIcon && !sendBtnName)) ? (
                        <div className="send" onClick={() => {
                            if(onSendClick) onSendClick()
                        }}>
                            {sendBtnIcon}
                        </div>
                    ) : ''}
                    {(sendBtn && (sendBtnName && !sendBtnIcon)) ? (
                        <button className={`sendbtn btn`} disabled={(_value || isLight) ? false : true} onClick={() => {
                            if(onSendClick) onSendClick()
                        }}>
                            {sendBtnName}
                        </button>
                    ) : ''}

                    {type === 'password' ?
                        !viewpassword ? (<IoEyeOffOutline onClick={() => setViewpassword(true)} className="viewpassword" />)
                        : (<IoEyeOutline onClick={() => setViewpassword(false)} className="viewpassword" />)
                    : ''}
                </div>

                {(_choiceMenu && type !== 'textarea') ? (
                    <div ref={choiceMenuRef} className={`choicemenu ${choiceMenuToggle ? 'choicemenu-show' : ''}`}
                        onClick={() => {
                            if(!choiceMenuToggle) setChoiceMenuToggle(true)
                        }}>
                        <div className="choicemenu-selected">
                            <div className="choicemenu-title">{_choiceMenu.selected}</div>
                            <div className="choicemenu-arrow">
                                <MdKeyboardArrowDown />
                            </div>
                        </div>

                        <div className="choicemenu-list">
                            {choiceMenuSearch ? (
                                <div className="choicemenu-search">
                                    <Input type={"text"} deleteLabel={true} data={{ placeholder: Language("SEARCH") }}
                                        onInput={event => {
                                            const value = (event.target as HTMLInputElement).value
                                            const input = $(elementRef.current)

                                            if(!value) input.find('.choicemenu .choicemenu-list .choicemenu-elem').show()
                                            else {
                                                _choiceMenu.list.map((item, i) => {
                                                    if((item[0].indexOf && item[0].indexOf(value) !== -1)
                                                        || item[1].indexOf(value) !== -1) {
                                                        input.find(`.choicemenu .choicemenu-list .choicemenu-elem:nth-child(${i + 2})`).show()
                                                    }
                                                    else input.find(`.choicemenu .choicemenu-list .choicemenu-elem:nth-child(${i + 2})`).hide()
                                                })
                                            }
                                        }}
                                    />
                                </div>
                            ) : ''}

                            {_choiceMenu.list.map((item, i) => {
                                return (<div onClick={() => {
                                    if(onChoiceMenu) onChoiceMenu(item)
                                    setChoiceMenuToggle(false)
                                }} key={i} className="choicemenu-elem">
                                    {item[0]}
                                </div>)
                            })}
                        </div>
                    </div>
                ) : ''}

                {(autoCompleteList.length || autoCompleteListLoader) && inputFocused ? (
                    <div className={`autoCompleteList ${autoCompleteListPosition}`}>
                        <div className="list">
                            {autoCompleteListLoader ? 
                                new Array(3).fill(0).map((item, i) => {
                                    return (
                                        <div className="elem" key={i}>
                                            <div className="_loaderdiv" style={{ width: '50%', height: '26px', borderRadius: '4px' }}></div>
                                            <div className="_loaderdiv" style={{ width: '20%', height: '16px', borderRadius: '4px', marginLeft: '8px' }}></div>
                                        </div>
                                    )
                                })
                            : ''}

                            {!autoCompleteListLoader && autoCompleteList.map((item: InputAutoCompleteList, i) => {
                                return (
                                    <div className="elem" key={i} onClick={() => {
                                        if(item.onClick) item.onClick()
                                    }}>
                                        <section>
                                            {item.icon}
                                            <h1>{item.content}</h1>
                                        </section>
                                        <section>
                                            <span>{item.description}</span>
                                        </section>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ) : ''}
            </div>

            {data.hint ? (
                <span className="hint">{data.hint}</span>
            ) : ''}
        </div>
    )
}