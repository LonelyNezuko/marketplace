import Cookies from "universal-cookie"
import io, { ManagerOptions, Socket, SocketOptions } from 'socket.io-client'

import CONFIG_SERVER from '../config.server.json'
import { AuthTokens } from "./AuthTokens"

const gateways: {
    [key: string]: Socket
} = {}

export default class Gateway {
    init(namespace: string, options: Partial<ManagerOptions & SocketOptions> = {}) {
        if(!namespace.length || gateways[namespace])return

        const cookies = new Cookies()
        let url = process.env.REACT_APP_GATEWAY_URL

        if(window.location.hostname !== 'localhost'
            && window.location.hostname.indexOf("192.168.0.") === -1) url = CONFIG_SERVER.GATEWAY_URL

        options.extraHeaders = {
            'authorization': AuthTokens.get().accessToken
        }
        gateways[namespace] = io(url + '/' + namespace, options)
    }

    on(namespace: string, eventname: string, callback: any) {
        if(!namespace.length || !gateways[namespace])return console.log('notfound')
        gateways[namespace].on(eventname, callback)
    }
    off(namespace: string, eventname: string, callback: any) {
        if(!namespace.length || !gateways[namespace])return console.log('notfound')
        gateways[namespace].off(eventname, callback)
    }
}