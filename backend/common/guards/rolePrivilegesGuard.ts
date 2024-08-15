import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import templateResponse from 'common/templates/response.tp';
import { Request, Response } from 'express';
import { Role } from 'src/role/role.entity';
import { User } from 'src/user/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RolePrivilegesGuard implements CanActivate {
    constructor(
        private readonly privilege: string | string[]
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request: Request = context.switchToHttp().getRequest()
        const response: Response = context.switchToHttp().getResponse()

        const userData = request['user']
        if(!userData || !userData.roles) {
            templateResponse(response, 'You are not logged in', 401)
            throw new UnauthorizedException()
        }

        let found = null
        userData.roles.map((role: Role) => {
            if(role.privileges.findIndex(item => item === 'all') !== -1)return found = role
            if(typeof this.privilege === 'string'
                && role.privileges.indexOf(this.privilege) !== -1)return found = role
            
            if(typeof this.privilege === 'object') {
                this.privilege.map((prv: string) => {
                    if(role.privileges.indexOf(prv) !== -1)return found = role
                })
            }
        })

        if(!found) {
            templateResponse(response, "You don't have access", 403)
            return false
        }
        
        return true;
    }
}
