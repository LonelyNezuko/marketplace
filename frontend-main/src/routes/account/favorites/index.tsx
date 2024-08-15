import React from 'react'
import { Link } from 'react-router-dom'

import AdCart, { AdCartLoaderDiv } from '@components/adcart'

import './index.scss'
import { Language } from '@modules/Language'
import { API } from '@modules/API'
import { notify } from '@modules/Notify'

import CONFIG from '@config'
import { isValidJSON } from '@modules/functions/isValidJSON'
import { RouteAccountProps } from '..'
import SetRouteTitle from '@modules/SetRouteTitle'
import ProductDTO from '@dto/product.dto'
import PhoneHeaderTitle from '@components/phoneHeaderTitle'
import { CustomStorage } from '@modules/CustomStorage'

interface ProductDTOWithOffFavorite extends ProductDTO {
    _favoriteStatus_?: boolean
}

export default function RouteAccountFavorites({
    loader,
    account
}: RouteAccountProps) {
    SetRouteTitle(Language("ROUTE_TITLE_ACCOUNT_FAVORITES"))
    
    const [ loaderProducts, setLoaderProducts ] = React.useState(true)
    const [ products, setProducts ] = React.useState<Array<ProductDTOWithOffFavorite>>([])

    React.useEffect(() => {
        setLoaderProducts(true)
        if(!loader
            && account) {
            let favorites: number[] = new CustomStorage().get('favorites_ads')
            if(!favorites) favorites = []

            API({
                url: '/defaultapi/user/favorites',
                type: 'get'
            }).done(result => {
                if(result.statusCode === 200) {
                    const prodList: Array<ProductDTOWithOffFavorite> = result.message
                    prodList.map(item => item._favoriteStatus_ = true)

                    setProducts(result.message)
                    setLoaderProducts(false)
                }
                else notify("(accountFavorites) /user/favorites: " + result.message, { debug: true })
            })
        }
    }, [loader, account])

    return (
        <div className="route" id="accountPageFavorites">
            <div className="accountPageBody">
                <div className="block blockads">
                    {window.isPhone ? (
                        <PhoneHeaderTitle text={Language("ACCOUNT_PAGEINDEX_FAVORITESADS_TITLE")} outBodyPadding={true} />
                    ) : (
                        <h1 className="blocktitle">{Language("ACCOUNT_PAGEINDEX_FAVORITESADS_TITLE")}</h1>
                    )}
                    <div className="list wrap transparent">
                        {loaderProducts ? (
                            <>
                                <AdCartLoaderDiv type={"vertical"} size={"min"} />
                                <AdCartLoaderDiv type={"vertical"} size={"min"} />
                                <AdCartLoaderDiv type={"vertical"} size={"min"} />
                                <AdCartLoaderDiv type={"vertical"} size={"min"} />
                            </>
                        ) : ''}

                        {!loaderProducts && products.map((item: ProductDTOWithOffFavorite, i) => {
                            return (
                                <AdCart cartLink={"/ad"} key={i} product={item} type={"vertical"} size={"min"}
                                    // onChangeFavorite={(status, product) => {
                                    //     setProducts(old => {
                                    //         const index = old.findIndex(p => p.prodID === product.prodID)
                                    //         if(index !== -1) {
                                    //             old[i]._favoriteStatus_ = status
                                    //         }

                                    //         return [...old]
                                    //     })
                                    // }}
                                />
                            )
                        })}
                        {(!products.length && !loaderProducts) && (
                            <div className="noads">
                                <h1>{Language('ACCOUNT_NO_ADS_FAVORITES')}</h1>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}