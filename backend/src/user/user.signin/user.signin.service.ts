import { Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { Response, Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

const sendrequest = require('request')

const bcryptjs = require('bcryptjs')
const jwt = require('jsonwebtoken')
const geoip = require('geoip-lite')

import templateResponse from 'common/templates/response.tp'

import isValidPassword from 'common/functions/isValidPassword';
import isValidEmail from 'common/functions/isValidEmail';
import isValidUsername from 'common/functions/isValidUsername';
import isValidJSON from 'common/functions/isValidJSON';
import isValidName from 'common/functions/isValidName';
import isValidPhoneNumber from 'common/functions/isValidPhoneNumber';

import { User, UserGeolocation, userGeolocationDefault } from '../user.entity';
import CONFIG_DEFAULT from 'common/configs/default.config';
import currencyList from 'common/configs/currency.config';
import { ModuleRef } from '@nestjs/core';
import { UserSettingsService } from '../user.settings/user.settings.service';
import { LogsService } from 'src/logs/logs.service';
import { UserSigninJWT } from './user.signin.dto';
import { RolePrivilegesVerify } from 'common/functions/rolePrivilegesVerify';
import { VerifyCodesService } from 'src/__service/verifycodes/verifycodes.service';
import { UserSessions, UserSessionsPlatform } from '../user.sessions/user.sessions.entity';
import { UserSessionsService } from '../user.sessions/user.sessions.service';

@Injectable()
export class UserSigninService implements OnModuleInit {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        private readonly moduleRef: ModuleRef
    ) {}

    private userSettingsService: UserSettingsService
    private logsService: LogsService
    private userSessionsService: UserSessionsService
    private verifyCodesService: VerifyCodesService

    async onModuleInit() {
        this.userSettingsService = await this.moduleRef.get(UserSettingsService, { strict: false })
        this.logsService = await this.moduleRef.get(LogsService, { strict: false })
        this.verifyCodesService = await this.moduleRef.get(VerifyCodesService, { strict: false })
        this.userSessionsService = await this.moduleRef.get(UserSessionsService, { strict: false })
    }

    async signup(
        email: string,
        password: string,
        name: [ string, string ],

        geolocation: UserGeolocation,
        currency: string,

        platform: 'site' | 'mobileapp',

        response: Response,
        request: Request
    ) {
        if(!name || !password || !email || !geolocation || !currency) {
            templateResponse(response, "Fields should not be empty (name, password, email, geolocation, currency)", 400)
            return
        }

        if(platform !== 'mobileapp' && platform !== 'site') {
            return templateResponse(response, "Incorrect data [platform]", 400)
        }

        if(!isValidName(name)) {
            templateResponse(response, "Incorrect data [name]", 400)
            return
        }
        if(!isValidPassword(password)) {
            templateResponse(response, "Incorrect data [password]", 400)
            return
        }
        if(!isValidEmail(email)) {
            templateResponse(response, "Incorrect data [email]", 400)
            return
        }
        if(!geolocation.city
            || !geolocation.cityUniqueID
            || !geolocation.country
            || !geolocation.lat
            || !geolocation.lng) {
            templateResponse(response, "Incorrect data [geolocation]", 400)
            return
        }
        if(!currencyList.find(item => item.code === currency)) {
            templateResponse(response, "Incorrect data [currency]", 400)
            return
        }

        let results = await this.userRepository.findOne({
            where: { email }
        })
        if(results) {
            templateResponse(response, "Account witch this Email already exists", 400)
            return
        }

        const ip = request.ip
        const salt = bcryptjs.genSaltSync(15)
        const hash = bcryptjs.hashSync(password, salt)

        let insertId = await this.userRepository.insert({
            email,
            password: hash,

            name,
            fullname: name[0] + " " + name[1],

            regIP: ip,
            regGeo: geolocation,

            geolocation: geolocation,
            currency: currency
        })
        if(!insertId) {
            templateResponse(response, "Failed to create an account", 500)
            return
        }
        const accountID = parseInt(insertId.raw.insertId)

        const user = await this.userRepository.findOne({
            where: {
                id: accountID
            }
        })
        if(!user) {
            templateResponse(response, "Failed to create an account", 500)
            return
        }

        this.logsService.create('user', `Зарегистрировался. IP: ${ip}. Язык: ${request.headers['lang'] as string || 'en'}. Email: ${email}`, {
            userData: user
        })

        request['user'] = user
        this.userSettingsService.sendEmailVerify(request.headers['lang'] as string || 'en', request)

        const tokens = await this.generateJWTTokens(user.id, user.email, '7d', {
            userAgent: request.headers['user-agent'],
            userIp: request.ip,
            platform
        })
        templateResponse(response, tokens, 200)
    }

    async signin(
        email: string,
        password: string,
        platform: UserSessionsPlatform,
        
        response: Response,
        request: Request,

        verifyCode?: string,
    ) {
        if(!email || !password) {
            templateResponse(response, "Fields should not be empty (email, password)", 400)
            return
        }

        if(platform !== 'mobileapp' && platform !== 'site' && platform !== 'admin' && platform !== 'moderation') {
            return templateResponse(response, "Incorrect data [platform]", 400)
        }

        if(!isValidEmail(email)) {
            templateResponse(response, "Incorrect data [Email]", 400)
            return
        }
        if(!isValidPassword(password)) {
            templateResponse(response, "Incorrect data [password]", 400)
            return
        }

        let results = await this.userRepository.findOne({
            where: {
                email
            },
            select: [ 'id', 'email', 'password', 'securitySettings', 'email', 'emailVerify' ],
            relations: {
                roles: true
            }
        })
        if(!results) {
            templateResponse(response, "Account not found", 404)
            return
        }

        if(platform === 'admin'
            && !RolePrivilegesVerify('/admin/*', { user: results } as any)) {
            return templateResponse(response, "Forbidden", 403)
        }
        if(platform === 'moderation'
            && !RolePrivilegesVerify('/moderation/*', { user: results } as any)) {
            return templateResponse(response, "Forbidden", 403)
        }

        if(!bcryptjs.compareSync(password, results.password)) {
            templateResponse(response, "Invalid account password", 400)
            return
        }

        if(process.env.NODE_ENV !== 'development') {
            if((RolePrivilegesVerify('/admin/*', { user: results } as any)
                || RolePrivilegesVerify('/moderation/*', { user: results } as any)
                || results.securitySettings.signinEmailVerify)
                && results.email && results.emailVerify) {
                if(verifyCode) {
                    if(typeof verifyCode !== 'string' || verifyCode.length !== 6) {
                        return templateResponse(response, "Incorrect data [verifycode]", 400)
                    }

                    const verifyResult: string = await this.verifyCodesService.verify(verifyCode, "signin", results)

                    if(verifyResult === "The code's lifetime has expired") {
                        return templateResponse(response, verifyResult, 404)
                    }
                    if(verifyResult === 'The code is incorrect') {
                        return templateResponse(response, verifyResult, 404)
                    }
                }
                else {
                    async function createcode(verifyCodesService: VerifyCodesService): Promise<boolean | string> {
                        let sendResult: boolean | string = await verifyCodesService.create("signin", results.id, request.headers['lang'] as string || 'en', 6)    
                        if(sendResult === 'The code has already been sent') {
                            await verifyCodesService.delete(results.id, "signin")
                            sendResult = await verifyCodesService.create("signin", results.id, request.headers['lang'] as string || 'en', 6)
                        }

                        return sendResult
                    }

                    let sendResult: boolean | string = await createcode(this.verifyCodesService)
                    if(sendResult !== true) {
                        return templateResponse(response, "The code has already been sent", 500)
                    }

                    return templateResponse(response, "Email verify required", 407)
                }
            }
        }

        const tokens = await this.generateJWTTokens(results.id, results.email, '7d', {
            userAgent: request.headers['user-agent'],
            userIp: request.ip,
            platform
        })
        templateResponse(response, tokens, 200)
    }

    async generateJWTTokens(id: number, email: string, expiresDate: string | number, other: {
        userAgent: string,
        userIp: string,
        platform: UserSessionsPlatform
    }): Promise<{ refreshToken: string, accessToken: string }> {
        if(!id || !email || !expiresDate || !other
            || (other && (!other.userAgent || !other.userIp))) throw new Error("[User.Signin.generateJWTTokens] All arguments were not passed")

        const jwtDataForRefresh: UserSigninJWT = {
            id: id,
            email: email,
            expiresDate: expiresDate,
            platform: other.platform
        }

        const refreshToken = jwt.sign(jwtDataForRefresh, process.env.jwt_privatekey, { algorithm: 'HS256', expiresIn: expiresDate })
        const accessToken = jwt.sign({ id }, process.env.jwt_accessprivatekey, { algorithm: 'HS256', expiresIn: '10m' })

        await this.userSessionsService.create({ id } as any, other.userAgent, other.userIp, refreshToken, other.platform)
        return { refreshToken, accessToken }
    }
}
