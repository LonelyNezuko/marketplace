import { 
    Controller,
    
    Get,
    Post,
    Put,
    Patch,
    Delete,
    
    Param,
    Query,
    Body,

    Res,
    Req, 
    UseGuards} from '@nestjs/common';
import { RoleService } from './role.service';
import { Response, Request } from 'express';
import { AuthGuard } from 'common/guards/authGuard';
import { RoleGuard } from 'common/guards/roleGuard';
import { RolePrivilegesGuard } from 'common/guards/rolePrivilegesGuard';

@Controller('defaultapi/role')
export class RoleController {
    constructor(private readonly roleService: RoleService) {}

    // get
    @UseGuards(AuthGuard, new RolePrivilegesGuard('/role'))
    @Get('get')
    get(
        @Query('key') key: string,

        @Req() req: Request,
        @Res() res: Response
    ) {
        return this.roleService.get(key, res)
    }

    @UseGuards(AuthGuard, new RolePrivilegesGuard('/role'))
    @Get('')
    getList(
        @Req() req: Request,
        @Res() res: Response,

        @Query('moreindex') moreIndex?: number
    ) {
        return this.roleService.getList(res, req, moreIndex)
    }

    // post
    @UseGuards(AuthGuard, new RolePrivilegesGuard('/role/create'))
    @Post('/create')
    create(
        @Body('key') key: string,
        @Body('privileges') privileges: string[],
        @Body('name') name: string,
        @Body('nameTranslate') nameTranslate: any, // json object
        @Body('color') color: string[],

        @Req() req: Request,
        @Res() res: Response
    ) {
        return this.roleService.create(key, privileges, name, nameTranslate, color, req, res)
    }

    // delete
    @UseGuards(AuthGuard, new RolePrivilegesGuard('/role/delete'))
    @Delete('/delete')
    delete(
        @Body('key') key: string,

        @Req() req: Request,
        @Res() res: Response
    ) {
        return this.roleService.delete(key, req, res)
    }

    // put
    @UseGuards(AuthGuard, new RolePrivilegesGuard('/role/update'))
    @Put('/update')
    update(
        @Body('key') key: string,
        @Body('privileges') privileges: string[],
        @Body('name') name: string,
        @Body('nameTranslate') nameTranslate: any, // json object
        @Body('color') color: string[],

        @Req() req: Request,
        @Res() res: Response
    ) {
        return this.roleService.update(key, privileges, name, nameTranslate, color, req, res)
    }
    @UseGuards(AuthGuard, new RolePrivilegesGuard('/role/update/index'))
    @Put('/update/index')
    updateIndex(
        @Body('key') key: string,
        @Body('index') index: number,

        @Req() req: Request,
        @Res() res: Response
    ) {
        return this.roleService.updateIndex(key, index, req, res)
    }

    // users
    @UseGuards(AuthGuard, new RolePrivilegesGuard('/role/user/set'))
    @Put('/user/set')
    setUser(
        @Body('userid') userid: number,
        @Body('key') key: string,

        @Req() req: Request,
        @Res() res: Response
    ) {
        return this.roleService.userSet(userid, key, req, res)
    }

    @UseGuards(AuthGuard, new RolePrivilegesGuard('/role/user/remove'))
    @Delete('/user/remove')
    removeUser(
        @Body('userid') userid: number,
        @Body('key') key: string,

        @Req() req: Request,
        @Res() res: Response
    ) {
        return this.roleService.userRemove(userid, key, req, res)
    }
}