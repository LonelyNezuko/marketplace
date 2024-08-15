import { Role } from "src/role/role.entity"

export function RoleGetHighIndex(roles: Role[]): Role | Record<string, any> {
    if(!roles || !roles.length)return {
        index: 9999999999
    }

    const sort = roles.sort((a, b) => a.index - b.index)
    return sort[0]
}