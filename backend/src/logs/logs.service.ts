import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Logs } from "./logs.entity";
import { Repository } from "typeorm";
import { User } from "src/user/user.entity";
import { Role } from "src/role/role.entity";
import { Category } from "src/category/category.entity";
import { Product } from "src/product/product.entity";
import { Language } from "src/__service/language/language.entity";
import { MailTemplate } from "src/__service/mailtemplate/mailtemplate.entity";
import { LogsOrigins } from "./logs.dto";
import { Storage } from "src/__service/storage/storage.entity";
import { ModerationReportEntity } from "src/moderation/moderation.report/moderation.report.entity";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { ModerationSupportEntity } from "src/moderation/moderation.support/moderation.support.entity";

@Injectable()
export class LogsService {
    constructor(
        @InjectRepository(Logs)
        private readonly logsRepository: Repository<Logs>,

        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>,
        
        @InjectRepository(Category)
        private readonly categoryRepository: Repository<Category>,

        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,

        @InjectRepository(ModerationReportEntity)
        private readonly moderationReportRepository: Repository<ModerationReportEntity>,

        @InjectRepository(ModerationSupportEntity)
        private readonly moderationSupportRepository: Repository<ModerationSupportEntity>,

        @InjectRepository(Language)
        private readonly languageRepository: Repository<Language>,

        @InjectRepository(Storage)
        private readonly storageRepository: Repository<Storage>,

        @InjectRepository(MailTemplate)
        private readonly mailTemplateRepository: Repository<MailTemplate>
    ) {}

    async create(origin: LogsOrigins, text: string, data?: {
        userData?: User,
        targetUser?: User,
        roleData?: Role,
        categoryData?: Category,
        productData?: Product,
        reportsData?: ModerationReportEntity,
        supportData?: ModerationSupportEntity,
        languageData?: Language,
        storageData?: Storage,
        mailTemplateData?: MailTemplate
    }) {
        if(!origin || !text || !text.length)return
        if(origin !== 'user')return

        if(data.userData && !data.userData.id)return

        let userExist: boolean = false
        if(data.userData) {
            userExist = await this.userRepository.exist({
                where: {
                    id: data.userData.id
                }
            })
        }
        let targetUserExist: boolean = false
        if(data.targetUser) {
            targetUserExist = await this.userRepository.exist({
                where: {
                    id: data.targetUser.id
                }
            })
        }

        let roleExist: boolean = false
        if(data.roleData) {
            roleExist = await this.roleRepository.exist({
                where: {
                    roleID: data.roleData.roleID
                }
            })
        }

        let categoryExist: boolean = false
        if(data.categoryData) {
            categoryExist = await this.categoryRepository.exist({
                where: {
                    categoryID: data.categoryData.categoryID
                }
            })
        }

        let productExist: boolean = false
        if(data.productData) {
            productExist = await this.productRepository.exist({
                where: {
                    prodID: data.productData.prodID
                }
            })
        }

        let reportsExist: boolean = false
        if(data.reportsData) {
            reportsExist = await this.moderationReportRepository.exist({
                where: {
                    id: data.reportsData.id
                }
            })
        }

        let supportExists: boolean = false
        if(data.supportData) {
            supportExists = await this.moderationSupportRepository.exist({
                where: {
                    id: data.supportData.id
                }
            })
        }

        let languageExist: boolean = false
        if(data.languageData) {
            languageExist = await this.languageRepository.exist({
                where: {
                    id: data.languageData.id
                }
            })
        }

        let storageExist: boolean = false
        if(data.storageData) {
            storageExist = await this.storageRepository.exist({
                where: {
                    id: data.storageData.id
                }
            })
        }

        let mailTemplateExist: boolean = false
        if(data.mailTemplateData) {
            mailTemplateExist = await this.mailTemplateRepository.exist({
                where: {
                    id: data.mailTemplateData.id
                }
            })
        }

        const obj: QueryDeepPartialEntity<Logs> = {
            logOrigin: origin,
            logText: text,
        }

        if(userExist) obj.logOriginUser = data.userData
        if(targetUserExist) obj.logTargetUser = data.targetUser
        if(roleExist) obj.logOriginRole = data.roleData
        if(categoryExist) obj.logOriginCategory = data.categoryData
        if(productExist) obj.logOriginProduct = data.productData
        if(reportsExist) obj.logOriginReports = data.reportsData
        if(supportExists) obj.logOriginSupport = data.supportData
        if(languageExist) obj.logOriginLanguage = data.languageData
        if(storageExist) obj.logOriginStorage = data.storageData
        if(mailTemplateExist) obj.logOriginMailtemplate = data.mailTemplateData

        this.logsRepository.insert(obj)
    }
}