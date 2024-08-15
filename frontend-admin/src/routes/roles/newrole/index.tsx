import React from 'react'

import { ColorPicker, useColor } from "react-color-palette";
import "react-color-palette/css";

import './index.scss'
import { Language } from '@modules/Language'
import Input from '@components/input'
import { pickTextColorBasedOnBgColorAdvanced } from '@functions/pickTextColorBasedOnBgColorAdvanced';

import CONFIG from '@config'
import { CircleLoader } from '@components/circleLoader/circleLoader';
import { Link, Navigate } from 'react-router-dom';
import { Modal } from '@components/modals';
import { Alert } from '@components/alert';
import { API } from '@modules/API';

import { MdCreateNewFolder } from "react-icons/md";
import { RouteErrorCode, RouteErrorCodeProps } from '../../errorcodes';
import { notify } from '@modules/Notify';
import Roletag from '@components/roletag';
import RoleDTO from '@dto/role.dto';
import Button from '@components/button';
import { RolePrivileges } from '..';
import SetRouteTitle from '@modules/SetRouteTitle';

export default function RouteNewRole() {
    SetRouteTitle(Language("ADMIN_ROUTE_TITLE_ROLES_NEW"))

    const [ loader, setLoader ] = React.useState(false)
    const [ errorPage, setErrorPage ] = React.useState<RouteErrorCodeProps>({ code: 0, text: '', showbtn: false })

    const [ navigate, setNavigate ] = React.useState(null)
    React.useEffect(() => { if(navigate !== null) setNavigate(null) }, [navigate])


    const [color, setColor] = useColor("#FFF")
    React.useEffect(() => {
        setTagSettings({ ...tagSettings, color: [ color.hex, pickTextColorBasedOnBgColorAdvanced(color.hex) ] })
    }, [color])

    const [ tagSettings, setTagSettings ] = React.useState({
        color: [ "#FFF", "#000" ],
        name: "Sample",
        nameTranslate: {},
        key: 'sample'
    })

    const [ privilegesLoader, setPrivilegesLoader ] = React.useState(true)
    const [ privileges, setPrivileges ] = React.useState<Array<RolePrivileges>>(null)

    React.useMemo(() => {
        setPrivilegesLoader(true)
        const tmp = []

        CONFIG.rolePrivileges.map((item: RolePrivileges) => {
            item.list.map((_, i) => item.list[i].select = false)
            tmp.push(item)
        })

        setPrivileges(tmp)
        setPrivilegesLoader(false)
    }, [])
    function onSubmitPrivilege(path) {
        if(disabled || btnLoader)return
        
        setPrivileges(old => {
            old.map((item, pi) => {
                item.list.map((l, li) => {
                    if(l.path === path) old[pi].list[li].select = !old[pi].list[li].select
                })
            })

            return [...old]
        })
    }

    const [ btnLoader, setBtnLoader ] = React.useState(false)
    const [ disabled, setDisabled ] = React.useState(false)

    const [ importantModal, setImportantModal ] = React.useState(null)
    const [ importantModalText, setImportantModalText ] = React.useState<string>()


    const [ createdModal, setCreatedModal ] = React.useState(false)
    function onSubmit() {
        if(btnLoader || disabled || loader)return

        if(tagSettings.name.length < 4 || tagSettings.name.length > 24)return Alert(Language("ADMIN_ROLES_CREATE_ERROR_NAME_LENGTH"))
        if(tagSettings.name === 'Sample')return Alert(Language("ADMIN_ROLES_CREATE_ERROR_NAME_SAMPLE"))
        if(tagSettings.name.toLowerCase() === 'developer')return Alert(Language("ADMIN_ROLES_CREATE_ERROR_NAME_DEVELOPER"))

        if(tagSettings.key.length < 4 || tagSettings.key.length > 24)return Alert(Language("ADMIN_ROLES_CREATE_ERROR_KEY_LENGTH"))
        if(tagSettings.key === 'sample')return Alert(Language("ADMIN_ROLES_CREATE_ERROR_KEY_SAMPLE"))
        if(!/^[a-z]*$/.test(tagSettings.key))return Alert(Language("ADMIN_ROLES_CREATE_ERROR_KEY_REGEX"))
        if(tagSettings.key === 'developer')return Alert(Language("ADMIN_ROLES_CREATE_ERROR_KEY_DEVELOPER"))

        if(tagSettings.key == tagSettings.name)return Alert(Language("ADMIN_ROLES_CREATE_ERROR_KEYNAME_MATCH"))

        const sortPrivileges = []
        privileges.map(item => {
            item.list.map(l => {
                if(l.select) sortPrivileges.push(l.path)
            })
        })
        if(!sortPrivileges.length)return Alert(Language("ADMIN_ROLES_CREATE_ERROR_PRIVILEGES_LENGTH"))

        setBtnLoader(true)
        setDisabled(true)

        API({
            url: '/defaultapi/role/create',
            type: 'post',
            data: {
                key: tagSettings.key,
                privileges: sortPrivileges,
                name: tagSettings.name,
                nameTranslate: JSON.stringify(tagSettings.nameTranslate),
                color: tagSettings.color
            }
        }).done(result => {
            if(result.statusCode === 200) setCreatedModal(true)
            else {
                if(result.message === 'Role with this Key already exists') {
                    setBtnLoader(false)
                    setDisabled(false)

                    Alert(Language("ADMIN_ROLES_CREATE_ERROR_KEY_EXISTS"))
                }
                else {
                    setErrorPage({ code: result.statusCode })
                    notify("/role/create: " + result.message, { debug: true })
                }
            }
        })
    }

    if(!loader && errorPage.code !== 0)return (
        <RouteErrorCode style={{marginTop: "128px"}} code={errorPage.code} text={errorPage.text}
            showbtn={errorPage.showbtn} btnurl={errorPage.btnurl} btnname={errorPage.btnname}
            icon={errorPage.icon} />
    )
    if(loader)return (
        <div style={{display: 'flex', justifyContent: 'center', padding: '124px 0'}}>
            <CircleLoader type="megabig" color={'var(--tm-color)'} />
        </div>
    )
    return (
        <div className="route" id="routeNewRole">
            {importantModal ? (
                <Modal toggle={true} title={Language("ADMIN_ROLES_CREATE_IMPORTANT_DEFAULT_TITLE")} body={Language(importantModalText) || Language("ADMIN_ROLES_CREATE_IMPORTANT_DEFAULT_BODY")}
                    buttons={[ Language("CANCEL"), Language("ENABLE") ]}

                    onClick={() => {
                        onSubmitPrivilege(importantModal)
                        setImportantModal(null)
                    }}
                    onClose={() => setImportantModal(null)}
                />
            ) : ''}
            {createdModal ? (
                <Modal toggle={true} title={"Роль создана"} icon={(<MdCreateNewFolder />)}
                    body={(
                        <>
                            Роль
                            <Roletag role={tagSettings as RoleDTO} styles={{margin: '0 8px'}} />
                            с ключем {tagSettings.key} был создана.
                            <br /><br />
                            Обновите страницу, чтобы увидеть ее в списке ролей
                        </>
                    )}

                    buttons={[ Language("REFRESH") ]}
                    onClose={() => setNavigate("/roles")}
                />
            ) : ''}



            <header className="header">
                <div className="title">
                    <div className="routetitle">{Language("NAV_NAVIGATION_TITLE_ROLES_NEW")}</div>
                </div>
                <div className="actions">
                    <Button name={Language("ADMIN_ROLES_CREATE_BTN")} size={"medium"} loader={btnLoader} disabled={btnLoader || disabled}
                        onClick={onSubmit}
                    />
                    <Link to="/roles">
                        <Button name={Language("CANCEL")} size={"medium"} classname='cancel' />
                    </Link>
                </div>
            </header>

            <div className="body">
                <div className="form" style={{marginBottom: "64px"}}>
                    <div className="formtitle">
                        <h1>
                            {Language("ADMIN_ROLES_CREATE_FORM_TITLE_KEY")}
                            <span className="hoverinfo" data-info={Language("ADMIN_ROLES_CREATE_FORM_TITLE_KEY_HOVERINFO")}></span>
                        </h1>
                        <Input type={"text"} disabled={disabled} id="routeNewRole_Key" deleteLabel={true} value={tagSettings.key} onInput={event => setTagSettings({ ...tagSettings, key: (event.target as HTMLInputElement).value })} />
                    </div>
                    <div className="formoutput"></div>
                </div>

                <div className="form">
                    <div className="formtitle">
                        <h1>{Language("ADMIN_ROLES_CREATE_FORM_TITLE_NAME")}</h1>
                        <Input type={"text"} disabled={disabled} id="routeNewRole_Name" deleteLabel={true} value={tagSettings.name} onInput={event => setTagSettings({ ...tagSettings, name: (event.target as HTMLInputElement).value })} />
                    </div>
                    <div className="formoutput">
                        <Roletag role={tagSettings as RoleDTO} size={"big"} />
                    </div>
                </div>

                <div className="form formtranslatename translatename">
                    <div className="formtitle">
                        <h1>
                            {Language("ADMIN_ROLES_CREATE_FORM_TITLE_NAMETRANSLATE")}
                            <div className="hoverinfo" data-info={Language("ADMIN_ROLES_CREATE_FORM_TITLE_NAMETRANSLATE_HOVERINFO")}></div>
                        </h1>

                        <div className="translatename-list">
                            {window.languageList.map((item, i) => {
                                return (
                                    <div className={`translatename-elem ${tagSettings.nameTranslate[item.code] && 'selected'}`}>
                                        <h1>{item.name}</h1>
                                        <Input type={"text"} value={tagSettings.nameTranslate[item.code] || ''} deleteLabel={true} data={{placeholder: "Имя"}}
                                            onInput={event => {
                                                let names = tagSettings.nameTranslate
                                                const value = (event.target as HTMLInputElement).value

                                                if(!value.length && names[item.code]) delete names[item.code]
                                                else names[item.code] = value

                                                setTagSettings({...tagSettings, nameTranslate: names})
                                            }}
                                        />
                                    </div>
                                )
                            })}
                        </div>
                        <div className="translatename-desc">
                            <span>
                                {Language("CATEGORY_ADD_FORM_TRANSLATE_NAME_CATEGORY_HINT")}
                            </span>
                        </div>
                    </div>
                    <div className="formoutput"></div>
                </div>

                <div className="form">
                    <div className="formtitle">
                        <h1>{Language("ADMIN_ROLES_CREATE_FORM_TITLE_COLOR")}</h1>
                        <div className="coloreditor">
                            <ColorPicker color={color} onChange={setColor} hideAlpha={true} hideInput={true} />
                            {disabled ? (<div className="disabled"></div>) : ''}
                        </div>
                    </div>
                    <div className="formoutput"></div>
                </div>


                <div className="privileges">
                    {!privilegesLoader && privileges ? privileges.map((item, pi) => {
                        return (
                            <div key={pi} className="block">
                                <div className="title">
                                    <h1>{Language(item.groupName)}</h1>
                                </div>
                                <div className="list">
                                    {item.list.map((l, i) => {
                                        return (
                                            <div key={i} className={`elem ${l.select && 'selected'} ${l.important && 'important'} ${disabled && 'disabled'}`}
                                                onClick={() => {
                                                    if(!l.select && l.important) {
                                                        setImportantModalText(l.importantText)
                                                        return setImportantModal(l.path)
                                                    }

                                                    onSubmitPrivilege(l.path)
                                                }}>
                                                <section className="section">
                                                    <h1>
                                                        {Language(l.name)}
                                                        <span>{l.path}</span>
                                                    </h1>
                                                    <span>{Language(l.desc)}</span>
                                                </section>
                                                <section className="section">
                                                    <input type="checkbox" className="switch" checked={l.select} />
                                                </section>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    }) : ''}
                </div>
            </div>

            <div className="actions">
                <Button name={Language("ADMIN_ROLES_CREATE_BTN")} size={"big"} loader={btnLoader} disabled={btnLoader || disabled}
                    onClick={onSubmit}
                />
                <Link to="/roles">
                    <Button name={Language("CANCEL")} size={"big"} classname='cancel' />
                </Link>
            </div>

            {navigate ? (<Navigate to={navigate} />) : ''}
        </div>
    )
}