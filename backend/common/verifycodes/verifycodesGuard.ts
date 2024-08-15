import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import isValidJSON from 'common/functions/isValidJSON';
import templateResponse from 'common/templates/response.tp';
import { Request, Response } from 'express';
import VerifycodesDTO from './verifycodes.dto';

const jwt = require('jsonwebtoken')

@Injectable()
export class VerifycodesGuard implements CanActivate {
    constructor(
        private readonly privilege: string
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request: Request = context.switchToHttp().getRequest()
        const response: Response = context.switchToHttp().getResponse()

        const userData = request['user']
        if(!userData) {
            templateResponse(response, 'You are not logged in', 401)
            throw new UnauthorizedException()
        }

        const codesJSON: any = request.headers['verify-codes']
        if(!codesJSON || !isValidJSON(codesJSON))return templateResponse(response, "The verify codes was not passed in the header", 1800)

        let codes: string[] = JSON.parse(codesJSON)
        if(!codes)return templateResponse(response, "Invalid verify codes", 1800)

        let returnStatus: boolean = false
        codes.map((code, i) => {
            try {
                const data: VerifycodesDTO = jwt.verify(code, process.env.jwt_verifycodesprivatekey)

                if(!data) codes = codes.splice(i, 1)
                else {
                    if(data.privilege === this.privilege) {
                        if(data.expiredDate > +new Date
                            && data.count < data.maxCount) {
                            returnStatus = true
                            data.count ++

                            if(data.count >= data.maxCount) codes = codes.splice(i, 1)
                            else codes[i] = jwt.sign(data, process.env.jwt_verifycodesprivatekey, { algorithm: 'HS256' })
                        }
                        else codes = codes.splice(i, 1)
                    }
                }
            }
            catch(e) {
                codes = codes.splice(i, 1)
            }
        })

        response.setHeader('verify-codes', JSON.stringify(codes))

        if(!returnStatus)return templateResponse(response, "The necessary pass code was not found", 1800)
        return returnStatus
    }
}