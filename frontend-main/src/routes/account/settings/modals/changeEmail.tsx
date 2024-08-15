import React from 'react'
import Cookies from 'universal-cookie';

import Moment from 'moment'
import 'moment/min/locales'

import { API } from '@modules/API'
import { notify } from '@modules/Notify'
import { Language } from '@modules/Language';

import { Modal } from '@components/modals'
import { Alert } from '@components/alert'
import { CircleLoader } from '@components/circleLoader/circleLoader';

import CONFIG from '@config'

import { MdPassword } from "react-icons/md";
import Input from '@components/input';

import { isValidPassword } from '@functions/isValidPassword';
import ModalVerifyCode from '@components/modals/verifycode';
import { isValidEmail } from '@modules/functions/isValidEmail';
import UserDTO from '@dto/user.dto';
import { RouteAccountSettings_modalProps } from './props';

export default function RouteAccountSettings_modalChangeEmail({
    account,
    onClose
}: RouteAccountSettings_modalProps) {
    Moment.locale(window.language)

    const [ loader, setLoader ] = React.useState(false)
    const [ disabled, setDisabled ] = React.useState(false)

    const [ verifycode, setVerifycode ] = React.useState(false)
    const [ success, setSuccess ] = React.useState(false)

    const [ form, setForm ] = React.useState({
        newemail: {
            value: '',
            mark: null,
            error: null
        },
        newemailRe: {
            value: '',
            mark: null,
            error: null
        }
    })

    function onSubmit() {
        const
            newemail = form.newemail.value,
            newemailRe = form.newemailRe.value
        
        if(form.newemail.mark === 'error'
            || form.newemailRe.mark === 'error'
            || disabled || loader)return
        
        if(newemail !== newemailRe) {
            return setForm({...form, newemailRe: { ...form.newemailRe, mark: 'error', error: Language("EMAIL_DONT_MATCH") }})
        }
        if(newemail === account.email) {
            return setForm({...form, newemail: { ...form.newemail, mark: 'error', error: Language("SETTINGS_SECURITY_CHANGEEMAIL_ERROR_1") }})
        }
    
        setLoader(true)
        setDisabled(true)

        API({
            url: '/defaultapi/user/settings/changeemail',
            type: 'put',
            data: {
                newemail,
                language: window.language
            }
        }).done(result => {
            setDisabled(false)
            setLoader(false)

            if(result.statusCode === 200) setSuccess(true)
            if(result.statusCode === 1800) setVerifycode(true)
            else {
                if(result.message === 'The new mail should not be identical to the old one') {
                    setForm({...form, newemail: { ...form.newemail, mark: 'error', error: Language("SETTINGS_SECURITY_CHANGEEMAIL_ERROR_1") }})
                }
                else if(result.message === 'The account has not been verified by mail') {
                    window.location = window.location
                }
                else if(result.message === 'The email is already busy') {
                    setForm({...form, newemail: { ...form.newemail, mark: 'error', error: Language("SETTINGS_SECURITY_CHANGEEMAIL_ERROR_2") }})
                }
                else if(result.message.error && result.message.error === 'The user has recently been sent a request') {
                    Alert(Language("SETTINGS_SECURITY_CHANGEEMAIL_ERROR_4", null, null, Moment(result.message.time * 1000).format('mm:ss')))
                }
                else if(result.statusCode === 500) {
                    Alert(Language("SETTINGS_SECURITY_CHANGEEMAIL_ERROR_3"))
                }
                
                notify("(account.settings.modals.changeEmail) /user/settings/changeemail: " + result.message, { debug: true })
            }
        })
    }

    if(verifycode) {
        return (<ModalVerifyCode
            id="account-settings-security"

            onClose={() => {
                if(onClose) onClose()
            }}
            onSubmit={() => {
                setVerifycode(false)
            }}
        />)
    }

    if(success) {
        return (
            <Modal toggle={true} title={""} hideCloseBtn={true}
                phoneHideBtn={true}
                phoneVersion={true}
                body={(
                    <div className="changeEmail changePassword">
                        <h1 className="success" style={{display: 'flex', justifyContent: 'center', fontSize: "18px", fontWeight: "700", color: "var(--tm-color-txt)"}}>
                            {Language("SETTINGS_SECURITY_CHANGEEMAIL_SUCCESS")}
                        </h1>
                    </div>
                )}
                buttons={[ Language("CLOSE") ]}
                onClose={() => {
                    if(onClose) onClose()
                }}

                modalBodyOverflow={"visible"}
            />
        )
    }
    return (
        <Modal id={"accountSettingsChangeEmailModal"} toggle={true} title={Language("SETTINGS_SECURITY_CHANGEEMAIL_TITLE")}
            icon={(<MdPassword />)}
            phoneHideBtn={true}
            phoneVersion={true}
            body={(
                <div className="changeEmail changePassword">
                    <Input disabled={disabled} type="text" name={"email"}
                        title={Language("SETTINGS_SECURITY_CHANGEEMAIL_FORM_1_TITLE")}
                        data={{ mark: form.newemail.mark, error: form.newemail.error }}
                        onInput={event => {
                            const value = (event.target as HTMLInputElement).value
                            const tmp = { value, error: null, mark: null }

                            if(value.length && !isValidEmail(value)) {
                                tmp.mark = 'error'
                                tmp.error = Language("INCORRECT_EMAIL")
                            }

                            setForm({ ...form, newemail: tmp })
                        }}
                    />
                    <Input disabled={disabled} type="text" autoComplete='none'
                        title={Language("SETTINGS_SECURITY_CHANGEEMAIL_FORM_2_TITLE")}
                        data={{ mark: form.newemailRe.mark, error: form.newemailRe.error }}
                        onInput={event => {
                            const value = (event.target as HTMLInputElement).value
                            const tmp = { value, error: null, mark: null }

                            if(value.length && !isValidEmail(value)) {
                                tmp.mark = 'error'
                                tmp.error = Language("INCORRECT_EMAIL")
                            }
                            if(value.length && form.newemail.value !== value) {
                                tmp.mark = 'error'
                                tmp.error = Language("EMAIL_DONT_MATCH")
                            }

                            setForm({ ...form, newemailRe: tmp })
                        }}
                    />
                </div>
            )}

            buttons={[ Language("BACK"), Language("CHANGE") ]}
            buttonsBlock={disabled}

            onClose={isBtn => {
                if(onClose) onClose()
            }}
            onClick={onSubmit}
        />
    )
}