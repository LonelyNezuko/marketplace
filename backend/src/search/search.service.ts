import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { SearchHistory } from "./search.entity";
import { And, ArrayContainedBy, ArrayContains, ArrayOverlap, FindOptionsWhere, Like, Not, Raw, Repository } from "typeorm";
import { Request, Response } from "express";
import templateResponse from "common/templates/response.tp";
import { Product } from "src/product/product.entity";
import { Category } from "src/category/category.entity";
import CONFIG_SEARCH from "common/configs/search.config";
import { User } from "src/user/user.entity";

@Injectable()
export class SearchService {
    constructor(
        @InjectRepository(SearchHistory)
        private readonly searchHistoryRepository: Repository<SearchHistory>,

        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>
    ) {}

    
    // get
    async getPossibleValues(
        value: string,

        res: Response,
        req: Request
    ) {
        if(!value || !value.length) {
            return templateResponse(res, "Fields should do not be empty (value)", 400)
        }

        value = value.toLowerCase().stringLettersNumbers().trim()
        const values = await this.searchHistoryRepository.find({
            where: {
                value: And(Like(`%${value}%`), Not(value))
            },
            order: {
                popularity: 'desc'
            },
            
            take: 8
        })

        const resultValues: string[] = []
        values.map(value => resultValues.push(value.value))

        templateResponse(res, resultValues, 200)
    }

    async searchPossibleCategory(
        value: string,

        res: Response,
        req: Request
    ) {
        if(!value || !value.length) {
            return templateResponse(res, "Fields should do not be empty (value)", 400)
        }
        const _value = value

        const valueKeywords: string[] = value.toLowerCase().stringLettersNumbers().trim().split(' ')
        if(!valueKeywords.length) {
            return templateResponse(res, "Incorrect data [value]", 400)
        }

        const findWhere: FindOptionsWhere<Product>[] = []
        valueKeywords.map(word => {
            if(word.length && word.length >= 2) {
                findWhere.push({ prodKeyWords: Like(`%${word}%`) })
            }
        })

        const products = await this.productRepository.find({
            where: findWhere,
            select: [ "prodID", "prodCategory" ],
            relations: {
                prodCategory: {
                    categoryParent: true
                }
            },
            take: CONFIG_SEARCH.takePossibleCategoryProducts
        })
        if(!products.length) {
            return templateResponse(res, "Not found", 404)
        }

        const _catMostIDS: { id: number, count: number }[] = []
        products.map(product => {
            if(!product.prodCategory.categoryParent)return
            const index = _catMostIDS.findIndex(item => item.id === product.prodCategory.categoryID)

            if(index === -1) _catMostIDS.push({ id: product.prodCategory.categoryID, count: 1 })
            else _catMostIDS[index].count ++
        })

        let possibleCategory: Category = null
        if(_catMostIDS.length) {
            possibleCategory = products.find(prod => prod.prodCategory.categoryID === _catMostIDS.sort((a,b) => a.count - b.count)[0].id).prodCategory
        }

        if(!possibleCategory) {
            return templateResponse(res, "Not found", 404)
        }

        (async () => {
            value = value.toLowerCase().stringLettersNumbers().trim()
            if(value.split(' ').length < 2)return

            const history = await this.searchHistoryRepository.findOne({
                where: {
                    value
                }
            })

            if(history) {
                this.searchHistoryRepository.update({ id: history.id }, {
                    popularity: () => "popularity + 1"
                })
            }
            else {
                this.searchHistoryRepository.insert({
                    value
                })
            }
        })()

        if(req['user']) {
            console.log(req['user'])
            if(req['user'].searchHistory.indexOf(_value) === -1) {
                req['user'].searchHistory.push(_value)
                this.userRepository.update({ id: req['user'].id }, { searchHistory: req['user'].searchHistory })
            }
        }

        templateResponse(res, possibleCategory, 200)
    }
}