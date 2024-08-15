import React from 'react'
import { Link } from 'react-router-dom'
import $ from 'jquery'

import Moment from 'moment'
import 'moment/min/locales'

import CONFIG from '@config'

import './index.scss'
import Checkmark from '@components/marks/checkmark'
import XMark from '@components/marks/xmark'
import Table, { TableProperties } from '@components/table'
import { Language } from '@modules/Language'
import { CircleLoader } from '@components/circleLoader/circleLoader'

import { API } from '@modules/API'
import { RouteErrorCode, RouteErrorCodeProps } from '@routes/errorcodes'
import { notify } from '@modules/Notify'

import { Modal } from '@components/modals'
import LanguageDTO from '@dto/language.dto'
import Button from '@components/button'
import SetRouteTitle from '@modules/SetRouteTitle'

export default function RouteLanguageList() {
    SetRouteTitle(Language("ADMIN_ROUTE_TITLE_LANGUAGE"))
    Moment.locale(window.language)

    const [ loader, setLoader ] = React.useState(true)
    const [ errorPage, setErrorPage ] = React.useState<RouteErrorCodeProps>({ code: 0, text: '', showbtn: false })

    const [ languages, setLanguages ] = React.useState<Array<LanguageDTO>>([])
    const [ list, setList ] = React.useState<Array<Array<TableProperties>>>([])

    const [ deleteLanguage, setDeleteLanguage ] = React.useState(null)

    React.useEffect(() => {
        let tmp = []

        languages.map((item, i) => {
            tmp.push([
                { content: item.name, id: 'name' },
                { content: item.code },
                { content: !item.main ? (<XMark size={"medium"} />) : (<Checkmark size={"medium"} />) },
                { content: !item.active ? (<XMark size={"medium"} />) : (<Checkmark size={"medium"} />) },
                { content: !item.added ? (<span>System</span>) : (<Link target='_blank' to={CONFIG.moderationPanelLink + "/users/" + item.added.id} className="link">{item.added.name[0] + " " + item.added.name[1]}</Link>) },
                { content: Moment(item.createAt).calendar() },
                { dropdown: [
                    { content: Language("ROUTE_LANGUAGELIST_TABLE_DROPDOWN_EDIT"), link: '/language/edit/' + item.id },
                    item._example === true ? null :
                    { content: Language("ROUTE_LANGUAGELIST_TABLE_DROPDOWN_DELETE"), bottom: true, color: 'var(--tm-color-darkred)', onClick: () => {
                        setDeleteLanguage(i)
                    } }
                ], style: {width: "40px"} },
            ])
        })
        setList(tmp)
        
    }, [languages])

    React.useMemo(() => {
        setLoader(true)
        API({
            url: '/defaultapi/service/language/all',
            type: 'get',
            data: {
                admin: 1
            }
        }).done(result => {
            if(result.statusCode === 200) {
                setLanguages(result.message)
                setLoader(false)
            }
            else {
                if(result.statusCode === 403) {
                    setErrorPage({ code: 403, text: '', showbtn: false })
                    setLoader(false)
                }
                else notify('(languagelist) /service/language/all: ' + result.message, { debug: true })
            }
        })
    }, [])

    return (
        <div className="route" id="languagelist">
            {(deleteLanguage !== null && !loader) ? (
                <Modal toggle={true} title={Language("ROUTE_LANGUAGELIST_DELETE_TITLE")}
                    body={Language("ROUTE_LANGUAGELIST_DELETE_BODY", null, {}, languages[deleteLanguage].name)}
                    buttons={[ Language("NO"), Language("YES") ]}
                    onClose={() => {
                        setDeleteLanguage(null)
                    }}
                    onClick={() => {
                        setDeleteLanguage(null)
                        
                        notify(Language("ROUTE_LANGUAGELIST_DELETE_PROCESS"))
                        const index = deleteLanguage

                        API({
                            url: '/defaultapi/service/language/delete',
                            type: 'delete',
                            data: {
                                id: languages[deleteLanguage].id
                            }
                        }).done(result => {
                            if(result.statusCode === 200) {
                                notify(Language("ROUTE_LANGUAGELIST_DELETE_PROCESS_SUCCESS"))

                                setLanguages(old => {
                                    old.splice(index, 1)
                                    return [...old]
                                })
                            }
                            else {
                                if(result.statusCode === 403) setErrorPage({ code: 403 })
                                else notify("(languagelist) /service/language/delete: " + result.message, { debug: true })
                            }
                        })
                    }} />
            ) : ''}

            {(!loader && errorPage.code !== 0) ? (
                <RouteErrorCode style={{marginTop: "128px"}} code={errorPage.code} text={errorPage.text}
                    showbtn={errorPage.showbtn} btnurl={errorPage.btnurl} btnname={errorPage.btnname}
                    icon={errorPage.icon} />
            ) : ''}

            {loader ? (
                <div style={{display: 'flex', justifyContent: 'center', padding: '124px 0'}}>
                    <CircleLoader type="megabig" color={'var(--tm-color)'} />
                </div>
            ) : ''}

            {(!loader && !errorPage.code) ? (
                <Table id="languageListTable" title={Language("ROUTE_LANGUAGELIST_TITLE")}
                    actions={[(<Link to="/language/new">
                        <Button name={Language("ROUTE_LANGUAGELIST_NEW")} type={"border"} />
                    </Link>)]}
                    ths={[
                        { content: Language("ROUTE_LANGUAGELIST_TABLE_ELEM_TITLE") },
                        { content: Language("ROUTE_LANGUAGELIST_TABLE_ELEM_CODE") },
                        { content: Language("ROUTE_LANGUAGELIST_TABLE_ELEM_MAIN") },
                        { content: Language("ROUTE_LANGUAGELIST_TABLE_ELEM_ACTIVE") },
                        { content: Language("ROUTE_LANGUAGELIST_TABLE_ELEM_ADDED") },
                        { content: Language("ROUTE_LANGUAGELIST_TABLE_ELEM_CREATEAT") },
                        { content: "", style: {width: "40px"} }
                    ]}
                    list={list}
                    searchBy={"name"}
                    design={"new"}
                />
            ) : ''}
        </div>
    )
}