import { Injectable, UnauthorizedException } from "@nestjs/common"
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Response, Request } from "express";
import { User } from "src/user/user.entity";
import templateResponse from "common/templates/response.tp";

@Injectable()
export class AdminService {
    constructor(
        @InjectRepository(User) private readonly userRepository: Repository<User>
    ) {}

    // async setRole(
    //     userid: number,
    //     status: string, // set / remove,
    //     role: string,

    //     req: Request,
    //     res: Response
    // ) {
    //     if(!userid || !status || !role) {
    //         templateResponse(res, 'Fields should not be empty', 400)
    //         return
    //     }

    //     if(status !== 'set' && status !== 'remove') {
    //         templateResponse(res, 'Incorret data [status]', 400)
    //         return
    //     }
    //     if(isNaN(userid)) {
    //         templateResponse(res, 'Incorret data [userid]', 400)
    //         return
    //     }
    //     if(role !== 'admin' && role !== 'moderator') {
    //         templateResponse(res, 'Incorret data [role]', 400)
    //         return
    //     }

    //     const results = await this.userRepository.findOne({
    //         where: {
    //             id: userid
    //         },
    //         select: ['roles']
    //     })
    //     if(!results) {
    //         templateResponse(res, 'User with this Userid not found', 400)
    //         return
    //     }

    //     const roles = results['roles']

    //     // if(roles.indexOf(role) !== -1) roles.splice(roles.indexOf(role), 1)
    //     // else if(status === 'remove') {
    //     //     templateResponse(res, 'This user does not have such a role', 400)
    //     //     return
    //     // }

    //     // if(status === 'set') roles.push(role)

    //     // await this.userRepository.update({ id: userid }, { roles })
    //     templateResponse(res, 'Completed', 200)
    // }
}