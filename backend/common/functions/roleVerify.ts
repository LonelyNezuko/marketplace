import { Request, Response } from 'express';
import { Role } from 'src/role/role.entity';

export function RoleVerify(key: string, request: Request): boolean {
    const userData = request['user']
    if(!userData || !userData.roles)return false

    let found = null
    userData.roles.map((role: Role) => {
        if(role.key === key)return found = role
    })

    if(!found)return false
    return true;
}