import RoleDTO, { roleDefaultUser } from '@dto/role.dto'
import { Language } from '@modules/Language'
import React from 'react'

import './index.scss'

interface RoleTagProps {
    role?: RoleDTO,

    size?: 'big' | 'min',

    styles?: React.CSSProperties,
    classes?: string,

    onClick?: () => void
}
export default function Roletag({
    role,

    size,

    styles = {},
    classes,

    onClick
}: RoleTagProps) {
    if(!role) role = roleDefaultUser
    return (
        <h1 className={`_roletag_ ${size} ${classes}`} style={{background: role.color[0], color: role.color[1], ...styles}} data-key={role.key} onClick={onClick}>
            {role.key === '_user_' ? Language(role.name) : ''}
            {role.key !== '_user_' ? !role.nameTranslate ? role.name : role.nameTranslate[window.language] || role.name : ''}
        </h1>
    )
}