import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/user/user.entity";
import { Repository } from "typeorm";
import { Socket } from 'socket.io'
import { UserSigninJWT } from "src/user/user.signin/user.signin.dto";

const bcryptjs = require('bcryptjs')
const jwt = require('jsonwebtoken')

@Injectable()
export class GatewayGuard {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

    async check(token: string, client: Socket): Promise<boolean> {
        const userRepository = this.userRepository
        async function getUserData(id?: number, user?: User) {
            if(!user) user = await userRepository.findOne({
                where: {
                    id: id,
                    _deleted: false
                },
                relations: {
                    roles: true,
                    readNotifications: true,
                    deleteSystemNotifications: true
                }
            })

            if(user) client['user'] = user
        }

        if(token && token.indexOf('Bearer ') === 0) {
            try {
                const data: UserSigninJWT = jwt.verify(token.replace('Bearer ', ''), process.env.jwt_accessprivatekey)
                if(data
                    && data.id) await getUserData(data.id)
            }
            catch(e) {
                return { needToRefresh: true } as any
            }
        }

        return client['user']
    }
}