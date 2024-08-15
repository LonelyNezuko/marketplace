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

import CONFIG_APIKEYS from 'common/configs/apikeys.config'

@Injectable()
export class ApiKeyGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request: Request = context.switchToHttp().getRequest()
        const response: Response = context.switchToHttp().getResponse()

        let apikey: any
        let privilege: any

        if(request.method === 'GET') {
            apikey = request.query.apikey
            privilege = request.query.privilege
        }
        else {
            apikey = request.body.apikey
            privilege = request.body.privilege
        }
        if(!apikey || !privilege)return false

        let access: boolean = false
        for(const key in CONFIG_APIKEYS) {
            if(key === apikey) {
                if(CONFIG_APIKEYS[key].indexOf(privilege) !== -1) {
                    access = true
                }
            }
        }
        return access;
    }
}