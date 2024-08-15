import { Injectable } from "@nestjs/common";
import { OnModuleInit } from "@nestjs/common/interfaces";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/user/user.entity";
import { ObjectLiteral, Repository } from "typeorm";
import { Category } from "./category.entity";
import templateResponse from "common/templates/response.tp";
import { Request, Response } from "express";
import isValidJSON from "common/functions/isValidJSON";
import { ModuleRef } from "@nestjs/core";
import { LogsService } from "src/logs/logs.service";

@Injectable()
export class CategoryService implements OnModuleInit {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        @InjectRepository(Category)
        private readonly categoryRepository: Repository<Category>,

        private readonly moduleRef: ModuleRef
    ) {}

    private logsService: LogsService
    async onModuleInit() {
        this.logsService = this.moduleRef.get(LogsService, { strict: false })
    }

    async get(nameorid: any,
        res?: Response,
        req?: Request,
    
        allCategories?: Category[]
    ) {
        if(!nameorid) {
            if(res) templateResponse(res, 'Fields should not be empty (nameorid)', 400)
            return
        }
        if(isNaN(nameorid) && (nameorid.length < 4 || nameorid.length > 32)) {
            if(res) templateResponse(res, 'The length of the name must not be less than 4 and exceed more than 32 characters', 400)
            return
        }

        const categories: Category[] = allCategories || await this.getAll()
        let category: Category

        categories.map(item => {
            if(item.categoryID === parseInt(nameorid)
                || (typeof nameorid === 'string' && item.categoryName.toLowerCase() === nameorid.toLowerCase())) category = item
            else if(item.categorySubcategories.length) {
                item.categorySubcategories.map(sub => {
                    if(sub.categoryID === parseInt(nameorid)
                        || (typeof nameorid === 'string' && sub.categoryName.toLowerCase() === nameorid.toLowerCase())) category = sub
                    else if(sub.categorySubcategories.length) {
                        sub.categorySubcategories.map(subs => {
                            if(subs.categoryID === parseInt(nameorid)
                                || (typeof nameorid === 'string' && subs.categoryName.toLowerCase() === nameorid.toLowerCase())) category = subs
                        })
                    }
                })
            }
        })
        if(!category) {
            if(res) templateResponse(res, 'Category with this Name not found', 404)
            return
        }

        if(res) templateResponse(res, category, 200)
        else return category
    }
    async getAll(res?: Response) {
        let categories: any[] = await this.categoryRepository
            .createQueryBuilder("category")
            .leftJoinAndSelect('category.categoryParent', 'categoryParent')
            .leftJoinAndSelect('category.categoryCreator', 'categoryCreator')
            .leftJoinAndSelect('category.categoryUpdator', 'categoryUpdator')
            .loadRelationCountAndMap('category.productsCount', 'category.categoryProducts')
            .where("category._deleted = 0")
            .getMany()

        let all: Category[] = [...categories]

        // сортировка уровней категорий
        categories.map((category, index) => {
            categories[index].categorySubcategories = categories.filter((item: any) => {
                if(item.categoryParent && item.categoryParent.categoryID === category.categoryID) {
                    item.____O____ = 1
                    return true
                }
                return false
            })
        })

        // удаление лишнего (не всего)
        categories = categories.filter((item: any) => !item.____O____)

        // инит 3го уровня категории
        categories.map((item: Category, d: number) => {
            item.categorySubcategories.map((item: Category, i: number) => {
                item.categorySubcategories.map((sub: Category, b: number) => {
                    categories[d].categorySubcategories[i].categorySubcategories[b].categorySubcategories = null

                    let parent: any = all.find((cat: Category) => {
                        let find: Category
                        if(cat.categorySubcategories) {
                            find = cat.categorySubcategories.find((l: Category) => l.categoryID === sub.categoryParent.categoryID)
                        }

                        return find
                    })
                    if(parent) parent = JSON.stringify(parent)

                    categories[d]
                        .categorySubcategories[i]
                        .categorySubcategories[b]
                        .categoryParent
                        .categoryParent = parent
                })
            })
        })

        // подсчет количества объявлений
        categories.map((category: Category, index) => {
            category.categorySubcategories.map((sub: any, subindex: number) => {
                sub.categorySubcategories.map((subs: any) => {
                    categories[index].categorySubcategories[subindex].productsCount += subs.productsCount
                })
                categories[index].productsCount += categories[index].categorySubcategories[subindex].productsCount
            })
        })

        if(res) templateResponse(res, categories, 200)
        else return categories
    }
    async getPopular(
        res: Response,

        withoutPopularParent?: boolean
    ) {
        let categories: any[] = await this.categoryRepository
            .createQueryBuilder("category")
            .leftJoinAndSelect('category.categoryParent', 'categoryParent')
            .loadRelationCountAndMap('category.productsCount', 'category.categoryProducts')
            .where("category._deleted = 0")
            .select(['category.categoryID', 'category.categoryName', 'category.categoryNameTranslate', 'category.categoryLink'])
            .getMany()
        
        if(categories) {
            if(withoutPopularParent) {
                const categoriesWithoutParent: any[] = await this.getPopularWithoutParent()
                if(categoriesWithoutParent.length) {
                    categories = categories.filter((category, i) => {
                        if(categoriesWithoutParent.findIndex(item => category.categoryID === item.categoryID) !== -1)return false
                        return true
                    })
                }
            }

            categories = categories.sort((a: any, b: any) => {
                return b.productsCount - a.productsCount
            })

            categories = categories.filter(item => item.productsCount > 0)
            categories = categories.splice(0, 19)
        }

        return templateResponse(res, categories, 200)
    }
    async getPopularWithoutParent(
        res?: Response,

        limit?: number
    ): Promise<any[]> {
        if(!limit) limit = 20

        let categories: any[] = await this.categoryRepository
            .createQueryBuilder("category")
            .loadRelationCountAndMap('category.productsCount', 'category.categoryProducts')
            .leftJoinAndSelect('category.categoryParent', 'categories')
            .where("category._deleted = 0")
            .getMany()

        if(categories) {
            categories = categories.filter(category => category.categoryParent == null)
            categories = categories.sort((a: any, b: any) => {
                return b.productsCount - a.productsCount
            })

            categories = categories.filter(item => item.productsCount > 0)
            categories = categories.splice(0, limit)
        }
        
        templateResponse(res, categories, 200)
        return categories
    }
}