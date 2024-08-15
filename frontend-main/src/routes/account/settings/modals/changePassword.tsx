import React from 'react'
import Cookies from 'universal-cookie';

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
import { RouteAccountSettings_modalProps } from './props';
import { UserAuthTokens } from '@dto/user.dto';
import { CustomStorage } from '@modules/CustomStorage';
import { AuthTokens } from '@modules/AuthTokens';

export default function RouteAccountSettings_modalChangePassword({
    onClose
}: RouteAccountSettings_modalProps) {
    const [ disabled, setDisabled ] = React.useState(false)
    const [ changePasswordLoader, setChangePasswordLoader ] = React.useState(false)

    const [ verifycode, setVerifycode ] = React.useState(false)
    const [ success, setSuccess ] = React.useState(false)

    const [ form, setForm ] = React.useState({
        old: {
            value: '',
            mark: null,
            error: null
        },
        new: {
            value: '',
            mark: null,
            error: null
        },
        newRE: {
            value: '',
            mark: null,
            error: null
        }
    })

    function onSubmit() {
        const
            oldpass = form.old.value,
            newpass = form.new.value,
            newpassRE = form.newRE.value
        
        if(form.old.mark === 'error'
            || form.new.mark === 'error'
            || form.newRE.mark === 'error'
            || disabled
            || changePasswordLoader)return
        if(newpass !== newpassRE) {
            return setForm({...form, newRE: { ...form.newRE, mark: 'error', error: Language("PASSWORD_DONT_MATCH") }})
        }
    
        setChangePasswordLoader(true)
        setDisabled(true)

        API({
            url: '/defaultapi/user/settings/changepassword',
            type: 'put',
            data: {
                oldpassword: oldpass,
                newpassword: newpass
            }
        }).done(result => {
            setDisabled(false)
            setChangePasswordLoader(false)

            if(result.statusCode === 200) {
                setSuccess(true)

                const jwttokens: UserAuthTokens = result.message
                const customStorage = new CustomStorage()

                const session: boolean = customStorage.get('__refreshToken') ? false : window.sessionStorage.getItem('__refreshToken') ? true : false
                AuthTokens.set(jwttokens.refreshToken, jwttokens.accessToken, session)
            }
            if(result.statusCode === 1800) setVerifycode(true)
            else {
                if(result.message === 'The old password is not correct') {
                    setForm({...form, old: {...form.old, mark: 'error', error: Language("OLD_PASSWORD_INCORRECT")}})
                }
                else if(result.message === '[oldpassword] cannot be the same as [newpassword]'
                    || result.message === 'The new password is similar to the old one') {
                    setForm({...form, new: {...form.new, mark: 'error', error: Language("NEW_PASSWORD_IT_OLD")}})
                }
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
                    <div className="changePassword">
                        <h1 className="success" style={{display: 'flex', justifyContent: 'center', fontSize: "18px", fontWeight: "700", color: "var(--tm-color-txt)"}}>
                            {`Пароль был успешно изменен.`}
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
        <Modal id={"accountSettingsChangePasswordModal"} toggle={true} title={"Изменение пароля"} desciption={"Придумайте сложный пароль, чтобы не потерять аккаунт"}
            icon={(<MdPassword />)}
            phoneHideBtn={true}
            phoneVersion={true}
            body={(
                <div className="changePassword">
                    <Input disabled={disabled} type="password"
                        title={"Введите старый пароль"}
                        data={{ mark: form.old.mark, error: form.old.error }}
                        value={form.old.value}
                        onInput={event => {
                            const value = (event.target as HTMLInputElement).value
                            const tmp = { value, error: null, mark: null }

                            if(value.length && !isValidPassword(value)) {
                                tmp.mark = 'error'
                                tmp.error = Language("INCORRECT_PASSWORD")
                            }

                            setForm({ ...form, old: tmp })
                        }}
                    />
                    <Input disabled={disabled} type="password"
                        title={"Придумайте новый пароль"}
                        data={{ mark: form.new.mark, error: form.new.error }}
                        value={form.new.value}
                        onInput={event => {
                            const value = (event.target as HTMLInputElement).value
                            const tmp = { value, error: null, mark: null }

                            if(value.length && !isValidPassword(value)) {
                                tmp.mark = 'error'
                                tmp.error = Language("INCORRECT_PASSWORD")
                            }

                            setForm({ ...form, new: tmp })
                        }}
                    />
                    <Input disabled={disabled} type="password"
                        title={"Повторите новый пароль"}
                        data={{ mark: form.newRE.mark, error: form.newRE.error }}
                        value={form.newRE.value}
                        onInput={event => {
                            const value = (event.target as HTMLInputElement).value
                            const tmp = { value, error: null, mark: null }

                            if(value.length && !isValidPassword(value)) {
                                tmp.mark = 'error'
                                tmp.error = Language("INCORRECT_PASSWORD")
                            }
                            if(value.length && form.new.value !== value) {
                                tmp.mark = 'error'
                                tmp.error = Language("PASSWORD_DONT_MATCH")
                            }

                            setForm({ ...form, newRE: tmp })
                        }}
                    />
                </div>
            )}

            buttons={changePasswordLoader ? ([ (<>&nbsp;</>), <CircleLoader /> ]) : [ Language("BACK"), Language("CHANGE") ]}
            buttonsBlock={disabled}

            onClose={isBtn => {
                if(onClose) onClose()
            }}
            onClick={() => onSubmit()}
        />
    )
}