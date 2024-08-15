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
import PhoneHeaderTitle from '@components/phoneHeaderTitle'
import { FaArrowLeft } from 'react-icons/fa6'
import { Modal } from '@components/modals'

export default function RouteAccountReportsID({
    account,
    loader,

    setNavigate,
    setErrorcode
}: RouteAccountProps) {
    Moment.locale('ru')

    const params = useParams()
    const location = useLocation()

    const [ loaderPage, setLoaderPage ] = React.useState(true)

    const [ report, setReport ] = React.useState<ModerationReportDTO>(null)
    const [ messages, setMessages ] = React.useState<ModerationReportMessageDTO[]>([])

    const [ phoneInfoBlockShow, setPhoneInfoBlockShow ] = React.useState(false)

    React.useMemo(() => {
        setLoaderPage(true)

        const id = parseInt(params.id)
        if(!id || isNaN(id)) {
            return setNavigate('/account/reports')
        }

        API({
            url: '/defaultapi/user/report',
            type: 'get',
            data: {
                reportID: id
            }
        }).done(result => {
            if(result.statusCode === 200) {
                setLoaderPage(false)

                setReport(result.message.report)
                setMessages(result.message.messages)
            }
            else {
                setErrorcode({ code: result.statusCode })
                notify("(account.reports.id) /user/report: " + result.message, { debug: true })
            }
        })

        Gateway.on('user', 'onReportMessage', (message: ModerationReportMessageDTO) => {
            setMessages(old => {
                old.push(message)
                return [...old]
            })
        })
        Gateway.on('user', 'onReportChangeStatus', (reportID: number, status: ModerationReportStatus) => {
            if(status === 'closed' || status === 'open') {
                setReport(old => {
                    if(old) {
                        if(old.id === reportID) old.status = status
                        return {...old}
                    }
                    return old
                })
            }
        })
    }, [])
    React.useEffect(() => {
        const lastElem = $('.route#routeAccountReportsID .pageBody .chatWrapper .messages .messageSection:last-child')
        if(lastElem) $('.route#routeAccountReportsID .pageBody .chatWrapper .messages').scrollTo(lastElem)
    }, [messages])

    if(loaderPage || !report)return (
        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '68px'}}>
            <CircleLoader type={"big"} color={'var(--tm-color)'} />
        </div>
    )
    return (
        <div className="route" id="routeAccountReportsID">
            {window.isPhone ? (
                <PhoneHeaderTitle backButton={(<FaArrowLeft />)} backButtonURL={"/account/reports"} text={Language("REPORT_NUMBER", null, null, report.id)}
                    links={[
                        { name: Language("INFO"), onClick: () => setPhoneInfoBlockShow(true) }
                    ]}
                />
            ) : (
                <header className="header">
                    <section className="section">
                        <Link to="/account/reports">
                            <Button classname='backbtn' icon={<MdOutlineKeyboardArrowLeft />} type={"transparent"} />
                        </Link>
                        <h1 className="blocktitle">{Language("REPORT_NUMBER", null, null, report.id)}</h1>
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
                                return (<Message report={report} message={message} />)
                            })}
                        </div>

                        <FormBlock report={report} setNavigate={setNavigate} setMessages={setMessages} />
                    </div>
                </div>

                <InfoBlock report={report} messages={messages} setNavigate={setNavigate} setReport={setReport}
                    phoneInfoBlockShow={phoneInfoBlockShow} setPhoneInfoBlockShow={setPhoneInfoBlockShow}
                />
            </div>
        </div>
    )
}


interface BlockProps {
    report: ModerationReportDTO

    setMessages?: React.Dispatch<React.SetStateAction<ModerationReportMessageDTO[]>>
    messages?: ModerationReportMessageDTO[]

    setNavigate?: React.Dispatch<any>,
    setReport?: React.Dispatch<React.SetStateAction<ModerationReportDTO>>
}


interface IInfoBlock extends BlockProps {
    setPhoneInfoBlockShow: React.Dispatch<React.SetStateAction<boolean>>,
    phoneInfoBlockShow: boolean
}
function InfoBlock({
    report,
    messages,

    setNavigate,
    setReport,

    setPhoneInfoBlockShow,
    phoneInfoBlockShow
}: IInfoBlock) {
    const [ closeBtnLoader, setCloseBtnLoader ] = React.useState(false)
    async function onCloseReport() {
        if(!report || !report.id || report.status !== 'open')return

        const result = await APISync({
            url: '/defaultapi/user/report/close',
            type: 'put',
            data: {
                reportID: report.id
            }
        })

        setCloseBtnLoader(false)
        if(result.statusCode === 200) {
            Alert(Language("REPORT_CLOSE_ACTION_SUCCESS"), "success")
            setReport(old => {
                old.status = 'closed'
                return {...old}
            })
        }
        else {
            if(result.message === 'This report not open') {
                setReport(old => {
                    old.status = 'closed'
                    return {...old}
                })
            }
            else if(result.statusCode === 401 || result.statusCode === 404) {
                setNavigate('/')
            }

            notify("(account.reports.id) /user/report/close: " + result.message, { debug: true })
        }
    }

    function Body() {
        return (<section className="reportInfo">
            <div className="reportInfoWrapper">
                <section className="infoBlock">
                    <h6 className="infoTitle">{Language("REPORT_TABLE_TITLE_ID")}</h6>
                    <span className="infoValue">#{report.id}</span>
                </section>
                <section className="infoBlock">
                    <h6 className="infoTitle">{Language("REPORT_TABLE_TITLE_SUSPECT")}</h6>
                    <span className="infoValue">
                        <Link to={report.type === 'product' ? ("?ad=" + report.productEntity.prodID) : "/profile/" + report.userEntity.id} target={report.type === 'user' ? '_blank' : null} className={'link report-type report-type-' + report.type}>{report.type === 'product' ? `${Language("PRODUCT")} #${report.productEntity.prodID}` : report.userEntity.name[0] + ' ' + report.userEntity.name[1]}</Link>
                    </span>
                </section>
                <section className="infoBlock">
                    <h6 className="infoTitle">{Language("REPORT_TABLE_TITLE_THEME")}</h6>
                    <span className="infoValue">{report.reason}</span>
                </section>
                <section className="infoBlock">
                    <h6 className="infoTitle">{Language("REPORT_TABLE_TITLE_CREATEAT")}</h6>
                    <span className="infoValue">{Moment(report.createAt).format('DD.MM.YYYY')}</span>
                </section>
                <section className="infoBlock">
                    <h6 className="infoTitle">{Language("REPORT_TABLE_TITLE_STATUS")}</h6>
                    <span className="infoValue">
                        <span className={'report-status report-status-' + report.status}>{Language("REPORT_STATUS_NAME_" + report.status.toUpperCase())}</span>
                    </span>
                </section>
                <section className="infoBlock">
                    <h6 className="infoTitle">{Language("REPORT_TABLE_TITLE_LASTMESSAGE")}</h6>
                    <span className="infoValue">{messages[messages.length - 1].sender ? messages[messages.length - 1].sender.id === window.userdata.uid ? Language("YOU") : Language("MODERATOR") : Language("SYSTEM")}, {Moment(messages[messages.length - 1].createAt).format('DD.MM.YYYY')}</span>
                </section>
            </div>

            {report.status === 'open' ? (
                <div className="actionBlock">
                    {report.status === 'open' ?
                        (<Button name={Language("REPORT_CLOSE_BTN")} classname='closeReport' onClick={onCloseReport}
                            loader={closeBtnLoader}
                            disabled={closeBtnLoader}
                        />)
                    : ''}
                </div>
            ) : ''}
        </section>)
    }

    if(!report || !report.id || !messages)return

    if(window.isPhone) {
        if(!phoneInfoBlockShow)return
        return (<Modal toggle={true} id='reportIDInfoBlock' title={Language("INFO")}
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
    message: ModerationReportMessageDTO
}
function Message({
    report,
    message
}: MessageProps) {
    return (
        <div key={message.id} className={`messageSection ${(message.sender.id === window.userdata.uid && !message.senderModerator) && 'reverse'}`}>
            <div className="leftBlock">
                {message.senderModerator ? (<Avatar image={'/assets/avatars/moderator.png'} size={100} position={{ x: 0, y: 0 }} />) : ''}
            </div>
            <div className="rightBlock">
                <div className="messageInfo">
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
    report,

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
        if(window.userdata.reportBanned)return
        if(!report || !report.id || report.status !== 'open')return
        if(form.mark !== 'accept')return

        // if(lastSendTime + CONFIG.cooldownToSendMessage >= +new Date())return Alert(Language("TOO_FAST"))

        const data = new FormData()

        data.append('reportID', report.id.toString())
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
                report,
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
            url: '/defaultapi/user/report/message',
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
                return setNavigate('/account/reports')
            }
            else {
                if(result.statusCode !== 425) notify("(account.report.id) /user/report/message: " + result.message, { debug: true })

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

    if(report?.status !== 'open')return (
        <div className="form">
            <div className="cantSendMessage">
                <span>{Language("REPORT_SEND_MESSAGE_BLOCK")}</span>
            </div>
        </div>
    )
    if(window.userdata.reportBanned)return (
        <div className="form">
            <div className="cantSendMessage">
                <span>{Language("REPORT_SEND_MESSAGE_BLOCK_USER_REPORT_BANNED")}</span>
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