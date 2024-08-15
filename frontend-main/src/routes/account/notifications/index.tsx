import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import HTMLParser from 'html-react-parser'
import $ from 'jquery'

import Moment from 'moment'
import 'moment/min/locales'

import './index.scss'

import { Language } from '@modules/Language'
import { RouteAccountProps } from '..'
import SetRouteTitle from '@modules/SetRouteTitle'
import PhoneHeaderTitle from '@components/phoneHeaderTitle'
import UserNotificationsDTO from '@dto/user.notifications.dto'
import DotsLoader from '@components/dotsloader'
import { API } from '@modules/API'
import { APIResult } from '@modules/API/index.dto'
import { notify } from '@modules/Notify'
import { Avatar } from '@components/avatar/avatar'
import { IoCheckmarkSharp } from 'react-icons/io5'
import { IoMdCheckmark } from 'react-icons/io'
import { formatImage } from '@modules/functions/formatImage'
import { formatText } from '@modules/functions/formatText'
import AdCart from '@components/adcart'
import UserCart from '@components/usercart'
import floatToInt from '@modules/functions/floatToInt'
import { Modal } from '@components/modals'
import { Alert } from '@components/alert'
import { userNotificationFormatText } from '@modules/functions/userNotificationFormatText'
import { userNotificationsGenerateAvatar } from '@modules/functions/userNotificationsGenerateAvatar'
import { userNotificationsGenerateText } from '@modules/functions/userNotificationsGenerateText'
import Gateway from '@modules/Gateway'
import ReportCart from '@components/reportcart'

export default function RouteAccountNotifications({
    loader,
    account,

    setNavigate,
    setLoaderModal
}: RouteAccountProps) {
    Moment.locale(window.language)
    SetRouteTitle(Language("ROUTE_TITLE_ACCOUNT_NOTIFICATIONS"))

    const location = useLocation()

    const notificationsPageRef = React.useRef(null)
    const [ loaderNotify, setLoaderNotify ] = React.useState(true)
    
    const [ notifications, setNotifications ] = React.useState<UserNotificationsDTO[]>([])
    const [ notificationsLoadedPage, setNotificationsLoadedPage ] = React.useState(1)
    const [ lastNotification, setLastNotification ] = React.useState(false)

    const [ clearModal, setClearModal ] = React.useState(false)
    const [ allNotificationsCount, setAllNotificationsCount ] = React.useState(0)

    function loadNotifications() {
        const notIDS: number[] = notifications.map(notf => {
            return notf.id
        })

        setLoaderNotify(true)
        API({
            url: '/defaultapi/user/notifications/list',
            type: 'get',
            data: {
                pagination: { page: notificationsLoadedPage, limit: 10 },
                notIDS
            }
        }).done((result: APIResult) => {
            if(result.statusCode === 200) {
                setNotifications(old => {
                    return [...old, ...result.message.list]
                })
                setLoaderNotify(false)

                if(result.message.list < 10) setLastNotification(true)
            }
            else {
                notify("(account.notifications) /user/notifications/list: " + result.message, { debug: true })
            }
        })
    }
    function onClearNotifications() {
        if(loader || loaderNotify || !notifications.length || !allNotificationsCount)return

        setLoaderModal({
            toggle: true,
            text: "Очищаем уведомления..."
        })
        setClearModal(false)

        API({
            url: '/defaultapi/user/notifications/clear',
            type: 'delete'
        }).done((result: APIResult) => {
            setLoaderModal({ toggle: false, text: null })

            if(result.statusCode === 200) {
                Alert("Уведомления были очищены", "success")
                setNotifications([])
            }
            else notify("(account.notifications) /user/notifications/clear: " + result.message, { debug: true })
        })
    }

    React.useMemo(() => {
        setNotificationsLoadedPage(1)
        loadNotifications()

        API({
            url: '/defaultapi/user/notifications/allcount',
            type: 'get'
        }).done((result: APIResult) => {
            if(result.statusCode === 200) {
                setAllNotificationsCount(result.message)
            }
            else notify("(account.notifications) user/notifications/allcount: " + result.message, { debug: true })
        })

        Gateway.on('user', 'onNotificationsSend', (notification: UserNotificationsDTO) => {
            setNotifications(old => {
                old.push(notification)
                old = old.sort((a, b) => +new Date(b.viewAt) - +new Date(a.viewAt))

                return [...old]
            })
        })
    }, [])
    React.useEffect(() => {
        function onScrollBody(event) {
            if(!notificationsPageRef.current || !notifications.length || notifications.length < 10 || loader || loaderNotify)return

            let nthchild = notifications.length - (10 / 2)
            if(nthchild < 0 || isNaN(nthchild)) nthchild = floatToInt(notifications.length / 2)

            const pageElement = $(notificationsPageRef.current)
            const containerElement = pageElement.find(`.notifycart:nth-child(${nthchild})`)

            const containerOffsetTop = containerElement.offset().top

            if(containerOffsetTop < 100) {
                if(!lastNotification) setNotificationsLoadedPage(old => old + 1)
                else setNotificationsLoadedPage(1)

                loadNotifications()
            }
        }

        const body = document.getElementById('body')
        if(body) body.addEventListener('scroll', onScrollBody)

        return () => {
            if(body) body.removeEventListener('scroll', onScrollBody)
        }
    }, ['', notifications, loader, loaderNotify])
    React.useEffect(() => {
        if(notifications.length) {
            const notfReadList: number[] = []

            notifications.map(notf => {
                if(!notf.isRead) notfReadList.push(notf.id)
            })

            if(notfReadList.length) {
                API({
                    url: "/defaultapi/user/notifications/read",
                    type: 'post',
                    data: {
                        notfIDList: notfReadList
                    }
                }).done((result: APIResult) => {
                    if(result.statusCode === 200) {
                        setNotifications(old => {
                            old.map(notf => {
                                if(result.message.indexOf(notf.id) !== -1) {
                                    notf.isRead = true
                                    notf.isNew = true
                                }
                            })
                            return [...old]
                        })
                    }
                    else notify("(account.notifications) user/notifications/read: " + result.message, { debug: true })
                })
            }
        }
    }, [notifications])
    React.useEffect(() => {
        if(location.hash.indexOf('#clear') !== -1) setClearModal(true)
        else setClearModal(false)
    }, [location])

    if(loader || !account)return
    return (
        <div className="route" id="accountPageNotifications" ref={notificationsPageRef}>
            {clearModal ? (
                <Modal toggle={true} title={"Очистка уведомлений"}
                    body={`Вы действительно желаете очистить все ${allNotificationsCount} уведомлений?\nДействие нельзя будет отменить и/или восстановить удаленные уведомления`}

                    buttons={[ Language("NO"), Language("YES") ]}

                    onClick={onClearNotifications}
                    onClose={() => {
                        setNavigate('/account/notifications')
                    }}

                    modalBodyOverflow={"visible"}
                />
            ) : ''}

            <div className="accountPageBody">
                {window.isPhone ? (
                    <PhoneHeaderTitle text={Language("HEADER_ACCOUNT_MENU_ITEM_NOTIFICATIONS")} outBodyPadding={true}
                        links={[
                            { url: '/account/settings/notifications', name: Language("SETTINGS") },
                            { url: '#clear', name: Language("CLEAR") },
                        ]}
                    />
                ) : (
                    <header className="accountPageHeaderFlex">
                        <div className="blocktitle">
                            <h1>{Language("HEADER_ACCOUNT_MENU_ITEM_NOTIFICATIONS")}</h1>
                        </div>
                        <section>
                            <Link to="/account/settings/notifications">Настройки</Link>
                            <Link to="#clear">Очистить</Link>
                        </section>
                    </header>
                )}

                {!notifications.length ? (
                    <div className="nohtingElements">
                        <img src="/assets/errorcodes/nothing.png" />
                        <h5>{Language("ACCOUNT_NOTIFICATIONS_NOTHING")}</h5>
                        <span>{Language("ACCOUNT_NOTIFICATIONS_NOTHING_DESC")}</span>
                    </div>
                ) : (
                    <div className="list notificationsList">
                        {notifications.map((notf, i) => {
                            return (<NotifyCard notify={notf} key={i} />)
                        })}
                    </div>
                )}

                {loaderNotify ? (
                    <div style={{ width: '100%', padding: '32px 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <DotsLoader color={"colorful"} />
                    </div>
                ) : ''}
            </div>
        </div>
    )
}


interface NotifyCardProps {
    notify: UserNotificationsDTO
}
function NotifyCard({
    notify
}: NotifyCardProps) {
    console.log(notify)
    return (
        <div className="notifycart">
            <div className="previewAvatar">
                <Avatar image={notify.type === 'system' ? notify.previewAvatar : userNotificationsGenerateAvatar(notify)} size={100} position={{ x: 0, y: 0 }} circle={true} sizeImage={360} type={"medium"} />
            </div>
            <div className="info">
                <div className="text">
                    <span className='textbody'>{HTMLParser(notify.type === 'system' ? userNotificationFormatText(notify.text) : userNotificationsGenerateText(notify))}</span>
                    <div className="readstatus">
                        <span className="date">{Moment(notify.viewAt).calendar()}</span>
                        {!notify.isRead || notify.isNew ? (
                            <div className={`unreadstatus`}></div>
                        ) : ''}
                    </div>
                </div>

                {notify.attachedProduct || notify.attachedUser || notify.attachedReport ? (
                    <div className="attachedItems">
                        {notify.attachedProduct ? (
                            <AdCart product={notify.attachedProduct} size={"min"} type={"horizontal"} />
                        ) : ''}
                        {notify.attachedUser ? (
                            <UserCart account={notify.attachedUser} type={"mini"} />
                        ) : ''}
                        {notify.attachedReport ? (
                            <ReportCart report={notify.attachedReport} />
                        ) : ''}

                        {/* <div className="attachedImages">
                            <div className="attachedImagesList">
                                <div className="image">
                                    <img src={formatImage("http://localhost:7000/defaultapi/service/storage/py86c7f9076s502q7409daf5x0hzz0i5dui828806851m4n6b18a17u611c5h0p7?size=360", 360)} />
                                </div>
                            </div>
                        </div> */}
                    </div>
                ) : ''}
            </div>
        </div>
    )
}