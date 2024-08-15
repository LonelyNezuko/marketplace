import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
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
export class IsUserBanned implements CanActivate {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request: Request = context.switchToHttp().getRequest()
        const response: Response = context.switchToHttp().getResponse()

        const userData = request['user']
        if(!userData || !userData.id) {
            templateResponse(response, 'You are not logged in', 401)
            throw new UnauthorizedException()
        }

        if(userData.banned) {
            if(+new Date(userData.bannedExpires) <= +new Date()) this.userRepository.update({ id: userData.id }, { banned: false })
            else {
                templateResponse(response, "You are banned", 423)
                return false
            }
        }
        
        return true;
    }
}