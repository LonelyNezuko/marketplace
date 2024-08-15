import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Language } from "./language.entity";
import { Not, Repository } from "typeorm";
import { ModuleRef } from "@nestjs/core";
import { LogsService } from "src/logs/logs.service";
import { Request, Response } from "express";
import templateResponse from "common/templates/response.tp";
import isValidJSON from "common/functions/isValidJSON";
import { RolePrivilegesVerify } from "common/functions/rolePrivilegesVerify";

@Injectable()
export class LanguageService implements OnModuleInit {
    constructor(
        @InjectRepository(Language)
        private readonly languageRepository: Repository<Language>,

        private readonly moduleRef: ModuleRef
    ) {}

    private logsService: LogsService
    async onModuleInit() {
        this.logsService = this.moduleRef.get(LogsService, { strict: false })
    }


    // get
    async getLanguage(
        id: any,
        admin?: boolean,

        res?: Response,
        req?: Request,
    ): Promise<Language> {
        if(typeof id === 'string') id = parseInt(id)

        if(!id || isNaN(id) || id < 1) {
            templateResponse(res, 'Fields should not be empty (id)', 400)
            return
        }
        if(admin && admin === true
            && !RolePrivilegesVerify('/service/language/?admin', req)) {
            templateResponse(res, 'Forbidden', 403)
            return
        }

        const language: Language = await this.languageRepository.findOne({
            where: {
                id,
                _deleted: false
            },
            relations: {
                added: true
            }
        })
        if(!language
            || (!language.active
                && !admin)) {
            templateResponse(res, 'Language with this id not found', 400)
            return
        }

        language.params = JSON.parse(language.params)

        if(res) templateResponse(res, language, 200)
        else return language
    }

    async getExampleLanguage(
        res: Response,
        req: Request
    ): Promise<Language> {
        const language: Language = await this.languageRepository.findOne({
            where: {
                _example: true
            },
            relations: {
                added: true
            }
        })
        if(!language) {
            templateResponse(res, 'Language not found', 400)
            return
        }

        language.params = JSON.parse(language.params)

        templateResponse(res, language, 200)
    }

    async getAllLanguage(
        res: Response,
        req: Request,

        admin?: any
    ) {
        admin = parseInt(admin)
        if(admin && admin == true
            && !RolePrivilegesVerify('/service/language/?admin', req)) {
            templateResponse(res, 'Forbidden', 403)
            return
        }

        const languages: Language[] = await this.languageRepository.find({
            where: {
                _deleted: false
            },
            relations: {
                added: true
            }
        })

        languages.map((item, i) => {
            if(!item.active
                && !admin) languages.splice(i, 1)
            
            item.params = JSON.parse(item.params)
        })

        templateResponse(res, languages, 200)
    }

    async getSelector(languageCode: string, selector: string): Promise<string> {
        if(!languageCode || languageCode.length !== 2) throw new Error("[Service.Language.getSelector] The 'languageCode' is not specified correctly")
        if(!selector) throw new Error("[Service.Language.getSelector] 'selector' is not specified")

        const language: Language = await this.languageRepository.findOne({
            where: {
                code: languageCode,
                _deleted: false
            },
            select: [ 'params' ]
        })

        language.params = JSON.parse(language.params)
        if(!language || !language.params[selector])return

        return language.params[selector]
    }


    // put
    async updateLanguage(
        id: number,

        name: string,
        code: string,
        active: any,
        main: any,
        params: any, // json

        res: Response,
        req: Request
    ) {
        if(!id || isNaN(id) || id < 1
            || !name || !code
            || active === undefined || main === undefined
            || !params) {
            return templateResponse(res, 'Fields should not be empty (id, name, code, active, main, params)', 400)
        }

        if(!isValidJSON(params)) {
            return templateResponse(res, 'Incorrect data [params]', 400)
        }
        if(name.length < 4 || name.length > 16) {
            return templateResponse(res, 'Incorrect data [name]', 400)
        }
        if(code.length != 2) {
            return templateResponse(res, 'Incorrect data [code]', 400)
        }

        main = parseInt(main)
        active = parseInt(active)

        if(isNaN(main) || main < 0 || main > 1) {
            return templateResponse(res, 'Incorrect data [main]', 400)
        }
        if(isNaN(active) || active < 0 || active > 1) {
            return templateResponse(res, 'Incorrect data [active]', 400)
        }

        if(!main) {
            const [_, mainLanguages] = await this.languageRepository.findAndCount({
                where: {
                    main: true,
                    id: Not(id),
                    _deleted: false
                }
            })
            if(!mainLanguages) {
                return templateResponse(res, 'You cannot install main', 400)
            }
        }

        if(!active) {
            const [_, activeLanguages] = await this.languageRepository.findAndCount({
                where: {
                    active: true,
                    id: Not(id),
                    _deleted: false
                }
            })
            if(!activeLanguages) {
                return templateResponse(res, 'You cannot install active', 400)
            }

            if(main) {
                return templateResponse(res, 'You cannot remove active from the main language', 400)
            }
        }

        const language: Language = await this.getLanguage(id, true, null, req)
        if(!language) {
            return templateResponse(res, 'Language with this id not found', 400)
        }

        language.name = name
        language.code = code
        language.active = active
        language.main = main
        language.params = params

        if(main) await this.languageRepository.update({ main: true }, { main: false })
        await this.languageRepository.save(language)

        this.logsService.create('user', `Изменил language #${id} ${name}.`, {
            userData: req['user'],
            languageData: language
        })

        templateResponse(res, '', 200)
    }


    // post
    async newLanguage(
        name: string,
        code: string,
        active: any,
        params: any, // json

        res: Response,
        req: Request
    ) {
        if(!name || !code
            || active === undefined
            || !params) {
            return templateResponse(res, 'Fields should not be empty (name, code, active, params)', 400)
        }

        if(!isValidJSON(params)) {
            return templateResponse(res, 'Incorrect data [params]', 400)
        }

        if(name.length < 4 || name.length > 16) {
            return templateResponse(res, 'Incorrect data [name]', 400)
        }
        if(code.length != 2) {
            return templateResponse(res, 'Incorrect data [code]', 400)
        }

        active = parseInt(active)
        if(isNaN(active) || active < 0 || active > 1) {
            return templateResponse(res, 'Incorrect data [active]', 400)
        }

        let language: Language = await this.languageRepository.findOne({
            where: [
                { name },
                { code }
            ]
        })
        if(language && !language._deleted) {
            return templateResponse(res, 'A language with such a name or code already exists', 501)
        }

        const insert = await this.languageRepository.insert({
            name,
            code,
            params,
            active: !active ? false : true,
            added: req['user']
        })
        if(!insert) {
            return templateResponse(res, 'Failed to create', 500)
        }

        language = await this.getLanguage(insert.raw.insertId, true, null, req)
        if(!language) {
            return templateResponse(res, 'The created language could not be found', 500)
        }

        this.logsService.create('user', `Добавил новый language #${language.id} ${name}.`, {
            userData: req['user'],
            languageData: language
        })

        templateResponse(res, language, 200)
    }


    // delete
    async deleteLanguage(
        id: number,

        res: Response,
        req: Request
    ) {
        if(!id || isNaN(id) || id < 1) {
            templateResponse(res, 'Fields should not be empty (id)', 400)
            return
        }

        const language: Language = await this.getLanguage(id, true, null, req)
        if(!language) {
            return templateResponse(res, 'Language with this id not found', 400)
        }

        if(language._example) {
            templateResponse(res, 'This language cannot be deleted', 400)
            return
        }

        language._deleted = true
        language.params = JSON.stringify(language.params)
        // добавить удаление через определенное время
        
        await this.languageRepository.save(language)

        this.logsService.create('user', `Удалил language #${language.id} ${language.name}.`, {
            userData: req['user'],
            languageData: language
        })

        await this.languageRepository.save(language)
        templateResponse(res, '', 200)
    }


    // 
    format(text: string, ...attrs: any[]) {
        if(!text) throw new Error("[Service.Language.format] 'text' is not specified")
        if(attrs.length) {
            let replaceSymbolAttrsCount = 0
    
            text = text.replaceAll('%n', (symbol, i) => {
                symbol = attrs[replaceSymbolAttrsCount]
                replaceSymbolAttrsCount ++
    
                return symbol
            })
        }

        return text
    }
}