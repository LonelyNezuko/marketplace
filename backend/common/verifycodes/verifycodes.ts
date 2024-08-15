import VerifycodesDTO from "./verifycodes.dto"

const jwt = require('jsonwebtoken')

export class Verifycodes {
    constructor() {}

    generate(privilege: string, expiredDate: any, count: number): string {
        if(!privilege || !expiredDate || !count)return null

        if(typeof expiredDate === 'string') expiredDate = parseInt(expiredDate)
        if(count < 0 || isNaN(expiredDate) || expiredDate < +new Date)return null
        
        const jwtdata: VerifycodesDTO = {
            privilege,
            expiredDate,
            count: 0,
            maxCount: count
        }
        return jwt.sign(jwtdata, process.env.jwt_verifycodesprivatekey, { algorithm: 'HS256', expiresIn: expiredDate })
    }
    // verify(hash: string, privilege: string): boolean {
    //     if(!hash)return false

    //     const data: any = jwt.verify(hash, process.env.jwt_verifycodesprivatekey)
    //     if(!data
    //         || !data.privilege
    //         || !data.expiredDate
    //         || data.count === undefined
    //         || !data.maxCount)return false

    //     if(data.expiredDate < +new Date)return false
    //     if(data.count >= data.maxCount)return false

    //     if(data.privilege === privilege)return true
    //     return false
    // }
    verifyCode(code: string): boolean {
        return
    }
}