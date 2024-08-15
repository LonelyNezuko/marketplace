import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SearchHistory } from "./search.entity";
import { User } from "src/user/user.entity";
import { UserSessions } from "src/user/user.sessions/user.sessions.entity";
import { SearchController } from "./search.controller";
import { SearchService } from "./search.service";
import { Product } from "src/product/product.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([ SearchHistory, User, UserSessions, Product ])
    ],
    controllers: [ SearchController ],
    providers: [ SearchService ]
})
export class SearchModule {}