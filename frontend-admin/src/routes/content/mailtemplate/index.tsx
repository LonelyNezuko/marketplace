import React from "react";

import Moment from 'moment'
import 'moment/min/locales'

import './index.scss'
import SetRouteTitle from "@modules/SetRouteTitle";
import { Language } from "@modules/Language";
import { RouteErrorCode, RouteErrorCodeProps } from "@routes/errorcodes";
import DotsLoader from "@components/dotsloader";
import MailTemplateDTO, { mailTemplateData } from "@dto/mailtemplate.dto";
import { API } from "@modules/API";
import LanguageDTO from "@dto/language.dto";
import { notify } from "@modules/Notify";
import { Select, SelectListObject } from "@components/select/select";
import Button from "@components/button";
import { Link } from "react-router-dom";
import Table, { TableProperties } from "@components/table";
import CONFIG from '@config'
import Username from "@components/username";
import ModalLoader, { ModalLoaderProps } from "@components/modals/loader";
import { Alert } from "@components/alert";
import { Modal } from "@components/modals";
import { formatText } from "@modules/functions/formatText";

export default function RouteContentMailtemplate() {
    SetRouteTitle(Language("ADMIN_ROUTE_TITLE_CONTENT_MAILTEMPLATE"))
    Moment.locale(window.language)

    const [ loader, setLoader ] = React.useState(true)
    const [ errorPage, setErrorPage ] = React.useState<RouteErrorCodeProps>({ code: 0 })
    const [ loaderModal, setLoaderModal ] = React.useState<ModalLoaderProps>({
        toggle: false,
        text: null
    })

    const [ language, setLanguage ] = React.useState<string>(window.language)
    const [ templates, setTemplates ] = React.useState<MailTemplateDTO[]>([])

    const [ deleteModal, setDeleteModal ] = React.useState<number>(null)

    function load() {
        setLoader(true)
        API({
            url: '/defaultapi/admin/mailtemplate/list',
            type: 'get',
            data: {
                languagecode: language
            }
        }).done(result => {
            if(result.statusCode === 200) {
                setTemplates(result.message)
                setLoader(false)
            }
            else {
                if(result.statusCode === 403) setErrorPage({ code: 403 })
                else notify("(content.mailtemplate) /admin/mailtemplate/list: " + result.message, { debug: true })
            }
        })
    }

    function onUpdateActiveStatus(template: MailTemplateDTO) {
        if(loader || loaderModal.toggle || !template)return

        setLoaderModal({
            toggle: true,
            text: null
        })
        API({
            url: '/defaultapi/admin/mailtemplate/active',
            type: 'put',
            data: {
                id: template.id
            }
        }).done(result => {
            setLoaderModal({
                toggle: false,
                text: null
            })

            if(result.statusCode === 200) {
                load()
            }
            else {
                if(result.statusCode === 403) setErrorPage({ code: 403 })
                else if(result.statusCode === 406) {
                    Alert(Language("ADMIN_CONTENT_MAILTEMPLATE_CHANGE_ACTIVE_STATUS_ERROR_1"))
                }
                else notify("(content.mailtemplate) /admin/mailtemplate/active: " + result.message, { debug: true })
            }
        })
    }
    function onDelete(template: MailTemplateDTO) {
        if(loader || loaderModal.toggle || !template)return

        setLoaderModal({
            toggle: true,
            text: Language('ADMIN_CONTENT_MAILTEMPLATE_DELETEMODAL_LOADER_TEXT')
        })
        API({
            url: '/defaultapi/admin/mailtemplate/delete',
            type: 'delete',
            data: {
                id: template.id
            }
        }).done(result => {
            setLoaderModal({
                toggle: false,
                text: null
            })

            if(result.statusCode === 200) {
                load()
                Alert(Language("ADMIN_CONTENT_MAILTEMPLATE_DELETEMODAL_SUCCESS"), "success")
            }
            else {
                if(result.statusCode === 403) setErrorPage({ code: 403 })
                else notify("(content.mailtemplate) /admin/mailtemplate/delete: " + result.message, { debug: true })
            }
        })
    }

    React.useMemo(() => {
        load()
    }, [])

    React.useEffect(() => {
        load()
    }, [language])

    if(errorPage.code !== 0)return (
        <RouteErrorCode {...errorPage} />
    )
    return (
        <div className="route" id="routeContentMailtemplate">
            {loaderModal.toggle ? (
                <ModalLoader text={loaderModal.text} />
            ) : ''}

            {deleteModal !== null ? (
                <Modal toggle={true} title={Language("ADMIN_CONTENT_MAILTEMPLATE_DELETEMODAL_TITLE")}
                    body={Language("ADMIN_CONTENT_MAILTEMPLATE_DELETEMODAL_BODY", null, null, templates[deleteModal].id)}
                    buttons={[ Language("NO"), Language("YES") ]}
        
                    modalBodyOverflow={"visible"}
        
                    onClick={() => {
                        onDelete(templates[deleteModal])
                        setDeleteModal(null)
                    }}
                    onClose={() => {
                        setDeleteModal(null)
                    }}
                />
            ) : ''}

            <header className="header">
                <section className="section">
                    <h1 className="routetitle">{Language("ADMIN_CONTENT_MAILTEMPLATE_TITLE")}</h1>
                    <span className="routedescription">{Language("ADMIN_CONTENT_MAILTEMPLATE_DESCRIPTION")}</span>
                </section>
                <section className="section">
                    {window.languageList ? (
                        <Select _type={language} _list={window.languageList.map((language): SelectListObject<string> => {
                            return { content: language.name, key: language.code }
                        })} version={2} onChange={(value: SelectListObject<string>) => {
                            setLanguage(value.key)
                        }} />
                    ) : ''}
                    
                    <Link to="/content/mailtemplate/create">
                        <Button name={Language("ADMIN_CONTENT_MAILTEMPLATE_ACTION_BTN_CREATE")} size={"medium"} type={"border"} />
                    </Link>
                </section>
            </header>

            <div className="page">
                {loader ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '84px 0' }}>
                        <DotsLoader size={"medium"} color={"colorful"} />
                    </div>
                ) : ''}

                {!loader ? (
                    <Table
                        ths={[
                            { content: Language("ADMIN_CONTENT_MAILTEMPLATE_TABLE_TH_1") },
                            { content: Language("ADMIN_CONTENT_MAILTEMPLATE_TABLE_TH_2") },
                            { content: Language("ADMIN_CONTENT_MAILTEMPLATE_TABLE_TH_3") },
                            { content: Language("ADMIN_CONTENT_MAILTEMPLATE_TABLE_TH_4") },
                            { content: Language("ADMIN_CONTENT_MAILTEMPLATE_TABLE_TH_5") },
                            { content: Language("ADMIN_CONTENT_MAILTEMPLATE_TABLE_TH_6") },
                            { width: '120px' }
                        ]}
                        list={templates.sort((a, b) => b.id - a.id).map((template, i): TableProperties[] => {
                            return [
                                { content: (i + 1) + " (#" + template.id + ")" },
                                { content: formatText(template.subject, 15) },
                                { content: Language(mailTemplateData.mailTemplateTypesName[template.type]) },
                                { content: (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                                        <Link className="link" target={"_blank"} to={CONFIG.moderationPanelLink + '/user/' + template.creator.id}>
                                            <Username account={template.creator} />
                                        </Link>
                                        <span>/</span>
                                        {template.updator ? (
                                            <Link className="link" target={"_blank"} to={CONFIG.moderationPanelLink + '/user/' + template.updator.id}>
                                                <Username account={template.updator} />
                                            </Link>
                                        ) : Language("NOT_UPDATED")}
                                    </div>
                                ) },
                                { content: (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                                        {Moment(template.createAt).format('DD.MM.YYYY')}
                                        <span>/</span>
                                        {template.updator ? Moment(template.updateAt).format('DD.MM.YYYY') : Language("NOT_UPDATED")}
                                    </div>
                                ) },
                                { content: template.active ?
                                    (<span style={{ color: 'var(--tm-color-darkgreen)' }}>{Language("ACTIVE")}</span>)
                                    : (<span style={{ color: 'var(--tm-color-darkred)' }}>{Language("NOT_ACTIVE")}</span>)
                                },
                                { content: null, dropdown: [
                                    { content: !template.active ? Language("ADMIN_CONTENT_MAILTEMPLATE_TABLE_ACTION_ACTIVATE") : Language("ADMIN_CONTENT_MAILTEMPLATE_TABLE_ACTION_DEACTIVATE"), onClick: () => {
                                        onUpdateActiveStatus(template)
                                    } },
                                    { content: Language("EDIT"), link: '/content/mailtemplate/edit/' + template.id },
                                    { content: Language("DELETE"), bottom: true, color: `var(--tm-color-red)`, onClick: () => {
                                        setDeleteModal(i)
                                    } }
                                ] }
                            ]
                        })}

                        hiddentop={true}
                        design={"new"}
                    />
                ) : ''}
            </div>
        </div>
    )
}