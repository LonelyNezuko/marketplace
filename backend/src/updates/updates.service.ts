import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Updates } from "./updates.entity";
import { FindOptionsSelect, LessThanOrEqual, Repository } from "typeorm";
import { ModuleRef } from "@nestjs/core";
import { LogsService } from "src/logs/logs.service";
import { Request, Response } from "express";
import { RolePrivilegesVerify } from "common/functions/rolePrivilegesVerify";
import templateResponse from "common/templates/response.tp";

@Injectable()
export class UpdatesService implements OnModuleInit {
    constructor(
        @InjectRepository(Updates)
        private readonly updatesRepository: Repository<Updates>,

        private readonly moduleRef: ModuleRef
    ) {}

    private logsService: LogsService
    async onModuleInit() {
        this.logsService = this.moduleRef.get(LogsService, { strict: false })
    }

    
    private readonly selectUpdates: FindOptionsSelect<Updates> = {
        id: true,
        name: true,
        version: true,
        background: true,
        body: true,
        publishDate: true
    }

    
    // get
    async getList(res: Response, req: Request) {
        let select = { ...this.selectUpdates }

        const isAdmin = req['user'] && RolePrivilegesVerify('/updates/get', req)
        if(isAdmin) {
            select.createAt = true
            select.views = true
            select.where = true
            select.updateAt = true
        }

        const updates: Updates[] = await this.updatesRepository.find({
            where: {
                publishDate: !isAdmin ? LessThanOrEqual(new Date()) : null
            },
            select,
            relations: {
                creator: isAdmin,
                updator: isAdmin
            }
        })
        
        templateResponse(res, updates, 200)
    }

    async getID(
        id: number,

        res?: Response,
        req?: Request,

        _isAdmin?: boolean
    ): Promise<Updates | null> {
        if(!id || isNaN(id) || id < 1) {
            templateResponse(res, "Fields should not be empty [id]", 400)
            return
        }
        let select = { ...this.selectUpdates }

        const isAdmin = _isAdmin || req['user'] && RolePrivilegesVerify('/updates/get', req)
        if(isAdmin) {
            select.createAt = true
            select.views = true
            select.where = true
            select.updateAt = true
        }

        const updates: Updates = await this.updatesRepository.findOne({
            where: {
                id,
                publishDate: !isAdmin ? LessThanOrEqual(new Date()) : null
            },
            select,
            relations: {
                creator: isAdmin,
                updator: isAdmin
            }
        })
        if(!updates) {
            templateResponse(res, 'Updates with this ID not found', 404)
            return
        }
        
        templateResponse(res, updates, 200)
        return updates
    }

    async getLast(
        where: string,
        res: Response, req: Request
    ) {
        if(!where || (where !== 'main' && where !== 'admin' && where !== 'moderation')) {
            return templateResponse(res, "Fields should not be empty [where]", 400)
        }
        let select = { ...this.selectUpdates }

        const isAdmin = req['user'] && RolePrivilegesVerify('/updates/get', req)
        if(isAdmin) {
            select.createAt = true
            select.views = true
            select.where = true
            select.updateAt = true
        }

        if(where === 'admin'
            && (!req['user'] || !RolePrivilegesVerify('/admin/*', req))) {
            return templateResponse(res, "Forbidden", 403)
        }
        if(where === 'moderation'
            && (!req['user'] || !RolePrivilegesVerify('/moderation/*', req))) {
            return templateResponse(res, "Forbidden", 403)
        }

        const updates: Updates = await this.updatesRepository.findOne({
            where: {
                where,
                publishDate: LessThanOrEqual(new Date())
            },
            select,
            relations: {
                creator: isAdmin,
                updator: isAdmin
            },
            order: {
                id: "DESC"
            }
        })
        if(!updates)return templateResponse(res, "Last update with this where not found", 404)
        
        templateResponse(res, updates, 200)
    }


    // post
    async create(
        where: string,

        name: string,
        version: string,

        publishDate: Date,

        background: string,
        body: string,

        res: Response,
        req: Request
    ) {
        if(!where || (where !== 'main' && where !== 'admin' && where !== 'moderation')
            || !name || name.length < 4 || name.length > 24
            || !version || version.length < 2 || version.length > 10
            || !publishDate || !new Date(publishDate) || +new Date(publishDate) < (+new Date() - 864000) || +new Date(publishDate) > (+new Date() + 86400000 * 30)
            || !background || !body) {
            return templateResponse(res, "Fields should not be empty [where, name, version, publishDate, background, body]", 400)
        }

        const insert = await this.updatesRepository.insert({
            where,
            name,
            version,
            publishDate: new Date(publishDate),
            background,
            body,
            creator: req['user']
        })
        if(!insert) {
            return templateResponse(res, "Failed to create an updates", 500)
        }

        templateResponse(res, insert.raw.insertId, 200)
    }


    // put
    async update(
        id: number,

        name: string,
        version: string,

        background: string,
        body: string,

        res: Response,
        req: Request,

        publishDate?: Date,
    ) {
        if(!id || isNaN(id) || id < 1
            || !name || name.length < 4 || name.length > 24
            || !version || version.length < 2 || version.length > 10
            || !background || !body) {
            return templateResponse(res, "Fields should not be empty [id, name, version, background, body]", 400)
        }
        if(publishDate) {
            if(!new Date(publishDate) || +new Date(publishDate) < (+new Date() - 864000) || +new Date(publishDate) > (+new Date() + 86400000 * 30)) {
                return templateResponse(res, "Incorrect data [publishDate]", 400)
            }
        }

        const updates: Updates = await this.getID(id, null, null, true)

        if(!updates)return templateResponse(res, "Updates with this ID not found", 400)
        if(publishDate && updates.publishDate <= new Date())return templateResponse(res, "You can no longer change the publication date", 400)

        updates.name = name
        updates.version = version
        if(publishDate) updates.publishDate = new Date(publishDate)
        updates.background = background
        updates.body = body
        
        updates.updateAt = new Date()
        updates.updator = req['user']

        await this.updatesRepository.save(updates)
        templateResponse(res, "", 200)
    }
}