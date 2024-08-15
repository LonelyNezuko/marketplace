import React from 'react'
import { Link } from 'react-router-dom'

import AdCart, { AdCartLoaderDiv } from '@components/adcart'

import './index.scss'
import { Language } from '@modules/Language'
import { API } from '@modules/API'
import { notify } from '@modules/Notify'

import CONFIG from '@config'
import { RouteAccountProps } from '..'
import SetRouteTitle from '@modules/SetRouteTitle'
import PhoneHeaderTitle from '@components/phoneHeaderTitle'

export default function RouteAccountAds({
    loader,
    account
}: RouteAccountProps) {
    SetRouteTitle(Language("ROUTE_TITLE_ACCOUNT_ADS"))

    if(loader || !account)return
    return (
        <div className="route" id="accountPageAds">
            <div className="accountPageBody">
                {window.isPhone ? (
                    <PhoneHeaderTitle text={Language("HEADER_ACCOUNT_MENU_ITEM_ADS")} outBodyPadding={true} />
                ) : ''}

                {!account.productsCount ? (
                    <div className="noads">
                        <h1>{Language('ACCOUNT_NO_ADS')}</h1>
                        <section>
                            <Link to="/placead" className="btn big">
                                <span>{Language('PLACEAD_FIRST')}</span>
                            </Link>
                        </section>
                    </div>
                ) : (
                    <>
                        <BlockedAds loader={loader} account={account} />
                        <ProblemAds loader={loader} account={account} />

                        <VeriyingAds loader={loader} account={account} />

                        <ActiveAds loader={loader} account={account} />
                        <ClosedAds loader={loader} account={account} />
                    </>
                )}
            </div>
        </div>
    )
}


function BlockedAds({
    loader,
    account
}: RouteAccountProps) {
    const [ products, setProducts ] = React.useState([])

    React.useEffect(() => {
        if(!loader) {
            API({
                url: '/defaultapi/product/list',
                type: 'get',
                data: {
                    ownerID: account.id,
                    moderationStatus: CONFIG.enumProductModerationStatus.PRODUCT_MODERATION_STATUS_PROBLEM,
                    status: CONFIG.enumProductStatus.PRODUCT_STATUS_BANNED,
                    pagination: {}
                }
            }).done(result => {
                if(result.statusCode === 200) {
                    setProducts(result.message)
                }
                else notify("(accountPageAds, BlockedAds) /products/list: " + result.message, { debug: true })
            })
        }
    }, [loader])

    return (
        <>
            {products.length ? (
                <div className="block blockads">
                    <h1 className="blocktitle">{Language("ACCOUNT_PAGEADS_BLOCKEDADS_TITLE")}</h1>
                    <div className="list wrap transparent">
                        {products.map((item, i) => {
                            return (<AdCart cartLink={"/account/ad"} product={item} key={i} type={"vertical"} size={"min"} />)
                        })}
                    </div>
                </div>
            ) : ''}
        </>
    )
}
function ProblemAds({
    loader,
    account
}) {
    const [ products, setProducts ] = React.useState([])

    React.useEffect(() => {
        if(!loader) {
            API({
                url: '/defaultapi/product/list',
                type: 'get',
                data: {
                    ownerID: account.id,
                    moderationStatus: CONFIG.enumProductModerationStatus.PRODUCT_MODERATION_STATUS_PROBLEM,
                    status: null,
                    pagination: {}
                }
            }).done(result => {
                if(result.statusCode === 200) {
                    setProducts(result.message)
                }
                else notify("(accountPageAds, ProblemAds) /products/list: " + result.message, { debug: true })
            })
        }
    }, [loader])

    return (
        <>
            {products.length ? (
                <div className="block blockads">
                    <h1 className="blocktitle">{Language("ACCOUNT_PAGEADS_PROBLEMSADS_TITLE")}</h1>
                    <div className="list wrap transparent">
                        {products.map((item, i) => {
                            return (<AdCart cartLink={"/account/ad"} product={item} key={i} type={"vertical"} size={"min"} />)
                        })}
                    </div>
                </div>
            ) : ''}
        </>
    )
}
function VeriyingAds({
    loader,
    account
}) {
    const [ products, setProducts ] = React.useState([])

    React.useEffect(() => {
        if(!loader) {
            API({
                url: '/defaultapi/product/list',
                type: 'get',
                data: {
                    ownerID: account.id,
                    moderationStatus: CONFIG.enumProductModerationStatus.PRODUCT_MODERATION_STATUS_VERIFYING,
                    status: null,
                    pagination: {}
                }
            }).done(result => {
                if(result.statusCode === 200) {
                    setProducts(result.message)
                }
                else notify("(accountPageAds, VeriyingAds) /products/list: " + result.message, { debug: true })
            })
        }
    }, [loader])

    return (
        <>
            {products.length ? (
                <div className="block blockads">
                    <h1 className="blocktitle">{Language("ACCOUNT_PAGEADS_VERIFYINGADS_TITLE")}</h1>
                    <div className="list wrap transparent">
                        {products.map((item, i) => {
                            return (<AdCart cartLink={"/account/ad"} product={item} key={i} type={"vertical"} size={"min"} />)
                        })}
                    </div>
                </div>
            ) : ''}
        </>
    )
}

function ClosedAds({
    loader,
    account
}) {
    const [ products, setProducts ] = React.useState([])

    React.useEffect(() => {
        if(!loader) {
            API({
                url: '/defaultapi/product/list',
                type: 'get',
                data: {
                    ownerID: account.id,
                    status: CONFIG.enumProductStatus.PRODUCT_STATUS_CLOSED,
                    pagination: {}
                }
            }).done(result => {
                if(result.statusCode === 200) {
                    setProducts(result.message)
                }
                else notify("(accountPageAds, ClosedAds) /products/list: " + result.message, { debug: true })
            })
        }
    }, [loader])

    return (
        <>
            {products.length ? (
                <div className="block blockads">
                    <h1 className="blocktitle">{Language("ACCOUNT_PAGEADS_CLOSEADS_TITLE")}</h1>
                    <div className="list wrap transparent">
                        {products.map((item, i) => {
                            return (<AdCart cartLink={"/account/ad"} product={item} key={i} type={"vertical"} size={"min"} />)
                        })}
                    </div>
                </div>
            ) : ''}
        </>
    )
}

function ActiveAds({
    loader,
    account
}) {
    const [ loaderAds, setLoaderAds ] = React.useState(true)
    const [ products, setProducts ] = React.useState([])

    React.useMemo(() => {
        setLoaderAds(true)
    }, [])
    React.useEffect(() => {
        if(!loader) {
            API({
                url: '/defaultapi/product/list',
                type: 'get',
                data: {
                    ownerID: account.id,
                    pagination: {}
                }
            }).done(result => {
                if(result.statusCode === 200) {
                    setProducts(result.message)
                    setLoaderAds(false)
                }
                else notify("(accountPageAds, ActiveAds) /products/list: " + result.message, { debug: true })
            })
        }
    }, [loader])

    return (
        <div className="block blockads">
            <h1 className="blocktitle">{Language("ACCOUNT_PAGEINDEX_ACTIVEADS_TITLE")}</h1>
            <div className="list wrap transparent">
                {loaderAds ? (
                    <>
                        {new Array(8).fill(0).map((item, i) => {
                            return (<AdCartLoaderDiv key={i} type={"vertical"} size={"min"} />)
                        })}
                    </>
                ) : ''}
                {products.map((item, i) => {
                    if(loaderAds)return
                    return (<AdCart cartLink={"/account/ad"} product={item} key={i} type={"vertical"} size={"min"} />)
                })}
            </div>
        </div>
    )
}