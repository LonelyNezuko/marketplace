import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WebSocketGateway } from '@nestjs/websockets';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Socket } from 'socket.io'

import * as bodyParser from 'body-parser'
import CONFIG_GATEWAY from 'common/configs/gateway.config';
import { User } from './user/user.entity';

declare global {
    namespace Express {
        interface Request {
            user: User
        }
    }
    interface String {
        stringLettersNumbers(): string
        lastIndexOfEnd(string: string): string
    }
}

String.prototype.stringLettersNumbers = function() {
    return this.replace(/[^a-zа-яA-ZА-Я0-9\s!?]+/g, "")
}
String.prototype.lastIndexOfEnd = function(string) {
    var io = this.lastIndexOf(string);
    return io == -1 ? -1 : io + string.length;
}

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });

    if(process.env.NODE_ENV === 'production') {
        app.enableCors({
            origin: ["https://moder.iboot.uk", "https://iboot.uk", "https://admin.iboot.uk"],
            methods: ["GET", "PUT", "POST", "DELETE"]
        })
    }
    else if(process.env.NODE_ENV === 'development') {
        app.enableCors({
            origin: "*",
            methods: ["GET", "PUT", "POST", "DELETE"]
        })
    }

    app.use(bodyParser.json({ limit: '50mb' }))
    app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))

    app.set('trust proxy', true)

    await app.listen(process.env.PORT); 

    console.log(`Start in ${process.env.PORT} port. ENV: ${process.env.NODE_ENV}. Gateway port: ${CONFIG_GATEWAY.port}`)
}

bootstrap();
