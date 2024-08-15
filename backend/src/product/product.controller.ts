import { Body, Controller, Delete, Get, Post, Put, Query, Req, Res, UploadedFiles, UseGuards, UseInterceptors } from "@nestjs/common";
import { ProductService } from "./product.service";
import { AuthGuard } from "common/guards/authGuard";
import { Request, Response } from "express";
import { GetUserReq } from "common/guards/getUserReq";
import { UserGeolocation } from "src/user/user.entity";
import { ProductFilters, ProductForms } from "./product";
import { Product } from "./product.entity";
import { FindOptionsOrder } from "typeorm";
import { FilesInterceptor } from "@nestjs/platform-express";
import CONFIG_DEFAULT from "common/configs/default.config";
import { IsUserBanned } from "common/guards/isUserBanned";

@Controller('defaultapi/product')
export class ProductController {
    constructor(private readonly productService: ProductService) {}

    // get
    @Get('/')
    get(
        @Query('prodID') prodID: number,

        @Res() res: Response,
        @Req() req: Request,
    ) {
        return this.productService.get(prodID, res, req, false)
    }

    @UseGuards(GetUserReq)
    @Get('/list/category')
    getCategoryList(
        @Res() res: Response,
        @Req() req: Request,

        @Query('categoryID') categoryID: number,

        @Query('filters') filters: ProductFilters,
        @Query('orderType') orderType: null | 'default' | 'newest' | 'pricedown' | 'priceup' | 'ownerratingup' | 'ownerratingdown',

        @Query('radius') radius: { latlng: { lat: number, lng: number }, radius: number },
        @Query('cityUniqueID') cityUniqueID: string,

        @Query('paginationTake') paginationTake?: number,
        @Query('doNotTake') doNotTake?: number[],
        @Query('onlycount') onlycount?: boolean
    ) {
        return this.productService.getCategoryList(res, req, categoryID, filters, orderType, radius, cityUniqueID, paginationTake, doNotTake, onlycount)
    }

    @UseGuards(GetUserReq)
    @Get('/list')
    getList(
        @Res() res: Response,
        @Req() req: Request,

        @Query('categoryID') categoryID?: number,
        @Query('ownerID') ownerID?: number,

        @Query('filters') filters?: ProductFilters,

        @Query('radius') radius?: { latlng: { lat: number, lng: number }, radius: number },
        @Query('city') city?: string,

        @Query('status') status?: number,
        @Query('moderationStatus') moderationStatus?: number,

        @Query('attention') attention?: boolean,

        @Query('pagination') pagination?: { page: number, limit: number },

        @Query('order') order?: FindOptionsOrder<Product>,
        @Query('orderType') orderType?: any,

        @Query('relations') relations?: any,
        @Query('onlycount') onlycount?: boolean,

        @Query('doNotTake') doNotTake?: Array<number>,

        @Query('between') between?: any
    ) {
        return this.productService.getList(res, req, categoryID, ownerID, filters, radius, city, status, moderationStatus, attention, pagination, order, orderType, relations, onlycount, doNotTake, between)
    }

    // @UseGuards(AuthGuard)
    // @Get('/list/views')
    // getListViews(
    //     @Res() res: Response,
    //     @Req() req: Request,

    //     @Query('pagination') pagination?: any,
        
    //     @Query('relations') relations?: any
    // ) {
    //     return this.productService.getListViews(res, req, pagination, relations)
    // }

    // переделать
    // @UseGuards(AuthGuard)
    // @Get('')
    // get(
    //     @Query('prodID') prodID: number,

    //     @Res() res: Response,
    //     @Req() req: Request
    // ) {
    //     return this.productService.get(prodID, res, req)
    // }

    // @UseGuards(AuthGuard)
    // @Get('/all')
    // getAll(
    //     @Query('status') status: number,

    //     @Res() res: Response,
    //     @Req() req: Request
    // ) {
    //     return this.productService.getAll(status, res, req)
    // }

    @Get('/counter')
    counter(
        @Res() res: Response,
        @Req() req: Request,

        @Query('search') search?: any
    ) {
        return this.productService.counter(res, req, search)
    }

    @Get('/similar')
    getSimilerProducts(
        @Res() res: Response,
        @Req() req: Request,

        @Query('productID') productID: number,

        @Query('paginationTake') paginationTake: number,
        @Query('doNotTake') doNotTake: number[]
    ) {
        return this.productService.getSimilarProducts(res, req, productID, paginationTake, doNotTake)
    }

    // Post
    
    @UseGuards(GetUserReq)
    @Post('/set/views')
    setViews(
        @Body('prodID') prodID: number,

        @Res() res: Response,
        @Req() req: Request,
    ) {
        return this.productService.setViews(prodID, req, res)
    }

    @UseGuards(AuthGuard, IsUserBanned)
    @Post('/create')
    create(
        @Body('categoryID') categoryID: number,
        @Body('forms') forms: ProductForms,
        @Body('images') images: any,
        @Body('name') name: string,
        @Body('description') description: string,
        @Body('price') price: number,
        @Body('priceCurrency') priceCurrency: string,
        @Body('location') location: UserGeolocation,
        @Body('onlycity') onlyCity: number,

        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.productService.create(categoryID, forms, images, name, description, price, priceCurrency, location, onlyCity, res, req)
    }

    // Delete
    @UseGuards(AuthGuard, IsUserBanned)
    @Delete('/delete')
    delete(
        @Body('prodID') prodID: number,

        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.productService.delete(prodID, res, req)
    }

    // Put
    @UseGuards(AuthGuard, IsUserBanned)
    @Put('/status')
    setStatus(
        @Body('prodID') prodID: number,
        @Body('status') status: number,

        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.productService.setStatus(prodID, status, res, req)
    }

    @UseGuards(AuthGuard, IsUserBanned)
    @Put('/update')
    @UseInterceptors(FilesInterceptor('imagesLoaded[]', CONFIG_DEFAULT.placeAdMaxImages))
    update(
        @Body('prodID') prodID: number,
        @Body('forms') forms: ProductForms,
        @Body('images') images: any,
        @Body('imagesDelete') imagesDelete: any,
        @UploadedFiles() imagesLoaded: Express.Multer.File[],
        @Body('imageBackgroundIndex') imageBackgroundIndex: number,
        @Body('name') name: string,
        @Body('description') description: string,
        @Body('price') price: number,
        @Body('priceCurrency') priceCurrency: string,
        @Body('location') location: UserGeolocation,
        @Body('onlycity') onlyCity: number,

        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.productService.update(prodID, forms, images, imagesDelete, imagesLoaded, imageBackgroundIndex, name, description, price, priceCurrency, location, onlyCity, res, req)
    }
}