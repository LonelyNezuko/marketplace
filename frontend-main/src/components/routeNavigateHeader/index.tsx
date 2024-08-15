import React from 'react'

import './index.scss'
import { Link } from 'react-router-dom'

export interface RouteNavigateHeaderLinks {
    link: string,
    name: string,

    classes?: string,
    style?: React.CSSProperties,

    bold?: boolean
}

export default function RouteNavigateHeader({ linkList }: { linkList: Array<RouteNavigateHeaderLinks> }) {
    const [ links, setLinks ] = React.useState<Array<RouteNavigateHeaderLinks>>(linkList)
    React.useEffect(() => { setLinks(linkList) }, [ linkList ])

    return (
        <div className="routeNavigateHeader">
            {links.map((item: RouteNavigateHeaderLinks, i) => {
                return (<Link key={i} className={`routeNavigateHeader_link ${item.classes} ${item.bold && 'bold'}`} to={item.link} style={item.style}>{item.name}</Link>)
            })}
        </div>
    )
}

export function RouteNavigateHeaderLoader({
    count = 5
}: { count?: number }) {
    return (
        <div className="routeNavigateHeader loader">
            {new Array(count).fill(0).map((item, i) => {
                return (
                    <Link key={i} to="" className="routeNavigateHeader_link">
                        <div className="_loaderdiv" style={{ width: "80px", height: "20px", borderRadius: "4px" }}></div>
                    </Link>
                )
            })}
        </div>
    )
}