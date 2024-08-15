import { Body, Controller, Get, Post, Req, Res } from "@nestjs/common";
import { ContactUsService } from "./contactus.service";
import { Request, Response } from "express";

@Controller('defaultapi/service/contactus')
export class ContactUsController {
    constructor(
        private readonly contactusService: ContactUsService
    ) {}

    @Post()
    send(
        @Body('name') name: string,
        @Body('email') email: string,
        @Body('topic') topic: string,
        @Body('text') text: string,

        @Res() res: Response,
        @Req() req: Request
    ) {
        return this.contactusService.send(name, email, topic, text, res, req)
    }
}