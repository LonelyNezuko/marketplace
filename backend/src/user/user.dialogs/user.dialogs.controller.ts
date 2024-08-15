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
import { AuthGuard } from 'common/guards/authGuard';
import { Request, Response } from "express";
import { UserDialogsService } from './user.dialogs.service';
import { IsUserBanned } from 'common/guards/isUserBanned';

@Controller('defaultapi/user/dialogs')
export class UserDialogsController {
    constructor(
        private readonly messagesService: UserDialogsService
    ) {}

    // get
    @UseGuards(AuthGuard)
    @Get()
    getDialogs(
        @Res() res: Response,
        @Req() req: Request,

        @Query('pagination') pagination?: any
    ) {
        return this.messagesService.getDialogList(res, req, pagination)
    }

    @UseGuards(AuthGuard)
    @Get('/dialog')
    getMessages(
        @Res() res: Response,
        @Req() req: Request,

        @Query('dialogid') dialogID: number
    ) {
        return this.messagesService.getDialog(dialogID, res, req)
    }

    @UseGuards(AuthGuard)
    @Get('/message/allunreadcounts')
    getAllUnreadMessagesCount(
        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.messagesService.getAllUnreadMessagesCount(res, req)
    }


    // post
    @UseGuards(AuthGuard, IsUserBanned)
    @Post('/message')
    sendMessage(
        @Res() res: Response,
        @Req() req: Request,

        @Body('text') text: string,
        @Body('attachments') attachments: any, // json simple array

        @Body('usersid') usersID?: any, // json simply array
        @Body('dialogid') dialogID?: number
    ) {
        return this.messagesService.sendMessage(res, req, text, attachments, usersID, dialogID)
    }


    // put
    @UseGuards(AuthGuard)
    @Put('/message/read')
    messageRead(
        @Res() res: Response,
        @Req() req: Request,

        @Body('messageids') messageids?: number[],
        @Body('dialogid') dialogid?: number
    ) {
        return this.messagesService.messageRead(messageids, dialogid, res, req)
    }
}