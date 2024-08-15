import React from 'react'
import $ from 'jquery'

import Moment from 'moment'
import 'moment/min/locales'

import CONFIG from '@config'

import './index.scss'
import { Modal } from '@components/modals'
import { MdBrowserUpdated, MdNotificationAdd, MdOutlineDriveFileRenameOutline } from 'react-icons/md'
import { Language } from '@modules/Language'
import UploadDropFile from '@components/uploadDropFile'
import { Avatar } from '@components/avatar/avatar'
import Input, { InputAutoCompleteList } from '@components/input'
import Calendar from 'react-calendar'
import Button from '@components/button'
import { GrTextAlignLeft } from 'react-icons/gr'
import { ModalLoaderProps } from '@components/modals/loader'
import SetRouteTitle from '@modules/SetRouteTitle'
import UserDTO from '@dto/user.dto'
import Username from '@components/username'
import { API } from '@modules/API'
import { APIResult } from '@modules/API/index.dto'
import { notify } from '@modules/Notify'
import AvatarDTO from '@dto/avatar.dto'
import { BsCalendar2DateFill, BsKeyFill } from 'react-icons/bs'
import { RouteErrorCodeProps } from '@routes/errorcodes'
import { Alert } from '@components/alert'
import UserNotificationsDTO from '@dto/user.notifications.dto'
import { IoIosNotifications } from 'react-icons/io'
import { TiUser } from 'react-icons/ti'

let findAttachedUsersTimer: NodeJS.Timeout = null

interface RouteContentNotifications_CreateModalProps {
    readonly?: number

    loaderModal: ModalLoaderProps
    setLoaderModal: React.Dispatch<React.SetStateAction<ModalLoaderProps>>,

    setErrorPage: React.Dispatch<React.SetStateAction<RouteErrorCodeProps>>
    setNavigate: React.Dispatch<any>
}
export default function RouteContentNotifications_CreateModal({
    readonly,

    loaderModal,
    setLoaderModal,

    setErrorPage,
    setNavigate
}: RouteContentNotifications_CreateModalProps) {
    SetRouteTitle(Language("ADMIN_ROUTE_TITLE_CONTENT_NOTIFICATIONS_CREATE"))
    Moment.locale(window.language)

    const [ disabled, setDisabled ] = React.useState(false)
    const [ btnDisabled, setBtnDisabled ] = React.useState(true)
    const [ successModal, setSuccessModal ] = React.useState(false)

    const [ readonlyNotification, setReadonlyNotification ] = React.useState<UserNotificationsDTO>(null)

    const [ calendarToggle, setCalendarToggle ] = React.useState(false)
    React.useEffect(() => {
        function onCalendarHide(event) {
            if(!calendarToggle)return
            if($('#routeContentNotificationsCreateModal .block.name .readat').is(event.target) || $('#routeContentNotificationsCreateModal .block.name .readat').has(event.target).length)return

            setCalendarToggle(false)
        }

        document.addEventListener('click', onCalendarHide)
        document.addEventListener('touchstart', onCalendarHide)
        document.addEventListener('wheel', onCalendarHide)

        return () => {
            document.removeEventListener('click', onCalendarHide)
            document.removeEventListener('touchstart', onCalendarHide)
            document.removeEventListener('wheel', onCalendarHide)
        }
    }, ['', calendarToggle])

    interface FormInputProps {
        value: string,
        mark: 'error' | 'accept',
        error: string
    }
    interface FormProps {
        previewImage: File | string,
        name: FormInputProps,
        viewAt: Date,
        text: FormInputProps,
        attachedProductID: FormInputProps,
        attachedUserID: number,
        attachedUserAvatar: AvatarDTO,
        attachedUser: FormInputProps
    }
    const [ form, setForm ] = React.useState<FormProps>({
        previewImage: null,
        name: {
            value: '',
            mark: null,
            error: null
        },
        viewAt: null,
        text: {
            value: '',
            mark: null,
            error: null
        },
        attachedProductID: {
            value: '',
            mark: null,
            error: null
        },
        attachedUserID: null,
        attachedUserAvatar: null,
        attachedUser: {
            value: '',
            mark: null,
            error: null
        }
    })

    const [ foundAttachedUsers, setFoundAttachedUsers ] = React.useState<UserDTO[]>([])
    const [ foundAttachedUsersLoader, setFoundAttachedUsersLoader ] = React.useState(false)

    React.useEffect(() => {
        if(findAttachedUsersTimer) clearTimeout(findAttachedUsersTimer)
        setFoundAttachedUsersLoader(false)

        if(form.attachedUser.value.length > 2 && form.attachedUser.value.length < 32) {
            setFoundAttachedUsersLoader(true)
            findAttachedUsersTimer = setTimeout(() => {
                API({
                    url: '/defaultapi/moderation/user/list',
                    type: 'get',
                    data: {
                        name: form.attachedUser.value,
                        pagination: { limit: 5 }
                    }
                }).done((result: APIResult) => {
                    if(result.statusCode === 200) {
                        setFoundAttachedUsers(result.message)
                        setFoundAttachedUsersLoader(false)
                    }
                    else {
                        notify("(content.notifications.create) /moderation/user/list: " + result.message, { debug: true })
                    }
                })
            }, 300)
        }
        else setFoundAttachedUsers([])
    }, [form.attachedUser.value])

    React.useEffect(() => {
        if(form.name.mark === 'accept'
            && form.viewAt
            && form.text.mark === 'accept'
            && form.previewImage) {
            if(form.attachedProductID.mark === 'error'
                || form.attachedUser.mark === 'error') setBtnDisabled(true)
            else setBtnDisabled(false)
        }
        else setBtnDisabled(true)
    }, [form])
    function onSubmit() {
        if(readonly)return
        if(btnDisabled || disabled || loaderModal.toggle || foundAttachedUsersLoader)return

        let formData = new FormData()
        formData.append('file', form.previewImage as File, (form.previewImage as File).name)

        formData.append('name', form.name.value)
        formData.append('text', form.text.value)
        formData.append('viewAt', form.viewAt as undefined as string)

        formData.append('attachedProductID', form.attachedProductID.value.length ? form.attachedProductID.value : null)
        formData.append('attachedUserID', form.attachedUserID as undefined as string)

        setLoaderModal({ toggle: true, text: Language("ADMIN_CONTENT_NOTIFICATIONS_CREATE_SUBMIT_LOADER_TEXT") })
        API({
            url: '/defaultapi/admin/notifications/create',
            type: 'post',
            data: formData,
            contentType: false,
            processData: false
        }).done((result: APIResult) => {
            setLoaderModal({ toggle: false, text: null })

            if(result.statusCode === 200) {
                setSuccessModal(true)
            }
            else {
                setBtnDisabled(true)

                if(result.statusCode === 403) setErrorPage({ code: 403 })
                else if(result.message === "Product with this 'attachedProductID' not found") {
                    setForm({ ...form, attachedProductID: { ...form.attachedProductID, mark: 'error', error: Language("ADMIN_CONTENT_NOTIFICATIONS_CREATE_SUBMIT_ERROR_1") } })
                }
                else if(result.message === "User with this 'attachedUserID' not found") {
                    setForm({ ...form, attachedUserID: null, attachedUserAvatar: null, attachedUser: { ...form.attachedUser, mark: 'error', error: Language("ADMIN_CONTENT_NOTIFICATIONS_CREATE_SUBMIT_ERROR_2") } })
                }
                else if(result.message === "Failed to upload 'previewAvatar'") {
                    Alert(Language("ADMIN_CONTENT_NOTIFICATIONS_CREATE_SUBMIT_ERROR_3", null, null, CONFIG.maxFileSizeToUpload / CONFIG.mbtobyte))
                }
                else if(result.message === "Failed to create notification") {
                    Alert(Language("ADMIN_CONTENT_NOTIFICATIONS_CREATE_SUBMIT_ERROR_4"))
                }
                else notify("(content.notifications.create) /admin/notifications/create: " + result.message, { debug: true })
            }
        })
    }


    React.useMemo(() => {
        if(readonly) {
            if(isNaN(readonly))return setErrorPage({ code: 400 })

            setDisabled(true)
            setBtnDisabled(true)

            setLoaderModal({ toggle: true, text: null })
            API({
                url: '/defaultapi/admin/notifications',
                type: 'get',
                data: {
                    id: readonly
                }
            }).done((result: APIResult) => {
                setLoaderModal({ toggle: false })

                if(result.statusCode === 200) {
                    const notf: UserNotificationsDTO = result.message

                    setForm({
                        previewImage: notf.previewAvatar,
                        name: {
                            value: notf.name,
                            mark: null,
                            error: null
                        },
                        viewAt: new Date(notf.viewAt),
                        text: {
                            value: notf.text,
                            mark: null,
                            error: null
                        },
                        attachedProductID: {
                            value: notf.attachedProduct ? `${Language("PRODUCT")} #${notf.attachedProduct.prodID}` : Language("NO"),
                            mark: null,
                            error: null
                        },
                        attachedUserID: null,
                        attachedUserAvatar: notf.attachedUser ? notf.attachedUser.avatar : null,
                        attachedUser: {
                            value: notf.attachedUser ? notf.attachedUser.name[0] + ' ' + notf.attachedUser.name[1] : Language("NO"),
                            mark: null,
                            error: null
                        }
                    })
                    setReadonlyNotification(notf)
                }
                else setErrorPage({ code: result.statusCode })
            })
        }
    }, [])

    if(successModal && !loaderModal.toggle)return (
        <Modal toggle={true} title={Language("ADMIN_CONTENT_NOTIFICATIONS_CREATE_SUCCESS_MODAL_TITLE")} icon={<MdNotificationAdd />}
            body={Language("ADMIN_CONTENT_NOTIFICATIONS_CREATE_SUCCESS_MODAL_BODY")}

            buttons={[ Language("REFRESH") ]}
            buttonsHref={[ "/content/notifications" ]}

            modalBodyOverflow={"visible"}
        />
    )
    return (
        <Modal id={"routeContentNotificationsCreateModal"} toggle={true} title={!readonly ? Language("ADMIN_CONTENT_NOTIFICATIONS_CREATE_TITLE") : Language("ADMIN_CONTENT_NOTIFICATIONS_CREATE_TITLE_READONLY")} icon={!readonly ? <MdNotificationAdd /> : <IoIosNotifications />}
            desciption={readonly ? Language("ADMIN_CONTENT_NOTIFICATIONS_CREATE_DESCRIPTION_READONLY") : ''}
            body={(
                <div className="bodypage">
                    <div className="block name">
                        <div className="previewAvatar">
                            <UploadDropFile id='contentNotificationsCreatePreviewAvatar' onlyButton={true}
                                types={"image/*"}
                                typesErrorMsg={Language("ADMIN_CONTENT_NOTIFICATIONS_CREATE_FORM_PREVIEWIMAGE_ERROR_1", null, null, CONFIG.maxFileSizeToUpload / CONFIG.mbtobyte)}
                                disabled={disabled}

                                filesLoaded={form.previewImage ? 1 : 0}
                                maxFiles={1}

                                onLoad={acceptedFiles => {
                                    console.log(acceptedFiles)
                                    setForm({ ...form, previewImage: acceptedFiles[0] })
                                }}
                            />

                            <label htmlFor="uploadDropFileInput-contentNotificationsCreatePreviewAvatar">
                                <Avatar sizeImage={1920} image={form.previewImage ? readonly ? form.previewImage as string : URL.createObjectURL(form.previewImage as File) : "/assets/avatars/imageadd.png"} position={{ x: 0, y: 0 }} size={100} circle={true} type={"megabig"} />
                            </label>

                            {form.previewImage && !readonly ? (
                                <Button disabled={disabled} name={Language("DELETE")} onClick={() => {
                                    if(readonly)return
                                    setForm({ ...form, previewImage: null })
                                }} />
                            ) : ''}
                        </div>
                        <div className="form">
                            <Input disabled={disabled} type={"text"} title={Language("ADMIN_CONTENT_NOTIFICATIONS_CREATE_FORM_NAME_TITLE")} icon={<MdOutlineDriveFileRenameOutline />}
                                data={{ mark: form.name.mark, error: form.name.error }}
                                maxLength={32}
                                value={form.name.value}
                                onInput={event => {
                                    const value = (event.target as HTMLInputElement).value
                                    const result: FormInputProps = { value, mark: null, error: null }

                                    if(value.length && (value.length < 4 || value.length > 32)) {
                                        result.mark = 'error'
                                        result.error = Language("ADMIN_CONTENT_NOTIFICATIONS_CREATE_FORM_NAME_ERROR_1")
                                    }
                                    else if(value.length) result.mark = 'accept'

                                    setForm({ ...form, name: result })
                                }}
                            />

                            <div className="readat">
                                <Input disabled={disabled} id={"contentNotificationsCreateReadAtInput"} type={"text"} title={Language("ADMIN_CONTENT_NOTIFICATIONS_CREATE_FORM_VIEWAT_TITLE")} icon={<MdBrowserUpdated />}
                                    value={form.viewAt ? Moment(form.viewAt).calendar() : ''}
                                    data={{ mark: form.viewAt && !readonly ? 'accept' : null }}
                                    onClick={() => {
                                        setCalendarToggle(true)
                                    }}
                                />

                                {calendarToggle ? (
                                    <div className="readatCalendar">
                                        <Calendar minDate={new Date(+new Date + CONFIG.notificationsViewAtMinBetween)} onChange={(value: Date) => {
                                            value = new Date(value)
                                            value.setHours(12, 0, 0, 0)

                                            setForm({ ...form, viewAt: value })
                                            setCalendarToggle(false)
                                        }} />
                                    </div>
                                ) : ''}
                            </div>
                        </div>
                    </div>

                    {readonly && readonlyNotification ? (
                        <div className="block creator">
                            <div className="form">
                                <Input disabled={disabled} type={"text"} title={Language("ADMIN_CONTENT_NOTIFICATIONS_CREATE_FORM_CREATOR_TITLE")} icon={<TiUser />}
                                    value={readonlyNotification.creator.name[0] + " " + readonlyNotification.creator.name[1]}
                                />
                                <Input disabled={disabled} type={"text"} title={Language("ADMIN_CONTENT_NOTIFICATIONS_CREATE_FORM_CREATAT_TITLE")} icon={<BsCalendar2DateFill />}
                                    value={Moment(readonlyNotification.createAt).calendar()}
                                />
                            </div>
                        </div>
                    ) : ''}
                    
                    <div className="block text">
                        <div className="form">
                            <Input disabled={disabled} type={"textarea"} title={Language("ADMIN_CONTENT_NOTIFICATIONS_CREATE_FORM_TEXT_TITLE")} icon={<GrTextAlignLeft />}
                                data={{ mark: form.text.mark, error: form.text.error }}
                                maxLength={512}
                                value={form.text.value}
                                onInput={event => {
                                    const value = (event.target as HTMLDivElement).innerText
                                    const result: FormInputProps = { value, mark: null, error: null }

                                    if(value.length && (value.length < 10 || value.length > 512)) {
                                        result.mark = 'error'
                                        result.error = Language("ADMIN_CONTENT_NOTIFICATIONS_CREATE_FORM_TEXT_ERROR_1")
                                    }
                                    else if(value.length) result.mark = 'accept'

                                    setForm({ ...form, text: result })
                                }}
                            />
                        </div>
                    </div>
                    <div className="block attached">
                        <div className="form">
                            <Input disabled={disabled} type={"text"} title={!readonly ? Language("ADMIN_CONTENT_NOTIFICATIONS_CREATE_FORM_ATTACHEDPRODUCT_TITLE") : Language("ADMIN_CONTENT_NOTIFICATIONS_CREATE_FORM_ATTACHEDPRODUCT_TITLE_READONLY")}
                                data={{ placeholder: "Укажите ID объявления", mark: form.attachedProductID.mark, error: form.attachedProductID.error }}
                                value={form.attachedProductID.value}
                                onInput={event => {
                                    const value = (event.target as HTMLInputElement).value
                                    const result: FormInputProps = { value, mark: null, error: null }

                                    if(value.length && isNaN(value as undefined as number)) {
                                        result.mark = 'error'
                                        result.error = Language("ADMIN_CONTENT_NOTIFICATIONS_CREATE_FORM_ATTACHEDPRODUCT_ERROR_1")
                                    }
                                    else if(value.length) result.mark = 'accept'

                                    setForm({ ...form, attachedProductID: result })
                                }}
                            />
                            <Input disabled={disabled} type={"text"} title={!readonly ? Language("ADMIN_CONTENT_NOTIFICATIONS_CREATE_FORM_ATTACHEDUSER_TITLE") : Language("ADMIN_CONTENT_NOTIFICATIONS_CREATE_FORM_ATTACHEDUSER_TITLE_READONLY")}
                                data={{ placeholder: "Начните вводить имя фамилию или ID...", mark: form.attachedUser.mark, error: form.attachedUser.error }}
                                icon={form.attachedUserAvatar ? (<Avatar {...form.attachedUserAvatar} circle={true} type={"min"} sizeImage={180} />) : null}
                                value={form.attachedUser.value}
                                onInput={event => {
                                    const value = (event.target as HTMLInputElement).value

                                    const resultForm = form
                                    const result: FormInputProps = { value, mark: null, error: null }

                                    if(value.length && (value.length < 2 || value.length > 32)) {
                                        result.mark = 'error'
                                        result.error = Language("ADMIN_CONTENT_NOTIFICATIONS_CREATE_FORM_ATTACHEDUSER_ERROR_1")
                                    }
                                    else if(!value.length) {
                                        if(form.attachedUserID) resultForm.attachedUserID = null
                                        if(form.attachedUserAvatar) resultForm.attachedUserAvatar = null

                                        setFoundAttachedUsers([])
                                    }

                                    resultForm.attachedUser = result
                                    setForm({...resultForm})
                                }}

                                autoCompleteList={foundAttachedUsers.map((user): InputAutoCompleteList => {
                                    return {
                                        content: (<Username account={user} />),
                                        icon: (<Avatar {...user.avatar} circle={true} type={"min"} sizeImage={180} />),
                                        onClick: () => {
                                            setForm({ ...form, attachedUserID: user.id, attachedUser: {
                                                value: (user.name[0] + " " + user.name[1]).trim(),
                                                mark: 'accept',
                                                error: null
                                            }, attachedUserAvatar: user.avatar })
                                        }
                                    }
                                })}
                                autoCompleteListLoader={foundAttachedUsersLoader}
                            />
                        </div>
                    </div>
                </div>
            )}

            buttons={!readonly ? [ Language("CANCEL"), Language("CREATE") ] : [ Language("CLOSE") ]}
            buttonsHref={[ "/content/notifications" ]}
            buttonsBlock={loaderModal.toggle || btnDisabled || disabled}

            onClick={onSubmit}
        />
    )
}