import { Response } from "express";

export default function templateResponse(response: Response, message: any, statusCode: number): boolean {
    if(!response)return false
    
    const sendData: any = {
        message,
        statusCode
    }

    if(response.getHeader('jwt-new-tokens-refresh')
        && response.getHeader('jwt-new-tokens-access')) sendData.jwtNewTokens = {
        refreshToken: response.getHeader('jwt-new-tokens-refresh'),
        accessToken: response.getHeader('jwt-new-tokens-access')
    }

    response.send(sendData)
    return false
}