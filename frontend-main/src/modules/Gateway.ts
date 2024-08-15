import Cookies from "universal-cookie"
import io, { ManagerOptions, Socket, SocketOptions } from 'socket.io-client'

import CONFIG_SERVER from '../config.server.json'
import { CustomStorage } from "./CustomStorage"
import { AuthTokens } from "./AuthTokens"

export default class Gateway {
    private static readonly gatewayList: {
        [key: string]: Socket
    } = {}
    
    public static init(namespace: string, options: Partial<ManagerOptions & SocketOptions> = {}) {
        if(!namespace.length || Gateway.gatewayList[namespace])return

        let url = process.env.REACT_APP_GATEWAY_URL
        if(window.location.hostname !== 'localhost'
            && window.location.hostname.indexOf("192.168.0.") === -1) url = CONFIG_SERVER.GATEWAY_URL

        if(!options.extraHeaders) options.extraHeaders = {}
        
        if(!options.extraHeaders.authorization
            && window.jwtTokenExists) options.extraHeaders.authorization = 'Bearer ' + AuthTokens.get().accessToken

        Gateway.gatewayList[namespace] = io(url + '/' + namespace, options)
    }

    public static on(namespace: string, eventname: string, callback: any) {
        if(!namespace.length || !Gateway.gatewayList[namespace])return
        Gateway.gatewayList[namespace].on(eventname, callback)
    }
    public static off(namespace: string, eventname: string, callback: any) {
        if(!namespace.length || !Gateway.gatewayList[namespace])return
        Gateway.gatewayList[namespace].off(eventname, callback)
    }
}