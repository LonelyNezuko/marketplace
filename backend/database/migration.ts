import { ConfigModule } from "@nestjs/config";
import { DataSource, DataSourceOptions } from "typeorm";

const NODEENV: string = process.env.NODE_ENV
ConfigModule.forRoot({
    envFilePath: !NODEENV ? '.env' : `.${NODEENV}.env`
})

const dataSourceOptions: DataSourceOptions = {
    type: 'mysql',
    host: process.env.db_mysql_host,
    port: parseInt(process.env.mysql_port),
    username: process.env.db_mysql_username,
    password: process.env.db_mysql_password,
    database: process.env.db_mysql_database,
    synchronize: false,
    bigNumberStrings: true,
    logging: false,
    entities: ['**/*.entity{ .ts,.js}'],
    migrations: ['dist/migrations/*{.ts,.js}']
}

const dataSource = new DataSource(dataSourceOptions)
export default dataSource