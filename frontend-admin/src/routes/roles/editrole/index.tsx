import React from 'react'

import { ColorPicker, IColor, useColor } from "react-color-palette";
import "react-color-palette/css";

import '../newrole/index.scss'
import './index.scss'

import { Language } from '@modules/Language'
import Input from '@components/input'
import { pickTextColorBasedOnBgColorAdvanced } from '@functions/pickTextColorBasedOnBgColorAdvanced';

import CONFIG from '@config'
import { CircleLoader } from '@components/circleLoader/circleLoader';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Avatar } from '@components/avatar/avatar';
import Username from '@components/username';
import { Modal } from '@components/modals';
import { Alert } from '@components/alert';
import { API } from '@modules/API';

import { VscRefresh } from "react-icons/vsc";
import { RouteErrorCode, RouteErrorCodeProps } from '../../errorcodes';
import { notify } from '@modules/Notify';
import Roletag from '@components/roletag';
import { hextorgb } from '@functions/hextorgb';
import { rgbtohsv } from '@functions/rgbtohsv';
import { RolePrivileges } from '..';
import RoleDTO from '@dto/role.dto';
import Button from '@components/button';
import SetRouteTitle from '@modules/SetRouteTitle';

export default function RouteEditRole() {
    SetRouteTitle(Language("ADMIN_ROUTE_TITLE_ROLES_EDIT"))
    const params = useParams()

    const [ loader, setLoader ] = React.useState(true)
    const [ errorPage, setErrorPage ] = React.useState<RouteErrorCodeProps>({ code: 0, text: '', showbtn: false })

    const [ navigate, setNavigate ] = React.useState(null)
    React.useEffect(() => { if(navigate !== null) setNavigate(null) }, [navigate])

    const [color, setColor] = useColor("#FFF")
    React.useEffect(() => {
        setRole({ ...role, color: [ color.hex, pickTextColorBasedOnBgColorAdvanced(color.hex) ] })
    }, [color])

    const [ role, setRole ] = React.useState<RoleDTO>()
    const [ privileges, setPrivileges ] = React.useState<Array<RolePrivileges>>(null)

    React.useMemo(() => {
        const key = params.key
        if(!key || key.length < 4 || key.length > 24 || key === 'developer') {
            setLoader(false)
            return setErrorPage({ code: 400 })
        }
        setLoader(true)

        API({
            url: '/defaultapi/role/get',
            type: 'get',
            data: {
                key
            }
        }).done(result => {
            console.log(result)
            if(result.statusCode === 200) {
                setRole(result.message)

                const changecolor: IColor = {
                    hex: result.message.color[0],
                    rgb: {...hextorgb(result.message.color[0]), a: 1},
                    hsv: {...rgbtohsv(hextorgb(result.message.color[0]).r, hextorgb(result.message.color[0]).g, hextorgb(result.message.color[0]).b), a: 1}
                }

                setColor(changecolor)

                const privileges = []
                CONFIG.rolePrivileges.map((item: RolePrivileges) => {
                    item.list.map((l, i) => {
                        item.list[i].select = result.message.privileges.indexOf(l.path) !== -1
                    })
                    privileges.push(item)
                })

                setPrivileges(privileges)
                setLoader(false)
            }
            else {
                setLoader(false)
                setErrorPage({ code: result.statusCode })

                notify('(roleedit) /role/get: ' + result.message, { debug: true })
            }
        })
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

    const [ usersRemoveLoader, setUsersRemoveLoader ] = React.useState(-1)
    function onRemoveUser(user, key) {
        if(btnLoader || disabled || usersRemoveLoader !== -1)return

        setUsersRemoveLoader(key)
        API({
            url: '/defaultapi/role/user/remove',
            type: 'delete',
            data: {
                userid: user.id,
                key: role.key
            }
        }).done(result => {
            if(result.statusCode === 200) {
                const index = role.usersList.findIndex(item => item.id === user.id)
                if(index !== -1) {
                    setRole(old => {
                        old.usersList.splice(index, 1)
                        return { ...old }
                    })
                }

                setUsersRemoveLoader(-1)
                Alert(Language("ADMIN_ROLES_EDIT_USERS_REMOVEROLE_SUCCESS", null, {}, role.nameTranslate[window.language] || role.name, user.name[0] + " " + user.name[1]), 'success',)
            }
            else {
                setErrorPage({ code: result.statusCode })
                notify("(editrole) /role/user/remove: " + result.message, { debug: true })
            }
        })
    }


    const [ changedModal, setChangedModal ] = React.useState(false)
    function onSubmit() {
        if(btnLoader || disabled || loader)return
        if(role.key !== params.key)return setErrorPage({ code: 400 })

        if(role.name.length < 4 || role.name.length > 24)return Alert(Language("ADMIN_ROLES_CREATE_ERROR_NAME_LENGTH"))
        if(role.name === 'Sample')return Alert(Language("ADMIN_ROLES_CREATE_ERROR_NAME_SAMPLE"))
        if(role.name.toLowerCase() === 'developer')return Alert(Language("ADMIN_ROLES_CREATE_ERROR_NAME_DEVELOPER"))

        if(role.key == role.name)return Alert(Language("ADMIN_ROLES_CREATE_ERROR_KEYNAME_MATCH"))

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
            url: '/defaultapi/role/update',
            type: 'put',
            data: {
                key: role.key,
                privileges: sortPrivileges,
                name: role.name,
                nameTranslate: JSON.stringify(role.nameTranslate),
                color: role.color
            }
        }).done(result => {
            if(result.statusCode === 200) setChangedModal(true)
            else {
                setErrorPage({ code: result.statusCode })
                notify("/role/create: " + result.message, { debug: true })
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
        <div className="route" id="routeEditRole">
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
            {changedModal ? (
                <Modal toggle={true} title={"Роль обновлена"} icon={(<VscRefresh />)}
                    body={(
                        <>
                            Роль
                            {role ? (<Roletag role={role} styles={{margin: '0 8px'}} />) : ''}
                            с ключем {role.key} была обновлена.
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
                    <Button name={Language("SAVE")} size={"medium"} loader={btnLoader} disabled={btnLoader || disabled}
                        onClick={onSubmit}
                    />
                    <Link to="/roles">
                        <Button name={Language("CANCEL")} classname='cancel' size={"medium"} />
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
                        <Input type={"text"} disabled={true} id="routeNewRole_Key" deleteLabel={true} value={role.key} onInput={event => setRole({ ...role, key: (event.target as HTMLInputElement).value })} />
                    </div>
                    <div className="formoutput"></div>
                </div>

                <div className="form">
                    <div className="formtitle">
                        <h1>{Language("ADMIN_ROLES_CREATE_FORM_TITLE_NAME")}</h1>
                        <Input type={"text"} disabled={disabled} id="routeNewRole_Name" deleteLabel={true} value={role.name} onInput={event => setRole({ ...role, name: (event.target as HTMLInputElement).value })} />
                    </div>
                    <div className="formoutput">
                        <Roletag role={role} size={"big"} />
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
                                    <div className={`translatename-elem ${role.nameTranslate[item.code] && 'selected'}`}>
                                        <h1>{item.name}</h1>
                                        <Input type={"text"} value={role.nameTranslate[item.code] || ''} deleteLabel={true} data={{placeholder: "Имя"}}
                                            onInput={event => {
                                                let names = role.nameTranslate
                                                const value = (event.target as HTMLInputElement).value

                                                if(!value.length && names[item.code]) delete names[item.code]
                                                else names[item.code] = value

                                                setRole({...role, nameTranslate: names})
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
                    {privileges ? privileges.map((item, pi) => {
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


                <div className="users">
                    <div className="title">{Language('ADMIN_ROLES_EDIT_USERS_TITLE')}</div>
                    <div className="list">
                        {!role.usersList.length ? (
                            <div className="nousers">{Language("ADMIN_ROLES_EDIT_USERS_NOTFOUND")}</div>
                        ) : ''}
                        {role.usersList.map((item, i) => {
                            return (
                                <div className="elem" key={i}>
                                    <section>
                                        <Avatar image={item.avatar.image} sizeImage={90} position={item.avatar.position} size={item.avatar.size} />
                                        <Username account={item} />
                                    </section>
                                    <section>
                                        <button onClick={() => onRemoveUser(item, i)} className={`btn ${usersRemoveLoader === i && 'loading'}`}
                                            disabled={usersRemoveLoader === -1 ? false : true}>
                                            <span>{Language('ADMIN_ROLES_EDIT_USERS_REMOVEROLE_BTN')}</span>
                                            {usersRemoveLoader === i ? (
                                                <CircleLoader type={"min"} />
                                            ) : ''}
                                        </button>
                                    </section>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            <div className="actions">
                <Button name={Language("SAVE")} size={"big"} loader={btnLoader} disabled={btnLoader || disabled}
                    onClick={onSubmit}
                />
                <Link to="/roles">
                    <Button name={Language("CANCEL")} classname='cancel' size={"big"} />
                </Link>
            </div>

            {navigate ? (<Navigate to={navigate} />) : ''}
        </div>
    )
}