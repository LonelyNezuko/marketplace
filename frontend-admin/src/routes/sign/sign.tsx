import React from 'react'
import $ from 'jquery'
import { Link, Navigate } from 'react-router-dom'
import Cookies from 'universal-cookie'
import parseQuery from 'parse-query'

import './sign.scss'

import Input from '../../components/input'
import { CircleLoader } from '../../components/circleLoader/circleLoader'

import { Language } from '../../modules/Language'

import { isValidEmail } from '../../modules/functions/isValidEmail'
import { isValidPassword } from '../../modules/functions/isValidPassword'

import { notify } from '../../modules/Notify'
import { API, APISync } from '../../modules/API'
import Button from '@components/button'
import SetRouteTitle from '@modules/SetRouteTitle'
import ModalVerifyCode, { ModalVerifyCodeData } from '@components/modals/verifycode'
import { Alert } from '@components/alert'
import ModalLoader from '@components/modals/loader'
import { AuthTokens } from '@modules/AuthTokens'
import { UserAuthTokens } from '@dto/user.dto'

export default function RouteSign() {
    SetRouteTitle(Language("ADMIN_ROUTE_TITLE_SIGN"))
    const cookies = new Cookies()

    const [ form, setForm ] = React.useState({
        email: {
            value: '',
            status: false,

            mark: null,
            error: null
        },
        password: {
            value: '',
            status: false,

            mark: null,
            error: null
        }
    })
    const [ generalError, setGeneralError ] = React.useState<string>(null)

    const [ btnStatus, setBtnStatus ] = React.useState(false)
    const [ btnLoading, setBtnLoading ] = React.useState(false)
    const [ formDisabled, setFormDisabled ] = React.useState(false)

    const [ redirect, setRedirect ] = React.useState('/')
    const [ navigate, setNavigate ] = React.useState<string>(null)

    const [ verifyCode, setVerifyCode ] = React.useState(false)
    const [ verifyCodeValue, setVerifyCodeValue ] = React.useState<string>(null)
    const [ verifyCodeRe, setVerifyCodeRe ] = React.useState(false)
    const [ verifyCodeData, setVerifyCodeData ] = React.useState<ModalVerifyCodeData>({
        type: 'email'
    })

    React.useEffect(() => {
        if(verifyCodeValue) {
            setVerifyCode(false)
            onSubmit()
        }
    }, [verifyCodeValue])
    React.useEffect(() => {
        if(verifyCodeRe) {
            setVerifyCodeRe(false)
            onSubmit()
        }
    }, [verifyCodeRe])

    function onSubmit() {
        if(!form.email.status || !form.password.status)return

        function _redirect(jwttokens: UserAuthTokens) {
            AuthTokens.set(jwttokens.refreshToken, jwttokens.accessToken)
            window.location.href = redirect
        }

        async function verifyAccess(jwttokens: UserAuthTokens) {
            const result = await APISync({
                url: "/defaultapi/admin/verifyaccess",
                type: "get",
                headers: {
                    authorization: 'Bearer ' + jwttokens.accessToken
                }
            })

            if(result.statusCode === 200) {
                _redirect(jwttokens)
            }
            else {
                setBtnLoading(false)

                if(result.statusCode === 403) notify(Language("403PAGE_TEXT", "forbidden"))
                else if(result.statusCode === 423) notify(Language("423PAGE_TEXT"))
                else notify(`(sign) /admin/verifyaccess: ` + result.message, { debug: true })
            }
        }
        async function sign() {
            const result = await APISync({
                url: "/defaultapi/user/sign/",
                type: "post",
                data: {
                    email: form.email.value,
                    password: form.password.value,
                    remember: true,
                    language: window.language,
                    verifycode: verifyCodeValue,
                    platform: 'admin'
                }
            })

            if(result.statusCode === 200) {
                const jwttokens: UserAuthTokens = result.message
                verifyAccess(jwttokens)
            }
            else {
                setBtnStatus(false)
                setBtnLoading(false)
                setFormDisabled(false)

                if(result.message === 'Account not found'
                    || result.message === 'Invalid account password') {
                    setGeneralError(Language("SIGNIN_FORM_ERROR_INVALIDACCOUNT"))

                    setForm({...form,
                        email: { ...form.email, mark: 'error' },
                        password: { ...form.password, mark: 'error' }})
                }
                else if(result.message === "The code has already been sent") {
                    setBtnStatus(true)
                    setBtnLoading(true)
                    setFormDisabled(true)

                    Alert(Language("SIGNIN_FORM_ERROR_VERIFYCODE_UNDEFINED"))
                }
                else if(result.message === 'Email verify required'
                    || result.message === 'Incorrect data [verifycode]') {
                    setVerifyCode(true)
                    setVerifyCodeData({
                        type: 'email',
                        email: form.email.value
                    })

                    setVerifyCodeValue(null)
                }
                else if(result.message === 'The code is incorrect') {
                    setVerifyCode(true)
                    setVerifyCodeValue(null)

                    Alert(Language("SIGNIN_FORM_ERROR_VERIFYCODE_INCORRECT"))
                }
                else if(result.message === "The code's lifetime has expired") {
                    Alert(Language("SIGNIN_FORM_ERROR_VERIFYCODE_EXPIRED"))

                    setVerifyCodeValue(null)
                    setVerifyCodeRe(true)
                }
                else notify(`(sign) /user/sign: ` + result.message, { debug: true })
            }
        }

        setBtnStatus(true)
        setBtnLoading(true)
        setFormDisabled(true)

        sign()
    }

    React.useEffect(() => {
        if(form.email.status === true
            && form.password.status === true) {
            setBtnStatus(false)
        }
        else setBtnStatus(true)
    }, [form.email.status, form.password.status])

    React.useMemo(() => {
        const query = parseQuery(window.location.search)
        const redirect = query.redirect || '/'

        setRedirect(redirect)
        if(window.jwtTokenExists)return window.location.href = redirect
    }, [])

    return (
        <div className="route sign">
            {verifyCode && btnLoading ? (
                <ModalLoader />
            ) : ''}

            {verifyCode ? (
                <ModalVerifyCode id={"signin"} length={6} data={verifyCodeData} onSubmit={code => {
                    setVerifyCodeValue(code)
                }} onClose={() => {
                    setVerifyCode(false)
                }} />
            ) : ''}
            
            <div className="wrapper">
                <div className="wrap">
                    <h1 className="title">{Language('SIGN_IN_TITLE', "Заголовок")}</h1>
                    <span className="desc">{Language('SIGN_IN_DESC', "Описание")}</span>

                    <div className="form">
                        <Input name="signAccountEmail" id="signinEmail" type="email" title={Language('SIGN_IN_FORM_EMAIL_NAME', "Почта")} value={form.email.value}
                            data={{ mark: form.email.mark, error: form.email.error }}
                            disabled={formDisabled}

                            onInput={event => {
                                const value = (event.target as HTMLInputElement).value
                                const output = form

                                if(generalError) {
                                    form.password = { ...form.password, error: null, mark: 'accept' }
                                    setGeneralError(null)
                                }

                                if(!isValidEmail(value) && value.length) {
                                    setForm({ ...form, email: { status: false, value: value, mark: 'error', error: Language('SIGN_IN_FORM_EMAIL_ERROR_VALIDATE', "Error email validate") } })
                                }
                                else setForm({ ...form, email: { status: !value.length ? false : true, value: value, mark: !value.length ? null : 'accept', error: null } })
                            }}
                        />
                        <Input name="signAccountPassword" id="signinPassword" type="password" title={Language('SIGN_IN_FORM_PASSWORD_NAME', "Пароль")} value={form.password.value}
                            data={{ mark: form.password.mark, error: form.password.error }}
                            disabled={formDisabled}

                            onInput={event => {
                                const value = (event.target as HTMLInputElement).value
                                const output = form

                                if(generalError) {
                                    form.email = { ...form.email, error: null, mark: 'accept' }
                                    setGeneralError(null)
                                }

                                if(!isValidPassword(value) && value.length) {
                                    setForm({ ...output, password: { status: false, value: value, mark: 'error', error: Language('SIGN_IN_FORM_PASSWORD_ERROR_VALIDATE', "Error password validate") } })
                                }
                                else setForm({ ...output, password: { status: !value.length ? false : true, value: value, mark: !value.length ? null : 'accept', error: null } })
                            }}
                        />
                    </div>

                    {generalError ? (
                        <div className="generalError">
                            <span>{generalError}</span>
                        </div>
                    ) : ''}

                    <div className="other">
                        <Link to="#">{Language('SIGN_IN_FORGOT_PASSWORD', "Забыл пароль")}</Link>
                        <Link to="#">{Language('SIGN_IN_FORGOT_EMAIL', "Забыл почту")}</Link>
                    </div>
                </div>

                <div className="wrap">
                    <div className="action">
                        <Button name={Language('SIGN_IN_SUBMIT', "Войти")} disabled={btnStatus} loader={btnLoading} size={"big"}
                            onClick={onSubmit}
                        />
                    </div>

                    {/* <div className="socialauth">
                        <h1 className="title">{Language('SIGN_IN_SOCIAL_AUTH_TITLE', "Прочий вход")}</h1>
                        <div className="list">
                            <div className="elem">
                                <img src="/assets/socials/google.png" />
                            </div>
                            <div className="elem">
                                <img src="/assets/socials/facebook.png" />
                            </div>
                            <div className="elem">
                                <img src="/assets/socials/twitter.png" />
                            </div>
                            <div className="elem">
                                <img src="/assets/socials/vk.png" />
                            </div>
                        </div>
                    </div> */}
                </div>
            </div>


            {navigate ? (<Navigate to={navigate} />) : ''}
        </div>
    )
}