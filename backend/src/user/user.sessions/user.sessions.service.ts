import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "../user.entity";
import { Not, Repository } from "typeorm";
import { UserSessions, UserSessionsPlatform } from "./user.sessions.entity";
import { Request, Response } from "express";
import templateResponse from "common/templates/response.tp";

const geoip = require('geoip-lite')

import CONFIG_CODES_COUNTRY from 'common/configs/codes.country.config'
import codesRegion from "common/configs/codes.region.config";
import { GetGeolocationForIP } from "common/functions/GetGeolocationForIP";

@Injectable()
export class UserSessionsService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        @InjectRepository(UserSessions)
        private readonly userSessionsRepository: Repository<UserSessions>
    ) {}

    async getAll(
        res: Response,
        req: Request,

        platform: UserSessionsPlatform
    ) {
        if(platform !== 'admin' && platform !== 'mobileapp' && platform !== 'moderation' && platform !== 'site') {
            return templateResponse(res, "Incorrect data [platform]", 400)
        }
        
        const user = req['user']

        const agent: string = req.headers['user-agent']
        const ip: string = req.ip

        const sessions: UserSessions[] = await this.userSessionsRepository.find({
            where: {
                sessionUser: {
                    id: user.id
                }
            },
            select: [ 'sessionID', 'sessionAgent', 'sessionCreateAt', 'sessionGeo', 'sessionIP', 'sessionUser', 'sessionGeo', 'sessionPlatform' ]
        })
        
        if(sessions.length) {
            sessions.map((item, i) => {
                if(item.sessionAgent === agent
                    && item.sessionIP === ip
                    && item.sessionPlatform === platform) {
                    sessions[i].isCurrent = true
                }
            })
        }
        templateResponse(res, sessions, 200)
    }

    async create(user: User, agent: string, ip: string, refreshToken: string, platform: UserSessionsPlatform) {
        if(!user || !agent || !ip || !refreshToken) throw new Error("[User.Signin.createSession] Fields should do not be empty (user, agent, ip, refreshToken)")
        
        const geolocation = await GetGeolocationForIP(ip)
        await this.userSessionsRepository.delete({
            sessionUser: {
                id: user.id
            },
            sessionAgent: agent,
            sessionIP: ip,
            sessionPlatform: platform
        })
        await this.userSessionsRepository.insert({
            sessionUser: {
                id: user.id
            },
            sessionAgent: agent,
            sessionIP: ip,
            sessionGeo: geolocation,
            refreshToken,
            sessionPlatform: platform
        })
    }

    async delete(
        sessionID: number,

        res: Response,
        req: Request) {
        if(!sessionID) {
            templateResponse(res, 'Fields should not be empty (sessionID)', 400)
            return
        }
        if(isNaN(sessionID)) {
            templateResponse(res, 'Incorrect data [sessionID]', 400)
            return
        }

        const result = await this.userSessionsRepository.findOne({
            where: {
                sessionUser: {
                    id: req['user'].id
                },
                sessionID
            }
        })
        if(!result) {
            return templateResponse(res, "Session not found", 404)
        }

        await this.userSessionsRepository.delete({ sessionID: sessionID })
        templateResponse(res, "", 200)
    }
    async clear(
        res: Response,
        req: Request) {
        await this.userSessionsRepository.delete({
            sessionUser: {
                id: req['user'].id
            },
            sessionIP: Not(req.ip),
            sessionAgent: Not(req.headers['user-agent'])
        })
        templateResponse(res, "", 200)
    }
}