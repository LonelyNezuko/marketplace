import RoleDTO from "@dto/role.dto"

export function RolePrivilegesVerify(privilege: string, roles: Array<RoleDTO>) {
    if(!roles || !roles.length)return false

    let found = null
    roles.map(role => {
        if(role.privileges.findIndex(item => item === 'all') !== -1
            || role.privileges.indexOf(privilege) !== -1)return found = role
    })

    if(!found)return false
    return true;
}

export function RolePrivilegesVerifyIndexOf(privilege: string, roles: Array<RoleDTO>) {
    if(!roles || !roles.length)return false

    let found = null
    roles.map(role => {
        if(role.privileges.findIndex(item => item === 'all') !== -1)return found = role
        role.privileges.map(item => {
            if(item.indexOf(privilege) !== -1)return found = role
        })
    })

    if(!found)return false
    return true;
}

export function RoleGetHighIndex(roles: Array<RoleDTO>): RoleDTO {
    if(!roles || !roles.length)return

    const sort = roles.sort((a, b) => a.index - b.index)
    return sort[0]
}