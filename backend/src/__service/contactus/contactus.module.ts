import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ServiceContactUs } from "./contactus.entity";
import { ContactUsController } from "./contactus.controller";
import { ContactUsService } from "./contactus.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([ ServiceContactUs ])
    ],
    providers: [ ContactUsService ],
    controllers: [ ContactUsController ]
})
export class ContactUsModule {}