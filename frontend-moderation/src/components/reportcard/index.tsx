import React from 'react'

import $ from 'jquery'
import 'jquery.scrollto'

import Moment from 'moment'
import 'moment/min/locales'

import CONFIG from '@config'

import './index.scss'
import { ModerationReportDTO, ModerationReportMessageDTO, ModerationReportStatus } from '@dto/report.dto'
import { API, APISync } from '@modules/API'
import { RouteErrorCode, RouteErrorCodeProps } from '@routes/errorcodes'
import { Link, Navigate } from 'react-router-dom'
import { notify } from '@modules/Notify'
import DotsLoader from '@components/dotsloader'
import { Language } from '@modules/Language'
import Button from '@components/button'
import { Modal } from '@components/modals'
import Username from '@components/username'
import { AttachmentDTO } from '@dto/attachment.dto'
import { Alert } from '@components/alert'
import Input from '@components/input'
import File from '@components/file'
import Image from '@components/Image'
import { MdErrorOutline } from 'react-icons/md'
import { PiTimerBold } from 'react-icons/pi'
import { Avatar } from '@components/avatar/avatar'
import Gateway from '@modules/Gateway'

interface ReportCardProps {
    reportID: number
}
export default function ReportCard({
    reportID
}: ReportCardProps) {
    const globalRef = React.useRef(null)
    Moment.locale(window.language)

    const [ navigate, setNavigate ] = React.useState(null)
    React.useEffect(() => { if(navigate !== null) setNavigate(null) }, [navigate])

    const [ reload, setReload ] = React.useState(false)

    const [ loader, setLoader ] = React.useState(true)
    const [ errorPage, setErrorPage ] = React.useState<RouteErrorCodeProps>({ code: 0 })

    const [ report, setReport ] = React.useState<ModerationReportDTO>(null)
    const [ messages, setMessages ] = React.useState<ModerationReportMessageDTO[]>([])

    const [ showInfoModal, setShowInfoModal ] = React.useState(true)

    React.useMemo(() => {
        loadReport()

        Gateway.on('moderation', 'onReportMessage', (message: ModerationReportMessageDTO) => {
            setMessages(old => {
                old.push(message)
                return [...old]
            })
        })
        Gateway.on('moderation', 'onReportChangeStatus', (reportID: number, status: ModerationReportStatus) => {
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
        if(globalRef) {
            const lastElem = $(globalRef.current).find('.chatWrapper .messages .messageSection:last-child')
            if(lastElem) $(globalRef.current).find('.chatWrapper .messages').scrollTo(lastElem)
        }
    }, [messages, globalRef])
    React.useEffect(() => {
        return () => {
            Gateway.disconnect('moderation-selectReport')
        }
    }, [])

    async function loadReport() {
        setLoader(true)
        const result = await APISync({
            url: '/defaultapi/moderation/report/',
            type: 'get',
            data: {
                reportID
            }
        })

        if(result.statusCode === 200) {
            setReport(result.message.report)
            setMessages(result.message.messages)

            setLoader(false)
            Gateway.init('moderation-selectReport')
        }
        else {
            if(result.statusCode === 403) setErrorPage({ code: 403 })
            else setNavigate('/')

            notify("(reportcard) /moderation/report: " + result.message, { debug: true })
        }
    }

    if(errorPage.code !== 0)return (<RouteErrorCode {...errorPage} classes={"flexcenter center"} />)
    if(loader)return (
        <div className="reportcard flexcenter">
            <DotsLoader color={"colorful"} />
        </div>
    )
    return (
        <div className="reportcard" ref={globalRef}>
            {showInfoModal ? (<InfoModal report={report} messages={messages} onClose={() => setShowInfoModal(false)}
                setErrorPage={setErrorPage} setNavigate={setNavigate} setReport={setReport}
            />) : ''}
            
            <div className="reportHeader">
                <div className="reportTitle">
                    <h6>{Language("REPORT_NUMBER", null, null, report.id)}</h6>
                </div>
                <div className="reportMoreInfo">
                    <Button name={Language("INFO_EDIT")} type={"hover"} onClick={() => setShowInfoModal(true)} />
                </div>
            </div>

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

                    <FormBlock report={report} setNavigate={setNavigate} setMessages={setMessages} setErrorPage={setErrorPage} />
                </div>
            </div>

            {navigate ? (<Navigate to={navigate} />) : ''}
        </div>
    )
}


interface BlockProps {
    report: ModerationReportDTO
    messages?: ModerationReportMessageDTO[]

    setMessages?: React.Dispatch<React.SetStateAction<ModerationReportMessageDTO[]>>
    setReport?: React.Dispatch<React.SetStateAction<ModerationReportDTO>>

    setNavigate?: React.Dispatch<any>
    setErrorPage?: React.Dispatch<React.SetStateAction<RouteErrorCodeProps>>
}


interface MessageProps extends BlockProps {
    message: ModerationReportMessageDTO
}
function Message({
    report,
    message
}: MessageProps) {
    return (
        <div key={message.id} className={`messageSection ${(message.sender.id === window.userdata.uid && message.senderModerator) && 'reverse'}`}>
            <div className="leftBlock">
                {message.sender.id !== window.userdata.uid
                    || !message.senderModerator ? (<Avatar {...message.sender.avatar} onlinestatus={message.sender.onlineStatus} />) : ''}
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
                                                <File size={"big"} src={attachment.url} />
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
                                </div>
                            ) : ''}
                            {message.id === -2 ? (
                                <div className="sendStatus error" data-alt={(message as any)._sendError as string}>
                                    <MdErrorOutline />
                                </div>
                            ) : ''}

                            <Username account={(message.sender.id === window.userdata.uid && message.senderModerator) ? { name: [ 'Вы', '' ] } as any : message.sender} size={"min"} />
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
    setNavigate,
    setErrorPage
}: BlockProps) {
    const [ files, setFiles ] = React.useState<File[]>([])
    const [ form, setForm ] = React.useState({
        value: '',
        error: null,
        mark: null
    })

    async function onSubmit() {
        if(!report || !report.id || report.status !== 'open')return
        if(form.mark !== 'accept')return

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
                senderModerator: true,
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
        setFiles([])

        document.getElementById('reportMessageFormTextarea').innerText = ''

        const result = await APISync({
            url: '/defaultapi/moderation/report/message',
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
        }
        else {
            if(result.statusCode === 403) setErrorPage({ code: 403 })
            else if(result.statusCode === 404) {
                return setNavigate('/reports')
            }
            else {
                notify("(account.reports.id) /user/report/message: " + result.message, { debug: true })

                if(newMessageIndex) {
                    setMessages(old => {
                        old[newMessageIndex].id = -2;
                        ((old[newMessageIndex] as any)._sendError as string) = Language("REPORT_SEND_MESSAGE_ERROR_1")

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
    return (
        <div className="form">
            <Input id='reportMessageFormTextarea'
                type={"textarea"} deleteLabel={true}
                data={{ placeholder: Language("MESSAGE_PLACEHOLDER"), error: form.error, mark: form.mark }}
                attachmentBtn={true}
                sendBtn={true}

                value={form.value}
                onInput={event => {
                    const value = (event.target as HTMLDivElement).innerText
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
                    if(event.key === 'Enter') {
                        event.preventDefault()
                        onSubmit()
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
            />
        </div>
    )
}


interface InfoModalProps extends BlockProps {
    onClose: () => void
}
function InfoModal({
    report,
    messages,

    onClose,

    setErrorPage,
    setNavigate,
    setReport
}: InfoModalProps) {
    async function onChangeStatus() {
        if(!report || !report.id)return

        const result = await APISync({
            url: '/defaultapi/moderation/report/status',
            type: 'put',
            data: {
                reportID: report.id
            }
        })

        if(result.statusCode === 200) {
            Alert(Language("MODERATION_REPORT_CHANGE_STATUS", null, null, Language("REPORT_STATUS_NAME_" + result.message.toUpperCase())), 'success')
            setReport(old => {
                old.status = result.message
                return {...old}
            })
        }
        else {
            if(result.statusCode === 401) setErrorPage({ code: 401 })
            else if(result.statusCode === 404) setNavigate('/reports')
            else {
                Alert("Не удалось изменить статус жалобы. Попробуйте позже")
                notify("(reportcard) /moderation/report/status: " + result.message, { debug: true })
            }
        }
    }

    return (
        <div className="infoModal">
            <Modal toggle={true} title={Language("INFO")}
                body={(
                    <div className='reportInfoModalBody'>
                        <div className="infoSections">
                            <section className="section">
                                <h6 className="title">{Language("REPORT_TABLE_TITLE_ID")}</h6>
                                <span className="value">#{report.id}</span>
                            </section>
                            <section className="section">
                                <h6 className="title">{Language("REPORT_TABLE_TITLE_THEME")}</h6>
                                <span className="value">{report.reason}</span>
                            </section>
                            <section className="section">
                                <h6 className="title">{Language("REPORT_TABLE_TITLE_SUSPECT")}</h6>
                                <span className="value">
                                    <Link to={report.type === 'product' ? ("/products/" + report.productEntity.prodID) : "/users/" + report.userEntity.id} target={"_blank"} className={'link report-type report-type-' + report.type}>{report.type === 'product' ? `${Language("PRODUCT")} #${report.productEntity.prodID}` : report.userEntity.name[0] + ' ' + report.userEntity.name[1]}</Link>
                                </span>
                            </section>
                            <section className="section">
                                <h6 className="title">{Language("REPORT_TABLE_TITLE_CREATEAT")}</h6>
                                <span className="value">{Moment(report.createAt).format('DD.MM.YYYY')}</span>
                            </section>
                            <section className="section">
                                <h6 className="title">{Language("REPORT_TABLE_TITLE_STATUS")}</h6>
                                <span className="value">
                                    <span className={'report-status report-status-' + report.status}>{Language("REPORT_STATUS_NAME_" + report.status.toUpperCase())}</span>
                                </span>
                            </section>
                            <section className="section">
                                <h6 className="title">{Language("REPORT_TABLE_TITLE_LASTMESSAGE")}</h6>
                                <span className="value">{messages[messages.length - 1].sender ? messages[messages.length - 1].sender.id === window.userdata.uid ? Language("YOU") : messages[messages.length - 1].senderModerator ? Language("MODERATOR") : Language("USER") : Language("SYSTEM")}, {Moment(messages[messages.length - 1].createAt).format('DD.MM.YYYY')}</span>
                            </section>
                            <section className="section">
                                <h6 className="title">{Language("REPORT_TABLE_TITLE_CREATOR")}</h6>
                                <span className="value">
                                    <Link target={"_blank"} to={"/users/" + report.creator.id} className={'link'}>
                                        <Username account={report.creator} />
                                    </Link>
                                </span>
                            </section>
                        </div>
                        <div className="actions">
                            <Button name={report.status === 'closed' ? "Открыть жалобу" : "Закрыть жалобу"} size={"medium"} onClick={onChangeStatus} />
                        </div>
                    </div>
                )}

                buttons={[ Language("CLOSE") ]}
                modalBodyOverflow={"visible"}

                onClose={onClose}
            />
        </div>
    )
}