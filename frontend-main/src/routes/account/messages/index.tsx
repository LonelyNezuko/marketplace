import React from 'react'
import { Link, useParams } from 'react-router-dom'
import $ from 'jquery'
import 'jquery.scrollto'
import 'jquery.viewport'

import Moment from 'moment'
import 'moment/min/locales'

import { Avatar } from '@components/avatar/avatar'
import Input from '@components/input'

import './index.scss'

import { IoCheckmarkSharp } from "react-icons/io5";
import { IoCheckmarkDoneSharp } from "react-icons/io5";

import { FaArrowLeftLong } from "react-icons/fa6";

import { IoSearchSharp } from "react-icons/io5";
import { HiDotsVertical } from "react-icons/hi";
import Username from '@components/username'

import { MdOutlineReportGmailerrorred } from "react-icons/md";
import { GoBlocked } from "react-icons/go";
import { Language } from '@modules/Language'
import { API } from '@modules/API'
import { notify } from '@modules/Notify'
import { subStringPoints } from '@functions/subStringPoints'
import { CircleLoader } from '@components/circleLoader/circleLoader'
import { RouteErrorCode, RouteErrorCodeProps } from '../../errorcodes'
import OnlineStatus from '@components/useronlinestatus'
import { random } from '@functions/random'

import { PiTimerBold } from "react-icons/pi";
import { MdErrorOutline } from "react-icons/md";
import Gateway from '@modules/Gateway'
import { RouteAccountProps } from '..'
import UserDTO, { UserDialogDTO, UserMessageDTO } from '@dto/user.dto'
import DropdownMenu from '@components/dropdownmenu'
import SetRouteTitle from '@modules/SetRouteTitle'
import PhoneHeaderTitle from '@components/phoneHeaderTitle'
import EmailVerify from '@components/emailVerify'
import Button from '@components/button'
import { Alert } from '@components/alert'
import CONFIG from '@config'
import store from '@src/store'
import { reportModalShow } from '@src/store/reportModal'

export default function RouteAccountMessages({
    account,
    loader
}: RouteAccountProps) {
    SetRouteTitle(Language("ROUTE_TITLE_ACCOUNT_MESSAGES"))
    Moment.locale(window.language)

    const [ dialogsLoader, setDialogsLoader ] = React.useState(true)
    const [ dialogs, setDialogs ] = React.useState<Array<UserDialogDTO>>([])

    React.useMemo(() => {
        setDialogsLoader(true)

        API({
            url: "/defaultapi/user/dialogs",
            type: 'get'
        }).done(results => {
            if(results.statusCode === 200) {
                setDialogs(results.message)
                setDialogsLoader(false)
            }
            else notify("(account messages) /user/dialogs: " + results.message, { debug: true })
        })



        Gateway.on('user', 'onMessageIncoming', (message: UserMessageDTO, dialog: UserDialogDTO) => {
            setDialogs(old => {
                let found = false
    
                old.map(d => {
                    if(d.dialogID === message.messageDialog.dialogID) {
                        d.dialogLastMessage = message
                        d.unreads += 1
    
                        found = true
                    }
                })
    
                if(!found) {
                    dialog.unreads = 1
                    old.push(dialog)
    
                    old = old.sort((a, b) => +new Date(b.dialogLastMessage.messageCreateAt) - +new Date(a.dialogLastMessage.messageCreateAt))
                }
    
                return [...old]
            })
        })
        Gateway.on('user', 'onMessagesReadDialogs', (dialogid: number, messagesid: [number], user: UserDTO) => {
            setDialogs(old => {
                old.map(d => {
                    if(d.dialogID === dialogid) {
                        const index = messagesid.findIndex(item => d.dialogLastMessage.messageID === item)
                        if(index !== -1) {
                            d.dialogLastMessage.messageReaders.push(user)
                        }
                    }
                })
                return [...old]
            })
        })
    }, [])

    if(loader || !account || dialogsLoader)return (<Loaderpage />)
    return (
        <div className="route" id="routeAccountMessages">
            <div className="accountPageBody">
                {window.isPhone ? (
                    <PhoneHeaderTitle text={Language("ACCOUNT_MESSAGES_TITLE")} links={[{
                        url: '#settings',
                        name: Language("SETTINGS")
                    }]} />
                ) : (
                    <header className="accountPageHeaderFlex">
                        <div className="blocktitle">
                            <h1>{Language("ACCOUNT_MESSAGES_TITLE")}</h1>
                        </div>
                        <section>
                            <Link to="#settings">{Language("SETTINGS")}</Link>
                        </section>
                    </header>
                )}

                <EmailVerify type={"messages"} />

                {!dialogs.length ? (
                    <div className="nohtingElements">
                        <img src="/assets/errorcodes/nothing.png" />
                        <h5>{Language("ACCOUNT_DIALOGS_NOTHING")}</h5>
                        <span>{Language('ACCOUNT_DIALOGS_NOTHING_DESC')}</span>
                    </div>
                ) : (
                    <div className="dialogs">
                        <div className="list">
                            {dialogs.map((item, i) => {
                                const user = item.dialogUsers.find(item => item.id !== account.id)
                                const avatar = item.dialogAvatar || user.avatar

                                return (
                                    <Link to={`/account/messages/${item.dialogID}`} className={`elem dialog ${item.unreads > 0 && 'unread'}`}>
                                        <Avatar image={avatar.image} sizeImage={90} size={avatar.size} position={avatar.position} onlinestatus={user && user.onlineStatus} />
                                        <div className="dialogblock">
                                            <div className="top">
                                                <div className="username">
                                                    <h1>{item.dialogTitle || (<Username account={user} />)}</h1>
                                                    <span className="date">{Moment(item.dialogLastMessage.messageCreateAt).fromNow()}</span>
                                                </div>
                                                {/* {item.dialogLastMessage.messageSender.id === account.id ? (
                                                    <div className={`readstatus ${item.dialogLastMessage.messageReaders.length > 1 && 'unread'}`}>
                                                        {item.dialogLastMessage.messageReaders.length > 1 ? (<IoCheckmarkSharp />) : (<IoCheckmarkDoneSharp />)}
                                                    </div>
                                                ) : ''} */}
                                            </div>
                                            <div className="message">
                                                <span>{subStringPoints(item.dialogLastMessage.messageText, 208)}</span>

                                                {item.unreads > 0 ? (<div className="newmessagescount blockcount" data-count={item.unreads}></div>) : ''}
                                                {item.dialogLastMessage.messageSender.id === account.id
                                                    && item.dialogLastMessage.messageReaders.length <= 1
                                                ? (<div className="lastmessageunread"></div>) : ''}
                                            </div>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}


export function RouteAccountMessagesDialog({
    loader,
    account
}: RouteAccountProps) {
    SetRouteTitle(Language("ROUTE_TITLE_ACCOUNT_MESSAGES_DIALOG"))
    
    const params = useParams()

    const [ errorPage, setErrorPage ] = React.useState<RouteErrorCodeProps>({ code: 0, text: '', showbtn: false })

    const [ dialogLoader, setDialogLoader ] = React.useState(true)
    const [ dialog, setDialog ] = React.useState<UserDialogDTO>(null)

    const [ inputBlock, setInputBlock ] = React.useState<'deleted' | 'accountBanned'>(null)
    const [ inputText, setInputText ] = React.useState('')

    const [ dropdownHeader, setDropdownHeader ] = React.useState(false)
    const [ lastSendTime, setLastSendTime ] = React.useState(0)

    function onSendMessage() {
        const text = inputText.trim()
        if(!text.length)return

        if(lastSendTime + CONFIG.cooldownToSendMessage >= +new Date())return Alert(Language("TOO_FAST"))

        $('#routeAccountMessagesDialogInput').text('')
        setInputText('')

        const randomid = random(100000, 999999)
        setDialog(old => {
            old.dialogMessages.push({
                _id: randomid,
                messageID: -1,
                messageDialog: dialog,
                messageSender: account,
                messageAttachments: [],
                messageText: text,
                messageCreateAt: new Date(),
                messageReaders: [account]
            })
            return {...old}
        })

        API({
            url: '/defaultapi/user/dialogs/message',
            type: 'post',
            data: {
                text,
                attachments: JSON.stringify([]),

                dialogid: dialog.dialogID
            }
        }).done(result => {
            let id = -2
            let error = "Unknown error"

            if(result.statusCode === 200) {
                error = undefined
                id = result.message.messageid
            }
            if(result.statusCode === 425) {
                error = Language("TOO_FAST")
            }
            else error = result.message

            setDialog(old => {
                old.dialogMessages.map((item, i) => {
                    if(item._id === randomid) {
                        old.dialogMessages[i].messageID = id
                        old.dialogMessages[i]._sendError = error
                    }
                })
                return {...old}
            })
            setLastSendTime(+new Date())
        })
    }
    React.useMemo(() => {
        const id: number = parseInt(params.id)
        if(!id || id < 1 || isNaN(id)) {
            return setErrorPage({ code: 400 })
        }

        setDialogLoader(true)
        API({
            url: '/defaultapi/user/dialogs/dialog',
            type: 'get',
            data: {
                dialogid: id
            }
        }).done(result => {
            if(result.statusCode === 200) {
                setDialog(result.message)
                setDialogLoader(false)

                const user = result.message.dialogUsers.find(item => item.id !== account.id)
                if(user) {
                    if(user._deleted) setInputBlock('deleted')
                }
            }
            else {
                if(result.statusCode === 403 || result.statusCode === 404) setErrorPage({ code: result.statusCode })
                else notify("(account messages dialog) /user/dialogs/dialog: " + result.message, { debug: true })
            }
        })


        Gateway.on('user', 'onMessagesRead', (messagesid: number[], readuser: UserDTO) => {
            setDialog(old => {
                messagesid.map(id => {
                    old.dialogMessages.map(message => {
                        if(message.messageID === id) message.messageReaders.push(readuser)
                    })
                })
    
                return {...old}
            })
        })
    
        Gateway.on('user', 'onMessageIncoming', (message: UserMessageDTO) => {
            setDialog(old => {
                if(message.messageDialog.dialogID === old.dialogID) {
                    old.dialogMessages.push(message)
                    old.dialogMessages = old.dialogMessages.sort((a, b) => a.messageID - b.messageID)
                }
    
                return {...old}
            })
        })
    }, [])
    React.useEffect(() => {
        goToLastMessageElement()

        if(dialog && account) {
            let unreadMessagesCount = 0
            dialog.dialogMessages.map(message => {
                if(!message.messageReaders.find(user => account.id === user.id)) unreadMessagesCount ++
            })

            if(unreadMessagesCount) {
                setDialog(old => {
                    old.dialogMessages.map(message => {
                        if(!message.messageReaders.find(user => account.id === user.id)) {
                            message.messageReaders.push(account)
                        }
                    })
        
                    return {...old}
                })

                API({
                    url: '/defaultapi/user/dialogs/message/read',
                    type: 'put',
                    data: {
                        dialogid: dialog.dialogID
                    }
                }).done(result => {
                    if(result.statusCode !== 200) notify("(account messages messages) /user/dialogs/message/read: " + result.message, { debug: true })
                })
            }
        }
    }, [dialog])

    React.useEffect(() => {
        if(window.userdata.banned) setInputBlock('accountBanned')
    })


    function goToLastMessageElement() {
        if(loader || dialogLoader)return

        const lastMessageElement = $('.route#routeAccountMessagesDialog .messages .list .elem:last-child')
        const unreadFirstMessage = dialog.dialogMessages.find(item => !item.messageReaders.find(item => item.id === account.id))

        if(unreadFirstMessage) {
            const element = $(`.route#routeAccountMessagesDialog .messages .list .elem .textWrapper[data-messageid="${unreadFirstMessage.messageID}"]`)
            $('.route#routeAccountMessagesDialog .messages .list').scrollTo(element)
        }
        else $('.route#routeAccountMessagesDialog .messages .list').scrollTo(lastMessageElement)
    }

    if(errorPage.code)return (
        <RouteErrorCode style={{marginTop: "128px"}} code={errorPage.code} text={errorPage.text}
            showbtn={errorPage.showbtn} btnurl={errorPage.btnurl} btnname={errorPage.btnname}
            icon={errorPage.icon} />
    )
    if(loader || !account || dialogLoader)return (<Loaderpage page={1} />)

    return (
        <div className="route" id="routeAccountMessagesDialog">
            <header className="header">
                <section className="section">
                    <Link to="/account/messages" className="backbtn">
                        <FaArrowLeftLong />
                    </Link>
                    <div className="userinfo">
                        {(() => {
                            const user = dialog.dialogUsers.find(item => item.id !== account.id)
                            const avatar = dialog.dialogAvatar || user.avatar

                            return (
                                <Link to={`/profile/${user.id}`}>
                                    <Avatar sizeImage={90} image={avatar.image} size={avatar.size} position={avatar.position} />
                                    <div className="wrap">
                                        {dialog.dialogTitle || (<Username account={user} />)}
                                        {dialog.dialogType === 0 ? (<OnlineStatus status={user.onlineStatus} />) : ''}
                                    </div>
                                </Link>
                            )
                        })()}
                    </div>
                </section>
                <section className="section">
                    <div className="actions">
                        <Button icon={<IoSearchSharp />} type={"transparent"} classname='search' />
                        {inputBlock !== 'deleted' ? (
                            <section>
                                <Button icon={<HiDotsVertical />} type={"transparent"} onClick={() => setDropdownHeader(!dropdownHeader)} />

                                {(() => {
                                    const user = dialog.dialogUsers.find(item => item.id !== account.id)
                                    const avatar = dialog.dialogAvatar || user.avatar

                                    return (
                                        <DropdownMenu list={[
                                            { content: Language("ACCOUNT_MESSAGES_DIALOG_ACTIONS_PROFILE"), link: `/profile/${user.id}` },
                                            { content: (<>
                                                <MdOutlineReportGmailerrorred style={{ color: 'var(--tm-color-red)', fill: 'var(--tm-color-red)' }} />
                                                {Language("ACCOUNT_MESSAGES_DIALOG_ACTIONS_REPORT")}
                                            </>), bottom: true, color: 'var(--tm-color-red)', onClick: () => {
                                                store.dispatch(reportModalShow({ toggle: true, type: 'user', suspectID: user.id }))
                                            } },
                                            { content: (<>
                                                <GoBlocked style={{ color: 'var(--tm-color-red)', fill: 'var(--tm-color-red)' }} />
                                                {Language("ACCOUNT_MESSAGES_DIALOG_ACTIONS_BLOCK")}
                                            </>), color: 'var(--tm-color-red)' },
                                        ]} />
                                    )
                                })()}
                            </section>
                        ) : ''}
                    </div>
                </section>
            </header>

            <div className="dialogWrapper">
                <div className="messages">
                    <div className="list">
                        {dialog.dialogMessages.map((item, i) => {
                            return (<MessageRender account={account} _messagei={i} message={item} messagesList={dialog.dialogMessages} key={i} />)
                        })}
                    </div>
                </div>

                {/* добавить, когда будет черный список */}
                {/* <div className="blocked">
                    <span>
                        {`Вы не можете отправлять сообщения данному пользователю.\n\nСкорее всего пользователь заблокировал Вас,\nлибо Вы заблокировали его.`}
                    </span>
                </div> */}

                <div className="form">
                    {!account.emailVerify ? (
                        <div className="blocked">
                            <span>{Language("ACCOUNT_MESSENGER_FORM_BLOCK_EMAILVERIFY")}</span>
                        </div>
                    ) : ''}
                    {inputBlock === 'deleted' ? (
                        <div className="blocked">
                            <span>{Language("ACCOUNT_MESSENGER_FORM_BLOCK_DELETED")}</span>
                        </div>
                    ) : ''}
                    {inputBlock === 'accountBanned' ? (
                        <div className="blocked">
                            <span>{Language("ACCOUNT_BANNED_MESSENGER_BLOCK_FORM_ERROR")}</span>
                        </div>
                    ) : ''}
                    
                    {account.emailVerify
                        && !inputBlock ? (
                        <Input
                            onSendClick={onSendMessage}
                            onKeyDown={event => {
                                if(event.key === 'Enter' && event.ctrlKey) {
                                    event.preventDefault()

                                    setInputText(old => {
                                        return old += "\n"
                                    })

                                    $(event.target).scrollTo(20)
                                }
                                else if(event.key === 'Enter' && !event.ctrlKey) {
                                    event.preventDefault()
                                    onSendMessage()
                                }
                            }}
                            onInput={event => {
                                setInputText(event.target.value)
                            }}
                            value={inputText}
                            
                            id={"routeAccountMessagesDialogInput"}
                            type="textarea" sendBtn={true} attachmentBtn={true} deleteLabel={true} data={{placeholder: Language("MESSAGE_PLACEHOLDER")}}
                            
                            textareaDefaultRows={1}
                            textareaMaxRows={8}
                        />
                    ) : ''}
                </div>
            </div>
        </div>
    )
}


interface MessageRenderProps {
    _messagei: number,

    account: UserDTO,

    message: UserMessageDTO,
    messagesList: Array<UserMessageDTO>
}
function MessageRender({
    _messagei,

    account,

    message,
    messagesList
}: MessageRenderProps) {
    if(_messagei - 1 >= 0
        && messagesList[_messagei - 1].messageSender
        && messagesList[_messagei - 1].messageSender.id === message.messageSender.id
        && new Date(messagesList[_messagei - 1].messageCreateAt).getMinutes() === new Date(message.messageCreateAt).getMinutes())return
    return (
        <div className={`elem message ${message.messageSender.id === account.id && 'reverse'}`}>
            {message.messageSender.id !== account.id ? (
                <div className="senderinfo">
                    <Avatar image={message.messageSender.avatar.image} sizeImage={90} size={message.messageSender.avatar.size} position={message.messageSender.avatar.position} circle={true} />
                    <Username account={message.messageSender} hideStatus={true} size={"normal"} />
                </div>
            ) : ''}

            <div className="messagelist">
                {messagesList.map((item: UserMessageDTO, i) => {
                    if(i >= _messagei
                        && item.messageSender
                        && item.messageSender.id === message.messageSender.id
                        && new Date(item.messageCreateAt).getMinutes() === new Date(message.messageCreateAt).getMinutes())return (
                        <div className={`textWrapper`} data-messageid={item.messageID} key={i}>
                            {item.messageID >= 1 && (!item.messageReaders.find(item => item.id === account.id)
                                || item.messageSender.id === account.id && item.messageReaders.length <= 1) ? (
                                <span className="readstatus"></span>
                            ) : ''}

                            {item.messageID === -1 ? (
                                <div className="sendstatus wait">
                                    <PiTimerBold />
                                </div>
                            ) : ''}
                            {item.messageID === -2 ? (
                                <div className="sendstatus error" data-alt={item._sendError}>
                                    <MdErrorOutline />
                                </div>
                            ) : ''}

                            <div className={`text ${item.messageAttachments.length && 'image'}`}>
                                {item.messageAttachments.length ? (
                                    <div className="attachment">
                                        {item.messageAttachments.map((item, i) => {
                                            return (<img key={i} src={item} />)
                                        })}
                                    </div>
                                ) : ''}
                                <span>{item.messageText}</span>
                            </div>
                        </div>
                    )
                    return
                })}

                <div className="info">
                    <span className="date">{Moment(message.messageCreateAt).format("DD.MM HH:mm")}</span>
                </div>
            </div>
        </div>
    )
}






















function Loaderpage({
    page = 0
}) {
    if(page === 1)return (
        <div className="route" id="routeAccountMessagesDialog">
            <header className="header">
                <section className="section">
                    <Link to="/account/messages" className="backbtn">
                        <FaArrowLeftLong />
                    </Link>
                    <div className="userinfo">
                        <div className="_loaderdiv" style={{ width: '50px', minWidth: '50px', height: '50px', borderRadius: '6px' }}></div>
                        <div className="wrap">
                            <div className="_loaderdiv" style={{ width: '120px', height: '18px', borderRadius: '4px' }}></div>
                            <div className="_loaderdiv" style={{ width: '60px', height: '24px' }}></div>
                        </div>
                    </div>
                </section>
                <section className="section">
                    <div className="actions" style={{gap: '4px'}}>
                        <button className="search">
                            <div className="_loaderdiv" style={{ width: '32px', height: '32px', borderRadius: '4px' }}></div>
                        </button>
                        <button>
                            <div className="_loaderdiv" style={{ width: '32px', height: '32px', borderRadius: '4px' }}></div>
                        </button>
                    </div>
                </section>
            </header>

            <div style={{width: '100%', marginTop: '128px', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                <CircleLoader type="big" color={"var(--tm-color)"} />
            </div>
        </div>
    )
    return (
        <div className="route" id="routeAccountMessages">
            <div className="accountPageBody">
                <header className="accountPageHeaderFlex">
                    <div className="blocktitle">
                        <h1>{Language("ACCOUNT_MESSAGES_TITLE")}</h1>
                    </div>
                    <section>
                        <Link to="#settings">{Language("SETTINGS")}</Link>
                    </section>
                </header>

                <div className="dialogs">
                    <div className="list">
                        {new Array(7).fill(0).map((item, i) => {
                            return (
                                <div key={i} className="elem dialog unread">
                                    <div className="_loaderdiv" style={{minWidth: '50px', width: '50px', height: '50px', borderRadius: '6px'}}></div>
                                    <div className="dialogblock">
                                        <div className="top">
                                            <div className="username">
                                                <div className="_loaderdiv" style={{width: '120px', height: '15px', borderRadius: '6px'}}></div>
                                                <div className="_loaderdiv" style={{width: '6px', height: '6px'}}></div>
                                                <div className="_loaderdiv" style={{width: '100px', height: '11px'}}></div>
                                            </div>
                                        </div>
                                        <div className="message" style={{marginTop: "8px"}}>
                                            <div className="_loaderdiv" style={{width: '100%', height: '26px', borderRadius: '6px'}}></div>
                                            <div className="_loaderdiv" style={{minWidth: '26px', width: '26px', height: '26px', borderRadius: '6px', marginLeft: '4px'}}></div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}