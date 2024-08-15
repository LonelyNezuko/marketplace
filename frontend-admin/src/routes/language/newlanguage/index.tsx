import React from 'react'
import $ from 'jquery'
import 'jquery.scrollto'
import { Link, Navigate } from 'react-router-dom'

import Input from '@components/input'
import { CircleLoader } from '@components/circleLoader/circleLoader'
import { Language } from '@modules/Language'
import { API } from '@modules/API'

import './index.scss'

import { RouteErrorCode, RouteErrorCodeProps } from '@routes/errorcodes'
import { notify } from '@modules/Notify'

import { Modal } from '@components/modals'

import { BiReset } from "react-icons/bi";
import Button from '@components/button'
import { Alert } from '@components/alert'
import DotsLoader from '@components/dotsloader'
import SetRouteTitle from '@modules/SetRouteTitle'

export default function RouteLanguageNew() {
    SetRouteTitle(Language("ADMIN_ROUTE_TITLE_LANGUAGE_NEW"))

    const [ loader, setLoader ] = React.useState(true)
    const [ errorPage, setErrorPage ] = React.useState<RouteErrorCodeProps>({ code: 0, text: '', showbtn: false })

    const [ navigate, setNavigate ] = React.useState(null)
    React.useEffect(() => { if(navigate !== null) setNavigate(null) }, [navigate])
    
    const [ btnDisabled, setBtnDisabled ] = React.useState(false)
    const [ btnLoader, setBtnLoader ] = React.useState(false)
    const [ success, setSuccess ] = React.useState(false)

    const [ defaultParams, setDefaultParams ] = React.useState([])

    const [ form, setForm ] = React.useState({
        name: {
            value: '',
            mark: null,
            error: null
        },
        code: {
            value: '',
            mark: null,
            error: null
        },
        active: false
    })

    function onSubmit() {
        if(btnDisabled || btnLoader)return

        let paramserror = false
        let paramserrorid = -1

        defaultParams.map((item, i) => {
            if(!item[2].length) {
                paramserror = true
                paramserrorid = i
            }
        })
        if(paramserror) {
            notify('ROUTE_LANGUAGENEW_ERROR_PARAMS_EMPTY')

            if(paramserrorid > 2) paramserrorid -= 2
            $(`#rootWrapper`).scrollTo($(`.route#newlanguage .params.editor .section[data-key="${paramserrorid}"]`), 500)

            return
        }

        setBtnDisabled(true)
        setBtnLoader(true)

        const params = {}
        defaultParams.map((item, i) => {
            params[item[0]] = item[2]
        })

        API({
            url: '/defaultapi/service/language/new',
            type: 'post',
            data: {
                name: form.name.value,
                code: form.code.value,
                active: !form.active ? 0 : 1,
                params: JSON.stringify(params), // json
            }
        }).done(result => {
            if(result.statusCode === 200) {
                setSuccess(true)
                
                setBtnLoader(false)
                setBtnDisabled(false)
            }
            else {
                setBtnDisabled(false)
                setBtnLoader(false)

                if(result.statusCode === 403) setErrorPage({ code: 403 })
                else if(result.message === 'A language with such a name or code already exists') {
                    Alert(Language("ADMIN_LANGUAGES_NEW_ERROR_1"))
                }
                else notify('(newlanguage) /service/language/new: ' + result.message, { debug: true })
            }
        })
    }

    React.useMemo(() => {
        setLoader(true)
        setBtnDisabled(true)
        setBtnLoader(false)

        API({
            url: '/defaultapi/service/language/example',
            type: 'get',
        }).done(result => {
            if(result.statusCode === 200) {
                const language = result.message

                let tmp = []
                for(let key in language.params) {
                    tmp.push([key, language.params[key], language.params[key]])
                }

                setDefaultParams(tmp)
                setLoader(false)
            }
            else notify('(newlanguage) /service/language/example: ' + result.message, { debug: true })
        })
    }, [])
    React.useEffect(() => {
        if(form.name.value.length
            && !form.name.error
            && form.code.value.length
            && !form.code.error) setBtnDisabled(false)
        else setBtnDisabled(true)
    }, [form])

    if(errorPage.code !== 0)return (
        <RouteErrorCode style={{marginTop: "128px"}} code={errorPage.code} text={errorPage.text}
            showbtn={errorPage.showbtn} btnurl={errorPage.btnurl} btnname={errorPage.btnname}
            icon={errorPage.icon} />
    )
    if(loader)return (
        <div style={{display: 'flex', justifyContent: 'center', padding: '124px 0'}}>
            <DotsLoader size={"medium"} color={"colorful"} />
        </div>
    )
    return (
        <div className="route languageeditorblock" id="newlanguage">
            {success ? (
                <Modal toggle={true} title={Language("ROUTE_LANGUAGENEW_SUCCESS_TITLE", null, {}, form.name.value)} onClose={() => {
                    setNavigate('/language/')
                }} body={null} />
            ) : ''}
            
            <section className="header">
                <div className="title">
                    <h1 className="routetitle">{Language("ROUTE_LANGUAGENEW_TITLE")}</h1>
                </div>
                <div className="actions">
                    <Button name={Language("ADD")} size={"medium"} loader={btnLoader} disabled={btnDisabled} onClick={onSubmit} />
                    <Link to="/language">
                        <Button name={Language("CANCEL")} size={"medium"} classname='cancel' />
                    </Link>
                </div>
            </section>

            <div className="border">
                <div className="params">
                    <section className="section">
                        <div className="name">
                            <h1>{Language("ROUTE_LANGUAGENEW_PARAM_NAME")}</h1>
                        </div>
                        <div className="params-value">
                            <Input maxLength={16} value={form.name.value} type="text" data={{ placeholder: Language("EXAMPLE", '', {}, "Русский"), mark: form.name.mark, error: form.name.error }}
                                onInput={event => {
                                    const value = (event.target as HTMLInputElement).value

                                    let error = null
                                    let mark = null

                                    if(value.length) {
                                        if(value.length < 4 || value.length > 16) {
                                            error = Language('ROUTE_LANGUAGENEW_FORM_NAME_ERROR_LENGTH')
                                            mark = 'error'
                                        }
                                    }
                                    setForm({...form, name: {...form.name, value, mark, error}})
                                }}
                            />
                        </div>
                    </section>
                    <section className="section">
                        <div className="name">
                            <h1>{Language("ROUTE_LANGUAGENEW_PARAM_CODE")}</h1>
                        </div>
                        <div className="params-value">
                            <Input maxLength={2} value={form.code.value} type="text" data={{ placeholder: Language("EXAMPLE", '', {}, "RU"), mark: form.code.mark, error: form.code.error }}
                                onInput={event => {
                                    const value = (event.target as HTMLInputElement).value

                                    let error = null
                                    let mark = null

                                    if(value.length) {
                                        if(value.length != 2) {
                                            error = Language('ROUTE_LANGUAGENEW_FORM_CODE_ERROR_LENGTH')
                                            mark = 'error'
                                        }
                                        if(value !== value.toLowerCase()) {
                                            error = Language('ROUTE_LANGUAGENEW_FORM_CODE_ERROR_CASE')
                                            mark = 'error'
                                        }
                                    }
                                    setForm({...form, code: {...form.code, value, mark, error}})
                                }}
                            />
                        </div>
                    </section>
                    <section className="section">
                        <div className="name">
                            <h1>{Language("ROUTE_LANGUAGENEW_PARAM_ACTIVE")}</h1>
                            <span className="hoverinfo" data-info={Language("ROUTE_LANGUAGENEW_PARAM_ACTIVE_DESC")}></span>
                        </div>
                        <div className="value checkbox">
                            <div className="inputcheckbox big">
                                <input checked={form.active} type="checkbox" onChange={event => {
                                    setForm({...form, active: event.target.checked})
                                }} />
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            <Params defaultParams={defaultParams} setDefaultParams={setDefaultParams} />

            <div className="actions bottom">
                <Button name={Language("ADD")} size={"big"} loader={btnLoader} disabled={btnDisabled} onClick={onSubmit} />
                <Link to="/language">
                    <Button name={Language("CANCEL")} size={"big"} classname='cancel' />
                </Link>
            </div>

            {navigate ? (<Navigate to={navigate} />) : ''}
        </div>
    )
}

function Params({
    defaultParams,
    setDefaultParams
}) {
    return (
        <div className="params editor">
            {defaultParams.map((item, i) => {
                return (
                    <section className="section" data-key={i}>
                        <div className="name">
                            <h1>{item[0]}</h1>
                        </div>
                        <div className="params-value">
                            {/* <button className="reset btn transparent icon" onClick={() => {
                                setDefaultParams(old => {
                                    old[i][2] = old[i][1]
                                    return [...old]
                                })
                            }}>
                                <BiReset />
                            </button> */}
                            <Input type="textarea" value={item[1]} onInput={event => {
                                setDefaultParams(old => {
                                    old[i][2] = (event.target as HTMLDivElement).innerText
                                    return [...old]
                                })
                            }} deleteLabel={true} />
                        </div>
                    </section>
                )
            })}
        </div>
    )
}