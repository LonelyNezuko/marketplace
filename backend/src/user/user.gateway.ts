import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import CONFIG_GATEWAY from "common/configs/gateway.config";
import { GatewayGuard } from "common/guards/gatewayGuard";
import { Server, Socket } from 'socket.io'
import { User } from "./user.entity";
import { UserService } from "./user.service";

@WebSocketGateway(CONFIG_GATEWAY.port, {
    cors: {
        origin: CONFIG_GATEWAY.cors
    },
    serveClient: false,
    namespace: 'user'
})
export class UserGateway implements OnGatewayConnection, OnGatewayDisconnect {
    constructor(
        private readonly gatewayGuard: GatewayGuard,
        private readonly userService: UserService
    ) {}
    @WebSocketServer() server: Server

    static clients: Socket[] = []

    async handleConnection(client: Socket, ...args: any[]) {
        await this.gatewayGuard.check(client.handshake.headers.authorization, client)
        if(!client['user'] || !client['user'].id)return

        UserGateway.clients.push(client)
        
        // online status
        this.userService.setOnlineStatus(true, client['user'].id)
    }
    async handleDisconnect(client: Socket) {
        await this.gatewayGuard.check(client.handshake.headers.authorization, client)

        const index = UserGateway.clients.findIndex((item: Socket) => item.id === client.id)
        if(index !== -1) UserGateway.clients.splice(index, 1)

        if(!client['user'] || !client['user'].id)return

        // online status
        this.userService.setOnlineStatus(false, client['user'].id)
    }
}

export class UserGatewayClients {
    constructor(private readonly clients: Array<Socket> = UserGateway.clients) {}

    async emit(user: User, event: string, ...args: any[]): Promise<boolean> {
        const client: Socket = this.clients.find((item: Socket) => item['user'].id === user.id)
        if(!client)return false

        return client.emit(event, ...args)
    }
}