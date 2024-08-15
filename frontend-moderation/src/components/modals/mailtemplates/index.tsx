import React from 'react'

import Moment from 'moment'
import 'moment/min/locales'

import './index.scss'
import { Modal } from '..'
import MailTemplateDTO, { mailTemplateData } from '@dto/mailtemplate.dto'
import { Select, SelectListObject } from '@components/select/select'
import { Language } from '@modules/Language'
import DotsLoader from '@components/dotsloader'
import { API } from '@modules/API'
import { notify } from '@modules/Notify'
import { Alert } from '@components/alert'
import Table, { TableProperties } from '@components/table'
import { Link } from 'react-router-dom'
import Username from '@components/username'

import CONFIG from '@config'

interface ModalMailTemplatesProps {
    onClose: () => void,
    onSubmit: (template: MailTemplateDTO) => void
}
export default function ModalMailTemplates({
    onClose,
    onSubmit
}: ModalMailTemplatesProps) {
    Moment.locale(window.language)
    const [ loader, setLoader ] = React.useState(true)

    const [ mailtemplates, setMailteplates ] = React.useState<MailTemplateDTO[]>([])
    const [ language, setLanguage ] = React.useState<string>(window.language)

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
                setMailteplates(result.message)
                setLoader(false)
            }
            else {
                if(result.statusCode === 403) {
                    onClose()
                    Alert(Language("FORBIDDEN"))
                }
                else notify("(modals.mailtemplates) /admin/mailtemplate/list: " + result.message, { debug: true })
            }
        })
    }

    React.useMemo(() => {
        load()
    }, [])
    React.useEffect(() => {
        load()
    }, [language])

    return (
        <div className="modal modalMailTemplates">
            <Modal toggle={true} title={"Шаблоны писем"} desciption={"Выберите необходимый шаблон"}
                body={(
                    <div className="page">
                        <div className="filter">
                            {window.languageList ? (
                                <Select title={Language("LANGUAGE")} _type={language} _list={window.languageList.map((language): SelectListObject<string> => {
                                    return { content: language.name, key: language.code }
                                })} version={2} onChange={(value: SelectListObject<string>) => {
                                    setLanguage(value.key)
                                }} />
                            ) : ''}

                            <div className="list">
                                {loader ? (
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '84px 0' }}>
                                        <DotsLoader color={"colorful"} />
                                    </div>
                                ) : ''}

                                {!loader ? mailtemplates.map((template, i) => {
                                    return (
                                        <div className="elem" key={i} onClick={() => {
                                            onSubmit(template)
                                        }}>
                                            <section className="section id">{(i + 1) + " (#" + template.id + ")"}</section>
                                            <section className="section subject">{template.subject}</section>
                                            <section className="section mailtype">{Language(mailTemplateData.mailTemplateTypesName[template.type])}</section>
                                            <section className="section status">
                                                {template.active ? (<span style={{ color: 'var(--tm-color-darkgreen)' }}>{Language("ACTIVE")}</span>)
                                                : (<span style={{ color: 'var(--tm-color-darkred)' }}>{Language("NOT_ACTIVE")}</span>)}
                                            </section>
                                        </div>
                                    )
                                }) : ''}

                                {!loader && !mailtemplates.length ? (
                                    <div className="nothing">{Language("NOTHING")}</div>
                                ) : ''}
                            </div>
                        </div>
                    </div>
                )}

                onClose={onClose}
            />
        </div>
    )
}