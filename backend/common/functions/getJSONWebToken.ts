import { Request } from "express"

const jwt = require('jsonwebtoken')
export default function getJSONWebToken(request: Request) {
    return jwt.verify(request.headers['jwt'], process.env.jwt_privatekey)
}