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
export class RoleGuard implements CanActivate {
    constructor(
        private readonly role: string
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
            if(role.key === this.role)return found = role
        })
        if(!found) {
            templateResponse(response, "You don't have access", 403)
            return false
        }
        
        return true;
    }
}