/* eslint-disable react/jsx-pascal-case */
import React from 'react'
import $ from 'jquery'
import 'jquery.scrollto'
import Cookies from 'universal-cookie'
import Calendar from 'react-calendar'

import Moment from 'moment'
import 'moment/min/locales'

import { Avatar } from '@components/avatar/avatar'
import Username from '@components/username'
import { Select } from '@components/select/select'
import { Modal } from '@components/modals'
import Input from '@components/input'

import CONFIG from '@config'

import './index.scss'

import { AiFillEdit } from "react-icons/ai";

import { Alert, AlertWarning, AlertWarningAllRemove, AlertWarningTriiggerForKey } from '@components/alert'
import { Language } from '@modules/Language'

import { RiSave2Fill } from "react-icons/ri";
import { IoRefresh } from "react-icons/io5";
import { Link, useLocation, useParams } from 'react-router-dom'
import UploadDropFile from '@components/uploadDropFile'
import { CircleLoader } from '@components/circleLoader/circleLoader';
import { API } from '@modules/API';
import { notify } from '@modules/Notify';
import RouteAccountSettings_modalChangeAvatar from './modals/changeAvatar';
import stringToBool from '@functions/stringToBool'
import RouteAccountSettings_modalChangePassword from './modals/changePassword'
import { isValidJSON } from '@functions/isValidJSON'
import { RouteAccountProps } from '..'
import AvatarDTO from '@dto/avatar.dto'
import { UserNotifySettings, UserNotifySettingsParams, UserPrivacySettings, UserSecuritySettings } from '@dto/user.dto'
import UserInfoDTO from '@dto/userInfo.dto'
import GeolocationDTO from '@dto/geolocation.dto'
import SetRouteTitle from '@modules/SetRouteTitle'
import PhoneHeaderTitle from '@components/phoneHeaderTitle'
import EmailVerify from '@components/emailVerify'
import ModalVerifyCode from '@components/modals/verifycode'
import RouteAccountSettings_modalChangeEmail from './modals/changeEmail'
import { hideEmail } from '@modules/functions/hideEmail'
import { RolePrivilegesVerify } from '@modules/RolePrivilegesVerify'
import Button from '@components/button'
import RouteAccountSettings_modalDeleteAccount from './modals/deleteAccount'
import { CustomStorage } from '@modules/CustomStorage'

export default function RouteAccountSettings({
    account,
    setAccount,
    loader
}: RouteAccountProps) {
    SetRouteTitle(Language("ROUTE_TITLE_ACCOUNT_SETTINGS"))

    const params = useParams()
    const location = useLocation()
    
    const [ saving, setSaving ] = React.useState(false)
    function onSave(callback) {
        setSaving(true)

        let tmp = JSON.parse($('#routeAccountSettings').attr('data-data'))
        API({
            url: "/defaultapi/user/settings/update",
            type: 'put',
            data: {
                data: JSON.stringify(tmp)
            }
        }).done(result => {
            setSaving(false)

            if(result.statusCode === 200) {
                const names = tmp.name.split(' ')
                setAccount(old => {
                    return {
                        ...old,
    
                        name: [names[0], names[1] || ''],
                        signatureProfileText: tmp.signatureProfileText,
                        gender: tmp.gender,
                        birthDate: tmp.birthDate
                    }
                })

                setBeforeChangesData({...tmp})
                if(callback) callback()

                Alert("Данные были успешно сохранены", "success")
            }
            else {
                if(result.message === 'Nothing is saved') Alert('Ничего не было сохранено')
                else notify('/user/settings/update: ' + result.message, { debug: true })
            }
        })
    }

    const [ beforeChangesData, setBeforeChangesData ] = React.useState<SettingsData>(null)
    const [ data, setData ] = React.useState<SettingsData>(null)
    React.useEffect(() => {
        if(!loader && account) {
            let lang = {}
            window.languageList.map(item => {
                if(item.code === window.language) lang = item
            })

            const tmp: SettingsData = {
                avatar: account.avatar,
                name: account.name[0] + " " + account.name[1],
                signatureProfileText: account.signatureProfileText || '',
                gender: account.gender,
                birthDate: parseInt(account.birthDate),
                privacySettings: account.privacySettings,
                securitySettings: account.securitySettings,
                phoneNumber: account.phoneNumber,
                email: account.email,
                authWithEmail: account.authWithEmail,
                authWithPhone: account.authWithPhone,
                notifySettings: account.notifySettings,
                notifySettingsParams: account.notifySettingsParams,
                lastChangePassword: account.lastChangePassword,
                language: lang
            }
            
            setData({...tmp})
            setBeforeChangesData({...tmp})
        }
    }, [loader])

    const [ saveAlert, setSaveAlert ] = React.useState(false)
    React.useEffect(() => {
        if(JSON.stringify(data) !== JSON.stringify(beforeChangesData)
            && !saveAlert) {
            let [ trigger, remove, btnLoader, btnDisable ] = AlertWarning("accountSettingsSaveAlert",
                Language("ACCOUNT_SETTINGS_NOSAVE_WARNING_BODY"),
                onClick,
                Language("ACCOUNT_SETTINGS_NOSAVE_WARNING_TITLE"),
                [ Language("ACCOUNT_SETTINGS_NOSAVE_WARNING_ACTION_1"), Language("ACCOUNT_SETTINGS_NOSAVE_WARNING_ACTION_2") ])
            
            setSaveAlert(true)
            
            function onClick(response) {
                if(!response) setData({...beforeChangesData})
                else {
                    btnDisable(true)
                    btnLoader(true)

                    onSave(() => {
                        remove(false)
                        setSaveAlert(false)
                    })
                }
            }
        }

        if(JSON.stringify(data) === JSON.stringify(beforeChangesData)
            && saveAlert) {
            AlertWarningAllRemove()
            setSaveAlert(false)
        }
    }, [data])

    React.useEffect(() => {
        function onClickLink(event) {
            AlertWarningTriiggerForKey('accountSettingsSaveAlert')
            event.preventDefault()
        }
        function onCloseWindow(event) {
            event.preventDefault()
        }

        if(saveAlert) {
            $('a').on('click', onClickLink)
            window.addEventListener('beforeunload', onCloseWindow)
        }
        return () => {
            $('a').off('click', onClickLink)
            window.removeEventListener('beforeunload', onCloseWindow)
        }
    }, [saveAlert])

    React.useEffect(() => {
        const blockname = params.blockname
        if(blockname && !loader && data) {
            $('#body').scrollTo(`.route#routeAccountSettings .settingsBlock[data-blockname="${blockname}"]`, 300)
        }
    }, [location, loader, data])

    if(!data || !beforeChangesData)return
    return (
        <div className="route" id="routeAccountSettings" style={{zIndex: !saveAlert ? 0 : 4}} data-data={JSON.stringify(data)}>
            {window.isPhone ? (
                <PhoneHeaderTitle text={Language("ACCOUNT_SETTINGS_TITLE")} outBodyPadding={true} description={Language("ACCOUNT_SETTINGS_TITLE_DESCRIPTION")} />
            ) : (
                <header className="header">
                    <h1 className="blocktitle">{Language('ACCOUNT_SETTINGS_TITLE')}</h1>
                    <span className="blockdesc">{Language("ACCOUNT_SETTINGS_TITLE_DESCRIPTION")}</span>
                </header>
            )}

            <SettingsMain account={account} setAccount={setAccount} loader={loader} saving={saving} beforeChangesData={beforeChangesData} data={data} setData={setData} setBeforeChangesData={setBeforeChangesData} />
            <SettingsPrivacy account={account} setAccount={setAccount} loader={loader} saving={saving} beforeChangesData={beforeChangesData} data={data} setData={setData} setBeforeChangesData={setBeforeChangesData} />
            <SettingsSecurity account={account} setAccount={setAccount} loader={loader} saving={saving} beforeChangesData={beforeChangesData} data={data} setData={setData} setBeforeChangesData={setBeforeChangesData} />
            <SettingsNotifications account={account} loader={loader} data={data} setData={setData} />
            <SettingsNotificationsList account={account} loader={loader} data={data} setData={setData} />
            <SettingsBottomBlock account={account} loader={loader} />
        </div>
    )
}






export interface SettingsData {
    avatar: AvatarDTO,
    name: string,
    signatureProfileText: string,
    gender: number,
    birthDate: number,
    privacySettings: UserPrivacySettings,
    securitySettings: UserSecuritySettings,
    phoneNumber: string,
    email: string,
    authWithEmail: boolean,
    authWithPhone: boolean,
    notifySettings: UserNotifySettings,
    notifySettingsParams: UserNotifySettingsParams,
    lastChangePassword: Date,
    language: any
}

interface SettingsProps extends RouteAccountProps {
    saving?: boolean,

    data?: SettingsData,
    setData?: React.Dispatch<React.SetStateAction<SettingsData>>,

    beforeChangesData?: SettingsData,
    setBeforeChangesData?: React.Dispatch<React.SetStateAction<SettingsData>>
}

function SettingsMain({
    account,
    setAccount,

    loader,

    saving,

    data,
    setData,

    beforeChangesData,
    setBeforeChangesData
}: SettingsProps) {
    Moment.locale(window.language)

    React.useEffect(() => {
        if(saving) setIsChanging({...defaultIsChanging})
    }, [saving])

    const [ languageList, setLanguageList ] = React.useState([])
    React.useMemo(() => {
        const tmp = []
        window.languageList.map(item => {
            tmp.push([ item.code, item.name ])
        })

        setLanguageList(tmp)
    }, [])

    // toggle modals
    const [ modals, setModals ] = React.useState({
        changeAvatar: false
    })

    const [ isChanging, setIsChanging ] = React.useState({
        signatureProfileText: false,
        name: false,
        gender: false,
        birthDate: false,
        language: false
    })
    const [ defaultIsChanging ] = React.useState({...isChanging})

    const [ changingInputError, setChangingInputError ] = React.useState(null)
    function ChangingInput({
        param,
        settings = {
            maxlength: 0,
            style: {}
        }
    }) {
        let value = data[param]

        return (
            <Input type="text" maxLength={settings.maxlength} style={settings.style}
                value={value || ''}
                autoFocus={true}

                data={{error: changingInputError, mark: !changingInputError ? null : 'error', placeholder: param === 'name' ? Language("PLACEHOLDER_NAME_SURNAME") : null}}

                onInput={event => {
                    setData(old => {
                        old[param] = (event.target as HTMLInputElement).value
                        return {...old}
                    })
                }}

                sendBtn={true}
                sendBtnIcon={(<RiSave2Fill />)}
                onSendClick={() => {
                    setIsChanging(old => {
                        old[param] = false
                        return {...old}
                    })
                }}

                icon={(<IoRefresh />)}
                iconAlign={'center'}
                iconOnClick={() => {
                    setData(old => {
                        old[param] = beforeChangesData[param]
                        return {...old}
                    })
                }}
            />
        )
    }

    
    const [ geolocation, setGeolocation ] = React.useState<GeolocationDTO>()
    React.useEffect(() => {
        setGeolocation(window.userdata.geolocation)
    }, [window.userdata.geolocation])

    if(loader || !data)return (<SettingsLoader />)
    return (
        <div className="settingsBlock" data-blockname={"main"}>
            {modals.changeAvatar ? (
                <RouteAccountSettings_modalChangeAvatar
                    setAccount={setAccount} setData={setData} setBeforeChangesData={setBeforeChangesData}
                    account={account} data={data}
                    onClose={() => setModals({ ...modals, changeAvatar: false })} />
            ) : ''}

            <header className="settingsBlockHeader">
                <h1 className="title">{Language("ACCOUNT_SETTINGS_BLOCKMAIN_TITLE")}</h1>
            </header>

            <div className="params list">
                <div className="elem param duo" onClick={() => setModals({ ...modals, changeAvatar: !modals.changeAvatar })}>
                    <section>
                        <h2>{Language("ACCOUNT_SETTINGS_BLOCK_ELEM_PHOTO_TITLE")}</h2>
                    </section>
                    <section>
                        <Avatar type={"medium"} image={data.avatar.image} size={data.avatar.size} position={data.avatar.position} />
                    </section>
                </div>
                <div className="elem param triple phone-flex">
                    <section>
                        <h2>{Language("ACCOUNT_SETTINGS_BLOCK_ELEM_SIGNATURETEXT_TITLE")}</h2>
                    </section>
                    {isChanging.signatureProfileText ? (
                        <ChangingInput param="signatureProfileText" settings={{ maxlength: 24, style: {width: `calc(100% - 33%)`} }} />
                    ) : (
                        <>
                            <section onClick={() => !saving && setIsChanging({...defaultIsChanging, signatureProfileText: true})}>
                                <h1>{!data.signatureProfileText ? Language("ACCOUNT_NO_SIGNATURETEXT") : data.signatureProfileText}</h1>
                            </section>
                            <section className="editbtn" onClick={() => !saving && setIsChanging({...defaultIsChanging, signatureProfileText: true})}>
                                <AiFillEdit />
                            </section>
                        </>
                    )}
                </div>
                <div className="elem param triple phone-flex">
                    <section>
                        <h2>{Language("ACCOUNT_SETTINGS_BLOCK_ELEM_NAME_TITLE")}</h2>
                    </section>
                    {isChanging.name ? (
                        <ChangingInput param="name" settings={{ maxlength: 32, style: {width: `calc(100% - 33%)`} }} />
                    ) : (
                        <>
                            <section onClick={() => !saving && setIsChanging({...defaultIsChanging, name: true})}>
                                <h1>{data.name}</h1>
                            </section>
                            <section className="editbtn" onClick={() => !saving && setIsChanging({...defaultIsChanging, name: true})}>
                                <AiFillEdit />
                            </section>
                        </>
                    )}
                </div>
                <div className="elem param triple phone-flex">
                    <section>
                        <h2>{Language("ACCOUNT_SETTINGS_BLOCK_ELEM_GENDER_TITLE")}</h2>
                    </section>
                    {isChanging.gender ? (
                        <Select _type={data.gender} _list={[
                            [ 0, Language("GENDER_0") ],
                            [ 1, Language("GENDER_1") ],
                            [ -1, Language("GENDER_-1"), null, true ]
                        ]} onChange={value => {
                            setData({...data, gender: value[0]})
                            setIsChanging({...defaultIsChanging, gender: false})
                        }} />
                    ) : (
                        <>
                            <section onClick={() => !saving && setIsChanging({...defaultIsChanging, gender: true})}>
                                <h1>{Language("GENDER_" + data.gender)}</h1>
                            </section>
                            <section className="editbtn" onClick={() => !saving && setIsChanging({...defaultIsChanging, gender: true})}>
                                <AiFillEdit />
                            </section>
                        </>
                    )}
                </div>
                <div className="elem param triple phone-flex">
                    <section onClick={() => setIsChanging({...defaultIsChanging, birthDate: !isChanging.birthDate})}>
                        <h2>{Language("ACCOUNT_SETTINGS_BLOCK_ELEM_BIRTHDATE_TITLE")}</h2>
                    </section>
                    <section onClick={() => setIsChanging({...defaultIsChanging, birthDate: !isChanging.birthDate})}>
                        <h1>{!data.birthDate ? Language("NOT_INSTALL") : Moment(new Date(data.birthDate)).format('DD.MM.YYYY')}</h1>
                    </section>
                    <section className="editbtn" onClick={() => setIsChanging({...defaultIsChanging, birthDate: !isChanging.birthDate})}>
                        <AiFillEdit />
                    </section>

                    {isChanging.birthDate ? (
                        <div className="calendar">
                            <Calendar locale={window.language} defaultValue={!data.birthDate ? new Date() : new Date(data.birthDate)}
                                minDate={new Date('01.01.1900')}
                                maxDate={new Date('01.01.2020')}
                                onChange={(event: any) => {
                                    setData({...data, birthDate: +new Date(event)})
                                    setIsChanging({...defaultIsChanging, birthDate: !isChanging.birthDate})
                                }}
                            />
                        </div>
                    ) : ''}
                </div>
                <div className="elem param triple phone-flex">
                    <section>
                        <h2>{Language("ACCOUNT_SETTINGS_BLOCK_ELEM_LANGUAGE_TITLE")}</h2>
                    </section>

                    {isChanging.language ? (
                        <Select _type={data.language.code} _list={languageList} onChange={value => {
                            const tmp = window.languageList.find(item => item.code === value[0])
                            if(!tmp)return setIsChanging({...defaultIsChanging, language: false})

                            new CustomStorage().set('userLanguage', tmp.code)
                            window.location = window.location
                        }} />
                    ) : (
                        <>
                            <section onClick={() => !saving && setIsChanging({...defaultIsChanging, language: true})}>
                                <h1 className="link nothover">{data.language.name}</h1>
                            </section>
                            <section className="editbtn" onClick={() => !saving && setIsChanging({...defaultIsChanging, language: true})}>
                                <AiFillEdit />
                            </section>
                        </>
                    )}
                </div>

                <Link to="#geolocation" className="elem param triple phone-flex">
                    <section>
                        <h2>{Language("ACCOUNT_SETTINGS_BLOCK_ELEM_CITY_TITLE")}</h2>
                    </section>
                    <section>
                        <h2>{Language("ACCOUNT_SETTINGS_BLOCK_ELEM_CITY_DESCRIPTION")}</h2>
                    </section>
                    <section className="editbtn">
                        <h1>{(geolocation && geolocation.city) || ''}</h1>
                    </section>
                </Link>
            </div>
        </div>
    )
}







function SettingsPrivacy({
    setAccount,

    loader,
    saving,

    data,
    setData
}: SettingsProps) {
    if(loader || !data.avatar)return (<SettingsLoader />)
    return (
        <div className="settingsBlock" dat-blockname={"privacy"}>
            <header className="settingsBlockHeader">
                <h1 className="title">{Language("ACCOUNT_SETTINGS_BLOCKPRIVACY_TITLE")}</h1>
                <span className="description">{Language("ACCOUNT_SETTINGS_BLOCKPRIVACY_DESCRIPTION")}</span>
            </header>

            <div className="params list">
                <div className="elem param duo phone-flex">
                    <section>
                        <h2>{Language("ACCOUNT_SETTINGS_BLOCK_ELEM_VISIBLEBIRTHDATE_TITLE")}</h2>
                    </section>
                    <section>
                        <Select _type={data.privacySettings.showBirthDate} _list={[
                            [ "all", Language("ACCOUNT_SETTINGS_BLOCK_ELEM_VISIBLEBIRTHDATE_ELEM_1") ],
                            [ "daymonth", Language("ACCOUNT_SETTINGS_BLOCK_ELEM_VISIBLEBIRTHDATE_ELEM_2") ],
                            [ "none", Language("ACCOUNT_SETTINGS_BLOCK_ELEM_VISIBLEBIRTHDATE_ELEM_3") ],
                        ]} onChange={event => {
                            if(saving)return

                            setData(old => {
                                old.privacySettings = {...old.privacySettings, showBirthDate: event[0]}
                                return {...old}
                            })
                        }} />
                    </section>
                </div>
                <div className="elem param duo" onClick={() => {
                    setData(old => {
                        old.privacySettings = {...old.privacySettings, showGender: !old.privacySettings.showGender}
                        return {...old}
                    })
                }}>
                    <section>
                        <h2>{Language("ACCOUNT_SETTINGS_BLOCK_ELEM_VISIBLEGENDER_TITLE")}</h2>
                    </section>
                    <section className="switch">
                        <input type="checkbox" className="switch" checked={stringToBool(data.privacySettings.showGender)} onChange={() => {}} />
                    </section>
                </div>
                <div className="elem param duo" onClick={() => {
                    setData(old => {
                        old.privacySettings = {...old.privacySettings, showCity: !old.privacySettings.showCity}
                        return {...old}
                    })
                }}>
                    <section>
                        <h2>{Language("ACCOUNT_SETTINGS_BLOCK_ELEM_VISIBLECITY_TITLE")}</h2>
                    </section>
                    <section className="switch">
                        <input type="checkbox" className="switch" checked={stringToBool(data.privacySettings.showCity)} onChange={() => {}} />
                    </section>
                </div>
            </div>
        </div>
    )
}







function SettingsSecurity({
    account,
    setAccount,

    loader,
    saving,

    data,
    setData,

    setBeforeChangesData
}: SettingsProps) {
    const [ modals, setModals ] = React.useState({
        changePassword: false,
        changeEmail: false,
        emailVerify: false
    })

    if(loader || !data.avatar)return (<SettingsLoader />)
    return (
        <div className="settingsBlock" data-blockname={"security"}>
            {modals.changePassword ? (
                <RouteAccountSettings_modalChangePassword
                    setAccount={setAccount} setData={setData} setBeforeChangesData={setBeforeChangesData}
                    account={account} data={data}
                    onClose={() => setModals({ ...modals, changePassword: false })} />
            ) : ''}

            {modals.changeEmail ? (
                <RouteAccountSettings_modalChangeEmail account={account}
                    onClose={() => setModals({ ...modals, changeEmail: false })} />
            ) : ''}
            {modals.emailVerify ? (
                <EmailVerify type={"settings"} modal={true} onModalClose={() => setModals({ ...modals, emailVerify: false })} />
            ) : ''}

            <header className="settingsBlockHeader">
                <h1 className="title">{Language("ACCOUNT_SETTINGS_BLOCKSECURITY_TITLE")}</h1>
                <span className="description">{Language("ACCOUNT_SETTINGS_BLOCKSECURITY_DESCRIPTION")}</span>
            </header>

            <div className="params list">
                <div className="elem param triple phone-flex" onClick={() => {
                    if(!account.emailVerify) setModals({ ...modals, emailVerify: true })
                    else setModals({ ...modals, changeEmail: true })
                }}>
                    <section>
                        <h2>{Language("ACCOUNT_SETTINGS_BLOCK_ELEM_EMAIL_TITLE")}</h2>
                    </section>
                    <section>
                        <h1>{hideEmail(account.email)}</h1>
                        {!account.emailVerify ? (<h3>{Language("ACCOUNT_SETTINGS_BLOCK_ELEM_EMAIL_NOVERIFY")}</h3>) : ''}
                    </section>
                    <section className="editbtn">
                        <AiFillEdit />
                    </section>
                </div>
                <div className="elem param triple phone-flex" onClick={() => setModals({ ...modals, changePassword: true })}>
                    <section>
                        <h2>{Language("ACCOUNT_SETTINGS_BLOCK_ELEM_PASSWORD_TITLE")}</h2>
                    </section>
                    <section>
                        {+new Date(data.lastChangePassword) + 2592000000 < +new Date() ?
                            (<h3 style={{color: 'var(--tm-color-red)', margin: 0}}>{Language("ACCOUNT_SETTINGS_BLOCK_ELEM_PASSWORD_OUTDATED")}</h3>) : ''}
                    </section>
                    <section className="editbtn">
                        <AiFillEdit />
                    </section>
                </div>
                <div className="elem param triple phone-flex" onClick={() => {
                    if(RolePrivilegesVerify("/admin/*", window.userdata.roles)
                        || RolePrivilegesVerify("/moderation/*", window.userdata.roles))return Alert(Language("ACCOUNT_SETTINGS_BLOCK_ELEM_VERIFYSIGNMAIL_ERROR_1"))

                    setData(old => {
                        old.securitySettings = {...old.securitySettings, signinEmailVerify: !old.securitySettings.signinEmailVerify}
                        return {...old}
                    })
                }}>
                    <section>
                        <h2 className="dark">{Language("ACCOUNT_SETTINGS_BLOCK_ELEM_VERIFYSIGNMAIL_TITLE")}</h2>
                    </section>
                    <section>
                        <h2>{Language("ACCOUNT_SETTINGS_BLOCK_ELEM_VERIFYSIGNMAIL_DESCRIPTION")}</h2>
                    </section>
                    <section className="switch">
                        <input type="checkbox" className="switch" checked={data.securitySettings.signinEmailVerify || (RolePrivilegesVerify("/admin/*", window.userdata.roles) || RolePrivilegesVerify("/moderation/*", window.userdata.roles))} onChange={() => {}} />
                    </section>
                </div>
            </div>
        </div>
    )
}






function SettingsNotifications({
    account,
    loader,

    data,
    setData
}: SettingsProps) {
    if(loader || !data)return (<SettingsLoader />)
    return (
        <div className="settingsBlock" data-blockname={"notifications"}>
            <header className="settingsBlockHeader">
                <h1 className="title">{Language("ACCOUNT_SETTINGS_BLOCKNOTIFICATION_TITLE")}</h1>
            </header>

            <div className="params list">
                <div className="elem param triple phone-flex" onClick={() => {
                    setData({...data, notifySettings: {
                        ...data.notifySettings,
                        showOnSite: !data.notifySettings.showOnSite,
                        soundNotify: data.notifySettings.showOnSite ? false : data.notifySettings.soundNotify
                    }})
                }}>
                    <section>
                        <h2 className="dark">{Language("ACCOUNT_SETTINGS_BLOCK_ELEM_NOTIFICATION_ONSITE_TITLE")}</h2>
                    </section>
                    <section>
                        <h2>{Language("ACCOUNT_SETTINGS_BLOCK_ELEM_NOTIFICATION_ONSITE_DESC")}</h2>
                    </section>
                    <section>
                        <input type="checkbox" className="switch" checked={data.notifySettings.showOnSite} onChange={() => {}} />
                    </section>
                </div>
                {/* <div className="elem param triple phone-flex" onClick={() => {
                    setData({...data, notifySettings: {
                        ...data.notifySettings,
                        soundNotify: !data.notifySettings.soundNotify,
                        showOnSite: !data.notifySettings.soundNotify ? true : data.notifySettings.showOnSite
                    }})
                }}>
                    <section>
                        <h2 className="dark">{Language("ACCOUNT_SETTINGS_BLOCK_ELEM_NOTIFICATION_SOUND_TITLE")}</h2>
                    </section>
                    <section>
                        <h2>{Language("ACCOUNT_SETTINGS_BLOCK_ELEM_NOTIFICATION_SOUND_DESC")}</h2>
                    </section>
                    <section className="switch">
                        <input type="checkbox" className="switch" checked={data.notifySettings.soundNotify} onChange={() => {}} />
                    </section>
                </div> */}
                <div className="elem param duo" onClick={() => {
                    if(!account.emailVerify)return
                    setData({...data, notifySettings: { ...data.notifySettings, notifyOnEmail: !data.notifySettings.notifyOnEmail }})
                }}>
                    <section>
                        <h2>{Language("ACCOUNT_SETTINGS_BLOCK_ELEM_NOTIFICATION_ONEMAIL_TITLE")}</h2>
                    </section>
                    {!account.emailVerify ? (
                        <section>
                            <h3 style={{ textAlign: 'right' }}>{Language("ACCOUNT_SETTINGS_BLOCK_ELEM_NOTIFICATION_ONEMAIL_ERROR_1", null, { isjsx: true })}</h3>
                        </section>
                    ) : (
                        <section className="switch">
                            <input type="checkbox" className="switch" checked={data.notifySettings.notifyOnEmail} onChange={() => {}} />
                        </section>
                    )}
                </div>
            </div>
        </div>
    )
}






function SettingsNotificationsList({
    account,
    loader,

    data,
    setData
}: SettingsProps) {
    if(loader || !data)return (<SettingsLoader />)
    return (
        <div className="settingsBlock" data-blockname={"notifications-toggle"}>
            <header className="settingsBlockHeader">
                <h1 className="title">{Language("ACCOUNT_SETTINGS_BLOCKNOTIFICATIONPARAMS_TITLE")}</h1>
                <span className="description">{Language("ACCOUNT_SETTINGS_BLOCKNOTIFICATIONPARAMS_DESC")}</span>
            </header>

            <div className="params list">
                <div className="elem param triple phone-flex" onClick={() => {
                    setData({...data, notifySettingsParams: { ...data.notifySettingsParams, dialogs: !data.notifySettingsParams.dialogs }})
                }}>
                    <section>
                        <h2 className="dark">{Language("ACCOUNT_SETTINGS_BLOCK_ELEM_NOTIFICATIONPARAMS_DIALOGS_TITLE")}</h2>
                    </section>
                    <section>
                        <h2>{Language("ACCOUNT_SETTINGS_BLOCK_ELEM_NOTIFICATIONPARAMS_DIALOGS_DESC")}</h2>
                    </section>
                    <section>
                        <input type="checkbox" className="switch" checked={data.notifySettingsParams.dialogs} onChange={() => {}} />
                    </section>
                </div>
                <div className="elem param triple phone-flex" onClick={() => {
                    setData({...data, notifySettingsParams: { ...data.notifySettingsParams, changeProducts: !data.notifySettingsParams.changeProducts }})
                }}>
                    <section>
                        <h2 className="dark">{Language("ACCOUNT_SETTINGS_BLOCK_ELEM_NOTIFICATIONPARAMS_CHANGEPRODUCT_TITLE")}</h2>
                    </section>
                    <section>
                        <h2>{Language("ACCOUNT_SETTINGS_BLOCK_ELEM_NOTIFICATIONPARAMS_CHANGEPRODUCT_DESC")}</h2>
                    </section>
                    <section className="switch">
                        <input type="checkbox" className="switch" checked={data.notifySettingsParams.changeProducts} onChange={() => {}} />
                    </section>
                </div>
                <div className="elem param triple phone-flex" onClick={() => {
                    setData({...data, notifySettingsParams: { ...data.notifySettingsParams, support: !data.notifySettingsParams.support }})
                }}>
                    <section>
                        <h2 className="dark">{Language("ACCOUNT_SETTINGS_BLOCK_ELEM_NOTIFICATIONPARAMS_SUPPORT_TITLE")}</h2>
                    </section>
                    <section>
                        <h2>{Language("ACCOUNT_SETTINGS_BLOCK_ELEM_NOTIFICATIONPARAMS_SUPPORT_DESC")}</h2>
                    </section>
                    <section className="switch">
                        <input type="checkbox" className="switch" checked={data.notifySettingsParams.support} onChange={() => {}} />
                    </section>
                </div>
                <div className="elem param triple phone-flex" onClick={() => {
                    setData({...data, notifySettingsParams: { ...data.notifySettingsParams, report: !data.notifySettingsParams.report }})
                }}>
                    <section>
                        <h2 className="dark">{Language("ACCOUNT_SETTINGS_BLOCK_ELEM_NOTIFICATIONPARAMS_REPORT_TITLE")}</h2>
                    </section>
                    <section>
                        <h2>{Language("ACCOUNT_SETTINGS_BLOCK_ELEM_NOTIFICATIONPARAMS_REPORT_DESC")}</h2>
                    </section>
                    <section className="switch">
                        <input type="checkbox" className="switch" checked={data.notifySettingsParams.report} onChange={() => {}} />
                    </section>
                </div>
            </div>
        </div>
    )
}


function SettingsBottomBlock({
    account,
    loader
}: SettingsProps) {
    const [ modals, setModals ] = React.useState({
        deleteAccount: false
    })

    if(loader)return
    return (
        <div className="settingsBlock bottom" data-blockname={"bottom"}>
            {modals.deleteAccount ? (
                <RouteAccountSettings_modalDeleteAccount account={account} onClose={() => {
                    setModals({ ...modals, deleteAccount: false })
                }} />
            ) : ''}

            <div className="deleteAccount">
                <Button name={"Удалить аккаунт"} type={"hovertransparent"} size={"big"} onClick={() => {
                    setModals({ ...modals, deleteAccount: true })
                }} />
            </div>
        </div>
    )
}





















function SettingsLoader() {
    return (
        <div className="settingsBlock loader">
            <header className="settingsBlockHeader">
                <h1 className="title">
                    <div className="_loaderdiv" style={{width: '260px', height: '30px'}}></div>
                </h1>
            </header>

            <div className="params list">
                <div className="elem param duo">
                    <section>
                        <h2>
                            <div className="_loaderdiv" style={{width: '160px', height: '16px'}}></div>
                        </h2>
                    </section>
                    <section>
                        <div className="_loaderdiv" style={{width: '70px', height: '70px', borderRadius: '10px'}}></div>
                    </section>
                </div>
                <div className="elem param triple">
                    <section>
                        <h2>
                            <div className="_loaderdiv" style={{width: '190px', height: '16px'}}></div>
                        </h2>
                    </section>
                    <section>
                        <h1>
                            <div className="_loaderdiv" style={{width: '180px', height: '22px'}}></div>
                        </h1>
                    </section>
                    <section className="editbtn">
                        <div className="_loaderdiv" style={{width: '32px', height: '32px', borderRadius: '6px'}}></div>
                    </section>
                </div>
                <div className="elem param triple">
                    <section>
                        <h2>
                            <div className="_loaderdiv" style={{width: '130px', height: '16px'}}></div>
                        </h2>
                    </section>
                    <section>
                        <div className="_loaderdiv" style={{width: '140px', height: '22px'}}></div>
                    </section>
                    <section className="editbtn">
                        <div className="_loaderdiv" style={{width: '32px', height: '32px', borderRadius: '6px'}}></div>
                    </section>
                </div>
                <div className="elem param triple">
                    <section>
                        <h2>
                            <div className="_loaderdiv" style={{width: '80px', height: '16px'}}></div>
                        </h2>
                    </section>
                    <section>
                        <h1>
                            <div className="_loaderdiv" style={{width: '100px', height: '22px'}}></div>
                        </h1>
                    </section>
                    <section className="editbtn">
                        <div className="_loaderdiv" style={{width: '32px', height: '32px', borderRadius: '6px'}}></div>
                    </section>
                </div>
                <div className="elem param triple">
                    <section>
                        <h2>
                            <div className="_loaderdiv" style={{width: '120px', height: '16px'}}></div>
                        </h2>
                    </section>
                    <section>
                        <h1>
                            <div className="_loaderdiv" style={{width: '140px', height: '22px'}}></div>
                        </h1>
                    </section>
                    <section className="editbtn">
                        <div className="_loaderdiv" style={{width: '32px', height: '32px', borderRadius: '6px'}}></div>
                    </section>
                </div>
                <div className="elem param triple">
                    <section>
                        <h2>
                            <div className="_loaderdiv" style={{width: '100px', height: '16px'}}></div>
                        </h2>
                    </section>
                    <section>
                        <div className="_loaderdiv" style={{width: '120px', height: '22px'}}></div>
                    </section>
                    <section className="editbtn">
                        <div className="_loaderdiv" style={{width: '32px', height: '32px', borderRadius: '6px'}}></div>
                    </section>
                </div>
                <div className="elem param triple">
                    <section>
                        <h2>
                            <div className="_loaderdiv" style={{width: '110px', height: '16px'}}></div>
                        </h2>
                    </section>
                    <section>
                        <h2>
                            <div className="_loaderdiv" style={{width: '210px', height: '36px', borderRadius: "10px"}}></div>
                        </h2>
                    </section>
                    <section className="editbtn">
                        <h1>
                            <div className="_loaderdiv" style={{width: '180px', height: '22px'}}></div>
                        </h1>
                    </section>
                </div>
            </div>
        </div>
    )
}