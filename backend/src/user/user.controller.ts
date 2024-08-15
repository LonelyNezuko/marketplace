import { 
    Controller,
    
    Get,
    Post,
    Put,
    
    Param,
    Query,
    Body,

    Res,
    Req, 
    UseGuards,
    OnModuleInit,
    Delete} from '@nestjs/common';
import { Response, Request } from 'express';

import { UserService } from './user.service';
import templateResponse from 'common/templates/response.tp';
import { AuthGuard } from 'common/guards/authGuard';
import { VerifycodesGuard } from 'common/verifycodes/verifycodesGuard';
import { UserGeolocation } from './user.entity';
import { MailerService } from 'src/__service/mailer/mailer.service';
import { ModuleRef } from '@nestjs/core';
import { GetUserReq } from 'common/guards/getUserReq';
import { UserHistoryClientData } from './user.history.entity';

@Controller('defaultapi/user')
export class UserController implements OnModuleInit {
    constructor(
        private readonly userService: UserService,
        private readonly moduleRef: ModuleRef
    ) {}

    private mailerService: MailerService
    async onModuleInit() {
        this.mailerService = this.moduleRef.get(MailerService, { strict: false })
    }

    // get
    @UseGuards(GetUserReq)
    @Get('/siteInit')
    siteInit(
        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.userService.siteInit(res, req)
    }
    @UseGuards(AuthGuard)
    @Get('/jwtcheck')
    checkJWT(
        @Res() res: Response
    ) {
        return templateResponse(res, "", 200)
    }
    @UseGuards(AuthGuard)
    @Get('/getbanned')
    getBanned(
        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.userService.getBanned(res, req)
    }

    @UseGuards(AuthGuard)
    @Get('/getbanned/desc')
    getBannedDesc(
        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.userService.getBanned(res, req, true)
    }

    @UseGuards(AuthGuard)
    @Get('')
    getUserData(
        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.userService.getUserData(res, req)
    }

    @UseGuards(AuthGuard)
    @Get('/roles')
    getUserRoles(
        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.userService.getUserRoles(res, req)
    }

    @Get('/profile')
    getProfileData(
        @Res() res: Response,
        @Req() req: Request,

        @Query('userid') userid: number
    ) {
        return this.userService.getProfileData(res, req, userid)
    }

    @UseGuards(AuthGuard)
    @Get('/favorites')
    getFavorites(
        @Res() res: Response,
        @Req() req: Request,

        @Body('limit') limit?: number
    ) {
        return this.userService.getFavoriteProducts(res, req, limit)
    }

    @UseGuards(GetUserReq)
    @Get('/recommendation')
    getRecommendation(
        @Res() res: Response,
        @Req() req: Request,

        @Query('client_geolocation') client_geolocation: UserGeolocation,

        @Query('client_productViews') client_productViews: UserHistoryClientData[],
        @Query('client_productFavorites') client_productFavorites: UserHistoryClientData[],
        @Query('client_categoryViews') client_categoryViews: UserHistoryClientData[],
        @Query('client_searchTexts') client_searchTexts: UserHistoryClientData[],

        @Query('paginationTake') paginationTake: number,
        @Query('doNotTake') doNotTake: number[]
    ) {
        return this.userService.getRecommendation(res, req, client_geolocation, client_productViews, client_productFavorites, client_categoryViews, client_searchTexts, paginationTake, doNotTake)
    }

    @UseGuards(AuthGuard)
    @Get("/search/account")
    searchAccount(
        @Res() res: Response,
        @Req() req: Request,

        @Query('name') name: string
    ) {
        return this.userService.searchAccount(res, req, name)
    }

    // put
    @UseGuards(AuthGuard)
    @Put('/favoriteproducts')
    favoriteProducts(
        @Res() res: Response,
        @Req() req: Request,

        @Body('productID') productID: number
    ) {
        return this.userService.favoriteProducts(res, req, productID)
    }

    @UseGuards(AuthGuard)
    @Put('/history/add')
    addHistory(
        @Res() res: Response,
        @Req() req: Request,

        @Body('type') type: string,

        @Body('productID') productID?: number,
        @Body('categoryID') categoryID?: number,
        @Body('searchText') searchText?: string
    ) {
        return this.userService.addHistory(res, req, type as any, productID, categoryID, searchText)
    }

    @UseGuards(AuthGuard)
    @Put('/history/update')
    updateHistory(
        @Res() res: Response,
        @Req() req: Request,

        @Body('productViews') productViews: { date: Date, id: string }[],
        @Body('productFavorites') productFavorites: { date: Date, id: string }[],
        @Body('categoryViews') categoryViews: { date: Date, id: string }[],
        @Body('searchTexts') searchTexts: { date: Date, text: string }[],
    ) {
        return this.userService.updateHistory(res, req, productViews, productFavorites, categoryViews, searchTexts)
    }


    // delete
    @UseGuards(AuthGuard)
    @Delete('/delete')
    deleteAccount(
        @Res() res: Response,
        @Req() req: Request,

        @Body('reason') reason: string,
        @Body('reasonText') reasonText: string
    ) {
        return this.userService.deleteAccount(res, req, reason, reasonText)
    }

    @UseGuards(AuthGuard)
    @Delete('/searchHistory/remove')
    removeSearchHistory(
        @Res() res: Response,
        @Req() req: Request,

        @Body('text') text: string
    ) {
        return this.userService.removeSearchHistory(res, req, text)
    }
}