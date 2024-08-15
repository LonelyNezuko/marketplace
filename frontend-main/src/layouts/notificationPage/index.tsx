import React from 'react'
import useSound from 'use-sound'

import './index.scss'
import { Avatar } from '@components/avatar/avatar'
import { formatText } from '@modules/functions/formatText'
import { Language } from '@modules/Language'
import UserNotificationsDTO from '@dto/user.notifications.dto'
import Gateway from '@modules/Gateway'
import { Link, useLocation } from 'react-router-dom'
import { userNotificationsGenerateAvatar } from '@modules/functions/userNotificationsGenerateAvatar'
import { userNotificationFormatText } from '@modules/functions/userNotificationFormatText'
import { userNotificationsGenerateText } from '@modules/functions/userNotificationsGenerateText'
import Button from '@components/button'
import { IoClose } from 'react-icons/io5'
import { UserNotifySettings } from '@dto/user.dto'
import HTMLReactParser from 'html-react-parser'

// import notificationSound from '../../../public/assets/other/notificationSound.mp3'

export default function NotificationPage() {
    const location = useLocation()

    const [ notifications, setNotifications ] = React.useState<UserNotificationsDTO[]>([])
    // const [ playSound ] = useSound(notificationSound)

    function onNotificationIncoming(notification: UserNotificationsDTO, userNotifySettings: UserNotifySettings) {
        if(userNotifySettings
            && !userNotifySettings.showOnSite)return

        const currentLocation = window.location
        
        if(notification.type === 'incomingdialogmessage'
            && currentLocation.pathname.indexOf('/account/messages') !== -1)return

        setNotifications(old => {
            old.push(notification)
            old = old.sort((a, b) => +new Date(b.viewAt) - +new Date(a.viewAt))

            return [...old]
        })

        // if(userNotifySettings.soundNotify) playSound()
    }

    React.useMemo(() => {
        Gateway.on('user', 'onNotificationsSend', onNotificationIncoming)
        Gateway.on('user', 'onNotificationsSend_page', onNotificationIncoming)
    }, [])
    React.useEffect(() => {
        if(location.pathname.indexOf('/account/notifications') !== -1) setNotifications([])
    }, [location])

    return (
        <div id="notificationPage">
            {notifications.map((notf, i) => {
                return (
                    <div className="elem" key={i} onClick={() => {
                        setNotifications(old => {
                            old = old.filter(item => item.id !== notf.id)
                            return [...old]
                        })
                    }}>
                        <Link to={notf.link || "/account/notifications"} className="previewAvatar">
                            <Avatar image={notf.type === 'system' ? notf.previewAvatar : userNotificationsGenerateAvatar(notf)} sizeImage={360} circle={true} size={100} position={{ x: 0, y: 0 }} type={"medium"} />
                        </Link>
                        <Link to={notf.link || "/account/notifications"} className="info">
                            <span className="title">{Language("NOTIFICATION")}</span>
                            <span className="text">{HTMLReactParser(notf.type === 'system' ? userNotificationFormatText(notf.text) : userNotificationsGenerateText(notf))}</span>
                        </Link>

                        <Button classname='close' icon={<IoClose />} type={"transparent"} size={"min"} />
                    </div>
                )
            })}
        </div>
    )
}