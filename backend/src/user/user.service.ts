import { Injectable, OnModuleInit, UnauthorizedException } from "@nestjs/common"
import { InjectRepository } from '@nestjs/typeorm';
import { And, Between, FindManyOptions, FindOptions, FindOptionsRelations, FindOptionsSelect, FindOptionsSelectByString, FindOptionsWhere, In, Like, Not, Repository } from 'typeorm';

import https from 'https'
import { OnlineStatusWhere, User, UserGeolocation } from "./user.entity"

import { Response, Request } from "express";
import { ModuleRef } from "@nestjs/core";
import { LogsService } from "src/logs/logs.service";
import random from "common/functions/random";
import CONFIG_USER from "common/configs/user.config";
import templateResponse from "common/templates/response.tp";
import { Verifycodes } from "common/verifycodes/verifycodes";
import { Role } from "src/role/role.entity";
import { Product } from "src/product/product.entity";
import { enumProductModerationStatus, enumProductStatus } from "src/product/product.enums";
import isValidJSON from "common/functions/isValidJSON";
import { censorText } from "common/functions/censorText";
import currencyList from "common/configs/currency.config";
import CONFIG_DEFAULT from "common/configs/default.config";
import { GetGeolocationForIP } from "common/functions/GetGeolocationForIP";
import { Category } from "src/category/category.entity";
import { CategoryService } from "src/category/category.service";
import { ProductService } from "src/product/product.service";
import { UserHistoryCategoryViews, UserHistoryClientData, UserHistoryProductFavorites, UserHistoryProductMessages, UserHistoryProductViews, UserHistorySearch } from "./user.history.entity";
import { isLatLngRadius } from "common/functions/getLatLngRadius";

@Injectable()
export class UserService implements OnModuleInit {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,

        @InjectRepository(Category)
        private readonly categoryRepository: Repository<Category>,

        @InjectRepository(UserHistoryProductViews)
        private readonly userHistoryProductViewsRepository: Repository<UserHistoryProductViews>,

        @InjectRepository(UserHistoryProductFavorites)
        private readonly userHistoryProductFavoritesRepository: Repository<UserHistoryProductFavorites>,

        @InjectRepository(UserHistoryProductMessages)
        private readonly userHistoryProductMessagesRepository: Repository<UserHistoryProductMessages>,

        @InjectRepository(UserHistoryCategoryViews)
        private readonly userHistoryCategoryViewsRepository: Repository<UserHistoryCategoryViews>,

        @InjectRepository(UserHistorySearch)
        private readonly userHistorySearchRepository: Repository<UserHistorySearch>,

        private readonly moduleRef: ModuleRef
    ) {}

    private categoryService: CategoryService
    private productService: ProductService

    async onModuleInit() {
        this.categoryService = this.moduleRef.get(CategoryService, { strict: false })
        this.productService = this.moduleRef.get(ProductService, { strict: false })

        this.userRepository
            .createQueryBuilder('users')
            .update({
                onlineStatus: false,
                onlineStatusDate: new Date()
            })
            .where('users.onlineStatus = 1')
            .execute()
    }


    async siteInit(
        res: Response,
        req: Request
    ) {
        const returnObject: {
            uid: number,
            roles: Role[],
            geolocation: UserGeolocation,
            currency: string,
            favoriteProducts: number[],
            emailVerify: boolean
            searchHistory: string[]
        } = {
            uid: -1,
            roles: [],
            geolocation: null,
            currency: 'USD',
            favoriteProducts: [],
            emailVerify: false,
            searchHistory: []
        }

        if(req['user']) {
            returnObject.uid = req['user'].id
            returnObject.roles = req['user'].roles
            returnObject.geolocation = req['user'].geolocation
            returnObject.currency = req['user'].currency
            returnObject.favoriteProducts = req['user'].favoritesProducts.map(item => item.prodID)
            returnObject.searchHistory = req['user'].searchHistory
            returnObject.emailVerify = req['user'].emailVerify
        }
        else {
            returnObject.geolocation = await GetGeolocationForIP(req.ip, req.headers['lang'] as string)
        }

        return templateResponse(res, returnObject, 200)
    }

    async getBanned(
        res: Response,
        req: Request,

        desc?: boolean
    ) {
        const user = req['user']
        if(!user || !user.id)return templateResponse(res, {
            banned: undefined,
            reportBanned: undefined
        }, 200)

        if(user.banned && +new Date(user.bannedExpires) <= +new Date()) {
            this.userRepository.update({ id: user.id }, { banned: false })
            user.banned = false
        }
        if(user.reportBanned && +new Date(user.reportBannedExpires) <= +new Date()) {
            this.userRepository.update({ id: user.id }, { reportBanned: false })
            user.reportBanned = false
        }

        if(desc) {
            return templateResponse(res, {
                banned: {
                    status: req['user'].banned,
                    expires: req['user'].bannedExpires,
                    comment: req['user'].bannedComment
                },
                reportBanned: {
                    status: req['user']?.reportBanned,
                    expires: req['user'].reportBannedExpires,
                    comment: req['user'].reportBannedComment
                }
            }, 200)
        }

        templateResponse(res, {
            banned: user.banned,
            reportBanned: user.reportBanned
        }, 200)
    }
    

    async getUserData(
        res: Response,
        req: Request
    ) {
        let user = await this.get(req['user'].id, { roles: true })
        if(!user) {
            templateResponse(res, "You are not logged in", 401)
            throw new UnauthorizedException()
        }

        delete user.password

        const productCounts = await this.getProductsCounts(user.id)
        user = {...user, ...productCounts}

        user.roles = user.roles.sort((a: Role, b: Role) => a.index - b.index)

        templateResponse(res, user, 200)
    }


    async getUserRoles(res?: Response, req?: Request) {
        const user: any = await this.userRepository.findOne({
            where: {
                id: req['user'].id,
                _deleted: false
            },
            relations: {
                roles: true
            },
            select: {
                roles: true
            }
        })
        if(!user) {
            templateResponse(res, "You are not logged in", 401)
            return
        }

        templateResponse(res, user.roles, 200)
        return user.roles
    }


    async getProfileData(
        res: Response,
        req: Request,

        userid: any // number
    ) {
        userid = parseInt(userid)
        if(isNaN(userid) || userid < 1) {
            return templateResponse(res, "Fields should not be empty (userid)", 400)
        }

        const user: User | any = await this.get(userid, {
            roles: true
        }, [ 'id', 'email', 'name', 'createAt', 'avatar', 'rating', 'products',
            'signatureProfileText', 'gender', 'birthDate', 'privacySettings', 'onlineStatus', 'onlineStatusDate', 'banned' ])
        if(!user || user.banned) {
            return templateResponse(res, "User with this userid not found", 404)
        }

        user.email = censorText(user.email)
        
        const locale = req.headers['lang'] || req.get('accept-language').substring(0, 2)
        if(parseInt(user.birthDate) !== 0 && user.privacySettings.showBirthDate !== 'all') {
            if(user.privacySettings.showBirthDate === 'daymonth') user.birthDateShow = new Date(parseInt(user.birthDate)).toLocaleDateString(locale, {
                day: '2-digit',
                month: 'long'
            })
            user.birthDate = null
        }
        if(!user.privacySettings.showGender) user.gender = null

        templateResponse(res, user, 200)
    }


    async get(
        userid: number,
        relations?: FindOptionsRelations<User>,
        select?: FindOptionsSelectByString<User>
    ): Promise<User> {
        if(!userid || isNaN(userid))return null

        if(!relations) relations = {}
        relations.roles = true

        const user: any = await this.userRepository.findOne({
            where: {
                id: userid,
                _deleted: false
            },
            relations,
            select
        })
        if(!user)return

        let productsCount: number = await this.productRepository.count({
            where: {
                prodOwner: user.id,
                prodStatus: Not(enumProductStatus.PRODUCT_STATUS_DELETED)
            }
        })
        user.productsCount = productsCount

        productsCount = await this.productRepository.count({
            where: {
                prodOwner: user.id,
                prodStatus: enumProductStatus.PRODUCT_STATUS_ACTIVE,
                prodModerationStatus: enumProductModerationStatus.PRODUCT_MODERATION_STATUS_VERIFIED
            }
        })
        user.productsActiveCount = productsCount

        productsCount = await this.productRepository.count({
            where: {
                prodOwner: user.id,
                prodModerationStatus: enumProductModerationStatus.PRODUCT_MODERATION_STATUS_PROBLEM
            }
        })
        user.productsProblemsCount = productsCount

        productsCount = await this.productRepository.count({
            where: {
                prodOwner: user.id,
                prodModerationStatus: enumProductModerationStatus.PRODUCT_MODERATION_STATUS_VERIFYING
            }
        })
        user.productsVerifyingCount = productsCount

        return user
    }


    async favoriteProducts(
        res: Response,
        req: Request,

        productID: number
    ) {
        if(!productID) {
            templateResponse(res, "Fields should not be empty (productID)", 400)
            return
        }

        const product = await this.productService.get(productID)
        if(!product) {
            return templateResponse(res, "Product with this 'productID' not found", 404)
        }

        const findedIndex = req['user'].favoritesProducts.findIndex(item => item.prodID === product.prodID)

        if(findedIndex !== -1) req['user'].favoritesProducts.splice(findedIndex, 1)
        else req['user'].favoritesProducts.push(product)

        await this.userRepository.save(req['user'])
        templateResponse(res, '', 200)
    }
    // async updateFavoriteProducts(
    //     res: Response,
    //     req: Request,

    //     productsIDs: number[]
    // ) {
    //     if(!productsIDs || !productsIDs.length) {
    //         templateResponse(res, "Fields should not be empty (productsIDs)", 400)
    //         return
    //     }

    //     const product = await this.productRepository.find({
    //         where: {
    //             prodID: 
    //         }
    //     })
    //     if(!product) {
    //         return templateResponse(res, "Product with this 'productID' not found", 404)
    //     }

    //     const findedIndex = req['user'].favoritesProducts.findIndex(item => item.prodID === product.prodID)

    //     if(findedIndex !== -1) req['user'].favoritesProducts.splice(findedIndex, 1)
    //     else req['user'].favoritesProducts.push(product)

    //     await this.userRepository.save(req['user'])
    //     templateResponse(res, '', 200)
    // }
    async getFavoriteProducts(
        res: Response,
        req: Request,

        limit?: number
    ) { 
        templateResponse(res, req['user'].favoritesProducts, 200)
    }


    // recommendation system
    async getRecommendation(
        res: Response,
        req: Request,

        client_geolocation: UserGeolocation,

        client_productViews?: UserHistoryClientData[],
        client_productFavorites?: UserHistoryClientData[],
        client_categoryViews?: UserHistoryClientData[],
        client_searchTexts?: UserHistoryClientData[],

        paginationTake?: number,
        doNotTake?: number[]
    ) {
        if(!client_geolocation) {
            return templateResponse(res, "Fields should not be empty (client_geolocation)", 400)
        }
        if(!client_geolocation.cityUniqueID
            || !client_geolocation.lat || !client_geolocation.lng) {
            return templateResponse(res, "Incorrect data [client_geolocation]", 400)
        }

        if(!paginationTake) paginationTake = 20

        let productViews: UserHistoryProductViews[] = []
        let productFavorites: UserHistoryProductFavorites[] = []
        let productMessages: UserHistoryProductMessages[] = []

        let categoryViews: UserHistoryCategoryViews[] = []
        let categoryViewsCounts: Record<number, number> = {}

        let searchTexts: UserHistorySearch[] = []
        let geolocation: UserGeolocation

        if(client_productViews && client_productViews.filter && client_productViews.length) client_productViews = client_productViews.filter(item => item.date && item.id)
        if(client_productFavorites && client_productFavorites.filter && client_productFavorites.length) client_productFavorites = client_productFavorites.filter(item => item.date && item.id)
        if(client_categoryViews && client_categoryViews.filter && client_categoryViews.length) client_categoryViews = client_categoryViews.filter(item => item.date && item.id)
        if(client_searchTexts && client_searchTexts.filter && client_searchTexts.length) client_searchTexts = client_searchTexts.filter(item => item.date && item.text)

        const allCategories = await this.categoryService.getAll()

        // сбор данных
        if(req['user']) {
            productViews = await this.userHistoryProductViewsRepository.find({
                where: {
                    user: {
                        id: req['user'].id
                    },
                    date: Between(new Date(+new Date() - (60000 * 60 * 24 * 30)), new Date())
                },
                relations: {
                    product: true
                }
            })

            productFavorites = await this.userHistoryProductFavoritesRepository.find({
                where: {
                    user: {
                        id: req['user'].id
                    },
                    date: Between(new Date(+new Date() - (60000 * 60 * 24 * 30)), new Date())
                },
                relations: {
                    product: true
                }
            })

            categoryViews = await this.userHistoryCategoryViewsRepository.find({
                where: {
                    user: {
                        id: req['user'].id
                    },
                    date: Between(new Date(+new Date() - (60000 * 60 * 24 * 30)), new Date())
                },
                relations: {
                    category: true
                }
            })

            searchTexts = await this.userHistorySearchRepository.find({
                where: {
                    user: {
                        id: req['user'].id
                    },
                    date: Between(new Date(+new Date() - (60000 * 60 * 24 * 30)), new Date())
                }
            })

            productMessages = await this.userHistoryProductMessagesRepository.find({
                where: {
                    user: {
                        id: req['user'].id
                    },
                    date: Between(new Date(+new Date() - (60000 * 60 * 24 * 30)), new Date())
                },
                relations: {
                    product: true
                }
            })

            geolocation = req['user'].geolocation
        }
        else {
            if(client_productViews && client_productViews.map && client_productViews.length) {
                const products = await this.productRepository.find({
                    where: {
                        prodID: In(client_productViews.map(item => item.id))
                    }
                })
                if(products) {
                    productViews = products.map(item => {
                        return { id: -1, product: item, date: (client_productViews.find(l => parseInt(l.id) === item.prodID) || {}).date || new Date(), user: null }
                    })
                }
            }
            if(client_productFavorites && client_productFavorites.map && client_productFavorites.length) {
                const products = await this.productRepository.find({
                    where: {
                        prodID: In(client_productFavorites.map(item => item.id))
                    }
                })
                if(products) {
                    productFavorites = products.map(item => {
                        return { id: -1, product: item, date: (client_productFavorites.find(l => parseInt(l.id) === item.prodID) || {}).date || new Date(), user: null }
                    })
                }
            }
            if(client_categoryViews && client_categoryViews.map && client_categoryViews.length) {
                const categories = await this.categoryRepository.find({
                    where: {
                        categoryID: In(client_categoryViews.map(item => item.id))
                    },
                    relations: {
                        categoryParent: {
                            categoryParent: true
                        }
                    }
                })
                if(categories) {
                    categoryViews = categories.map(item => {
                        return { id: -1, category: item, date: (client_categoryViews.find(l => parseInt(l.id) === item.categoryID) || {}).date || new Date(), user: null }
                    })
                }
            }
            if(client_searchTexts && client_searchTexts.map && client_searchTexts.length) {
                searchTexts = client_searchTexts.map(item => {
                    return { id: -1, text: item.text, date: item.date || new Date(), user: null }
                })
            }

            geolocation = client_geolocation
        }

        if(categoryViews && categoryViews.length) {
            categoryViews.map(async cat => {
                if(cat.category) {
                    if(categoryViewsCounts[cat.category.categoryID]) {
                        categoryViewsCounts[cat.category.categoryID] ++
                        cat = null
                    }
                    else categoryViewsCounts[cat.category.categoryID] = 1
                }
            })
            categoryViews = categoryViews.filter(cat => cat)

            categoryViews.map(async cat => {
                const findedCategory = await this.categoryService.get(cat.category.categoryID, null, null, allCategories)
                
                if(findedCategory) cat.category = findedCategory
                else cat.category = null
            })
            categoryViews = categoryViews.filter(cat => cat.category)
        }

        // заполнение запроса
        let findoptions: FindManyOptions<Product> = {}
        findoptions.where = []

        const defaultWhereOptions: FindOptionsWhere<Product> = {
            prodStatus: enumProductStatus.PRODUCT_STATUS_ACTIVE,
            prodModerationStatus: enumProductModerationStatus.PRODUCT_MODERATION_STATUS_VERIFIED,
            prodOwner: {
                banned: false,
                _deleted: false
            }
        }
        if(doNotTake && doNotTake.length) defaultWhereOptions.prodID = Not(In(doNotTake))

        productViews.map(item => {
            const keywords = (item.product.prodKeyWords as string).split(',')
            keywords.map(word => {
                (findoptions.where as FindOptionsWhere<Product>[]).push({
                    prodKeyWords: Like(`%${word}%`),
                    ...defaultWhereOptions
                })
            })
        })
        productFavorites.map(item => {
            const keywords = (item.product.prodKeyWords as string).split(',')
            keywords.map(word => {
                (findoptions.where as FindOptionsWhere<Product>[]).push({
                    prodKeyWords: Like(`%${word}%`),
                    ...defaultWhereOptions
                })
            })
        })
        productMessages.map(item => {
            const keywords = (item.product.prodKeyWords as string).split(',')
            keywords.map(word => {
                (findoptions.where as FindOptionsWhere<Product>[]).push({
                    prodKeyWords: Like(`%${word}%`),
                    ...defaultWhereOptions
                })
            })
        })
        categoryViews.map(item => {
            (findoptions.where as FindOptionsWhere<Product>[]).push({
                prodCategory: {
                    categoryID: item.category.categoryID
                },
                prodCreateAt: Between(new Date(+new Date() - (60000 * 60 * 24 * 3)), new Date()),
                ...defaultWhereOptions
            })

            if(item.category.categoryParent && item.category.categoryParent.categoryParent) {
                (findoptions.where as FindOptionsWhere<Product>[]).push({
                    prodCategory: {
                        categoryID: item.category.categoryParent.categoryID
                    },
                    prodCreateAt: Between(new Date(+new Date() - (60000 * 60 * 24 * 3)), new Date()),
                    ...defaultWhereOptions
                })

                if(item.category.categoryParent.categorySubcategories) {
                    item.category.categoryParent.categorySubcategories.map(cat => {
                        (findoptions.where as FindOptionsWhere<Product>[]).push({
                            prodCategory: {
                                categoryID: cat.categoryID
                            },
                            prodCreateAt: Between(new Date(+new Date() - (60000 * 60 * 24 * 3)), new Date()),
                            ...defaultWhereOptions
                        })
                    })
                }
            }
            if(item.category.categorySubcategories) {
                item.category.categorySubcategories.map(cat => {
                    (findoptions.where as FindOptionsWhere<Product>[]).push({
                        prodCategory: {
                            categoryID: cat.categoryID
                        },
                        prodCreateAt: Between(new Date(+new Date() - (60000 * 60 * 24 * 3)), new Date()),
                        ...defaultWhereOptions
                    })
                })
            }
        })
        searchTexts.map(item => {
            const keywords = item.text.toLowerCase().stringLettersNumbers().trim().split(' ')
            keywords.map(word => {
                (findoptions.where as FindOptionsWhere<Product>[]).push({
                    prodKeyWords: Like(`%${word}%`),
                    ...defaultWhereOptions
                })
            })
        })

        findoptions.relations = {
            prodCategory: true,
            prodOwner: true
        }

        const _this = this
        async function _findProducts(s?: boolean) {
            return await _this.productRepository.find(findoptions)
        }

        // запрос
        let products: Product[] = []

        if(findoptions.where.length) products = await _findProducts()
        if(!products.length) {
            findoptions.where = [
                { ...defaultWhereOptions, prodCreateAt: Between(new Date(+new Date() - (60000 * 60 * 24 * 14)), new Date()) },
                { ...defaultWhereOptions, prodCreateAt: Between(new Date(+new Date() - (60000 * 60 * 24 * 14)), new Date()), prodAttention: true }
            ]
            products = await _findProducts(true)
        }

        // сортировка
        if(products.length) {
            products = products.map(product => {
                let score: number = 0
                const productKeyWords = (product.prodKeyWords as string).split(',')

                productMessages.map(prodmes => {
                    const keywords = (prodmes.product.prodKeyWords as string).split(',')
                    keywords.map(word => productKeyWords.indexOf(word) !== -1 ? score += CONFIG_USER.recommendation.scoreList.message : null)
                })
                productFavorites.map(prodmes => {
                    const keywords = (prodmes.product.prodKeyWords as string).split(',')
                    keywords.map(word => productKeyWords.indexOf(word) !== -1 ? score += CONFIG_USER.recommendation.scoreList.favorite : null)
                })
                productViews.map(prodmes => {
                    const keywords = (prodmes.product.prodKeyWords as string).split(',')
                    keywords.map(word => productKeyWords.indexOf(word) !== -1 ? score += CONFIG_USER.recommendation.scoreList.views : null)
                })
                categoryViews.map(catmes => {
                    const currentCategory = catmes.category

                    let parentCategory: Category
                    let neighbourCategories: Category[]
                    let subCategories: Category[]

                    let findedCategory: Category

                    if(currentCategory.categoryParent) {
                        if(currentCategory.categoryParent.categoryParent) parentCategory = currentCategory.categoryParent // если родитель не категория 1 ступени
                        if(currentCategory.categoryParent.categorySubcategories
                            && currentCategory.categoryParent.categorySubcategories.length) {
                            neighbourCategories = currentCategory.categoryParent.categorySubcategories
                        }
                    }
                    if(currentCategory.categorySubcategories) {
                        subCategories = currentCategory.categorySubcategories
                    }

                    if(product.prodCategory.categoryID === currentCategory.categoryID) {
                        score += CONFIG_USER.recommendation.scoreList.category.current
                        findedCategory = currentCategory
                    }
                    else if(parentCategory && product.prodCategory.categoryID === parentCategory.categoryID) {
                        score += CONFIG_USER.recommendation.scoreList.category.parent
                        findedCategory = parentCategory
                    }
                    else if(neighbourCategories && neighbourCategories.find(cat => cat.categoryID === product.prodCategory.categoryID)) {
                        score += CONFIG_USER.recommendation.scoreList.category.neighbour
                        findedCategory = neighbourCategories.find(cat => cat.categoryID === product.prodCategory.categoryID)
                    }
                    else if(subCategories && subCategories.find(cat => cat.categoryID === product.prodCategory.categoryID)) {
                        score += CONFIG_USER.recommendation.scoreList.category.sub
                        findedCategory = subCategories.find(cat => cat.categoryID === product.prodCategory.categoryID)
                    }

                    if(findedCategory
                        && categoryViewsCounts[findedCategory.categoryID]
                        && !isNaN(categoryViewsCounts[findedCategory.categoryID])) {
                        score += (CONFIG_USER.recommendation.scoreList.category._viewCountMultiplier * categoryViewsCounts[findedCategory.categoryID])
                    }
                })
                searchTexts.map(searchmes => {
                    const keywords = searchmes.text.toLowerCase().stringLettersNumbers().trim().split(' ')
                    keywords.map(word => productKeyWords.indexOf(word) !== -1 ? score += CONFIG_USER.recommendation.scoreList.search : null)
                })

                if(geolocation
                    && geolocation.cityUniqueID) {
                    if(product.prodCityUniqueID === geolocation.cityUniqueID) score += CONFIG_USER.recommendation.scoreList.city
                }
                if(isLatLngRadius([ geolocation.lat, geolocation.lng ], [product.prodLat, product.prodLng], CONFIG_USER.recommendation.checkLatLngRadius)) {
                    score += CONFIG_USER.recommendation.scoreList.radius
                }

                if(+new Date(product.prodCreateAt) >= +new Date(+new Date() - CONFIG_USER.recommendation.newestDate)) {
                    score += CONFIG_USER.recommendation.scoreList.newest
                }

                if(product.prodAttention) {
                    score += CONFIG_USER.recommendation.scoreList.attention
                }

                (product as any)._score = score
                return product
            })
            
            products = products.sort((a, b) => (b as any)._score - (a as any)._score)
            products = products.slice(0, paginationTake)
        }

        templateResponse(res, products, 200)
    }


    async setOnlineStatus(status: boolean, userid: number, where: OnlineStatusWhere = 'main') {
        const user: User = await this.get(userid)
        if(!user)return

        user.onlineStatus = status
        user.onlineStatusDate = new Date()
        user.onlineStatusWhere = where
        
        await this.userRepository.save(user)
    }


    async getProductsCounts(userid: number) {
        if(!userid)return

        let productsCount: number = await this.productRepository.count({
            where: {
                prodOwner: {
                    id: userid
                },
                prodStatus: Not(enumProductStatus.PRODUCT_STATUS_DELETED)
            }
        });
        let productsActiveCount = await this.productRepository.count({
            where: {
                prodOwner: {
                    id: userid
                },
                prodStatus: enumProductStatus.PRODUCT_STATUS_ACTIVE,
                prodModerationStatus: enumProductModerationStatus.PRODUCT_MODERATION_STATUS_VERIFIED
            }
        });
        let productsClosedCount = await this.productRepository.count({
            where: {
                prodOwner: {
                    id: userid
                },
                prodStatus: enumProductStatus.PRODUCT_STATUS_CLOSED
            }
        });
        let productsBannedCount = await this.productRepository.count({
            where: {
                prodOwner: {
                    id: userid
                },
                prodStatus: enumProductStatus.PRODUCT_STATUS_BANNED
            }
        });
        let productsDeletedCount = await this.productRepository.count({
            where: {
                prodOwner: {
                    id: userid
                },
                prodStatus: enumProductStatus.PRODUCT_STATUS_DELETED
            }
        });
        let productsForgotCount = await this.productRepository.count({
            where: {
                prodOwner: {
                    id: userid
                },
                prodStatus: enumProductStatus.PRODUCT_STATUS_FORGOT
            }
        });
        let productsProblemsCount = await this.productRepository.count({
            where: {
                prodOwner: {
                    id: userid
                },
                prodModerationStatus: enumProductModerationStatus.PRODUCT_MODERATION_STATUS_PROBLEM,
                prodStatus: And(Not(enumProductStatus.PRODUCT_STATUS_DELETED), Not(enumProductStatus.PRODUCT_STATUS_BANNED))
            }
        });
        let productsVerifyingCount = await this.productRepository.count({
            where: {
                prodOwner: {
                    id: userid
                },
                prodModerationStatus: enumProductModerationStatus.PRODUCT_MODERATION_STATUS_VERIFYING
            }
        });

        return {
            productsCount,
            productsActiveCount,
            productsClosedCount,
            productsBannedCount,
            productsDeletedCount,
            productsForgotCount,
            productsProblemsCount,
            productsVerifyingCount
        }
    }


    async searchAccount(
        res: Response,
        req: Request,

        name: string
    ) {
        if(!name) {
            return templateResponse(res, "Fields should not be empty (name)", 400)
        }
        if(name.length < 2 || name.length > 48) {
            return templateResponse(res, "Incorrect data [name]", 400)
        }

        const account = await this.userRepository.findOne({
            where: {
                fullname: Like(name + '%'),
                _deleted: false,
                id: Not(req['user'].id)
            },
            select: [ 'name', 'avatar', 'id' ]
        })

        if(!account) {
            return templateResponse(res, "Account not found", 404)
        }
        return templateResponse(res, account, 200)
    }


    // delete
    async deleteAccount(
        res: Response,
        req: Request,

        reason: string,
        reasonText: string
    ) {
        if(!reason || (reason === 'other' && !reasonText)) {
            return templateResponse(res, "Fields should not be empty (reason, reasonText)", 400)
        }

        if(reason !== 'badservice'
            && reason !== 'idiot'
            && reason !== 'support'
            && reason !== 'moderation'
            && reason !== 'other') {
            return templateResponse(res, "Incorrect data [reason]", 400)
        }
        if(reason === 'other' && (reasonText.length < 24 || reasonText.length > 512)) {
            return templateResponse(res, "Incorrect data [reasonText]", 400)
        }

        await this.userRepository.update({ id: req['user'].id }, {
            _deleted: true,
            _deletedReason: reason,
            _deletedReasonText: reasonText,
            _deletedEmail: req['user'].email,
            _deletedAvatar: req['user'].avatar,
            _deletedName: req['user'].name,

            email: null,
            name: ['DELETED', ''],
            fullname: 'DELETED',
            avatar: {
                image: '/assets/avatars/deleted.png',
                position: { x: 0, y: 0 },
                size: 100
            },
            onlineStatus: false,
            onlineStatusDate: new Date()
        })

        // блокировка объявлений
        await this.productRepository.update({ prodOwner: { id: req['user'].id } }, {
            prodStatus: enumProductStatus.PRODUCT_STATUS_DELETED,
            prodModerationStatus: enumProductModerationStatus.PRODUCT_MODERATION_STATUS_VERIFIED
        })

        // удаление supports

        // удаление reports

        templateResponse(res, "", 200)
    }


    async addHistory(
        res: Response,
        req: Request,

        type: 'product-view' | 'product-favorite' | 'product-message' | 'category-view' | 'search',

        productID?: number,
        categoryID?: number,
        searchText?: string
    ) {
        if(!type) {
            return templateResponse(res, "Fields should do not be empty (type)", 400)
        }
        if(type !== 'product-favorite' && type !== 'product-view' && type !== 'category-view' && type !== 'search' && type !== 'product-message') {
            return templateResponse(res, "Incorrect data [type]", 400)
        }

        if((type === 'product-favorite' || type === 'product-view' || type === 'product-message')
            && !productID) {
            return templateResponse(res, "The 'productID' must be specified for this 'type'", 400)
        }
        if((type === 'category-view')
            && !categoryID) {
            return templateResponse(res, "The 'categoryID' must be specified for this 'type'", 400)
        }
        if((type === 'search')
            && (!searchText || !searchText.length)) {
            return templateResponse(res, "The 'searchText' must be specified for this 'type'", 400)
        }

        let product: Product
        let category: Category

        if(productID) {
            product = await this.productService.get(productID)
            if(!product) {
                return templateResponse(res, "Product with this 'productID' not found", 404)
            }
        }
        if(categoryID) {
            category = await this.categoryService.get(categoryID)
            if(!category) {
                return templateResponse(res, "Category with this 'categoryID' not found", 404)
            }
        }

        if(type === 'product-view') {
            const result = await this.userHistoryProductViewsRepository.count({
                where: {
                    user: {
                        id: req['user'].id
                    },
                    product: {
                        prodID: product.prodID
                    },
                    date: Between(new Date(+new Date() -(60000 * 60 * 24)), new Date())
                }
            })
            if(result > 0) {
                return templateResponse(res, "Recently, such the 'product' has already been added to history", 400)
            }

            await this.userHistoryProductViewsRepository.insert({
                user: req['user'],
                product
            })
        }
        else if(type === 'product-favorite') {
            const result = await this.userHistoryProductFavoritesRepository.count({
                where: {
                    user: {
                        id: req['user'].id
                    },
                    product: {
                        prodID: product.prodID
                    },
                    date: Between(new Date(+new Date() -(60000 * 60 * 24)), new Date())
                }
            })
            if(result > 0) {
                return templateResponse(res, "Recently, such the 'product' has already been added to history", 400)
            }

            await this.userHistoryProductFavoritesRepository.insert({
                user: req['user'],
                product
            })
        }
        else if(type === 'product-message') {
            const result = await this.userHistoryProductMessagesRepository.count({
                where: {
                    user: {
                        id: req['user'].id
                    },
                    product: {
                        prodID: product.prodID
                    },
                    date: Between(new Date(+new Date() -(60000 * 60 * 24)), new Date())
                }
            })
            if(result > 0) {
                return templateResponse(res, "Recently, such the 'product' has already been added to history", 400)
            }

            await this.userHistoryProductMessagesRepository.insert({
                user: req['user'],
                product
            })
        }
        else if(type === 'category-view') {
            const result = await this.userHistoryCategoryViewsRepository.count({
                where: {
                    user: {
                        id: req['user'].id
                    },
                    category: {
                        categoryID: category.categoryID
                    },
                    date: Between(new Date(+new Date() -(60000 * 60 * 24)), new Date())
                }
            })
            if(result > 0) {
                return templateResponse(res, "Recently, such the 'category' has already been added to history", 400)
            }

            await this.userHistoryCategoryViewsRepository.insert({
                user: req['user'],
                category
            })
        }
        else if(type === 'search') {
            const result = await this.userHistorySearchRepository.count({
                where: {
                    user: {
                        id: req['user'].id
                    },
                    text: searchText
                }
            })
            if(result > 0) {
                return templateResponse(res, "The transmitted 'searchText' is already in the history", 400)
            }

            await this.userHistorySearchRepository.insert({
                user: req['user'],
                text: searchText
            })
        }

        templateResponse(res, "", 200)
    }
    async updateHistory(
        res: Response,
        req: Request,

        productViews: UserHistoryClientData[],
        productFavorites: UserHistoryClientData[],
        categoryViews: UserHistoryClientData[],
        searchTexts: UserHistoryClientData[]
    ) {
        if(!productViews && !productFavorites && !categoryViews && !searchTexts) {
            return templateResponse(res, "One of the parameters must be specified (productViews, productFavorites, categoryViews, searchTexts)", 400)
        }

        if(productViews) {
            productViews = productViews.filter(item => {
                if(!item.id || !item.date)return false
                return true
            })

            if(!productViews.length) {
                return templateResponse(res, "Incorrect data [productViews]", 200)
            }
            
            const result = await this.userHistoryProductViewsRepository.find({
                where: {
                    user: {
                        id: req['user'].id
                    },
                    date: Between(new Date(+new Date() -(60000 * 60 * 24 * 30)), new Date())
                },
                relations: {
                    product: true
                },
                select: [ 'id', 'product' ]
            })
            
            productViews.filter((item, i) => {
                const finded = result.find(f => f.product.prodID === parseInt(item.id))
                if(finded && +new Date(finded.date) >= (+new Date() - (60000 * 60 * 24))) {
                    return false
                }
                return true
            })

            this.userHistoryProductViewsRepository.insert(productViews.map(item => {
                return { user: req['user'], product: { prodID: parseInt(item.id) }, date: item.date }
            }))
        }
        if(productFavorites) {
            productFavorites = productFavorites.filter(item => {
                if(!item.id || !item.date)return false
                return true
            })

            if(!productFavorites.length) {
                return templateResponse(res, "Incorrect data [productFavorites]", 200)
            }
            
            const result = await this.userHistoryProductFavoritesRepository.find({
                where: {
                    user: {
                        id: req['user'].id
                    },
                    date: Between(new Date(+new Date() -(60000 * 60 * 24 * 30)), new Date())
                },
                relations: {
                    product: true
                },
                select: [ 'id', 'product' ]
            })
            
            productFavorites.filter((item, i) => {
                const finded = result.find(f => f.product.prodID === parseInt(item.id))
                if(finded && +new Date(finded.date) >= (+new Date() - (60000 * 60 * 24))) {
                    return false
                }
                return true
            })

            this.userHistoryProductFavoritesRepository.insert(productFavorites.map(item => {
                return { user: req['user'], product: { prodID: parseInt(item.id) }, date: item.date }
            }))
        }
        if(categoryViews) {
            categoryViews = categoryViews.filter(item => {
                if(!item.id || !item.date)return false
                return true
            })

            if(!categoryViews.length) {
                return templateResponse(res, "Incorrect data [categoryViews]", 200)
            }
            
            const result = await this.userHistoryCategoryViewsRepository.find({
                where: {
                    user: {
                        id: req['user'].id
                    },
                    date: Between(new Date(+new Date() -(60000 * 60 * 24 * 30)), new Date())
                },
                relations: {
                    category: true
                },
                select: [ 'id', 'category' ]
            })
            
            categoryViews.filter((item, i) => {
                const finded = result.find(f => f.category.categoryID === parseInt(item.id))
                if(finded && +new Date(finded.date) >= (+new Date() - (60000 * 60 * 24))) {
                    return false
                }
                return true
            })

            this.userHistoryCategoryViewsRepository.insert(categoryViews.map(item => {
                return { user: req['user'], category: { categoryID: parseInt(item.id) }, date: item.date }
            }))
        }
        if(searchTexts) {
            searchTexts = searchTexts.filter(item => {
                if(!item.text || !item.text.length || !item.date)return false
                return true
            })

            if(!searchTexts.length) {
                return templateResponse(res, "Incorrect data [searchTexts]", 200)
            }
            
            const result = await this.userHistorySearchRepository.find({
                where: {
                    user: {
                        id: req['user'].id
                    }
                },
                select: [ 'id', 'text' ]
            })
            
            searchTexts.filter((item, i) => {
                return !!result.find(f => f.text === item.text)
            })

            this.userHistorySearchRepository.insert(searchTexts.map(item => {
                return { user: req['user'], text: item.text, date: item.date }
            }))
        }

        templateResponse(res, {
            searchTexts
        }, 200)
    }

    async removeSearchHistory(
        res: Response,
        req: Request,

        text: string
    ) {
        if(!text || !text.length) {
            return templateResponse(res, "Fields should do not be empty (text)", 400)
        }

        const index = req['user'].searchHistory.indexOf(text)
        if(index === -1) {
            return templateResponse(res, "Text not found", 404)
        }

        req['user'].searchHistory.splice(index, 1)
        await this.userRepository.update({ id: req['user'].id }, { searchHistory: req['user'].searchHistory })

        templateResponse(res, "", 200)
    }

    
}