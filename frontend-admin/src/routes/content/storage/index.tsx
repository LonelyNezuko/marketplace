import React from "react";

import Moment from 'moment'
import 'moment/min/locales'

import './index.scss'
import { Language } from "@modules/Language";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import Button from "@components/button";
import AlbumDTO from "@dto/album.dto";
import { RouteErrorCode, RouteErrorCodeProps } from "@routes/errorcodes";
import DotsLoader from "@components/dotsloader";
import { API } from "@modules/API";
import { notify } from "@modules/Notify";
import Table, { TableProperties } from "@components/table";

import CONFIG from "@config"
import Username from "@components/username";
import { IoIosArrowDown } from "react-icons/io";
import { Modal } from "@components/modals";
import PreviewFiles, { PreviewFilesFile } from "@components/previewFiles";
import UploadDropFile from "@components/uploadDropFile";
import CircleLoaderFullSize from "@components/circleLoader/fullsize";
import ModalLoader, { ModalLoaderProps } from "@components/modals/loader";
import Input from "@components/input";
import { Select, SelectListObject } from "@components/select/select";
import SetRouteTitle from "@modules/SetRouteTitle";
import { StorageDTO, StorageFilesAccess } from "@dto/storage.dto";
import { Alert } from "@components/alert";
import { RolePrivilegesVerify } from "@modules/RolePrivilegesVerify";
import { IoAlbums, IoAlbumsOutline } from "react-icons/io5";
import { FaUpload } from "react-icons/fa6";

export default function RouteContentStorage() {
    SetRouteTitle(Language("ADMIN_ROUTE_TITLE_CONTENT_STORAGE"))
    Moment.locale(window.language)

    const params = useParams()
    const location = useLocation()

    const [ loader, setLoader ] = React.useState(true)
    const [ loaderModal, setLoaderModal ] = React.useState<ModalLoaderProps>({
        toggle: false,
        text: null
    })
    const [ errorPage, setErrorPage ] = React.useState<RouteErrorCodeProps>({ code: 0 })
    
    const [ navigate, setNavigate ] = React.useState(null)
    React.useEffect(() => { if(navigate !== null) setNavigate(null) }, [navigate])

    const [ albums, setAlbums ] = React.useState<AlbumDTO[]>([])

    const [ uploadModal, setUploadModal ] = React.useState(false)
    const [ viewModal, setViewModal ] = React.useState<string>(null)
    const [ deleteModal, setDeleteModal ] = React.useState<number>(null)

    function loadAlbumList() {
        setLoader(true)
        API({
            url: '/defaultapi/admin/storage/list',
            type: 'get'
        }).done(result => {
            if(result.statusCode === 200) {
                result.message = result.message.sort((a, b) => +new Date(b.albumCreateAt) - +new Date(a.albumCreateAt))

                setAlbums(result.message)
                setLoader(false)
            }
            else {
                if(result.statusCode === 403) setErrorPage({ code: 403 })
                else notify("(content.storage) /admin/storage/list: " + result.message, { debug: true })
            }
        })
    }
    React.useEffect(() => {
        setUploadModal(false)

        loadAlbumList()

        if(params.id === 'upload') setUploadModal(true)
        else setViewModal(params.id)
    }, [location])


    function onDeleteAlbum(album: AlbumDTO) {
        if(loader || errorPage.code !== 0 || !albums || !album)return

        setLoaderModal({
            toggle: true,
            text: Language("ADMIN_CONTENT_STORAGE_DELETE_ALBUM_LOADER_TEXT")
        })

        API({
            url: '/defaultapi/admin/storage/delete',
            type: 'delete',
            data: {
                albumKey: album.albumKey
            }
        }).done(result => {
            if(result.statusCode === 200) {
                setLoaderModal({
                    toggle: false,
                    text: null
                })

                setAlbums(old => {
                    old = old.filter(a => a.albumKey !== album.albumKey)
                    return [...old]
                })
                Alert(Language("ADMIN_CONTENT_STORAGE_DELETE_ALBUM_LOADER_SUCCESS"), "success")
            }
            else {
                if(result.statusCode === 404) setNavigate('/refresh')

                if(result.statusCode === 403) setErrorPage({ code: 403 })
                else if(result.message === "Album with this 'albumKey' not found") {
                    Alert(Language("ADMIN_CONTENT_STORAGE_DELETE_ALBUM_LOADER_ERROR_1"))
                }
                else {
                    notify("(content.storage.onDeleteAlbum) /admin/storage/delete: " + result.message, { debug: true })
                }
            }
        })
    }

    if(errorPage.code !== 0)return (
        <RouteErrorCode style={{marginTop: "128px"}} code={errorPage.code} text={errorPage.text}
            showbtn={errorPage.showbtn} btnurl={errorPage.btnurl} btnname={errorPage.btnname}
            icon={errorPage.icon} />
    )
    if(loader)return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '84px 0' }}>
            <DotsLoader size={"medium"} color={"colorful"} />
        </div>
    )
    return (
        <div className="route" id="routeContentStorage">
            {loaderModal.toggle ? (
                <ModalLoader text={loaderModal.text} />
            ) : ''}

            {uploadModal ? (<UploadModal setNavigate={setNavigate} loaderModal={loaderModal} setLoaderModal={setLoaderModal} />) : ''}
            {viewModal ? (<ViewModal albumKey={viewModal} setErrorPage={setErrorPage} setNavigate={setNavigate} loaderModal={loaderModal} setLoaderModal={setLoaderModal} />) : ''}
            {deleteModal !== null ? (
                <Modal toggle={true} title={Language("ADMIN_CONTENT_STORAGE_DELETE_ALBUM_MODAL_TITLE")}
                    body={Language("ADMIN_CONTENT_STORAGE_DELETE_ALBUM_MODAL_BODY", null, null, albums[deleteModal].albumLength)}
                    buttons={[ Language("NO"), Language("YES") ]}
        
                    modalBodyOverflow={"visible"}
        
                    onClick={() => {
                        onDeleteAlbum(albums[deleteModal])
                        setDeleteModal(null)
                    }}
                    onClose={() => {
                        setDeleteModal(null)
                    }}
                />
            ) : ''}

            <Table
                title={Language("ADMIN_CONTENT_STORAGE_TITLE")}
                titleDescription={Language("ADMIN_CONTENT_STORAGE_DESCRIPTION")}
                actions={[(<Link to="/content/storage/upload">
                    <Button name={Language("ADMIN_CONTENT_STORAGE_ACTION_BTN")} type={"border"} />
                </Link>)]}
                ths={[
                    { content: Language("ADMIN_CONTENT_STORAGE_TABLE_TH_1") },
                    { content: Language("ADMIN_CONTENT_STORAGE_TABLE_TH_2") },
                    { content: Language("ADMIN_CONTENT_STORAGE_TABLE_TH_3") },
                    { content: Language("ADMIN_CONTENT_STORAGE_TABLE_TH_4") },
                    { width: '120px' }
                ]}
                list={albums.map((album, i): TableProperties[] => {
                    return [
                        { content: album.albumName },
                        { content: album.albumLength },
                        { content: (<Link target={"_blank"} className="link" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }} to={CONFIG.moderationPanelLink + '/user/' + album.owner.id}>
                            <Username account={album.owner} />
                        </Link>) },
                        { content: Moment(album.albumCreateAt).format('DD.MM.YYYY') },
                        { dropdown: [
                                { content: Language("OPEN"), link: '/content/storage/' + album.albumKey },
                                RolePrivilegesVerify('/admin/storage/delete', window.userdata.roles) ? { content: Language("DELETE"), bottom: true, color: 'var(--tm-color-darkred)', onClick: () => setDeleteModal(i)} : null
                            ],
                            dropdownName: (
                                <Button name={Language("MANAGEMENT")} icon={(<IoIosArrowDown />)} size={"min"} />
                            ),
                            width: '120px'
                        }
                    ]
                })}
                design={"new"}
            />

            {navigate ? (<Navigate to={navigate} />) : ''}
        </div>
    )
}

interface ModalProps {
    setNavigate: React.Dispatch<any>,
    
    setErrorPage?: React.Dispatch<React.SetStateAction<RouteErrorCodeProps>>,

    loaderModal?: ModalLoaderProps,
    setLoaderModal?: React.Dispatch<React.SetStateAction<ModalLoaderProps>>
}

interface ViewModalProps extends ModalProps {
    albumKey: string,
}
function ViewModal({
    albumKey,

    setNavigate,
    setErrorPage,

    loaderModal,
    setLoaderModal
}: ViewModalProps) {
    SetRouteTitle(Language("ADMIN_ROUTE_TITLE_CONTENT_STORAGE_VIEW"))
    Moment.locale(window.language)

    const [ loader, setLoader ] = React.useState(true)
    const [ error, setError ] = React.useState(0)

    const [ deleteModal, setDeleteModal ] = React.useState<string>(null)

    const [ album, setAlbum ] = React.useState<AlbumDTO>(null)

    React.useMemo(() => {
        setLoader(false)
        setError(0)

        API({
            url: '/defaultapi/admin/storage/',
            type: 'get',
            data: {
                albumKey
            }
        }).done(result => {
            if(result.statusCode === 200) {
                console.log(result.message)

                setAlbum(result.message)
                setLoader(false)
            }
            else {
                if(result.message === "Album with this 'albumKey' not found") {
                    setNavigate('/content/storage')
                    Alert(Language("ADMIN_CONTENT_STORAGE_VIEW_MODAL_ERROR_1"))
                }
                else notify("(content.storage) /admin/storage: " + result.message, { debug: true })
            }
        })
    }, [])

    
    function onDeleteFile(fileKey: string) {
        if(loader || loaderModal.toggle || !album)return

        setLoaderModal({
            toggle: true,
            text: Language("ADMIN_CONTENT_STORAGE_VIEW_MODAL_DELETEFILE_LOADER_TEXT")
        })

        API({
            url: '/defaultapi/admin/storage/delete',
            type: 'delete',
            data: {
                albumKey: album.albumKey,
                fileKey: fileKey
            }
        }).done(result => {
            if(result.statusCode === 200) {
                setLoaderModal({
                    toggle: false,
                    text: null
                })

                if(album.albumLength === 1) setNavigate('/content/storage')
                else {
                    album.files = album.files.filter(file => file.key !== fileKey)
                    album.albumLength = album.albumLength - 1
                }

                Alert(Language("ADMIN_CONTENT_STORAGE_VIEW_MODAL_DELETEFILE_LOADER_SUCCESS"), "success")
            }
            else {
                if(result.statusCode === 404) setNavigate('/content/storage')

                if(result.statusCode === 403) setErrorPage({ code: 403 })
                else if(result.message === "Album with this 'albumKey' not found") {
                    Alert(Language("ADMIN_CONTENT_STORAGE_VIEW_MODAL_DELETEFILE_LOADER_ERROR_1"))
                }
                else if(result.message === "File with this 'fileKey' in current album not found") {
                    Alert(Language("ADMIN_CONTENT_STORAGE_VIEW_MODAL_DELETEFILE_LOADER_ERROR_2"))
                }
                else {
                    notify("(content.storage.onDeleteFile) /admin/storage/delete: " + result.message, { debug: true })
                }
            }
        })
    }


    if(error !== 0)return (<>{setErrorPage({ code: error })}</>)
    if(loader)return (<ModalLoader />)

    if(!album)return

    if(deleteModal)return (
        <Modal toggle={true} title={"Удаление файла"}
            body={Language("ADMIN_CONTENT_STORAGE_VIEW_MODAL_DELETEFILE_MODAL_BODY", null, null, deleteModal, album.albumLength === 1 && Language("ADMIN_CONTENT_STORAGE_VIEW_MODAL_DELETEFILE_MODAL_BODY_"))}
            buttons={[ Language("NO"), Language("YES") ]}

            modalBodyOverflow={"visible"}

            onClick={() => {
                onDeleteFile(deleteModal)
                setDeleteModal(null)
            }}
            onClose={() => {
                setDeleteModal(null)
            }}
        />
    )
    return (
        <Modal toggle={true} icon={(<IoAlbums />)}
            title={Language("ADMIN_CONTENT_STORAGE_VIEW_MODAL_TITLE")} desciption={Language("ADMIN_CONTENT_STORAGE_VIEW_MODAL_DESCRIPTION", null, null, album.albumKey)}
            body={
                (
                    <div id="viewModal">
                        <div className="viewModal-info">
                            <section className="section">
                                <h6 className="name">{Language("ADMIN_CONTENT_STORAGE_VIEW_MODAL_INFO_1")}</h6>
                                <span className="value">{album.albumName}</span>
                            </section>
                            <section className="section">
                                <h6 className="name">{Language("ADMIN_CONTENT_STORAGE_VIEW_MODAL_INFO_2")}</h6>
                                <span className="value">{album.albumLength}</span>
                            </section>
                            <section className="section">
                                <h6 className="name">{Language("ADMIN_CONTENT_STORAGE_VIEW_MODAL_INFO_3")}</h6>
                                <span className="value">{{ default: 'Все', staff: 'Персонал', secret: 'Приватный' }[album.access]}</span>
                            </section>
                            <section className="section">
                                <h6 className="name">{Language("ADMIN_CONTENT_STORAGE_VIEW_MODAL_INFO_4")}</h6>
                                <span className="value">
                                    <Link target={"_blank"} className="link" to={CONFIG.moderationPanelLink + '/user/' + album.owner.id}>
                                        <Username account={album.owner} />
                                    </Link>
                                </span>
                            </section>
                            <section className="section">
                                <h6 className="name">{Language("ADMIN_CONTENT_STORAGE_VIEW_MODAL_INFO_5")}</h6>
                                <span className="value">{Moment(album.albumCreateAt).calendar()}</span>
                            </section>
                        </div>
    
                        <div className="viewModal-files">
                            <div className="viewModal-title">
                                <h6>{Language("ADMIN_CONTENT_STORAGE_VIEW_MODAL_FILES_TITLE")}</h6>
                                <span>{Language("ADMIN_CONTENT_STORAGE_VIEW_MODAL_FILES_DESCRIPTION")}</span>
                            </div>

                            <PreviewFiles files={album.files} hideDeleteBtn={!RolePrivilegesVerify("/admin/storage/delete", window.userdata.roles)} onDeleteFile={(file: StorageDTO, index) => {
                                setDeleteModal(file.key)
                            }} />
                        </div>
                    </div>
                )
            }
            buttons={[ Language("CLOSE") ]}
            onClose={() => {
                setNavigate('/content/storage/')
            }}
        />
    )
}

function UploadModal({
    setNavigate,

    loaderModal,
    setLoaderModal
}: ModalProps) {
    SetRouteTitle(Language("ADMIN_ROUTE_TITLE_CONTENT_STORAGE_UPLOAD"))

    const [ btnDisabled, setBtnDisabled ] = React.useState(false)
    const [ disabled, setDisabled ] = React.useState(false)

    const [ files, setFiles ] = React.useState<File[]>([])
    const [ form, setForm ] = React.useState<{
        albumName: {
            value: string,
            error: string,
            mark: "" | "error" | "accept"
        },
        access: StorageFilesAccess
    }>({
        albumName: {
            value: '',
            error: null,
            mark: null
        },
        access: 'default'
    })

    const accessList: SelectListObject[] = [
        { content: Language("STORAGE_FILE_ACCESS_DEFAULT"), key: 'default' },
        { content: Language("STORAGE_FILE_ACCESS_STAFF"), key: 'staff' }
    ]

    function onSubmit() {
        if(btnDisabled || disabled || loaderModal.toggle)return

        setLoaderModal({
            toggle: true,
            text: Language("ADMIN_CONTENT_STORAGE_UPLOAD_MODAL_UPLOAD_LOADER_TEXT")
        })
        setBtnDisabled(true)
        setDisabled(true)

        let formData = new FormData()
        files.map(file => {
            formData.append('files[]', file, file.name)
        })

        formData.append('access', 'default')
        formData.append('albumName', form.albumName.value)

        API({
            url: '/defaultapi/admin/storage/create',
            type: 'post',
            data: formData,
            contentType: false,
            processData: false
        }).done(result => {
            setLoaderModal({
                toggle: false,
                text: null
            })

            if(result.statusCode === 200) {
                Alert(Language("ADMIN_CONTENT_STORAGE_UPLOAD_MODAL_UPLOAD_SUCCESS", null, null, result.message), "success")
                setNavigate('/content/storage')
            }
            else {
                setBtnDisabled(false)
                setDisabled(false)

                if(result.message === 'Max files 10') Alert(Language("ADMIN_CONTENT_STORAGE_UPLOAD_MODAL_UPLOAD_ERROR_1"))
                else if(result.message === 'Failed to upload files') Alert(Language("ADMIN_CONTENT_STORAGE_UPLOAD_MODAL_UPLOAD_ERROR_2"))
            }
        })
    }

    React.useEffect(() => {
        if(form.access !== 'default'
            && form.access !== 'staff') setBtnDisabled(true)
        else if(form.albumName.mark !== 'accept') setBtnDisabled(true)
        else if(!files.length) setBtnDisabled(true)
        else setBtnDisabled(false)
    }, [form, files])

    return (
        <Modal toggle={true} title={Language("ADMIN_CONTENT_STORAGE_UPLOAD_MODAL_TITLE")} desciption={Language("ADMIN_CONTENT_STORAGE_UPLOAD_MODAL_DESCRIPTION")} icon={(<FaUpload />)}
            body={
                (
                    <div id="uploadModal">
                        <div className="uploadModal-settings">
                            <div className="form">
                                <Select
                                    disabled={disabled}
                                    title={Language("ADMIN_CONTENT_STORAGE_UPLOAD_MODAL_FORM_ACCESS_TITLE")} titleHoverinfo={Language("ADMIN_CONTENT_STORAGE_UPLOAD_MODAL_FORM_ACCESS_HOVERINFO")}
                                    _type={form.access} _list={accessList} version={2} 
                                    onChange={(value: SelectListObject) => {
                                        setForm({ ...form, access: (value.key as StorageFilesAccess) })
                                    }}
                                />
                            </div>
                            <div className="form">
                                <Input type={'text'} title={Language("ADMIN_CONTENT_STORAGE_UPLOAD_MODAL_FORM_ALBUMNAME_TITLE")} disabled={disabled}
                                    data={{ mark: form.albumName.mark, error: form.albumName.error, hint: Language("ADMIN_CONTENT_STORAGE_UPLOAD_MODAL_FORM_ALBUMNAME_HINT") }}
                                    value={form.albumName.value}
                                    onInput={event => {
                                        const value = (event.target as HTMLInputElement).value
                                        const data: any = { value, mark: 'accept', error: null }

                                        if(value.length) {
                                            if(value.length < 4 || value.length > 24) {
                                                data.mark = 'error'
                                                data.error = Language("ADMIN_CONTENT_STORAGE_UPLOAD_MODAL_FORM_ALBUMNAME_ERROR_1")
                                            }
                                        }

                                        setForm({ ...form, albumName: data })
                                    }}
                                />
                            </div>
                        </div>

                        {files.length < 10 ? (
                            <UploadDropFile disabled={disabled} id={"contentStorageUploadFiles"} maxFiles={10} filesLoaded={files.length} onLoad={acceptedFiles => {
                                setFiles(old => {
                                    return [...old, ...acceptedFiles]
                                })
                            }} types={"image/*"} typesErrorMsg={Language("ADMIN_CONTENT_STORAGE_UPLOAD_MODAL_FILES_TYPE_ERROR")} />
                        ) : ''}
    
                        <PreviewFiles files={files} onDeleteFile={(file: PreviewFilesFile, index) => {
                            setFiles(old => {
                                old = old.filter((_, i) => index !== i)
                                return [...old]
                            })
                        }} />
                    </div>
                )
            }
            buttons={[ Language("CLOSE"), Language("SUBMIT") ]}
            buttonsBlock={btnDisabled || disabled}

            onClick={() => {
                onSubmit()
            }}
            onClose={() => {
                setNavigate('/content/storage/')
            }}
        />
    )
}