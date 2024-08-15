import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User, UserGeolocation } from "src/user/user.entity";
import { And, Between, FindManyOptions, FindOneOptions, FindOperator, FindOptionsOrder, FindOptionsWhere, In, LessThanOrEqual, Like, MoreThanOrEqual, Not, Repository } from "typeorm";
import { Request, Response } from "express";
import templateResponse from "common/templates/response.tp";
import isValidJSON from "common/functions/isValidJSON";
import { Category } from "src/category/category.entity";
import { ModuleRef } from "@nestjs/core";
import { CategoryService } from "src/category/category.service";
import { Product } from "./product.entity";
import { enumProductModerationStatus, enumProductStatus } from "./product.enums";
import { LogsService } from "src/logs/logs.service";

import CONFIG_CODES_COUNTRY from 'common/configs/codes.country.config'
import codesRegion from "common/configs/codes.region.config"
import { ProductUnauthViews } from "./product.unauthviews.entity";
import { CategoryForm } from "src/category/category";
import { ProductFilters, ProductForms } from "./product";
import CONFIG_DEFAULT from "common/configs/default.config";
import { RolePrivilegesVerify } from "common/functions/rolePrivilegesVerify";
import { StorageService } from "src/__service/storage/storage.service";
import CONFIG_STORAGE from "common/configs/storage.config";
import { storageFileURLGetKey } from "common/functions/storageFileURLGetKey";
import CONFIG_SEARCH from "common/configs/search.config";
import getLatLngRadius, { isLatLngRadius } from "common/functions/getLatLngRadius";
import CONFIG_USER from "common/configs/user.config";

@Injectable()
export class ProductService implements OnModuleInit {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,

        @InjectRepository(ProductUnauthViews)
        private readonly productUnauthViewsRepository: Repository<ProductUnauthViews>,

        private readonly moduleRef: ModuleRef
    ) {}

    private categoryService: CategoryService
    private logsService: LogsService
    private storageService: StorageService

    async onModuleInit() {
        this.categoryService = this.moduleRef.get(CategoryService, { strict: false })
        this.logsService = this.moduleRef.get(LogsService, { strict: false })
        this.storageService = this.moduleRef.get(StorageService, { strict: false })
    }

    async create(
        categoryID: number,
        forms: ProductForms,
        images: any, // json array
        name: string,
        description: string,
        price: number,
        priceCurrency: string,
        location: UserGeolocation,
        onlycity: any,

        res: Response,
        req: Request
    ) {
        if(!categoryID || !images || !name || !description
            || !priceCurrency || !location) {
            templateResponse(res, 'Fields should not be empty (categoryID, forms, images, name, description, priceCurrency, location)', 400)
            return
        }

        if(categoryID < 1 || isNaN(categoryID)) {
            templateResponse(res, 'Incorrect data [categoryID]', 400)
            return
        }
        if(!isValidJSON(images)) {
            templateResponse(res, 'Incorrect data [images]', 400)
            return
        }
        if(name.length < 2 || name.length > 50) {
            templateResponse(res, 'Incorrect data [name]', 400)
            return
        }
        if(description.length < 4 || description.length > 2000) {
            templateResponse(res, 'Incorrect data [description]', 400)
            return
        }

        if(!price) price = 0
        if(isNaN(location.lat) || isNaN(location.lng)
            || !location.country
            || !location.state
            || !location.cityUniqueID) {
            templateResponse(res, 'Incorrect data [location]', 400)
            return
        }

        images = JSON.parse(images)
        if(Object.prototype.toString.call(images) !== '[object Array]') {
            templateResponse(res, 'Incorrect data [images]', 400)
            return
        }

        let imagesValid = true
        images.map(item => {
            if(typeof item !== 'string')return imagesValid = false
        })
        if(!imagesValid) {
            templateResponse(res, 'Incorrect data [images]', 400)
            return
        }

        const user: User = req['user']
        if(!user.emailVerify) {
            templateResponse(res, "The user's email has not been verified", 403)
            return
        }

        const category = await this.categoryService.get(categoryID)
        if(!category) {
            templateResponse(res, 'Category with this CategoryID not found', 404)
            return
        }
        if(!category.categoryParent) {
            templateResponse(res, "It is impossible to create in this category because it is first-class", 400)
            return
        }

        if(forms) {
            let formsValid: boolean | string = true
            category.categoryForms.map((form: CategoryForm) => {
                if(forms[form.key]) {
                    if(form.important) {
                        if((form.type === 'input' && form.params.type === 'number')
                            || form.type === 'range' || form.type === 'rangemulti') {
                            if(!forms[form.key] || isNaN(forms[form.key])) formsValid = 'null1'
                        }
                        else if(!forms[form.key] || !forms[form.key].length) formsValid = 'null2'
                    }

                    if(forms[form.key]) {
                        if(form.type === 'input') {
                            if(form.params.type === 'number'
                                && (isNaN(forms[form.key])
                                    || parseInt(forms[form.key]) < form.params.minLength
                                    || parseInt(forms[form.key]) > form.params.maxLength)) formsValid = 'null3'
                        }
                    }
                }
                else if(!forms[form.key] && form.important) formsValid = 'null5'
            })

            if(formsValid !== true) {
                templateResponse(res, 'Incorrect data [forms]', 400)
                return
            }
        }

        const insert = await this.productRepository.insert({
            prodCategory: category,
            prodOwner: user,

            prodForms: forms || {},
            prodImages: images,
            prodDescription: description,
            prodTitle: name,
            prodGeo: location,
            prodLat: location.lat,
            prodLng: location.lng,
            prodCityUniqueID: location.cityUniqueID,
            prodCurrency: priceCurrency,
            prodPrice: price,
            prodOnlyCity: onlycity === '1' ? true : false,
            prodKeyWords: await ProductService.setKeyWords({
                prodTitle: name,
                prodDescription: description,
                prodCurrency: priceCurrency,
                prodForms: forms || {},
                prodCategory: category
            } as any)
        })
        if(!insert) {
            templateResponse(res, 'Failed to create a product', 500)
            return
        }

        templateResponse(res, insert.raw.insertId, 200)
        const product: Product = await this.get(insert.raw.insertId)

        this.logsService.create('user', `Создал новый продукт [#${insert.raw.insertId}]`, {
            userData: req['user'],
            productData: product
        })
    }
    async delete(
        prodID: number,

        res: Response,
        req: Request
    ) {
        if(!prodID) {
            templateResponse(res, 'Fields should not be empty (prodID)', 400)
            return
        }
        if(prodID < 1 || isNaN(prodID)) {
            templateResponse(res, 'Incorrect data [prodID]', 400)
            return
        }

        const user = req['user']
        
        const product = await this.get(prodID)
        if(!product) {
            templateResponse(res, 'Product with this ProdID not found', 404)
            return
        }
        if(product.prodOwner !== user) {
            templateResponse(res, 'You are not the owner of this product', 400)
            return
        }

        product.prodStatus = enumProductStatus.PRODUCT_STATUS_DELETED
        await this.productRepository.save(product)

        templateResponse(res, "", 200)

        this.logsService.create('user', `Переместил продукт [#${product.prodID}] в удаленные`, {
            userData: req['user'],
            productData: product
        })
    }


    async get(
        prodID: number,

        res?: Response,
        req?: Request,

        isNotFullDeleted?: boolean,
        isNotBanned?: boolean
    ): Promise<Product> {
        if(!prodID) {
            templateResponse(res, 'Fields should not be empty (prodID)', 400)
            return
        }
        if(prodID < 1 || isNaN(prodID)) {
            templateResponse(res, 'Incorrect data [prodID]', 400)
            return
        }

        const product = await this.productRepository.findOne({
            where: {
                prodID,
                prodOwner: {
                    _deleted: false,
                    banned: false
                }
            },
            relations: {
                prodCategory: true,
                prodOwner: true,
                prodModerator: true
            }
        })
        if(!product || (!isNotFullDeleted && product.prodStatus === enumProductStatus.PRODUCT_STATUS_DELETED)
            || (!isNotBanned && product.prodStatus === enumProductStatus.PRODUCT_STATUS_BANNED)
            || (isNotBanned && product.prodStatus === enumProductStatus.PRODUCT_STATUS_BANNED && req['user'] && product.prodOwner.id !== req['user'].id)) {
            templateResponse(res, 'Product with this ProdID not found', 404)
            return
        }

        if(res) templateResponse(res, product, 200)
        else return product
    }

    async setViews(
        prodID: any,

        req: Request,
        res: Response
    ) {
        if(!prodID) {
            templateResponse(res, 'Fields should not be empty (prodID)', 404)
            return
        }

        prodID = parseInt(prodID)
        if(isNaN(prodID) || prodID < 1) {
            templateResponse(res, 'Incorrect data [prodID]', 400)
            return
        }

        const product: Product = await this.get(prodID)
        if(!product) {
            templateResponse(res, 'Product with this ProdID not found', 404)
            return
        }

        let user: User
        if(req['user']) {
            user = await this.userRepository.findOne({
                where: {
                    id: req['user'].id
                },
                relations: {
                    viewProducts: true
                },
                select: ['id']
            })
            if(!user) {
                templateResponse(res, 'User not found', 404)
                return
            }
        }

        let addview: boolean = false
        if(user) {
            if(!user.viewProducts.find(item => item.prodID === prodID)) {
                user.viewProducts.push(product)
                this.userRepository.save(user)

                addview = true
                templateResponse(res, '', 200)
            }
            else templateResponse(res, 'Already viewed', 200)
        }
        else {
            const repository: Repository<ProductUnauthViews> = this.productUnauthViewsRepository
            async function find(): Promise<ProductUnauthViews> {
                const temp: any = await repository.findOne({
                    where: {
                        ip: req.ip,
                        agent: req.headers["user-agent"]
                    },
                    relations: {
                        viewProducts: true
                    }
                })

                return temp
            }

            let prodUnauth: ProductUnauthViews = await find()
            if(!prodUnauth) {
                const insert = await this.productUnauthViewsRepository.insert({
                    ip: req.ip,
                    agent: req.headers["user-agent"]
                })
                if(!insert) {
                    templateResponse(res, 'Failed to create ProductUnauthViews', 500)
                    return
                }

                prodUnauth = await find()
            }

            if(!prodUnauth.viewProducts.find(item => item.prodID === prodID)) {
                prodUnauth.viewProducts.push(product)
                this.productUnauthViewsRepository.save(prodUnauth)

                addview = true
                templateResponse(res, '', 200)
            }
            else templateResponse(res, 'Already viewed', 200)
        }

        if(addview) {
            product.prodViews += 1
            this.productRepository.save(product)
        }
    }

    // async getAll(
    //     status: number,

    //     res: Response,
    //     req: Request
    // ) {
    //     const user = req['user']

    //     const products = await this.productRepository.find({
    //         where: {
    //             prodOwner: user,
    //             prodStatus: status
    //         }
    //     })
        
    //     // products.map(product => {
    //     //     let prodForms: any = product.prodForms
    //     //     product.prodForms = prodForms.split(';')

    //     //     prodForms = product.prodForms
    //     //     prodForms.map((item: any, i: number) => {prodForms[i] = item.trim().split(':')})

    //     //     product.prodForms = prodForms
    //     // })

    //     templateResponse(res, products, 200)
    // }

    async getCategoryList(
        res: Response,
        req: Request,

        categoryID: number,

        filters: ProductFilters,
        orderType: null | 'default' | 'newest' | 'pricedown' | 'priceup' | 'ownerratingup' | 'ownerratingdown',

        radius: { latlng: { lat: number, lng: number }, radius: number },
        cityUniqueID: string,

        paginationTake?: number,
        doNotTake?: number[],
        onlycount?: boolean
    ) {
        let findoptions: FindManyOptions<Product> = {}

        if(!paginationTake) paginationTake = 20
        findoptions.take = CONFIG_SEARCH.takeInCategory
        
        findoptions.where = {}
        findoptions.relations = {
            prodCategory: true,
            prodOwner: true
        }
        findoptions.select = [ 'prodID', 'prodCreateAt', 'prodStatus', 'prodImages', 'prodDescription', 'prodTitle',
            'prodGeo', 'prodForms',
            'prodCurrency', 'prodPrice', 'prodAttention', 'prodOnlyCity', 'prodViews',
            'prodLat', 'prodLng', 'prodKeyWords'
        ]
        if(orderType && orderType !== 'default') {
            switch(orderType) {
                case 'newest': {
                    findoptions.order = {
                        prodID: 'desc'
                    }
                    break
                }
                case 'priceup': {
                    findoptions.order = {
                        prodPrice: 'desc'
                    }
                    break
                }
                case 'pricedown': {
                    findoptions.order = {
                        prodPrice: 'asc'
                    }
                    break
                }
                case 'ownerratingup': {
                    findoptions.order = {
                        prodOwner: {
                            rating: 'desc'
                        }
                    }
                    break
                }
                case 'ownerratingdown': {
                    findoptions.order = {
                        prodOwner: {
                            rating: 'asc'
                        }
                    }
                    break
                }
            }
        }

        const category = await this.categoryService.get(categoryID)
        if(!category) {
            templateResponse(res, 'Category with this categoryID not found', 404)
            return
        }

        let categories = []
        categories.push({ categoryID: category.categoryID })

        category.categorySubcategories && category.categorySubcategories.map(item => {
            categories.push({ categoryID: item.categoryID })
            item.categorySubcategories && item.categorySubcategories.map(sub => {
                categories.push({ categoryID: sub.categoryID })
            })
        })

        // добавление радиуса в поиск
        let prodLat: FindOperator<number>
        let prodLng: FindOperator<number>

        let prodCityUniqueID: string

        if(radius) {
            const result = getLatLngRadius([radius.latlng.lat, radius.latlng.lng], radius.radius)
            if(result) {
                prodLat = And(LessThanOrEqual(result.highLat), MoreThanOrEqual(result.lowLat))
                prodLng = And(MoreThanOrEqual(result.lowLng), LessThanOrEqual(result.highLng))
            }
        }

        // добавление поиска по городу
        if(cityUniqueID) {
            if(typeof cityUniqueID !== 'string') {
                return templateResponse(res, "Incorrect data [city]", 400)
            }

            prodCityUniqueID = cityUniqueID
        }

        let prodID: FindOperator<number>
        if(doNotTake) prodID = Not(In(doNotTake))

        // фильтры
        let prodPrice: FindOperator<any>

        let prodKeyWords: FindOperator<string>[]
        let searchTextKeywords: string[]

        if(filters) {
            // по цене
            if(filters.price && filters.price.length) prodPrice = Between(filters.price[0] || 0, filters.price[1] || 999999999999)

            // search text
            if(filters.searchText && filters.searchText.length) {
                const keywords: FindOperator<string>[] = []
                searchTextKeywords = filters.searchText.toLowerCase().stringLettersNumbers().trim().split(' ')

                if(searchTextKeywords.length) {
                    searchTextKeywords.map(word => {
                        keywords.push(Like(`%%${word}%%`))
                    })
                }

                prodKeyWords = [...keywords]
            }

            delete filters.price
            delete filters.searchText

            let count = 0

            for(var key in filters) count ++
            if(count <= 0) filters = null
        }

        findoptions.where = {
            prodCategory: {
                categoryID: category.categoryID
            },
            prodCityUniqueID,
            prodID,
            prodPrice,
            prodLat,
            prodLng,

            prodOwner: {
                _deleted: false,
                banned: false
            }
        }

        const findOptionsWhereWithoutRadius = {...findoptions.where}
        const findOptionsWhereWithRadius = {...findoptions.where}

        delete findOptionsWhereWithoutRadius.prodLat
        delete findOptionsWhereWithoutRadius.prodLng

        if(prodKeyWords) {
            findoptions.where = []
            prodKeyWords.map(item => {
                (findoptions.where as FindOptionsWhere<Product>[]).push({ ...findOptionsWhereWithRadius, prodKeyWords: item });
                (findoptions.where as FindOptionsWhere<Product>[]).push({ ...findOptionsWhereWithoutRadius, prodKeyWords: item })
            })
        }
        else if(prodLat && prodLng) {
            findoptions.where = [
                findOptionsWhereWithRadius,
                findOptionsWhereWithoutRadius
            ]
        }

        let productsCount: number
        let products: any[] = await this.productRepository.find(findoptions)

        if(products.length) {
            // фильтрация по остальным фильтрам
            products.map(prod => {
                let score: number = 0

                for(var key in filters) {
                    const productValue = prod.prodForms[key]
                    const categoryForm = category.categoryForms.find((form: CategoryForm) => form.key === key)

                    if(categoryForm && productValue) {
                        if(categoryForm.type === 'input') {
                            if(categoryForm.params.type === 'number'
                                && filters[key] != '0'
                                && productValue == filters[key]) score ++
                        }
                        else if(categoryForm.type === 'select' && filters[key].length
                            && filters[key].indexOf(productValue) !== -1) score ++
                        else if(categoryForm.type === 'range' && filters[key] != '0'
                            && productValue == filters[key]) score ++
                        else if(categoryForm.type === 'rangemulti') {
                            if(productValue[0] >= filters[key][0]
                                || productValue[1] <= filters[key][1]) score ++
                        }
                    }
                }

                if(cityUniqueID && prodCityUniqueID && prod.prodCityUniqueID === prodCityUniqueID) score ++
                if(searchTextKeywords) {
                    searchTextKeywords.map(word => {
                        if(prod.prodKeyWords.indexOf(word) !== -1) score ++
                    })
                }

                if(radius && isLatLngRadius([ radius.latlng.lat, radius.latlng.lng ], [prod.prodLat, prod.prodLng], radius.radius)) {
                    score ++
                }
                (prod as any)._score = score
            })
            
            products = products.sort((a, b) => (b as any)._score - (a as any)._score)
            products = products.slice(0, paginationTake)
        }

        if(onlycount) productsCount = products.length
        templateResponse(res, productsCount || products || 0, 200)
    }

    async getList(res: Response, req: Request,
        categoryID?: number,
        ownerID?: number,

        filters?: ProductFilters,

        radius?: { latlng: { lat: number, lng: number }, radius: number },
        city?: string,

        status?: number,
        moderationStatus?: number,

        attention?: boolean,

        pagination?: { page: number, limit: number },

        order?: FindOptionsOrder<Product>,
        orderType?: null | 'default' | 'newest' | 'pricedown' | 'priceup' | 'ownerratingup' | 'ownerratingdown',
        
        relations?: any,
        onlycount?: boolean,

        doNotTake?: Array<number>,

        between?: any) {
        let findoptions: FindManyOptions<Product> = {}
        let category: Category
        let user: User

        if(!pagination) pagination = { page: 1, limit: 20 }
        if(pagination && !pagination.page) pagination.page = 1
        if(pagination && !pagination.limit) pagination.limit = 20
        
        findoptions.where = {
            prodOwner: {
                _deleted: false,
                banned: false
            }
        }

        // добавление категории в поиск
        if(categoryID) {
            category = await this.categoryService.get(categoryID)
            if(!category) {
                templateResponse(res, 'Category with this categoryID not found', 404)
                return
            }

            let categories = []
            categories.push({ categoryID: category.categoryID })

            category.categorySubcategories && category.categorySubcategories.map(item => {
                categories.push({ categoryID: item.categoryID })
                item.categorySubcategories && item.categorySubcategories.map(sub => {
                    categories.push({ categoryID: sub.categoryID })
                })
            })

            findoptions.where.prodCategory = categories
        }

        // добавление пользователя в поиск
        if(ownerID) {
            user = await this.userRepository.findOne({
                where: {
                    id: ownerID
                },
                select: [ 'id' ]
            })
            if(!user) {
                templateResponse(res, 'Owner with this ownerID not found', 404)
                return
            }

            findoptions.where.prodOwner = { id: user.id }
        }

        // статус продукта
        findoptions.where.prodStatus = status || enumProductStatus.PRODUCT_STATUS_ACTIVE
        if(moderationStatus) {
            if(!user) {
                templateResponse(res, 'moderationStatus can only be used with ownerID', 400)
                return
            }
            if(moderationStatus < enumProductModerationStatus.PRODUCT_MODERATION_STATUS_VERIFYING
                || moderationStatus > enumProductModerationStatus.PRODUCT_MODERATION_STATUS_PROBLEM) {
                templateResponse(res, 'Incorrect data [moderationStatus]', 400)
                return
            }

            if(!RolePrivilegesVerify('/moderation/*', req)
                && (!user
                    || !req['user']
                    || (user && req['user'] && user.id !== req['user'].id))) {
                templateResponse(res, 'Forbidden', 403)
                return
            }

            if(status === null) delete findoptions.where.prodStatus
            findoptions.where.prodModerationStatus = moderationStatus
        }
        else findoptions.where.prodModerationStatus = enumProductModerationStatus.PRODUCT_MODERATION_STATUS_VERIFIED

        // "важные" продукты
        if(attention) findoptions.where.prodAttention = true

        // пагинация
        findoptions.skip = (pagination.page - 1) * pagination.limit,
        findoptions.take = pagination.limit

        // 
        findoptions.relations = {
            prodCategory: true,
            prodOwner: true,
            ...relations
        }

        // добавление типа сортировки в поиск
        if(orderType && orderType !== 'default') {
            switch(orderType) {
                case 'newest': {
                    findoptions.order = {
                        prodID: 'desc'
                    }
                    break
                }
                case 'priceup': {
                    findoptions.order = {
                        prodPrice: 'desc'
                    }
                    break
                }
                case 'pricedown': {
                    findoptions.order = {
                        prodPrice: 'asc'
                    }
                    break
                }
                // case 'ownerratingup': {
                //     findoptions.order = {
                //         prodOwner: {
                //             rating: 'desc'
                //         }
                //     }
                //     break
                // }
                // case 'ownerratingdown': {
                //     findoptions.order = {
                //         prodOwner: {
                //             rating: 'asc'
                //         }
                //     }
                //     break
                // }
            }
        }

        // остальная сортировка
        if(order) findoptions.order = {...findoptions.order, ...order}

        // 
        findoptions.select = [ 'prodID', 'prodCreateAt', 'prodStatus', 'prodImages', 'prodDescription', 'prodTitle',
            'prodGeo', 'prodForms',
            'prodCurrency', 'prodPrice', 'prodAttention', 'prodOnlyCity', 'prodViews' ]
        
        if(findoptions.where.prodModerationStatus && findoptions.where.prodModerationStatus !== enumProductModerationStatus.PRODUCT_MODERATION_STATUS_VERIFIED) {
            findoptions.select = [...findoptions.select, 'prodModerationStatus', 'prodModerationComment', 'prodModerationDate']

            findoptions.relations = {
                ...findoptions.relations,
                prodModerator: true
            }
        }

        // добавление радиуса в поиск
        if(radius
            && radius.latlng
            && radius.latlng.lat
            && radius.latlng.lng
            && radius.radius) {
            let lat: number
            let lng: number
            let range: number

            lat = parseInt(radius.latlng.lat as unknown as string)
            lng = parseInt(radius.latlng.lng as unknown as string)

            range = radius.radius * 10

            if(lat && lng && range
                && !isNaN(lat) && !isNaN(lng) && !isNaN(range)) {
                const latRange = range / ((6076 / 5280) * 120)
                const lngRange = (((Math.cos((lat * 3.141592653589 / 180)) * 6076.) /  5280.) * 120)

                const lowLat = lat - latRange
                const highLat = lat + latRange
                const lowLng = lng - lngRange
                const highLng = lng + lngRange

                findoptions.where.prodLat = And(LessThanOrEqual(highLat), MoreThanOrEqual(lowLat))
                findoptions.where.prodLng = And(MoreThanOrEqual(lowLng), LessThanOrEqual(highLng))
            }
        }

        // добавление поиска по городу
        if(city) {
            if(typeof city !== 'string') {
                return templateResponse(res, "Incorrect data [city]", 400)
            }

            findoptions.where.prodCityUniqueID = city
        }

        // 
        if(between) findoptions.where[between.where] = Between(between.from, between.to)
        if(doNotTake) findoptions.where.prodID = Not(In(doNotTake))

        // фильтры
        if(filters) {
            // по цене
            if(filters.price && filters.price.length) findoptions.where.prodPrice = Between(filters.price[0] || 0, filters.price[1])

            // search text
            if(filters.searchText && filters.searchText.length) {
                const keywords = []
                const searchTextKeywords = filters.searchText.toLowerCase().stringLettersNumbers().trim().split(' ')

                if(searchTextKeywords.length) {
                    searchTextKeywords.map(word => {
                        keywords.push(Like(`%${word}%`))
                    })
                }

                findoptions.where.prodKeyWords = And(...keywords)
            }

            delete filters.priceCurrency
            delete filters.sellerRating
            delete filters.price
            delete filters.searchText

            let count = 0

            for(var key in filters) count ++
            if(count <= 0) filters = null
        }

        if(findoptions.where.prodLat
            && findoptions.where.prodLng) {
            const findoptionsNewWhere = findoptions.where

            delete findoptionsNewWhere.prodLat
            delete findoptionsNewWhere.prodLng

            findoptions.where = [
                findoptions.where,
                findoptionsNewWhere
            ]
        }

        let productsCount: number
        let products: any[] = await this.productRepository.find(findoptions)


        // для "Стоит внимания" на главной странице
        if(!onlycount && attention && !products.length) {
            findoptions.relations = {...findoptions.relations}

            if((findoptions.where as FindOptionsWhere<Product>[]).length) {
                (findoptions.where as FindOptionsWhere<Product>[]).map(where => {
                    delete where.prodAttention
                })
            }
            else delete (findoptions.where as FindOptionsWhere<Product>).prodAttention

            products = await this.productRepository.find(findoptions)
            if(products.length) {
                products = products.map(item => {
                    item.viewsCount = item.prodViews
                    delete item.prodViews

                    return item
                })
            }
            products = products.sort((a: any, b: any) => {
                return b.viewsCount - a.viewsCount
            })

            if(products.length > findoptions.take) products = products.splice(0, findoptions.take)
        }

        if(products.length && filters && categoryID) {
            products = products.filter((prod: Product) => {
                let state: string

                for(var key in filters) {
                    const productValue = prod.prodForms[key]
                    const categoryForm = category.categoryForms.find((form: CategoryForm) => form.key === key)

                    if(categoryForm && productValue) {
                        if(categoryForm.type === 'input') {
                            if(categoryForm.params.type === 'number'
                                && filters[key] != '0'
                                && productValue != filters[key]) state = '1'
                        }
                        else if(categoryForm.type === 'select' && filters[key].length
                            && filters[key].indexOf(productValue) === -1) state = '2'
                        else if(categoryForm.type === 'range' && filters[key] != '0'
                            && productValue != filters[key]) state = '3'
                        else if(categoryForm.type === 'rangemulti') {
                            if(productValue[0] < filters[key][0]
                                || productValue[1] > filters[key][1]) state = '4'
                        }
                    }
                }

                return !state ? true : false
            })
        }

        if(onlycount) productsCount = products.length
        templateResponse(res, productsCount || products || 0, 200)
    }


    async getSimilarProducts(
        res: Response,
        req: Request,

        productID: number,
        
        paginationTake?: number,
        doNotTake?: number[]
    ) {
        if(!productID || isNaN(productID)) {
            return templateResponse(res, "Fields should do not be empty (productID)", 400)
        }

        if(!paginationTake) paginationTake = 20
        if(!doNotTake) doNotTake = []

        const product = await this.get(productID)
        if(!product) {
            return templateResponse(res, "Product with this 'productID' not found", 404)
        }

        if(doNotTake.indexOf(product.prodID) === -1
            || doNotTake.indexOf(product.prodID.toString() as any) === -1) doNotTake.push(product.prodID)

        const findOptions: FindManyOptions<Product> = {}
        const defaultFindWhereOptions: FindOptionsWhere<Product> = {
            prodStatus: enumProductStatus.PRODUCT_STATUS_ACTIVE,
            prodModerationStatus: enumProductModerationStatus.PRODUCT_MODERATION_STATUS_VERIFIED,
            prodID: Not(In(doNotTake)),
            prodOwner: {
                _deleted: false,
                banned: false
            }
        }

        const keywords = (product.prodKeyWords as string).split(',')
        if(!keywords) {
            return templateResponse(res, "Couldn't find similar products", 404)
        }

        findOptions.where = []
        findOptions.relations = {
            prodOwner: true,
            prodCategory: true
        }

        // заполнение запроса
        keywords.map(word => {
            (findOptions.where as FindOptionsWhere<Product>[]).push({ prodKeyWords: Like(`%${word}%`), ...defaultFindWhereOptions })
        });

        const productCategory = await this.categoryService.get(product.prodCategory.categoryID)
        if(productCategory) {
            (findOptions.where as FindOptionsWhere<Product>[]).push({ prodCategory: { categoryID: productCategory.categoryID }, ...defaultFindWhereOptions })
            if(productCategory.categoryParent && productCategory.categoryParent.categoryParent) {
                (findOptions.where as FindOptionsWhere<Product>[]).push({ prodCategory: { categoryID: productCategory.categoryParent.categoryID }, ...defaultFindWhereOptions })
            }

            if(productCategory.categoryParent.categorySubcategories) {
                productCategory.categoryParent.categorySubcategories.map(category => {
                    if(category.categoryID !== productCategory.categoryID) {
                        (findOptions.where as FindOptionsWhere<Product>[]).push({ prodCategory: { categoryID: category.categoryID }, ...defaultFindWhereOptions })
                    }
                })
            }

            if(productCategory.categorySubcategories) {
                productCategory.categorySubcategories.map(category => {
                    if(category.categoryID !== productCategory.categoryID) {
                        (findOptions.where as FindOptionsWhere<Product>[]).push({ prodCategory: { categoryID: category.categoryID }, ...defaultFindWhereOptions })
                    }
                })
            }
        }

        // запрос
        let similarProducts = await this.productRepository.find(findOptions)
        if(similarProducts) {
            // сортировка

            similarProducts.map(prod => {
                let score = 0;

                if(prod.prodKeyWords) {
                    const prodKeywords = (prod.prodKeyWords as string).split(',')
                    prodKeywords.map(word => {
                        if(keywords.indexOf(word) !== -1) score ++
                    })
                }

                if(prod.prodCategory.categoryID === productCategory.categoryID) score += 3
                else if(productCategory.categoryParent && productCategory.categoryParent.categoryParent
                    && prod.prodCategory.categoryID === productCategory.categoryParent.categoryID) score += 2
                else if(productCategory.categoryParent.categorySubcategories
                    && productCategory.categoryParent.categorySubcategories.find(cat => cat.categoryID !== productCategory.categoryID && prod.prodCategory.categoryID === cat.categoryID)) {
                    score += 1
                }
                else if(productCategory.categorySubcategories
                    && productCategory.categorySubcategories.find(cat => cat.categoryID !== productCategory.categoryID && prod.prodCategory.categoryID === cat.categoryID)) {
                    score += 0.5
                }

                (prod as any)._score = score
            })

            similarProducts = similarProducts.sort((a, b) => (b as any)._score - (a as any)._score)
            similarProducts = similarProducts.slice(0, paginationTake)
        }

        templateResponse(res, similarProducts, 200)
    }

    // async getListViews(
    //     res: Response,
    //     req: Request,

    //     pagination?: any,

    //     relations?: any
    // ) {

    // }

    async setStatus(
        prodID: number,
        status: number,

        res: Response,
        req: Request
    ) {
        if(status === undefined || !prodID) {
            templateResponse(res, 'Fields should not be empty (prodID, status)', 400)
            return
        }
        if(status < 0 || status > 1) {
            templateResponse(res, 'Incorrect data [status]', 400)
            return
        }
        if(prodID < 0 || isNaN(prodID)) {
            templateResponse(res, 'Incorrect data [prodID]', 400)
            return
        }

        const user = req['user']

        const product = await this.get(prodID)
        if(!product) {
            templateResponse(res, 'Product with this ProdID not found', 404)
            return
        }

        if(product.prodOwner !== user) {
            templateResponse(res, 'You are not the owner of this product', 400)
            return
        }
        if(product.prodStatus === enumProductStatus.PRODUCT_STATUS_BANNED) {
            templateResponse(res, 'This product has banned', 400)
            return
        }
        if(product.prodStatus === enumProductStatus.PRODUCT_STATUS_DELETED) {
            templateResponse(res, 'This product has deleted', 400)
            return
        }

        const oldstatus = product.prodStatus

        product.prodStatus = status
        product.prodStatusUpdateAt = new Date()

        await this.productRepository.save(product)
        templateResponse(res, "", 200)

        this.logsService.create('user', `Изменил статус продукта [#${product.prodID}] на ${status} [старый статус: ${oldstatus}]`, {
            userData: req['user'],
            productData: product
        })
    }

    async update(
        prodID: number,
        forms: ProductForms,
        images: string[],
        imagesDelete: string[],
        imagesLoaded: Express.Multer.File[],
        imageBackgroundIndex: number,
        name: string,
        description: string,
        price: number,
        priceCurrency: string,
        location: UserGeolocation,
        onlycity: any,

        res: Response,
        req: Request
    ) {
        if(!prodID || !images || !name || !description
            || !priceCurrency || !location || !imageBackgroundIndex) {
            templateResponse(res, 'Fields should not be empty (prodID, forms, images, name, description, priceCurrency, location, imageBackgroundIndex)', 400)
            return
        }

        if(prodID < 1 || isNaN(prodID)) {
            templateResponse(res, 'Incorrect data [prodID]', 400)
            return
        }

        if(!isValidJSON(forms as any)) {
            return templateResponse(res, "Incorrect data [forms]", 400)
        }
        forms = JSON.parse(forms as any)

        if(!isValidJSON(images as any)) {
            return templateResponse(res, "Incorrect data [images]", 400)
        }
        images = JSON.parse(images as any)

        if(imagesDelete) {
            if(!isValidJSON(imagesDelete as any)) {
                return templateResponse(res, "Incorrect data [imagesDelete]", 400)
            }
            imagesDelete = JSON.parse(imagesDelete as any)

            if(!images.length) {
                templateResponse(res, 'Incorrect data [imagesDelete]', 400)
                return
            }

            let imagesValid = true
            images.map(item => {
                if(typeof item !== 'string')return imagesValid = false
            })
            if(!imagesValid) {
                templateResponse(res, 'Incorrect data [imagesDelete]', 400)
                return
            }
        }

        if(!images.length) {
            templateResponse(res, 'Incorrect data [images]', 400)
            return
        }
        if(name.length < 2 || name.length > 50) {
            templateResponse(res, 'Incorrect data [name]', 400)
            return
        }
        if(description.length < 4 || description.length > 2000) {
            templateResponse(res, 'Incorrect data [description]', 400)
            return
        }

        if(!price) price = 0

        if(!isValidJSON(location as any)) {
            templateResponse(res, 'Incorrect data [location]', 400)
        }
        location = JSON.parse(location as any)

        if(isNaN(location.lat) || isNaN(location.lng)
            || !location.country
            || !location.state
            || !location.cityUniqueID) {
            templateResponse(res, 'Incorrect data [location]', 400)
            return
        }

        let albumKey = null
        if(images.length) {
            let fileKey = storageFileURLGetKey(images[0])

            const response = await this.storageService.getFileData(fileKey)
            if(response) {
                albumKey = response.albumKey
            }
        }

        if(imagesLoaded.length) {
            const storage = await this.storageService.createFile('default', imagesLoaded, 'default', null, null, null, req, { albumKey })
            if(!storage || !storage.length) {
                return templateResponse(res, "Failed to upload files", 500)
            }

            storage.map(item => {
                images.push(item.link)
            })
        }

        let imagesValid = true
        images.map(item => {
            if(typeof item !== 'string')return imagesValid = false
        })
        if(!imagesValid) {
            templateResponse(res, 'Incorrect data [images]', 400)
            return
        }

        imageBackgroundIndex = parseInt(imageBackgroundIndex as any)
        if(imageBackgroundIndex != 0 && images[imageBackgroundIndex]) {
            const link = images[imageBackgroundIndex]
            
            images.splice(imageBackgroundIndex, 1)
            images.unshift(link)
        }

        const user = req['user']
        
        const product = await this.get(prodID)
        if(!product) {
            templateResponse(res, 'Product with this ProdID not found', 404)
            return
        }

        if(product.prodOwner.id !== user.id) {
            templateResponse(res, 'You are not the owner of this product', 400)
            return
        }
        if(product.prodStatus === enumProductStatus.PRODUCT_STATUS_BANNED
            || product.prodStatus === enumProductStatus.PRODUCT_STATUS_DELETED
            || product.prodStatus === enumProductStatus.PRODUCT_STATUS_CLOSED) {
            templateResponse(res, 'You cannot edit this product', 403)
            return
        }

        if(imagesDelete) {
            imagesDelete.map(item => {
                if(product.prodImages.indexOf(item) !== -1) {
                    let fileKey = storageFileURLGetKey(item)
                    this.storageService.deleteFile(fileKey, null, null, null, true)
                }
            })
        }
        
        if(forms) {
            let formsValid: boolean | string = true
            product.prodCategory.categoryForms.map((form: CategoryForm) => {
                if(forms[form.key]) {
                    if(form.important) {
                        if((form.type === 'input' && form.params.type === 'number')
                            || form.type === 'range' || form.type === 'rangemulti') {
                            if(!forms[form.key] || isNaN(forms[form.key])) formsValid = 'null1'
                        }
                        else if(!forms[form.key] || !forms[form.key].length) formsValid = 'null2'
                    }

                    if(forms[form.key]) {
                        if(form.type === 'input') {
                            if(form.params.type === 'number'
                                && (isNaN(forms[form.key])
                                    || parseInt(forms[form.key]) < form.params.minLength
                                    || parseInt(forms[form.key]) > form.params.maxLength)) formsValid = 'null3'
                        }
                    }
                }
                else if(!forms[form.key] && form.important) formsValid = 'null5'
            })

            if(formsValid !== true) {
                templateResponse(res, 'Incorrect data [forms]', 400)
                return
            }
        }

        product.prodForms = forms
        product.prodImages = images
        product.prodTitle = name
        product.prodDescription = description
        product.prodPrice = price
        product.prodCurrency = priceCurrency
        product.prodGeo = location
        product.prodOnlyCity = onlycity
        product.prodKeyWords = await ProductService.setKeyWords(product)

        await this.productRepository.save({ ...product })

        templateResponse(res, "", 200)
        this.logsService.create('user', `Изменил продукт [#${product.prodID}]`, {
            userData: req['user'],
            productData: product
        })
    }


    async counter(
        res: Response,
        req: Request,

        search?: any
    ) {
        let count: number = 0
        
        if(!search) {
            count = await this.productRepository.count()
        }
        else {
            const where: any = {}

            if(search.ownerID) {
                search.ownerID = parseInt(search.ownerID)
                if(!isNaN(search.ownerID)) {
                    where.prodOwner = search.ownerID
                }
            }
            else if(search.categoryID) {
                search.categoryID = parseInt(search.categoryID)
                if(!isNaN(search.categoryID)) {
                    where.prodCategory = search.categoryID
                }
            }
            else if(search.moderationStatus) {
                search.moderationStatus = parseInt(search.moderationStatus)
                if(!isNaN(search.moderationStatus)) {
                    where.prodModerationStatus = search.moderationStatus
                }
            }
            else if(search.geoCountry) where.prodGeoCountry = search.geoCountry
            else if(search.geoRegion) where.prodGeoRegion = search.geoRegion
            else if(search.geoCity) where.prodGeoCity = search.geoCity

            if(JSON.stringify(where) !== '{}')
            {
                count = await this.productRepository.count({
                    where: where
                })
            }
        }

        templateResponse(res, count, 200)
    }

    static async setKeyWords(product: Product, notSave?: boolean): Promise<string> {
        if(!product
            || !product.prodTitle
            || !product.prodDescription
            || !product.prodCurrency
            || !product.prodForms
            || !product.prodCategory) throw new Error("[Product.Service.setKeyWords] 'product' has not been transferred")

        let keywords: string[] = []

        keywords = [...keywords, ...product.prodTitle.toLowerCase().stringLettersNumbers().replaceAll('\n', ' ').replaceAll('\r', ' ').split(' ')]
        keywords = [...keywords, ...product.prodDescription.toLowerCase().stringLettersNumbers().replaceAll('\n', ' ').replaceAll('\r', ' ').split(' ')]

        if(product.prodCategory.categoryForms.length) {
            product.prodCategory.categoryForms.map(form => {
                if(product.prodForms[form.key] !== undefined) {
                    if((form.type === 'input' && form.params.type !== 'number')
                        || form.type === 'select') {
                        let array = [ ...form.name.toLowerCase().stringLettersNumbers().replaceAll('\n', ' ').replaceAll('\r', ' ').split(' ') ]
                        for(const tr in form.nameTranslate) array = [ ...array, ...form.nameTranslate[tr].toLowerCase().stringLettersNumbers().replaceAll('\n', ' ').replaceAll('\r', ' ').split(' ') ]

                        let value = product.prodForms[form.key]
                        if(form.type === 'select'
                            && form.params.list[value]) {
                            for(const tr in form.params.list[value].translate) array = [ ...array, ...form.params.list[value].translate[tr].toLowerCase().stringLettersNumbers().replaceAll('\n', ' ').replaceAll('\r', ' ').split(' ') ]
                            value = form.params.list[value].title
                        }

                        array = [ ...array, ...value.toLowerCase().stringLettersNumbers().replaceAll('\n', ' ').replaceAll('\r', ' ').split(' ') ]
                        keywords = [ ...keywords, ...array ]
                    }
                }
            })
        }

        keywords = keywords.filter(word => word.length)
        return keywords.join(", ")
    }
}