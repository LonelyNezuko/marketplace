import { Product } from "src/product/product.entity";
import { ProductService } from "src/product/product.service";
import { User } from "src/user/user.entity";
import { DataSource, IsNull, Not } from "typeorm";

export default async function DatabaseInit(dataSource: DataSource) {
    console.log('[Database] Init successfuly')

    // установка product.prodKeyWords, 24.04.2024
    // const products: Product[] = await dataSource
    //     .createEntityManager()
    //     .find(Product, {
    //         relations: {
    //             prodCategory: true
    //         }
    //     })
    // if(products.length) {
    //     let count = 0

    //     await Promise.all(products.map(async product => {
    //         if(!product.prodKeyWords) {
    //             product.prodKeyWords = await ProductService.setKeyWords(product)
    //             count ++
    //         }
    //     }))

    //     if(count) {
    //         await dataSource
    //             .createEntityManager()
    //             .save(Product, products)
    //         console.log(`product.prodKeyWords accepted!!! [count: ${count} / ${products.length}]`)
    //     }
    // }
}