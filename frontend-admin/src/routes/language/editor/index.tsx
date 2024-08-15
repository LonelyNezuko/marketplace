import React from 'react'
import $ from 'jquery'
import 'jquery.scrollto'
import { Link, Navigate, useParams } from 'react-router-dom'

import Input from '@components/input'
import { CircleLoader } from '@components/circleLoader/circleLoader'
import { Language } from '@modules/Language'
import { API } from '@modules/API'

import '@routes/language/newlanguage/index'

import { RouteErrorCode, RouteErrorCodeProps } from '@routes/errorcodes'
import { notify } from '@modules/Notify'

import { Modal } from '@components/modals'

import { BiReset } from "react-icons/bi";
import { MdBookmarkAdded } from "react-icons/md";
import LanguageDTO from '@dto/language.dto'
import Button from '@components/button'
import DotsLoader from '@components/dotsloader'
import SetRouteTitle from '@modules/SetRouteTitle'

export default function RouteLanguageEditor() {
    SetRouteTitle(Language("ADMIN_ROUTE_TITLE_LANGUAGE_EDIT"))
    const params = useParams()

    const [ loader, setLoader ] = React.useState(true)
    const [ errorPage, setErrorPage ] = React.useState<RouteErrorCodeProps>({ code: 0, text: '', showbtn: false })

    const [ navigate, setNavigate ] = React.useState(null)
    React.useEffect(() => { if(navigate !== null) setNavigate(null) }, [navigate])
    
    const [ btnDisabled, setBtnDisabled ] = React.useState(false)
    const [ btnLoader, setBtnLoader ] = React.useState(false)
    const [ btnLoaderDelete, setBtnLoaderDelete ] = React.useState(false)
    const [ btnLoaderSync, setBtnLoaderSync ] = React.useState(false)
    const [ success, setSuccess ] = React.useState(false)

    const [ language, setLanguage ] = React.useState<LanguageDTO>(null)

    const [ defaultParams, setDefaultParams ] = React.useState({})
    const [ langParams, setLangParams ] = React.useState([])

    const [ deleteLanguage, setDeleteLanguage ] = React.useState(false)
    const [ languageDeleted, setLanguageDeleted ] = React.useState(false)

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

        active: false,
        main: false
    })

    function onSync() {
        if(btnDisabled || btnLoaderSync)return

        setBtnLoaderSync(true)
        setBtnDisabled(true)

        API({
            url: '/defaultapi/service/language/example',
            type: 'get'
        }).done(result => {
            setBtnLoaderSync(false)
            setBtnDisabled(false)

            if(result.statusCode === 200) {
                const langexample = result.message
                if(!langexample)return notify("Error! Example language not found")

                let tmp = language.params
                let count = 0
                
                for(let key in langexample.params) {
                    if(!tmp[key]) {
                        tmp[key] = langexample.params[key]
                        count ++
                    }
                }
                for(let key in tmp) {
                    if(!langexample.params[key]) {
                        delete tmp[key]
                        count ++
                    }
                }

                if(count > 0) {
                    setLanguage({...language, params: tmp})
                    notify("Synchronization is completed")
                }
                else notify("Synchronization is not required")
            }
            else notify(result.message)
        })
    }
    function onDelete() {
        if(btnDisabled || btnLoaderDelete)return

        setDeleteLanguage(true)
    }
    function onSubmit() {
        if(btnDisabled || btnLoader)return

        let paramserror = false
        let paramserrorid = -1

        langParams.map((item, i) => {
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

        setBtnLoader(true)
        setBtnDisabled(true)

        const params = {}
        langParams.map((item, i) => {
            params[item[0]] = item[2]
        })

        API({
            url: '/defaultapi/service/language/update',
            type: 'put',
            data: {
                id: language.id,

                name: form.name.value,
                code: form.code.value,
                active: !form.active ? 0 : 1,
                main: !form.main ? 0 : 1,
                params: JSON.stringify(params), // json
            }
        }).done(result => {
            if(result.statusCode === 200) {
                setSuccess(true)
                
                setBtnLoader(false)
                setBtnDisabled(false)
            }
            else {
                if(result.statusCode === 403) setErrorPage({ code: 403 })
                else if(result.message === 'You cannot install main'
                    || result.message === 'You cannot install active'
                    || result.message === 'You cannot remove active from the main language') {
                    setBtnDisabled(false)
                    setBtnLoader(false)

                    notify(result.message)
                }
                else notify('(newlanguage) /service/language/new: ' + result.message, { debug: true })
            }
        })
    }

    React.useMemo(() => {
        setLoader(true)
        setBtnDisabled(true)
        setBtnLoader(false)

        const id: number = parseInt(params.id)
        if(!id || isNaN(id) || id < 1) {
            setLoader(false)
            return setErrorPage({ code: 400 })
        }

        API({
            url: '/defaultapi/service/language/',
            type: 'get',
            data: {
                id,
                admin: true
            }
        }).done(result => {
            if(result.statusCode === 200) {
                const language = result.message

                setDefaultParams({...language.params})
                setLanguage(language)

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
    React.useEffect(() => {
        if(!language || !language.id)return

        setForm({
            name: {
                value: language.name,
                error: '',
                mark: ''
            },
            code: {
                value: language.code,
                error: '',
                mark: ''
            },

            active: language.active,
            main: language.main
        })

        let tmp = []
        for(let key in language.params) {
            tmp.push([key, language.params[key], language.params[key]])
        }
        setLangParams(tmp)
    }, [language])

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
            {success && language ? (
                <Modal toggle={true} title={Language("ROUTE_LANGUAGEEDITOR_SUCCESS_TITLE", null, {}, language.name)} desciption={Language("ROUTE_LANGUAGEEDITOR_SUCCESS_DESC")}
                    onClose={() => {
                    window.location.href = '/language'
                }} body={null} />
            ) : ''}
            {languageDeleted ? (
                <Modal toggle={true} title={Language("ROUTE_LANGUAGEEDITOR_DELETED_TITLE", null, {}, language.name)} desciption={Language("ROUTE_LANGUAGEEDITOR_SUCCESS_DESC")}
                    onClose={() => {
                    window.location.href = '/language'
                }} body={null} />
            ) : ''}
            {(deleteLanguage === true && !loader) ? (
                <Modal toggle={true} title={Language("ROUTE_LANGUAGELIST_DELETE_TITLE")}
                    body={Language("ROUTE_LANGUAGELIST_DELETE_BODY", null, {}, language.name)}
                    buttons={[ Language("NO"), Language("YES") ]}
                    onClose={() => {
                        setDeleteLanguage(false)
                    }}
                    onClick={() => {
                        setDeleteLanguage(false)

                        setBtnDisabled(true)
                        setBtnLoaderDelete(true)
                        
                        notify(Language("ROUTE_LANGUAGELIST_DELETE_PROCESS"))

                        API({
                            url: '/defaultapi/service/language/delete',
                            type: 'delete',
                            data: {
                                id: language.id
                            }
                        }).done(result => {
                            if(result.statusCode === 200) setLanguageDeleted(true)
                            else {
                                if(result.statusCode === 403) setErrorPage({ code: 403 })
                                else notify("(languagelist) /service/language/delete: " + result.message, { debug: true })
                            }
                        })
                    }} />
            ) : ''}

            <section className="header">
                <div className="title">
                    <h1 className="routetitle">{Language("ROUTE_LANGUAGENEW_TITLE")}</h1>
                </div>
                <div className="actions">
                    <Button name={Language("SYNC")} size={"medium"} loader={btnLoaderSync} disabled={btnDisabled} onClick={onSync} classname='sync' />
                    <Button name={Language("CHANGE")} size={"medium"} loader={btnLoader} disabled={btnDisabled} onClick={onSubmit} classname='add' />
                    {!language._example ? (
                        <Button name={Language("DELETE")} size={"medium"} loader={btnLoaderDelete} disabled={btnDisabled} onClick={onDelete} classname='cancel' />
                    ) : ''}
                    <Link to="/language">
                        <Button name={Language("CANCEL")} type={"hovertransparent"} size={"medium"} />
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
                            <h1>{Language("ROUTE_LANGUAGEEDITOR_PARAM_ACTIVE")}</h1>
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
                    <section className="section">
                        <div className="name">
                            <h1>{Language("ROUTE_LANGUAGEEDITOR_PARAM_MAIN")}</h1>
                            <span className="hoverinfo" data-info={Language("ROUTE_LANGUAGEEDITOR_PARAM_MAIN_DESC")}></span>
                        </div>
                        <div className="value checkbox">
                            <div className="inputcheckbox big">
                                <input checked={form.main} type="checkbox" onChange={event => {
                                    setForm({...form, main: event.target.checked})
                                }} />
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            <Params langParams={langParams} setLangParams={setLangParams} defaultParams={defaultParams} btnDisabled={btnDisabled} />

            <div className="actions bottom">
                <Button name={Language("SYNC")} size={"big"} loader={btnLoaderSync} disabled={btnDisabled} onClick={onSync} classname='sync' />
                <Button name={Language("CHANGE")} size={"big"} loader={btnLoader} disabled={btnDisabled} onClick={onSubmit} classname='add' />
                {!language._example ? (
                    <Button name={Language("DELETE")} size={"big"} loader={btnLoaderDelete} disabled={btnDisabled} onClick={onDelete} classname='cancel' />
                ) : ''}
                <Link to="/language">
                    <Button name={Language("CANCEL")} type={"hovertransparent"} size={"big"} />
                </Link>
            </div>

            {navigate ? (<Navigate to={navigate} />) : ''}
        </div>
    )
}

function Params({
    langParams,
    setLangParams,

    defaultParams,
    btnDisabled
}) {
    return (
        <div className="params editor">
            {langParams.map((item, i) => {
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
                            {!defaultParams[item[0]] ? (
                                <div className="added" data-hint={Language("ROUTE_LANGUAGEEDITOR_PARAM_ADDED")}>
                                    <MdBookmarkAdded />
                                </div>
                            ) : ''}
                            
                            <Input type="textarea" value={item[1]} onInput={event => {
                                setLangParams(old => {
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