import React from 'react'
import $ from 'jquery'
import { Link, Navigate, useLocation } from 'react-router-dom'
import queryParser from 'parse-query'

import Input from '@components/input'

import { Language } from '@modules/Language'
import { notify } from '@modules/Notify'

import './index.scss'

import { IoMdClose } from 'react-icons/io'

import { RiAccountBoxFill } from 'react-icons/ri'
import { PiPasswordBold } from 'react-icons/pi'
import { MdAlternateEmail } from 'react-icons/md'
import { isValidEmail } from '@modules/functions/isValidEmail'
import { isValidPassword } from '@modules/functions/isValidPassword'
import Button from '@components/button'
import PhoneTopHide from '@components/phoneTopHide'
import { API, APISync } from '@modules/API'
import GeolocationDTO from '@dto/geolocation.dto'
import { Alert } from '@components/alert'
import Cookies from 'universal-cookie'
import { CustomStorage } from '@modules/CustomStorage'
import { UserAuthTokens } from '@dto/user.dto'
import { AuthTokens } from '@modules/AuthTokens'
import UserHistory from '@modules/UserHistory'

type ModalSignupFormProperties = {
    value: string,
    status: 'error' | 'accept' | '',
    error: string
}
interface ModalSignupForm {
    itSaveAccount?: boolean,
    saveAccount?: any,

    name: ModalSignupFormProperties,
    surname: ModalSignupFormProperties
    email: ModalSignupFormProperties,
    password: ModalSignupFormProperties,
    passwordre: ModalSignupFormProperties,

    rules: boolean,
    dontRememberAccount: boolean
}

export default function ModalSignup() {
    const location = useLocation()

    const [ navigate, setNavigate ] = React.useState(null)
    React.useEffect(() => { if(navigate !== null) setNavigate(null) }, [navigate])
    
    const [ redirectLink, setRedirectLink ] = React.useState(window.location.pathname)

    const [ form, setForm ] = React.useState<ModalSignupForm>({
        name: {
            value: '',
            status: '',
            error: ''
        },
        surname: {
            value: '',
            status: '',
            error: ''
        },
        email: {
            value: '',
            status: '',
            error: ''
        },
        password: {
            value: '',
            status: '',
            error: ''
        },
        passwordre: {
            value: '',
            status: '',
            error: ''
        },

        rules: false,
        dontRememberAccount: false
    })

    const [ disabled, setDisabled ] = React.useState(false)
    const [ btnLoader, setBtnLoader ] = React.useState(false)
    const [ btnDisabled, setBtnDisabled ] = React.useState(false)

    const [ geolocation, setGeolocation ] = React.useState<GeolocationDTO>(null)
    React.useEffect(() => {
        setGeolocation(window.userdata.geolocation)
    }, [window.userdata.geolocation])

    React.useEffect(() => {
        if(form.name.status !== 'accept'
            || form.surname.status !== 'accept'
            || form.email.status !== 'accept'
            || form.password.status !== 'accept'
            || form.passwordre.status !== 'accept'
            || form.rules !== true) setBtnDisabled(true)
        else setBtnDisabled(false)
    }, [form])

    React.useMemo(() => {
        if(window.jwtTokenExists) {
            AuthTokens.clear()
            window.location = window.location
        }

        const query = queryParser(location.hash.replace('#signup', ''))

        if(query.redirect) {
            setRedirectLink(query.redirect)
        }

        if(window.isPhone) {
            setTimeout(() => {
                $('.modal.signup .wrapper').css({ transform: 'none' })
            }, 50)
        }
    }, [])


    async function onSubmit() {
        if(btnDisabled || disabled || btnLoader)return

        setDisabled(true)
        setBtnDisabled(true)
        setBtnLoader(true)

        const result = await APISync({
            url: '/defaultapi/user/sign/up',
            type: 'post',
            data: {
                email: form.email.value,
                password: form.password.value,
                name: [ form.name.value, form.surname.value ],
                geolocation: geolocation,
                currency: window.userdata.currency,
                platform: 'site'
            }
        })

        if(result.statusCode === 200) {
            const jwttokens: UserAuthTokens = result.message
            AuthTokens.set(jwttokens.refreshToken, jwttokens.accessToken, form.dontRememberAccount)

            UserHistory.update()

            setTimeout(() => {
                window.location.href = redirectLink
            }, 1000)
        }
        else {
            setDisabled(false)
            setBtnLoader(false)
            setBtnDisabled(true)

            if(result.message === 'Account witch this Email already exists') {
                setForm({...form,
                    email: {...form.email, status: 'error', error: Language("SIGNUP_FORM_ERROR_ACCOUNTEXISTS")}})
            }
            else {
                Alert(Language("SIGNUP_FORM_ERROR_UNKNOWN"))
                notify("(signin) /user/sing/up: " + result.message, { debug: true })
            }
        }
    }
    function onClose(link: string = location.pathname + location.search) {
        if(!window.isPhone)return setNavigate(link)

        $('.modal.signup .wrapper').css({ transform: 'translateY(100%)' })
        setTimeout(() => {
            setNavigate(link)
        }, 300)
    }

    return (
        <div className={`modal signin signup`}>
            <div className="wrapper">
                {window.isPhone && (
                    <PhoneTopHide onHide={() => onClose()} />
                )}

                <div className="wrap">
                    <div className="header">
                        <div className="title">
                            <h1>{Language("SIGNUP_TITLE")}</h1>
                            <span>{Language("SIGNUP_DESC")}</span>
                        </div>

                        {!window.isPhone ? (
                            <Link to={window.location.pathname} className="close">
                                <IoMdClose />
                            </Link>
                        ) : ''}
                    </div>
                    <div className="form">
                        <div className="flex" style={{ marginBottom: '10px' }}>
                            <Input autoComplete='given-name' id="signupName" type="text" title={Language("SIGNUP_FORM_NAME_TITLE")} name="given-name"
                                data={{ mark: form.name.status }}
                                icon={(<RiAccountBoxFill />)}
                                disabled={disabled}

                                value={form.name.value}
                                onInput={event => {
                                    const value = (event.target as HTMLInputElement).value
                                    const result: ModalSignupFormProperties = {value, status: '', error: ''}

                                    if(value.length && (value.length < 4 || value.length > 24)) {
                                        result.status = 'error'
                                        result.error = Language("SIGNUP_FORM_NAME_ERROR_NOTVALID", "ERROR_NOTVALID")
                                    }
                                    else if(value.length) result.status = 'accept'

                                    const outform: ModalSignupForm = { ...form, name: result }
                                    setForm(outform)
                                }}
                            />
                            
                            <Input autoComplete='family-name' id="signupSurname" type="text" title={Language("SIGNUP_FORM_SURNAME_TITLE")} name="family-name"
                                data={{ mark: form.surname.status }}
                                icon={(<RiAccountBoxFill />)}
                                disabled={disabled}

                                value={form.surname.value}
                                onInput={event => {
                                    const value = (event.target as HTMLInputElement).value
                                    const result: ModalSignupFormProperties = {value, status: '', error: ''}

                                    if(value.length && (value.length < 4 || value.length > 24)) {
                                        result.status = 'error'
                                        result.error = Language("SIGNUP_FORM_NAME_SUR_ERROR_NOTVALID", "ERROR_NOTVALID")
                                    }
                                    else if(value.length) result.status = 'accept'

                                    const outform: ModalSignupForm = { ...form, surname: result }
                                    setForm(outform)
                                }}
                            />
                        </div>

                        {(form.name.status === 'error' || form.surname.status === 'error') ? (
                            <section style={{ marginBottom: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                                <span style={{ color: 'var(--tm-color-red)', textAlign: 'right', fontSize: '12px' }}>{form.name.error || form.surname.error}</span>
                            </section>
                        ) : ''}

                        <Input autoComplete='email' id="signupEmail" type="email" title={Language("SIGNUP_FORM_EMAIL_TITLE")} name="email"
                            data={{ placeholder: Language("SIGNUP_FORM_EMAIL_DESC"), mark: form.email.status, error: form.email.error }}
                            icon={(<MdAlternateEmail />)}
                            disabled={disabled}

                            value={form.email.value}
                            onInput={event => {
                                const value = (event.target as HTMLInputElement).value
                                const result: ModalSignupFormProperties = {value, status: '', error: ''}

                                if(value.length && !isValidEmail(value)) {
                                    result.status = 'error'
                                    result.error = Language("SIGNIN_FORM_EMAIL_ERROR_NOTVALID", "ERROR_NOTVALID")
                                }
                                else if(value.length) result.status = 'accept'

                                const outform: ModalSignupForm = { ...form, email: result }
                                setForm(outform)
                            }}
                        />
                        
                        <Input autoComplete='off' id="signupPassword" type="password" title={Language("SIGNUP_FORM_PASSWORD_TITLE")}
                            data={{ mark: form.password.status, error: form.password.error }}
                            icon={(<PiPasswordBold />)}
                            disabled={disabled}  

                            value={form.password.value}
                            onInput={event => {
                                const value = (event.target as HTMLInputElement).value
                                const result: ModalSignupFormProperties = {value, status: '', error: ''}

                                if(value.length && !isValidPassword(value)) {
                                    result.status = 'error'
                                    result.error = Language("SIGNIN_FORM_PASSWORD_ERROR_NOTVALID", "ERROR_NOTVALID")
                                }
                                else if(value.length && form.passwordre.value.length && value !== form.passwordre.value) {
                                    result.status = 'error'
                                    result.error = Language("SIGNUP_FORM_PASSWORD_RE_ERROR_NOTMATCH")
                                }
                                else if(value.length) result.status = 'accept'

                                const outform: ModalSignupForm = { ...form, password: result }
                                if(form.passwordre.status === 'error'
                                    && form.passwordre.error === form.password.error) {
                                    outform.passwordre = { ...form.passwordre, status: 'accept', error: null }
                                }
                                if(result.error === Language("SIGNUP_FORM_PASSWORD_RE_ERROR_NOTMATCH")) {
                                    outform.passwordre = { ...form.passwordre, status: 'error', error: Language("SIGNUP_FORM_PASSWORD_RE_ERROR_NOTMATCH") }
                                }

                                setForm(outform)
                            }}
                        />
                        
                        <Input autoComplete='off' id="signupPasswordRe" type="password" title={Language("SIGNUP_FORM_PASSWORD_RE_TITLE")}
                            data={{ mark: form.passwordre.status, error: form.passwordre.error }}
                            icon={(<PiPasswordBold />)}
                            disabled={disabled}

                            value={form.passwordre.value}
                            onInput={event => {
                                const value = (event.target as HTMLInputElement).value
                                const result: ModalSignupFormProperties = {value, status: '', error: ''}

                                if(value.length && !isValidPassword(value)) {
                                    result.status = 'error'
                                    result.error = Language("SIGNIN_FORM_PASSWORD_ERROR_NOTVALID", "ERROR_NOTVALID")
                                }
                                else if(value.length && form.password.value.length && value !== form.password.value) {
                                    result.status = 'error'
                                    result.error = Language("SIGNUP_FORM_PASSWORD_RE_ERROR_NOTMATCH")
                                }
                                else if(value.length) result.status = 'accept'

                                const outform: ModalSignupForm = { ...form, passwordre: result }
                                if(form.password.status === 'error'
                                    && form.password.error === form.passwordre.error) {
                                    outform.password = { ...form.password, status: 'accept', error: null }
                                }
                                if(result.error === Language("SIGNUP_FORM_PASSWORD_RE_ERROR_NOTMATCH")) {
                                    outform.password = { ...form.password, status: 'error', error: Language("SIGNUP_FORM_PASSWORD_RE_ERROR_NOTMATCH") }
                                }

                                setForm(outform)
                            }}
                        />
                    </div>
                    <div className="other">
                        <div className="inputcheckbox">
                            <div className="inputcheckboxwrap">
                                <input disabled={disabled} type="checkbox" id="signupAcceptRules" checked={form.rules} onChange={event => {
                                    setForm({ ...form, rules: event.target.checked })
                                }} />
                                <label htmlFor="signupAcceptRules">{Language("SIGNUP_FORM_RULES", null, { isjsx: true })}</label>
                            </div>
                        </div>
                        <div className="inputcheckbox">
                            <div className="inputcheckboxwrap">
                                <input disabled={disabled} type="checkbox" id="signupdontRememberAccount" checked={form.dontRememberAccount} onChange={event => {
                                    setForm({ ...form, dontRememberAccount: event.target.checked })
                                }} />
                                <label htmlFor="signupdontRememberAccount">
                                    {Language("SIGNIN_FORM_REMEMBER", "REMEMBER")}
                                    <span className="hoverinfo" data-info={Language("SIGNIN_FORM_REMEMBER_DESC", "REMEMBER_DESC")}></span>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div className="action">
                        <Button disabled={btnDisabled || disabled} loader={btnLoader} name={Language("SIGNUP_FORM_ENTER")} type={"fill"} size={"big"}
                            onClick={() => onSubmit()}
                        />
                    </div>
                </div>
                <div className="wrap">
                    <div className="bottom">
                        {/* <div className="block socialsignin">
                            <h1 className="title">{Language("SIGNUP_FORM_SOCIALS_TITLE", "SOCIALS_TITLE")}</h1>
                            <div className="list">
                                <img src="/assets/socials/google.png" />
                                <img src="/assets/socials/facebook.png" />
                                <img src="/assets/socials/vk.png" />
                            </div>
                        </div> */}
                        <div className="block signup">
                            <h1 className="title">{Language("SIGNUP_FORM_SIGNIN_TITLE", "SIGNUP_TITLE")}</h1>
                            <Button name={Language("SIGNUP_FORM_SIGNIN_ENTER", "SIGNUP_ENTER")} type={"hover"} size={"medium"}
                                onClick={() => onClose('#signin' + (redirectLink !== window.location.pathname ? ('?redirect=' + redirectLink) : ''))}
                            />
                        </div>
                    </div>
                </div>
            </div>


            {navigate ? (<Navigate to={navigate} />) : ''}
        </div>
    )
}