import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import templateResponse from 'common/templates/response.tp';
import { Request, Response } from 'express';
import { GetUserReq } from './getUserReq';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/user.entity';
import { Repository } from 'typeorm';
import { UserSessions } from 'src/user/user.sessions/user.sessions.entity';
import { ModuleRef } from '@nestjs/core';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        @InjectRepository(UserSessions)
        private readonly userSessionsRepository: Repository<UserSessions>,

        private readonly moduleRef: ModuleRef
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request: Request = context.switchToHttp().getRequest()
        const response: Response = context.switchToHttp().getResponse()

        const getUserReq = new GetUserReq(this.userRepository, this.userSessionsRepository, this.moduleRef)
        
        await getUserReq.onModuleInit()
        const userReqData: User = await getUserReq.canActivate(context) as any

        if((userReqData as any).needToRefresh) {
            templateResponse(response, "Need to refresh token", 401)
            return false
        }
        if(!userReqData.id) {
            templateResponse(response, "Unauthorized Exception", 401)
            return false
        }

        return true;
    }
}