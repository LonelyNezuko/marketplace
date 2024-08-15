import React from 'react'

import './index.scss'
import { RolePrivilegesVerifyIndexOf } from '@modules/RolePrivilegesVerify'
import { Link } from 'react-router-dom'

import CONFIG from '@config'
import Cookies from 'universal-cookie'

export default function StaffHeader() {
    const [ toggle, setToggle ] = React.useState(false)
    const [ access, setAccess ] = React.useState({
        admin: false,
        moderation: false
    })

    React.useEffect(() => {
        const access = {
            admin: false,
            moderation: false
        }

        if(RolePrivilegesVerifyIndexOf("/admin/*", window.userdata.roles)) access.admin = true
        if(RolePrivilegesVerifyIndexOf("/moderation/*", window.userdata.roles)) access.moderation = true

        setAccess(access)
    }, ['', window.userdata])

    React.useEffect(() => {
        if(!access.admin
            && !access.moderation) setToggle(false)
        else setToggle(true)
    }, [access])

    if(!toggle)return
    return (
        <div className="_staff_header">
            <div className="_staff_header_wrapper">
                {access.admin ?
                    (<Link to={CONFIG.adminPanelLink} target='_blank' className="admin">Администрирование</Link>) : ''}
                {access.moderation ?
                    (<Link to={CONFIG.moderationPanelLink} target='_blank' className="admin">Модерация</Link>) : ''}
            </div>
        </div>
    )
}