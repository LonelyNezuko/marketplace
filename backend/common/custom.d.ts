import { User } from "src/user/user.entity";

declare namespace Express {
    export interface Request {
        user: User
    }
}