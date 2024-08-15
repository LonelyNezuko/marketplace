import React from 'react'

import $ from 'jquery'
import 'jquery.scrollto'

import Moment from 'moment'
import 'moment/min/locales'

import './index.scss'
import { RouteAccountProps } from '..'
import { Language } from '@modules/Language'
import { CircleLoader } from '@components/circleLoader/circleLoader'
import Button from '@components/button'
import { MdErrorOutline, MdOutlineKeyboardArrowLeft } from 'react-icons/md'
import { Link, useLocation, useParams } from 'react-router-dom'
import { API, APISync } from '@modules/API'
import { notify } from '@modules/Notify'
import { ModerationReportDTO, ModerationReportMessageDTO, ModerationReportStatus } from '@dto/report.dto'
import { IoClose } from 'react-icons/io5'
import { Avatar } from '@components/avatar/avatar'
import Image from '@components/Image'
import File from '@components/file'
import Input from '@components/input'
import CONFIG from '@config'
import { Alert } from '@components/alert'
import { PiTimerBold } from 'react-icons/pi'
import { AttachmentDTO } from '@dto/attachment.dto'
import { random } from '@modules/functions/random'
import Gateway from '@modules/Gateway'
import { ModerationSupportDTO, ModerationSupportMessageDTO, ModerationSupportStatus } from '@dto/support.dto'
import PhoneHeaderTitle from '@components/phoneHeaderTitle'
import { FaArrowLeft } from 'react-icons/fa6'
import { Modal } from '@components/modals'
import ProductDTO from '@dto/product.dto'
import UserDTO from '@dto/user.dto'
import AdCart from '@components/adcart'
import UserCart from '@components/usercart'

export default function RouteAccountSupportID({
    account,
    loader,

    setNavigate,
    setErrorcode
}: RouteAccountProps) {
    Moment.locale('ru')

    const params = useParams()
    const location = useLocation()

    const [ loaderPage, setLoaderPage ] = React.useState(true)

    const [ support, setSupport ] = React.useState<ModerationSupportDTO>(null)
    const [ messages, setMessages ] = React.useState<ModerationSupportMessageDTO[]>([])

    const [ phoneInfoBlockShow, setPhoneInfoBlockShow ] = React.useState(false)

    React.useMemo(() => {
        setLoaderPage(true)

        const id = parseInt(params.id)
        if(!id || isNaN(id)) {
            return setNavigate('/account/support')
        }

        API({
            url: '/defaultapi/user/support',
            type: 'get',
            data: {
                supportID: id
            }
        }).done(result => {
            if(result.statusCode === 200) {
                setLoaderPage(false)

                setSupport(result.message.support)
                setMessages(result.message.messages)
            }
            else {
                setErrorcode({ code: result.statusCode })
                notify("(account.support.id) /user/support: " + result.message, { debug: true })
            }
        })

        Gateway.on('user', 'onSupportMessage', (message: ModerationSupportMessageDTO) => {
            setMessages(old => {
                old.push(message)
                return [...old]
            })
        })
        Gateway.on('user', 'onSupportChangeStatus', (supportID: number, status: ModerationSupportStatus) => {
            if(status === 'closed' || status === 'open') {
                setSupport(old => {
                    if(old) {
                        if(old.id === supportID) old.status = status
                        return {...old}
                    }
                    return old
                })
            }
        })
    }, [])
    React.useEffect(() => {
        const lastElem = $('.route#routeAccountSupportID .pageBody .chatWrapper .messages .messageSection:last-child')
        if(lastElem) $('.route#routeAccountSupportID .pageBody .chatWrapper .messages').scrollTo(lastElem)
    }, [messages])

    if(loaderPage || !support)return (
        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '68px'}}>
            <CircleLoader type={"big"} color={'var(--tm-color)'} />
        </div>
    )
    return (
        <div className="route" id="routeAccountSupportID">
            {window.isPhone ? (
                <PhoneHeaderTitle backButton={(<FaArrowLeft />)} backButtonURL={"/account/support"} text={Language("SUPPORT_NUMBER", null, null, support.id)}
                    links={[
                        { name: Language("INFO"), onClick: () => setPhoneInfoBlockShow(true) }
                    ]}
                />
            ) : (
                <header className="header">
                    <section className="section">
                        <Link to="/account/support">
                            <Button classname='backbtn' icon={<MdOutlineKeyboardArrowLeft />} type={"transparent"} />
                        </Link>
                        <h1 className="blocktitle">{Language("SUPPORT_NUMBER", null, null, support.id)}</h1>
                    </section>
                </header>
            )}

            <div className="pageBody">
                <div className="chatBody">
                    <div className="chatWrapper">
                        <div className="messages">
                            {messages.map((message, i) => {
                                if(message.senderSystem)return (
                                    <div className="messageSection system" key={i}>
                                        <div className="messageInfo">
                                            <span className="text">{Language(message.text)}</span>
                                        </div>
                                    </div>
                                )
                                return (<Message support={support} message={message} />)
                            })}
                        </div>

                        <FormBlock support={support} setNavigate={setNavigate} setMessages={setMessages} />
                    </div>
                </div>

                <InfoBlock support={support} messages={messages} setNavigate={setNavigate} setSupport={setSupport}
                    phoneInfoBlockShow={phoneInfoBlockShow} setPhoneInfoBlockShow={setPhoneInfoBlockShow}
                />
            </div>
        </div>
    )
}


interface BlockProps {
    support: ModerationSupportDTO

    setMessages?: React.Dispatch<React.SetStateAction<ModerationSupportMessageDTO[]>>
    messages?: ModerationSupportMessageDTO[]

    setNavigate?: React.Dispatch<any>,
    setSupport?: React.Dispatch<React.SetStateAction<ModerationSupportDTO>>
}


interface IInfoBlock extends BlockProps {
    setPhoneInfoBlockShow: React.Dispatch<React.SetStateAction<boolean>>,
    phoneInfoBlockShow: boolean
}
function InfoBlock({
    support,
    messages,

    setNavigate,
    setSupport,

    setPhoneInfoBlockShow,
    phoneInfoBlockShow
}: IInfoBlock) {
    const [ closeBtnLoader, setCloseBtnLoader ] = React.useState(false)
    async function onCloseSupport() {
        if(!support || !support.id || support.status !== 'open')return

        const result = await APISync({
            url: '/defaultapi/user/support/close',
            type: 'put',
            data: {
                supportID: support.id
            }
        })

        setCloseBtnLoader(false)
        if(result.statusCode === 200) {
            Alert(Language("SUPPORT_CLOSE_ACTION_SUCCESS"), "success")
            setSupport(old => {
                old.status = 'closed'
                return {...old}
            })
        }
        else {
            if(result.message === 'This support not open') {
                setSupport(old => {
                    old.status = 'closed'
                    return {...old}
                })
            }
            else if(result.statusCode === 401 || result.statusCode === 404) {
                setNavigate('/')
            }

            notify("(account.support.id) /user/support/close: " + result.message, { debug: true })
        }
    }

    function Body() {
        return (
            <section className="reportInfo">
                <div className="reportInfoWrapper">
                    <section className="infoBlock">
                        <h6 className="infoTitle">{Language("SUPPORT_TABLE_TITLE_ID")}</h6>
                        <span className="infoValue">#{support.id}</span>
                    </section>
                    <section className="infoBlock">
                        <h6 className="infoTitle">{Language("SUPPORT_TABLE_TITLE_THEME")}</h6>
                        <span className="infoValue">{support.reason}</span>
                    </section>
                    <section className="infoBlock">
                        <h6 className="infoTitle">{Language("SUPPORT_TABLE_TITLE_CREATEAT")}</h6>
                        <span className="infoValue">{Moment(support.createAt).format('DD.MM.YYYY')}</span>
                    </section>
                    <section className="infoBlock">
                        <h6 className="infoTitle">{Language("SUPPORT_TABLE_TITLE_STATUS")}</h6>
                        <span className="infoValue">
                            <span className={'report-status report-status-' + support.status}>{Language("REPORT_STATUS_NAME_" + support.status.toUpperCase())}</span>
                        </span>
                    </section>
                    <section className="infoBlock">
                        <h6 className="infoTitle">{Language("REPORT_TABLE_TITLE_LASTMESSAGE")}</h6>
                        <span className="infoValue">{messages[messages.length - 1].sender ? messages[messages.length - 1].sender.id === window.userdata.uid ? Language("YOU") : Language("MODERATOR") : Language("SYSTEM")}, {Moment(messages[messages.length - 1].createAt).format('DD.MM.YYYY')}</span>
                    </section>
                </div>
    
                {support.status === 'open' ? (
                    <div className="actionBlock">
                        {support.status === 'open' ?
                            (<Button name={Language("SUPPORT_CLOSE_BTN")} classname='closeReport' onClick={onCloseSupport}
                                loader={closeBtnLoader}
                                disabled={closeBtnLoader}
                            />)
                        : ''}
                    </div>
                ) : ''}
            </section>
        )
    }

    if(!support || !support.id || !messages)return

    if(window.isPhone) {
        if(!phoneInfoBlockShow)return
        return (<Modal toggle={true} id='supportIDInfoBlock' title={Language("INFO")}
            body={(<Body />)}

            buttons={[ Language("CLOSE") ]}
            onClose={() => setPhoneInfoBlockShow(false)}

            phoneHideBtn={true}
            phoneVersion={true}
        />)
    }
    return (<Body />)
}

interface MessageProps extends BlockProps {
    message: ModerationSupportMessageDTO
}
function Message({
    support,
    message
}: MessageProps) {
    function MessageAttachEntity({
        product,
        user
    }: { product?: ProductDTO, user?: UserDTO }) {
        if(!product && !user)return

        return (
            <div className="messageAttachEntity">
                {product ? (<AdCart product={product} size={"min"} type={"horizontal"} />) : ''}
                {user ? (<UserCart account={user} type={"mini"} />) : ''}
            </div>
        )
    }

    return (
        <div key={message.id} className={`messageSection ${(message.sender.id === window.userdata.uid && !message.senderModerator) && 'reverse'}`}>
            <div className="leftBlock">
                {message.senderModerator ? (<Avatar image={'/assets/avatars/moderator.png'} size={100} position={{ x: 0, y: 0 }} />) : ''}
            </div>
            <div className="rightBlock">
                <div className="messageInfo">
                    <MessageAttachEntity product={message.attachProduct} user={message.attachUser} />
                    <section className="text">
                        <span className="value">{message.text}</span>
                        {message.attachments.length ? (
                            <div className="attachmentsList">
                                {message.attachments.map((attachment, a) => {
                                    return (
                                        <div className={`attachment ${attachment.type}`} key={a}>
                                            {attachment.type === 'image' ? (
                                                <Image src={attachment.url} />
                                            ) : attachment.type === 'file' ? (
                                                <File size={"big"} src={attachment.url}
                                                    // name={"Test file dasd asdasdasdasdasdasdasd"}
                                                    // weight={592833}
                                                />
                                            ) : ''}
                                        </div>
                                    )
                                })}
                            </div>
                        ) : ''}
                    </section>
                    <section className="bottom">
                        <section className="section">
                            {message.id === -1 ? (
                                <div className="sendStatus wait">
                                    <PiTimerBold />
                                    {/* <MdErrorOutline /> */}
                                </div>
                            ) : ''}
                            {message.id === -2 ? (
                                <div className="sendStatus error" data-alt={(message as any)._sendError as string}>
                                    <MdErrorOutline />
                                </div>
                            ) : ''}

                            <span className="username">{(message.sender.id === window.userdata.uid && !message.senderModerator) ? Language("YOU") : message.senderModerator ? Language("MODERATOR") : 'unknown'}</span>
                        </section>
                        <section className="section">
                            <span className="createAt">{Moment(message.createAt).format('HH:mm')}</span>
                        </section>
                    </section>
                </div>
            </div>
        </div>
    )
}

function FormBlock({
    support,

    setMessages,
    setNavigate
}: BlockProps) {
    const [ files, setFiles ] = React.useState<File[]>([])
    const [ form, setForm ] = React.useState({
        value: '',
        error: null,
        mark: null
    })

    const [ lastSendTime, setLastSendTime ] = React.useState(0)

    async function onSubmit() {
        if(!support || !support.id || support.status !== 'open')return
        if(!files.length && form.mark !== 'accept')return

        if(lastSendTime + CONFIG.cooldownToSendMessage >= +new Date())return Alert(Language("TOO_FAST"))

        const data = new FormData()

        data.append('supportID', support.id.toString())
        data.append('text', form.value)

        const attachmentList: AttachmentDTO[] = []
        files.map(file => {
            data.append('attachments[]', file)
            attachmentList.push({
                type: file.type.indexOf('image') !== -1 ? 'image' : file.type.indexOf('video') !== -1 ? 'video' : 'file',
                url: URL.createObjectURL(file)
            })
        })
        
        let newMessageIndex: number = null
        setMessages(old => {
            newMessageIndex = old.length
            old.push({
                id: -1,
                support,
                sender: {
                    id: window.userdata.uid
                } as any,
                createAt: new Date(),
                senderModerator: false,
                senderSystem: false,
                text: form.value,
                attachments: attachmentList
            })

            return [...old]
        })

        setForm({
            value: '',
            mark: null,
            error: null
        })
        setFiles([]);

        (document.getElementById('reportMessageFormTextarea') as HTMLTextAreaElement).value = ''

        const result = await APISync({
            url: '/defaultapi/user/support/message',
            type: 'post',
            data,
            contentType: false,
            processData: false
        })

        if(result.statusCode === 200) {
            if(newMessageIndex) {
                setMessages(old => {
                    old[newMessageIndex].id = result.message.messageID
                    old[newMessageIndex].sender = result.message.sender
                    old[newMessageIndex].attachments = result.message.attachments

                    return [...old]
                })
            }
            setLastSendTime(+new Date())
        }
        else {
            if(result.statusCode === 403
                && result.message === 'You need to confirm your email') {
                return window.location.href = '/'
            }
            else if(result.statusCode === 404) {
                return setNavigate('/account/support')
            }
            else {
                if(result.statusCode !== 425) notify("(account.support.id) /user/support/message: " + result.message, { debug: true })

                if(newMessageIndex) {
                    setMessages(old => {
                        old[newMessageIndex].id = -2;

                        if(result.statusCode === 425) ((old[newMessageIndex] as any)._sendError as string) = Language("TOO_FAST")
                        else ((old[newMessageIndex] as any)._sendError as string) = Language("REPORT_SEND_MESSAGE_ERROR_1")

                        return [...old]
                    })
                }
                else Alert(Language("REPORT_SEND_MESSAGE_ERROR_1"))
            }
        }
    }

    if(support?.status !== 'open')return (
        <div className="form">
            <div className="cantSendMessage">
                <span>{Language("REPORT_SEND_MESSAGE_BLOCK")}</span>
            </div>
        </div>
    )
    return (
        <div className="form">
            <Input id='reportMessageFormTextarea'
                type={"textarea"} deleteLabel={true}
                data={{ placeholder: Language("MESSAGE_PLACEHOLDER"), error: form.error, mark: form.mark }}
                attachmentBtn={true}
                sendBtn={true}

                value={form.value}
                onInput={event => {
                    const value = event.target.value
                    const result = { value, error: null, mark: 'accept' }

                    if(value.length) {
                        if(value.length < 4) {
                            result.error = Language("REPORT_SEND_MESSAGE_INPUT_ERROR_1")
                            result.mark = 'error'
                        }
                        else if(value.length > 1024) {
                            result.error = Language("REPORT_SEND_MESSAGE_INPUT_ERROR_2")
                            result.mark = 'error'
                        }
                    }
                    else result.mark = null

                    setForm(result)
                }}

                onSendClick={onSubmit}
                onKeyDown={event => {
                    if(event.key === 'Enter' && !event.ctrlKey) {
                        event.preventDefault()
                        onSubmit()
                    }
                    else if(event.key === 'Enter' && event.ctrlKey) {
                        event.preventDefault()
                        setForm(old => {
                            return {...old, value: old.value + '\n'}
                        })
                    }
                }}

                fileList={files}
                fileLimit={5}
                fileSizeLimit={CONFIG.mbtobyte * 10}
                fileAccess={[ "image/*", "text/plain", "application/zip", "application/rar" ]}
                fileAccessErrorMsg={Language("REPORT_SEND_MESSAGE_INPUT_FILE_TYPE_ERROR")}

                onFileUpload={newFiles => {
                    setFiles(old => {
                        return [...old, ...newFiles]
                    })
                }}
                onFileDelete={file => {
                    setFiles(old => {
                        old = old.filter(item => item !== file)
                        return [...old]
                    })
                }}

                textareaDefaultRows={1}
                textareaMaxRows={8}
            />
        </div>
    )
}