import React from 'react'

import Button from '@components/button'
import './index.scss'
import { Link, Navigate } from 'react-router-dom'

interface PhoneHeaderTitleProps {
    text: string,

    description?: string,

    links?: { name: React.JSX.Element | string, url?: string, onClick?: () => void }[],
    linksWrap?: boolean
    
    backButton?: React.JSX.Element | string,
    backButtonURL?: string,

    outBodyPadding?: boolean
}
export default function PhoneHeaderTitle({
    text,

    description,

    links,
    linksWrap,

    backButton,
    backButtonURL,

    outBodyPadding
}: PhoneHeaderTitleProps) {
    const [ navigate, setNavigate ] = React.useState(null)
    React.useEffect(() => { if(navigate !== null) setNavigate(null) }, [navigate])

    return (
        <div className={`_phoneHeaderTitle_ ${outBodyPadding && 'outBodyPadding'} ${linksWrap && '_phoneHeaderTitle__linkswrap'}`}>
            <div className="_phoneHeaderTitle_Wrap">
                {backButton ? (
                    <Button name={backButton} type={"transparent"} onClick={() => {
                        if(backButtonURL) setNavigate(backButtonURL)
                    }} />
                ) : ''}
                <section>
                    <h6>{text}</h6>
                    {description ? (<span>{description}</span>) : ''}
                </section>
            </div>

            {links ? (
                <div className={`_phoneHeaderTitle_Links`}>
                    {links.map((link, i) => {
                        if(!link.url)return (<span onClick={() => {
                            link.onClick?.()
                        }} className="_phoneHeaderTitle_Link">{link.name}</span>)
                        return (<Link to={link.url} className="_phoneHeaderTitle_Link">{link.name}</Link>)
                    })}
                </div>
            ) : ''}

            {navigate ? (<Navigate to={navigate} />) : ''}
        </div>
    )
}