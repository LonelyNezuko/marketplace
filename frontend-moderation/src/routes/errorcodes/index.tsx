import React from 'react'
import { Link, Navigate } from 'react-router-dom'

import './index.scss'

import { Language } from '../../modules/Language'
import SetRouteTitle from '@modules/SetRouteTitle'
import Button from '@components/button'

export interface RouteErrorCodeProps {
    code: number,
    type?: 'center',

    title?: string,

    text?: string,
    fixed?: boolean,

    size?: 'medium',
    style?: React.CSSProperties,
    
    showbtn?: boolean,
    btnurl?: string,
    btnname?: React.JSX.Element | string,

    icon?:  string,
    iconsize?: string,
    
    classes?: string
}
export function RouteErrorCode({
    code = 504,
    type,

    title,

    text,
    fixed = false,

    size,
    style,
    
    showbtn = true,
    btnurl,
    btnname,

    icon,
    iconsize,

    classes
}: RouteErrorCodeProps) {
    let btnnavigate = false

    if(code === 504
        && !icon) icon = `/assets/errorcodes/${code}.png`
    if(code === 500
        && !icon) icon = `/assets/errorcodes/${code}.png`
    if(code === 403
        && !icon) icon = `/assets/errorcodes/${code}.png`
    if(code === 401
        && !icon) icon = `/assets/errorcodes/${code}.png`
    if(code === 1024
        && !icon) icon = `/assets/errorcodes/${code}.png`

    if(code === 404
        && !text) text = Language("404PAGE_TEXT")
    if(code === 504
        && !text) text = Language("504PAGE_TEXT")
    if(code === 500
        && !text) text = Language("500PAGE_TEXT")
    if(code === 403
        && !text) text = Language("403PAGE_TEXT")
    if(code === 400
        && !text) text = Language("400PAGE_TEXT")
    if(code === 401
        && !text) text = Language("401PAGE_TEXT")
    
    if(code === 1024
        && !text) text = "Oops, something went wrong. Refresh the page later"

    if((code === 404 || code === 403)
        && !btnname) btnname = Language("404PAGE_BTN")
    if((code === 504 || code === 400 || code === 500 || code === 1024)
        && !btnname) btnname = Language("REFRESH")
    if((code === 401)
        && !btnname) btnname = Language("AUTH")

    if((code === 404 || code === 403)
        && !btnurl) btnurl = '/'
    if((code === 504 || code === 400 || code === 500 || code === 1024)
        && !btnurl) btnurl = window.location.pathname
    if((code === 401)
        && !btnurl) {
        btnurl = '#signin'
        btnnavigate = true
    }
    
    const [ navigate, setNavigate ] = React.useState(null)
    React.useEffect(() => { if(navigate !== null) setNavigate(null) }, [navigate])

    const [ _text, _setText ] = React.useState(text)
    const [ _btnname, _setBtnName ] = React.useState(btnname)

    React.useEffect(() => _setText(text), [text])
    React.useEffect(() => _setBtnName(btnname), [btnname])

    // React.useEffect(() => {
    //     if(code === 404
    //         && !text) _setText(Language("404PAGE_TEXT"))
    // }, [code])

    SetRouteTitle(title || Language('ERROR', 'ошибка') + " " + code)
    return (
        <div className={`route pageErrorCode ${fixed && 'fixed'} ${size} ${type} ${classes}`} style={style || {}}>
            <div className="wrap">
                <div className="desc">
                    <h1 className="title">
                        {title || Language('ERROR', 'ошибка') + " " + code}
                    </h1>
                    <span className="text">{text}</span>
                    {showbtn ? (
                        <Button name={btnname} size={size === 'medium' ? 'medium' : 'big'} onClick={() => {
                            if(btnnavigate) setNavigate(btnurl)
                            else window.location.href = btnurl
                        }} />
                    ) : ''}
                </div>
                <div className="icon">
                    {icon ? (<img style={iconsize ? {height: iconsize, width: iconsize} : {}} src={icon} />) : (<img style={iconsize ? {height: iconsize, width: iconsize} : {}} src={`/assets/errorcodes/default.png`} />)}
                </div>
            </div>

            {navigate ? (<Navigate to={navigate} />) : ''}
        </div>
    )
}