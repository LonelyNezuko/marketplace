import ProductDTO from "@dto/product.dto"
import { Language } from "@modules/Language"

interface RouteProductDescriptionProps {
    product: ProductDTO,
    classes?: string
}
export default function RouteProductDescription({
    product,
    classes
}: RouteProductDescriptionProps) {
    return (
        <div className={`routeProductDescription ${classes}`}>
            <h1 className="title">{Language('PRODUCT_ID_DESCRIPTION', "описание")}</h1>
            <span className="text" dangerouslySetInnerHTML={{__html: product.prodDescription}}></span>
        </div>
    )
}