import { 
    Controller,
    
    Get,
    Post,
    Put,
    Delete,
    
    Param,
    Query,
    Body,

    Res,
    Req, 
    UseGuards} from '@nestjs/common';
import { CategoryService } from './category.service';
import { AuthGuard } from 'common/guards/authGuard';
import { Request, Response } from "express";
import { RoleGuard } from 'common/guards/roleGuard';
import { RolePrivilegesGuard } from 'common/guards/rolePrivilegesGuard';

@Controller('defaultapi/category')
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) {}

    // @UseGuards(AuthGuard)
    @Get()
    get(
        @Res() res: Response,
        @Req() req: Request,
        
        @Query('name') name?: string,
        @Query('id') id?: number,
        @Query('nameorid') nameorid?: any) {
        let value: string | number = nameorid

        if(name) value = name
        else if(id) value = id

        return this.categoryService.get(value, res, req)
    }

    // @UseGuards(AuthGuard)
    @Get('all')
    getAll(@Res() res: Response) {
        return this.categoryService.getAll(res)
    }

    // @UseGuards(AuthGuard)
    @Get('popular')
    getPopular(
        @Res() res: Response,

        @Query('withoutPopularParent') withoutPopularParent?: boolean
    ) {
        return this.categoryService.getPopular(res, withoutPopularParent)
    }
    // @UseGuards(AuthGuard)
    @Get('popular/withoutparent')
    getPopularWithoutParent(
        @Res() res: Response,

        @Query('limit') limit?: number
    ) {
        return this.categoryService.getPopularWithoutParent(res, limit)
    }
}