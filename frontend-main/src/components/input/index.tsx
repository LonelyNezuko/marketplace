import React from 'react'
import $ from 'jquery'

import './index.scss'

import { IoEyeOutline } from 'react-icons/io5'
import { IoEyeOffOutline } from 'react-icons/io5'

import { BiSend } from 'react-icons/bi'
import { ImAttachment } from 'react-icons/im'

import { MdKeyboardArrowDown } from "react-icons/md";
import { Language } from '@modules/Language'
import Button from '@components/button'
import UploadDropFile from '@components/uploadDropFile'
import File from '@components/file'

type InputData = {
    placeholder?: string,
    mark?: 'error' | 'accept' | '',
    error?: string,
    hint?: React.JSX.Element | string
}
type InputAutoCompleteList = {
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

    fileList?: File[]
    fileLimit?: number
    fileSizeLimit?: number

    fileAccess?: string | Array<string>
    fileAccessErrorMsg?: string

    choiceMenu?: { selected: any, list: Array<any> },
    choiceMenuSearch?: boolean,

    onChoiceMenu?(item: Array<any>): void,

    onInput?(event: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>): void,
    onKeyDown?(event: React.KeyboardEvent<HTMLInputElement> | React.KeyboardEvent<HTMLTextAreaElement>): void,

    onSendClick?(): void,

    onFocus?(): void,
    onBlur?(): void,

    onFileUpload?(files: File[]): void
    onFileDelete?(file: File): void

    autoCompleteList?: Array<InputAutoCompleteList>,
    autoCompleteListLoader?: boolean

    textareaDefaultRows?: number
    textareaMaxRows?: number

    ref?: any
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
    
    fileList,
    fileLimit = 10,
    fileSizeLimit,

    fileAccess,
    fileAccessErrorMsg,

    choiceMenu = null,
    choiceMenuSearch,

    onChoiceMenu,

    onInput,
    onKeyDown,

    onSendClick,

    onFocus,
    onBlur,

    onFileUpload,
    onFileDelete,

    autoCompleteList = [],
    autoCompleteListLoader = false,

    textareaDefaultRows = 1,
    textareaMaxRows = 1
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

        if(type === 'textarea'
            && autoFocus
            && elementRef.current) $(elementRef.current).find('.textareainput').focus()

        return () => {
            document.removeEventListener('click', onChoicemenuClosed)
            document.removeEventListener('touchstart', onChoicemenuClosed)
            document.removeEventListener('wheel', onChoicemenuClosed)
        }
    })


    const contentEditableRef = React.useRef(null)
    React.useEffect(() => {
        if(contentEditableRef.current
            && contentEditableRef.current.value !== value) {
            contentEditableRef.current.value = value
        }
    }, [contentEditableRef, value])

    const [ textareaCurrentRows, setTextareaCurrentRows ] = React.useState(textareaDefaultRows)
    React.useEffect(() => {
        const element = $(contentEditableRef.current)
        if(contentEditableRef && element && typeof _value === 'string') {
            const nCount = (_value as string).linesCount()
            if(nCount <= textareaMaxRows
                || nCount < textareaCurrentRows) {
                setTextareaCurrentRows(nCount)
            }
        }
    }, [contentEditableRef, _value])


    const attachmentMenuRef = React.useRef(null)
    const [ attachmentMenu, setAttachmentMenu ] = React.useState(false)
    React.useEffect(() => {
        function onAttachmentMenuClosed(event) {
            if(!attachmentMenuRef || !attachmentBtn || !attachmentMenu)return
            if($(attachmentMenuRef.current).is(event.target) || $(attachmentMenuRef.current).has(event.target).length)return

            setTimeout(() => {
                setAttachmentMenu(false)
            }, 100)
        }

        document.addEventListener('mousedown', onAttachmentMenuClosed)
        document.addEventListener('touchstart', onAttachmentMenuClosed)
        document.addEventListener('wheel', onAttachmentMenuClosed)

        return () => {
            document.removeEventListener('mousedown', onAttachmentMenuClosed)
            document.removeEventListener('touchstart', onAttachmentMenuClosed)
            document.removeEventListener('wheel', onAttachmentMenuClosed)
        }
    }, [attachmentMenuRef, attachmentBtn, attachmentMenu])

    return (
        <div style={style || {}} className={`
            ${type === 'textarea' ? '' : 'input'}
            ${type}
            ${disabled ? 'disabled' : ''}
            ${autoCompleteList.length && inputFocused ? 'autoCompleteListWrapper' : ''}
            ${attachmentMenu && 'attachmentMenuShow'}
        `}
            ref={elementRef}
        >
            {attachmentBtn ? (
                <div className="attachmentMenu" ref={attachmentMenuRef}>
                    <UploadDropFile id={"inputFileLoader"} onLoad={files => {
                        onFileUpload?.(files)
                        setAttachmentMenu(false)
                    }} maxFiles={fileLimit} filesLoaded={fileList && fileList.length}
                        types={fileAccess}
                        typesErrorMsg={fileAccessErrorMsg}
                        maxFileSize={fileSizeLimit}
                    />
                </div>
            ) : ''}

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
                ${data.mark ? 'global-mark-' + data.mark : ''}`}

                onClick={event => {
                    const element = $(event.target)
                    const currentElement = $(event.currentTarget)

                    if((type === 'textarea'
                        && currentElement.find('.textarea').is(":focus"))
                    || (type !== 'textarea'
                        && currentElement.find('input').is(":focus")))return

                    if(element.is('.send') || element.has('.send').length
                        || element.is('.sendbtn') || element.has('.sendbtn').length
                        || element.is('.choicemenu') || element.has('.choicemenu').length
                        || element.is('.autoCompleteList') || element.has('.autoCompleteList').length)return

                    if(type === 'textarea') currentElement.find('.textarea').focus()
                    else currentElement.find('input').focus()
                }}
            >
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
                        <button className="attachmentBtn" onClick={() => !attachmentMenu && setAttachmentMenu(true)}>
                            <ImAttachment />
                        </button>
                    ) : ''}

                    {type === 'textarea' ? (
                        <textarea
                            className={`textareainput ${disabled ? 'disabled' : ''}`} id={id}
                            placeholder={data.placeholder || null}
                            autoFocus={autoFocus} autoComplete={autoComplete} name={name || ''} disabled={disabled}

                            onChange={event => {
                                if(maxLength && event.target.value.length > maxLength) {
                                    event.target.value = event.target.value.slice(0, maxLength)
                                }

                                if(onInput) onInput(event)
                                _setValue(event.target.value)
                            }}
                            onKeyDown={event => {
                                if(onKeyDown) onKeyDown(event)
                                if(event.key === 'Enter') {

                                }
                            }}

                            rows={1}
                            style={{ height: textareaCurrentRows * 23 + "px", overflow: textareaCurrentRows < textareaMaxRows ? 'hidden' : 'auto' }}

                            ref={contentEditableRef}

                            onFocus={() => {
                                setInputFocused(true)
                                onFocus?.()
                            }}
                            onBlur={() => {
                                setTimeout(() => setInputFocused(false), 100)
                                onBlur?.()
                            }}
                        />

                        // <div contentEditable={true} aria-multiline={true} className={`textareainput ${disabled ? 'disabled' : ''}`} id={id} aria-placeholder={data.placeholder || ' '}
                        //     onInput={event => {
                        //         if(onInput) onInput(event)
                        //         _setValue((event.target as HTMLInputElement).innerText)
                        //     }}
                        //     onKeyDown={event => {
                        //         if(onKeyDown) onKeyDown(event)
                        //     }}

                        //     aria-valuetext={value as string}

                        //     suppressContentEditableWarning={true}
                        //     ref={contentEditableRef}

                        //     onFocus={() => {
                        //         setInputFocused(true)
                        //         onFocus?.()
                        //     }}
                        //     onBlur={() => {
                        //         setTimeout(() => setInputFocused(false), 100)
                        //         onBlur?.()
                        //     }}
                        // >
                        // </div>
                    ) : (
                        <input maxLength={maxLength} autoFocus={autoFocus} autoComplete={autoComplete} name={name || ''} disabled={disabled} value={_value} type={viewpassword ? 'text' : type} id={id} placeholder={data.placeholder || ' '}
                            onChange={event => {
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

                                onFocus?.()
                            }}
                            onBlur={() => {
                                setTimeout(() => setInputFocused(false), 100)
                                onBlur?.()
                            }}

                            onKeyDown={event => {
                                if(event.key === 'Enter') onSendClick?.()
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
                        <Button name={sendBtnName} classname='sendbtn'
                            size={"min"}
                            onClick={() => {
                                onSendClick?.()
                            }}
                            disabled={(_value || isLight) ? false : true}
                        />
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
                                            const value = (event.target as HTMLInputElement).value.toLowerCase()
                                            const input = $(elementRef.current)

                                            if(!value) input.find('.choicemenu .choicemenu-list .choicemenu-elem').show()
                                            else {
                                                _choiceMenu.list.map((item, i) => {
                                                    if((item[0].indexOf && item[0].toLowerCase().indexOf(value) !== -1)
                                                        || item[1].toLowerCase().indexOf(value) !== -1) {
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

                {autoCompleteList.length && inputFocused ? (
                    <div className="autoCompleteList">
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

            {fileList && fileList.length ? (
                <div className="fileList">
                    {fileList.map((file, i) => {
                        return (
                            <File src={null} name={file.name} weight={file.size}
                                nameLength={8}
                                isEdit={true}
                                onDeleteFile={() => {
                                    onFileDelete?.(file)
                                }}
                            />
                        )
                    })}
                </div>
            ) : ''}
        </div>
    )
}