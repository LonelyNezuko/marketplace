import React from 'react'
import Calendar from 'react-calendar'

import Moment from 'moment'
import 'moment/min/locales'

import './index.scss'

import Input from '@components/input';
import { Language } from '@modules/Language';
import { Navigate, useParams } from 'react-router-dom';

import { Modal } from '@components/modals';

import { MdOutlineBrowserUpdated } from "react-icons/md";
import UploadDropFile from '@components/uploadDropFile';
import TextEditor, { GetImagesFromText, ReplaceImagesFromText } from '@components/textEditor';
import { Alert } from '@components/alert'
import { dataURLtoBlob } from '@functions/dataURLtoBlop'
import { API } from '@modules/API'
import ModalLoader from '@components/modals/loader'
import { notify } from '@modules/Notify'
import { StorageFileImageDTO } from '@dto/storage.dto'
import PreviewFiles from '@components/previewFiles'
import SetRouteTitle from '@modules/SetRouteTitle'

export function ContentUpdatesCreate() {
    SetRouteTitle(Language("ADMIN_ROUTE_TITLE_CONTENT_UPDATES_NEW"))
    Moment.locale(window.language)

    const [ navigate, setNavigate ] = React.useState(null)
    React.useEffect(() => { if(navigate !== null) setNavigate(null) }, [navigate])

    const [ settings, setSettings ] = React.useState({
        where: 'main',
        name: '',
        version: '',
        publishDate: new Date(+new Date() + 86400000)
    })
    const [ background, setBackground ] = React.useState<File>(null)
    const [ text, setText ] = React.useState('')
    const [ textHTML, setTextHTML ] = React.useState<HTMLElement | JQuery<HTMLElement>>()

    const [ loader, setLoader ] = React.useState(false)
    const [ loaderText, setLoaderText ] = React.useState(null)

    function BodyBackground() {
        function onLoadBackground(acceptedFiles) {
            setBackground(acceptedFiles[0])
        }
        return (
            <div id="contentUpdatesNewBodyBackground">
                {!background ? (
                    <UploadDropFile onLoad={onLoadBackground} />
                ) : ''}
                {background ? (
                    <PreviewFiles files={[background]} onDeleteFile={() => {
                        setBackground(null)
                    }} />
                ): ''}
            </div>
        )
    }
    function BodyCheck() {
        let backgroundURL = '/assets/image.png'
        if(background) backgroundURL = URL.createObjectURL(background)

        return (
            <div id="contentUpdatesNewBodyCheck">
                <div className="top">
                    <div className={`background ${!background && 'notfound'}`}>
                        <img src={backgroundURL} />
                        {!background ? (<span>{Language("ADMIN_CONTENT_UPDATES_CREATE_MODAL_BACKGROUND_NONE")}</span>) : ''}
                    </div>
                    <div className="settings">
                        <section>
                            <h1>Обновление для</h1>
                            {settings.where === 'main' ?
                                (<span style={{color: 'var(--tm-color-txt)'}}>{Language("ADMIN_CONTENT_UPDATES_CREATE_WHERE_NAME_MAIN")}</span>) : settings.where === 'moderation' ?
                                (<span style={{color: 'var(--tm-moderation-color)'}}>{Language("ADMIN_CONTENT_UPDATES_CREATE_WHERE_NAME_MODERATION")}</span>) :
                                (<span style={{color: 'var(--tm-color-red)'}}>{Language("ADMIN_CONTENT_UPDATES_CREATE_WHERE_NAME_ADMIN")}</span>)}
                        </section>
                        <section>
                            <h1>{Language('ADMIN_CONTENT_UPDATES_CREATE_TITLE_NAME')}</h1>
                            <span>{settings.name || (<span style={{ color: 'var(--tm-txt-opacity)' }}>{Language("NOT_INSTALL")}</span>)}</span>
                        </section>
                        <section>
                            <h1>{Language('ADMIN_CONTENT_UPDATES_CREATE_TITLE_VERSION')}</h1>
                            <span>{settings.version || (<span style={{ color: 'var(--tm-txt-opacity)' }}>{Language("NOT_INSTALL")}</span>)}</span>
                        </section>
                        <section>
                            <h1>{Language('ADMIN_CONTENT_UPDATES_CREATE_TITLE_PUBLISHDATE')}</h1>
                            <span>{Moment(settings.publishDate).format('DD.MM.YYYY')}</span>
                        </section>
                    </div>
                </div>
                <div className="text">
                    <TextEditor readOnly={true} viewOnly={true} value={text} />
                </div>
            </div>
        )
    }



    function onSubmit() {
        if(!settings.name || settings.name.length < 4 || settings.name.length > 24)return Alert(Language('ADMIN_CONTENT_UPDATES_CREATE_ERROR_NAMELENGTH'))
        if(!settings.version || settings.version.length < 2 || settings.version.length > 10)return Alert(Language("ADMIN_CONTENT_UPDATES_CREATE_ERROR_VERSIONLENGTH"))
        if(!settings.publishDate || !new Date(settings.publishDate) || +new Date(settings.publishDate) < +new Date() || +new Date(settings.publishDate) > (+new Date() + 86400000 * 30))
            return Alert(Language("ADMIN_CONTENT_UPDATES_CREATE_ERROR_PUBLISHDATE", null, null, Moment(new Date()).format('DD.MM.YYYY'), Moment(+new Date() + 86400000 * 30).format('DD.MM.YYYY')))
        if(!background)return Alert(Language("ADMIN_CONTENT_UPDATES_CREATE_ERROR_TEXTLENGTH"))

        if(!text || !text.length)return Alert(Language('ADMIN_CONTENT_UPDATES_CREATE_ERROR_BACKGROUND'))

        setLoader(true)
        setLoaderText(Language('ADMIN_CONTENT_UPDATES_CREATE_SAVE_LOADER_TEXT_1'))

        const imagesURL = GetImagesFromText(textHTML)
        const loadImage = new Promise((resolve, reject) => {
            if(!imagesURL.length)return resolve("")
            setLoaderText(Language("ADMIN_CONTENT_UPDATES_CREATE_SAVE_LOADER_TEXT_2"))

            const imagesFiles = []
            imagesURL.map(item => imagesFiles.push(dataURLtoBlob(item)))

            let formData = new FormData()
            
            imagesFiles.map(item => {
                formData.append('files[]', item, item.name)
            })
            formData.append('access', 'default')

            API({
                url: '/defaultapi/service/storage/upload',
                type: 'post',
                data: formData,
                contentType: false,
                processData: false
            }).done(result => {
                if(result.statusCode === 200) resolve(result.message)
                else reject(Language("ADMIN_CONTENT_UPDATES_CREATE_LOADING_ERROR_1"))
            })
        })

        const loadBackground = new Promise((resolve, reject) => {
            setLoaderText(Language("ADMIN_CONTENT_UPDATES_CREATE_SAVE_LOADER_TEXT_3"))

            let formData = new FormData()
            
            formData.append('files[]', background, background.name)
            formData.append('access', 'default')

            API({
                url: '/defaultapi/service/storage/upload',
                type: 'post',
                data: formData,
                contentType: false,
                processData: false
            }).done(result => {
                if(result.statusCode === 200) resolve(result.message[0].link)
                else reject(Language("ADMIN_CONTENT_UPDATES_CREATE_LOADING_ERROR_2"))
            })
        })

        API({
            url: '/defaultapi/updates/create',
            type: 'post'
        }).done(result => {
            if(result.statusCode === 400
                && result.message === 'Fields should not be empty [where, name, version, publishDate, background, body]') {
                Promise.all([ loadImage, loadBackground ])
                    .then(value => {
                        const images: Array<StorageFileImageDTO> = (value[0] as Array<StorageFileImageDTO>)
                        const backgroundURL = value[1]

                        let saveText = text
                        if(images) {
                            setLoaderText(Language("ADMIN_CONTENT_UPDATES_CREATE_SAVE_LOADER_TEXT_4"))

                            const replaceImages = []
                            images.map((item, i) => {
                                if(!imagesURL[i])return
                                replaceImages.push([ imagesURL[i], item.link ])
                            })

                            saveText = ReplaceImagesFromText(text, replaceImages)
                        }

                        setLoaderText(Language('ADMIN_CONTENT_UPDATES_CREATE_SAVE_LOADER_TEXT_5'))
                        API({
                            url: '/defaultapi/updates/create',
                            type: 'post',
                            data: {
                                where: settings.where,

                                name: settings.name,
                                version: settings.version,

                                publishDate: new Date(settings.publishDate),

                                background: backgroundURL,
                                body: saveText
                            }
                        }).done(result => {
                            if(result.statusCode === 200) {
                                setNavigate('/content/updates')
                                Alert(Language("ADMIN_CONTENT_UPDATES_CREATE_SUCCESS_ALERT"), 'success')
                            }
                            else {
                                Alert(Language("ADMIN_CONTENT_UPDATES_CREATE_ERROR_ALERT"))
                                notify("(content create) /updates/create: " + result.message, { debug: true })
                            }
                        })
                    }, error => {
                        setLoader(false)
                        setLoaderText(null)

                        Alert(error)
                    })      
            }
            else {
                setNavigate('/')
                notify("(content create) /updates/create check: " + result.message, { debug: true })
            }
        })
    }

    return (
        <>
            {loader ? (<ModalLoader text={loaderText} />) : ''}
            <Modal toggle={true} title={Language('ADMIN_CONTENT_UPDATES_CREATE_MODAL_TITLE')} icon={(<MdOutlineBrowserUpdated />)}

                desciption={Language("ADMIN_CONTENT_UPDATES_CREATE_MODAL_DESC")}
                style={{ width: '850px' }}

                nav={[
                    Language('ADMIN_CONTENT_UPDATES_CREATE_MODAL_NAV_1'),
                    Language("ADMIN_CONTENT_UPDATES_CREATE_MODAL_NAV_2"),
                    Language("ADMIN_CONTENT_UPDATES_CREATE_MODAL_NAV_3"),
                    Language("ADMIN_CONTENT_UPDATES_CREATE_MODAL_NAV_4")
                ]}
                navButtons={[
                    [ Language("CANCEL"), Language("NEXT") ],
                    [ Language("BACK"), Language("NEXT") ],
                    [ Language("BACK"), Language("NEXT") ],
                    [ Language("BACK"), Language("SUBMIT") ]
                ]}

                body={[
                    (<div className="contentUpdatesNewBodySettings">
                        <div className="block">
                            <h1 className="blocktitle">{Language("ADMIN_CONTENT_UPDATES_CREATE_MODAL_BLOCK_TITLE_1")}</h1>
                            
                            <section className="section">
                                <div className="form">
                                    <label htmlFor="contentUpdatesNewBodySettings_form_switch_where_main" style={{ color: 'var(--tm-color-txt)' }}>{Language("ADMIN_CONTENT_UPDATES_CREATE_WHERE_NAME_MAIN")}</label>
                                    <input checked={settings.where === 'main' ? true : false}
                                        onChange={event => setSettings({ ...settings, where: 'main' })}
                                        name='contentUpdatesNewBodySettings_form_switch_where' type="radio" className='switch'
                                        id='contentUpdatesNewBodySettings_form_switch_where_main' />
                                </div>
                                <div className="form">
                                    <label htmlFor="contentUpdatesNewBodySettings_form_switch_where_moderation" style={{ color: 'var(--tm-moderation-color)' }}>{Language("ADMIN_CONTENT_UPDATES_CREATE_WHERE_NAME_MODERATION")}</label>
                                    <input checked={settings.where === 'moderation' ? true : false}
                                        onChange={event => setSettings({ ...settings, where: 'moderation' })}
                                        name='contentUpdatesNewBodySettings_form_switch_where' type="radio" className='switch' id='contentUpdatesNewBodySettings_form_switch_where_moderation' />
                                </div>
                                <div className="form">
                                    <label htmlFor="contentUpdatesNewBodySettings_form_switch_where_admin" style={{ color: 'var(--tm-color-red)' }}>{Language("ADMIN_CONTENT_UPDATES_CREATE_WHERE_NAME_ADMIN")}</label>
                                    <input checked={settings.where === 'admin' ? true : false}
                                        onChange={event => setSettings({ ...settings, where: 'admin' })}
                                        name='contentUpdatesNewBodySettings_form_switch_where' type="radio" className='switch'
                                        id='contentUpdatesNewBodySettings_form_switch_where_admin' />
                                </div>
                            </section>
                        </div>
                        <div className="block">
                            <h1 className="blocktitle">{Language("ADMIN_CONTENT_UPDATES_CREATE_MODAL_BLOCK_TITLE_2")}</h1>
        
                            <section className="section">
                                <div className="form">
                                    <Input type={"text"} maxLength={24} title={Language("ADMIN_CONTENT_UPDATES_CREATE_TITLE_NAME")}
                                        data={{placeholder: Language("UPDATE")}}
                                        value={settings.name} onInput={event => setSettings({ ...settings, name: (event.target as HTMLInputElement).value })}
                                    />
                                </div>
                                <div className="form">
                                    <Input type={"text"} maxLength={10} title={Language('ADMIN_CONTENT_UPDATES_CREATE_TITLE_VERSION')}
                                        data={{placeholder: '0.0.1'}}
                                        value={settings.version} onInput={event => setSettings({ ...settings, version: (event.target as HTMLInputElement).value })}
                                    />
                                </div>
                            </section>
                        </div>
                        <div className="block">
                            <h1 className="blocktitle">
                                {Language("ADMIN_CONTENT_UPDATES_CREATE_MODAL_BLOCK_TITLE_3")}
                                <span>{Language("ADMIN_CONTENT_UPDATES_CREATE_MODAL_BLOCK_TITLE_4_DESC")}</span>
                            </h1>
        
                            <section className="section">
                                <Calendar locale={window.language} defaultValue={new Date()}
                                        value={settings.publishDate}
                                        minDate={new Date(+new Date() + 86400000)}
                                        maxDate={new Date(+new Date() + 86400000 * 30)}
                                        onChange={(event: Date) => {
                                            setSettings({ ...settings, publishDate: new Date(event) })
                                        }}
                                    />
                            </section>
                        </div>
                    </div>),

                    (<BodyBackground />),

                    (<div id="contentUpdatesNewBodyTextWrited">
                        <TextEditor id="contentUpdatesNewBodyTextWrited_text" bounds={document.getElementById('contentUpdatesNewBody')} value={text} onChange={setText} height={"500px"}
                            onGetHtml={html => setTextHTML(html)}
                        />
                    </div>),

                    (<BodyCheck />)
                ]}
                modalBodyOverflow='hidden'

                onClose={(navPage, setNavPage) => {
                    if(!navPage) setNavigate('/content/updates')
                    else if(navPage === 1) setNavPage(0)
                    else if(navPage === 2) setNavPage(1)
                    else if(navPage === 3) setNavPage(2)
                }}
                onClick={(navPage, setNavPage) => {
                    if(!navPage) setNavPage(1)
                    else if(navPage === 1) setNavPage(2)
                    else if(navPage === 2) setNavPage(3)
                    else if(navPage === 3) onSubmit()
                }}
            />

            {navigate ? (<Navigate to={navigate} />) : ''}
        </>
    )
}