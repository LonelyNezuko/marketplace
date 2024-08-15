import { Injectable, OnModuleInit } from "@nestjs/common";
import { ModuleRef } from '@nestjs/core'
import { InjectRepository } from "@nestjs/typeorm";
import templateResponse from "common/templates/response.tp";
import { Request, Response } from "express";
import { User } from "src/user/user.entity";
import { Repository } from "typeorm";
import { Role } from "./role.entity";
import { LogsService } from "src/logs/logs.service";
import isValidJSON from "common/functions/isValidJSON";
import { RoleGetHighIndex } from "common/functions/roleGetHighIndex";

@Injectable()
export class RoleService implements OnModuleInit {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>,

        private readonly moduleRef: ModuleRef
    ) {}

    private logsService: LogsService
    async onModuleInit() {
        this.logsService = this.moduleRef.get(LogsService, { strict: false })
    }


    // get
    async get(key: string, res?: Response): Promise<any> {
        if(!key) {
            if(res) templateResponse(res, 'Fields should not be empty', 400)
            return
        }

        const role = await this.roleRepository.findOne({
            where: {
                key
            },
            relations: {
                createUser: true,
                usersList: true
            }
        })
        if(!role) {
            if(res) templateResponse(res, "Role with this Key not found", 404)
            return
        }

        if(res) templateResponse(res, role, 200)
        else {
            return role
        }
    }

    async getList(
        res?: Response,
        req?: Request,

        moreIndex?: number
    ) {
        const roles: Role[] = await this.roleRepository
            .createQueryBuilder("role")
            .leftJoinAndSelect("role.createUser", "createUser")
            .loadRelationCountAndMap("role.usersCount", "role.usersList")
            .addOrderBy("role.index", "ASC")
            .where("role.index > :moreIndex", { moreIndex: moreIndex || 0 })
            .getMany()

        templateResponse(res, roles, 200)
        return roles
    }

    // post
    async create(
        key: string,
        privileges: string[],
        name: string,
        nameTranslate: any, // json object,
        color: any, // json simple array

        req: Request, res: Response) {
        if(!key || !privileges || !privileges.length
            || !name || name.length < 4 || name.length > 24
            || !nameTranslate || !isValidJSON(nameTranslate)
            || !color || color.length !== 2) {
            templateResponse(res, 'Fields should not be empty', 400)
            return
        }
        nameTranslate = JSON.parse(nameTranslate)

        if(key.toLowerCase() !== key) {
            return templateResponse(res, "The key must be in lowercase", 400)
        }

        if(key.length < 4 || key.length > 24)return templateResponse(res, "The allowed length of the role key is 4-24 characters", 400)
        if(key === 'sample')return templateResponse(res, "Change the role key", 400)
        if(!/^[a-z]*$/.test(key))return templateResponse(res, "The role key can only be in lowercase and consist only of Latin letters", 400)
        if(key === 'developer')return templateResponse(res, "You can't put such a role key", 400)

        if(privileges.indexOf('all') !== -1) {
            return templateResponse(res, "Such a privilege is impossible", 400)
        }

        let role: Role = await this.get(key)
        if(role) {
            templateResponse(res, 'Role with this Key already exists', 400)
            return
        }

        const allRoles: Role[] = await this.getList()

        let index = 0
        if(allRoles.length) index = allRoles[allRoles.length - 1].index + 1

        const insertId = await this.roleRepository.insert({
            key,
            privileges,
            createUser: req['user'],
            name,
            nameTranslate,
            color,
            index
        })
        if(!insertId) {
            templateResponse(res, "Failed to create role", 500)
            return
        }

        templateResponse(res, insertId.raw.insertId, 200)

        role = await this.get(key)
        this.logsService.create('user', `Создал роль '${key}' #${insertId.raw.insertId}. Привилегии: ${privileges}`, {
            userData: req['user'],
            roleData: role
        })
    }

    // delete
    async delete(key: string, req: Request, res: Response) {
        if(!key) {
            templateResponse(res, 'Fields should not be empty', 400)
            return
        }
        if(key === 'developer' || key === 'owner') {
            templateResponse(res, "You can't delete this role", 403)
            return
        }

        const role = await this.roleRepository.findOne({
            where: {
                key
            }
        })
        if(!role) {
            templateResponse(res, 'Role with this Key not found', 400)
            return
        }

        const index = role.index

        await this.roleRepository.remove(role)
        await this.roleRepository
            .createQueryBuilder()
            .update(Role)
            .set({
                index: () => "index - 1"
            })
            .where("index > :index", { index })
            .execute()

        templateResponse(res, "", 200)

        this.logsService.create('user', `Удалил роль '${key}'`, {
            userData: req['user']
        })
    }

    // put
    async update(key: string,
        privileges: string[],
        name: string,
        nameTranslate: any, // json object,
        color: any, // json simple array

        req: Request, res: Response) {
        if(!key || !privileges || !privileges.length
            || !name || name.length < 4 || name.length > 24
            || !nameTranslate || !isValidJSON(nameTranslate)
            || !color || color.length !== 2) {
            templateResponse(res, 'Fields should not be empty', 400)
            return
        }
        nameTranslate = JSON.parse(nameTranslate)

        if(privileges.indexOf('all') !== -1) {
            return templateResponse(res, "Such a privilege is impossible", 400)
        }

        const role = await this.roleRepository.findOne({
            where: {
                key
            }
        })
        if(!role) {
            templateResponse(res, 'Role with this Key not found', 400)
            return
        }

        role.color = color
        role.name = name
        role.nameTranslate = nameTranslate
        role.privileges = privileges
        role.updateAt = new Date()

        await this.roleRepository.save(role)
        templateResponse(res, "", 200)

        this.logsService.create('user', `Изменил роль '${key}'.`, {
            userData: req['user'],
            roleData: role
        })
    }
    async updateIndex(key: string, index: number, req: Request, res: Response) {
        if(!key || key.length < 4 || key.length > 24
            || index <= 0)return templateResponse(res, 'Fields should not be empty', 400)
        
        const role: Role = await this.get(key)
        const roles: Role[] = await this.getList()
        if(!role)return templateResponse(res, 'Role with this Key not found', 404)

        if(role.index === index)return templateResponse(res, "This role already has such an index", 400)
        if(index <= RoleGetHighIndex(req['user'].roles).index
            || index > roles[roles.length - 1].index)return templateResponse(res, 'You cant put such an index', 400)
        
        const oldindex = role.index

        roles.map((item, i) => {
            if(item.key === role.key) roles[i].index = index
        })

        roles.map((item, i) => {
            if(item.index > oldindex && item.index <= index && item.key !== role.key) roles[i].index -= 1
            if(item.index >= index && item.index < oldindex && item.key !== role.key) roles[i].index += 1
        })

        await this.roleRepository.save(roles)
        templateResponse(res, "", 200)
    }

    // user
    async userSet(userid: number, key: string, req: Request, res: Response) {
        if(!userid || !key) {
            templateResponse(res, 'Fields should not be empty', 400)
            return
        }
        if(key === 'developer' || key === 'owner') {
            templateResponse(res, "You can't give out this role", 403)
            return
        }

        const currentUser: User = req['user']

        const role = await this.get(key)
        if(!role) {
            templateResponse(res, "Role with this Key not found", 404)
            return
        }

        if(role.index < RoleGetHighIndex(currentUser.roles)) {
            templateResponse(res, "You cannot add this role to a user", 403)
            return
        }

        const user = await this.userRepository.findOne({
            where: {
                id: userid
            },
            relations: {
                roles: true
            }
        })
        if(!user) {
            templateResponse(res, "User with this Userid not found", 404)
            return
        }

        let index = -1
        user.roles.find((item, i) => {
            if(item.key === role.key)return index = i
        })

        if(index !== -1) {
            templateResponse(res, "This user already has such a role", 400)
            return
        }
        
        user.roles.push(role)
        this.userRepository.save(user)

        role.usersList.push(user)
        this.roleRepository.save(role)

        templateResponse(res, "", 200)
        this.logsService.create('user', `Добавил роль '${key}' пользователю '${user.email}'`, {
            userData: req['user'],
            targetUser: user,
            roleData: role
        })
    }
    async userRemove(userid: number, key: string, req: Request, res: Response) {
        if(!userid || !key) {
            templateResponse(res, 'Fields should not be empty', 400)
            return
        }
        if(key === 'developer' || key === 'owner') {
            templateResponse(res, "You cannot remove this role", 403)
            return
        }

        const currentUser: User = req['user']

        const role = await this.get(key)
        if(!role) {
            templateResponse(res, "Role with this Key not found", 404)
            return
        }

        if(role.index < RoleGetHighIndex(currentUser.roles)) {
            templateResponse(res, "You cannot delete this role from a user", 403)
            return
        }

        const user = await this.userRepository.findOne({
            where: {
                id: userid
            },
            relations: {
                roles: true
            }
        })
        if(!user) {
            templateResponse(res, "User with this Userid not found", 404)
            return
        }

        let index = -1
        user.roles.find((item, i) => {
            if(item.key === role.key)return index = i
        })

        if(index === -1) {
            templateResponse(res, "This user does not have a role with such a key", 400)
            return
        }
        
        user.roles.splice(index, 1)
        this.userRepository.save(user)

        index = -1
        role.usersList.find((item, i) => {
            if(item.id === user.id)return index = i
        })

        if(index !== -1) {
            role.usersList.splice(index, 1)
            this.roleRepository.save(role)
        }

        templateResponse(res, "", 200)
        this.logsService.create('user', `Удалил роль '${key}' у пользователя '${user.email}'`, {
            userData: req['user'],
            targetUser: user,
            roleData: role
        })
    }

}