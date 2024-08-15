import React from 'react'
import { Link } from 'react-router-dom'

import _MarketingBlock from '../../../components/_marketingblock'
import { Avatar } from '../../../components/avatar/avatar'
import AdCart, { AdCartLoaderDiv } from '../../../components/adcart'

import './index.scss'
import ReactionCart, { ReactionCartLoaderDiv } from '../../../components/reactioncart'

import { Language } from '../../../modules/Language'
import { API } from '../../../modules/API'
import { notify } from '../../../modules/Notify'

import { IoClose } from "react-icons/io5";
import { RouteAccountProps } from '..'
import SetRouteTitle from '@modules/SetRouteTitle'

export default function RouteAccountIndex({
    loader,
    account
}: RouteAccountProps) {
    SetRouteTitle(Language("ROUTE_TITLE_ACCOUNT"))

    return (
        <div className="route" id="accountPageIndex">
            <_MarketingBlock style={'vertical'} id="account1" type="banner" size={{width: '100%', height: "150px"}} />

            <div className="accountPageBody">
                <AccountRecommendations loader={true} account={account} />
                <ActiveAds loader={loader} account={account} />
                {/* <FavoritesAds loader={loader} account={account} /> */}
                <Reactions loader={true} account={account} />
            </div>
        </div>
    )
}

export function Reactions({
    loader,
    account
}: RouteAccountProps) {
    const [ loaderReactions, setLoaderReactions ] = React.useState(true)
    const [ reactions, setReactions ] = React.useState([])

    React.useMemo(() => {
        setLoaderReactions(true)
    }, [])

    React.useEffect(() => {
        setLoaderReactions(true)
        if(!loader) load()
    }, [loader, ''])

    function load() {
        // API({
        //     url: '/defaultapi/product/list',
        //     data: {
        //         ownerID: account.id,
        //         pagination: { page: 1, limit: 3 }
        //     }
        // }).done(result => {
        //     if(result.statusCode === 200) {
        //         setProducts(result.message)
        //         setLoadsAds(false)
        //     }
        //     else notify("(accountPageIndex) /products/list: " + result.message, { debug: true })
        // })

        setReactions([])
        setLoaderReactions(false)
    }

    if(loader || !account)return
    return (
        <div className="block lastreactions">
            <h1 className="blocktitle">{Language("ACCOUNT_PAGEINDEX_REACTIONS_TITLE")}</h1>
            {(!loaderReactions && !reactions.length) ? (
                <div className="noelems transparent">
                    <h1>{Language("ACCOUNT_PAGEINDEX_REACTIONS_NO")}</h1>
                </div>
            ) : ''}
            {(loaderReactions || reactions.length) ? (
                <div className="list">
                    {loaderReactions ? (
                        <>
                            <ReactionCartLoaderDiv />
                            <ReactionCartLoaderDiv />
                            <ReactionCartLoaderDiv />
                            <ReactionCartLoaderDiv />
                        </>
                    ) : ''}

                    {/* {products.map((item, i) => {
                        if(loaderAds)return
                        return (<AdCart product={item} key={i} type={"vertical"} size={"min"} />)
                    })} */}

                    {/* {(account.productsActiveCount > 3 && !loaderAds) ? (
                        <Link to="/account/favorites" className="moreads">
                            <section>
                                <h1>{Language("ACCOUNT_PAGEINDEX_FAVORITESADS_MORE", null, {}, account.productsActiveCount - 3)}</h1>
                                <span>{Language("ACCOUNT_PAGEINDEX_FAVORITESADS_MORE_DESC")}</span>
                            </section>
                        </Link>
                    ) : ''} */}
                </div>
            ) : ''}
        </div>
    )
}
function FavoritesAds({
    loader,
    account
}: RouteAccountProps) {
    const [ loaderAds, setLoadsAds ] = React.useState(true)
    const [ products, setProducts ] = React.useState([])

    React.useMemo(() => {
        setLoadsAds(true)
    }, [])

    React.useEffect(() => {
        setLoadsAds(true)
        if(!loader) load()
    }, [loader, ''])

    function load() {
        API({
            url: '/defaultapi/user/favorites',
            type: "get"
        }).done(result => {
            if(result.statusCode === 200) {
                setProducts(result.message)
                setLoadsAds(false)
            }
            else notify("(accountPageIndex) /user/favorites: " + result.message, { debug: true })
        })

        setProducts([])
        setLoadsAds(false)
    }

    return (
        <div className="block favorites blockads">
            <h1 className="blocktitle">{Language("ACCOUNT_PAGEINDEX_FAVORITESADS_TITLE")}</h1>
            {(!loaderAds && !products.length) ? (
                <div className="noelems">
                    <h1>{Language("ACCOUNT_PAGEINDEX_FAVORITESADS_NO")}</h1>
                </div>
            ) : ''}
            {(loaderAds || products.length) ? (
                <div className="list">
                    {loaderAds ? (
                        <>
                            <AdCartLoaderDiv size={"min"} type={"vertical"} />
                            <AdCartLoaderDiv size={"min"} type={"vertical"} />
                            <AdCartLoaderDiv size={"min"} type={"vertical"} />
                            <AdCartLoaderDiv size={"min"} type={"vertical"} />
                        </>
                    ) : ''}
                    {products.map((item, i) => {
                        if(loaderAds)return
                        return (<AdCart product={item} key={i} type={"vertical"} size={"min"} onChangeFavorite={(status, products) => {
                            if(status === false) {
                                setProducts(old => {
                                    old.splice(i, 1)
                                    return [...old]
                                })
                            }
                        }} />)
                    })}

                    {(products.length > 3 && !loaderAds) ? (
                        <Link to="/account/favorites" className="moreads">
                            <section>
                                <h1>{Language("ACCOUNT_PAGEINDEX_FAVORITESADS_MORE", null, {}, products.length - 3)}</h1>
                                <span>{Language("ACCOUNT_PAGEINDEX_FAVORITESADS_MORE_DESC")}</span>
                            </section>
                        </Link>
                    ) : ''}
                </div>
            ) : ''}
        </div>
    )
}
export function ActiveAds({
    loader,
    account,

    profile
}: RouteAccountProps) {
    const [ loaderAds, setLoaderAds ] = React.useState(true)
    const [ products, setProducts ] = React.useState([])

    React.useMemo(() => {
        setLoaderAds(true)
    }, [])

    React.useEffect(() => {
        setLoaderAds(true)
        if(!loader) load()
    }, [loader, ''])

    function load() {
        API({
            url: '/defaultapi/product/list',
            type: 'get',
            data: {
                ownerID: account.id,
                pagination: { page: 1, limit: !profile ? 3 : 4 }
            }
        }).done(result => {
            if(result.statusCode === 200) {
                setProducts(result.message)
                setLoaderAds(false)
            }
            else notify("(accountPageIndex) /products/list: " + result.message, { debug: true })
        })
    }

    if(loader || !account)return
    return (
        <div className="block activeads blockads" style={{display: loader && !products.length ? 'none' : 'block'}}>
            <h1 className="blocktitle">{Language("ACCOUNT_PAGEINDEX_ACTIVEADS_TITLE")}</h1>
            {(!loaderAds && !products.length) ? (
                <div className="noelems actions">
                    <h1>{Language("ACCOUNT_PAGEINDEX_ACTIVEADS_NO")}</h1>
                    {!profile ? (
                        <div className="actionsblock">
                            <Link to="/placead" className="btn hover big">{Language("PLACEAD")}</Link>
                        </div>
                    ) : ''}
                </div>
            ) : ''}
            {(loaderAds || products.length) ? (
                <div className="list _routeAccountListAdCartResize_">
                    {loaderAds ? (
                        <>
                            <AdCartLoaderDiv size={"min"} type={"vertical"} />
                            <AdCartLoaderDiv size={"min"} type={"vertical"} />
                            <AdCartLoaderDiv size={"min"} type={"vertical"} />
                            <AdCartLoaderDiv size={"min"} type={"vertical"} />
                        </>
                    ) : ''}
                    {products.map((item, i) => {
                        if(loaderAds)return
                        return (<AdCart product={item} key={i} type={"vertical"} size={"min"} />)
                    })}

                    {(account.productsActiveCount > (!profile ? 3 : 4) && !loaderAds) ? (
                        <Link to={!profile ? "/account/ads" : window.location.pathname + '/ads'} className="moreads">
                            <section>
                                <h1>{Language("ACCOUNT_PAGEINDEX_ACTIVEADS_MORE", null, {}, account.productsActiveCount - (!profile ? 3 : 4))}</h1>
                                <span>{Language("ACCOUNT_PAGEINDEX_ACTIVEADS_MORE_DESC")}</span>
                            </section>
                        </Link>
                    ) : ''}
                </div>
            ) : ''}
        </div>
    )
}

export function AccountRecommendations({
    account,
    loader
}: RouteAccountProps) {
    const [ list, setList ] = React.useState([
        // { title: Language("ACCOUNT_RECOMMENDATIONS_NEWMESSAGE_TITLE"), text: Language("ACCOUNT_RECOMMENDATIONS_NEWMESSAGE_TEXT", null, { isjsx: true }) },
        // { title: Language("ACCOUNT_RECOMMENDATIONS_SECURITY_GOOGLEAUTH_TITLE"), text: Language("ACCOUNT_RECOMMENDATIONS_SECURITY_GOOGLEAUTH_TEXT", null, { isjsx: true }) },
    ])

    React.useEffect(() => {
        if(account && account.id) {
            if(account.banned && !list.find(item => item.id === 'banned')) {
                setList(old => {
                    return [{ id: "banned", addclass: 'banned', noclose: true, title: Language("ACCOUNT_RECOMMENDATIONS_BANNED_TITLE"), text: Language("ACCOUNT_RECOMMENDATIONS_BANNED_TEXT", null, { isjsx: true }) }, ...old]
                })
            }

            if(account.avatar.image === '/assets/avatars/default.png'
                && !list.find(item => item.id === 'noavatar')) {
                setList(old => {
                    return [...old, { id: "noavatar", title: Language("ACCOUNT_RECOMMENDATIONS_NOAVATAR_TITLE"), text: Language("ACCOUNT_RECOMMENDATIONS_NOAVATAR_TEXT", null, { isjsx: true }) }]
                })
            }
            if(account.phoneNumber === null
                && !list.find(item => item.id === 'nophonenumber')) {
                setList(old => {
                    return [...old, { id: "nophonenumber", title: Language("ACCOUNT_RECOMMENDATIONS_NOPHONENUMBER_TITLE"), text: Language("ACCOUNT_RECOMMENDATIONS_NOPHONENUMBER_TEXT", null, { isjsx: true }) }]
                })
            }
        }
    }, [account])

    if(loader || !account)return
    return (
        <>
            {list.length ? (
                <div className="block recommendations">
                    <div className="list">
                        {list.map((item, i) => {
                            return (
                                <div key={i} className={`elem ${item.addclass}`}>
                                    <section>
                                        <h1>{item.title}</h1>
                                        {!item.noclose ? (
                                            <div className="close" onClick={() => {
                                                setList(old => {
                                                    old.splice(i, 1)
                                                    return [...old]
                                                })
                                            }}>
                                                <IoClose />
                                            </div>
                                        ) : ''}
                                    </section>
                                    <span>{item.text}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            ) : ''}
        </>
    )
}