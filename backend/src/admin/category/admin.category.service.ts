import { Injectable, OnModuleInit } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { InjectRepository } from "@nestjs/typeorm";
import CONFIG_STORAGE from "common/configs/storage.config";
import isValidJSON from "common/functions/isValidJSON";
import { storageFileURLGetKey } from "common/functions/storageFileURLGetKey";
import templateResponse from "common/templates/response.tp";
import { Request, Response } from "express";
import { StorageService } from "src/__service/storage/storage.service";
import { CategoryForm } from "src/category/category";
import { Category } from "src/category/category.entity";
import { CategoryService } from "src/category/category.service";
import { LogsService } from "src/logs/logs.service";
import { Not, Repository } from "typeorm";

@Injectable()
export class AdminCategoryService implements OnModuleInit {
    constructor(
        @InjectRepository(Category)
        private readonly categoryRepository: Repository<Category>,

        private readonly moduleRef: ModuleRef
    ) {}

    private categoryService: CategoryService
    private logsService: LogsService
    private storageService: StorageService

    onModuleInit() {
        this.categoryService = this.moduleRef.get(CategoryService, { strict: false })
        this.logsService = this.moduleRef.get(LogsService, { strict: false })
        this.storageService = this.moduleRef.get(StorageService, { strict: false })
    }

    // добавить валидность формы с productService
    async create(
        name: string,
        nameTranslate: any, // json
        icon: string, // link
        background: string, // link
        parentID: number,
        forms: string,

        res: Response,
        req: Request,
        
        link?: string)
    {
        if(!name || !forms || !nameTranslate || !icon || !background) {
            return templateResponse(res, 'Fields should not be empty (name, forms, nameTralsate, icon, background)', 400)
        }

        if(name.length < 4 || name.length > 32) {
            return templateResponse(res, 'The length of the name must not be less than 4 and exceed more than 32 characters', 400)
        }
        if(!isValidJSON(nameTranslate)) {
            return templateResponse(res, 'Incorrect data [forms]', 400)
        }
        if(!isValidJSON(forms)) {
            return templateResponse(res, 'Incorrect data [forms]', 400)
        }

        nameTranslate = JSON.parse(nameTranslate)
        forms = JSON.parse(forms)

        let parent: Category = null
        if(parentID) {
            parent = await this.categoryService.get(parentID)
            if(!parent) {
                templateResponse(res, 'Category with this ParentID not found', 404)
                return
            }
            if(!parent.categorySubcategories) {
                templateResponse(res, 'The category is the 3rd level', 400)
                return
            }
        }

        const findname = await this.categoryService.get(name)
        if(findname) {
            templateResponse(res, 'Category with this Name already exist', 404)
            return
        }

        const result = await this.categoryRepository.insert({
            categoryName: name,
            categoryNameTranslate: nameTranslate,
            categoryIcon: icon,
            categoryBackground: background,
            categoryParent: parent,
            categoryForms: (forms as any as CategoryForm[]),
            categoryCreator: req['user'],
            categoryLink: link
        })
        if(!result) {
            templateResponse(res, 'Failed to create a category', 500)
            return
        }
2
        const category = await this.categoryService.get(result.raw.insertId)
        let issave: boolean = false

        if(!link || !link.length) {
            category.categoryLink = 'c' + category.categoryID.toString()
            issave = true
        }

        if(issave) {
            await this.categoryRepository.save(category)
        }

        templateResponse(res, result.raw.insertId, 200)
        this.logsService.create('user', `Создал категорию '${name}' [#${result.raw.insertId}]`, {
            userData: req['user'],
            categoryData: category
        })
    }
    async delete(id: number,
        res: Response,
        req: Request) {
        if(!id) {
            templateResponse(res, 'Fields should not be empty (name)', 400)
            return
        }

        const findname = await this.categoryService.get(id)
        if(!findname) {
            templateResponse(res, 'Category with this Name not found', 404)
            return
        }

        await this.categoryRepository.update({ categoryID: findname.categoryID }, { _deleted: true })
        templateResponse(res, "", 200)

        this.logsService.create('user', `Удалил категорию '${findname.categoryName}' [#${findname.categoryID}]`, {
            userData: req['user']
        })
    }
    async update(
        id: number,
        name: string,
        nameTranslate: any, // json
        icon: string, // link
        background: string, // link
        parentID: number,
        forms: string,
        link: string,

        res: Response,
        req: Request)
    {
        if(!id || !name || !forms || !nameTranslate || !icon || !background) {
            return templateResponse(res, 'Fields should not be empty (name, forms, nameTralsate, icon, background)', 400)
        }
        
        if(isNaN(id) || id < 1) {
            return templateResponse(res, 'Incorrect data [id]', 400)
        }
        if(name.length < 4 || name.length > 32) {
            return templateResponse(res, 'The length of the name must not be less than 4 and exceed more than 32 characters', 400)
        }
        if(!isValidJSON(nameTranslate)) {
            return templateResponse(res, 'Incorrect data [forms]', 400)
        }
        if(!isValidJSON(forms)) {
            return templateResponse(res, 'Incorrect data [forms]', 400)
        }

        nameTranslate = JSON.parse(nameTranslate)
        forms = JSON.parse(forms)

        let parent: Category = null
        if(parentID && !isNaN(parentID)) {
            if(parentID == id) {
                templateResponse(res, 'parentID cannot be equal to ID', 400)
                return
            }

            parent = await this.categoryRepository.findOne({
                where: {
                    categoryID: parentID
                }
            })
            if(!parent) {
                templateResponse(res, 'Category with this ParentID not found', 404)
                return
            }
        }

        const category = await this.categoryService.get(id)
        if(!category) {
            return templateResponse(res, "Category with this id not found", 404)
        }

        const findname = await this.categoryRepository.findOne({
            where: {
                categoryName: name,
                categoryID: Not(id)
            }
        })
        if(findname) {
            templateResponse(res, 'Category with this Name already exist', 404)
            return
        }

        if(category.categoryIcon !== icon
            && category.categoryIcon !== '/assets/category/default.png') {
            let fileKey = storageFileURLGetKey(category.categoryIcon)
            if(fileKey) this.storageService.deleteFile(fileKey, null, null, null, true)
        }

        if(category.categoryBackground !== background
            && category.categoryBackground !== '/assets/category/default_background.jpg') {
            let fileKey = storageFileURLGetKey(category.categoryBackground)
            if(fileKey) this.storageService.deleteFile(fileKey, null, null, null, true)
        }

        await this.categoryRepository.update({ categoryID: category.categoryID }, {
            categoryNameTranslate: nameTranslate,
            categoryIcon: icon,
            categoryParent: parent,
            categoryLink: (!link || !link.length) ? 'c' + category.categoryID : link,
            categoryBackground: background,
            categoryForms: (forms as any as CategoryForm[]),
            categoryUpdateAt: new Date(),
            categoryUpdator: req['user']
        })
        templateResponse(res, "", 200)

        this.logsService.create('user', `Обновил категорию '${name}' [#${category.categoryID}]`, {
            userData: req['user'],
            categoryData: category
        })
    }
}