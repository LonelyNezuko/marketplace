import React, { version } from 'react'

import Moment from 'moment'
import 'moment/min/locales'

import './index.scss'

import { MdFilterList } from "react-icons/md";
import Input from '@components/input';
import { Language } from '@modules/Language';
import { Link, useLocation, useParams } from 'react-router-dom';

import CONFIG from '@config'

import { API } from '@modules/API'
import { notify } from '@modules/Notify'
import { ContentUpdatesCreate } from './create'
import { CircleLoader } from '@components/circleLoader/circleLoader'
import { formatText } from '@functions/formatText'
import Username from '@components/username'
import { RouteErrorCode, RouteErrorCodeProps } from '@routes/errorcodes'
import ContentUpdatesEdit from './edit'
import Button from '@components/button';
import DotsLoader from '@components/dotsloader';
import SetRouteTitle from '@modules/SetRouteTitle';

export default function RouteContentUpdates() {
    SetRouteTitle(Language("ADMIN_ROUTE_TITLE_CONTENT_UPDATES"))
    Moment.locale(window.language)
    
    const params = useParams()

    const location = useLocation()
    const [ prevLocation, setPrevLocation ] = React.useState('/')

    const [ errorPage, setErrorPage ] = React.useState<RouteErrorCodeProps>({ code: 0, text: '', showbtn: false })

    const [ newPanel, setNewPanel ] = React.useState(false)
    const [ editPanel, setEditPanel ] = React.useState(false)

    const [ loader, setLoader ] = React.useState(false)
    const [ updates, setUpdates ] = React.useState([])

    React.useEffect(() => {
        setNewPanel(false)
        setEditPanel(false)

        const id: number = parseInt(params.id)
        
        if(params.id === 'new') setNewPanel(true)
        if(id && !isNaN(id) && id >= 1) setEditPanel(true)

        if(prevLocation !== '/content/updates') {
            setLoader(true)
            API({
                url: '/defaultapi/updates/',
                type: 'get'
            }).done(result => {
                if(result.statusCode === 200) {
                    setLoader(false)
                    setUpdates(result.message)
                }
                else {
                    setNewPanel(false)
                    setEditPanel(false)

                    notify('(content updates) /updates: ' + result.message, { debug: true })
                    setErrorPage({ code: result.statusCode, text: result.message })
                }
            })
        }
    }, [params])
    React.useEffect(() => {
        setPrevLocation(location.pathname)
    }, [location])

    function onSearch(text) {
        // if(!text.length) $('#routeContentUpdates .body .list .updateWildCard').show()
        // else {
        //     updates.map(item => {
        //         const element = $(`#routeContentUpdates .body .list .updateWildCard[data-id="${item.id}"]`)
        //         if(item.name.indexOf(text) !== -1
        //             || item.body.substring(0, 145).replace(/<\/?[^>]+(>|$)/g, "").indexOf(text) !== -1
        //             || item.version.indexOf(text) !== -1 || ("v" + item.version.indexOf(text)) !== -1) {
        //             element.hide()
        //         }
        //         else element.show()
        //     })
        // }
    }

    if(errorPage.code !== 0)return (
        <RouteErrorCode style={{marginTop: "128px"}} code={errorPage.code} text={errorPage.text}
            showbtn={errorPage.showbtn} btnurl={errorPage.btnurl} btnname={errorPage.btnname}
            icon={errorPage.icon} />
    )
    if(loader)return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '84px 0' }}>
            <DotsLoader size={"medium"} color={"colorful"} />
        </div>
    )
    return (
        <div className="route" id="routeContentUpdates">
            {newPanel ? (<ContentUpdatesCreate />) : null}
            {editPanel ? (<ContentUpdatesEdit />) : null}

            <header className="header">
                <h1 className="routetitle">{Language("UPDATES")}</h1>
                <div className="rightblock">
                    <Button icon={(<MdFilterList />)} classname='filters' />
                    <Input id="routeContentUpdates_Search" type={"text"} data={{placeholder: Language("SEARCH")}} deleteLabel={true}
                        onInput={event => onSearch((event.target as HTMLInputElement).value)}
                    />
                    <Link to="/content/updates/new">
                        <Button name={!updates.length ? Language("ADMIN_CONTENT_UPDATES_NEW_UPDATE_BTN") : Language("ADMIN_CONTENT_UPDATES_UPDATE_BTN")} size={"medium"} />
                    </Link>
                </div>
            </header>

            <div className="body">
                <div className="list">
                    {updates.map((item, i) => {
                        return (
                            <Link to={`/content/updates/${item.id}`} className="updateWildCard elem" data-id={item.id}>
                                <div className="preview">
                                    <div className={`where ${item.where}`}>
                                        {item.where ? Language("ADMIN_CONTENT_UPDATES_WHERE_NAME_" + item.where.toUpperCase())
                                        : 'Неизвестно'}
                                    </div>
                                    <img src={item.background} />
                                </div>
                                <div className="title">
                                    <h1>{item.name}</h1>
                                    <span className="version">v{item.version}</span>
                                </div>
                                <div className="description">
                                    {formatText(item.body.replace(/<\/?[^>]+(>|$)/g, ""), 145)}
                                </div>
                                <div className="otherinfo">
                                    <span className="createat">{Moment(item.createAt).format('DD.MM.YYYY')}</span>
                                    <Link target='_blank' to={CONFIG.moderationPanelLink + '/users/' + item.creator.id} className='creator link'>
                                        <Username account={item.creator} />
                                    </Link>
                                </div>
                            </Link>
                        )
                    })}

                    {!updates.length ? (
                        <div className="nothing">
                            <h1>{Language("UPDATES_NOT_FOUND")}</h1>
                            <Link to="/content/updates/new">
                                <Button name={Language("ADMIN_CONTENT_UPDATES_NEW_UPDATE_BTN")} size={"medium"} />
                            </Link>
                        </div>
                    ) : ''}
                </div>
            </div>
        </div>
    )
}