import React from 'react'

import './index.scss'
import { Modal } from '..'
import { Navigate, useLocation } from 'react-router-dom'
import { RiContactsFill, RiUser6Fill } from 'react-icons/ri'
import Input from '@components/input'
import { MdOutlineAlternateEmail, MdOutlineTopic } from 'react-icons/md'
import { BsBodyText } from 'react-icons/bs'
import { Language } from '@modules/Language'
import ModalLoader from '../loader'
import { isValidEmail } from '@modules/functions/isValidEmail'
import { API, APISync } from '@modules/API'
import { Alert } from '@components/alert'
import { notify } from '@modules/Notify'

export default function ModalContactUs() {
    const location = useLocation()
    const exitlink = location.pathname + location.search

    const [ navigate, setNavigate ] = React.useState(null)
    React.useEffect(() => { if(navigate !== null) setNavigate(null) }, [navigate])

    const [ btnDisabled, setBtnDisabled ] = React.useState(true)

    const [ loader, setLoader ] = React.useState(false)
    const [ success, setSuccess ] = React.useState(false)

    const [ form, setForm ] = React.useState({
        name: {
            value: '',
            mark: null,
            error: null
        },
        email: {
            value: '',
            mark: null,
            error: null
        },
        topic: {
            value: '',
            mark: null,
            error: null
        },
        text: {
            value: '',
            mark: null,
            error: null
        },
    })
    React.useEffect(() => {
        if(form.name.mark !== 'accept'
            || form.email.mark !== 'accept'
            || form.text.mark !== 'accept'
            || form.topic.mark !== 'accept') setBtnDisabled(true)
        else setBtnDisabled(false)
    }, [form])

    async function onSubmit() {
        if(btnDisabled || loader)return

        if(form.name.mark !== 'accept'
            || form.email.mark !== 'accept'
            || form.text.mark !== 'accept'
            || form.topic.mark !== 'accept')return
        
        setLoader(true)
        const result = await APISync({
            url: '/defaultapi/service/contactus',
            type: 'post',
            data: {
                name: form.name.value,
                email: form.email.value,
                topic: form.topic.value,
                text: form.text.value
            }
        })

        setLoader(false)
        if(result.statusCode === 200) {
            setSuccess(true)
        }
        else {
            if(result.message === 'The time has not expired') Alert(Language("CONTACTUSMODAL_SUBMIT_ERROR_1"))
            else {
                Alert(Language("CONTACTUSMODAL_SUBMIT_ERROR_2"))
                notify("(modals.contactus) /service/contactus: " + result.message, { debug: true })
            }

            setNavigate(exitlink)
        }
    }

    if(loader)return (
        <ModalLoader text={"Ловим Ваше обращение..."} />
    )

    if(success)return (
        <Modal toggle={true} title={Language("CONTACTUSMODAL_SUBMIT_SUCCESS_TITLE")} icon={(<RiContactsFill />)}
            body={Language("CONTACTUSMODAL_SUBMIT_SUCCESS_BODY")}

            buttons={[ Language("CLOSE") ]}
            buttonsHref={[ exitlink ]}

            modalBodyOverflow={"visible"}

            phoneHideBtn={true}
            phoneVersion={true}
        />
    )
    return (
        <>
            <Modal id={"modalContactUs"} toggle={true} title={Language("CONTACTUSMODAL_TITLE")} desciption={Language("CONTACTUSMODAL_DESCRIPTION")}
                icon={(<RiContactsFill />)}

                phoneHideBtn={true}
                phoneVersion={true}

                body={(
                    <div id="contactus">
                        <div className="form">
                            <Input type={"text"} name={"name"} title={Language("CONTACTUSMODAL_FORM_NAME_TITLE")}
                                icon={(<RiUser6Fill />)}
                                data={{ placeholder: Language("CONTACTUSMODAL_FORM_NAME_PLACEHOLDER"), mark: form.name.mark, error: form.name.error }}

                                value={form.name.value}
                                onInput={event => {
                                    const value = (event.target as HTMLInputElement).value
                                    const result = { mark: null, error: null, value }

                                    if(value.length && value.length < 2 || value.length > 32) {
                                        result.mark = 'error'
                                        result.error = "Длина должна быть 2 - 32 символа"
                                    }
                                    else if(value.length) result.mark = 'accept'

                                    setForm({ ...form, name: result })
                                }}
                            />
                            <Input type={"text"} name={"email"} title={Language("CONTACTUSMODAL_FORM_EMAIL_TITLE")}
                                icon={(<MdOutlineAlternateEmail />)}
                                data={{ placeholder: Language("CONTACTUSMODAL_FORM_EMAIL_PLACEHOLDER"), mark: form.email.mark, error: form.email.error }}
                                
                                value={form.email.value}
                                onInput={event => {
                                    const value = (event.target as HTMLInputElement).value
                                    const result = { mark: null, error: null, value }

                                    if(value.length && !isValidEmail(value)) {
                                        result.mark = 'error'
                                        result.error = Language("SIGNIN_FORM_EMAIL_ERROR_NOTVALID")
                                    }
                                    else if(value.length) result.mark = 'accept'

                                    setForm({ ...form, email: result })
                                }}
                            />
                            <Input type={"text"} autoComplete='off' title={Language("CONTACTUSMODAL_FORM_TOPIC_TITLE")}
                                icon={(<MdOutlineTopic />)}
                                data={{ placeholder: Language("CONTACTUSMODAL_FORM_TOPIC_PLACEHOLDER"), mark: form.topic.mark, error: form.topic.error }}
                                
                                value={form.topic.value}
                                onInput={event => {
                                    const value = (event.target as HTMLInputElement).value
                                    const result = { mark: null, error: null, value }

                                    if(value.length && (value.length < 6 || value.length > 24)) {
                                        result.mark = 'error'
                                        result.error = Language("CONTACTUSMODAL_FORM_TOPIC_ERROR_1")
                                    }
                                    else if(value.length) result.mark = 'accept'

                                    setForm({ ...form, topic: result })
                                }}
                            />
                            <Input type={"textarea"} autoComplete='off' title={Language("CONTACTUSMODAL_FORM_TEXT_TITLE")}
                                icon={(<BsBodyText />)}
                                data={{ placeholder: Language("CONTACTUSMODAL_FORM_TEXT_PLACEHOLDER"), mark: form.text.mark, error: form.text.error }}
                                
                                value={form.text.value}
                                onInput={event => {
                                    const value = event.target.value
                                    const result = { mark: null, error: null, value }

                                    if(value.length && (value.length < 32 || value.length > 255)) {
                                        result.mark = 'error'
                                        result.error = Language("CONTACTUSMODAL_FORM_TEXT_ERROR_1")
                                    }
                                    else if(value.length) result.mark = 'accept'

                                    setForm({ ...form, text: result })
                                }}
                            />
                        </div>
                    </div>
                )}

                buttonsHref={[ exitlink ]}
                buttons={[ Language("CLOSE"), Language("SEND") ]}
                buttonsBlock={btnDisabled}

                onClick={onSubmit}
                onClose={() => {
                    setNavigate(exitlink)
                }}
            />

            {navigate ? (<Navigate to={navigate} />) : ''}
        </>
    )
}