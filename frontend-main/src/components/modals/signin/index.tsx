import React from 'react'
import $ from 'jquery'
import { Link, useLocation, Navigate } from 'react-router-dom'
import Cookies from 'universal-cookie'
import queryParser from 'parse-query'

import Input from '@components/input'
import { CircleLoader } from '@components/circleLoader/circleLoader'
import { Avatar } from '@components/avatar/avatar'

import { isValidEmail } from '@modules/functions/isValidEmail'
import { isValidPassword } from '@modules/functions/isValidPassword'
import { API, APISync } from '@modules/API'
import { notify } from '@modules/Notify'
import { Language } from '@modules/Language'

import CONFIG from '@config'

import './index.scss'

import { IoMdClose } from 'react-icons/io'

import { RiAccountBoxFill } from 'react-icons/ri'
import { PiPasswordBold } from 'react-icons/pi'
import { isValidJSON } from '@modules/functions/isValidJSON'

import { ImArrowRight2 } from "react-icons/im";
import UserDTO, { UserAuthTokens } from '@dto/user.dto'
import PhoneTopHide from '@components/phoneTopHide'
import Button from '@components/button'
import { Alert } from '@components/alert'
import ModalVerifyCode, { ModalVerifyCodeData } from '../verifycode'
import ModalLoader from '../loader'
import { SavedaccountDTO } from '@dto/savedaccount.dto'
import { CustomStorage } from '@modules/CustomStorage'
import { AuthTokens } from '@modules/AuthTokens'
import UserHistory from '@modules/UserHistory'
import API_initUser from '@modules/API/loadUserData'


type ModalSigninFormProperties = {
    value: string,
    status: 'error' | 'accept' | '',
    error: string
}
interface ModalSigninForm {
    itSaveAccount?: boolean,
    saveAccount?: any,

    email: ModalSigninFormProperties,
    password: ModalSigninFormProperties,

    rememberAccount?: boolean,
    dontRemember?: boolean
}


export default function ModalSignin() {
    const location = useLocation()

    const [ navigate, setNavigate ] = React.useState(null)
    React.useEffect(() => { if(navigate !== null) setNavigate(null) }, [navigate])

    const [ redirectLink, setRedirectLink ] = React.useState(window.location.pathname)
    const [ disabled, setDisabled ] = React.useState(false)

    const [ btnDisabled, setBtnDislabed ] = React.useState(true)
    const [ btnLoader, setBtnLoader ] = React.useState(false)

    const [ form, setForm ] = React.useState<ModalSigninForm>({
        itSaveAccount: false,
        saveAccount: null,

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

        rememberAccount: false,
        dontRemember: false
    })

    const [ accounts, setAccounts ] = React.useState([])
    const [ imNotWantSaveAccounts, setImNotWantSaveAccount ] = React.useState(false)

    const [ description, setDescription ] = React.useState(Language("SIGNIN_DESC", "DESC"))

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

    React.useEffect(() => {
        if(form.email.status === 'accept'
            && form.password.status === 'accept') {
            setBtnDislabed(false)
        }
        else setBtnDislabed(true)
    }, [form])
    React.useMemo(() => {
        if(window.jwtTokenExists) {
            AuthTokens.clear()
            window.location = window.location
        }

        if(new CustomStorage().get('signinAccounts')) {
            let signinAccounts: SavedaccountDTO[] = new CustomStorage().get('signinAccounts')
            if(!signinAccounts) signinAccounts = []

            setAccounts(signinAccounts)
            setImNotWantSaveAccount(false)
        }

        const query = queryParser(location.hash.replace('#signin', ''))

        if(query.redirect) {
            setRedirectLink(query.redirect)
            console.log(query)
        }
        if(query.desc) {
            if(query.desc === 'favorite') setDescription(Language("SIGNIN_DESC_FAVORITE"))
            else if(query.desc === 'placead') setDescription(Language("SIGNIN_DESC_PLACEAD"))
        }

        if(window.isPhone) {
            setTimeout(() => {
                $('.modal.signin .wrapper').css({ transform: 'none' })
            }, 50)
        }
    }, [])

    function onSubmit() {
        if(btnDisabled || disabled || btnLoader)return

        setDisabled(true)
        setBtnDislabed(true)
        setBtnLoader(true)

        function _redirect(jwttokens: UserAuthTokens) {
            UserHistory.update()

            setTimeout(() => {
                window.location.href = redirectLink
            }, 1000)
        }

        async function sign() {
            const result = await APISync({
                url: '/defaultapi/user/sign',
                type: 'post',
                _doNotInit: true,
                data: {
                    email: form.email.value,
                    password: form.password.value,
                    language: window.language,
                    verifycode: verifyCodeValue,
                    platform: 'site'
                }
            })

            if(result.statusCode === 200) {
                const jwttokens: UserAuthTokens = result.message
                AuthTokens.set(jwttokens.refreshToken, jwttokens.accessToken, form.dontRemember)

                await API_initUser()

                if(form.rememberAccount === true
                    || form.itSaveAccount === true) {
                    saveAccount(jwttokens)
                }
                else _redirect(jwttokens)
            }
            else {
                setDisabled(false)
                setBtnLoader(false)
                setBtnDislabed(false)

                if(result.message === 'Account not found' || result.message === 'Invalid account password') {
                    setForm({...form,
                        email: {...form.email, status: !form.itSaveAccount ? 'error' : 'accept', error: !form.itSaveAccount ? Language("SIGNIN_FORM_ERROR_INVALIDACCOUNT") : ''},
                        password: {...form.password, status: 'error', error: Language("SIGNIN_FORM_ERROR_INVALIDACCOUNT")}})
                }
                else if(result.message === "The code has already been sent") {
                    setDisabled(true)
                    setBtnLoader(true)
                    setBtnDislabed(true)

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
                else {
                    Alert(Language("SIGNUP_FORM_ERROR_UNKNOWN"))
                    notify("(signin) /user/sing: " + result.message, { debug: true })
                }
            }
        }
        async function saveAccount(jwttokens: UserAuthTokens) {
            const result = await APISync({
                url: '/defaultapi/user/',
                type: 'get'
            })

            if(result.statusCode === 200) {
                const user: UserDTO = result.message

                let signinAccounts: SavedaccountDTO[] = new CustomStorage().get('signinAccounts')
                if(!signinAccounts) signinAccounts = []

                const accountIndex = signinAccounts.findIndex(elem => elem.id === user.id)
                const accountData: SavedaccountDTO = { id: user.id, name: user.name, avatar: user.avatar, email: user.email, lastSign: new Date() }

                if(signinAccounts.length >= CONFIG.maxSigninSaveAccounts
                    && accountIndex === -1) {
                    Alert(Language("SINGIN_MAX_SAVED_ACCOUNTS_ERROR"))
                    return _redirect(jwttokens)
                }

                if(accountIndex !== -1) signinAccounts[accountIndex] = accountData
                else signinAccounts.push(accountData)

                new CustomStorage().set('signinAccounts', signinAccounts)
                _redirect(jwttokens)
            }
            else notify("(signin) /user/: " + result.message, { debug: true })
        }

        sign()
    }

    function onClose(link: string = location.pathname + location.search) {
        if(!window.isPhone)return setNavigate(link)

        $('.modal.signin .wrapper').css({ transform: 'translateY(100%)' })
        setTimeout(() => {
            setNavigate(link)
        }, 300)
    }

    return (
        <div className={`modal signin`}>
            {verifyCode && btnLoader ? (
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
                {window.isPhone && (
                    <PhoneTopHide onHide={() => onClose()} />
                )}

                <div className="wrap">
                    <div className="header">
                        <div className="title">
                            <h1>{Language("SIGNIN_TITLE", "TITLE")}</h1>
                            <span>{description}</span>
                        </div>
                        {!window.isPhone && (
                            <div className="close" onClick={() => onClose()}>
                                <IoMdClose />
                            </div>
                        )}
                    </div>
                    {(accounts.length > 0 && !imNotWantSaveAccounts && !form.itSaveAccount) ? (
                        <>
                            <SaveAccounts accounts={accounts} form={form} setForm={setForm} setImNotWantSaveAccount={setImNotWantSaveAccount} />
                        </>
                    ) : (
                        <>
                            <div className="form">
                                <Input value={form.itSaveAccount ? form.saveAccount.email : form.email.value} disabled={form.itSaveAccount || disabled} id="signinEmail" type="text" title={Language("SIGNIN_FORM_EMAIL_TITLE", "email")} name="email"
                                    style={{ display: form.itSaveAccount && 'none' }}
                                    data={{placeholder: Language("SIGNIN_FORM_EMAIL_PLACEHOLDER", "PLACEHOLDER"), mark: form.email.status, error: form.email.error}}
                                    icon={(<RiAccountBoxFill />)}
                                    onInput={event => {
                                        if(form.itSaveAccount)return

                                        const value = (event.target as HTMLInputElement).value
                                        const result: ModalSigninFormProperties = {value, status: '', error: ''}

                                        if(value.length && !isValidEmail(value)) {
                                            result.status = 'error'
                                            result.error = Language("SIGNIN_FORM_EMAIL_ERROR_NOTVALID", "ERROR_NOTVALID")
                                        }
                                        else if(value.length) result.status = 'accept'

                                        const outform: ModalSigninForm = { ...form, email: result }
                                        if(form.email.status === 'error'
                                            && form.email.error === form.password.error) {
                                            outform.password = { ...form.password, status: 'accept', error: null }
                                        }

                                        setForm(outform)
                                    }}
                                />
                                {form.itSaveAccount ? (<SaveAccountBlock account={form.saveAccount} hideArrow={true} />) : ''}
                                
                                <Input style={form.itSaveAccount ? {marginTop: "20px"} : {}} value={form.password.value} disabled={disabled} id="signinPassword" type="password" title={Language("SIGNIN_FORM_PASSWORD_TITLE", "PASSWORD")} name="password"
                                    data={{mark: form.password.status, error: form.password.error}}
                                    icon={(<PiPasswordBold />)}
                                    onInput={event => {
                                        const value = (event.target as HTMLInputElement).value
                                        const result: ModalSigninFormProperties = {value, status: '', error: ''}

                                        if(value.length && !isValidPassword(value)) {
                                            result.status = 'error'
                                            result.error = Language("SIGNIN_FORM_PASSWORD_ERROR_NOTVALID", "ERROR_NOTVALID")
                                        }
                                        else if(value.length) result.status = 'accept'

                                        const outform: ModalSigninForm = { ...form, password: result }
                                        if(form.password.status === 'error'
                                            && form.email.error === form.password.error) {
                                            outform.email = { ...form.email, status: 'accept', error: null }
                                        }

                                        setForm(outform)
                                    }} />
                            </div>
                            <div className="other">
                                {!form.itSaveAccount ? (
                                    <div className="inputcheckbox">
                                        <div className="inputcheckboxwrap">
                                            <input disabled={disabled} type="checkbox" id="signinRememberAccount" checked={form.rememberAccount} onChange={event => {
                                                setForm({...form, rememberAccount: event.target.checked})
                                            }} />
                                            <label htmlFor="signinRememberAccount">
                                                {Language("SIGNIN_FORM_REMEMBER_ACCOUNT", "REMEMBER ACCCOUNT")}
                                                <span className="hoverinfo" data-info={Language("SIGNIN_FORM_REMEMBER_ACCOUNT_DESC", "REMEMBER ACCOUNT DESC")}></span>
                                            </label>
                                        </div>
                                    </div>
                                ) : ""}

                                <div className="inputcheckbox">
                                    <div className="inputcheckboxwrap">
                                        <input disabled={disabled} type="checkbox" id="signinRemember" checked={form.dontRemember} onChange={event => {
                                            setForm({...form, dontRemember: event.target.checked})
                                        }} />
                                        <label htmlFor="signinRemember">
                                            {Language("SIGNIN_FORM_REMEMBER", "REMEMBER")}
                                            <span className="hoverinfo" data-info={Language("SIGNIN_FORM_REMEMBER_DESC", "REMEMBER_DESC")}></span>
                                        </label>
                                    </div>
                                </div>
                                {disabled ? (
                                    <div style={{cursor: 'default'}} className="linkblock">
                                        <span>{Language("SIGNIN_FORM_FORGOT_PASSWORD", "FORGOT_PASSWORD")}</span>
                                    </div>    
                                ) : (
                                    <Link to="#forgetpassword" className="linkblock">
                                        <span>{Language("SIGNIN_FORM_FORGOT_PASSWORD", "FORGOT_PASSWORD")}</span>
                                    </Link>
                                )}
                                {form.itSaveAccount ? (
                                    <div style={{cursor: !disabled ? 'pointer' : 'default'}} className="linkblock" onClick={() => {
                                        if(disabled)return

                                        setImNotWantSaveAccount(false)
                                        setForm({...form, itSaveAccount: false, saveAccount: null, email: { value: '', status: '', error: '' }, password: { value: '', status: '', error: '' }, dontRemember: false, rememberAccount: false})
                                    }}>
                                        <span>{Language("LOGIN_CHOICE_ANOTHER_ACCOUNT")}</span>
                                    </div>
                                ) : ''}
                            </div>
                            <div className="action">
                                <Button disabled={btnDisabled || disabled} loader={btnLoader} name={Language("SIGNIN_FORM_ENTER")} type={"fill"} size={"big"} onClick={() => onSubmit()} />
                            </div>
                        </>
                    )}
                </div>

                <div className="wrap">
                    <div className="bottom">
                        {/* <div className="block socialsignin">
                            <h1 className="title">{Language("SIGNIN_FORM_SOCIALS_TITLE", "SOCIALS_TITLE")}</h1>
                            <div className="list">
                                <img src="/assets/socials/google.png" />
                                <img src="/assets/socials/facebook.png" />
                                <img src="/assets/socials/vk.png" />
                            </div>
                        </div> */}
                        <div className="block signup">
                            <h1 className="title">{Language("SIGNIN_FORM_SIGNUP_TITLE", "SIGNUP_TITLE")}</h1>
                            <Button name={Language("SIGNIN_FORM_SIGNUP_ENTER", "SIGNUP_ENTER")} type={"hover"} size={"medium"}
                                onClick={() => onClose('#signup' + (redirectLink !== window.location.pathname ? ('?redirect=' + redirectLink) : ''))}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {navigate ? (<Navigate to={navigate} />) : ''}
        </div>
    )
}

function SaveAccounts({
    accounts,

    form,
    setForm,

    setImNotWantSaveAccount
}) {
    return (
        <div className="saveaccounts">
            <div className="list">
                {accounts.map((item, i) => {
                    return (
                        <SaveAccountBlock account={item} key={i} onClick={() => {
                            setForm({...form, itSaveAccount: true, saveAccount: item, email: { value: item.email, status: 'accept', error: '' }, password: { value: '', status: '', error: '' }, rememberAccount: false, dontRemember: false})
                        }} />
                    )
                })}
            </div>
            <div className="other">
                <button onClick={() => {
                    setForm({...form, itSaveAccount: false, saveAccount: null, email: { value: '', accept: '', error: '' }, password: { value: '', accept: '', error: '' }, dontRemember: false, rememberAccount: false})
                    setImNotWantSaveAccount(true)
                }}>Войти в другой аккаунт</button>
            </div>
        </div>
    )
}

interface SaveAccountBlockProps {
    account: UserDTO,
    onClick?: Function | null,

    hideArrow?: boolean
}
function SaveAccountBlock({
    account,
    onClick,

    hideArrow = false
}: SaveAccountBlockProps) {
    if(!account)return
    return (
        <div className="saveAccountBlock" onClick={() => {
            if(onClick) onClick()
        }}>
            <section>
                <Avatar image={account.avatar.image} size={account.avatar.size} position={account.avatar.position} />
                <div className="right">
                    <h1 className="name">{account.name[0] + " " + account.name[1]}</h1>
                    <span className="email">{account.email}</span>
                </div>
            </section>
            {!hideArrow ? (
                <section>
                    <ImArrowRight2 />
                </section>
            ) : ''}
        </div>
    )
}