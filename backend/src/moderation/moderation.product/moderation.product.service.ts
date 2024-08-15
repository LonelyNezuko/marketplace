import { Injectable, OnModuleInit } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { InjectRepository } from "@nestjs/typeorm";
import { PaginationDto } from "common/dto/pagination.dto";
import isValidJSON from "common/functions/isValidJSON";
import { RolePrivilegesVerify } from "common/functions/rolePrivilegesVerify";
import templateResponse from "common/templates/response.tp";
import { Request, Response } from "express";
import { Category } from "src/category/category.entity";
import { CategoryService } from "src/category/category.service";
import { LogsService } from "src/logs/logs.service";
import { Product } from "src/product/product.entity";
import { enumProductModerationStatus, enumProductStatus } from "src/product/product.enums";
import { ProductModerationHistoryEntity } from "src/product/product.moderationHistory.entity";
import { ProductService } from "src/product/product.service";
import { ProductSnapshotEntity } from "src/product/product.snapshot.entity";
import { User } from "src/user/user.entity";
import { UserNotificationsService } from "src/user/user.notifications/user.notifications.service";
import { And, FindManyOptions, Not, Repository } from "typeorm";

@Injectable()
export class ModerationProductSerivce implements OnModuleInit {
    constructor(
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,

        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        @InjectRepository(ProductSnapshotEntity)
        private readonly productSnapshotRepository: Repository<ProductSnapshotEntity>,

        @InjectRepository(ProductModerationHistoryEntity)
        private readonly productModerationHistoryRepository: Repository<ProductModerationHistoryEntity>,

        private readonly moduleRef: ModuleRef
    ) {}

    private logsService: LogsService
    private productService: ProductService
    private categoryService: CategoryService
    private userNotificationsService: UserNotificationsService

    async onModuleInit() {
        this.logsService = this.moduleRef.get(LogsService, { strict: false })
        this.productService = this.moduleRef.get(ProductService, { strict: false })
        this.categoryService = this.moduleRef.get(CategoryService, { strict: false })
        this.userNotificationsService = this.moduleRef.get(UserNotificationsService, { strict: false })
    }

    // get
    async get(
        prodID: number,

        res?: Response,
        req?: Request
    ): Promise<Product> {
        if(!prodID) {
            if(res) templateResponse(res, 'Fields should not be empty (prodID)', 400)
            return
        }
        if(prodID < 1 || isNaN(prodID)) {
            if(res) templateResponse(res, 'Incorrect data [prodID]', 400)
            return
        }

        const product = await this.productRepository.findOne({
            where: {
                prodID
            },
            relations: {
                prodCategory: {
                    categoryParent: true
                },
                prodOwner: true,
                prodModerator: true
            }
        })
        if(!product || (!RolePrivilegesVerify('/moderation/product/delete', req) && product.prodStatus === enumProductStatus.PRODUCT_STATUS_DELETED)) {
            if(res) templateResponse(res, 'Product with this ProdID not found', 404)
            return
        }

        const moderationHistory = await this.productModerationHistoryRepository.find({
            where: {
                product: {
                    prodID: product.prodID
                }
            },
            relations: {
                snapshot: true,
                moderator: true
            },
            order: {
                createAt: 'desc'
            }
        })

        if(res) templateResponse(res, {
            product,
            moderationHistory
        }, 200)
        else return product
    }

    async getVerifyingProduct(
        res: Response,
        req: Request
    ) {
        const product = await this.productRepository.findOne({
            where: {
                prodStatus: enumProductStatus.PRODUCT_STATUS_ACTIVE,
                prodModerationStatus: enumProductModerationStatus.PRODUCT_MODERATION_STATUS_VERIFYING,

                prodOwner: {
                    _deleted: false,
                    banned: false
                }
            },
            relations: {
                prodOwner: true
            },
            order: {
                prodStatusUpdateAt: 'asc'
            },
            select: [ 'prodID', 'prodStatusUpdateAt' ]
        })
        
        if(!product) {
            return templateResponse(res, "Product not found", 404)
        }

        templateResponse(res, product.prodID, 200)
    }

    async getVerifyingProductOwnerID(
        res: Response,
        req: Request,

        prodID: number
    ) {
        const product = await this.productRepository.findOne({
            where: {
                prodOwner: {
                    _deleted: false,
                    banned: false
                },

                prodID
            },
            relations: {
                prodOwner: true
            },
            select: [ 'prodID', 'prodOwner' ]
        })
        if(!product) {
            return templateResponse(res, "Product not found", 404)
        }

        templateResponse(res, product.prodOwner.id, 200)
    }

    async getList(res: Response, req: Request,
        categoryID: number,
        ownerID: number,

        status: any,
        moderationStatus: number,

        pagination: any) {
        // if(!categoryID && !ownerID) {
        //     templateResponse(res, 'You need to specify either categoryID or ownerID', 400)
        //     return
        // }
        let findoptions: any = {}

        let category: Category
        let user

        findoptions.where = {}
        if(categoryID) {
            category = await this.categoryService.get(categoryID)
            if(!category) {
                templateResponse(res, 'Category with this categoryID not found', 404)
                return
            }

            let categories = []
            categories.push({ categoryID: category.categoryID })

            category.categorySubcategories.map(item => {
                categories.push({ categoryID: item.categoryID })
                item.categorySubcategories.map(sub => {
                    categories.push({ categoryID: sub.categoryID })
                })
            })

            findoptions.where.prodCategory = categories
        }
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

            findoptions.where.prodOwner = user
        }

        if(status) {
            findoptions.where.prodStatus = status
            if(parseInt(status) === enumProductStatus.PRODUCT_STATUS_BANNED
                && !RolePrivilegesVerify('/moderation/product/ban', req)) {
                return templateResponse(res, "You don't have access", 403)
            }
            if(parseInt(status) === enumProductStatus.PRODUCT_STATUS_DELETED
                && !RolePrivilegesVerify('/moderation/product/delete', req)) {
                return templateResponse(res, "You don't have access", 403)
            }
        }
        if(moderationStatus) {
            findoptions.where.prodModerationStatus = moderationStatus
            if(moderationStatus == enumProductModerationStatus.PRODUCT_MODERATION_STATUS_PROBLEM
                && !status) {
                findoptions.where.prodStatus = And(Not(enumProductStatus.PRODUCT_STATUS_DELETED), Not(enumProductStatus.PRODUCT_STATUS_BANNED))
            }
        }

        if(pagination && pagination.limit && pagination.page) findoptions.skip = (pagination.page - 1) * pagination.limit
        if(pagination && pagination.limit) findoptions.take = pagination.limit

        findoptions.relations = {
            prodCategory: true,
            prodOwner: true
        }

        const products: Product[] = await this.productRepository.find(findoptions)
        templateResponse(res, products, 200)
    }

    // put
    async verdict(
        prodID: number,

        status: number,
        comment: string,

        res: Response,
        req: Request
    ) {
        if(!prodID || isNaN(prodID) || status === undefined
            || !comment || !comment.length) {
            templateResponse(res, 'Fields should not be empty (prodID, status, comment)', 400)
            return
        }

        if(status < enumProductModerationStatus.PRODUCT_MODERATION_STATUS_VERIFYING
            || status > enumProductModerationStatus.PRODUCT_MODERATION_STATUS_PROBLEM) {
            templateResponse(res, 'Incorrect data [status]', 400)
            return
        }
        if(comment.length < 10 || comment.length > 512) {
            templateResponse(res, 'Incorrect data [comment]', 400)
            return
        }

        const product: Product = await this.get(prodID, null, req)
        if(!product) {
            templateResponse(res, 'Product with this prodID not found', 404)
            return
        }
        
        if(product.prodStatus === enumProductStatus.PRODUCT_STATUS_DELETED
            || product.prodStatus === enumProductStatus.PRODUCT_STATUS_BANNED) {
            return templateResponse(res, "It is impossible to pronounce a verdict on this product", 400)
        }

        delete product.prodForms

        const snapshotID = await this.createSnapshot(product)
        if(!snapshotID) {
            return templateResponse(res, "Failed to change moderation status (failed to create snapshot)", 500)
        }

        const moderationHistoryID = await this.createModerationHistory(product, { id: snapshotID } as any)
        if(!moderationHistoryID) {
            return templateResponse(res, "Failed to change moderation status (failed to create moderation history)", 500)
        }

        product.prodModerator = req['user']
        product.prodModerationDate = new Date()
        product.prodModerationStatus = status
        product.prodModerationComment = comment

        await this.productRepository.update({ prodID: product.prodID }, {
            prodModerator: product.prodModerator,
            prodModerationDate: product.prodModerationDate,
            prodModerationStatus: product.prodModerationStatus,
            prodModerationComment: product.prodModerationComment,
        })
        this.logsService.create('user', `Модератор изменил модераторский статус продукта на ${status}. Комментарий: ${comment}`, {
            userData: req['user'],
            productData: product
        })

        if(status === enumProductModerationStatus.PRODUCT_MODERATION_STATUS_PROBLEM) {
            this.userNotificationsService.send('productModStatusProblem', product.prodOwner, { product: product })
        }
        
        templateResponse(res, "", 200)
    }

    async delete(
        prodID: number,
        comment: string,

        res: Response,
        req: Request
    ) {
        if(!prodID || !comment) {
            templateResponse(res, 'Fields should not be empty (prodID, comment)', 400)
            return
        }

        if(prodID < 1 || isNaN(prodID)) {
            templateResponse(res, 'Incorrect data [prodID]', 400)
            return
        }
        if(comment.length < 10 || comment.length > 512) {
            templateResponse(res, 'Incorrect data [comment]', 400)
            return
        }

        const product = await this.get(prodID, null, req)
        if(!product) {
            templateResponse(res, 'Product with this prodID not found', 404)
            return
        }

        const snapshotID = await this.createSnapshot(product)
        if(!snapshotID) {
            return templateResponse(res, "Failed to change moderation status (failed to create snapshot)", 500)
        }

        const moderationHistoryID = await this.createModerationHistory(product, { id: snapshotID } as any)
        if(!moderationHistoryID) {
            return templateResponse(res, "Failed to change moderation status (failed to create moderation history)", 500)
        }

        const status = product.prodStatus

        product.prodStatus = status === enumProductStatus.PRODUCT_STATUS_DELETED ? enumProductStatus.PRODUCT_STATUS_ACTIVE : enumProductStatus.PRODUCT_STATUS_DELETED
        product.prodStatusUpdateAt = new Date()
        product.prodModerationStatus = enumProductModerationStatus.PRODUCT_MODERATION_STATUS_PROBLEM
        product.prodModerator = req['user']
        product.prodModerationComment = comment
        product.prodModerationDate = new Date()

        await this.productRepository.update({ prodID: product.prodID }, {
            prodStatus: product.prodStatus,
            prodStatusUpdateAt: product.prodStatusUpdateAt,
            prodModerationStatus: product.prodModerationStatus,
            prodModerator: product.prodModerator,
            prodModerationComment: product.prodModerationComment,
            prodModerationDate: product.prodModerationDate
        })

        templateResponse(res, '', 200)
        this.logsService.create('user', `Модератор ${status === enumProductStatus.PRODUCT_STATUS_DELETED ? 'восстановил' : 'удалил'} продукт. Причина: ${comment}`, {
            userData: req['user'],
            productData: product
        })

        if(status !== enumProductStatus.PRODUCT_STATUS_DELETED) {
            this.userNotificationsService.send('productDeleted', product.prodOwner, { product: product })
        }
    }
    async ban(
        prodID: number,
        comment: string,

        res: Response,
        req: Request
    ) {
        if(!prodID || !comment || !comment.length) {
            templateResponse(res, 'Fields should not be empty (prodID, comment)', 400)
            return
        }

        if(prodID < 1 || isNaN(prodID)) {
            templateResponse(res, 'Incorrect data [prodID]', 400)
            return
        }
        if(comment.length < 10 || comment.length > 512) {
            templateResponse(res, 'Incorrect data [reason, comment]', 400)
            return
        }

        const product = await this.get(prodID, null, req)
        if(!product) {
            templateResponse(res, 'Product with this prodID not found', 404)
            return
        }

        const snapshotID = await this.createSnapshot(product)
        if(!snapshotID) {
            return templateResponse(res, "Failed to change moderation status (failed to create snapshot)", 500)
        }

        const moderationHistoryID = await this.createModerationHistory(product, { id: snapshotID } as any)
        if(!moderationHistoryID) {
            return templateResponse(res, "Failed to change moderation status (failed to create moderation history)", 500)
        }

        const status = product.prodStatus

        product.prodStatus = status === enumProductStatus.PRODUCT_STATUS_BANNED ? enumProductStatus.PRODUCT_STATUS_ACTIVE : enumProductStatus.PRODUCT_STATUS_BANNED
        product.prodStatusUpdateAt = new Date()
        product.prodModerationStatus = enumProductModerationStatus.PRODUCT_MODERATION_STATUS_PROBLEM
        product.prodModerator = req['user']
        product.prodModerationComment = comment
        product.prodModerationDate = new Date()

        await this.productRepository.update({ prodID: product.prodID }, {
            prodStatus: product.prodStatus,
            prodStatusUpdateAt: product.prodStatusUpdateAt,
            prodModerationStatus: product.prodModerationStatus,
            prodModerator: product.prodModerator,
            prodModerationComment: product.prodModerationComment,
            prodModerationDate: product.prodModerationDate
        })

        templateResponse(res, '', 200)
        this.logsService.create('user', `Модератор ${status === enumProductStatus.PRODUCT_STATUS_BANNED ? 'разблокировал' : 'заблокировал'} продукт. Причина: ${comment}`, {
            userData: req['user'],
            productData: product
        })

        if(status !== enumProductStatus.PRODUCT_STATUS_BANNED) {
            this.userNotificationsService.send('productBanned', product.prodOwner, { product: product })
        }
    }

    async edit(
        prodID: number,
        categoryID: number,

        forms: any, // json
        images: any, // array
        description: string,

        res: Response,
        req: Request
    ) {
        // if(!prodID || !forms || !images || !description || !categoryID) {
        //     templateResponse(res, 'Fields should not be empty (prodID, forms, images, description, categoryID)', 400)
        //     return
        // }

        // if(prodID < 1 || isNaN(prodID)) {
        //     templateResponse(res, 'Incorrect data [prodID]', 400)
        //     return
        // }
        // if(categoryID < 1 || isNaN(categoryID)) {
        //     templateResponse(res, 'Incorrect data [categoryID]', 400)
        //     return
        // }
        // if(!isValidJSON(forms)) {
        //     templateResponse(res, 'Incorrect data [forms]', 400)
        //     return
        // }
        // if(!isValidJSON(images)) {
        //     templateResponse(res, 'Incorrect data [images]', 400)
        //     return
        // }
        // if(description.length < 0 || description.length > 255) {
        //     templateResponse(res, 'Incorrect data [description]', 400)
        //     return
        // }

        // images = JSON.parse(images)
        // forms = JSON.parse(forms)

        // if(Object.prototype.toString.call(forms) !== '[object Object]') {
        //     templateResponse(res, 'Incorrect data [forms]', 400)
        //     return
        // }
        // if(Object.prototype.toString.call(images) !== '[object Array]') {
        //     templateResponse(res, 'Incorrect data [images]', 400)
        //     return
        // }

        // const product = await this.productService.get(prodID)
        // if(!product) {
        //     templateResponse(res, 'Product with this ProdID not found', 404)
        //     return
        // }

        // if(product.prodStatus === enumProductStatus.PRODUCT_STATUS_BANNED) {
        //     templateResponse(res, 'This product is blocked', 400)
        //     return
        // }

        // const category = await this.categoryService.get(categoryID)
        // if(!category) {
        //     templateResponse(res, 'Category with this CategoryID not found', 404)
        //     return
        // }

        // const oldcategory = product.prodCategory

        // product.prodCategory = category
        // product.prodForms = forms
        // product.prodImages = images
        // product.prodDescription = description

        // await this.productRepository.save(product)
        // templateResponse(res, "", 200)

        // this.logsService.create('user', `Модератор отредактировал продукт`, {
        //     userData: req['user'],
        //     productData: product
        // })
        // if(oldcategory !== category) {
        //     this.logsService.create('user', `Модератор переместил продукт в другую категорию [Старая категория: #${oldcategory.categoryID}]`, {
        //         userData: req['user'],
        //         productData: product,
        //         categoryData: category
        //     })
        // }
    }


    async createSnapshot(product: Product): Promise<number> {
        if(!product || !product.prodID) throw new Error("[Moderation.Product.Service.createSnapshot] 'product' is not specified")

        product = await this.productRepository.findOne({
            where: {
                prodID: product.prodID
            },
            relations: {
                prodCategory: true
            },
            select: [ 'prodID', 'prodStatus', 'prodTitle', 'prodGeo', 'prodCurrency', 'prodPrice', 'prodDescription', 'prodForms' ]
        })
        if(!product) throw new Error("[Moderation.Product.Service.createSnapshot] Product not found")
        
        const insert = await this.productSnapshotRepository.insert({
            product: {
                prodID: product.prodID
            },
            productStatus: product.prodStatus,
            productTitle: product.prodTitle,
            productGeolocation: product.prodGeo,
            productCurrency: product.prodCurrency,
            productPrice: product.prodPrice,
            productDescription: product.prodDescription,
            productForms: product.prodForms,
            categoryForms: product.prodCategory.categoryForms
        })

        if(!insert) {
            throw new Error("[Moderation.Product.Service.createSnapshot] Failed to create snapshot")
        }

        return insert.raw.insertId
    }
    async createModerationHistory(product: Product, snapshot: ProductSnapshotEntity): Promise<number> {
        if(!product || !product.prodID) throw new Error("[Moderation.Product.Service.createModerationHistory] 'product' is not specified")
        if(!snapshot || !snapshot.id) throw new Error("[Moderation.Product.Service.createModerationHistory] 'snapshot' is not specified")

        product = await this.productRepository.findOne({
            where: {
                prodID: product.prodID
            },
            relations: {
                prodModerator: true
            },
            select: [ 'prodID', 'prodModerator', 'prodModerationStatus', 'prodModerationComment', 'prodModerationDate' ]
        })
        if(!product) throw new Error("[Moderation.Product.Service.createModerationHistory] Product not found")

        snapshot = await this.productSnapshotRepository.findOne({
            where: {
                id: snapshot.id
            },
            select: [ 'id' ]
        })
        if(!snapshot) throw new Error("[Moderation.Product.Service.createModerationHistory] Product snapshot not found")

        const insert = await this.productModerationHistoryRepository.insert({
            product: {
                prodID: product.prodID
            },
            snapshot: {
                id: snapshot.id
            },
            moderator: product.prodModerator,
            moderationStatus: product.prodModerationStatus,
            moderationComment: product.prodModerationComment,
            moderationDate: product.prodModerationDate
        })
        if(!insert) {
            throw new Error("[Moderation.Product.Service.createModerationHistory] Failed to create moderation history")
        }

        return insert.raw.insertId
    }
}