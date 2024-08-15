import UserNotificationsDTO, { UserNotificationsType } from "@dto/user.notifications.dto";
import { Language } from "@modules/Language";

import Moment from 'moment'
import 'moment/min/locales'

export function userNotificationsGenerateText(notification: UserNotificationsDTO): string {
    let text: string = 'undefined'
    Moment.locale(window.language)

    switch(notification.type) {
        case 'productModStatusProblem':
        case 'productDeleted':
        case 'productBanned': {
            text = Language(`NOTIFICATION_TYPE_${notification.type.toUpperCase()}_TEXT`, null, null, notification.attachedProduct?.prodID)
            break
        }
        case 'incomingdialogmessage': {
            text = Language("NOTIFICATION_TYPE_INCOMINGDIALOGMESSAGE_TEXT", null, null, notification.attachedUser.name[0] + notification.attachedUser.name[1])
            break
        }
        case 'reportClosed': {
            text = Language("NOTIFICATION_TYPE_REPORTCLOSED_TEXT", null, null, notification.attachedReport?.id)
            break
        }
        case 'reportOpened': {
            text = Language("NOTIFICATION_TYPE_REPORTOPENED_TEXT", null, null, notification.attachedReport?.id)
            break
        }
        case 'supportClosed': {
            text = Language("NOTIFICATION_TYPE_SUPPORTCLOSED_TEXT", null, null, notification.attachedSupport?.id)
            break
        }
        case 'supportOpened': {
            text = Language("NOTIFICATION_TYPE_SUPPORTOPENED_TEXT", null, null, notification.attachedSupport?.id)
            break
        }
        case 'accountBanned': {
            text = Language("NOTIFICATION_TYPE_ACCOUNTBANNED_TEXT", null, null, Moment(notification.attachedUser?.bannedExpires).toNow(), notification.attachedUser?.bannedComment)
            break
        }
        case 'accountReportBanned': {
            text = Language("NOTIFICATION_TYPE_ACCOUNTREPORTBANNED_TEXT", null, null, Moment(notification.attachedUser?.reportBannedExpires).toNow(), notification.attachedUser?.reportBannedComment)
            break
        }
        case 'accountWarn': {
            text = Language("NOTIFICATION_TYPE_ACCOUNTWARN_TEXT", null, null, notification.text)
            break
        }
        default: {
            text = Language(`NOTIFICATION_TYPE_${notification.type.toUpperCase()}_TEXT`, null, null)
            break
        }
    }

    return text
}