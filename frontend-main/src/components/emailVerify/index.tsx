import React from 'react'

import Moment from 'moment'
import 'moment/min/locales'

import './index.scss'
import Button from '@components/button'
import { API, APISync } from '@modules/API'
import { notify } from '@modules/Notify'
import Cookies from 'universal-cookie'
import floatToInt from '@modules/functions/floatToInt'
import { timeConverted } from '@modules/functions/timeConverter'
import { Alert } from '@components/alert'
import { Language } from '@modules/Language'
import { Modal } from '@components/modals'
import ModalLoader from '@components/modals/loader'
import store from '@src/store'

let timeToNextSendTimer = null

interface EmailVerifyProps {
    type: 'placead' | 'messages' | 'report' | 'support' | 'settings'

    center?: boolean

    modal?: boolean
    onModalClose?: () => void
}
export default function EmailVerify({
    type,

    center,

    modal,
    onModalClose
}: EmailVerifyProps) {
    Moment.locale(window.language)

    const [ status, setStatus ] = React.useState(store.getState().emailVerifyReducer || false)
    const [ timeToNextSend, setTimeToNextSend ] = React.useState(0)

    const [ sendBtnLoader, setSendBtnLoader ] = React.useState(false)
    const [ sendSuccess, setSendSuccess ] = React.useState(false)

    React.useEffect(() => {
        const storeUnsubscribe = store.subscribe(() => {
            const state = store.getState().emailVerifyReducer
            if(state) setStatus(state)
        })

        return () => {
            storeUnsubscribe()
        }
    }, [])

    React.useEffect(() => {
        if(!timeToNextSendTimer && timeToNextSend > 0) {
            let startTime = timeToNextSend
            timeToNextSendTimer = setInterval(() => {
                startTime -= 1

                if(startTime <= 0) {
                    setTimeToNextSend(0)
                    clearInterval(timeToNextSendTimer)
                }
                else setTimeToNextSend(startTime)
            }, 1000)
        }
    }, [timeToNextSend])

    async function onSend() {
        if(timeToNextSend || sendSuccess || sendBtnLoader)return

        setSendBtnLoader(true)
        const result = await APISync({
            url: '/defaultapi/user/settings/emailverify/send',
            type: 'post',
            data: {
                language: window.language
            }
        })

        if(result.statusCode === 200) {
            setSendBtnLoader(old => false)
            setSendSuccess(old => true)
        }
        else {
            setSendBtnLoader(old => false) 

            if(result.message === 'User not found' || result.message === 'The user has already been verified') setStatus(true)
            else if(result.message === 'The email could not be sent') {
                Alert(Language("EMAILVERIFY_ERROR_1"))
            }
            else if(result.message.error && result.message.error === 'The user has recently been sent a request') {
                setTimeToNextSend(floatToInt(((result.message.time + 300) - (+new Date))))
            }
            else notify("(emailVerify.onSend) /user/settings/emailverify/send: " + result.message, { debug: true })
        }
    }

    if(window.userdata.uid === -1)return
    if(status)return

    if(modal && sendBtnLoader)return (<ModalLoader />)
    if(modal)return (
        <Modal toggle={true} id={"emailVerifyModal"}
            title={Language("EMAILVERIFY_TITLE")}
            body={<Body sendBtnLoader={sendBtnLoader} timeToNextSend={timeToNextSend} sendSuccess={sendSuccess} modal={modal} center={center} type={type} onSend={onSend} />}

            phoneHideBtn={true}
            phoneVersion={true}

            buttons={[ Language("CANCEL"), Language("EMAILVERIFY_ACTION") ]}
            buttonsBlock={sendBtnLoader || sendSuccess}

            onClick={() => {
                onSend()
            }}
            onClose={() => {
                if(onModalClose) onModalClose()
            }}

            modalBodyOverflow={"visible"}
            style={{ width: !window.isPhone && '600px' }}
        />
    )
    return (<Body sendBtnLoader={sendBtnLoader} timeToNextSend={timeToNextSend} sendSuccess={sendSuccess} modal={modal} center={center} type={type} onSend={onSend} />)
}

function Body({
    sendBtnLoader,
    timeToNextSend,
    sendSuccess,

    modal,
    center,
    type,

    onSend
}) {
    const typesText: Record<EmailVerifyProps["type"], string> = {
        placead: Language("EMAILVERIFY_TYPES_TEXT_PLACEAD"),
        messages: Language("EMAILVERIFY_TYPES_TEXT_MESSAGES"),
        report: Language("EMAILVERIFY_TYPES_TEXT_REPORT"),
        support: Language("EMAILVERIFY_TYPES_TEXT_SUPPORT"),
        settings: Language("EMAILVERIFY_TYPES_TEXT_SETTINGS")
    }

    return (
        <div id="emailVerify" className={`${modal && 'modal'} ${center && 'center'}`}>
            {!modal ? (
                <div className="emailVerifyTitle">
                    <h6>{Language("EMAILVERIFY_TITLE")}</h6>
                </div>
            ) : ''}

            <div className="emailVerifyDescription">
                <span>{typesText[type]}</span>
                <span>{Language("EMAILVERIFY_DESCRIPTION")}</span>
            </div>
            
            {timeToNextSend ? (
                <div className="emailVerifyDescription emailVerifyBlocking">
                    <span>{Language("EMAILVERIFY_EXPIRES_TITLE")}</span>
                    <span>{Language("EMAILVERIFY_EXPIRES_DESCRIPTION", null, { isjsx: true }, Moment(timeToNextSend * 1000).format('mm:ss'))}</span>
                </div>
            ) : (
                <div className="emailVerifyActions">
                    {sendSuccess ? (
                        <h6>{Language("EMAILVERIFY_SUCCESS_ACTION")}</h6>
                    ) : !modal ? (
                        <Button disabled={sendBtnLoader} loader={sendBtnLoader} name={Language("EMAILVERIFY_ACTION")} type={"hover"} size={"min"} onClick={() => onSend()} />
                    ) : ''}
                </div>
            )}
        </div>
    )
}