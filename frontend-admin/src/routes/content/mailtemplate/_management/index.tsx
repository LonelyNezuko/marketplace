import React from 'react'

import './index.scss'
import SetRouteTitle from '@modules/SetRouteTitle'
import { Language } from '@modules/Language'
import EmailEditor, { Editor, EditorRef } from 'react-email-editor'
import Button from '@components/button'
import { Link, Navigate, useParams } from 'react-router-dom'
import { RouteErrorCode, RouteErrorCodeProps } from '@routes/errorcodes'
import { Select, SelectListObject } from '@components/select/select'
import DotsLoader from '@components/dotsloader'
import MailTemplateDTO, { MailTemplateTypes, mailTemplateData } from '@dto/mailtemplate.dto'
import { Alert } from '@components/alert'
import { API } from '@modules/API'
import Input from '@components/input'
import { notify } from '@modules/Notify'
import ModalMailTemplates from '@components/modals/mailtemplates'

interface RouteContentMailtemplateManagementProps {
    type: 'create' | 'edit'
}
export default function RouteContentMailtemplateManagement({
    type
}: RouteContentMailtemplateManagementProps) {
    SetRouteTitle(type === 'create' ? Language("ADMIN_ROUTE_TITLE_CONTENT_MAILTEMPLATE_CREATE") : Language("ADMIN_ROUTE_TITLE_CONTENT_MAILTEMPLATE_EDIT"))

    const params = useParams()

    const [ loader, setLoader ] = React.useState(false)
    const [ errorPage, setErrorPage ] = React.useState<RouteErrorCodeProps>({ code: 0 })

    const [ navigate, setNavigate ] = React.useState(null)
    React.useEffect(() => { if(navigate !== null) setNavigate(null) }, [navigate])

    const [ mailTemplateID, setMailTemplateID ] = React.useState<number>(null)
    const [ mailType, setMailType ] = React.useState<MailTemplateTypes>(mailTemplateData.mailTemplateTypesNameArray[0][0])
    const [ language, setLanguage ] = React.useState<string>(window.language)
    const [ subject, setSubject ] = React.useState('')
    const [ loadedEditorJSON, setLoadedEditorJSON ] = React.useState<any>(null)

    const [ btnLoader, setBtnLoader ] = React.useState(false)
    const [ disabled, setDisabled ] = React.useState(true)

    const [ copyOtherTemplateModal, setCopyOtherTemplateModal ] = React.useState(false)
    const [ copyOtherTemplateYes, setCopyOtherTemplateYes ] = React.useState(false)

    const [ editorUnlayer, setEditorUnlayer ] = React.useState<Editor>(null)
    function onEditorReady(unlayer: Editor) {
        setEditorUnlayer(unlayer)
        setDisabled(false)

        if(loadedEditorJSON) unlayer.loadDesign(loadedEditorJSON)
    }

    async function onEditorExportHTML(): Promise<[ string, any ]> {
        return await new Promise((resolve) => {
            editorUnlayer.exportHtml(data => {
                resolve([ data.html, data.design ])
            })
        })
    }

    async function onSubmit() {
        if(btnLoader || disabled || !editorUnlayer)return

        function stop() {
            setBtnLoader(false)
            setDisabled(false)
        }

        if(subject.length < 4 || subject.length > 32)return Alert(Language("ADMIN_CONTENT_MAILTEMPLATE_MANAGEMENT_ONSUBMIT_ERROR_1"))

        setBtnLoader(true)
        setDisabled(true)

        const [ html, json ] = await onEditorExportHTML()
        if(!mailTemplateData.checkFormatValues(html, mailType)) {
            stop()
            return Alert(Language("ADMIN_CONTENT_MAILTEMPLATE_MANAGEMENT_ONSUBMIT_ERROR_2"))
        }

        API({
            url: '/defaultapi/admin/mailtemplate/' + (type === 'create' ? 'create' : 'update'),
            type: type === 'create' ? 'post' : 'put',
            data: {
                type: type === 'create' && mailType,
                languagecode: type === 'create' && language,
                id: type === 'edit' && mailTemplateID,
                html,
                subject,
                editorJSON: JSON.stringify(json)
            }
        }).done(result => {
            if(result.statusCode === 200) {
                if(type === 'create') Alert(Language("ADMIN_CONTENT_MAILTEMPLATE_MANAGEMENT_ONSUBMIT_SUCCESS_CREATE"), "success")
                else Alert(Language("ADMIN_CONTENT_MAILTEMPLATE_MANAGEMENT_ONSUBMIT_SUCCESS_EDIT"), "success")

                setNavigate('/content/mailtemplate')
            }
            else {
                if(result.statusCode === 403) setErrorPage({ code: 403 })
                else if(result.message === 'Failed to create MailTemplate') Alert(Language("ADMIN_CONTENT_MAILTEMPLATE_MANAGEMENT_ONSUBMIT_ERROR_3"))
                else notify("(content.mailtemplate.management) /admin/mailtemplate/create: " + result.message, { debug: true })
            }
        })
    }

    React.useMemo(() => {
        if(type === 'edit') {
            const id: number = parseInt(params.id)
            if(!id || isNaN(id) || id < 1) {
                return setErrorPage({ code: 400 })
            }

            setLoader(true)
            API({
                url: '/defaultapi/admin/mailtemplate',
                type: 'get',
                data: {
                    id
                }
            }).done(result => {
                if(result.statusCode === 200) {
                    const mailTemplate: MailTemplateDTO = result.message

                    setMailType(mailTemplate.type)
                    setLanguage(mailTemplate.language.code)

                    setSubject(mailTemplate.subject)
                    setLoadedEditorJSON(mailTemplate.editorJSON)

                    setMailTemplateID(mailTemplate.id)
                    setLoader(false)
                }
                else {
                    if(result.statusCode === 403) setErrorPage({ code: 403 })
                    else notify("(content.mailtemplate.management) /admin/mailtemplate: " + result.message, { debug: true })
                }
            })
        }
    }, [])

    if(errorPage.code !== 0)return (<RouteErrorCode {...errorPage} />)
    if(loader)return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '84px 0' }}>
            <DotsLoader size={"medium"} color={"colorful"} />
        </div>
    )
    return (
        <div className="route" id="routeContentMailtemplateCreate">
            {type === 'create' && copyOtherTemplateModal ? (
                <ModalMailTemplates onClose={() => {
                    setCopyOtherTemplateModal(false)
                }} onSubmit={template => {
                    setCopyOtherTemplateModal(false)
                    setCopyOtherTemplateYes(true)

                    if(type === 'create') {
                        setMailType(template.type)
                        setLanguage(template.language.code)

                        setSubject(template.subject)
                        setLoadedEditorJSON(template.editorJSON)

                        console.log(template.editorJSON)
                        editorUnlayer.loadDesign(template.editorJSON)
                    }
                }} />
            ) : ''}

            <header className="header">
                <section className="section">
                    <h1 className="routetitle">{type === 'create' ? Language("ADMIN_CONTENT_MAILTEMPLATE_MANAGEMENT_TITLE_CREATE") : Language("ADMIN_CONTENT_MAILTEMPLATE_MANAGEMENT_TITLE_EDIT")}</h1>
                </section>
                <section className="section">
                    {type === 'create' && !copyOtherTemplateYes && editorUnlayer ? (
                        <Button classname='copyothermailtemplate' name={"Копировать другой шаблон"} size={"big"} onClick={() => {
                            setCopyOtherTemplateModal(true)
                        }} disabled={btnLoader || disabled} />
                    ) : ''}

                    <Button name={Language(type === 'create' ? "CREATE" : "SAVE")} size={"big"} onClick={onSubmit} disabled={btnLoader || disabled} loader={btnLoader} />
                    <Link to="/content/mailtemplate">
                        <Button name={Language("BACK")} size={"big"} classname='cancel' />
                    </Link>
                </section>
            </header>

            <div className="page">
                <div className="settings">
                    <div className="block mailtype">
                        <Select title={Language("ADMIN_CONTENT_MAILTEMPLATE_MANAGEMENT_SETTINGS_MAILTYPE_TITLE")} disabled={type === 'edit' ? true : disabled} _type={mailType} _list={mailTemplateData.mailTemplateTypesNameArray.map((item): SelectListObject => {
                            return { content: Language(item[1]), key: item[0] }
                        })} version={2} onChange={(item: SelectListObject) => {
                            if(type !== 'edit') setMailType(item.key as MailTemplateTypes)
                        }} />

                        <div className="description">
                            <h6>{Language("ADMIN_CONTENT_MAILTEMPLATE_MANAGEMENT_SETTINGS_MAILTYPE_DESCRIPTION")}</h6>
                            {mailTemplateData.mailTemplateTypesFormatValues[mailType].map(item => {
                                return (
                                    <span>{'{'}{item}{'}'} - {Language(mailTemplateData.mailTemplateFormatValuesName[item])}</span>
                                )
                            })}
                        </div>
                    </div>
                    <div className="block language">
                        {window.languageList ? (
                            <Select disabled={type === 'edit' ? true : disabled} title={Language("ADMIN_CONTENT_MAILTEMPLATE_MANAGEMENT_SETTINGS_LANGUAGE_TITLE")} _type={language} _list={window.languageList.map((language): SelectListObject<string> => {
                                return { content: language.name, key: language.code }
                            })} version={2} onChange={(value: SelectListObject<string>) => {
                                if(type !== 'edit') setLanguage(value.key)
                            }} />
                        ) : ''}
                    </div>
                    <div className="block subject">
                        <Input disabled={disabled} type={'text'} value={subject} onInput={event => {
                            setSubject((event.target as HTMLInputElement).value)
                        }} title={Language("ADMIN_CONTENT_MAILTEMPLATE_MANAGEMENT_SETTINGS_SUBJECT_TITLE")} data={{ hint: Language("ADMIN_CONTENT_MAILTEMPLATE_MANAGEMENT_SETTINGS_SUBJECT_HINT") }} />
                    </div>
                </div>

                <div className="editor">
                    {disabled ? (<div className="editor-disabled"></div>) : ''}
                    {btnLoader ? (<div className="editor-disabled editor-loader">
                        <DotsLoader />
                    </div>) : ''}

                    <EmailEditor onReady={onEditorReady} locale={window.language} options={{
                        safeHTML: true
                    }} />
                </div>
            </div>

            {navigate ? (<Navigate to={navigate} />) : ''}
        </div>
    )
}