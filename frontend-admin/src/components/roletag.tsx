import RoleDTO from '@dto/role.dto'
import React from 'react'

interface RoleTagProps {
    role: RoleDTO,

    size?: 'big',
    styles?: React.CSSProperties
}
export default function Roletag({
    role,

    size,
    styles = {}
}: RoleTagProps) {
    if(!role)return (<></>)
    return (
        <h1 className={`_roletag_ ${size}`} style={{background: role.color[0], color: role.color[1], ...styles}} data-key={role.key}>
            {!role.nameTranslate ? role.name : role.nameTranslate[window.language] || role.name}
        </h1>
    )
}