import { Storage } from 'src/__service/storage/storage.entity';
import { Product } from 'src/product/product.entity';
// import { Reports } from 'src/reports/reports.entity';
import { Role } from 'src/role/role.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany, ManyToMany, ManyToOne, JoinColumn, JoinTable } from 'typeorm';
import { UserNotifications } from './user.notifications/user.notifications.entity';
import { ModerationReportEntity } from 'src/moderation/moderation.report/moderation.report.entity';
import { ModerationSupportEntity } from 'src/moderation/moderation.support/moderation.support.entity';


export default interface AvatarDTO {
    image: string
    position: {
        x: number,
        y: number
    }
    size: number
}

export interface UserPrivacySettings {
    showBirthDate: 'all' | 'daymonth' | 'hide',
    showGender: boolean,
    showCity: boolean,
    canCall: boolean
}
const userPrivacySettingsDefault: UserPrivacySettings = {
    showBirthDate: 'all',
    showGender: true,
    showCity: true,
    canCall: true
}

export interface UserSecuritySettings {
    signinEmailVerify: boolean
}
const userSecuritySettingsDefault: UserSecuritySettings = {
    signinEmailVerify: false
}

export interface UserNotifySettings {
    showOnSite: boolean,
    soundNotify: boolean,
    notifyOnEmail: boolean
}
const userNotifySettingsDefault: UserNotifySettings = {
    showOnSite: true,
    soundNotify: true,
    notifyOnEmail: true
}

export interface UserNotifySettingsParams {
    dialogs: boolean,
    raiting: boolean,
    reactions: boolean,
    changeProducts: boolean,
    support: boolean
    report: boolean
}
const userNotifySettingsParamsDefault: UserNotifySettingsParams = {
    dialogs: true,
    raiting: true,
    reactions: true,
    changeProducts: true,
    support: true,
    report: true
}

export interface UserGeolocation {
    city: string
    country: string
    state: string
    street: string
    housenumber: string | number,
    cityUniqueID?: string,

    lat: number,
    lng: number
}
export const userGeolocationDefault: UserGeolocation = {
    city: 'London',
    country: "United Kingdom",
    state: null,
    street: null,
    housenumber: null,

    lat: 51.505,
    lng: -0.09
}


export type OnlineStatusWhere = 'main' | 'moderation' | 'admin'

@Entity({ name: 'users', schema: 'public' })
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ nullable: true })
    email: string

    @Column({ default: false })
    emailVerify: boolean

    @Column({ default: 0 })
    emailVerifyLastSend: number

    @Column({ default: null, nullable: true })
    changeEmailNew: string

    @Column({ default: 0 })
    changeEmailVerifyLastSend: number

    @Column()
    password: string

    @Column('simple-json')
    name: [string, string]

    @Column()
    fullname: string

    // @Column({ default: 'None' })
    // phoneNumber: string

    @CreateDateColumn()
    createAt: Date

    @Column()
    regIP: string

    @Column('simple-json')
    regGeo: UserGeolocation

    @ManyToMany(() => Role, {
        createForeignKeyConstraints: false
    })
    @JoinTable()
    roles: Role[]

    @Column('simple-json', { default: JSON.stringify({ image: '/assets/avatars/default.png', size: '100', position: { x: 0, y: 0 } }) })
    avatar: AvatarDTO

    @Column('float', { default: 0 })
    rating: number

    @OneToMany(() => ModerationReportEntity, reports => reports.creator, {
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    reportList: ModerationReportEntity[]

    @OneToMany(() => ModerationSupportEntity, reports => reports.creator, {
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    supportList: ModerationSupportEntity[]

    @ManyToMany(() => Product, {
        createForeignKeyConstraints: false
    })
    @JoinTable()
    viewProducts: Product[]

    @OneToMany(() => Product, product => product.prodOwner, {
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    products: Product[]

    @Column({ default: '', length: "24" })
    signatureProfileText: string

    @ManyToMany(() => Product, {
        createForeignKeyConstraints: false
    })
    @JoinTable()
    favoritesProducts: Product[]

    @OneToMany(() => Storage, storage => storage.owner)
    @JoinColumn()
    __serviceStorageList: Storage[]

    @Column({ default: -1 })
    gender: number

    @Column({ default: '0' })
    birthDate: string

    @Column('simple-json', { default: JSON.stringify(userPrivacySettingsDefault) })
    privacySettings: UserPrivacySettings

    @Column('simple-json', { default: JSON.stringify(userSecuritySettingsDefault) })
    securitySettings: UserSecuritySettings

    @CreateDateColumn()
    lastChangePassword: Date

    @Column('boolean', { default: false })
    authWithEmail: boolean

    @Column('boolean', { default: false })
    authWithPhone: boolean

    @Column('simple-json', { default: JSON.stringify(userNotifySettingsDefault) })
    notifySettings: UserNotifySettings

    @Column('simple-json', { default: JSON.stringify(userNotifySettingsParamsDefault) })
    notifySettingsParams: UserNotifySettingsParams

    @Column({ default: false })
    onlineStatus: boolean

    @Column({ default: null, nullable: true })
    onlineStatusWhere: OnlineStatusWhere

    @CreateDateColumn()
    onlineStatusDate: Date

    @Column('simple-json', { default: JSON.stringify(userGeolocationDefault) })
    geolocation: UserGeolocation

    @Column()
    currency: string

    @ManyToMany(() => UserNotifications, {
        createForeignKeyConstraints: false
    })
    @JoinTable()
    readNotifications: UserNotifications[]

    @ManyToMany(() => UserNotifications, {
        createForeignKeyConstraints: false
    })
    @JoinTable()
    deleteSystemNotifications: UserNotifications[]

    @Column('simple-array', { default: JSON.stringify([]) })
    searchHistory: string[]

    // banned
    @Column({ default: false })
    banned: boolean

    @ManyToOne(() => User, {
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    bannedModerator: User

    @Column('text', { default: null, nullable: true })
    bannedComment: string

    @CreateDateColumn({ default: null, nullable: true })
    bannedExpires: Date

    // report banned
    @Column({ default: false })
    reportBanned: boolean

    @ManyToOne(() => User, {
        createForeignKeyConstraints: false
    })
    @JoinColumn()
    reportBannedModerator: User

    @Column('text', { default: null, nullable: true })
    reportBannedComment: string

    @CreateDateColumn({ default: null, nullable: true })
    reportBannedExpires: Date

    // 

    @CreateDateColumn({ default: null, nullable: true })
    lastSendModerationEmailCode: Date


    @Column({ default: false })
    _deleted: boolean

    @Column({ default: null, nullable: true })
    _deletedReason: string

    @Column({ default: null, nullable: true })
    _deletedReasonText: string

    @Column({ default: null, nullable: true })
    _deletedEmail: string

    @Column('simple-json', { default: null, nullable: true })
    _deletedAvatar: AvatarDTO

    @Column('simple-array', { default: null, nullable: true })
    _deletedName: [string, string]



    productsCount?: number
    productsActiveCount?: number
    productsClosedCount?: number
    productsBannedCount?: number
    productsForgotCount?: number
    productsProblemsCount?: number
    productsVerifyingCount?: number
}