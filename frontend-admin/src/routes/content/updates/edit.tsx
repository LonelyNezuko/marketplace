import React from 'react'
import { Modal } from '@components/modals'

import Moment from 'moment'
import 'moment/min/locales'

import { MdOutlineInsertDriveFile } from "react-icons/md";
import { Language } from '@modules/Language';
import { Navigate, useParams } from 'react-router-dom';

import { RiErrorWarningLine } from "react-icons/ri";
import { API } from '@modules/API';
import { notify } from '@modules/Notify';
import ModalLoader from '@components/modals/loader';
import TextEditor, { GetImagesFromText, ReplaceImagesFromText } from '@components/textEditor';
import UpdatesView from '@components/updatesView';
import Input from '@components/input';
import Calendar from 'react-calendar';
import { Alert } from '@components/alert';
import { dataURLtoBlob } from '@modules/functions/dataURLtoBlop';
import UpdatesDTO from '@dto/updates.dto';
import { StorageFileImageDTO } from '@dto/storage.dto';
import SetRouteTitle from '@modules/SetRouteTitle';

export default function ContentUpdatesEdit() {
    const params = useParams()

    SetRouteTitle(Language("ADMIN_ROUTE_TITLE_CONTENT_UPDATES_EDIT"))
    Moment.locale(window.language)

    const [ navigate, setNavigate ] = React.useState(null)
    React.useEffect(() => { if(navigate !== null) setNavigate(null) }, [navigate])

    const [ error, setError ] = React.useState(false)

    const [ loader, setLoader ] = React.useState(false)
    const [ loaderText, setLoaderText ] = React.useState(null)

    const [ updates, setUpdates ] = React.useState<UpdatesDTO>(null)

    React.useMemo(() => {
        const id = parseInt(params.id)
        if(!id || isNaN(id) || id < 1) {
            return setError(true)
        }

        setLoader(true)
        setLoaderText(Language('ADMIN_CONTENT_UPDATES_EDIT_LOADER_1'))

        API({
            url: '/defaultapi/updates/id',
            type: 'get',
            data: {
                id
            }
        }).done(result => {
            if(result.statusCode === 200) {
                setLoader(false)
                setLoaderText(null)

                setUpdates(result.message)
            }
            else {
                setError(true)
                notify("(updates edit) /updates/id: " + result.message, { debug: true })
            }
        })
    }, [])


    function onSubmit() {
        if(!updates.name || updates.name.length < 4 || updates.name.length > 24)return Alert(Language('ADMIN_CONTENT_UPDATES_CREATE_ERROR_NAMELENGTH'))
        if(!updates.version || updates.version.length < 2 || updates.version.length > 10)return Alert(Language("ADMIN_CONTENT_UPDATES_CREATE_ERROR_VERSIONLENGTH"))
        if(new Date() <= updates.publishDate) {
            if(!updates.publishDate || !new Date(updates.publishDate) || +new Date(updates.publishDate) < +new Date() || +new Date(updates.publishDate) > (+new Date() + 86400000 * 30))
                return Alert(Language("ADMIN_CONTENT_UPDATES_CREATE_ERROR_PUBLISHDATE", null, null, Moment(+new Date() + 864000000).format('DD.MM.YYYY'), Moment(+new Date() + 86400000 * 30).format('DD.MM.YYYY')))
        }

        if(!updates.body || !updates.body.length)return Alert(Language('ADMIN_CONTENT_UPDATES_CREATE_ERROR_BACKGROUND'))

        setLoader(true)
        setLoaderText(Language('ADMIN_CONTENT_UPDATES_CREATE_SAVE_LOADER_TEXT_1'))

        let imagesURL = GetImagesFromText(updates.bodyHTML)
            .filter(item => !item.indexOf('data:image/'))

        const loadImage = new Promise((resolve, reject) => {
            console.log(imagesURL)
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
            if(!updates.backgroundNew)return resolve(updates.background)
            setLoaderText(Language("ADMIN_CONTENT_UPDATES_CREATE_SAVE_LOADER_TEXT_3"))

            let formData = new FormData()
            
            formData.append('files[]', updates.backgroundNew, updates.backgroundNew.name)
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
            url: '/defaultapi/updates/update',
            type: 'post'
        }).done(result => {
            if(result.statusCode === 400
                && result.message === 'Fields should not be empty [id, name, version, background, body]') {
                Promise.all([ loadImage, loadBackground ])
                    .then(value => {
                        const images: Array<StorageFileImageDTO> = (value[0] as Array<StorageFileImageDTO>)
                        const backgroundURL = value[1]

                        let saveText = updates.body
                        if(images) {
                            setLoaderText(Language("ADMIN_CONTENT_UPDATES_CREATE_SAVE_LOADER_TEXT_4"))

                            const replaceImages = []
                            images.map((item, i) => {
                                if(!imagesURL[i])return
                                replaceImages.push([ imagesURL[i], item.link ])
                            })

                            saveText = ReplaceImagesFromText(updates.body, replaceImages)
                        }

                        setLoaderText(Language('ADMIN_CONTENT_UPDATES_CREATE_SAVE_LOADER_TEXT_5'))
                        API({
                            url: '/defaultapi/updates/update',
                            type: 'post',
                            data: {
                                id: updates.id,

                                name: updates.name,
                                version: updates.version,

                                publishDate: new Date() > new Date(updates.publishDate) ? null : new Date(updates.publishDate),

                                background: backgroundURL,
                                body: saveText
                            }
                        }).done(result => {
                            if(result.statusCode === 200) {
                                setNavigate('/content/updates')
                                Alert(Language("ADMIN_CONTENT_UPDATES_EDIT_SUCCESS_ALERT"), 'success')
                            }
                            else {
                                Alert(Language("ADMIN_CONTENT_UPDATES_EDIT_ERROR_ALERT"))
                                notify("(content edit) /updates/update: " + result.message, { debug: true })
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
                notify("(content edit) /updates/update check: " + result.message, { debug: true })
            }
        })
    }

    return (
        <div id="contentUpdatesEdit">
            <Modal toggle={error} title={Language("ERROR")} icon={(<RiErrorWarningLine />)} 
                desciption={Language('ADMIN_CONTENT_UPDATES_EDIT_MODALERROR_DESC')}
                body={Language("ADMIN_CONTENT_UPDATES_EDIT_MODALERROR_BODY")}
                buttons={[ Language("CLOSE") ]}
                buttonsHref={[ "/content/updates" ]}
            />

            {loader ? (<ModalLoader text={loaderText} />) : ''}
            {loader || !updates ? null : (
                <Modal toggle={!error && !loader} title={Language("UPDATE") + ' v' + updates.version} icon={(<MdOutlineInsertDriveFile />)}
                    desciption={Language('ADMIN_CONTENT_UPDATES_EDIT_MODAL_DESC')}

                    style={{ width: '850px' }}

                    nav={[ Language("UPDATE"), Language("EDITING") ]}
                    navButtons={[
                        [ Language("CLOSE") ],
                        [ Language("CANCEL"), Language("SUBMIT") ]
                    ]}

                    body={[
                        (<UpdatesView updates={updates} />),
                        (<>
                            <div className="contentUpdatesNewBodySettings contentUpdatesEditBodySettings">
                                <input type="file" id='contentUpdatesEditDropfile' style={{ position: 'absolute', zIndex: '-1', opacity: '0' }}
                                    accept='image/*'
                                    onChange={event => {
                                        if(!event.target.files.length)return
                                        setUpdates({ ...updates, backgroundNew: event.target.files[0] })
                                    }}
                                />
                                <label className="block" htmlFor={"contentUpdatesEditDropfile"}>
                                    <h1 className="blocktitle">
                                        {Language("ADMIN_CONTENT_UPDATES_EDIT_MODAL_BLOCK_TITLE_1")}
                                        <span>{Language("ADMIN_CONTENT_UPDATES_EDIT_MODAL_BLOCK_TITLE_1_DESC")}</span>
                                    </h1>
                                    
                                    <section className="section">
                                        <div className="form" style={{ flexDirection: 'column', gap: '12px' }}>
                                            <div className="background">
                                                <img src={updates.backgroundNew ? URL.createObjectURL(updates.backgroundNew) : updates.background} />
                                            </div>
                                            {updates.backgroundNew ? (
                                                <button className="btn medium border" style={{ width: '100%' }}
                                                    onClick={event => {
                                                        event.preventDefault()
                                                        setUpdates({ ...updates, backgroundNew: null })
                                                    }}
                                                >
                                                    <span>{Language("DELETE_IMAGE")}</span>
                                                </button>
                                            ) : ''}
                                        </div>
                                    </section>
                                </label>

                                <div className="block">
                                    <h1 className="blocktitle">{Language('ADMIN_CONTENT_UPDATES_EDIT_MODAL_BLOCK_TITLE_2')}</h1>
                                    
                                    <section className="section">
                                        <div className="form">
                                            <Input type={"text"} deleteLabel={true} disabled={true}
                                                value={!updates.where ? "Неизвестно" : Language("ADMIN_CONTENT_UPDATES_WHERE_NAME_" + updates.where.toUpperCase())}
                                            />
                                        </div>
                                    </section>
                                </div>
                                <div className="block">
                                    <h1 className="blocktitle">{Language("ADMIN_CONTENT_UPDATES_CREATE_MODAL_BLOCK_TITLE_2")}</h1>
                
                                    <section className="section">
                                        <div className="form">
                                            <Input type={"text"} maxLength={24} title={Language("ADMIN_CONTENT_UPDATES_CREATE_TITLE_NAME")}
                                                data={{placeholder: Language("UPDATE")}}
                                                value={updates.name} onInput={event => setUpdates({ ...updates, name: (event.target as HTMLInputElement).value })}
                                            />
                                        </div>
                                        <div className="form">
                                            <Input type={"text"} maxLength={10} title={Language("ADMIN_CONTENT_UPDATES_CREATE_TITLE_VERSION")}
                                                data={{placeholder: '0.0.1'}}
                                                value={updates.version} onInput={event => setUpdates({ ...updates, version: (event.target as HTMLInputElement).value })}
                                            />
                                        </div>
                                    </section>
                                </div>
                                <div className="block">
                                    <h1 className="blocktitle">Автор</h1>
                
                                    <section className="section">
                                        <div className="form">
                                            <Input type={"text"} disabled={true} title={Language("CREATOR")}
                                                value={!updates.creator ? 'Неизвестно' : updates.creator.name[0] + updates.creator.name[1]}
                                            />
                                        </div>
                                        <div className="form">
                                            <Input type={"text"} disabled={true} title={Language("CREATEAT")}
                                                value={Moment(updates.createAt).format('DD.MM.YYYY, hh:mm')}
                                            />
                                        </div>
                                    </section>
                                </div>
                                {updates.updateAt ? (
                                    <div className="block">
                                        <h1 className="blocktitle">{Language("CHANGES")}</h1>
                    
                                        <section className="section">
                                            <div className="form">
                                                <Input type={'text'} disabled={true} title={Language("UPDATOR")}
                                                    value={!updates.updator ? 'Неизвестно' : updates.updator.name[0] + updates.updator.name[1]}
                                                />
                                            </div>
                                            <div className="form">
                                                <Input type={'text'} disabled={true} title={Language("UPDATEAT")}
                                                    value={Moment(updates.updateAt).format('DD.MM.YYYY, hh:mm')}
                                                />
                                            </div>
                                        </section>
                                    </div>
                                ) : ''}
                                <div className="block">
                                    <h1 className="blocktitle">
                                        {Language("ADMIN_CONTENT_UPDATES_CREATE_MODAL_BLOCK_TITLE_3")}
                                        <span>{Language('ADMIN_CONTENT_UPDATES_CREATE_MODAL_BLOCK_TITLE_4_DESC')}</span>
                                    </h1>
                
                                    <section className="section">
                                        {new Date() > new Date(updates.publishDate) ? (
                                            <div style={{ color: "var(--tm-txt-opacity)", fontWeight: '600' }}>{Language("ADMIN_CONTENT_UPDATES_EDIT_MODAL_BLOCK_PUBLISHDATE_NON_CHANGED")}</div>
                                        ) : (
                                            <Calendar locale={window.language} defaultValue={new Date()}
                                                value={updates.publishDate}
                                                minDate={new Date(+new Date() + 86400000)}
                                                maxDate={new Date(+new Date() + 86400000 * 30)}
                                                onChange={(event: Date) => {
                                                    setUpdates({ ...updates, publishDate: new Date(event) })
                                                }}
                                            />
                                        )}
                                    </section>
                                </div>
                            </div>

                            <div className="block" style={{ marginTop: '64px' }}>
                                <TextEditor id={"contentUpdatesEditBodyTextWrited_text"} value={updates.body} onChange={value => {
                                    setUpdates({ ...updates, body: value })
                                }} onGetHtml={html => setUpdates({ ...updates, bodyHTML: html })} />
                            </div>
                        </>),
                    ]}

                    onClick={navPage => {
                        if(navPage === 1) onSubmit()
                    }}
                    onClose={() => {
                        setNavigate('/content/updates')
                    }}
                />
            )}

            {navigate ? (<Navigate to={navigate} />) : ''}
        </div>
    )
}