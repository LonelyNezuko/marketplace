import { CanActivate, ExecutionContext, Injectable, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/user/user.entity";
import { FindOptionsRelations, Like, Repository } from "typeorm";
import { Request, Response } from 'express';
import { UserSigninJWT } from "src/user/user.signin/user.signin.dto";
import { Socket } from 'socket.io'
import { UserSessions } from "src/user/user.sessions/user.sessions.entity";
import { UserService } from "src/user/user.service";
import { ModuleRef } from "@nestjs/core";
import { UserSigninService } from "src/user/user.signin/user.signin.service";

const bcryptjs = require('bcryptjs')
const jwt = require('jsonwebtoken')

@Injectable()
export class GetUserReq implements CanActivate, OnModuleInit {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        @InjectRepository(UserSessions)
        private readonly userSessionsRepository: Repository<UserSessions>,

        private readonly moduleRef: ModuleRef
    ) {}

    private userSigninService: UserSigninService
    async onModuleInit() {
        this.userSigninService = await this.moduleRef.get(UserSigninService, { strict: false })
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const gatewayClient: Socket = context.switchToWs().getClient()

        const response: Response = context.switchToHttp().getResponse()
        const request: Request = context.switchToHttp().getRequest()

        let headers: any = {}

        try {
            headers = gatewayClient.handshake.headers
        }
        catch(e) {
            headers = request.headers
        }

        const userRelations: FindOptionsRelations<User> = {
            roles: true,
            readNotifications: true,
            deleteSystemNotifications: true,
            favoritesProducts: {
                prodCategory: true,
                prodOwner: true
            }
        }

        const userRepository = this.userRepository
        async function getUserData(id?: number, user?: User) {
            if(!user) user = await userRepository.findOne({
                where: {
                    id: id,
                    _deleted: false
                },
                relations: userRelations
            })

            if(user) {
                request['user'] =
                gatewayClient['user'] = user
            }
        }

        const token = headers.authorization
        if(token && token.indexOf('Bearer ') === 0) {
            try {
                const data: UserSigninJWT = jwt.verify(token.replace('Bearer ', ''), process.env.jwt_accessprivatekey)
                if(data
                    && data.id) {
                    const subnet = request.ip.substring(0, request.ip.lastIndexOf('.'))
                    const sessionsFind = await this.userSessionsRepository.count({
                        where: [
                            {
                                sessionUser: {
                                    id: data.id
                                },
                                sessionIP: request.ip,
                                sessionAgent: headers['user-agent']
                            },
                            {
                                sessionUser: {
                                    id: data.id
                                },
                                sessionIP: Like(subnet),
                                sessionAgent: headers['user-agent']
                            }
                        ]
                    })
                    
                    if(sessionsFind) {
                        await getUserData(data.id)
                    }
                    else return { needToRefresh: true } as any
                }
            }
            catch(e) {
                return { needToRefresh: true } as any
            }
        }

        if(token && token.indexOf('Refresh ') === 0) {
            try {
                const data: UserSigninJWT = jwt.verify(token.replace('Refresh ', ''), process.env.jwt_privatekey)
                if(data
                    && data.id
                    && data.platform) {
                    const subnet = request.ip.substring(0, request.ip.lastIndexOf('.'))
                    const session = await this.userSessionsRepository.findOne({
                        where: [
                            {
                                sessionUser: {
                                    id: data.id
                                },
                                sessionIP: request.ip,
                                sessionAgent: headers['user-agent'],
                                refreshToken: token.replace('Refresh ', ''),
                                sessionPlatform: data.platform
                            },
                            {
                                sessionUser: {
                                    id: data.id
                                },
                                sessionIP: Like(subnet),
                                sessionAgent: headers['user-agent'],
                                refreshToken: token.replace('Refresh ', ''),
                                sessionPlatform: data.platform
                            }
                        ],
                        relations: {
                            sessionUser: userRelations
                        }
                    })
                    if(session) {
                        try {
                            const newTokens = await this.userSigninService.generateJWTTokens(session.sessionUser.id, session.sessionUser.email, '7d', {
                                userAgent: request.headers['user-agent'],
                                userIp: request.ip,
                                platform: data.platform
                            })

                            response.header('jwt-new-tokens-refresh', newTokens.refreshToken)
                            response.header('jwt-new-tokens-access', newTokens.accessToken)

                            await getUserData(null, session.sessionUser)
                        }
                        catch(e) {
                            console.error(e)
                        }
                    }
                }
            }
            catch(e) {}
        }

        return gatewayClient['user'] || request['user'] || {}
    }
}