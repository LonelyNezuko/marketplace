import ProductDTO from "@dto/product.dto"
import { Language } from "@modules/Language"
import { Link } from "react-router-dom"

interface RouteProductCharacteristicsProps {
    product: ProductDTO,
    classes?: string
}
export default function RouteProductCharacteristics({
    product,
    classes
}: RouteProductCharacteristicsProps) {
    return (
        <div className={`routeProductCharacteriscts ${classes}`}>
            <h1 className="title">{Language('PRODUCT_ID_CHARACTERISTICS', "характеристика")}</h1>
            <div className="list">
                {(!product.prodCategory.categoryForms || !product.prodCategory.categoryForms.length || !product.prodForms) ? (
                    <div className="null">{Language("PRODUCT_ID_CHARACTERISTICS_NULL")}</div>
                ) : ''}
                {product.prodCategory.categoryForms && product.prodCategory.categoryForms.length ? product.prodCategory.categoryForms.map((item, i) => {
                    if(product.prodForms[item.key] === undefined)return
                    return (
                        <section className={`elem _${item.type === 'input' ? item.params.type : item.type}`} key={i}>
                            <h3 className="elemTitle">{item.nameTranslate[window.language] || item.name}:</h3>
                            {item.type === 'select' ? (
                                <span className="elemValue">
                                    {parseInt(product.prodForms[item.key]) === -1
                                        ? Language("NOT_INSTALL")
                                        : item.params.list[product.prodForms[item.key]].translate[window.language] || item.params.list[product.prodForms[item.key]].title}
                                </span>
                            ) : (
                                <span className="elemValue">
                                    {item.type === 'rangemulti'
                                        ? product.prodForms[item.key][0] + ' - ' + product.prodForms[item.key][1]
                                        : product.prodForms[item.key]}
                                </span>
                            )}
                        </section>
                    )
                }) : ''}
            </div>

            {/* {product.prodCategory.categoryForms && product.prodCategory.categoryForms.length && product.prodForms ? (
                <Link to="#" className="alllink link">{Language("ALL_CHARACTERISTICS")}</Link>
            ) : ''} */}
        </div>
    )
}