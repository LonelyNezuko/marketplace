import { OnModuleInit } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { InjectRepository } from "@nestjs/typeorm";
import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import CONFIG_GATEWAY from "common/configs/gateway.config";
import { RolePrivilegesVerify } from "common/functions/rolePrivilegesVerify";
import { GatewayGuard } from "common/guards/gatewayGuard";
import { Server, Socket } from 'socket.io'
import { User } from "src/user/user.entity";
import { UserService } from "src/user/user.service";
import { ModerationReportEntity } from "./moderation.report/moderation.report.entity";
import { Repository } from "typeorm";
import { ModerationSupportEntity } from "./moderation.support/moderation.support.entity";

@WebSocketGateway(CONFIG_GATEWAY.port, {
    cors: {
        origin: CONFIG_GATEWAY.cors
    },
    serveClient: false,
    namespace: 'moderation'
})
export class ModerationGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
    constructor(
        private readonly gatewayGuard: GatewayGuard,
        private readonly moduleRef: ModuleRef
    ) {}
    @WebSocketServer() server: Server

    static clients: Socket[] = []
    private userService: UserService

    async onModuleInit() {
        this.userService = await this.moduleRef.get(UserService, { strict: false })
    }

    async handleConnection(client: Socket, ...args: any[]) {
        await this.gatewayGuard.check(client.handshake.headers.authorization, client)
        if(!client['user'] || !client['user'].id || !RolePrivilegesVerify('/moderation/*', { user: client['user'] } as any))return

        ModerationGateway.clients.push(client)
        
        // online status
        this.userService.setOnlineStatus(true, client['user'].id, 'moderation')
    }
    async handleDisconnect(client: Socket) {
        await this.gatewayGuard.check(client.handshake.headers.authorization, client)

        const index = ModerationGateway.clients.findIndex((item: Socket) => item.id === client.id)
        if(index !== -1) ModerationGateway.clients.splice(index, 1)

        if(!client['user'] || !client['user'].id || !RolePrivilegesVerify('/moderation/*', { user: client['user'] } as any))return

        // online status
        this.userService.setOnlineStatus(false, client['user'].id, 'moderation')
    }
}

export class ModerationGatewayClients {
    constructor(private readonly clients: Array<Socket> = ModerationGateway.clients) {}

    async emit(user: User, event: string, ...args: any[]): Promise<boolean> {
        const client: Socket = this.clients.find((item: Socket) => item['user'].id === user.id)
        if(!client)return false

        return client.emit(event, ...args)
    }
}


@WebSocketGateway(CONFIG_GATEWAY.port, {
    cors: {
        origin: CONFIG_GATEWAY.cors
    },
    serveClient: false,
    namespace: 'moderation-selectReport'
})
export class ModerationSelectReportGateway implements OnGatewayConnection, OnGatewayDisconnect {
    constructor(
        private readonly gatewayGuard: GatewayGuard,

        @InjectRepository(ModerationReportEntity)
        private readonly moderationReportRepository: Repository<ModerationReportEntity>
    ) {}
    @WebSocketServer() server: Server

    async handleConnection(client: Socket, ...args: any[]) {
        console.log('connect')
    }
    async handleDisconnect(client: Socket) {
        console.log('predisconnect')

        await this.gatewayGuard.check(client.handshake.headers.authorization, client)
        if(!client['user'] || !client['user'].id || !RolePrivilegesVerify('/moderation/*', { user: client['user'] } as any))return

        this.moderationReportRepository.update({
            moderator: {
                id: client['user'].id
            }
        }, {
            moderator: null,
            moderatorSelectAt: null
        })
        console.log('disconnect')
    }
}


@WebSocketGateway(CONFIG_GATEWAY.port, {
    cors: {
        origin: CONFIG_GATEWAY.cors
    },
    serveClient: false,
    namespace: 'moderation-selectSupport'
})
export class ModerationSelectSupportGateway implements OnGatewayConnection, OnGatewayDisconnect {
    constructor(
        private readonly gatewayGuard: GatewayGuard,

        @InjectRepository(ModerationSupportEntity)
        private readonly moderationSupportRepository: Repository<ModerationSupportEntity>
    ) {}
    @WebSocketServer() server: Server

    async handleConnection(client: Socket, ...args: any[]) {
        
    }
    async handleDisconnect(client: Socket) {
        await this.gatewayGuard.check(client.handshake.headers.authorization, client)
        if(!client['user'] || !client['user'].id || !RolePrivilegesVerify('/moderation/*', { user: client['user'] } as any))return

        this.moderationSupportRepository.update({
            moderator: {
                id: client['user'].id
            }
        }, {
            moderator: null,
            moderatorSelectAt: null
        })
    }
}