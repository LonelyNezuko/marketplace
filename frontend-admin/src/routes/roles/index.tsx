import React from 'react'
import $ from 'jquery'

import Moment from 'moment'
import 'moment/min/locales'

import './index.scss'
import { RouteErrorCode, RouteErrorCodeProps } from '@routes/errorcodes'
import { CircleLoader } from '@components/circleLoader/circleLoader'
import Table from '@components/table'
import { Link, Navigate } from 'react-router-dom'
import { Language } from '@modules/Language'
import { Avatar } from '@components/avatar/avatar'

import CONFIG from '@config'

import { IoLink } from "react-icons/io5";

import { MdDeleteSweep, MdEdit } from "react-icons/md";
import { MdDeleteForever } from "react-icons/md";
import Input from '@components/input'

import { TbLock } from "react-icons/tb";
import { API } from '@modules/API'
import { notify } from '@modules/Notify'
import Username from '@components/username'
import { RoleGetHighIndex, RolePrivilegesVerify } from '@modules/RolePrivilegesVerify'
import Roletag from '@components/roletag'
import ModalLoader from '@components/modals/loader'
import { Modal } from '@components/modals'
import { Alert } from '@components/alert'
import InputUpDown from '@components/inputupdown'
import UserDTO from '@dto/user.dto'
import RoleDTO from '@dto/role.dto'
import Button from '@components/button'
import SetRouteTitle from '@modules/SetRouteTitle'

export interface RolePrivilegesList {
    name: string
    desc: string

    path: string

    important?: boolean
    importantText?: string

    select?: boolean
}
export interface RolePrivileges {
    groupName: string
    list: Array<RolePrivilegesList>
}

export default function RouteRoles() {
    SetRouteTitle(Language("ADMIN_ROUTE_TITLE_ROLES"))
    Moment.locale(window.language)

    const [ reloader, setReloader ] = React.useState(0)

    const [ loader, setLoader ] = React.useState(true)
    const [ errorPage, setErrorPage ] = React.useState<RouteErrorCodeProps>({ code: 0, text: '', showbtn: false })
    
    const [ navigate, setNavigate ] = React.useState(null)
    React.useEffect(() => { if(navigate !== null) setNavigate(null) }, [navigate])

    const [ roles, setRoles ] = React.useState<Array<RoleDTO>>([])
    const [ list, setList ] = React.useState([])

    const [ account, setAccount ] = React.useState<UserDTO>()

    const [ changeIndex, setChangeIndex ] = React.useState({
        toggle: false,
        rolekey: '',
        index: 0
    })
    function setRoleIndex(rolekey, index) {
        const role = roles.find(item => item.key === rolekey)
        console.log(role, index, role.index, typeof index, typeof role.index)
        if(index === role.index)return

        const oldindex = role.index
        
        setRoles(old => {
            old.map((item, i) => {
                if(item.key === rolekey) old[i].index = index
            })

            old.map((item, i) => {
                if(item.index > oldindex && item.index <= index && item.key !== rolekey) old[i].index -= 1
                if(item.index >= index && item.index < oldindex && item.key !== rolekey) old[i].index += 1
            })

            old = old.sort((a, b) => a.index - b.index)
            return [...old]
        })

        API({
            url: '/defaultapi/role/update/index',
            type: 'put',
            data: {
                key: role.key,
                index
            }
        }).done(result => {
            console.log(result)
            if(result.statusCode !== 200) {
                setErrorPage({ code: result.statusCode })
                notify('(roles) /role/update/index: ' + result.message, { debug: true })
            }
        })
    }

    React.useEffect(() => {
        setLoader(true)

        API({
            url: '/defaultapi/user',
            type: 'get'
        }).done(resultAccount => {
            if(resultAccount.statusCode === 200) {
                setAccount(resultAccount.message)

                API({
                    url: '/defaultapi/role/',
                    type: 'get'
                }).done(result => {
                    if(result.statusCode === 200) {
                        setRoles(result.message)
                        setLoader(false)
                    }
                    else {
                        setErrorPage({ code: result.statusCode })
                        notify('/role: ' + result.message, { debug: true })
                    }
                })
            }
            else {
                setErrorPage({ code: resultAccount.statusCode })
                notify('/role: ' + resultAccount.message, { debug: true })
            }
        })
    }, ['', reloader])
    React.useEffect(() => {
        if(account) {
            let tmp = []

            roles.map((item, i) => {
                const editAccess = RoleGetHighIndex(account.roles).index < item.index && RolePrivilegesVerify("/role/update", account.roles)
                const editIndexAccess = RoleGetHighIndex(account.roles).index < item.index && RolePrivilegesVerify("/role/update/index", account.roles)
                const deleteAccess = RoleGetHighIndex(account.roles).index < item.index && RolePrivilegesVerify("/role/delete", account.roles)

                tmp.push([
                    { content: item.index, width: '30px', value: `index-${item.index}` },
                    { content: <Roletag role={item} />, id: 'name', value: item.nameTranslate[window.language] || item.name },
                    { content: item.key },
                    { content: item.privileges.length + " " + Language("QUANTITY_REDUCTION") },
                    { content: item.usersCount || 0 + " " + Language("PEOPLES_REDUCTION") },
                    { content: !item.createUser ? (<span>System</span>) : (<Link target='_blank' to={CONFIG.moderationPanelLink + "/users/" + item.createUser.id} className="link"><Username account={item.createUser} /></Link>) },
                    { content: Moment(item.createAt).calendar() },
                    { dropdown: item.key === 'developer' || RoleGetHighIndex(account.roles).index >= item.index || (!editAccess && !deleteAccess && !editIndexAccess) ? null : [
                        editAccess ?
                            { content: Language("NAV_NAVIGATION_TITLE_ROLES_EDIT"), link: '/roles/edit/' + item.key } : null,
                        
                        editIndexAccess ?
                            { content: Language("NAV_NAVIGATION_TITLE_ROLES_EDIT_INDEX"), onClick: () => {
                                setChangeIndex({
                                    toggle: true,
                                    rolekey: item.key,
                                    index: item.index
                                })
                            } } : null,

                        deleteAccess ?
                            { content: Language("NAV_NAVIGATION_TITLE_ROLES_DELETE"), bottom: true, color: 'var(--tm-color-darkred)', onClick: () => {
                                setDeleteModal(i)
                            } } : null
                    ], style: {width: "40px"} }
                ])
            })
            setList(tmp)
        }
    }, [roles, changeIndex, account])

    const [ deleteModal, setDeleteModal ] = React.useState(-1)
    const [ deleteModalLoader, setDeleteModalLoader ] = React.useState(false)

    function onSearch(text) {
        if(!text.length) $('.table#routeRolesTable table tbody tr').show()
        else {
            roles.map(item => {
                const name = item.nameTranslate[window.language] || item.name

                if(name.indexOf(text) !== -1
                    || item.key.indexOf(text) !== -1) $(`.table#routeRolesTable table tbody tr td[data-value="index-${item.index}"]`).parent().show()
                else $(`.table#routeRolesTable table tbody tr td[data-value="index-${item.index}"]`).parent().hide()
            })
        }
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
        <div className="route" id="routeRoles">
            {deleteModal !== -1 && !deleteModalLoader ? (
                <Modal toggle={true} title={"Удаление роли"} icon={(<MdDeleteSweep />)}
                    body={(
                        <>
                            {Language("ADMIN_ROLES_LIST_TABLE_DELETE_BODY", null, {}, (<Roletag role={roles[deleteModal]} styles={{margin: '0 6px'}} />))}
                        </>
                    )}
                    buttons={[ Language("CANCEL"), Language("DELETE") ]}

                    onClose={() => setDeleteModal(-1)}
                    onClick={() => {
                        setDeleteModal(-1)
                        setDeleteModalLoader(true)

                        API({
                            url: '/defaultapi/role/delete',
                            type: 'delete',
                            data: {
                                key: roles[deleteModal].key
                            }
                        }).done(result => {
                            setDeleteModalLoader(false)

                            if(result.statusCode === 200) {
                                setReloader(old => old + 1)
                                Alert("Роль была успешно удалена", "success")
                            }
                            else if(result.statusCode === 403) setErrorPage({ code: 403 })
                            else notify(`(roles) /role/delete: ` + result.message, { debug: true })
                        })
                    }}
                />
            ) : ''}
            {deleteModal === -1 && deleteModalLoader ? (
                <ModalLoader />
            ) : ''}

            <header className="header">
                <div className="title">
                    <div className="routetitle">{Language("NAV_NAVIGATION_TITLE_ROLES")}</div>
                    <span>{Language("ADMIN_ROLES_LIST_COUNTER", null, {}, roles.length)}</span>
                </div>
                <div className="right">
                    <div className="search">
                        <Input type={"text"} id="routeRolesSearch" data={{placeholder: Language("SEARCH")}} deleteLabel={true} onInput={event => onSearch((event.target as HTMLInputElement).value)} />
                    </div>
                    <div className="actions">
                        <Link to="/roles/new">
                            <Button name={Language("NAV_NAVIGATION_TITLE_ROLES_NEW")} type={"border"} />
                        </Link>
                    </div>
                </div>

                {account && changeIndex.toggle ? (
                    <div id="roleChangeIndexModal">
                        <InputUpDown
                            max={roles[roles.length - 1].index}
                            min={RoleGetHighIndex(account.roles).index + 1}
                            value={changeIndex.index}
                            onChange={number => setRoleIndex(changeIndex.rolekey, number)} />
                    </div>
                ) : ''}
            </header>

            <Table id="routeRolesTable" hiddentop={true} design={"new"} searchBy={"name"}
                ths={[
                    { content: "", width: '30px' },
                    { content: Language("ADMIN_ROLES_LIST_TABLE_NAME") },
                    { content: Language("ADMIN_ROLES_LIST_TABLE_KEY") },
                    { content: Language("ADMIN_ROLES_LIST_TABLE_PRIVILIGESCOUNTER") },
                    { content: Language("ADMIN_ROLES_LIST_TABLE_USERCOUNTER") },
                    { content: Language("ADMIN_ROLES_LIST_TABLE_CREATEUSER") },
                    { content: Language("ADMIN_ROLES_LIST_TABLE_CREATEAT") },
                    { content: "", width: "40px" }
                ]}
                list={list}
            />
            
            {navigate ? (<Navigate to={navigate} />) : ''}
        </div>
    )
}